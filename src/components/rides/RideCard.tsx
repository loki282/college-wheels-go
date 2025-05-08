import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MessageSquare as MessageIcon,
  Star as StarIcon,
  User as UserIcon,
} from "lucide-react";
import { rateUser } from "@/services/ratingService";

const formatLocationName = (location: string) => {
  if (!location) return "";
  const parts = location.split(',').map(p => p.trim());
  // Keywords for well-known places
  const keywords = ["University", "Mall", "Center", "Campus", "Hostel", "Station", "Airport"];
  if (keywords.some(keyword => parts[0].toLowerCase().includes(keyword.toLowerCase()))) {
    return parts[0];
  }
  // If the first part is a number (like a house number), skip it
  if (!isNaN(Number(parts[0].split(' ')[0])) && parts.length > 1) {
    return parts[1];
  }
  // Otherwise, return the first two parts for more context
  return parts.slice(0, 2).join(', ');
};

interface RideCardProps {
  ride: any;
  type: "upcoming" | "completed" | "cancelled";
  onUpdateRideStatus: (rideId: string, status: 'completed' | 'cancelled') => Promise<void>;
  onUpdateBookingStatus: (bookingId: string, status: 'confirmed' | 'cancelled') => Promise<void>;
}

export function RideCard({ ride, type, onUpdateRideStatus, onUpdateBookingStatus }: RideCardProps) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const handleRating = async (newRating: number) => {
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
    <Card className="overflow-hidden border-none shadow-md">
      <div className="h-1 bg-gradient-to-r from-electricblue to-limegreen" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">
          {formatLocationName(ride.from_location)} → {formatLocationName(ride.to_location)}
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
  );
}

function StatusBadge({ status }: { status: string }) {
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
