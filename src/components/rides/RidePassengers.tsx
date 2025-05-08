import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GlassContainer } from "@/components/ui/glass-container";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Check as CheckIcon, X as XIcon, MessageCircle as MessageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RidePassenger } from "@/services/rides/types";
import { getRidePassengers } from "@/services/rides/rideMutations";
import { updateBookingStatus } from "@/services/rides/bookingService";
import { toast } from "sonner";
import { useEffect } from "react";

export interface RidePassengersProps {
  rideId: string;
  onStatusUpdate?: () => void;
}

export function RidePassengers({ rideId, onStatusUpdate }: RidePassengersProps) {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<RidePassenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchPassengers = async () => {
    setIsLoading(true);
    try {
      const data = await getRidePassengers(rideId);
      setPassengers(data);
    } catch (error) {
      console.error("Error fetching passengers:", error);
      toast.error("Failed to load passengers");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPassengers();
  }, [rideId]);
  
  if (isLoading) {
    return (
      <GlassContainer className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-electricblue mx-auto"></div>
      </GlassContainer>
    );
  }
  
  if (!passengers || passengers.length === 0) {
    return (
      <GlassContainer className="p-4 text-center">
        <p className="text-muted-foreground">No passengers have booked this ride yet</p>
      </GlassContainer>
    );
  }

  const handleUpdateStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingId(bookingId);
    try {
      const success = await updateBookingStatus(bookingId, status);
      if (success) {
        toast.success(`Booking ${status === 'confirmed' ? 'approved' : 'rejected'} successfully`);
        // Refresh passenger list
        await fetchPassengers();
        
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMessagePassenger = (passengerId: string | undefined) => {
    if (!passengerId) {
      toast.error("Cannot message passenger: Passenger information is unavailable");
      return;
    }
    
    // Navigate to Messages page with chat query param to open the specific conversation
    navigate(`/messages?chat=${passengerId}`);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Passengers</h3>
      {passengers.map((passenger) => (
        <Card key={passenger.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{passenger.passenger?.full_name || "Unknown Passenger"}</div>
                  <StatusBadge status={passenger.status} />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {passenger.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleUpdateStatus(passenger.id, 'cancelled')}
                      disabled={updatingId === passenger.id}
                    >
                      <XIcon className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleUpdateStatus(passenger.id, 'confirmed')}
                      disabled={updatingId === passenger.id}
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
                
                {passenger.passenger?.id && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleMessagePassenger(passenger.passenger?.id)}
                  >
                    <MessageIcon className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") {
    return <Badge className="bg-green-500 text-white">Confirmed</Badge>;
  } else if (status === "pending") {
    return <Badge className="bg-amber-500 text-white">Pending</Badge>;
  } else if (status === "cancelled") {
    return <Badge variant="destructive">Cancelled</Badge>;
  }
  return null;
}
