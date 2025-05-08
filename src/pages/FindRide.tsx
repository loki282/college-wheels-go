
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassContainer } from "@/components/ui/glass-container";
import { Card3D } from "@/components/ui/card-3d";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RideMap } from "@/components/map/RideMap";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
  Search as SearchIcon,
  User as UserIcon,
  Star as StarIcon,
  Clock as ClockIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { ExpandedRideCard } from "@/components/rides/ExpandedRideCard";
import { Ride } from "@/services/rides/types";
import { Profile } from "@/services/profileService";
import { getAvailableRides } from "@/services/rides/rideQueries";
import { bookRide } from "@/services/rides/bookingService";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { LocationSearch } from "@/components/rides/LocationSearch";

interface Location {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export default function FindRide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [from, setFrom] = useState<Location | null>(null);
  const [to, setTo] = useState<Location | null>(null);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSearching, setIsSearching] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showExpandedCard, setShowExpandedCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    const loadRides = async () => {
      setIsLoading(true);
      try {
        const availableRides = await getAvailableRides();
        setRides(availableRides || []);
        setFilteredRides(availableRides || []);
      } catch (error) {
        console.error("Error loading rides:", error);
        toast.error("Failed to load available rides");
        setRides([]);
        setFilteredRides([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRides();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    const filtered = (rides || []).filter(ride => {
      if (!ride) return false;

      const rideFrom = (ride.from_location || "").toLowerCase();
      const rideTo = (ride.to_location || "").toLowerCase();

      const fromMatch = !fromValue
        ? true
        : rideFrom.toLowerCase().includes(fromValue.toLowerCase());

      const toMatch = !toValue
        ? true
        : rideTo.toLowerCase().includes(toValue.toLowerCase());

      let matchesDate = true;
      if (date && ride.departure_date) {
        const rideDate = new Date(ride.departure_date);
        matchesDate = rideDate.toDateString() === date.toDateString();
      }

      return fromMatch && toMatch && matchesDate;
    });

    setFilteredRides(filtered);
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleRideSelect = (ride: Ride) => {
    if (!ride) return;
    setSelectedRide(ride);
    setShowExpandedCard(true);
  };

  const handleBookRide = async (ride: Ride) => {
    if (!ride) return;

    if (!user) {
      toast.error("You need to sign in to book a ride");
      return navigate("/login");
    }

    if (user.id === ride.driver_id) {
      toast.error("You cannot book your own ride");
      return;
    }

    try {
      const result = await bookRide(ride.id);
      if (result) {
        toast.success("Ride booking request sent");
        navigate("/rides");
      }
    } catch (error) {
      console.error("Error booking ride:", error);
      toast.error("Failed to book ride");
    }
  };

  // Auto-search when fields change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const e = { preventDefault: () => { } } as React.FormEvent;
      handleSearch(e);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fromValue, toValue, date]);

  return (
    <div className="pt-6 pb-20 px-4 min-h-screen flex flex-col animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Find a Ride</h1>
        <p className="text-muted-foreground">Search for rides to your destination</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2">
          <div className="relative h-[400px] rounded-lg overflow-hidden">
            <RideMap
              className="h-full"
              showUserLocation={true}
              initialCenter={from?.coordinates ? from.coordinates : undefined}
            />
            <div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 cursor-pointer hover:bg-background/90 transition-all"
              onClick={() => setIsFormExpanded(!isFormExpanded)}
            >
              {isFormExpanded ? (
                <ChevronDownIcon className="h-6 w-6" />
              ) : (
                <ChevronUpIcon className="h-6 w-6" />
              )}
            </div>
          </div>

          <div
            className={`mt-4 transition-all duration-300 ${isFormExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <Card3D>
              <GlassContainer className="p-5">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from">From</Label>
                      <LocationSearch
                        value={fromValue}
                        onChange={(value) => setFromValue(value)}
                        onLocationSelect={(location) => {
                          setFrom(location);
                          setFromValue(location.name);
                        }}
                        placeholder="Pick-up location"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="to">To</Label>
                      <LocationSearch
                        value={toValue}
                        onChange={(value) => setToValue(value)}
                        onLocationSelect={(location) => {
                          setTo(location);
                          setToValue(location.name);
                        }}
                        placeholder="Drop-off location"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            setDate(newDate);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-cosmicviolet hover:bg-cosmicviolet/80 hover:shadow-lg transition-all text-white"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      "Searching..."
                    ) : (
                      <>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Search Rides
                      </>
                    )}
                  </Button>
                </form>
              </GlassContainer>
            </Card3D>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Available Rides</h2>
            <div className="text-sm text-muted-foreground">
              {(filteredRides || []).length} rides found
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cosmicviolet"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {(filteredRides || []).length > 0 ? (
                filteredRides.map((ride) => (
                  <Card3D key={ride?.id}>
                    <div
                      className="cursor-pointer"
                      onClick={() => handleRideSelect(ride)}
                    >
                      <GlassContainer className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{ride?.from_location || "Unknown"} → {ride?.to_location || "Unknown"}</div>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {ride?.departure_date ? format(new Date(ride.departure_date), "MMM d") : "Unknown date"}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {ride?.departure_time ? ride.departure_time.substring(0, 5) : "Unknown time"}
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-electricblue">
                            ₹{ride?.price !== undefined ? parseFloat(ride.price.toString()).toFixed(2) : "0.00"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <UserIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {ride?.driver?.full_name || "Unknown Driver"}
                              </div>
                              {ride?.driver?.rating !== null && ride?.driver?.rating !== undefined && (
                                <div className="flex items-center gap-1">
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`h-3 w-3 ${i < Math.floor(ride?.driver?.rating || 0)
                                          ? "fill-taxiyellow text-taxiyellow"
                                          : "text-muted"
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    ({ride?.driver?.total_rides || 0} rides)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            className="bg-cosmicviolet hover:bg-cosmicviolet/80 hover:shadow-lg transition-all text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookRide(ride);
                            }}
                            disabled={user?.id === ride?.driver_id}
                          >
                            {user?.id === ride?.driver_id ? 'Your Ride' : 'Book Now'}
                          </Button>
                        </div>
                      </GlassContainer>
                    </div>
                  </Card3D>
                ))
              ) : (
                <GlassContainer className="p-6 text-center">
                  <div className="mb-4 text-muted-foreground">
                    <MapPinIcon className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No rides found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search filters or check back later for new rides
                  </p>
                </GlassContainer>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedRide && (
        <ExpandedRideCard
          isOpen={showExpandedCard}
          onClose={() => {
            setShowExpandedCard(false);
            setSelectedRide(null);
          }}
          ride={selectedRide}
          onBookRide={handleBookRide}
        />
      )}
    </div>
  );
}
