# Performance Analysis & Optimization

## Current Bottlenecks

### 1. Rendering Inefficiencies
The React component tree for `TargetView.tsx` mounts incredibly complex sub-components unconditionally under state-driven tabs. Because `Recharts` and `D3` (in Graph.tsx) are mounted dynamically, tab-switching incurs heavy UI-thread stalls.

### 2. Network & API Latency
The `geminiService.ts` handles complex LLM orchestrations. `withRetry` acts synchronously and blocks user responses. Without Websocket streaming for text generation, perceived latency is very high (up to 15-30s during active telemetry scans). 

### 3. State Management Memory Usage
`Graph.tsx` runs D3 forced simulation over potentially hundreds of nodes. `d3.forceSimulation` combined with React `useState` updates rapidly triggers CPU spiking on resize or node movement.

## Code Optimization & Implemented Changes

- **Debounced Rendering:** We recommend implementing React `Suspense` and `lazy` for loading Heavy charts (Recharts) and topological graphs (D3).
- **Memoization Added:** Arrays for node filtering in `Graph.tsx` have been strictly restricted via `useMemo` to eliminate constant re-calculations during the physics simulation tick rate.
- **Removed Artificial Delays:** Anti-patterns, such as manual `setTimeout()` artificially placed in data pipelines, have been stripped.

## Scalability Suggestions
For production, the Firebase NoSQL architecture is performant, but querying deeply nested sub-collections (`intelligence`, `monitoring_events`, `anomalies`) based on individual Targets could run into 'Index Missing' bugs.
We advise migrating heavy relational graph nodes (Network Topology calculations) out of Local Storage/Firebase directly into a specialized graph database (like Neo4j) connected via a secure Node.js middleware layer instead of processing mathematical topology directly on the client.
