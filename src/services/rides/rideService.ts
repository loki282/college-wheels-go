
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Ride, RideSchedule, RideShare, QuickRoute, RoutePreview } from './types';

// Quick Ride Functions
export async function getQuickRoutes() {
    try {
        // This table doesn't exist yet in the database schema
        // Return empty array for now to prevent errors
        console.log('Attempting to fetch quick routes, but table may not exist yet');
        return [] as QuickRoute[];
        
        /* Uncomment when table exists
        const { data, error } = await supabase
            .from('quick_routes')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;
        return data as QuickRoute[];
        */
    } catch (error) {
        console.error('Error fetching quick routes:', error);
        toast.error('Failed to load quick routes');
        return [];
    }
}

export async function createQuickRide(route: Omit<QuickRoute, 'id' | 'created_at' | 'updated_at'>) {
    try {
        // This table doesn't exist yet in the database schema
        console.log('Attempting to create quick route, but table may not exist yet');
        toast.error('Quick routes feature is not yet available');
        return null;
        
        /* Uncomment when table exists
        const { data, error } = await supabase
            .from('quick_routes')
            .insert(route)
            .select()
            .single();

        if (error) throw error;
        return data as QuickRoute;
        */
    } catch (error) {
        console.error('Error creating quick route:', error);
        toast.error('Failed to create quick route');
        return null;
    }
}

// Scheduled Ride Functions
export async function createScheduledRide(ride: Partial<Ride>, schedule: Omit<RideSchedule, 'id' | 'created_at' | 'updated_at'>) {
    try {
        // This table doesn't exist yet in the database schema
        console.log('Attempting to create scheduled ride, but related tables may not exist yet');
        toast.error('Scheduled rides feature is not yet available');
        return null;
        
        /* Uncomment when tables exist
        const { data: rideData, error: rideError } = await supabase
            .from('rides')
            .insert({
                ...ride,
                is_scheduled: true,
                scheduled_for: schedule.schedule_dates?.[0]
            })
            .select()
            .single();

        if (rideError) throw rideError;

        const { data: scheduleData, error: scheduleError } = await supabase
            .from('ride_schedules')
            .insert({
                ...schedule,
                ride_id: rideData.id
            })
            .select()
            .single();

        if (scheduleError) throw scheduleError;

        return { ride: rideData, schedule: scheduleData };
        */
    } catch (error) {
        console.error('Error creating scheduled ride:', error);
        toast.error('Failed to create scheduled ride');
        return null;
    }
}

export async function getScheduledRides() {
    try {
        // This table doesn't exist yet in the database schema
        console.log('Attempting to fetch scheduled rides, but related tables may not exist yet');
        return [];
        
        /* Uncomment when tables exist
        const { data, error } = await supabase
            .from('rides')
            .select(`
                *,
                schedule:ride_schedules(*)
            `)
            .eq('is_scheduled', true)
            .order('scheduled_for', { ascending: true });

        if (error) throw error;
        return data;
        */
    } catch (error) {
        console.error('Error fetching scheduled rides:', error);
        toast.error('Failed to load scheduled rides');
        return [];
    }
}

// Ride Sharing Functions
export async function shareRide(rideId: string, sharedWithId: string) {
    try {
        // This table doesn't exist yet in the database schema
        console.log('Attempting to share ride, but related tables may not exist yet');
        toast.error('Ride sharing feature is not yet available');
        return null;
        
        /* Uncomment when tables exist
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
            toast.error('You must be logged in to share rides');
            return null;
        }

        const { data, error } = await supabase
            .from('ride_shares')
            .insert({
                ride_id: rideId,
                sharer_id: sessionData.session.user.id,
                shared_with_id: sharedWithId
            })
            .select()
            .single();

        if (error) throw error;
        return data as RideShare;
        */
    } catch (error) {
        console.error('Error sharing ride:', error);
        toast.error('Failed to share ride');
        return null;
    }
}

export async function getSharedRides() {
    try {
        // This table doesn't exist yet in the database schema
        console.log('Attempting to fetch shared rides, but related tables may not exist yet');
        return [];
        
        /* Uncomment when tables exist
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) return [];

        const { data, error } = await supabase
            .from('ride_shares')
            .select(`
                *,
                ride:rides(*)
            `)
            .or(`sharer_id.eq.${sessionData.session.user.id},shared_with_id.eq.${sessionData.session.user.id}`);

        if (error) throw error;
        return data;
        */
    } catch (error) {
        console.error('Error fetching shared rides:', error);
        toast.error('Failed to load shared rides');
        return [];
    }
}

// Route Preview Functions
export async function getRoutePreview(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
    try {
        console.log('Getting route preview with coordinates:', { from, to });

        if (!from || !to || !from.lat || !from.lng || !to.lat || !to.lng) {
            throw new Error('Invalid coordinates provided');
        }

        if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded');
        }

        // Log the API key being used
        const script = document.querySelector('script[src*="maps.googleapis.com"]');
        if (script) {
            const src = script.getAttribute('src');
            console.log('Google Maps API script source:', src);
        }

        const service = new google.maps.DirectionsService();
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            service.route(
                {
                    origin: from,
                    destination: to,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === 'OK' && result) {
                        console.log('Route calculated successfully:', {
                            route: result.routes[0],
                            legs: result.routes[0].legs.map(leg => ({
                                distance: leg.distance,
                                duration: leg.duration
                            }))
                        });
                        resolve(result);
                    } else {
                        console.error('Route calculation failed:', {
                            status,
                            statusText: google.maps.DirectionsStatus[status],
                            error: new Error(`Failed to calculate route: ${status}`)
                        });
                        reject(new Error(`Failed to calculate route: ${status} - ${google.maps.DirectionsStatus[status]}`));
                    }
                }
            );
        });

        // Calculate total distance in kilometers
        const distanceInMeters = result.routes[0].legs.reduce((total, leg) => {
            const legDistance = leg.distance?.value || 0;
            console.log('Leg distance:', {
                leg,
                distance: legDistance,
                text: leg.distance?.text
            });
            return total + legDistance;
        }, 0);

        const distance = distanceInMeters / 1000; // Convert meters to kilometers
        console.log('Total distance calculation:', {
            meters: distanceInMeters,
            kilometers: distance
        });

        // Calculate total duration in minutes
        const durationInSeconds = result.routes[0].legs.reduce((total, leg) => {
            const legDuration = leg.duration?.value || 0;
            console.log('Leg duration:', {
                leg,
                duration: legDuration,
                text: leg.duration?.text
            });
            return total + legDuration;
        }, 0);

        const duration = durationInSeconds / 60; // Convert seconds to minutes
        console.log('Total duration calculation:', {
            seconds: durationInSeconds,
            minutes: duration
        });

        if (!result.routes[0].overview_polyline) {
            throw new Error('No polyline data in route result');
        }

        return {
            distance,
            duration: Math.round(duration),
            polyline: {
                encodedPath: result.routes[0].overview_polyline,
                strokeColor: '#6366f1',
                strokeWeight: 5
            }
        };
    } catch (error) {
        console.error('Error in getRoutePreview:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

// Fare Estimation Functions
export async function estimateFare(distance: number, duration: number, passengers: number = 1) {
    try {
        // Updated fare calculation with much more affordable rates
        const baseFare = 5; // Very low base fare
        const distanceRate = 0.5; // Reduced per km rate
        const durationRate = 0.25; // Reduced per minute rate
        const passengerRate = 2; // Reduced per passenger rate

        console.log('Fare calculation inputs:', {
            distance,
            duration,
            passengers,
            baseFare,
            distanceRate,
            durationRate,
            passengerRate
        });

        const distanceCost = distance * distanceRate;
        const durationCost = duration * durationRate;
        const passengerCost = (passengers - 1) * passengerRate;

        console.log('Fare calculation breakdown:', {
            distanceCost,
            durationCost,
            passengerCost
        });

        const fare = baseFare + distanceCost + durationCost + passengerCost;
        console.log('Final fare calculation:', {
            baseFare,
            distanceCost,
            durationCost,
            passengerCost,
            total: fare
        });

        return Math.round(fare);
    } catch (error) {
        console.error('Error estimating fare:', error);
        return null;
    }
} 
