import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card3D } from "@/components/ui/card-3d";
import { GlassContainer } from "@/components/ui/glass-container";
import { useNavigate } from "react-router-dom";
import {
    MapPin as MapPinIcon,
    Calendar as CalendarIcon,
    Clock as ClockIcon,
    User as UserIcon,
    Car as CarIcon,
    Star as StarIcon,
    MessageCircle as MessageIcon
} from "lucide-react";
import { toast } from "sonner";
import { Profile } from "@/services/profileService";
import { Ride } from "@/services/rideService";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

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

interface ExpandedRideCardProps {
    isOpen: boolean;
    onClose: () => void;
    ride: Ride & { driver: Profile | null };
    onBookRide?: (ride: Ride & { driver: Profile | null }) => void;
}

export function ExpandedRideCard({ isOpen, onClose, ride, onBookRide }: ExpandedRideCardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isDriversRide = user?.id === ride.driver_id;

    const handleBookRide = () => {
        if (isDriversRide) {
            toast.error("You cannot book your own ride");
            return;
        }

        if (onBookRide) {
            onBookRide(ride);
        } else {
            toast.success("Ride booked successfully!");
        }
        onClose();
    };

    const handleMessageDriver = () => {
        if (!ride.driver?.id) {
            toast.error("Cannot message driver: Driver information is unavailable");
            return;
        }

        navigate(`/messages?userId=${ride.driver.id}`);
        onClose();
    };

    // Safely handle potentially null driver data
    const driverName = ride.driver?.full_name || "Unknown Driver";
    const driverRating = ride.driver?.rating || 0;
    const driverTotalRides = ride.driver?.total_rides || 0;
    const driverUniversity = ride.driver?.university || 'Not specified';
    const driverRole = ride.driver?.role
        ? ride.driver.role.charAt(0).toUpperCase() + ride.driver.role.slice(1)
        : 'Unknown';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden">
                <div className="relative">
                    <Card3D>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">{formatLocationName(ride.from_location)} → {formatLocationName(ride.to_location)}</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center text-muted-foreground">
                                            <CalendarIcon className="h-4 w-4 mr-1" />
                                            {format(new Date(ride.departure_date), "MMM d, yyyy")}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <ClockIcon className="h-4 w-4 mr-1" />
                                            {ride.departure_time.substring(0, 5)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-electricblue">₹{parseFloat(ride.price.toString()).toFixed(2)}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassContainer className="p-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <UserIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{driverName}</div>
                                            <div className="flex items-center gap-1">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarIcon
                                                            key={i}
                                                            className={`h-4 w-4 ${i < Math.floor(driverRating)
                                                                ? "fill-taxiyellow text-taxiyellow"
                                                                : "text-muted"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    ({driverTotalRides} rides)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Driver Info</div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">University:</span>{" "}
                                                {driverUniversity}
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Role:</span>{" "}
                                                {driverRole}
                                            </div>
                                        </div>
                                    </div>
                                </GlassContainer>

                                <GlassContainer className="p-4">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium mb-2">Pickup Location</div>
                                            <div className="flex items-center text-muted-foreground">
                                                <MapPinIcon className="h-4 w-4 mr-2" />
                                                {formatLocationName(ride.from_location)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium mb-2">Drop-off Location</div>
                                            <div className="flex items-center text-muted-foreground">
                                                <MapPinIcon className="h-4 w-4 mr-2" />
                                                {formatLocationName(ride.to_location)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium mb-2">Available Seats</div>
                                            <div className="flex items-center text-muted-foreground">
                                                <CarIcon className="h-4 w-4 mr-2" />
                                                {ride.available_seats} seats available
                                            </div>
                                        </div>
                                    </div>
                                </GlassContainer>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    className="text-cosmicviolet border-cosmicviolet hover:bg-cosmicviolet/10 hover:text-foreground"
                                    onClick={handleMessageDriver}
                                    disabled={!ride.driver?.id || isDriversRide}
                                >
                                    <MessageIcon className="h-4 w-4 mr-2" />
                                    Message Driver
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-cosmicviolet hover:bg-cosmicviolet/80 hover:shadow-lg transition-all"
                                    onClick={handleBookRide}
                                    disabled={isDriversRide}
                                >
                                    {isDriversRide ? 'Your Ride' : 'Book Ride'}
                                </Button>
                            </div>
                        </div>
                    </Card3D>
                </div>
            </DialogContent>
        </Dialog>
    );
}
