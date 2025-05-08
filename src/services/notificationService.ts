
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  read: boolean;
  notification_type: string;
  reference_id: string | null;
  created_at: string;
}

export async function getUserNotifications() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session?.user) {
      return [];
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', sessionData.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }

    return data as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session?.user) {
      return false;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', sessionData.session.user.id)
      .eq('read', false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

export async function createNotification(userId: string, title: string, content: string, notificationType: string, referenceId?: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        content: content,
        notification_type: notificationType,
        reference_id: referenceId || null,
        read: false
      });

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

export async function subscribeToNotifications(callback: (notification: Notification) => void): Promise<RealtimeChannel | null> {
  try {
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session?.user) {
      console.log('No session found, not subscribing to notifications');
      return null;
    }
    
    // Create and return the channel
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${sessionData.session.user.id}`
        }, 
        (payload) => {
          console.log("New notification received:", payload.new);
          const notification = payload.new as Notification;
          callback(notification);
          
          toast.info(notification.title, {
            description: notification.content,
            duration: 5000,
          });
        }
      )
      .subscribe();

    console.log("Subscribed to notifications channel for user:", sessionData.session.user.id);
    return channel;
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    return null;
  }
}
