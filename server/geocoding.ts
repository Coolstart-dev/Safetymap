
import NodeGeocoder from 'node-geocoder';

const options = {
  provider: 'openstreetmap' as const,
  httpAdapter: 'https' as const,
  formatter: null
};

const geocoder = NodeGeocoder(options);

export interface PostalCodeInfo {
  postalCode: string;
  municipality: string;
  latitude: number;
  longitude: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export class GeocodingService {
  async getPostalCodeInfo(postalCode: string, country: string = 'BE'): Promise<PostalCodeInfo | null> {
    try {
      // Search for postal code in Belgium
      const results = await geocoder.geocode(`${postalCode}, ${country}`);
      
      if (results.length === 0) {
        return null;
      }
      
      const result = results[0];
      
      return {
        postalCode: postalCode,
        municipality: result.city || result.administrativeLevels?.level2long || 'Unknown',
        latitude: result.latitude!,
        longitude: result.longitude!,
        bounds: result.extra?.bbox ? {
          north: result.extra.bbox.north,
          south: result.extra.bbox.south,
          east: result.extra.bbox.east,
          west: result.extra.bbox.west
        } : undefined
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const results = await geocoder.reverse({ lat: latitude, lon: longitude });
      
      if (results.length === 0) {
        return null;
      }
      
      return results[0].zipcode || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}
