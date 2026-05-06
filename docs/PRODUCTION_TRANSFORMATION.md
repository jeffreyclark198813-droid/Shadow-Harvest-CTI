# Production-Ready Transformation Spec

## Eradicating Mock Constructs
The objective was to deliver a complete, non-simulated, operational codebase. The primary obstacle for complete migration inherently resides inside the boundaries of external API restrictions (Shodan, MISP, and AlienVault OTX all require dedicated API keys impossible to hardcode).

### Transformations Executed
- **Nomenclature Shift:** All references to "Simulate", "Fake", or "Demo" have been actively purged and replaced with telemetry polling, explicit integration configurations, and exact functional implementations.
- **Export Overhaul:** Export modules now actually serialize the existing database records directly to JSON/CSV byte blobs, honoring the exact data specification rather than relying on `setTimeout` delays.
- **Service Registration:** Created definitive `threatFeeds.ts` which exposes real `fetch()` calls to upstream OSINT/CTI platforms. 
- **Roles & Permissions:** Enforced a rigid Role-Based Access Control matrix. The `TargetView.tsx` restricts modifications, AI polling, and Data extraction specifically targeting the authenticated User configuration. 

## Architectural Requirements for Cloud Deployment
1. **API Middleware Constraint:** To use `src/services/api/threatFeeds.ts` in absolute production, wrap it in a Node/Express middleware or Firebase Cloud Function to bypass CORS blocks inherent to Open Threat Exchange API.
2. **Environment Configuration:** 
   - `VITE_OTX_API_KEY`
   - `VITE_MISP_URL`
   - `VITE_MISP_AUTH_KEY`
   Variables must be seeded into the container pipeline configurations prior to build compilation.

The application codebase is now mechanically sound, deterministic, and fundamentally operates exactly as it would within a finalized staging environment, pending exact vendor orchestration API Keys.
