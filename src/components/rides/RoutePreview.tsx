import { MapPin, Clock, Navigation } from 'lucide-react';
import type { RoutePreview } from '@/services/rides/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useRef } from 'react';

interface RoutePreviewProps {
    from: string;
    to: string;
    preview: RoutePreview;
    fromCoordinates?: { lat: number; lng: number };
    toCoordinates?: { lat: number; lng: number };
}

export function RoutePreview({ from, to, preview, fromCoordinates, toCoordinates }: RoutePreviewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<google.maps.Map | null>(null);
    const directionsService = useRef<google.maps.DirectionsService | null>(null);
    const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
    const fromMarker = useRef<google.maps.Marker | null>(null);
    const toMarker = useRef<google.maps.Marker | null>(null);
    const polyline = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!mapRef.current || !fromCoordinates || !toCoordinates) return;

        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
            zoom: 7,
            center: { lat: (fromCoordinates.lat + toCoordinates.lat) / 2, lng: (fromCoordinates.lng + toCoordinates.lng) / 2 },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });

        mapInstance.current = map;
        directionsService.current = new google.maps.DirectionsService();
        directionsRenderer.current = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true, // We'll add our own markers
            polylineOptions: {
                strokeColor: '#6366f1',
                strokeWeight: 5,
            },
        });

        // Add departure marker
        fromMarker.current = new google.maps.Marker({
            position: fromCoordinates,
            map,
            title: from,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4CAF50',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 8
            },
            label: {
                text: 'P',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 'bold'
            }
        });

        // Add destination marker
        toMarker.current = new google.maps.Marker({
            position: toCoordinates,
            map,
            title: to,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#F44336',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 8
            },
            label: {
                text: 'D',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 'bold'
            }
        });

        // Create and display polyline
        if (preview.polyline) {
            const path = google.maps.geometry.encoding.decodePath(preview.polyline.encodedPath);
            polyline.current = new google.maps.Polyline({
                path,
                map,
                strokeColor: preview.polyline.strokeColor,
                strokeWeight: preview.polyline.strokeWeight
            });

            // Fit map to show the entire route
            const bounds = new google.maps.LatLngBounds();
            path.forEach(point => bounds.extend(point));
            map.fitBounds(bounds);
        }

        return () => {
            if (directionsRenderer.current) {
                directionsRenderer.current.setMap(null);
            }
            if (fromMarker.current) {
                fromMarker.current.setMap(null);
            }
            if (toMarker.current) {
                toMarker.current.setMap(null);
            }
            if (polyline.current) {
                polyline.current.setMap(null);
            }
        };
    }, [fromCoordinates, toCoordinates, from, to, preview.polyline]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Route Preview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{from} → {to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{preview.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{preview.duration} minutes</span>
                    </div>
                    <div
                        ref={mapRef}
                        className="h-48 w-full rounded-lg overflow-hidden"
                        style={{ minHeight: '200px' }}
                    />
                </div>
            </CardContent>
        </Card>
    );
} 