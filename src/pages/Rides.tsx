import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card3D } from "@/components/ui/card-3d";
import { GlassContainer } from "@/components/ui/glass-container";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  User as UserIcon,
  Star as StarIcon,
  Plus as PlusIcon,
  MessageSquare as MessageIcon
} from "lucide-react";
import { getUserRides, updateRideStatus, updateBookingStatus } from "@/services/rideService";
import { rateUser } from "@/services/ratingService";
import { useAuth } from "@/hooks/useAuth";

export default function Rides() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    const loadRides = async () => {
      setIsLoading(true);
      const userRides = await getUserRides();
      setRides(userRides);
      setIsLoading(false);
    };

    loadRides();
  }, []);

  const upcomingRides = rides.filter(ride =>
    ride.status === 'active' ||
    (ride.userRole === 'passenger' && ride.bookingStatus === 'pending')
  );

  const completedRides = rides.filter(ride =>
    ride.status === 'completed' ||
    (ride.userRole === 'passenger' && ride.bookingStatus === 'confirmed')
  );

  const cancelledRides = rides.filter(ride =>
    ride.status === 'cancelled' ||
    (ride.userRole === 'passenger' && ride.bookingStatus === 'cancelled')
  );

  const handleUpdateRideStatus = async (rideId: string, status: 'completed' | 'cancelled') => {
    const success = await updateRideStatus(rideId, status);
    if (success) {
      // Update local state
      setRides(prev => prev.map(ride =>
        ride.id === rideId ? { ...ride, status } : ride
      ));
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    const success = await updateBookingStatus(bookingId, status);
    if (success) {
      // Refresh rides to get updated data
      const userRides = await getUserRides();
      setRides(userRides);
    }
  };

  return (
    <div className="pt-6 pb-16 px-4 animate-fade-in">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Rides</h1>
          <p className="text-muted-foreground">View and manage your rides</p>
        </div>

        {(profile?.role === 'driver' || profile?.role === 'both') && (
          <Button
            onClick={() => navigate('/create')}
            className="bg-cosmic-gradient hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="mr-2" />
            New Ride
          </Button>
        )}
      </header>

      <Tabs
        defaultValue="upcoming"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="upcoming">Upcoming ({upcomingRides.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRides.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledRides.length})</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cosmicviolet"></div>
          </div>
        ) : (
          <>
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingRides.map(ride => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  type="upcoming"
                  onUpdateRideStatus={handleUpdateRideStatus}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                />
              ))}

              {upcomingRides.length === 0 && (
                <EmptyState message="No upcoming rides" description="Book a ride to get started" />
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedRides.map(ride => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  type="completed"
                  onUpdateRideStatus={handleUpdateRideStatus}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                />
              ))}

              {completedRides.length === 0 && (
                <EmptyState message="No completed rides" description="Your completed rides will appear here" />
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledRides.map(ride => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  type="cancelled"
                  onUpdateRideStatus={handleUpdateRideStatus}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                />
              ))}

              {cancelledRides.length === 0 && (
                <EmptyState message="No cancelled rides" description="Your cancelled rides will appear here" />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function RideCard({ ride, type, onUpdateRideStatus, onUpdateBookingStatus }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const handleRating = async (newRating) => {
    if (submittingRating) return;

    setSubmittingRating(true);
    setRating(newRating);

    try {
      // Submit the rating
      const otherUserId = ride.userRole === 'driver' ? ride.passenger?.id : ride.driver?.id;
      if (!otherUserId) {
        throw new Error("Cannot find user to rate");
      }

      await rateUser(ride.id, otherUserId, newRating);
    } catch (error) {
      console.error("Error rating user:", error);
      setRating(0);
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  // Format date and time
  const formattedDate = ride.departure_date ? format(new Date(ride.departure_date), "MMM d") : "N/A";
  const formattedTime = ride.departure_time ? ride.departure_time.substring(0, 5) : "N/A";

  return (
    <Card3D>
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-1 bg-gradient-to-r from-electricblue to-limegreen" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">
            {ride.from_location} → {ride.to_location}
          </CardTitle>
          <StatusBadge
            status={
              ride.userRole === 'passenger'
                ? ride.bookingStatus || 'pending'
                : ride.status
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center text-sm">
                <ClockIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>{formattedTime}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold">₹{parseFloat(ride.price.toString()).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">per person</div>
            </div>
          </div>

          <div className="pt-2 border-t flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="text-sm">
                {ride.userRole === 'driver' ? 'You (Driver)' : ride.driver?.full_name}
                {ride.userRole === 'passenger' && (
                  <div className="text-xs text-muted-foreground">Driver</div>
                )}
              </div>
            </div>

            {type === "upcoming" && ride.userRole === 'driver' && (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (ride.passenger_id) {
                      navigate(`/messages?chat=${ride.passenger_id}`);
                    } else {
                      navigate(`/ride/${ride.id}`);
                    }
                  }}
                >
                  <MessageIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-cosmicviolet text-white hover:bg-cosmicviolet/90"
                  onClick={() => navigate(`/ride/${ride.id}`)}
                >
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => onUpdateRideStatus(ride.id, 'cancelled')}
                >
                  Cancel
                </Button>
              </div>
            )}

            {type === "upcoming" && ride.userRole === 'passenger' && (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (ride.driver?.id) {
                      navigate(`/messages?chat=${ride.driver.id}`);
                    } else {
                      navigate(`/ride/${ride.id}`);
                    }
                  }}
                >
                  <MessageIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-cosmicviolet text-white hover:bg-cosmicviolet/90"
                  onClick={() => navigate(`/ride/${ride.id}`)}
                >
                  Details
                </Button>
                {ride.bookingStatus === 'pending' && ride.bookingId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => onUpdateBookingStatus(ride.bookingId, 'cancelled')}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}

            {type === "completed" && (
              <div className="flex items-center">
                <div className="mr-2 text-sm">Rating:</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="focus:outline-none"
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={submittingRating || rating > 0}
                    >
                      <StarIcon
                        className={`h-4 w-4 ${(hoverRating || rating) >= star
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Card3D>
  );
}

function StatusBadge({ status }) {
  if (status === "confirmed" || status === "active") {
    return (
      <Badge className="bg-limegreen text-white">
        {status === "confirmed" ? "Confirmed" : "Active"}
      </Badge>
    );
  } else if (status === "pending") {
    return (
      <Badge className="bg-taxiyellow text-charcoal">Pending</Badge>
    );
  } else if (status === "completed") {
    return (
      <Badge className="bg-electricblue">Completed</Badge>
    );
  } else if (status === "cancelled") {
    return (
      <Badge variant="destructive">Cancelled</Badge>
    );
  }

  return null;
}

function EmptyState({ message, description }) {
  return (
    <GlassContainer className="p-10 text-center">
      <MapPinIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
      <h3 className="text-xl font-semibold">{message}</h3>
      <p className="text-muted-foreground">{description}</p>
    </GlassContainer>
  );
}
