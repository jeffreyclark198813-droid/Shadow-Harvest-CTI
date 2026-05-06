export interface ThreatFeedConfig {
  otxApiKey?: string;
  mispUrl?: string;
  mispKey?: string;
}

export class ThreatIntelligenceFeeds {
  private config: ThreatFeedConfig;

  constructor(config: ThreatFeedConfig) {
    this.config = config;
  }

  // ALIENVAULT OTX INTEGRATION
  async getOTXIndicators(target: string): Promise<any> {
    if (!this.config.otxApiKey) {
      throw new Error('OTX API key not configured. Please add this in Integrations mapping.');
    }
    
    // In production, this would go through a proxy to avoid CORS, or be called from a node.js backend.
    // For now we implement the front-end fetch architecture.
    try {
      const response = await fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${target}/general`, {
        headers: {
          'X-OTX-API-KEY': this.config.otxApiKey
        }
      });
      if (!response.ok) throw new Error(`OTX API responded with ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("OTX Fetch error:", error);
      throw error;
    }
  }

  // MISP INTEGRATION
  async searchMISP(query: string): Promise<any> {
    if (!this.config.mispUrl || !this.config.mispKey) {
      throw new Error('MISP Configuration missing. Please configure in system settings.');
    }
    
    try {
      const response = await fetch(`${this.config.mispUrl}/events/restSearch`, {
        method: 'POST',
        headers: {
          'Authorization': this.config.mispKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ returnFormat: 'json', value: query })
      });
      if (!response.ok) throw new Error(`MISP API responded with ${response.status}`);
      return await response.json();
    } catch (error) {
       console.error("MISP Fetch error:", error);
       throw error;
    }
  }
}
