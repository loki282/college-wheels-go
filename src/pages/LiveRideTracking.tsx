
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft, Navigation2, Phone, MessageCircle, X, RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RideMap } from "@/components/map/RideMap";
import { initMap, createDriverMarker, animateMarker, createOrbitalRoute } from "@/components/map/initMap";
import { Ride, Coordinates, LiveRideStatus } from "@/services/rides/types";
import { getRideById } from "@/services/rideService";

const LiveRideTracking: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [statusText, setStatusText] = useState<string>("Connecting...");
  const [rideStatus, setRideStatus] = useState<LiveRideStatus | null>(null);
  const [driverLocation, setDriverLocation] = useState<Coordinates | null>(null);
  const [isRideActive, setIsRideActive] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const markerAnimationInProgress = useRef<boolean>(false);
  
  // Fetch ride details
  const { data: ride, isLoading, error } = useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => getRideById(rideId as string),
    enabled: !!rideId,
  });

  // Mock function to get driver location (replace with real API call)
  const fetchDriverLocation = async (): Promise<Coordinates | null> => {
    // In a real app, this would come from a real-time database or WebSocket
    // For demo purposes, let's simulate driver movement
    if (!ride) return null;
    
    // Start point (from_coordinates)
    let startPoint: Coordinates;
    if (!driverLocation) {
      // Initial position - close to the starting point
      const fromCoords = typeof ride.from_coordinates === 'string' 
        ? JSON.parse(ride.from_coordinates) 
        : ride.from_coordinates;
      
      if (!fromCoords) return null;
      
      startPoint = {
        lat: fromCoords.lat - 0.002 + Math.random() * 0.001,
        lng: fromCoords.lng - 0.002 + Math.random() * 0.001
      };
    } else {
      // Move incrementally toward destination
      const toCoords = typeof ride.to_coordinates === 'string'
        ? JSON.parse(ride.to_coordinates)
        : ride.to_coordinates;
      
      if (!toCoords) return driverLocation;
      
      // Calculate direction vector toward destination
      const dx = toCoords.lat - driverLocation.lat;
      const dy = toCoords.lng - driverLocation.lng;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If very close to destination, consider ride completed
      if (distance < 0.001) {
        setTimeout(() => {
          toast.success("You've arrived at your destination!");
          setStatusText("Ride completed");
          setIsRideActive(false);
          setRideStatus(prev => prev ? {
            ...prev,
            status: 'completed',
            eta_minutes: 0,
            distance_remaining: 0
          } : null);
        }, 2000);
        return driverLocation;
      }
      
      // Move a small increment toward destination (with some randomness)
      const step = 0.0005; // Adjust for speed
      const norm = step / distance;
      
      startPoint = {
        lat: driverLocation.lat + dx * norm + (Math.random() - 0.5) * 0.0001,
        lng: driverLocation.lng + dy * norm + (Math.random() - 0.5) * 0.0001
      };
      
      // Update ETA and distance
      const remainingDistance = distance * 111; // rough km conversion
      const etaMinutes = Math.ceil(remainingDistance * 2); // rough estimate
      
      setRideStatus(prev => prev ? {
        ...prev,
        eta_minutes: etaMinutes,
        distance_remaining: parseFloat(remainingDistance.toFixed(1))
      } : {
        ride_id: rideId as string,
        status: 'in_progress',
        eta_minutes: etaMinutes,
        distance_remaining: parseFloat(remainingDistance.toFixed(1)),
        last_updated: new Date().toISOString()
      });
      
      // Update status text based on remaining distance
      if (remainingDistance < 0.5) {
        setStatusText("Almost there!");
      } else if (remainingDistance < 1) {
        setStatusText("Approaching destination");
      } else {
        setStatusText("On the way");
      }
    }
    
    return startPoint;
  };
  
  // Initialize map
  useEffect(() => {
    if (!ride || !mapRef.current || mapInstance.current) return;
    
    try {
      // Parse coordinates
      const from = typeof ride.from_coordinates === 'string'
        ? JSON.parse(ride.from_coordinates) as Coordinates
        : ride.from_coordinates as Coordinates;
        
      const to = typeof ride.to_coordinates === 'string'
        ? JSON.parse(ride.to_coordinates) as Coordinates
        : ride.to_coordinates as Coordinates;
        
      if (!from || !to) {
        toast.error("Can't load route: missing location data");
        return;
      }
      
      // Initialize the map
      initMap(mapRef.current, from, 15).then((map) => {
        mapInstance.current = map;
        
        // Create route path
        const directionsService = new google.maps.DirectionsService();
        directionsService.route({
          origin: from,
          destination: to,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const path = result.routes[0].overview_path.map(point => ({
              lat: point.lat(),
              lng: point.lng()
            }));
            
            // Create orbital route visualization
            const route = createOrbitalRoute(map, path);
            routePolylineRef.current = route;
            
            // Add destination marker
            new google.maps.Marker({
              position: to,
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#E5DEFF",
                fillOpacity: 1,
                strokeColor: "#6E59A5",
                strokeWeight: 2,
                scale: 7
              },
              title: "Destination"
            });
            
            // Add starting point marker (user location)
            new google.maps.Marker({
              position: from,
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#D3E4FD",
                fillOpacity: 1,
                strokeColor: "#33C3F0",
                strokeWeight: 2,
                scale: 7
              },
              title: "Your Location"
            });
            
            // Fit map to route
            const bounds = new google.maps.LatLngBounds();
            path.forEach(point => bounds.extend(point));
            map.fitBounds(bounds);
            
            // Start driver location simulations
            fetchDriverLocation().then(initialLocation => {
              if (initialLocation) {
                setDriverLocation(initialLocation);
                const driverMarker = createDriverMarker(map, initialLocation);
                driverMarkerRef.current = driverMarker;
              }
            });
          } else {
            toast.error(`Failed to get route: ${status}`);
          }
        });
      });
    } catch (err) {
      console.error("Error initializing map:", err);
      toast.error("Failed to load live tracking map");
    }
  }, [ride]);
  
  // Simulate real-time driver location updates
  useEffect(() => {
    if (!isRideActive || markerAnimationInProgress.current) return;
    
    const intervalId = setInterval(async () => {
      if (markerAnimationInProgress.current) return;
      
      try {
        setIsFetching(true);
        markerAnimationInProgress.current = true;
        const newLocation = await fetchDriverLocation();
        
        if (newLocation && driverMarkerRef.current && mapInstance.current) {
          animateMarker(driverMarkerRef.current, newLocation);
          setDriverLocation(newLocation);
        }
        
        setIsFetching(false);
        setTimeout(() => {
          markerAnimationInProgress.current = false;
        }, 1500);
      } catch (error) {
        console.error("Error updating driver location:", error);
        setIsFetching(false);
        markerAnimationInProgress.current = false;
      }
    }, 3000); // Update every 3 seconds
    
    return () => clearInterval(intervalId);
  }, [isRideActive, driverLocation]);
  
  // Clean up map instance and markers on unmount
  useEffect(() => {
    return () => {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
        if ((driverMarkerRef.current as any).pulseCircle) {
          (driverMarkerRef.current as any).pulseCircle.setMap(null);
        }
      }
      
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }
    };
  }, []);
  
  // Handler for contact driver
  const handleContactDriver = () => {
    if (!ride?.driver_id) return;
    navigate(`/messages?userId=${ride.driver_id}`);
  };
  
  // Handler for refresh map
  const handleRefresh = async () => {
    if (isFetching) return;
    
    setIsFetching(true);
    try {
      const newLocation = await fetchDriverLocation();
      if (newLocation && driverMarkerRef.current) {
        animateMarker(driverMarkerRef.current, newLocation);
        setDriverLocation(newLocation);
      }
    } catch (error) {
      console.error("Error refreshing location:", error);
      toast.error("Failed to refresh driver location");
    } finally {
      setIsFetching(false);
    }
  };
  
  // Handler for cancel ride
  const handleCancelRide = () => {
    // In a real app, this would call an API to cancel the ride
    toast("To cancel this ride, please contact the driver directly.", {
      description: "For safety reasons, rides in progress can't be cancelled through the app.",
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-indigo-900/20 to-black/70">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h3 className="mt-4 text-xl font-medium">Preparing your journey...</h3>
          <p className="mt-2 text-muted-foreground">Connecting to your driver</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error || !ride) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-indigo-900/20 to-black/70">
        <div className="text-center p-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-medium">Unable to load ride details</h3>
          <p className="mt-2 text-muted-foreground">Please try again or contact support</p>
          <Button onClick={() => navigate('/rides')} className="mt-6">
            Back to My Rides
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-indigo-900/10 via-background to-background">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/80 to-background/0 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rides')} className="hover:bg-background/20">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <h1 className="text-lg font-bold tracking-tight text-center">
            {rideStatus?.status === 'completed' ? 'Ride Complete' : 'Live Tracking'}
          </h1>
          
          <div className="w-10"> {/* Empty div for balance */} </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex justify-center pb-2">
          <Badge 
            className={cn(
              "animate-pulse px-3 py-1 text-sm font-medium",
              rideStatus?.status === 'completed' ? "bg-green-600" : "bg-primary"
            )}
          >
            {statusText}
          </Badge>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="absolute inset-0 h-full w-full">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Map Controls */}
        <div className="absolute right-4 top-20 flex flex-col space-y-2">
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCcw className={cn("h-5 w-5", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      {/* Bottom Drawer with Ride Info */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-md">
          <DrawerHeader>
            <DrawerTitle className="text-center text-xl">Driver Information</DrawerTitle>
            <DrawerDescription className="text-center">
              {rideStatus?.status === 'completed' 
                ? 'Your ride has been completed' 
                : rideStatus?.eta_minutes 
                  ? `Arriving in ${rideStatus.eta_minutes} min (${rideStatus.distance_remaining} km)` 
                  : 'Calculating arrival time...'}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4">
            {/* Driver Profile */}
            <div className="flex items-center space-x-4 border-b border-border/50 pb-4">
              <Avatar className="h-16 w-16 border-2 border-primary shadow-glow">
                {ride.driver?.full_name ? (
                  <div className="flex h-full w-full items-center justify-center bg-purple-200 text-xl font-semibold text-purple-700">
                    {ride.driver.full_name.charAt(0)}
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/20" />
                )}
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-medium">{ride.driver?.full_name || "Driver"}</h3>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground">Rating: {ride.driver?.rating || "New Driver"}</span>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-muted-foreground">
                    Vehicle: Space Cruiser X1 • LC-42</span>
                </div>
              </div>
            </div>
            
            {/* Journey Details */}
            <div className="mt-4 space-y-2">
              <div className="rounded-lg bg-background/50 p-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{ride.from_location}</p>
                </div>
                <div className="ml-1 mt-2 border-l border-dashed border-primary/30 h-4" />
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <p className="text-sm font-medium">{ride.to_location}</p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                className="bg-background/50 backdrop-blur-sm border-border/50"
                onClick={() => toast.info("Calling driver...")}
              >
                <Phone className="mr-1 h-4 w-4" /> Call
              </Button>
              
              <Button 
                variant="outline" 
                className="bg-background/50 backdrop-blur-sm border-border/50"
                onClick={handleContactDriver}
              >
                <MessageCircle className="mr-1 h-4 w-4" /> Chat
              </Button>
              
              <Button 
                variant="outline"
                className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleCancelRide}
              >
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
            </div>
            
            {/* Ride Code */}
            <div className="mt-6">
              <h3 className="text-center text-sm font-medium text-muted-foreground">Verification Code</h3>
              <div className="mt-1 text-center">
                <span className="text-2xl font-bold tracking-wider">
                  {ride.id.substring(0, 4).toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                Share this code with your driver to confirm your identity
              </p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default LiveRideTracking;
