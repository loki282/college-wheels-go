import { IndianRupee, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface FareEstimateProps {
    baseFare: number;
    distance: number;
    duration: number;
    passengers: number;
    onPassengersChange: (value: number) => void;
}

export function FareEstimate({
    baseFare,
    distance,
    duration,
    passengers,
    onPassengersChange
}: FareEstimateProps) {
    const calculateFare = () => {
        const distanceRate = 0.5; // per km
        const durationRate = 0.25; // per minute
        const passengerRate = 2; // per passenger

        return baseFare +
            (distance * distanceRate) +
            (duration * durationRate) +
            ((passengers - 1) * passengerRate);
    };

    const fare = calculateFare();

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Fare Estimate</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Passengers</span>
                        </div>
                        <span className="text-sm font-medium">{passengers}</span>
                    </div>
                    <Slider
                        value={[passengers]}
                        onValueChange={([value]) => onPassengersChange(value)}
                        min={1}
                        max={4}
                        step={1}
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Estimated Fare</span>
                        </div>
                        <span className="text-lg font-semibold">₹{fare.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        * Fare is an estimate and may vary based on actual route and conditions
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 