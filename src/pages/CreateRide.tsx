import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  Clock as ClockIcon,
  Car as CarIcon,
  Plus as PlusIcon,
  List as ListIcon,
  Calendar as CalendarIcon
} from "lucide-react";
import { GlassContainer } from "@/components/ui/glass-container";
import { toast } from "sonner";
import { Card3D } from "@/components/ui/card-3d";
import { getRoutePreview, estimateFare, createScheduledRide, createQuickRide } from "@/services/rides/rideService";
import { createRide } from "@/services/rides/rideMutations";
import { useAuth } from "@/hooks/useAuth";
import { LocationSearch } from "@/components/rides/LocationSearch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoutePreview } from "@/components/rides/RoutePreview";
import { FareEstimate } from "@/components/rides/FareEstimate";
import type { RideSchedule, QuickRoute, Ride, RoutePreview as RoutePreviewType } from '@/services/rides/types';

interface Location {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface FormData {
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  price: number;
  notes: string;
  is_quick_ride: boolean;
  is_shared: boolean;
  max_passengers: number;
  from_coordinates: { lat: number; lng: number };
  to_coordinates: { lat: number; lng: number };
}

export default function CreateRide() {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<FormData>({
    from_location: '',
    to_location: '',
    departure_date: format(new Date(), 'yyyy-MM-dd'),
    departure_time: format(new Date(), 'HH:mm'),
    available_seats: 1,
    price: 0,
    notes: '',
    is_quick_ride: false,
    is_shared: false,
    max_passengers: 1,
    from_coordinates: { lat: 0, lng: 0 },
    to_coordinates: { lat: 0, lng: 0 }
  });
  const [routePreview, setRoutePreview] = useState<RoutePreviewType | null>(null);
  const [fareEstimate, setFareEstimate] = useState<number>(0);
  const [scheduleData, setScheduleData] = useState<Omit<RideSchedule, 'id' | 'created_at' | 'updated_at'>>({
    ride_id: '',
    schedule_type: 'daily',
    schedule_days: [],
    schedule_dates: []
  });

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      toast.error('You must be logged in to create a ride');
      navigate('/login');
      return;
    }

    if (!profile) {
      toast.error('Profile information not found');
      navigate('/profile');
      return;
    }

    if (profile.role !== 'driver' && profile.role !== 'both') {
      toast.error('Only drivers can create rides');
      navigate('/');
    }
  }, [user, profile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cosmicviolet"></div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setScheduleData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoutePreview = async () => {
    if (!fromLocation?.coordinates || !toLocation?.coordinates) {
      toast.error('Please select both departure and destination locations');
      return;
    }

    try {
      console.log('Getting route preview with locations:', {
        from: fromLocation.coordinates,
        to: toLocation.coordinates
      });

      const preview = await getRoutePreview(
        fromLocation.coordinates,
        toLocation.coordinates
      );

      if (!preview) {
        throw new Error('Failed to get route preview');
      }

      setRoutePreview(preview);

      const fare = await estimateFare(
        preview.distance,
        preview.duration,
        formData.available_seats
      );
      setFareEstimate(fare);
      setFormData(prev => ({ ...prev, price: fare }));
    } catch (error) {
      console.error('Error in handleRoutePreview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get route preview');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (formData.is_quick_ride) {
        if (!fromLocation?.coordinates || !toLocation?.coordinates || !routePreview) {
          toast.error('Please select both locations and preview the route first');
          return;
        }

        const quickRide = await createQuickRide({
          from_location: formData.from_location,
          to_location: formData.to_location,
          from_coordinates: `${fromLocation.coordinates.lat},${fromLocation.coordinates.lng}`,
          to_coordinates: `${toLocation.coordinates.lat},${toLocation.coordinates.lng}`,
          distance: routePreview.distance,
          estimated_duration: routePreview.duration,
          is_active: true
        });

        if (quickRide) {
          toast.success('Quick ride created successfully');
          navigate(`/rides/${quickRide.id}`);
        }
      } else if (scheduleData.schedule_type) {
        const ride = await createRide({
          from_location: formData.from_location,
          to_location: formData.to_location,
          from_coordinates: formData.from_coordinates,
          to_coordinates: formData.to_coordinates,
          departure_date: formData.departure_date,
          departure_time: formData.departure_time,
          available_seats: formData.available_seats,
          price: formData.price,
          notes: formData.notes
        });

        if (ride) {
          await createScheduledRide(ride, { ...scheduleData, ride_id: ride.id });
          toast.success('Scheduled ride created successfully');
          navigate(`/rides/${ride.id}`);
        }
      } else {
        const ride = await createRide({
          from_location: formData.from_location,
          to_location: formData.to_location,
          from_coordinates: formData.from_coordinates,
          to_coordinates: formData.to_coordinates,
          departure_date: formData.departure_date,
          departure_time: formData.departure_time,
          available_seats: formData.available_seats,
          price: formData.price,
          notes: formData.notes
        });

        if (ride) {
          toast.success('Ride created successfully');
          navigate(`/rides/${ride.id}`);
        }
      }
    } catch (error) {
      console.error('Error creating ride:', error);
      toast.error('Failed to create ride');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card3D>
        <CardContent className="p-6">
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick">Quick Ride</TabsTrigger>
              <TabsTrigger value="regular">Regular Ride</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Ride</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure Location</label>
                  <LocationSearch
                    value={fromLocation?.name || ""}
                    onLocationSelect={(location) => {
                      setFromLocation(location);
                      setFormData(prev => ({
                        ...prev,
                        from_location: location.name,
                        from_coordinates: location.coordinates
                      }));
                    }}
                    placeholder="e.g. Campus Center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination</label>
                  <LocationSearch
                    value={toLocation?.name || ""}
                    onLocationSelect={(location) => {
                      setToLocation(location);
                      setFormData(prev => ({
                        ...prev,
                        to_location: location.name,
                        to_coordinates: location.coordinates
                      }));
                    }}
                    placeholder="e.g. Downtown Mall"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleRoutePreview}
                  className="w-full"
                >
                  Preview Route
                </Button>

                {routePreview && (
                  <RoutePreview
                    from={formData.from_location}
                    to={formData.to_location}
                    preview={routePreview}
                    fromCoordinates={fromLocation?.coordinates}
                    toCoordinates={toLocation?.coordinates}
                  />
                )}

                {fareEstimate > 0 && (
                  <FareEstimate
                    baseFare={fareEstimate}
                    distance={routePreview?.distance || 0}
                    duration={routePreview?.duration || 0}
                    passengers={formData.available_seats}
                    onPassengersChange={(value) => {
                      setFormData(prev => ({ ...prev, available_seats: value }));
                      estimateFare(
                        routePreview?.distance || 0,
                        routePreview?.duration || 0,
                        value
                      ).then(setFareEstimate);
                    }}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full bg-cosmicviolet hover:bg-cosmicviolet/80 hover:shadow-lg transition-all text-white"
                >
                  Create Quick Ride
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="regular" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure Location</label>
                  <LocationSearch
                    value={fromLocation?.name || ""}
                    onLocationSelect={(location) => {
                      setFromLocation(location);
                      setFormData(prev => ({
                        ...prev,
                        from_location: location.name,
                        from_coordinates: location.coordinates
                      }));
                    }}
                    placeholder="e.g. Campus Center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination</label>
                  <LocationSearch
                    value={toLocation?.name || ""}
                    onLocationSelect={(location) => {
                      setToLocation(location);
                      setFormData(prev => ({
                        ...prev,
                        to_location: location.name,
                        to_coordinates: location.coordinates
                      }));
                    }}
                    placeholder="e.g. Downtown Mall"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Departure Date</label>
                    <Input
                      type="date"
                      name="departure_date"
                      value={formData.departure_date}
                      onChange={handleInputChange}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Departure Time</label>
                    <Input
                      type="time"
                      name="departure_time"
                      value={formData.departure_time}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available Seats</label>
                    <Input
                      type="number"
                      name="available_seats"
                      value={formData.available_seats}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price per Seat</label>
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information for passengers..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-cosmicviolet hover:bg-cosmicviolet/80 hover:shadow-lg transition-all text-white"
                >
                  Create Regular Ride
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure Location</label>
                  <LocationSearch
                    value={fromLocation?.name || ""}
                    onLocationSelect={(location) => {
                      setFromLocation(location);
                      setFormData(prev => ({
                        ...prev,
                        from_location: location.name,
                        from_coordinates: location.coordinates
                      }));
                    }}
                    placeholder="e.g. Campus Center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination</label>
                  <LocationSearch
                    value={toLocation?.name || ""}
                    onLocationSelect={(location) => {
                      setToLocation(location);
                      setFormData(prev => ({
                        ...prev,
                        to_location: location.name,
                        to_coordinates: location.coordinates
                      }));
                    }}
                    placeholder="e.g. Downtown Mall"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schedule Type</label>
                    <select
                      name="schedule_type"
                      value={scheduleData.schedule_type}
                      onChange={handleScheduleChange}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Departure Time</label>
                    <Input
                      type="time"
                      name="departure_time"
                      value={formData.departure_time}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available Seats</label>
                    <Input
                      type="number"
                      name="available_seats"
                      value={formData.available_seats}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price per Seat</label>
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information for passengers..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-cosmicviolet hover:bg-cosmicviolet/80 hover:shadow-lg transition-all text-white"
                >
                  Create Scheduled Ride
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card3D>
    </div>
  );
}
