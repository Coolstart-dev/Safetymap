
import Database from 'better-sqlite3';
import path from 'path';

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
  private db: Database.Database;
  
  constructor() {
    // Initialize SQLite database for postal codes
    this.db = new Database(':memory:');
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create postal codes table
    this.db.exec(`
      CREATE TABLE postal_codes (
        postal_code TEXT PRIMARY KEY,
        municipality TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        province TEXT,
        country TEXT DEFAULT 'BE'
      )
    `);

    // Insert Belgian postal codes data
    const belgianPostalCodes = [
      // Antwerp Province
      { code: '2000', municipality: 'Antwerpen', lat: 51.2213, lng: 4.4051, province: 'Antwerp' },
      { code: '2018', municipality: 'Antwerpen', lat: 51.2300, lng: 4.4200, province: 'Antwerp' },
      { code: '2020', municipality: 'Antwerpen', lat: 51.2100, lng: 4.3900, province: 'Antwerp' },
      { code: '2030', municipality: 'Antwerpen', lat: 51.2400, lng: 4.3800, province: 'Antwerp' },
      { code: '2040', municipality: 'Antwerpen', lat: 51.1900, lng: 4.3700, province: 'Antwerp' },
      { code: '2050', municipality: 'Antwerpen', lat: 51.1800, lng: 4.4000, province: 'Antwerp' },
      { code: '2060', municipality: 'Antwerpen', lat: 51.2200, lng: 4.3600, province: 'Antwerp' },
      { code: '2100', municipality: 'Deurne', lat: 51.2100, lng: 4.4600, province: 'Antwerp' },
      { code: '2140', municipality: 'Borgerhout', lat: 51.2100, lng: 4.4300, province: 'Antwerp' },
      { code: '2150', municipality: 'Borsbeek', lat: 51.1950, lng: 4.4850, province: 'Antwerp' },
      { code: '2160', municipality: 'Wommelgem', lat: 51.1900, lng: 4.5100, province: 'Antwerp' },
      { code: '2170', municipality: 'Merksem', lat: 51.2400, lng: 4.4400, province: 'Antwerp' },
      { code: '2180', municipality: 'Ekeren', lat: 51.2700, lng: 4.4200, province: 'Antwerp' },
      { code: '2200', municipality: 'Herentals', lat: 51.1780, lng: 4.8310, province: 'Antwerp' },
      { code: '2300', municipality: 'Turnhout', lat: 51.3227, lng: 4.9447, province: 'Antwerp' },
      { code: '2400', municipality: 'Mol', lat: 51.1920, lng: 5.1170, province: 'Antwerp' },
      { code: '2500', municipality: 'Lier', lat: 51.1313, lng: 4.5700, province: 'Antwerp' },
      { code: '2600', municipality: 'Berchem', lat: 51.1950, lng: 4.4150, province: 'Antwerp' },
      { code: '2800', municipality: 'Mechelen', lat: 51.0280, lng: 4.4774, province: 'Antwerp' },
      { code: '2900', municipality: 'Schoten', lat: 51.2500, lng: 4.5000, province: 'Antwerp' },

      // Brussels Capital Region  
      { code: '1000', municipality: 'Brussel', lat: 50.8466, lng: 4.3528, province: 'Brussels' },
      { code: '1020', municipality: 'Brussel', lat: 50.8600, lng: 4.3200, province: 'Brussels' },
      { code: '1030', municipality: 'Schaarbeek', lat: 50.8700, lng: 4.3800, province: 'Brussels' },
      { code: '1040', municipality: 'Etterbeek', lat: 50.8300, lng: 4.3900, province: 'Brussels' },
      { code: '1050', municipality: 'Elsene', lat: 50.8200, lng: 4.3600, province: 'Brussels' },
      { code: '1060', municipality: 'Sint-Gillis', lat: 50.8300, lng: 4.3400, province: 'Brussels' },
      { code: '1070', municipality: 'Anderlecht', lat: 50.8400, lng: 4.3100, province: 'Brussels' },
      { code: '1080', municipality: 'Molenbeek-Saint-Jean', lat: 50.8600, lng: 4.3300, province: 'Brussels' },
      { code: '1090', municipality: 'Jette', lat: 50.8800, lng: 4.3400, province: 'Brussels' },
      { code: '1120', municipality: 'Neder-Over-Heembeek', lat: 50.8900, lng: 4.3700, province: 'Brussels' },
      { code: '1130', municipality: 'Haren', lat: 50.8800, lng: 4.4000, province: 'Brussels' },
      { code: '1140', municipality: 'Evere', lat: 50.8700, lng: 4.4000, province: 'Brussels' },
      { code: '1150', municipality: 'Sint-Pieters-Woluwe', lat: 50.8400, lng: 4.4100, province: 'Brussels' },
      { code: '1160', municipality: 'Auderghem', lat: 50.8100, lng: 4.4300, province: 'Brussels' },
      { code: '1170', municipality: 'Watermaal-Bosvoorde', lat: 50.8000, lng: 4.4100, province: 'Brussels' },
      { code: '1180', municipality: 'Ukkel', lat: 50.8000, lng: 4.3400, province: 'Brussels' },
      { code: '1190', municipality: 'Vorst', lat: 50.8100, lng: 4.3200, province: 'Brussels' },
      { code: '1200', municipality: 'Sint-Lambrechts-Woluwe', lat: 50.8500, lng: 4.4300, province: 'Brussels' },

      // East Flanders
      { code: '9000', municipality: 'Gent', lat: 50.8504, lng: 3.7304, province: 'East Flanders' },
      { code: '9100', municipality: 'Sint-Niklaas', lat: 51.1658, lng: 4.1431, province: 'East Flanders' },
      { code: '9200', municipality: 'Dendermonde', lat: 51.0280, lng: 4.1018, province: 'East Flanders' },
      { code: '9300', municipality: 'Aalst', lat: 50.9368, lng: 4.0397, province: 'East Flanders' },
      { code: '9400', municipality: 'Ninove', lat: 50.8279, lng: 4.0263, province: 'East Flanders' },
      { code: '9500', municipality: 'Geraardsbergen', lat: 50.7732, lng: 3.8813, province: 'East Flanders' },
      { code: '9600', municipality: 'Ronse', lat: 50.7468, lng: 3.5996, province: 'East Flanders' },
      { code: '9700', municipality: 'Oudenaarde', lat: 50.8453, lng: 3.6086, province: 'East Flanders' },
      { code: '9800', municipality: 'Deinze', lat: 50.9864, lng: 3.5312, province: 'East Flanders' },
      { code: '9900', municipality: 'Eeklo', lat: 51.1880, lng: 3.5649, province: 'East Flanders' },

      // Flemish Brabant
      { code: '3000', municipality: 'Leuven', lat: 50.8798, lng: 4.7005, province: 'Flemish Brabant' },
      { code: '3200', municipality: 'Aarschot', lat: 50.9890, lng: 4.8384, province: 'Flemish Brabant' },
      { code: '3300', municipality: 'Tienen', lat: 50.8073, lng: 4.9381, province: 'Flemish Brabant' },
      { code: '1500', municipality: 'Halle', lat: 50.7355, lng: 4.2354, province: 'Flemish Brabant' },
      { code: '1700', municipality: 'Dilbeek', lat: 50.8483, lng: 4.2598, province: 'Flemish Brabant' },
      { code: '1800', municipality: 'Vilvoorde', lat: 50.9276, lng: 4.4276, province: 'Flemish Brabant' },

      // Limburg
      { code: '3500', municipality: 'Hasselt', lat: 50.9307, lng: 5.3378, province: 'Limburg' },
      { code: '3600', municipality: 'Genk', lat: 50.9658, lng: 5.5037, province: 'Limburg' },
      { code: '3700', municipality: 'Tongeren', lat: 50.7803, lng: 5.4637, province: 'Limburg' },
      { code: '3800', municipality: 'Sint-Truiden', lat: 50.8167, lng: 5.1862, province: 'Limburg' },
      { code: '3900', municipality: 'Pelt', lat: 51.2236, lng: 5.4215, province: 'Limburg' },

      // West Flanders
      { code: '8000', municipality: 'Brugge', lat: 51.2085, lng: 3.2251, province: 'West Flanders' },
      { code: '8400', municipality: 'Oostende', lat: 51.2289, lng: 2.9187, province: 'West Flanders' },
      { code: '8500', municipality: 'Kortrijk', lat: 50.8279, lng: 3.2646, province: 'West Flanders' },
      { code: '8600', municipality: 'Diksmuide', lat: 51.0334, lng: 2.8650, province: 'West Flanders' },
      { code: '8700', municipality: 'Tielt', lat: 50.9997, lng: 3.3299, province: 'West Flanders' },
      { code: '8800', municipality: 'Roeselare', lat: 50.9488, lng: 3.1265, province: 'West Flanders' },
      { code: '8900', municipality: 'Ieper', lat: 50.8512, lng: 2.8857, province: 'West Flanders' },

      // Hainaut
      { code: '7000', municipality: 'Mons', lat: 50.4542, lng: 3.9564, province: 'Hainaut' },
      { code: '6000', municipality: 'Charleroi', lat: 50.4108, lng: 4.4446, province: 'Hainaut' },
      { code: '7100', municipality: 'La Louvière', lat: 50.4792, lng: 4.1886, province: 'Hainaut' },
      { code: '7500', municipality: 'Tournai', lat: 50.6054, lng: 3.3890, province: 'Hainaut' },
      { code: '7800', municipality: 'Ath', lat: 50.6294, lng: 3.7790, province: 'Hainaut' },
      { code: '6200', municipality: 'Châtelet', lat: 50.4057, lng: 4.5274, province: 'Hainaut' },

      // Liège Province
      { code: '4000', municipality: 'Luik', lat: 50.6326, lng: 5.5797, province: 'Liège' },
      { code: '4100', municipality: 'Seraing', lat: 50.6065, lng: 5.4998, province: 'Liège' },
      { code: '4200', municipality: 'Herstal', lat: 50.6633, lng: 5.6309, province: 'Liège' },
      { code: '4300', municipality: 'Waremme', lat: 50.6949, lng: 5.2517, province: 'Liège' },
      { code: '4400', municipality: 'Flémalle', lat: 50.5975, lng: 5.4431, province: 'Liège' },
      { code: '4500', municipality: 'Huy', lat: 50.5190, lng: 5.2395, province: 'Liège' },
      { code: '4600', municipality: 'Visé', lat: 50.7394, lng: 5.6996, province: 'Liège' },
      { code: '4700', municipality: 'Eupen', lat: 50.6275, lng: 6.0370, province: 'Liège' },
      { code: '4800', municipality: 'Verviers', lat: 50.5898, lng: 5.8627, province: 'Liège' },
      { code: '4900', municipality: 'Spa', lat: 50.4823, lng: 5.8683, province: 'Liège' },

      // Luxembourg Province
      { code: '6700', municipality: 'Arlon', lat: 49.6837, lng: 5.8164, province: 'Luxembourg' },
      { code: '6600', municipality: 'Bastogne', lat: 50.0034, lng: 5.7181, province: 'Luxembourg' },
      { code: '6800', municipality: 'Libramont-Chevigny', lat: 49.9213, lng: 5.3787, province: 'Luxembourg' },
      { code: '6900', municipality: 'Marche-en-Famenne', lat: 50.2268, lng: 5.3446, province: 'Luxembourg' },

      // Namur Province
      { code: '5000', municipality: 'Namen', lat: 50.4674, lng: 4.8720, province: 'Namur' },
      { code: '5100', municipality: 'Jambes', lat: 50.4592, lng: 4.8736, province: 'Namur' },
      { code: '5200', municipality: 'Huy', lat: 50.5190, lng: 5.2395, province: 'Namur' },
      { code: '5300', municipality: 'Andenne', lat: 50.4880, lng: 5.0945, province: 'Namur' },
      { code: '5400', municipality: 'Eghezée', lat: 50.5898, lng: 4.9300, province: 'Namur' },
      { code: '5500', municipality: 'Dinant', lat: 50.2609, lng: 4.9127, province: 'Namur' }
    ];

    const insertStmt = this.db.prepare(`
      INSERT INTO postal_codes (postal_code, municipality, latitude, longitude, province, country)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const location of belgianPostalCodes) {
      insertStmt.run(location.code, location.municipality, location.lat, location.lng, location.province, 'BE');
    }

    console.log(`Local geocoding database initialized with ${belgianPostalCodes.length} Belgian postal codes`);
  }

  async getPostalCodeInfo(postalCode: string, country: string = 'BE'): Promise<PostalCodeInfo | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT postal_code, municipality, latitude, longitude 
        FROM postal_codes 
        WHERE postal_code = ? AND country = ?
      `);
      
      const result = stmt.get(postalCode, country);
      
      if (!result) {
        console.log(`Postal code ${postalCode} not found in local database`);
        return null;
      }

      return {
        postalCode: result.postal_code,
        municipality: result.municipality,
        latitude: result.latitude,
        longitude: result.longitude,
        bounds: {
          north: result.latitude + 0.01,
          south: result.latitude - 0.01,
          east: result.longitude + 0.01,
          west: result.longitude - 0.01
        }
      };
    } catch (error) {
      console.error('Local geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      // Find closest postal code based on coordinates
      const stmt = this.db.prepare(`
        SELECT postal_code,
               ((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?)) as distance
        FROM postal_codes
        ORDER BY distance ASC
        LIMIT 1
      `);
      
      const result = stmt.get(latitude, latitude, longitude, longitude);
      
      return result ? result.postal_code : null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}
