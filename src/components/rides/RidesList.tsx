
import { Card3D } from "@/components/ui/card-3d";
import { RideCard } from "./RideCard";
import { EmptyState } from "./EmptyState";

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

  return (
    <div className="space-y-4">
      {rides.map(ride => (
        <Card3D key={ride.id}>
          <RideCard
            ride={ride}
            type={type}
            onUpdateRideStatus={onUpdateRideStatus}
            onUpdateBookingStatus={onUpdateBookingStatus}
          />
        </Card3D>
      ))}
    </div>
  );
}
