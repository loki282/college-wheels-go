
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Bell as BellIcon } from "lucide-react";
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, Notification } from "@/services/notificationService";

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: Notification[];
}

export function NotificationsPopup({ isOpen, onClose, notifications: initialNotifications }: NotificationPopupProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !initialNotifications) {
      loadNotifications();
    } else if (initialNotifications) {
      setNotifications(initialNotifications);
    }
  }, [isOpen, initialNotifications]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const userNotifications = await getUserNotifications();
      setNotifications(userNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-0 pb-2">
          <div className="flex justify-between items-center">
            <SheetTitle className="flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Notifications
            </SheetTitle>
            {notifications.some(n => !n.read) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cosmicviolet"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2 mt-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  notification.read ? 'bg-background' : 'bg-background border-l-4 border-cosmicviolet'
                } hover:bg-muted`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
            <BellIcon className="h-12 w-12 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground mt-4">No notifications yet</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
