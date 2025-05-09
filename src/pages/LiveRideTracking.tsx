
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RideMap } from '@/components/map/RideMap';
import { Ride, getRideById } from '@/services/rideService';
import { Profile } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { normalizeCoordinates } from '@/services/rides/types';
import { 
  Clock, 
  MapPin, 
  MessageSquare, 
  Phone, 
  ChevronUp, 
  AlertTriangle,
  Car,
  User
} from 'lucide-react';

// Ride status enum
enum RideStatus {
  DRIVER_EN_ROUTE = "Driver en route to pickup",
  ARRIVED = "Driver arrived at pickup",
  IN_PROGRESS = "Ride in progress",
  NEAR_DESTINATION = "Approaching destination",
  COMPLETED = "Ride completed"
}

export default function LiveRideTracking() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ride, setRide] = useState<Ride & { driver: Profile | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.DRIVER_EN_ROUTE);
  const [eta, setEta] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }>>([]);
  const [driverProgress, setDriverProgress] = useState(0);
  
  // Load ride details
  useEffect(() => {
    const fetchRideData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const rideData = await getRideById(id);
        
        if (!rideData) {
          toast.error("Ride not found");
          navigate("/rides");
          return;
        }
        
        setRide(rideData as Ride & { driver: Profile | null });
        
        // Initialize driver location at starting point
        const fromCoords = normalizeCoordinates(rideData.from_coordinates);
        if (fromCoords) {
          // Start driver a bit away from pickup
          setDriverLocation({
            lat: fromCoords.lat - 0.003,
            lng: fromCoords.lng - 0.002
          });
        }
        
        // Generate route preview
        if (rideData.from_coordinates && rideData.to_coordinates) {
          generateRoutePath(rideData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading ride:", error);
        toast.error("Failed to load ride information");
        navigate("/rides");
      }
    };
    
    fetchRideData();
  }, [id, navigate]);

  // Generate a simulated route path between pickup and destination
  const generateRoutePath = (rideData: Ride) => {
    const fromCoords = normalizeCoordinates(rideData.from_coordinates);
    const toCoords = normalizeCoordinates(rideData.to_coordinates);
    
    if (!fromCoords || !toCoords) return;
    
    // Create a path with waypoints between start and end
    const numPoints = 20;
    const path: Array<{ lat: number; lng: number }> = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const lat = fromCoords.lat + (toCoords.lat - fromCoords.lat) * (i / numPoints);
      const lng = fromCoords.lng + (toCoords.lng - fromCoords.lng) * (i / numPoints);
      
      // Add some variation to make the route look more realistic
      const latVariation = i > 0 && i < numPoints ? (Math.random() - 0.5) * 0.001 : 0;
      const lngVariation = i > 0 && i < numPoints ? (Math.random() - 0.5) * 0.001 : 0;
      
      path.push({
        lat: lat + latVariation,
        lng: lng + lngVariation
      });
    }
    
    setRoutePath(path);
    
    // Calculate estimated time (in minutes)
    // A very simple calculation based on distance
    const distance = calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
    const estimatedMinutes = Math.round(distance * 3); // Rough estimate: 3 minutes per km
    setEta(estimatedMinutes);
  };
  
  // Calculate distance between two points in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };
  
  // Simulate driver movement along the route
  useEffect(() => {
    if (!routePath.length || !ride) return;
    
    const fromCoords = normalizeCoordinates(ride.from_coordinates);
    if (!fromCoords) return;
    
    const simulateDriverMovement = setInterval(() => {
      setDriverProgress(prev => {
        // First phase: approaching pickup (0-25%)
        if (prev < 25) {
          // Move towards pickup location
          setDriverLocation(currentLoc => {
            if (!currentLoc) return fromCoords;
            
            // Gradually approach pickup point
            return {
              lat: currentLoc.lat + (fromCoords.lat - currentLoc.lat) * 0.1,
              lng: currentLoc.lng + (fromCoords.lng - currentLoc.lng) * 0.1
            };
          });
          
          // Update status when close to pickup
          if (prev >= 22) {
            setRideStatus(RideStatus.ARRIVED);
            // Reduce ETA to 0 as we arrive
            setEta(0);
          } else {
            // Update ETA - decrease as we get closer
            setEta(current => {
              if (current === null) return null;
              return Math.max(0, Math.floor(current * (25 - prev) / 25));
            });
          }
          
          return prev + 0.5;
        }
        // Second phase: ride in progress (25-95%)
        else if (prev < 95) {
          // After a short wait at pickup, start the ride
          if (prev === 25) {
            setRideStatus(RideStatus.IN_PROGRESS);
            // Reset ETA to destination
            if (ride) {
              // Use a default duration of 15 minutes if not specified
              setEta(ride.estimated_duration || 15);
            } else {
              // Default 15 minutes if no estimated duration
              setEta(15);
            }
          }
          
          // Update driver position along the route
          const pathIndex = Math.min(
            Math.floor(((prev - 25) / 70) * routePath.length),
            routePath.length - 1
          );
          
          setDriverLocation(routePath[pathIndex]);
          
          // Update ETA - decrease proportionally
          setEta(current => {
            if (current === null) return null;
            return Math.max(0, Math.round(current * (95 - prev) / 70));
          });
          
          // Approaching destination
          if (prev > 85) {
            setRideStatus(RideStatus.NEAR_DESTINATION);
          }
          
          return prev + 0.5;
        }
        // Final phase: ride completed
        else {
          setRideStatus(RideStatus.COMPLETED);
          setEta(0);
          clearInterval(simulateDriverMovement);
          
          // Final location is destination
          const destination = normalizeCoordinates(ride.to_coordinates);
          if (destination) {
            setDriverLocation(destination);
          }
          
          return 100;
        }
      });
    }, 1000);
    
    return () => clearInterval(simulateDriverMovement);
  }, [routePath, ride]);

  // Handle end ride
  const handleEndRide = useCallback(() => {
    if (!id) return;

    // Add real ride completion logic here
    toast.success("Ride completed successfully!");
    navigate(`/ride/${id}`);
  }, [id, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/80">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium">Loading ride information...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-background to-background/80">
        <AlertTriangle size={48} className="text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Ride Not Found</h2>
        <p className="text-muted-foreground mb-6">This ride doesn't exist or has been cancelled.</p>
        <Button onClick={() => navigate("/rides")}>
          Return to My Rides
        </Button>
      </div>
    );
  }

  const fromCoords = normalizeCoordinates(ride.from_coordinates);
  const toCoords = normalizeCoordinates(ride.to_coordinates);

  if (!fromCoords || !toCoords) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle size={48} className="text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Invalid Ride Data</h2>
        <p className="text-muted-foreground mb-6">This ride has invalid location coordinates.</p>
        <Button onClick={() => navigate("/rides")}>
          Return to My Rides
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen relative">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-background/80 backdrop-blur-lg z-10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant={rideStatus === RideStatus.COMPLETED ? "secondary" : "secondary"} className="mb-1 animate-pulse">
              {rideStatus}
            </Badge>
            <div className="flex items-center text-sm">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {eta !== null ? (
                <span>{eta > 0 ? `ETA: ${eta} min` : "Arrived"}</span>
              ) : (
                <span>Calculating ETA...</span>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-background/80 shadow-md"
            onClick={() => navigate(`/ride/${id}`)}
          >
            <MapPin className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Map Section - full height with padding for status bar and drawer handle */}
      <div className="flex-grow relative">
        <RideMap
          height="100%"
          initialCenter={driverLocation || fromCoords}
          zoom={15}
          className="h-full"
          markers={[
            // Driver marker
            ...(driverLocation ? [{
              position: driverLocation,
              title: "Driver",
              icon: "🚗"
            }] : []),
            // Pickup location marker
            {
              position: fromCoords,
              title: ride.from_location,
              icon: "🔵"
            },
            // Destination marker
            {
              position: toCoords,
              title: ride.to_location,
              icon: "🔴"
            }
          ]}
          polyline={routePath}
        />
      </div>
      
      {/* Drawer Handle - when clicked, opens the drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <div 
            className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-xl flex items-center justify-center cursor-pointer z-10"
            onClick={() => setDrawerOpen(true)}
          >
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </DrawerTrigger>
        
        <DrawerContent className="max-h-[85vh] overflow-auto">
          <div className="p-4 space-y-6">
            {/* Ride Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Pickup</span>
                <span>Drop-off</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${driverProgress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Ride Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Ride Details</h2>
              
              {/* From/To Locations */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="mt-1 mr-3 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">{ride.from_location}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 mr-3 h-6 w-6 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To</p>
                    <p className="font-medium">{ride.to_location}</p>
                  </div>
                </div>
              </div>
              
              {/* Driver Info */}
              {ride.driver && (
                <div className="p-4 rounded-lg bg-card border">
                  <h3 className="text-lg font-semibold mb-3">Driver</h3>
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-3">
                      {ride.driver.full_name ? (
                        <div className="w-full h-full flex items-center justify-center text-lg font-semibold">
                          {ride.driver.full_name.charAt(0)}
                        </div>
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{ride.driver.full_name || "Unknown Driver"}</p>
                      <p className="text-sm text-muted-foreground">
                        {ride.driver.rating ? `★ ${ride.driver.rating.toFixed(1)}` : "No ratings yet"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Vehicle Info - this would come from a real vehicle data model */}
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <Car className="h-4 w-4 mr-1" />
                    <span>Honda Civic • Gray • KA-01-AB-1234</span>
                  </div>
                  
                  {/* Contact Buttons */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center" 
                      onClick={() => {
                        if (ride.driver) {
                          navigate(`/messages?chat=${ride.driver_id}`);
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center"
                      onClick={() => {
                        if (ride.driver?.phone_number) {
                          window.location.href = `tel:${ride.driver.phone_number}`;
                        } else {
                          toast.error("Phone number not available");
                        }
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  toast("Emergency contacts notified", {
                    description: "Campus security has been alerted",
                  });
                }}
              >
                Emergency
              </Button>
              
              {rideStatus === RideStatus.COMPLETED ? (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleEndRide}
                >
                  Complete Ride
                </Button>
              ) : (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    toast("Please contact driver before cancelling", {
                      action: {
                        label: "Message Driver",
                        onClick: () => {
                          if (ride.driver) {
                            navigate(`/messages?chat=${ride.driver_id}`);
                          }
                        },
                      },
                    });
                  }}
                >
                  Cancel Ride
                </Button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
