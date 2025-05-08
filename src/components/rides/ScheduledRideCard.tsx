import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Ride, RideSchedule } from '@/services/rides/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ScheduledRideCardProps {
    ride: Ride & { schedule?: RideSchedule };
    onCancel: (ride: Ride) => void;
}

export function ScheduledRideCard({ ride, onCancel }: ScheduledRideCardProps) {
    const formatSchedule = () => {
        if (!ride.schedule) return null;

        switch (ride.schedule.schedule_type) {
            case 'daily':
                return 'Daily';
            case 'weekly':
                return `Weekly on ${ride.schedule.schedule_days?.join(', ')}`;
            case 'custom':
                return ride.schedule.schedule_dates?.map(date =>
                    format(new Date(date), 'MMM d, yyyy')
                ).join(', ');
            default:
                return null;
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Scheduled Ride</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ride.from_location} → {ride.to_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {ride.scheduled_for ? format(new Date(ride.scheduled_for), 'MMM d, yyyy') : formatSchedule()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ride.departure_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {ride.available_seats} of {ride.max_passengers} seats available
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
                    onClick={() => onCancel(ride)}
                >
                    Cancel
                </Button>
                <Button className="flex-1">
                    Edit
                </Button>
            </CardFooter>
        </Card>
    );
} 