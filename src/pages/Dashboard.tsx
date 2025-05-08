import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card3D } from "@/components/ui/card-3d";
import { GlassContainer } from "@/components/ui/glass-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Car as CarIcon,
  Search as SearchIcon,
  MapPinCheck as MapPinIcon,
  Clock as ClockIcon,
  User as UserIcon,
  Star as StarIcon,
  Rocket as RocketIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  MessageSquare as MessageIcon,
  Bell as BellIcon,
  HelpCircle as HelpIcon
} from "lucide-react";
import { NotificationsPopup } from "@/components/notifications/NotificationsPopup";
import { useAuth } from "@/hooks/useAuth";
import { getUserRides } from "@/services/rideService";
import { getUserNotifications, subscribeToNotifications, Notification } from "@/services/notificationService";
import { format } from "date-fns";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, profile, signOut: authSignOut } = useAuth();
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Load user rides
      const rides = await getUserRides();
      // Filter to get only upcoming active rides
      const upcoming = rides
        .filter(ride => ride.status === 'active')
        .sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime())
        .slice(0, 3); // Get only the first 3

      setUpcomingRides(upcoming);

      // Load notifications
      const userNotifications = await getUserNotifications();
      setNotifications(userNotifications.filter(n => !n.read).slice(0, 5));

      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    // Subscribe to real-time notifications
    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      if (user) {
        channel = await subscribeToNotifications((notification) => {
          setNotifications(prev => [notification, ...prev].slice(0, 5));
        });
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        // Use the correct method for unsubscribing
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await authSignOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="pt-6 pb-20 px-4 h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      {/* Header with cosmic theme */}
      <header>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold font-heading text-transparent bg-clip-text bg-cosmic-gradient">
              Hello, {profile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">Ready for your next orbit?</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="h-14 w-14 rounded-full bg-cosmic-gradient flex items-center justify-center shadow-cosmic cursor-pointer hover:shadow-cosmic-lg transition-all">
                <div className="h-12 w-12 rounded-full bg-card flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-cosmicviolet" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/my-rides")}>
                <CarIcon className="mr-2 h-4 w-4" />
                <span>My Rides</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/messages")}>
                <MessageIcon className="mr-2 h-4 w-4" />
                <span>Messages</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNotifications(true)}>
                <BellIcon className="mr-2 h-4 w-4" />
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {notifications.length}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/help")}>
                <HelpIcon className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Floating Orbit Animation */}
      <div className="relative h-12 overflow-hidden mb-6">
        <div className="absolute left-1/2 -ml-5 top-1/2 -mt-5">
          <div className="h-10 w-10 rounded-full bg-deepcosmos/20 backdrop-blur-lg flex items-center justify-center">
            <RocketIcon className="h-5 w-5 text-cosmicviolet" />
          </div>
        </div>

        {/* Orbiting Elements */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`absolute left-1/2 top-1/2 animate-orbit`}
            style={{
              animationDelay: `${i * 0.75}s`,
              animationDuration: `${12 + i}s`
            }}
          >
            <div className="h-6 w-6 -ml-3 -mt-3 rounded-full bg-cosmicviolet/10 backdrop-blur-md flex items-center justify-center">
              <StarIcon className="h-3 w-3 text-cosmicviolet" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card3D glowColor="primary">
        <GlassContainer className="p-5" intensity="light">
          <h2 className="text-lg font-semibold mb-3 font-heading">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="bg-cosmicviolet hover:bg-cosmicviolet/90 h-auto py-4 px-4 rounded-xl shadow-cosmic cosmic-button"
              onClick={() => navigate("/find")}
            >
              <div className="flex flex-col items-center">
                <SearchIcon className="h-5 w-5 mb-1" />
                <span>Find a Ride</span>
              </div>
            </Button>
            <Button
              className="bg-nebulagreen hover:bg-nebulagreen/90 text-white h-auto py-4 rounded-xl shadow-nebula cosmic-button"
              onClick={() => navigate("/create")}
              disabled={profile?.role === 'rider'}
            >
              <div className="flex flex-col items-center">
                <CarIcon className="h-5 w-5 mb-1" />
                <span>Offer a Ride</span>
              </div>
            </Button>
          </div>
        </GlassContainer>
      </Card3D>

      {/* Upcoming Rides */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold font-heading">Upcoming Rides</h2>
          <Button
            variant="link"
            className="text-cosmicviolet p-0"
            onClick={() => navigate("/rides")}
          >
            View all
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cosmicviolet"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingRides.length > 0 ? upcomingRides.map((ride) => (
              <Card3D key={ride.id}>
                <Card className="overflow-hidden border-none shadow-cosmic">
                  <div className="h-1 bg-cosmic-gradient" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="font-heading">{ride.from_location} → {ride.to_location}</CardTitle>
                      <div className="bg-cosmicviolet/10 text-cosmicviolet px-2 py-1 rounded-lg text-sm font-medium">
                        {format(new Date(ride.departure_date), "MMM d")}
                      </div>
                    </div>
                    <CardDescription className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {ride.departure_time.substring(0, 5)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-cosmic-gradient p-0.5 mr-2">
                          <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-cosmicviolet" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {ride.userRole === 'driver' ? 'You (Driver)' : ride.driver?.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ride.available_seats} {ride.available_seats === 1 ? 'seat' : 'seats'} available
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-cosmicviolet border-cosmicviolet hover:bg-cosmicviolet/10 hover:text-foreground transition-all"
                          onClick={() => navigate(`/ride/${ride.id}`)}
                        >
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-cosmicviolet border-cosmicviolet hover:bg-cosmicviolet/10 hover:text-foreground transition-all"
                          onClick={() => {
                            const otherUserId = ride.userRole === 'driver' ?
                              ride.passenger_id :
                              ride.driver?.id;
                            navigate(`/messages?userId=${otherUserId}`);
                          }}
                        >
                          <MessageIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Card3D>
            )) : (
              <GlassContainer className="p-6 text-center">
                <MapPinIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
                <h3 className="text-lg font-semibold font-heading">No upcoming rides</h3>
                <p className="text-muted-foreground">Find or create a ride to get started</p>
              </GlassContainer>
            )}
          </div>
        )}
      </section>

      {/* Notifications */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="text-cosmicviolet" />
            Notifications
          </CardTitle>
          <Button
            variant="link"
            className="text-cosmicviolet p-0"
            onClick={() => setShowNotifications(true)}
          >
            See all
          </Button>
        </div>
        <GlassContainer className="p-4">
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 rounded-lg bg-background hover:bg-muted transition-all cursor-pointer">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.content}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.created_at), "MMM d, h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No new notifications</p>
            </div>
          )}
        </GlassContainer>
      </section>

      <NotificationsPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
      />
    </div>
  );
}
