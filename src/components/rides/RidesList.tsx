
import { Card3D } from "@/components/ui/card-3d";
import { RideCard } from "./RideCard";
import { EmptyState } from "./EmptyState";
import { toast } from "sonner";

interface RidesListProps {
  rides: any[];
  type: "upcoming" | "completed" | "cancelled";
  onUpdateRideStatus: (rideId: string, status: 'completed' | 'cancelled') => Promise<void>;
  onUpdateBookingStatus: (bookingId: string, status: 'confirmed' | 'cancelled') => Promise<void>;
}

export function RidesList({ rides, type, onUpdateRideStatus, onUpdateBookingStatus }: RidesListProps) {
  if (rides.length === 0) {
    return (
      <EmptyState 
        message={`No ${type} rides`} 
        description={`Your ${type} rides will appear here`} 
      />
    );
  }

  const handleUpdateRideStatus = async (rideId: string, status: 'completed' | 'cancelled') => {
    try {
      console.log(`RidesList: Updating ride status ${rideId} to ${status}`);
      await onUpdateRideStatus(rideId, status);
      toast.success(`Ride ${status === 'completed' ? 'completed' : 'cancelled'} successfully`);
    } catch (error) {
      console.error(`Error updating ride ${rideId} to ${status}:`, error);
      toast.error(`Failed to update ride status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      console.log(`RidesList: Updating booking status ${bookingId} to ${status}`);
      await onUpdateBookingStatus(bookingId, status);
      toast.success(`Booking ${status === 'confirmed' ? 'confirmed' : 'cancelled'} successfully`);
    } catch (error) {
      console.error(`Error updating booking ${bookingId} to ${status}:`, error);
      toast.error(`Failed to update booking status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-4">
      {rides.map(ride => (
        <Card3D key={ride.id}>
          <RideCard
            ride={ride}
            type={type}
            onUpdateRideStatus={handleUpdateRideStatus}
            onUpdateBookingStatus={handleUpdateBookingStatus}
          />
        </Card3D>
      ))}
    </div>
  );
}
