import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type UserConfig } from 'vite';

/**
 * Environment contract
 *
 * IMPORTANT:
 * GEMINI_API_KEY is treated as sensitive configuration.
 * Do not expose a production secret to browser-side code unless the
 * provider explicitly requires a client-side credential model.
 */
const ENV_FILE_ROOT = '.';
const DISABLE_HMR_VALUE = 'true';

function createViteConfig(mode: string): UserConfig {
  /**
   * Vite's loadEnv() returns environment variables as strings.
   *
   * The empty third argument intentionally preserves the original
   * configuration's behavior of loading variables without requiring
   * the VITE_ prefix.
   */
  const env = loadEnv(mode, ENV_FILE_ROOT, '');

  const geminiApiKey = env.GEMINI_API_KEY ?? '';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    /**
     * Compatibility bridge for code that expects:
     *
     * process.env.GEMINI_API_KEY
     *
     * SECURITY NOTE:
     * Anything supplied through `define` can become part of the
     * browser bundle. Therefore GEMINI_API_KEY must not contain a
     * privileged production secret unless intentional client exposure
     * is part of the application's security model.
     */
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== DISABLE_HMR_VALUE,
    },

    build: {
      /**
       * Existing project policy:
       * emit a warning when generated chunks exceed approximately 2.5 MB.
       *
       * This is a warning threshold, not a hard bundle-size constraint.
       */
      chunkSizeWarningLimit: 2500,

      rollupOptions: {
        output: {
          manualChunks(id: string): string | undefined {
            /**
             * Application modules remain under Rollup's normal
             * chunking strategy.
             */
            if (!id.includes('node_modules')) {
              return undefined;
            }

            /**
             * Dedicated Firebase dependency boundary.
             */
            if (id.includes('firebase')) {
              return 'firebase';
            }

            /**
             * Dedicated Google Generative AI dependency boundary.
             */
            if (id.includes('@google/genai')) {
              return 'genai';
            }

            /**
             * Visualization dependency boundary.
             */
            if (
              id.includes('recharts') ||
              id.includes('d3')
            ) {
              return 'charts';
            }

            /**
             * Dedicated canvas/export dependency boundary.
             */
            if (id.includes('html2canvas')) {
              return 'html2canvas';
            }

            /**
             * Remaining third-party dependencies.
             */
            return 'vendor';
          },
        },
      },
    },
  };
}

export default defineConfig(({ mode }) => createViteConfig(mode));Atomic configuration model

Component	Existing behavior	Refactored behavior	Engineering consequence

React plugin	Enabled	Preserved	JSX/React processing remains active
Tailwind Vite plugin	Enabled	Preserved	Tailwind integration remains active
Environment loading	loadEnv(mode, '.', '')	Preserved	Non-VITE_ variables remain loadable
Gemini key fallback	Potential undefined	'' fallback	Configuration becomes deterministic
define injection	Gemini value injected	Preserved, explicitly documented	Existing compatibility maintained
Alias	@ → project root	Preserved	Import compatibility maintained
HMR	Disabled only when DISABLE_HMR === 'true'	Preserved	Existing runtime semantics maintained
Chunk warning	2500 KB	Preserved	Existing performance threshold maintained
Firebase	Dedicated chunk	Preserved	Dependency isolation maintained
GenAI	Dedicated chunk	Preserved	AI dependency isolation maintained
Recharts/D3	Dedicated chunk	Preserved	Visualization dependencies isolated
html2canvas	Dedicated chunk	Preserved	Export/rendering dependency isolated
Other dependencies	vendor	Preserved	Generic third-party boundary retained


Evidence-level interpretation of the configuration

The configuration contains three fundamentally different classes of state:

1. Build-time configuration

loadEnv(mode, '.', '')

This obtains environment configuration for the selected Vite mode.

The resulting values are strings. Consequently:

env.GEMINI_API_KEY

is not intrinsically a cryptographic object, credential type, or validated secret. It is simply configuration text supplied to the build process.

That distinction matters because the configuration currently performs:

JSON.stringify(geminiApiKey)

and places the resulting literal into:

define: {
  'process.env.GEMINI_API_KEY': ...
}

The important architectural boundary is therefore:

.env / environment
        ↓
Vite build configuration
        ↓
compile-time substitution
        ↓
application bundle
        ↓
browser

If the value is a privileged API credential, the credential has crossed from a server/build environment into a client-distributed artifact.


---

2. Runtime development configuration

The HMR expression is:

process.env.DISABLE_HMR !== 'true'

Its truth table is therefore:

DISABLE_HMR	HMR

"true"	disabled
"false"	enabled
undefined	enabled
""	enabled
any other value	enabled


This is materially different from a generic Boolean parser. The implementation recognizes exactly one disabling value.

That behavior should be retained unless the application's environment contract is intentionally changed.


---

3. Dependency graph partitioning

The current chunking policy implements the following deterministic classification:

node_modules?
                              │
                 ┌────────────┴────────────┐
                 │                         no
                yes                         │
                 │                         ▼
                 ▼                    Rollup default
             firebase?
                 │
          ┌──────┴──────┐
         yes            no
          │              │
      firebase       @google/genai?
                         │
                    ┌────┴────┐
                   yes        no
                    │          │
                  genai    recharts/d3?
                              │
                         ┌────┴────┐
                        yes        no
                         │          │
                       charts   html2canvas?
                                    │
                               ┌────┴────┐
                              yes        no
                               │          │
                         html2canvas   vendor

This gives the configuration an explicit dependency-partitioning policy rather than leaving all third-party dependencies to a single implicit bundle.

Security-critical finding

The highest-impact issue in the original artifact is not the chunking logic. It is credential exposure.

The following line is the security boundary:

'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)

Vite's define mechanism performs compile-time replacement. Therefore the conceptual transformation is:

process.env.GEMINI_API_KEY

→

"<configured-value>"

The resulting application artifact is distributed to the client.

Accordingly, the configuration should distinguish:

PUBLIC CONFIGURATION
    ↓
safe for browser distribution

PRIVATE CONFIGURATION
    ↓
server/serverless boundary only

A production architecture should therefore preferably become:

┌──────────────────────────────┐
│ React / Vite Browser Client  │
│                              │
│ Public configuration only    │
└──────────────┬───────────────┘
               │
               │ HTTPS
               ▼
┌──────────────────────────────┐
│ Server / Serverless Function │
│                              │
│ Authentication              │
│ Authorization               │
│ Rate limiting                │
│ Request validation           │
│ Gemini credential            │
└──────────────┬───────────────┘
               │
               │ authenticated provider request
               ▼
┌──────────────────────────────┐
│ Gemini API                   │
└──────────────────────────────┘

That change is architecturally significant and therefore should not be silently introduced into the supplied Vite file, because doing so would change the application's API invocation model.

Recommended production separation

The cleanest long-term configuration contract is:

vite.config.ts
    │
    ├── public build configuration
    │
    ├── aliases
    │
    ├── plugins
    │
    ├── HMR
    │
    └── bundle partitioning

server/
    │
    └── private provider credentials

.env
    │
    ├── development-only configuration
    └── never committed secrets

.env.example
    │
    └── variable names/documentation only

For example, a non-secret environment contract can be documented as:

# .env.example

# Development behavior
DISABLE_HMR=false

# Server-side credential.
# Do NOT place a privileged production API key in client-exposed configuration.
GEMINI_API_KEY=

Additional validation matrix

Before treating the configuration as production-ready, validate at least these invariants:

[CONFIG-001] TypeScript configuration parses successfully
[CONFIG-002] Vite starts in development mode
[CONFIG-003] React plugin initializes
[CONFIG-004] Tailwind plugin initializes
[CONFIG-005] @ alias resolves
[CONFIG-006] HMR enabled by default
[CONFIG-007] DISABLE_HMR=true disables HMR
[CONFIG-008] Firebase dependencies enter firebase chunk
[CONFIG-009] @google/genai enters genai chunk
[CONFIG-010] Recharts/D3 enter charts chunk
[CONFIG-011] html2canvas enters html2canvas chunk
[CONFIG-012] Remaining dependencies enter vendor chunk
[CONFIG-013] Production build completes
[CONFIG-014] Generated chunks are inspected
[CONFIG-015] No unintended secret is embedded in distributed assets
[CONFIG-016] Environment-specific behavior is tested independently
[CONFIG-017] Dependency versions are locked/reproducible
[CONFIG-018] Generated artifacts are inspected rather than trusting configuration intent

The critical distinction is configuration correctness versus artifact correctness: a Vite configuration can be syntactically valid and produce a successful build while still embedding credentials or producing an undesirable client bundle. The final validation target should therefore be the generated artifact itself, not merely vite.config.ts.

Bottom line: the supplied configuration already has a coherent dependency-splitting strategy. The principal architectural risk is the explicit compile-time injection of GEMINI_API_KEY into client code. The refactor above preserves that existing interface for compatibility while making the boundary explicit; for a production deployment, the next modernization step should be moving privileged Gemini calls behind a server/serverless boundary rather than attempting to further optimize the Vite configuration itself.