import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { GlassContainer } from "@/components/ui/glass-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search as SearchIcon,
  User as UserIcon,
  Check as CheckIcon,
  Send as SendIcon,
  MessageSquare as MessageSquareIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  subscribeToMessages,
  Conversation,
  Message
} from "@/services/messageService";
import { format, formatDistance } from "date-fns";
import { toast } from "sonner";
import { getProfile } from "@/services/profileService";

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeUserName, setActiveUserName] = useState<string>("");
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      const data = await getConversations();
      setConversations(data);
      setIsLoading(false);
      
      const chatWith = searchParams.get("chat");
      if (chatWith) {
        const conversation = data.find(conv => conv.otherUser.id === chatWith);
        if (conversation) {
          setActiveConversation(chatWith);
          setActiveUserName(conversation.otherUser.full_name || "User");
        } else if (chatWith) {
          loadUserProfile(chatWith);
        }
      }
    };
    
    loadConversations();
  }, []);
  
  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await getProfile(userId);
      if (profile) {
        setActiveConversation(userId);
        setActiveUserName(profile.full_name || "User");
        setSearchParams({ chat: userId });
      } else {
        toast.error("Could not find user to message");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast.error("Error starting conversation with user");
    }
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation) return;
      
      const data = await getMessages(activeConversation);
      setMessages(data);
      
      if (!activeUserName && activeConversation) {
        const profile = await getProfile(activeConversation);
        if (profile) {
          setActiveUserName(profile.full_name || "User");
        }
      }
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    };

    loadMessages();
  }, [activeConversation]);

  useEffect(() => {
    if (!user) return;

    const channel = subscribeToMessages((newMessage) => {
      if (activeConversation && 
         (newMessage.sender_id === activeConversation || newMessage.receiver_id === activeConversation)) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      }
      
      setConversations(prevConversations => {
        const otherUserId = newMessage.sender_id === user.id ? newMessage.receiver_id : newMessage.sender_id;
        const existingConvIndex = prevConversations.findIndex(c => c.otherUser.id === otherUserId);
        
        if (existingConvIndex >= 0) {
          const updatedConversations = [...prevConversations];
          const conv = updatedConversations[existingConvIndex];
          
          const isUnread = newMessage.sender_id !== user.id && otherUserId !== activeConversation;
          
          updatedConversations[existingConvIndex] = {
            ...conv,
            lastMessage: newMessage,
            unreadCount: isUnread ? conv.unreadCount + 1 : conv.unreadCount
          };
          
          const [conversation] = updatedConversations.splice(existingConvIndex, 1);
          updatedConversations.unshift(conversation);
          
          return updatedConversations;
        } else if (newMessage.sender_id !== user.id) {
          return [{
            otherUser: newMessage.sender,
            lastMessage: newMessage,
            unreadCount: 1
          }, ...prevConversations];
        }
        
        return prevConversations;
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user, activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeConversation || isSending) return;
    
    setIsSending(true);
    try {
      await sendMessage(activeConversation, message.trim());
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectConversation = (userId: string, userName: string) => {
    setActiveConversation(userId);
    setActiveUserName(userName);
    setSearchParams({ chat: userId });
    
    setConversations(prev => 
      prev.map(conv => 
        conv.otherUser.id === userId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "HH:mm");
    }
    
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, "EEE");
    }
    
    return format(date, "MMM d");
  };

  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "HH:mm");
    }
    
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }
      
      return format(date, "EEE");
    }
    
    return format(date, "MMM d");
  };

  return (
    <div className="pt-6 pb-20 px-4 h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with drivers and riders</p>
      </header>

      {activeConversation === null ? (
        <div className="space-y-4 flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <GlassContainer className="flex-1 overflow-hidden">
            <div className="divide-y overflow-y-auto max-h-[calc(100vh-250px)]">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electricblue"></div>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.otherUser.id}
                    className="p-4 flex items-center hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectConversation(conversation.otherUser.id, conversation.otherUser.full_name || "User")}
                  >
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        {conversation.otherUser.full_name ? (
                          <div className="font-medium text-lg">
                            {conversation.otherUser.full_name.charAt(0)}
                          </div>
                        ) : (
                          <UserIcon className="h-6 w-6" />
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-electricblue flex items-center justify-center text-xs text-white font-medium">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {conversation.otherUser.full_name || "Unknown User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatConversationTime(conversation.lastMessage.created_at)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.sender_id === user?.id ? "You: " : ""}
                        {conversation.lastMessage.content}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <MessageSquareIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
                  <h3 className="text-xl font-semibold">No conversations yet</h3>
                  <p className="text-muted-foreground">
                    Messages with drivers and riders will appear here
                  </p>
                </div>
              )}
            </div>
          </GlassContainer>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center p-3 bg-background shadow-sm rounded-t-lg">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => {
                setActiveConversation(null);
                setSearchParams({});
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Button>

            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-2">
              {activeUserName ? (
                <div className="font-medium">
                  {activeUserName.charAt(0)}
                </div>
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="font-medium">{activeUserName || "User"}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-limegreen mr-1"></div>
                Online
              </div>
            </div>
          </div>

          <GlassContainer className="flex-1 flex flex-col overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <MessageSquareIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
                  <h3 className="text-lg font-medium">No messages yet</h3>
                  <p className="text-muted-foreground">
                    Send a message to start the conversation
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 ${msg.sender_id === user?.id
                        ? "bg-electricblue text-white"
                        : "bg-muted"
                        }`}
                    >
                      <p>{msg.content}</p>
                      <div
                        className={`text-xs mt-1 flex items-center justify-end ${msg.sender_id === user?.id ? "text-blue-100" : "text-muted-foreground"
                          }`}
                      >
                        {formatMessageTime(msg.created_at)}
                        {msg.sender_id === user?.id && (
                          <CheckIcon className={`h-3 w-3 ml-1 ${msg.read ? "text-green-300" : ""}`} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            <Separator />

            <form onSubmit={handleSendMessage} className="p-3 flex items-center">
              <Input
                placeholder="Type a message..."
                className="flex-1"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
              />
              <Button
                type="submit"
                size="icon"
                className="ml-2 bg-electricblue hover:bg-electricblue/90"
                disabled={!message.trim() || isSending}
              >
                {isSending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </Button>
            </form>
          </GlassContainer>
        </div>
      )}
    </div>
  );
}
