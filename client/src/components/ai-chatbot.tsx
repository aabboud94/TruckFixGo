import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  Minimize2,
  Maximize2,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Mic,
  MicOff,
  HelpCircle,
  DollarSign,
  Wrench,
  MapPin,
  Clock,
  Bot,
  User,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  feedback?: "up" | "down" | null;
}

interface ChatSession {
  messages: Message[];
  startedAt: Date;
}

const QUICK_ACTIONS = [
  { icon: DollarSign, text: "How much will my repair cost?", action: "cost" },
  { icon: Wrench, text: "What's wrong with my truck?", action: "diagnose" },
  { icon: MapPin, text: "Find nearest mechanic", action: "find" },
  { icon: Clock, text: "Check job status", action: "status" }
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("truckfixgo-chat-session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession({
          messages: parsed.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })),
          startedAt: new Date(parsed.startedAt)
        });
      } catch (e) {
        // Invalid session data, start fresh
        startNewSession();
      }
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem("truckfixgo-chat-session", JSON.stringify(session));
    }
  }, [session]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "Unable to process voice input. Please try typing instead.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startNewSession = () => {
    setSession({
      messages: [],
      startedAt: new Date()
    });
  };

  const getPageContext = () => {
    const path = location;
    if (path === "/") return "homepage";
    if (path.startsWith("/emergency")) return "emergencyPage";
    if (path.startsWith("/fleet")) return "fleetPage";
    if (path.startsWith("/contractor")) return "contractorPage";
    if (path.startsWith("/track")) return "trackingPage";
    return "general";
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return await apiRequest("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: messageText,
          context: {
            page: getPageContext(),
            sessionHistory: session?.messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        })
      });
    },
    onSuccess: (response, messageText) => {
      const assistantMessage: Message = {
        id: Date.now().toString() + "-assistant",
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        suggestions: response.suggestions,
        feedback: null
      };

      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, assistantMessage]
        };
      });
      setIsTyping(false);
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;

    if (!session) {
      startNewSession();
    }

    const userMessage: Message = {
      id: Date.now().toString() + "-user",
      role: "user",
      content: message,
      timestamp: new Date(),
      feedback: null
    };

    setSession(prev => {
      if (!prev) {
        return {
          messages: [userMessage],
          startedAt: new Date()
        };
      }
      return {
        ...prev,
        messages: [...prev.messages, userMessage]
      };
    });

    setMessage("");
    setIsTyping(true);
    sendMessageMutation.mutate(userMessage.content);
  };

  const handleQuickAction = (action: string) => {
    let quickMessage = "";
    switch (action) {
      case "cost":
        quickMessage = "Can you help me understand typical repair costs for common truck issues?";
        break;
      case "diagnose":
        quickMessage = "My truck is having issues. Can you help me diagnose what might be wrong?";
        break;
      case "find":
        quickMessage = "I need to find the nearest available mechanic for emergency service.";
        break;
      case "status":
        quickMessage = "How can I check the status of my repair job?";
        break;
    }
    setMessage(quickMessage);
    handleSend();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Response copied to clipboard"
    });
  };

  const handleFeedback = (messageId: string, feedback: "up" | "down") => {
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: prev.messages.map(m =>
          m.id === messageId ? { ...m, feedback } : m
        )
      };
    });
    toast({
      title: feedback === "up" ? "Thanks for the feedback!" : "Sorry about that",
      description: feedback === "up" 
        ? "We're glad the response was helpful" 
        : "We'll work on improving our responses"
    });
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not available",
        description: "Your browser doesn't support voice input",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    handleSend();
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-primary shadow-lg hover:shadow-xl hover-elevate"
              onClick={() => setIsOpen(true)}
              data-testid="button-open-chat"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-50 shadow-2xl",
              isMinimized 
                ? "bottom-6 right-6 w-80 h-16" 
                : "bottom-6 right-6 w-96 h-[600px] sm:w-[400px]"
            )}
          >
            <Card className="w-full h-full flex flex-col bg-background border-2">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
                    <AvatarFallback className="bg-primary-foreground/10">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">TruckFixGo AI</h3>
                    <p className="text-xs opacity-90">Always here to help</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsMinimized(!isMinimized)}
                    data-testid="button-minimize-chat"
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                    data-testid="button-close-chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4">
                    {!session || session.messages.length === 0 ? (
                      <div className="space-y-4">
                        <div className="text-center text-muted-foreground py-8">
                          <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                          <p className="font-medium">Hi! I'm your TruckFixGo assistant</p>
                          <p className="text-sm mt-2">How can I help you today?</p>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          {QUICK_ACTIONS.map((action, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              className="justify-start h-auto p-3 hover-elevate"
                              onClick={() => handleQuickAction(action.action)}
                              data-testid={`button-quick-action-${action.action}`}
                            >
                              <action.icon className="h-4 w-4 mr-2 text-primary" />
                              <span className="text-xs text-left">{action.text}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {session.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-3",
                              msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            {msg.role === "assistant" && (
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-primary/10">
                                  <Bot className="h-4 w-4 text-primary" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              "max-w-[80%] space-y-2",
                              msg.role === "user" ? "items-end" : "items-start"
                            )}>
                              <div
                                className={cn(
                                  "rounded-lg p-3",
                                  msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              
                              {msg.role === "assistant" && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => handleCopy(msg.content)}
                                    data-testid={`button-copy-${msg.id}`}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                      "h-6 w-6",
                                      msg.feedback === "up" && "text-green-600"
                                    )}
                                    onClick={() => handleFeedback(msg.id, "up")}
                                    data-testid={`button-feedback-up-${msg.id}`}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                      "h-6 w-6",
                                      msg.feedback === "down" && "text-red-600"
                                    )}
                                    onClick={() => handleFeedback(msg.id, "down")}
                                    data-testid={`button-feedback-down-${msg.id}`}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {msg.suggestions && msg.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {msg.suggestions.map((suggestion, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      data-testid={`button-suggestion-${msg.id}-${idx}`}
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {msg.role === "user" && (
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                        
                        {isTyping && (
                          <div className="flex gap-3 items-center">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10">
                                <Bot className="h-4 w-4 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg p-3">
                              <div className="flex gap-1">
                                <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          ref={textareaRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          placeholder="Type your message..."
                          className="min-h-[40px] max-h-[100px] resize-none pr-10"
                          disabled={isTyping}
                          data-testid="input-chat-message"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "absolute right-1 top-1 h-8 w-8",
                            isListening && "text-red-500"
                          )}
                          onClick={toggleVoiceInput}
                          disabled={isTyping}
                          data-testid="button-voice-input"
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!message.trim() || isTyping}
                        className="shrink-0"
                        data-testid="button-send-message"
                      >
                        {isTyping ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {isListening && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                        Listening... Speak now
                      </p>
                    )}
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}