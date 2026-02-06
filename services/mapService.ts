// Mapbox Integration Service for Real GPS Coordinates
// Converts relative coordinates to real-world GPS and provides routing

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: GPSCoordinates[];
}

// Mapbox configuration
const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN || "pk.demo_token";
const MAPBOX_BASE_URL = "https://api.mapbox.com";

// Reference point for coordinate conversion (adjust to your operational area)
// Using Washington DC as default reference
const REFERENCE_POINT = {
  lat: 38.9072,
  lng: -77.0369,
};

const SCALE_FACTOR = {
  lat: 0.0009, // ~100m per unit
  lng: 0.0012, // ~100m per unit (varies by latitude)
};

// Convert relative coordinates (0-100) to GPS
export const relativeToGPS = (x: number, y: number): GPSCoordinates => {
  return {
    latitude: REFERENCE_POINT.lat + (y - 50) * SCALE_FACTOR.lat,
    longitude: REFERENCE_POINT.lng + (x - 50) * SCALE_FACTOR.lng,
  };
};

// Convert GPS to relative coordinates
export const gpsToRelative = (
  lat: number,
  lng: number,
): { x: number; y: number } => {
  return {
    x: 50 + (lng - REFERENCE_POINT.lng) / SCALE_FACTOR.lng,
    y: 50 + (lat - REFERENCE_POINT.lat) / SCALE_FACTOR.lat,
  };
};

// Get route between two points using Mapbox Directions API
export const getRoute = async (
  origin: GPSCoordinates,
  destination: GPSCoordinates,
  profile:
    | "driving"
    | "driving-traffic"
    | "walking"
    | "cycling" = "driving-traffic",
): Promise<MapRoute | null> => {
  try {
    const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/${profile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}&overview=full`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry.coordinates.map((coord: [number, number]) => ({
          longitude: coord[0],
          latitude: coord[1],
        })),
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return null;
  }
};

// Get optimized route for multiple waypoints
export const getOptimizedRoute = async (
  waypoints: GPSCoordinates[],
): Promise<MapRoute | null> => {
  if (waypoints.length < 2) return null;

  try {
    const coordinates = waypoints
      .map((wp) => `${wp.longitude},${wp.latitude}`)
      .join(";");

    const url = `${MAPBOX_BASE_URL}/optimized-trips/v1/mapbox/driving/${coordinates}?geometries=geojson&access_token=${MAPBOX_TOKEN}&roundtrip=true&source=first&destination=last`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.trips && data.trips.length > 0) {
      const trip = data.trips[0];
      return {
        distance: trip.distance,
        duration: trip.duration,
        geometry: trip.geometry.coordinates.map((coord: [number, number]) => ({
          longitude: coord[0],
          latitude: coord[1],
        })),
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch optimized route:", error);
    return null;
  }
};

// Geocoding service
export interface GeocodingResult {
  coordinates: GPSCoordinates;
  address: string;
  placeName: string;
}

export const geocodeAddress = async (
  address: string,
): Promise<GeocodingResult | null> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        coordinates: {
          latitude: feature.center[1],
          longitude: feature.center[0],
        },
        address: feature.place_name,
        placeName: feature.text,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};

// Reverse geocoding
export const reverseGeocode = async (
  coords: GPSCoordinates,
): Promise<string | null> => {
  try {
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json?access_token=${MAPBOX_TOKEN}&types=address`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
};

// Calculate distance between two GPS points
export const calculateDistance = (
  point1: GPSCoordinates,
  point2: GPSCoordinates,
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate ETA based on distance and average speed
export const calculateETA = (
  distance: number,
  averageSpeedKmh: number = 40,
): number => {
  // Distance in meters, speed in km/h
  const hours = distance / 1000 / averageSpeedKmh;
  return Math.round(hours * 3600); // Return seconds
};

// Weather integration (NOAA/NWS API)
export interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  visibility: number;
  precipitation: number;
  alerts?: string[];
}

export const getWeatherAtLocation = async (
  coords: GPSCoordinates,
): Promise<WeatherData | null> => {
  try {
    // Using NWS API (free, no key required)
    const response = await fetch(
      `https://api.weather.gov/points/${coords.latitude},${coords.longitude}`,
    );
    const data = await response.json();

    if (data.properties && data.properties.forecast) {
      const forecastResponse = await fetch(data.properties.forecast);
      const forecastData = await forecastResponse.json();

      if (forecastData.properties && forecastData.properties.periods) {
        const period = forecastData.properties.periods[0];
        return {
          temperature: period.temperature,
          condition: period.shortForecast,
          windSpeed: parseInt(period.windSpeed.split(" ")[0]) || 0,
          visibility: 10, // NWS doesn't provide this directly
          precipitation: 0,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return null;
  }
};

// Geofencing service
export interface Geofence {
  id: string;
  name: string;
  coordinates: GPSCoordinates[];
  radius: number; // meters
  type: "POLYGON" | "CIRCLE";
  alertOnExit: boolean;
  alertOnEnter: boolean;
}

export const checkGeofence = (
  point: GPSCoordinates,
  geofence: Geofence,
): { inside: boolean; triggered: string[] } => {
  const triggered: string[] = [];

  if (geofence.type === "CIRCLE") {
    const center = geofence.coordinates[0];
    const distance = calculateDistance(point, center);
    const inside = distance <= geofence.radius;
    if (inside && geofence.alertOnEnter) triggered.push("ENTER");
    if (!inside && geofence.alertOnExit) triggered.push("EXIT");
    return { inside, triggered };
  }

  // Point in polygon check
  const inside = pointInPolygon(point, geofence.coordinates);
  if (inside && geofence.alertOnEnter) triggered.push("ENTER");
  if (!inside && geofence.alertOnExit) triggered.push("EXIT");
  return { inside, triggered };
};

// Ray-casting algorithm for point-in-polygon
const pointInPolygon = (
  point: GPSCoordinates,
  polygon: GPSCoordinates[],
): boolean => {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].longitude,
      yi = polygon[i].latitude;
    const xj = polygon[j].longitude,
      yj = polygon[j].latitude;

    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

// Helper function
const toRad = (deg: number): number => (deg * Math.PI) / 180;

export default {
  relativeToGPS,
  gpsToRelative,
  getRoute,
  getOptimizedRoute,
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  calculateETA,
  getWeatherAtLocation,
  checkGeofence,
};
