import { Share2, MapPin, Clock, Users } from 'lucide-react';
import { Ride, RideShare } from '@/services/rides/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface RideShareCardProps {
    ride: Ride;
    share: RideShare;
    onAccept: (share: RideShare) => void;
    onReject: (share: RideShare) => void;
}

export function RideShareCard({ ride, share, onAccept, onReject }: RideShareCardProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Shared Ride</CardTitle>
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ride.from_location} → {ride.to_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {format(new Date(ride.departure_date), 'MMM d, yyyy')} at {ride.departure_time}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {ride.shared_passengers} sharing this ride
                        </span>
                    </div>
                    {ride.notes && (
                        <div className="text-sm text-muted-foreground">
                            {ride.notes}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onReject(share)}
                >
                    Decline
                </Button>
                <Button
                    className="flex-1"
                    onClick={() => onAccept(share)}
                >
                    Accept
                </Button>
            </CardFooter>
        </Card>
    );
} 