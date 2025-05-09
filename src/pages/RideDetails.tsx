
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlassContainer } from "@/components/ui/glass-container";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  User as UserIcon,
  Star as StarIcon,
  Navigation as NavigationIcon
} from "lucide-react";
import { RideMap } from "@/components/map/RideMap";
import { RidePassengers } from "@/components/rides/RidePassengers";
import { Ride, getRideById, updateRideStatus } from "@/services/rideService";
import { Profile } from "@/services/profileService";
import { normalizeCoordinates } from "@/services/rides/types";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RatingForm } from "@/components/ratings/RatingForm";
import { UserRatings } from "@/components/ratings/UserRatings";

export default function RideDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride & { driver: Profile | null, passengers: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [userToRate, setUserToRate] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const loadRide = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const rideData = await getRideById(id);

        if (rideData) {
          setRide(rideData as (Ride & { driver: Profile | null, passengers: any[] }));
        } else {
          toast.error("Ride not found");
          navigate("/rides");
        }
      } catch (error) {
        console.error("Error fetching ride:", error);
        toast.error("Failed to load ride details");
        navigate("/rides");
      } finally {
        setIsLoading(false);
      }
    };

    loadRide();
  }, [id, navigate]);

  const handleStatusUpdate = async (status: 'active' | 'completed' | 'cancelled') => {
    if (!ride || !id) return;

    setIsUpdating(true);
    console.log(`Attempting to update ride ${id} to status: ${status}`);
    
    try {
      const success = await updateRideStatus(id, status);
      console.log(`Update status result: ${success ? 'success' : 'failure'}`);
      
      if (success) {
        setRide({
          ...ride,
          status
        });

        if (status === 'completed') {
          toast.success('Ride completed! You can now rate passengers.', {
            action: {
              label: 'Rate Now',
              onClick: () => promptRatePassenger(),
            },
          });
        } else {
          toast.success(`Ride marked as ${status}`);
        }
      } else {
        toast.error(`Failed to mark ride as ${status}`);
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast.error(`Error updating ride: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartRide = () => {
    if (!id) return;
    
    console.log("Starting ride navigation for:", id);
    toast.success('Ride started! Navigating to tracking view...');
    // Navigate to the tracking page
    navigate(`/ride/${id}/tracking`);
  };

  const promptRatePassenger = () => {
    const confirmedPassengers = ride?.passengers.filter(p => p.status === 'confirmed');
    if (confirmedPassengers && confirmedPassengers.length > 0) {
      const passenger = confirmedPassengers[0];
      if (passenger.passenger) {
        setUserToRate({
          id: passenger.passenger_id,
          name: passenger.passenger.full_name || 'Passenger'
        });
        setShowRatingDialog(true);
      }
    }
  };

  const promptRateDriver = () => {
    if (ride?.driver) {
      setUserToRate({
        id: ride.driver_id,
        name: ride.driver.full_name || 'Driver'
      });
      setShowRatingDialog(true);
    }
  };

  if (isLoading) {
    return (
      <div className="pt-6 pb-20 px-4 flex justify-center items-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electricblue"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="pt-6 pb-20 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <h1 className="text-3xl font-bold">Ride not found</h1>
        <p className="text-muted-foreground mt-2">The ride you're looking for doesn't exist or has been removed.</p>
        <Button className="mt-6" onClick={() => navigate("/rides")}>Back to My Rides</Button>
      </div>
    );
  }

  const isDriver = user?.id === ride.driver_id;
  const isCompleted = ride.status === 'completed';
  const isCancelled = ride.status === 'cancelled';
  const isActive = ride.status === 'active';

  // Extract coordinates using the normalizeCoordinates helper function
  const pickupCoordinates = normalizeCoordinates(ride?.from_coordinates);
  const dropCoordinates = normalizeCoordinates(ride?.to_coordinates);

  return (
    <div className="pt-6 pb-20 px-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ride Details</h1>

        {isDriver && isActive && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={isUpdating}
            >
              {isUpdating ? 'Processing...' : 'Cancel Ride'}
            </Button>
            <Button
              variant="outline"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-yellow-50"
              onClick={handleStartRide}
              disabled={isUpdating}
            >
              <NavigationIcon className="mr-2 h-4 w-4" />
              Start Ride
            </Button>
            <Button
              className="bg-electricblue hover:bg-electricblue/90"
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
            >
              {isUpdating ? 'Processing...' : 'Complete Ride'}
            </Button>
          </div>
        )}

        {!isDriver && isCompleted && (
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={promptRateDriver}
          >
            <StarIcon className="mr-2 h-4 w-4" />
            Rate Driver
          </Button>
        )}

        {isDriver && isCompleted && ride.passengers.some(p => p.status === 'confirmed') && (
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={promptRatePassenger}
          >
            <StarIcon className="mr-2 h-4 w-4" />
            Rate Passengers
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {ride.from_location} → {ride.to_location}
              </h2>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${ride.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : ride.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                  }`}
              >
                {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mr-2" />
                <span>
                  {format(new Date(ride.departure_date), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-muted-foreground mr-2" />
                <span>{ride.departure_time.substring(0, 5)}</span>
              </div>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-5 w-5 text-muted-foreground mr-2">
                  <span className="text-lg font-semibold">₹</span>
                </div>
                <span>₹{parseFloat(ride.price.toString()).toFixed(2)} per seat</span>
              </div>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-5 w-5 text-muted-foreground mr-2">
                  <span className="text-lg font-semibold">🪑</span>
                </div>
                <span>{ride.available_seats} {ride.available_seats === 1 ? 'seat' : 'seats'} available</span>
              </div>
            </div>

            {ride.notes && (
              <div className="mt-4">
                <h3 className="font-medium">Notes:</h3>
                <p className="text-muted-foreground mt-1">{ride.notes}</p>
              </div>
            )}
          </GlassContainer>

          <div className="h-[300px] rounded-lg overflow-hidden">
            <RideMap
              className="h-full"
              pickupLocation={pickupCoordinates ? {
                name: ride.from_location,
                coordinates: pickupCoordinates
              } : undefined}
              dropLocation={dropCoordinates ? {
                name: ride.to_location,
                coordinates: dropCoordinates
              } : undefined}
            />
          </div>

          {isDriver && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Passengers</h2>
              <RidePassengers rideId={id || ''} />
            </div>
          )}

          {ride.driver && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Driver Ratings</h2>
              <UserRatings userId={ride.driver_id} />
            </div>
          )}

        </div>

        <div>
          <GlassContainer className="p-6">
            <h2 className="text-xl font-semibold mb-4">Driver</h2>
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mr-4">
                {ride.driver?.full_name ? (
                  <span className="text-2xl font-semibold">{ride.driver.full_name.charAt(0)}</span>
                ) : (
                  <UserIcon className="h-8 w-8" />
                )}
              </div>
              <div>
                <div className="font-medium text-lg">
                  {ride.driver?.full_name || "Unknown Driver"}
                </div>
                {ride.driver?.rating !== null && ride.driver?.rating !== undefined && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(ride.driver?.rating || 0)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({ride.driver?.total_rides || 0} rides)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {ride.driver?.university && (
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">University</span>
                <div>{ride.driver.university}</div>
              </div>
            )}

            <Button
              className="mt-6 w-full bg-electricblue hover:bg-electricblue/90"
              onClick={() => {
                if (ride.driver) {
                  navigate(`/messages?chat=${ride.driver_id}`);
                }
              }}
              disabled={!ride.driver}
            >
              Message Driver
            </Button>
          </GlassContainer>

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/rides")}
            >
              Back to My Rides
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          {userToRate && (
            <RatingForm
              rideId={id || ''}
              userId={userToRate.id}
              userName={userToRate.name}
              onComplete={() => {
                setShowRatingDialog(false);
                toast.success('Rating submitted successfully');
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
