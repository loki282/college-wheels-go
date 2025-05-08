
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from './profileService';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Conversation {
  otherUser: Profile;
  lastMessage: Message;
  unreadCount: number;
}

export async function getConversations() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.user) {
      return [];
    }

    const userId = sessionData.session.user.id;

    // Get all messages where the user is either sender or receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(*),
        receiver:profiles!receiver_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Group messages by conversation
    const conversationsMap = new Map<string, Conversation>();
    
    messages.forEach(message => {
      if (!message.sender || !message.receiver) return;
      
      const isUserSender = message.sender_id === userId;
      const otherUserId = isUserSender ? message.receiver_id : message.sender_id;
      const otherUserData = isUserSender ? message.receiver : message.sender;
      
      if (!otherUserData) return;

      // Convert the string role to the correct type
      const otherUser: Profile = {
        ...otherUserData,
        role: otherUserData.role as 'rider' | 'driver' | 'both'
      };

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          otherUser,
          lastMessage: message as Message,
          unreadCount: (!isUserSender && !message.read) ? 1 : 0
        });
      } else {
        const existing = conversationsMap.get(otherUserId)!;
        // Only update last message if this one is more recent
        if (new Date(message.created_at) > new Date(existing.lastMessage.created_at)) {
          existing.lastMessage = message as Message;
        }
        // Count unread messages
        if (!isUserSender && !message.read) {
          existing.unreadCount += 1;
        }
      }
    });

    return Array.from(conversationsMap.values());
  } catch (error) {
    console.error('Error fetching conversations:', error);
    toast.error('Failed to load conversations');
    return [];
  }
}

export async function getMessages(otherUserId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.user) {
      return [];
    }

    const userId = sessionData.session.user.id;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(*),
        receiver:profiles!receiver_id(*)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Filter out any messages with null sender or receiver
    const validMessages = data.filter(msg => msg.sender && msg.receiver);

    // Mark other user's messages as read
    const unreadMessages = validMessages
      .filter(msg => msg.sender_id === otherUserId && !msg.read)
      .map(msg => msg.id);

    if (unreadMessages.length > 0) {
      await supabase
        .from('messages')
        .update({ read: true })
        .in('id', unreadMessages);
    }

    // Process messages with proper type handling
    const typedMessages = validMessages.map(msg => ({
      ...msg,
      sender: { ...msg.sender, role: msg.sender.role as 'rider' | 'driver' | 'both' },
      receiver: { ...msg.receiver, role: msg.receiver.role as 'rider' | 'driver' | 'both' }
    })) as Message[];

    return typedMessages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    toast.error('Failed to load messages');
    return [];
  }
}

export async function sendMessage(receiverId: string, content: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.user) {
      toast.error('You must be logged in to send messages');
      return null;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: sessionData.session.user.id,
        receiver_id: receiverId,
        content,
        read: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    return null;
  }
}

export function subscribeToMessages(callback: (message: Message) => void) {
  const channel = supabase
    .channel('public:messages')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, 
      async (payload) => {
        // Fetch the complete message with sender and receiver details
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!sender_id(*),
            receiver:profiles!receiver_id(*)
          `)
          .eq('id', payload.new.id)
          .single();
          
        if (data && data.sender && data.receiver) {
          // Process message with proper type handling
          const typedMessage = {
            ...data,
            sender: { ...data.sender, role: data.sender.role as 'rider' | 'driver' | 'both' },
            receiver: { ...data.receiver, role: data.receiver.role as 'rider' | 'driver' | 'both' }
          } as Message;
          
          callback(typedMessage);
        }
      }
    )
    .subscribe();

  return channel;
}
