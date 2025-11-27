import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Send, 
  Edit2, 
  Trash2, 
  Paperclip, 
  Check, 
  CheckCheck,
  Smile,
  MoreVertical,
  Reply,
  AlertCircle,
  Loader2,
  ArrowDown,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { JobMessage } from '@shared/schema';

interface ChatWidgetProps {
  jobId: string;
  userId: string;
  userName?: string;
  userRole?: 'customer' | 'contractor' | 'admin';
  className?: string;
  height?: string;
  showHeader?: boolean;
  showOnlineStatus?: boolean;
}

interface MessageGroup {
  senderId: string;
  senderRole: string;
  senderName?: string;
  messages: any[];
  lastMessageTime: string;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😊', '🔥', '🎉', '👏', '💯'];

function formatMessageTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, h:mm a');
  }
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function ChatWidget({
  jobId,
  userId,
  userName = 'You',
  userRole = 'customer',
  className,
  height = '600px',
  showHeader = true,
  showOnlineStatus = true
}: ChatWidgetProps) {
  const {
    messages,
    isConnected,
    isReconnecting,
    typingUsers,
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
  } = useChat({ jobId, userId, userName });

  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<(JobMessage & { content?: string }) | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScrollTop = useRef(0);
  const isUserScrolling = useRef(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!isUserScrolling.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Mark messages as read when chat is visible
  useEffect(() => {
    if (unreadCount > 0) {
      const timer = setTimeout(() => {
        markMessagesAsRead();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, markMessagesAsRead]);

  // Handle scroll for infinite loading and scroll-to-bottom button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Check if user is manually scrolling
    isUserScrolling.current = Math.abs(scrollTop - lastScrollTop.current) > 5;
    lastScrollTop.current = scrollTop;
    
    // Show/hide scroll to bottom button
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollToBottom(distanceFromBottom > 200);
    
    // Load more messages when scrolling to top
    if (scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    isUserScrolling.current = false;
  }, []);

  // Handle message input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (e.target.value.length > 0) {
      sendTypingIndicator();
    }
  }, [sendTypingIndicator]);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    const content = messageInput.trim();
    if (!content && !attachmentFile) return;

    let attachmentUrl: string | undefined;
    let attachmentType: string | undefined;

    // Handle file attachment (simplified - in real app, you'd upload to storage)
    if (attachmentFile) {
      // In a real implementation, upload file to storage and get URL
      attachmentUrl = URL.createObjectURL(attachmentFile);
      attachmentType = attachmentFile.type;
    }

    await sendMessage(
      content,
      replyToMessage?.id,
      attachmentUrl,
      attachmentType
    );

    setMessageInput('');
    setReplyToMessage(null);
    setAttachmentFile(null);
    isUserScrolling.current = false;
  }, [messageInput, replyToMessage, attachmentFile, sendMessage]);

  // Handle edit message
  const handleEditMessage = useCallback(async () => {
    if (!editingMessageId || !editInput.trim()) return;
    
    await editMessage(editingMessageId, editInput.trim());
    setEditingMessageId(null);
    setEditInput('');
  }, [editingMessageId, editInput, editMessage]);

  // Handle delete message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(messageId);
    }
  }, [deleteMessage]);

  // Toggle reaction
  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    const reactions = (message?.reactions as Record<string, string[]> | undefined) ?? {};
    const userReactions = reactions[emoji] || [];
    const userReacted = userReactions.includes(userId);
    
    if (userReacted) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
    setShowEmojiPicker(null);
  }, [messages, userId, addReaction, removeReaction]);

  // Group messages by sender
  const messageGroups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;
  
  messages.forEach(message => {
    const messageTime = typeof message.createdAt === 'string' 
      ? message.createdAt 
      : message.createdAt.toISOString();
    
    if (!currentGroup || 
        currentGroup.senderId !== message.senderId ||
        new Date(messageTime).getTime() - new Date(currentGroup.lastMessageTime).getTime() > 300000) {
      currentGroup = {
        senderId: message.senderId,
        senderRole: message.senderRole || 'customer',
        senderName: message.senderName || (message.senderId === userId ? userName : 'Other User'),
        messages: [message],
        lastMessageTime: messageTime
      };
      messageGroups.push(currentGroup);
    } else {
      currentGroup.messages.push(message);
      currentGroup.lastMessageTime = messageTime;
    }
  });

  return (
    <Card 
      className={cn("flex flex-col", className)} 
      style={{ height }}
      data-testid="chat-widget"
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Chat</h3>
            {showOnlineStatus && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{onlineUsers.length} online</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isReconnecting && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Reconnecting...
              </Badge>
            )}
            {isConnected && !isReconnecting && (
              <Badge variant="outline" className="gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Connected
              </Badge>
            )}
            {connectionError && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Connection Error
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 px-4"
        onScroll={handleScroll}
      >
        {/* Load More Indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 py-4">
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              {/* Group Header */}
              <div className="flex items-end gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {getInitials(group.senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {group.senderName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {group.senderRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(group.lastMessageTime)}
                    </span>
                  </div>

                  {/* Group Messages */}
                  <div className="space-y-1">
                    {group.messages.map(message => (
                      <div key={message.id} className="group relative">
                        {/* Reply Indicator */}
                        {message.replyToId && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Reply className="w-3 h-3" />
                            <span>Replying to a message</span>
                          </div>
                        )}

                        {/* Message Content */}
                        <div className={cn(
                          "inline-block rounded-lg px-3 py-2",
                          message.senderId === userId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                          message.isPending && "opacity-60"
                        )}>
                          {editingMessageId === message.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleEditMessage()}
                                className="min-w-[200px]"
                                autoFocus
                              />
                              <Button size="sm" onClick={handleEditMessage}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditInput('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm">{message.content ?? message.message}</p>
                              {message.isEdited && (
                                <span className="text-xs opacity-70">(edited)</span>
                              )}
                            </>
                          )}

                          {/* Attachment */}
                          {message.attachmentUrl && (
                            <div className="mt-2">
                              {message.attachmentType?.startsWith('image/') ? (
                                <img 
                                  src={message.attachmentUrl} 
                                  alt="Attachment"
                                  className="max-w-[200px] rounded"
                                />
                              ) : (
                                <a 
                                  href={message.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs underline"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  Attachment
                                </a>
                              )}
                            </div>
                          )}

                          {/* Read Receipt */}
                          {message.senderId === userId && (
                            <div className="flex justify-end mt-1">
                              {message.isDelivered ? (
                                message.readReceipts && message.readReceipts.length > 0 ? (
                                  <CheckCheck className="w-3 h-3 text-blue-400" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )
                              ) : (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Message Actions */}
                        {!message.isPending && (
                          <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 bg-background border rounded-lg p-1 shadow-lg">
                              {/* Emoji Reactions */}
                              <Popover 
                                open={showEmojiPicker === message.id}
                                onOpenChange={(open) => setShowEmojiPicker(open ? message.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Smile className="w-4 h-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                  <div className="flex gap-1">
                                    {EMOJI_LIST.map(emoji => (
                                      <Button
                                        key={emoji}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleToggleReaction(message.id, emoji)}
                                      >
                                        {emoji}
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>

                              {/* Reply */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => setReplyToMessage(message)}
                              >
                                <Reply className="w-4 h-4" />
                              </Button>

                              {/* Edit/Delete (own messages only) */}
                              {message.senderId === userId && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      setEditingMessageId(message.id);
                                      setEditInput(message.content ?? message.message ?? "");
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleDeleteMessage(message.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Reactions Display */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {Object.entries(
                              (message.reactions as Record<string, string[]> | undefined) ?? {},
                            ).map(([emoji, userIds]) => {
                              const users = Array.isArray(userIds) ? userIds : [];
                              return (
                                <Button
                                  key={emoji}
                                  size="sm"
                                  variant={users.includes(userId) ? "secondary" : "ghost"}
                                  className="h-6 px-2 py-0 text-xs"
                                  onClick={() => handleToggleReaction(message.id, emoji)}
                                >
                                  {emoji} {users.length}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>
              {typingUsers.map(u => u.userName || 'Someone').join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        )}

        {/* Bottom Reference for Auto-scroll */}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-24 right-4 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ArrowDown className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="ml-2" variant="destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Reply Indicator */}
      {replyToMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-t">
          <div className="flex items-center gap-2 text-sm">
            <Reply className="w-4 h-4" />
            <span>Replying to:</span>
              <span className="font-medium truncate max-w-[200px]">
                {replyToMessage.content ?? replyToMessage.message}
              </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setReplyToMessage(null)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Attachment Preview */}
      {attachmentFile && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-t">
          <div className="flex items-center gap-2 text-sm">
            <Paperclip className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{attachmentFile.name}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAttachmentFile(null)}
          >
            Remove
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2 px-4 py-3 border-t">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setAttachmentFile(file);
          }}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-attach-file"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Input
          ref={inputRef}
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1"
          disabled={!isConnected || !!connectionError}
          data-testid="input-message"
        />
        <Button
          size="sm"
          onClick={handleSendMessage}
          disabled={(!messageInput.trim() && !attachmentFile) || !isConnected || !!connectionError}
          data-testid="button-send-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
