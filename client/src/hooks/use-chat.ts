import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { JobMessage, MessageReadReceipt } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage extends JobMessage {
  content?: string;
  senderRole?: string;
  senderName?: string;
  readReceipts?: MessageReadReceipt[];
  isDelivered?: boolean;
  isPending?: boolean;
  tempId?: string;
  error?: string;
}

interface TypingIndicator {
  userId: string;
  userName?: string;
  timestamp: number;
}

interface OnlineUser {
  userId: string;
  userName?: string;
  avatar?: string;
  lastSeen: number;
}

interface ChatRoom {
  jobId: string;
  participants: OnlineUser[];
  typingUsers: Map<string, TypingIndicator>;
}

interface UseChatOptions {
  jobId: string;
  userId: string;
  userName?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  typingIndicatorTimeout?: number;
  messagePageSize?: number;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  isReconnecting: boolean;
  typingUsers: TypingIndicator[];
  onlineUsers: OnlineUser[];
  unreadCount: number;
  sendMessage: (content: string, replyToId?: string, attachmentUrl?: string, attachmentType?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  sendTypingIndicator: () => void;
  markMessagesAsRead: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  connectionError: string | null;
}

const TYPING_INDICATOR_TIMEOUT = 3000; // 3 seconds
const RECONNECT_MAX_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000; // 1 second
const MESSAGE_PAGE_SIZE = 50;
const MESSAGE_CACHE_KEY = 'chat_messages_cache';
const OFFLINE_QUEUE_KEY = 'chat_offline_queue';

export function useChat(options: UseChatOptions): UseChatReturn {
  const {
    jobId,
    userId,
    userName = 'User',
    reconnectAttempts = RECONNECT_MAX_ATTEMPTS,
    reconnectDelay = RECONNECT_BASE_DELAY,
    typingIndicatorTimeout = TYPING_INDICATOR_TIMEOUT,
    messagePageSize = MESSAGE_PAGE_SIZE
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectCountRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messageQueueRef = useRef<Map<string, ChatMessage>>(new Map());
  const lastMessageIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load cached messages from localStorage
  useEffect(() => {
    const cachedMessages = localStorage.getItem(`${MESSAGE_CACHE_KEY}_${jobId}`);
    if (cachedMessages) {
      try {
        const parsed = JSON.parse(cachedMessages);
        setMessages(parsed);
        if (parsed.length > 0) {
          lastMessageIdRef.current = parsed[0].id;
        }
      } catch (error) {
        console.error('Failed to parse cached messages:', error);
      }
    }
  }, [jobId]);

  // Save messages to localStorage for offline support
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`${MESSAGE_CACHE_KEY}_${jobId}`, JSON.stringify(messages));
    }
  }, [messages, jobId]);

  // Load offline queue
  const getOfflineQueue = useCallback((): ChatMessage[] => {
    const queueStr = localStorage.getItem(`${OFFLINE_QUEUE_KEY}_${jobId}`);
    if (queueStr) {
      try {
        return JSON.parse(queueStr);
      } catch {
        return [];
      }
    }
    return [];
  }, [jobId]);

  const saveOfflineQueue = useCallback((queue: ChatMessage[]) => {
    localStorage.setItem(`${OFFLINE_QUEUE_KEY}_${jobId}`, JSON.stringify(queue));
  }, [jobId]);

  // Query for unread count
  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: [`/api/jobs/${jobId}/messages/unread`],
    refetchInterval: isConnected ? 30000 : false, // Refresh every 30s when connected
    enabled: !!jobId,
    queryFn: () => apiRequest(`/api/jobs/${jobId}/messages/unread`),
  });

  const unreadCount = unreadData?.unreadCount || 0;

  // Query for initial messages
  const { data: initialMessages, isLoading: isLoadingInitial } = useQuery<{ messages: ChatMessage[]; hasMore: boolean }>({
    queryKey: [`/api/jobs/${jobId}/messages/history`, { limit: messagePageSize }],
    enabled: !!jobId,
    queryFn: () => apiRequest(`/api/jobs/${jobId}/messages/history?limit=${messagePageSize}`),
  });

  useEffect(() => {
    if (initialMessages?.messages && !isLoadingInitial) {
      setMessages(initialMessages.messages);
      setHasMoreMessages(initialMessages.hasMore || false);
      if (initialMessages.messages.length > 0) {
        lastMessageIdRef.current = initialMessages.messages[0].id;
      }
    }
  }, [initialMessages, isLoadingInitial]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsReconnecting(reconnectCountRef.current > 0);
    setConnectionError(null);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Chat WebSocket connected');
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
      reconnectCountRef.current = 0;

      // Join chat room
      ws.send(JSON.stringify({
        type: 'JOIN_CHAT',
        jobId,
        userId,
        userName
      }));

      // Send any offline messages
      const offlineQueue = getOfflineQueue();
      offlineQueue.forEach(msg => {
        ws.send(JSON.stringify({
          type: 'SEND_MESSAGE',
          jobId,
          content: msg.content ?? msg.message,
          replyToId: msg.replyToId,
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          tempId: msg.tempId
        }));
      });
      saveOfflineQueue([]);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
      setConnectionError('Connection error occurred');
    };

    ws.onclose = () => {
      console.log('Chat WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // Attempt reconnection
      if (reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current++;
        const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current - 1);
        
        console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectCountRef.current}/${reconnectAttempts})`);
        setIsReconnecting(true);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else {
        setConnectionError('Failed to connect. Please refresh the page.');
        setIsReconnecting(false);
      }
    };
  }, [jobId, userId, userName, reconnectAttempts, reconnectDelay, getOfflineQueue, saveOfflineQueue]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'MESSAGE_RECEIVED':
        // Add new message
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.message.id || m.tempId === data.tempId);
          if (exists) {
            // Update existing message (delivery confirmation)
            return prev.map(m => {
              if (m.tempId === data.tempId) {
                // Replace temp message with real message
                return { ...data.message, isDelivered: true };
              }
              if (m.id === data.message.id) {
                return { ...data.message, isDelivered: true };
              }
              return m;
            });
          }
          // Add new message
          return [{ ...data.message, isDelivered: true }, ...prev];
        });
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/messages`] });
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/messages/unread`] });
        break;

      case 'MESSAGE_EDITED':
        setMessages(prev =>
          prev.map((m) => {
            if (m.id !== data.messageId) return m;
            const editedAt = data.editedAt ? new Date(data.editedAt) : new Date();
            return {
              ...m,
              content: data.content,
              message: data.content,
              isEdited: true,
              editedAt,
            };
          }),
        );
        break;

      case 'MESSAGE_DELETED':
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
        break;

      case 'TYPING_START':
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.set(data.userId, {
            userId: data.userId,
            userName: data.userName,
            timestamp: Date.now()
          });
          return next;
        });
        
        // Auto-remove typing indicator after timeout
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Map(prev);
            const indicator = next.get(data.userId);
            if (indicator && Date.now() - indicator.timestamp >= typingIndicatorTimeout) {
              next.delete(data.userId);
            }
            return next;
          });
        }, typingIndicatorTimeout);
        break;

      case 'TYPING_STOP':
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
        break;

      case 'READ_RECEIPT':
        setMessages(prev => prev.map(m => {
          if (m.id === data.messageId) {
            const receipts = m.readReceipts || [];
            const exists = receipts.some(r => r.userId === data.userId);
            if (!exists) {
              const readTimestamp = data.readAt ? new Date(data.readAt) : new Date();
              return {
                ...m,
                readReceipts: [
                  ...receipts,
                  {
                    id: data.receiptId,
                    messageId: data.messageId,
                    userId: data.userId,
                    readAt: readTimestamp,
                    createdAt: readTimestamp,
                  },
                ],
              };
            }
          }
          return m;
        }));
        break;

      case 'USER_JOINED':
        setOnlineUsers(prev => {
          const exists = prev.some(u => u.userId === data.userId);
          if (!exists) {
            return [...prev, {
              userId: data.userId,
              userName: data.userName,
              avatar: data.avatar,
              lastSeen: Date.now()
            }];
          }
          return prev;
        });
        break;

      case 'USER_LEFT':
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
        break;

      case 'ROOM_STATE':
        // Update room state when joining
        if (data.participants) {
          type ParticipantPayload = {
            userId: string;
            userName?: string;
            avatar?: string;
          };
          setOnlineUsers(
            (data.participants as ParticipantPayload[]).map((participant) => ({
              userId: participant.userId,
              userName: participant.userName,
              avatar: participant.avatar,
              lastSeen: Date.now(),
            })),
          );
        }
        break;

      case 'REACTION_ADDED':
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === data.messageId) {
              const reactions = (m.reactions as Record<string, string[]> | undefined) ?? {};
              const emojiKey = String(data.emoji);
              const emojiReactions = reactions[emojiKey] || [];
              if (!emojiReactions.includes(data.userId)) {
                return {
                  ...m,
                  reactions: {
                    ...reactions,
                    [emojiKey]: [...emojiReactions, data.userId],
                  },
                };
              }
            }
            return m;
          }),
        );
        break;

      case 'REACTION_REMOVED':
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === data.messageId) {
              const reactions = (m.reactions as Record<string, string[]> | undefined) ?? {};
              const emojiKey = String(data.emoji);
              const emojiReactions = (reactions[emojiKey] || []).filter(
                (reactionUserId: string) => reactionUserId !== data.userId,
              );
              if (emojiReactions.length === 0) {
                const { [emojiKey]: _removed, ...rest } = reactions;
                return { ...m, reactions: rest };
              }
              return {
                ...m,
                reactions: {
                  ...reactions,
                  [emojiKey]: emojiReactions,
                },
              };
            }
            return m;
          }),
        );
        break;

      case 'ERROR':
        console.error('Chat error:', data.message);
        if (data.tempId) {
          // Mark message as failed
          setMessages(prev => prev.map(m => 
            m.tempId === data.tempId ? { ...m, isPending: false, error: data.message } : m
          ));
        }
        toast({
          title: 'Chat Error',
          description: data.message,
          variant: 'destructive'
        });
        break;
    }
  }, [jobId, typingIndicatorTimeout, queryClient, toast]);

  // Send message
  const sendMessage = useCallback(async (
    content: string, 
    replyToId?: string,
    attachmentUrl?: string,
    attachmentType?: string
  ) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      tempId,
      jobId,
      senderId: userId,
      senderRole: 'customer', // Will be updated by server
      content,
      message: content,
      replyToId: replyToId || null,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
      reactions: {},
      isEdited: false,
      editedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      isSystemMessage: false,
      isDeleted: false,
      readAt: null,
      isPending: true,
      isDelivered: false
    };

    // Add to local messages immediately
    setMessages(prev => [tempMessage, ...prev]);
    messageQueueRef.current.set(tempId, tempMessage);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'SEND_MESSAGE',
        jobId,
        content,
        replyToId,
        attachmentUrl,
        attachmentType,
        tempId
      }));
    } else {
      // Save to offline queue
      const offlineQueue = getOfflineQueue();
      saveOfflineQueue([...offlineQueue, tempMessage]);
      
      // Attempt to reconnect
      connectWebSocket();
    }
  }, [jobId, userId, getOfflineQueue, saveOfflineQueue, connectWebSocket]);

  // Edit message
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, newContent }: { messageId: string; newContent: string }) => {
      return apiRequest('/api/messages/' + messageId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
    },
    onSuccess: (data, variables) => {
      // Send via WebSocket for real-time update
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'EDIT_MESSAGE',
          jobId,
          messageId: variables.messageId,
          content: variables.newContent
        }));
      }
      
      // Update local state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === variables.messageId
              ? {
                  ...m,
                  content: variables.newContent,
                  message: variables.newContent,
                  isEdited: true,
                  editedAt: new Date(),
                }
              : m,
          ),
        );
      
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/messages`] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive'
      });
    }
  });

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    await editMessageMutation.mutateAsync({ messageId, newContent });
  }, [editMessageMutation]);

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest('/api/messages/' + messageId, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, messageId) => {
      // Send via WebSocket for real-time update
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'DELETE_MESSAGE',
          jobId,
          messageId
        }));
      }
      
      // Update local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/messages`] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  });

  const deleteMessage = useCallback(async (messageId: string) => {
    await deleteMessageMutation.mutateAsync(messageId);
  }, [deleteMessageMutation]);

  // Add reaction
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return apiRequest('/api/messages/' + messageId + '/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
    },
    onSuccess: (_, variables) => {
      // Send via WebSocket for real-time update
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ADD_REACTION',
          jobId,
          messageId: variables.messageId,
          emoji: variables.emoji
        }));
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/messages`] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive'
      });
    }
  });

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    await addReactionMutation.mutateAsync({ messageId, emoji });
  }, [addReactionMutation]);

  // Remove reaction
  const removeReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return apiRequest('/api/messages/' + messageId + '/reactions/' + emoji, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, variables) => {
      // Send via WebSocket for real-time update
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'REMOVE_REACTION',
          jobId,
          messageId: variables.messageId,
          emoji: variables.emoji
        }));
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/messages`] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove reaction',
        variant: 'destructive'
      });
    }
  });

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    await removeReactionMutation.mutateAsync({ messageId, emoji });
  }, [removeReactionMutation]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'TYPING_START',
        jobId,
        userId,
        userName
      }));

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after timeout
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'TYPING_STOP',
            jobId,
            userId
          }));
        }
      }, typingIndicatorTimeout);
    }
  }, [jobId, userId, userName, typingIndicatorTimeout]);

  // Mark messages as read
  const markMessagesAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/jobs/' + jobId + '/messages/read', {
        method: 'PATCH'
      });
    },
    onSuccess: () => {
      // Send read receipts via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        messages.filter(m => !m.readAt && m.senderId !== userId).forEach(m => {
          wsRef.current!.send(JSON.stringify({
            type: 'READ_RECEIPT',
            jobId,
            messageId: m.id,
            userId
          }));
        });
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/messages/unread`] });
    }
  });

  const markMessagesAsRead = useCallback(async () => {
    await markMessagesAsReadMutation.mutateAsync();
  }, [markMessagesAsReadMutation]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const oldestMessage = messages[messages.length - 1];
      const url = oldestMessage 
        ? `/api/jobs/${jobId}/messages/history?beforeId=${oldestMessage.id}&limit=${messagePageSize}`
        : `/api/jobs/${jobId}/messages/history?limit=${messagePageSize}`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
        setHasMoreMessages(data.hasMore || false);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more messages',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [jobId, messages, hasMoreMessages, isLoadingMore, messagePageSize, toast]);

  // Connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      // Clean up
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Leave chat room before closing
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'LEAVE_CHAT',
          jobId,
          userId
        }));
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, jobId, userId]);

  return {
    messages,
    isConnected,
    isReconnecting,
    typingUsers: Array.from(typingUsers.values()),
    onlineUsers,
    unreadCount,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    sendTypingIndicator,
    markMessagesAsRead,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
    connectionError
  };
}
