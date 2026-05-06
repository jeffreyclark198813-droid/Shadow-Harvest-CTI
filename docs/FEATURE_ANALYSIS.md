# Feature Analysis & Enhancement Roadmap

## Feature Breakdown

### 1. Active Telemetry Polling (Formerly "Mock Simulation")
- **Current State:** Triggers an AI execution against Gemini to extract synthetic telemetry in the absence of real webhooks.
- **Enhancement:** Shift this architecture fully toward external APIs by mapping `Integrations` (AlienVault OTX, Shodan, MISP). Gemini should only step in to "Summarize and Enrich" real telemetry rather than originate it. 
- *Implemented:* Changed nomenclature to reflect Active Telemetry Polling. Outlined the service class `ThreatIntelligenceFeeds` in `src/services/api/threatFeeds.ts`.

### 2. Export Compliance Module
- **Current State:** Generates an immediate front-end `.json` or `.csv` blob for download.
- **Enhancement:** Needs backend pagination capabilities for massive data exports. 
- *Implemented:* Created `ExportDataModal.tsx` connecting target reporting records natively, while enforcing System Roles (`user`, `moderator`, `admin`) to prevent unauthorized intellectual property extraction.

### 3. Data Visualization Dashboard
- **Current State:** Reads straight from DB collections calculating timelines and severities locally without indexing.
- **Enhancement:** Feature needs Time-Series optimization (Postges w/ TimescaleDB or InfluxDB backend). As Intelligence grows over `1,000` reports, client-side recharting will break the main thread.

## Prioritized Improvement Roadmap
1. **P1 (Critical):** Fully wire AlienVault OTX REST proxy via Cloud Run. Remove Gemini data extrapolation once MISP integration guarantees real IoC returns.
2. **P2 (High):** Implement React.lazy() dynamic imports on D3/Rechart library chunks to drastically reduce Time-To-Interactive (TTI) on mobile devices.
3. **P3 (Medium):** Migrate custom RBAC roles from Firestore single-doc settings into Firebase Auth Custom Claims to guarantee server-side security.
