# UI/UX Audit & Redesign Proposal

## High-Level Assessment
Shadow Harvest presents a deeply thematic ("cyber-espionage", "dark theme") interactive application. However, thematic styling sometimes introduces friction in standard UX accessibility rules.

## Usability Issues & Friction Points
1. **Contrast Compliance:** Certain `text-gray-600` on black backgrounds is below the WCAG 4.5:1 ratio, making it unreadable for vision-impaired analysts.
2. **Tab Navigation Overload:** The TargetView contains up to 10 separate tabs (OSINT, Profiling, Code, Graph, etc.). For smaller screens, structural breakdown occurs.
3. **Form Density:** Setting up MISP and OTX integrations packs input fields too tightly. Error feedback is primarily via hover states.

## Accessibility (a11y) Violations
- Lack of `aria-labels` on heavy interactive components (e.g. Graph nodes, export buttons).
- Custom modal popups (`ExportDataModal`) trap focus but lack complete screen reader announce tags (`aria-live`).

## Proposed Redesign Proposal
- **Streamlined Navigation:** Condense 'OSINT' and 'Profiling' into "Entity Enrichment," and 'Graph' and 'Visuals' into "Topology/Visuals". 
- **Modern Unified Design System:** Stick to `bg-black` but standardize surface variants to `bg-harvest-card/50` for elevation. Eliminate raw hex codes in `VisualizationDashboard`.
- **Responsive Breakpoints:** Improve the layout to collapse grids (`grid-cols-2`, `grid-cols-4`) optimally at the `md` and `lg` breakpoints rather than standardizing desktop widths for all viewports.
