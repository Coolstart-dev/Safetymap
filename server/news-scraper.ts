import Anthropic from '@anthropic-ai/sdk';
import { storage } from './storage';
import type { InsertScrapedReport } from '@shared/schema';

// The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229".
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface NewsSearchResult {
  title: string;
  url: string;
  description: string;
  source: string;
  publishedAt: string;
  favicon?: string;
}

interface ScrapingResult {
  success: boolean;
  results: NewsSearchResult[];
  error?: string;
}

interface AIAnalysisResult {
  isIncidentRelated: boolean;
  confidence: number;
  category?: string;
  location?: string;
  extractedData?: {
    latitude?: number;
    longitude?: number;
    incidentType?: string;
  };
  reasoning: string;
}

export class NewsScraper {
  
  async scrapeNews(postcode: string, keywords: string[]): Promise<ScrapingResult> {
    try {
      console.log(`Starting news scraping for postcode ${postcode} with keywords:`, keywords);
      
      // For demo purposes, simulate news search results
      // In a real implementation, this would use a news API like NewsAPI, Google News API, etc.
      const simulatedResults = await this.simulateNewsSearch(postcode, keywords);
      
      return {
        success: true,
        results: simulatedResults
      };
    } catch (error) {
      console.error('News scraping error:', error);
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown scraping error'
      };
    }
  }

  private async simulateNewsSearch(postcode: string, keywords: string[]): Promise<NewsSearchResult[]> {
    // Simulate realistic news results based on postcode and keywords
    const belgianSources = [
      { name: 'Het Laatste Nieuws', domain: 'hln.be', favicon: 'https://hln.be/favicon.ico' },
      { name: 'De Standaard', domain: 'standaard.be', favicon: 'https://standaard.be/favicon.ico' },
      { name: 'Het Nieuwsblad', domain: 'nieuwsblad.be', favicon: 'https://nieuwsblad.be/favicon.ico' },
      { name: 'VRT NWS', domain: 'vrt.be', favicon: 'https://vrt.be/favicon.ico' },
      { name: 'De Tijd', domain: 'tijd.be', favicon: 'https://tijd.be/favicon.ico' }
    ];

    const locationName = this.getLocationByPostcode(postcode);
    const results: NewsSearchResult[] = [];

    // Generate 3-7 realistic results
    const numResults = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < numResults; i++) {
      const source = belgianSources[Math.floor(Math.random() * belgianSources.length)];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      
      // Generate realistic news titles
      const titles = [
        `${keyword} incident gemeld in ${locationName}`,
        `Politie onderzoekt ${keyword} in centrum ${locationName}`,
        `${keyword} zorgt voor overlast in ${locationName}`,
        `Bewoners ${locationName} klagen over ${keyword}`,
        `${keyword} situatie onder controle in ${locationName}`,
        `Nieuwe maatregel tegen ${keyword} in ${locationName}`
      ];
      
      const title = titles[Math.floor(Math.random() * titles.length)];
      const publishedHoursAgo = Math.floor(Math.random() * 48) + 1;
      const publishedAt = new Date(Date.now() - publishedHoursAgo * 60 * 60 * 1000).toISOString();

      results.push({
        title,
        url: `https://${source.domain}/${locationName.toLowerCase()}/${keyword.toLowerCase()}-${Date.now()}`,
        description: `Details over ${keyword} situatie in ${locationName}. Meer informatie en achtergrond over het incident.`,
        source: source.name,
        publishedAt,
        favicon: source.favicon
      });
    }

    return results;
  }

  async analyzeNewsWithAI(newsItem: NewsSearchResult, postcode: string): Promise<AIAnalysisResult> {
    try {
      const prompt = `
Je bent een AI die nieuws artikelen analyseert voor een community safety platform.

Analyseer dit nieuwsartikel en bepaal of het relevant is voor een lokaal veiligheidsplatform:

Titel: ${newsItem.title}
Beschrijving: ${newsItem.description}
Bron: ${newsItem.source}
Postcode gebied: ${postcode}

Bepaal:
1. Is dit gerelateerd aan een veiligheidsincident? (diefstal, vandalisme, overlast, etc.)
2. Geef een confidence score (0.0 - 1.0)
3. Welke categorie past het beste? (theft, degradation, suspicious, dangerous, harassment, cyber)
4. Probeer een specifieke locatie te extraheren
5. Geef je redenering

Antwoord in dit JSON format:
{
  "isIncidentRelated": boolean,
  "confidence": number,
  "category": "string",
  "location": "string",
  "extractedData": {
    "incidentType": "string"
  },
  "reasoning": "string"
}
`;

      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from AI');
      }

      // Parse AI response
      const aiText = content.text;
      let analysisResult: AIAnalysisResult;

      try {
        // Try to extract JSON from the response
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.warn('Failed to parse AI analysis, using fallback:', parseError);
        // Fallback analysis
        analysisResult = {
          isIncidentRelated: false,
          confidence: 0.3,
          reasoning: 'AI analysis failed, marked as low confidence'
        };
      }

      console.log('AI Analysis Result:', analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        isIncidentRelated: false,
        confidence: 0.1,
        reasoning: `AI analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async processAndSaveScrapedNews(newsItems: NewsSearchResult[], postcode: string): Promise<number> {
    let savedCount = 0;
    
    for (const newsItem of newsItems) {
      try {
        // Analyze with AI
        const analysis = await this.analyzeNewsWithAI(newsItem, postcode);
        
        // Only save if AI thinks it's incident-related with decent confidence
        if (analysis.isIncidentRelated && analysis.confidence >= 0.4) {
          const scrapedReport: InsertScrapedReport = {
            title: newsItem.title,
            description: newsItem.description,
            sourceUrl: newsItem.url,
            sourceName: newsItem.source,
            sourceFavicon: newsItem.favicon || null,
            publishedAt: newsItem.publishedAt,
            postcode,
            location: analysis.location || null,
            category: analysis.category || null,
            confidence: analysis.confidence,
            aiAnalysis: analysis,
            extractedData: analysis.extractedData || null
          };

          await storage.createScrapedReport(scrapedReport);
          savedCount++;
          console.log(`Saved scraped report: ${newsItem.title} (confidence: ${analysis.confidence})`);
        } else {
          console.log(`Skipped news item: ${newsItem.title} (not incident-related or low confidence: ${analysis.confidence})`);
        }
      } catch (error) {
        console.error(`Error processing news item "${newsItem.title}":`, error);
      }
    }

    return savedCount;
  }

  private getLocationByPostcode(postcode: string): string {
    // Simple mapping for demo - in real app this would use a postal code database
    const postcodeMap: { [key: string]: string } = {
      '2000': 'Antwerpen',
      '2900': 'Schoten',
      '9000': 'Gent',
      '8000': 'Brugge',
      '1000': 'Brussel',
      '3000': 'Leuven',
      '2800': 'Mechelen',
      '3500': 'Hasselt'
    };

    return postcodeMap[postcode] || `Postcode ${postcode}`;
  }
}

export const newsScraper = new NewsScraper();