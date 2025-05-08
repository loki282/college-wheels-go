
declare global {
  interface Window {
    googleMapsLoaded: boolean;
    onGoogleMapsLoaded: () => void;
    google: {
      maps: {
        Map: new (element: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        LatLng: new (lat: number, lng: number) => any;
        LatLngBounds: new () => any;
        places: {
          AutocompleteService: new () => any;
          PlacesService: new (element: HTMLElement) => any;
          Autocomplete: new (input: HTMLInputElement, options: any) => any;
        };
        Geocoder: new () => any;
        event: {
          addListener: (instance: any, eventName: string, handler: Function) => any;
          removeListener: (listener: any) => void;
          addListenerOnce: (instance: any, eventName: string, handler: Function) => any;
          addDomListener: (instance: any, eventName: string, handler: Function) => any;
          trigger: (instance: any, eventName: string) => void;
          clearListeners: (instance: any, eventName: string) => void;
        };
        ControlPosition: {
          TOP_RIGHT: number;
          TOP_LEFT: number;
          BOTTOM_RIGHT: number;
          BOTTOM_LEFT: number;
        };
        Circle: new (options: any) => any;
        SymbolPath: {
          CIRCLE: number;
        };
        GeocoderStatus: {
          OK: string;
          ZERO_RESULTS: string;
        };
        TravelMode: {
          DRIVING: string;
          WALKING: string;
          BICYCLING: string;
          TRANSIT: string;
        };
        DirectionsService: new () => any;
        DirectionsStatus: Record<string, string>;
        DirectionsRenderer: new (options?: any) => any;
        geometry: {
          encoding: {
            decodePath: (path: string) => any[];
          };
          spherical: {
            computeDistanceBetween: (from: any, to: any) => number;
            computeHeading: (from: any, to: any) => number;
          };
        };
        Polyline: new (options: any) => any;
        MapMouseEvent: any;
      };
    };
  }
}

export {};
