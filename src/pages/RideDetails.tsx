import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RideMap } from "@/components/map/RideMap";
import { Navigation2 } from "lucide-react";
import { getRideById } from "@/services/rideService";
import { RideHeader } from "@/components/ride/RideHeader";
import { Ride } from "@/services/rides/types";
import { Profile } from "@/services/profileService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface RideDetailsProps {}

const RideDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: ride,
    isLoading,
    error,
  } = useQuery(
    ["ride", id],
    () => {
      if (!id) {
        throw new Error("Ride ID is required");
      }
      return getRideById(id);
    },
    {
      retry: false,
    }
  );

  // Get coordinates for the map
  const getFromCoordinates = () => {
    if (!ride) return null;
    
    try {
      if (typeof ride.from_coordinates === 'string') {
        return JSON.parse(ride.from_coordinates);
      }
      return ride.from_coordinates;
    } catch (e) {
      console.error("Failed to parse from_coordinates:", e);
      return null;
    }
  };
  
  const getToCoordinates = () => {
    if (!ride) return null;
    
    try {
      if (typeof ride.to_coordinates === 'string') {
        return JSON.parse(ride.to_coordinates);
      }
      return ride.to_coordinates;
    } catch (e) {
      console.error("Failed to parse to_coordinates:", e);
      return null;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Navigate to live tracking
  const goToLiveTracking = () => {
    if (ride?.id) {
      navigate(`/live-tracking/${ride.id}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center text-muted-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-2xl font-bold tracking-tight">Ride Details</h1>
        
        <div className="w-12" /> {/* Spacer for balance */}
      </div>

      {isLoading ? (
        <Card className="w-full space-y-4">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-64" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-40" />
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      ) : error ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load ride details.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              There was an error fetching the ride details. Please try again
              later.
            </p>
          </CardContent>
        </Card>
      ) : ride ? (
        <>
          <div className="rounded-lg border bg-card shadow-sm">
            {/* Ride Header */}
            <RideHeader
              fromLocation={ride.from_location}
              toLocation={ride.to_location}
              date={ride.departure_date}
              time={ride.departure_time}
              status={ride.status}
            />

            {/* Map Preview */}
            <div className="h-48 w-full overflow-hidden sm:h-64">
              <RideMap
                height="100%"
                showUserLocation={false}
                pickupLocation={{
                  name: ride.from_location,
                  coordinates: getFromCoordinates() || { lat: 0, lng: 0 }
                }}
                dropLocation={{
                  name: ride.to_location,
                  coordinates: getToCoordinates() || { lat: 0, lng: 0 }
                }}
              />
            </div>

            {/* Live Tracking Button */}
            {ride.status === 'active' && (
              <div className="flex justify-center p-4 bg-gradient-to-r from-indigo-900/10 via-background to-indigo-900/10">
                <Button 
                  onClick={goToLiveTracking}
                  className="w-full max-w-xs bg-primary/90 hover:bg-primary shadow-glow"
                >
                  <Navigation2 className="mr-2 h-5 w-5 animate-pulse" />
                  Live Tracking
                </Button>
              </div>
            )}

            {/* Driver Info */}
            <div className="border-t p-4">
              <h3 className="mb-4 text-lg font-semibold">Driver Information</h3>
              <div className="flex items-center space-x-4">
                <Avatar>
                  {ride.driver?.full_name ? (
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${ride.driver.full_name}`}
                      alt={ride.driver.full_name}
                    />
                  ) : (
                    <AvatarFallback>
                      {ride.driver?.full_name
                        ? ride.driver.full_name.charAt(0)
                        : "N/A"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h4 className="text-sm font-medium leading-none">
                    {ride.driver?.full_name || "N/A"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {ride.driver?.email || "No Email"}
                  </p>
                </div>
              </div>
            </div>

            {/* Ride Details */}
            <div className="border-t p-4">
              <h3 className="mb-4 text-lg font-semibold">Ride Details</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">From:</span>
                  <span>{ride.from_location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">To:</span>
                  <span>{ride.to_location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Date:</span>
                  <span>{formatDate(ride.departure_date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Time:</span>
                  <span>{formatTime(ride.departure_time)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Price:</span>
                  <span>${ride.price}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Available Seats:</span>
                  <span>{ride.available_seats}</span>
                </div>
                {ride.notes && (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Notes:</span>
                    <span>{ride.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Passengers */}
            {ride.passengers && ride.passengers.length > 0 && (
              <div className="border-t p-4">
                <h3 className="mb-4 text-lg font-semibold">Passengers</h3>
                <ScrollArea className="h-[150px] w-full rounded-md border">
                  <div className="space-y-4 p-4">
                    {ride.passengers.map((passenger) => (
                      <div key={passenger.id} className="flex items-center space-x-4">
                        <Avatar>
                          {passenger.passenger?.full_name ? (
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${passenger.passenger.full_name}`}
                              alt={passenger.passenger.full_name}
                            />
                          ) : (
                            <AvatarFallback>
                              {passenger.passenger?.full_name
                                ? passenger.passenger.full_name.charAt(0)
                                : "N/A"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-medium leading-none">
                            {passenger.passenger?.full_name || "N/A"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {passenger.passenger?.email || "No Email"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default RideDetails;
