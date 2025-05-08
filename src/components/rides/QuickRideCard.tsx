import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { QuickRoute } from '@/services/rides/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickRideCardProps {
    route: QuickRoute;
    onSelect: (route: QuickRoute) => void;
}

export function QuickRideCard({ route, onSelect }: QuickRideCardProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Ride</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{route.from_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{route.to_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{route.estimated_duration} minutes</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {route.distance.toFixed(1)} km
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    onClick={() => onSelect(route)}
                >
                    Select Route
                </Button>
            </CardFooter>
        </Card>
    );
} 