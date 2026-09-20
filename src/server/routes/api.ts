import express, { Request, Response, NextFunction } from "express";
import dns from "node:dns/promises";
import net from "node:net";
import { logger } from "../../utils/logger";

const apiRouter = express.Router();

/* ============================================================================
 * 0. GLOBAL SECURITY / RESOURCE LIMITS
 * ============================================================================
 *
 * These limits are deliberately explicit. They prevent unbounded user input
 * from becoming an allocation, cache, logging, database, or upstream-provider
 * amplification primitive.
 */

const LIMITS = Object.freeze({
  contextChars: 512,
  domainChars: 253,
  nodes: 5_000,
  edges: 10_000,
  cypherChars: 20_000,
  records: 10_000,
  relationshipChars: 64,
  nodeIdChars: 512,
  labelChars: 512,
  dimensionChars: 128,
  typeChars: 128,
  sourceChars: 512,
});

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

const NEO4J_CONNECT_TIMEOUT_MS = 10_000;
const DNS_TIMEOUT_MS = 5_000;

/* ============================================================================
 * 1. COMMON TYPES
 * ========================================================================== */

type EvidenceState =
  | "observed"
  | "derived"
  | "cached"
  | "not_found"
  | "unavailable"
  | "error";

interface Provenance {
  provider: string;
  operation: string;
  observedAt: string;
  state: EvidenceState;
  source?: string;
  query?: string;
}

interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface ThreatIntelResponse {
  summary: string;
  sources: Array<{
    title: string;
    uri: string;
  }>;
  isFallback?: boolean;
  provenance?: Provenance;
}

interface ReconResponse {
  dnsRecords: string[];
  status:
    | "ok"
    | "no_domain"
    | "not_found"
    | "provider_error"
    | "validation_error";
  observed: boolean;
  provenance: Provenance;
  error?: ApiError;
}

/* ============================================================================
 * 2. BOUNDED TTL/LRU CACHE
 * ============================================================================
 *
 * The original implementation called this a TTL cache but actually performed
 * FIFO eviction. This implementation provides:
 *
 *   - TTL expiration
 *   - bounded memory
 *   - LRU promotion
 *   - explicit generic typing
 *   - no truthiness-based cache misses
 */

class TtlLruCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }

    // Promote to MRU.
    this.entries.delete(key);
    this.entries.set(key, entry);

    return entry.data;
  }

  set(key: string, data: T): void {
    this.entries.delete(key);

    while (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;

      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      } else {
        break;
      }
    }

    const timestamp = Date.now();

    this.entries.set(key, {
      data,
      timestamp,
      expiresAt: timestamp + this.ttlMs,
    });
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

const intelCache = new TtlLruCache<ThreatIntelResponse>(
  MAX_CACHE_ENTRIES,
  CACHE_TTL_MS,
);

/* ============================================================================
 * 3. INPUT VALIDATION / NORMALIZATION
 * ========================================================================== */

function asNonEmptyString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new ValidationError(
      `${field} must be a string`,
      "INVALID_STRING",
    );
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new ValidationError(
      `${field} cannot be empty`,
      "EMPTY_VALUE",
    );
  }

  if (normalized.length > maxLength) {
    throw new ValidationError(
      `${field} exceeds the maximum length of ${maxLength}`,
      "VALUE_TOO_LONG",
    );
  }

  return normalized;
}

class ValidationError extends Error {
  readonly statusCode = 400;

  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

function clampFiniteNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

/* ============================================================================
 * 4. DOMAIN / IP NORMALIZATION
 * ============================================================================
 *
 * Important semantic rule:
 *
 *   Input normalization must not silently convert malformed input into a
 *   potentially unrelated target such as "localhost".
 *
 * IPv4 and IPv6 are handled separately because IPv6 contains ":" and therefore
 * cannot safely be processed with naive split(":") logic.
 */

function normalizeHostname(value: string): string {
  let candidate = value.trim();

  if (!candidate) {
    throw new ValidationError(
      "Domain or IP address is empty",
      "EMPTY_DOMAIN",
    );
  }

  // URL form.
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(candidate)) {
    let parsed: URL;

    try {
      parsed = new URL(candidate);
    } catch {
      throw new ValidationError(
        "Invalid URL supplied as domain",
        "INVALID_URL",
      );
    }

    candidate = parsed.hostname;
  } else {
    // Handle common host/path forms without treating arbitrary schemes as
    // valid hostnames.
    candidate = candidate.split(/[/?#\s,;]+/, 1)[0] ?? "";
  }

  // Remove IPv6 brackets.
  if (candidate.startsWith("[") && candidate.endsWith("]")) {
    candidate = candidate.slice(1, -1);
  }

  // IPv6.
  if (net.isIP(candidate) === 6) {
    return candidate.toLowerCase();
  }

  // IPv4.
  if (net.isIP(candidate) === 4) {
    return candidate;
  }

  // DNS hostname.
  candidate = candidate.replace(/\.$/, "").toLowerCase();

  if (candidate.length > LIMITS.domainChars) {
    throw new ValidationError(
      "Hostname exceeds DNS maximum length",
      "DOMAIN_TOO_LONG",
    );
  }

  const labels = candidate.split(".");

  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    )
  ) {
    throw new ValidationError(
      "Invalid hostname or IP address",
      "INVALID_DOMAIN",
    );
  }

  return candidate;
}

function cleanAndExtractDomain(input: string): string {
  return normalizeHostname(
    asNonEmptyString(input, "domain", LIMITS.domainChars),
  );
}

/* ============================================================================
 * 5. SAFE LOGGING
 * ============================================================================
 *
 * Never log passwords, complete authorization headers, or unrestricted query
 * payloads. Query strings may contain secrets and personal information.
 */

function safeLogIdentifier(value: string, max = 128): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max)}…`;
}

function redactNeo4jUri(uri: string): string {
  try {
    const parsed = new URL(uri);

    if (parsed.username) {
      parsed.username = "[REDACTED]";
    }

    if (parsed.password) {
      parsed.password = "[REDACTED]";
    }

    return parsed.toString();
  } catch {
    return "[INVALID_URI]";
  }
}

/* ============================================================================
 * 6. ERROR SERIALIZATION
 * ========================================================================== */

function isRetryableError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);

  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("eai_again") ||
    message.includes("resource_exhausted") ||
    message.includes("429") ||
    message.includes("503") ||
    message.includes("temporarily unavailable")
  );
}

function serializeError(error: unknown): ApiError {
  const message =
    error instanceof Error ? error.message : "Unexpected provider error";

  return {
    code: "UPSTREAM_PROVIDER_ERROR",
    message,
    retryable: isRetryableError(error),
  };
}

/* ============================================================================
 * 7. ASYNC TIMEOUT
 * ========================================================================== */

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/* ============================================================================
 * 8. HEALTH
 * ========================================================================== */

apiRouter.get("/health", (_req: Request, res: Response) => {
  logger.info("Healthcheck endpoint pinged", {
    module: "API-Gateway",
  });

  return res.status(200).json({
    status: "ok",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    message: "Service-Oriented API Gateway Operational",
  });
});

/* ============================================================================
 * 9. OBSERVABILITY
 * ========================================================================== */

apiRouter.get("/observability/metrics", (_req: Request, res: Response) => {
  const mem = process.memoryUsage();

  return res.status(200).json({
    uptimeSeconds: process.uptime(),
    memoryUsage: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    },
    cache: {
      threatIntelEntries: intelCache.size,
      maxEntries: MAX_CACHE_ENTRIES,
      ttlSeconds: CACHE_TTL_MS / 1000,
    },
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/* ============================================================================
 * 10. THREAT INTELLIGENCE
 * ============================================================================
 *
 * Evidence contract:
 *
 * A provider failure MUST NOT be converted into fabricated intelligence.
 *
 * The original implementation generated statements such as "active digital
 * footprint correlations" even when the upstream AI service had failed.
 * That is analytically unsafe because it changes:
 *
 *     unavailable evidence
 *
 * into:
 *
 *     asserted evidence
 *
 * This implementation preserves the distinction.
 */

apiRouter.get(
  "/threat-intel",
  async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    try {
      const context = asNonEmptyString(
        req.query.context,
        "context",
        LIMITS.contextChars,
      );

      const cached = intelCache.get(context);

      if (cached) {
        const cachedResponse: ThreatIntelResponse = {
          ...cached,
          provenance: {
            ...(cached.provenance ?? {
              provider: "unknown",
              operation: "threat-intel",
              observedAt: new Date().toISOString(),
              state: "cached",
            }),
            state: "cached",
          },
        };

        logger.info("Threat-intel cache hit", {
          module: "Threat-Intel",
          context: safeLogIdentifier(context),
          durationMs: Date.now() - startTime,
        });

        return res.status(200).json(cachedResponse);
      }

      try {
        const { analyzeSurfaceWeb } = await import(
          "../../services/geminiService"
        );

        const result = await withTimeout(
          analyzeSurfaceWeb(context),
          30_000,
        );

        const response: ThreatIntelResponse = {
          ...result,
          provenance: {
            provider: "geminiService",
            operation: "surface-web-analysis",
            observedAt: new Date().toISOString(),
            state: "derived",
          },
        };

        intelCache.set(context, response);

        logger.info("Threat-intel analysis completed", {
          module: "Threat-Intel",
          durationMs: Date.now() - startTime,
        });

        return res.status(200).json(response);
      } catch (providerError) {
        const error = serializeError(providerError);

        logger.warn("Threat-intel provider unavailable", {
          module: "Threat-Intel",
          reason: error.code,
          retryable: error.retryable,
          durationMs: Date.now() - startTime,
        });

        /*
         * No synthetic threat assertions.
         *
         * The response remains machine-readable and useful while explicitly
         * identifying the absence of an observed provider result.
         */
        const unavailableResponse: ThreatIntelResponse = {
          summary:
            "Threat-intelligence analysis could not be completed because the configured analysis provider was unavailable. No threat observation is asserted by this response.",
          sources: [],
          isFallback: true,
          provenance: {
            provider: "geminiService",
            operation: "surface-web-analysis",
            observedAt: new Date().toISOString(),
            state: "unavailable",
          },
        };

        return res.status(error.retryable ? 503 : 502).json({
          ...unavailableResponse,
          error,
        });
      }
    } catch (error) {
      return next(error);
    }
  },
);

/* ============================================================================
 * 11. DNS RECONNAISSANCE
 * ============================================================================
 *
 * DNS resolution is an observation operation.
 *
 * No DNS record is synthesized when resolution fails.
 */

async function resolveDns(
  hostname: string,
): Promise<string[]> {
  const ipVersion = net.isIP(hostname);

  if (ipVersion === 4 || ipVersion === 6) {
    return [hostname];
  }

  const [ipv4, ipv6] = await Promise.allSettled([
    withTimeout(dns.resolve4(hostname), DNS_TIMEOUT_MS),
    withTimeout(dns.resolve6(hostname), DNS_TIMEOUT_MS),
  ]);

  const addresses = new Set<string>();

  if (ipv4.status === "fulfilled") {
    for (const address of ipv4.value) {
      addresses.add(address);
    }
  }

  if (ipv6.status === "fulfilled") {
    for (const address of ipv6.value) {
      addresses.add(address);
    }
  }

  return [...addresses];
}

apiRouter.post(
  "/recon",
  async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    try {
      if (req.body?.domain === undefined) {
        const response: ReconResponse = {
          dnsRecords: [],
          status: "no_domain",
          observed: false,
          provenance: {
            provider: "node-dns",
            operation: "A+AAAA-resolution",
            observedAt: new Date().toISOString(),
            state: "not_found",
          },
        };

        return res.status(200).json(response);
      }

      let cleanedDomain: string;

      try {
        cleanedDomain = cleanAndExtractDomain(req.body.domain);
      } catch (error) {
        if (error instanceof ValidationError) {
          return res.status(error.statusCode).json({
            dnsRecords: [],
            status: "validation_error",
            observed: false,
            provenance: {
              provider: "node-dns",
              operation: "A+AAAA-resolution",
              observedAt: new Date().toISOString(),
              state: "error",
            },
            error: {
              code: error.code,
              message: error.message,
              retryable: false,
            },
          } satisfies ReconResponse);
        }

        throw error;
      }

      try {
        const dnsRecords = await resolveDns(cleanedDomain);

        if (dnsRecords.length === 0) {
          return res.status(404).json({
            dnsRecords: [],
            status: "not_found",
            observed: true,
            provenance: {
              provider: "node-dns",
              operation: "A+AAAA-resolution",
              observedAt: new Date().toISOString(),
              state: "not_found",
              query: cleanedDomain,
            },
          } satisfies ReconResponse);
        }

        logger.info("DNS reconnaissance completed", {
          module: "Recon",
          domain: safeLogIdentifier(cleanedDomain),
          recordCount: dnsRecords.length,
          durationMs: Date.now() - startTime,
        });

        return res.status(200).json({
          dnsRecords,
          status: "ok",
          observed: true,
          provenance: {
            provider: "node-dns",
            operation: "A+AAAA-resolution",
            observedAt: new Date().toISOString(),
            state: "observed",
            query: cleanedDomain,
          },
        } satisfies ReconResponse);
      } catch (error) {
        const serialized = serializeError(error);

        logger.warn("DNS reconnaissance failed", {
          module: "Recon",
          domain: safeLogIdentifier(cleanedDomain),
          retryable: serialized.retryable,
          durationMs: Date.now() - startTime,
        });

        return res.status(503).json({
          dnsRecords: [],
          status: "provider_error",
          observed: false,
          provenance: {
            provider: "node-dns",
            operation: "A+AAAA-resolution",
            observedAt: new Date().toISOString(),
            state: "unavailable",
            query: cleanedDomain,
          },
          error: serialized,
        } satisfies ReconResponse);
      }
    } catch (error) {
      return next(error);
    }
  },
);

/* ============================================================================
 * 12. NEO4J SECURITY MODEL
 * ============================================================================
 *
 * The original endpoint accepted arbitrary Neo4j connection details directly
 * from every request. That creates a potential server-side connection/SSRF
 * surface.
 *
 * Therefore request-supplied Neo4j connections require explicit opt-in:
 *
 *   NEO4J_ALLOW_REQUEST_URI=true
 *
 * Production deployments should preferably use trusted server-side
 * configuration instead.
 */

function assertNeo4jRequestUriAllowed(uri: string): URL {
  if (process.env.NEO4J_ALLOW_REQUEST_URI !== "true") {
    throw new ValidationError(
      "Request-supplied Neo4j URIs are disabled. Configure a trusted server-side Neo4j connection.",
      "REQUEST_URI_DISABLED",
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(uri);
  } catch {
    throw new ValidationError(
      "Invalid Neo4j URI",
      "INVALID_NEO4J_URI",
    );
  }

  const allowedProtocols = new Set([
    "bolt:",
    "neo4j:",
    "neo4j+s:",
    "neo4j+ssc:",
  ]);

  if (!allowedProtocols.has(parsed.protocol)) {
    throw new ValidationError(
      "Unsupported Neo4j URI scheme",
      "UNSUPPORTED_NEO4J_SCHEME",
    );
  }

  if (!parsed.hostname) {
    throw new ValidationError(
      "Neo4j URI must specify a hostname",
      "MISSING_NEO4J_HOST",
    );
  }

  return parsed;
}

function normalizeNeo4jCredentials(body: any): {
  uri: string;
  username: string;
  password: string;
  database?: string;
} {
  const uri = asNonEmptyString(
    body?.uri,
    "uri",
    2_048,
  );

  const username = asNonEmptyString(
    body?.username,
    "username",
    512,
  );

  if (typeof body?.password !== "string") {
    throw new ValidationError(
      "password must be supplied as a string",
      "INVALID_PASSWORD",
    );
  }

  const database =
    body?.database === undefined
      ? undefined
      : asNonEmptyString(body.database, "database", 128);

  assertNeo4jRequestUriAllowed(uri);

  return {
    uri,
    username,
    password: body.password,
    database,
  };
}

async function createNeo4jDriver(config: {
  uri: string;
  username: string;
  password: string;
}) {
  const neo4j = (await import("neo4j-driver")).default;

  return neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.username, config.password),
    {
      connectionTimeout: NEO4J_CONNECT_TIMEOUT_MS,
    },
  );
}

/* ============================================================================
 * 13. NEO4J CONNECTION TEST
 * ========================================================================== */

apiRouter.post(
  "/graph/neo4j/test",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = normalizeNeo4jCredentials(req.body);

      const driver = await createNeo4jDriver(config);

      try {
        const serverInfo = await withTimeout(
          driver.getServerInfo(),
          NEO4J_CONNECT_TIMEOUT_MS,
        );

        logger.info("Neo4j connection test succeeded", {
          module: "Graph-Engine",
          uri: redactNeo4jUri(config.uri),
        });

        return res.status(200).json({
          success: true,
          message: "Successfully connected to Neo4j.",
          provenance: {
            provider: "neo4j-driver",
            operation: "server-info",
            observedAt: new Date().toISOString(),
            state: "observed",
          },
          serverInfo: {
            address: serverInfo.address,
            agent: serverInfo.agent,
            protocolVersion: serverInfo.protocolVersion,
          },
        });
      } finally {
        await driver.close();
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryable: false,
          },
        });
      }

      logger.warn("Neo4j connection test failed", {
        module: "Graph-Engine",
        error:
          error instanceof Error ? error.message : "Unknown connection error",
      });

      return res.status(502).json({
        success: false,
        error: serializeError(error),
      });
    }
  },
);

/* ============================================================================
 * 14. GRAPH INPUT NORMALIZATION
 * ========================================================================== */

interface NormalizedNode {
  id: string;
  label: string;
  dimension: string;
  type: string;
  confidence: number;
  source: string;
}

interface NormalizedEdge {
  src: string;
  tgt: string;
  relationship: string;
  confidence: number;
  dataSource: string;
}

/*
 * Neo4j relationship identifiers cannot be supplied as ordinary Cypher
 * parameters. Therefore they must be validated against a closed allowlist.
 *
 * This is materially safer than:
 *
 *     `MERGE (a)-[r:${clientValue}]->(b)`
 */

const ALLOWED_RELATIONSHIPS = new Set([
  "RELATES_TO",
  "DEPENDS_ON",
  "HOSTS",
  "RESOLVES_TO",
  "ASSOCIATED_WITH",
  "CONNECTED_TO",
  "OBSERVED_AT",
  "ATTRIBUTED_TO",
  "DERIVED_FROM",
  "REFERENCES",
  "CONTAINS",
]);

function normalizeRelationship(value: unknown): string {
  const normalized = String(value ?? "RELATES_TO")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");

  if (
    normalized.length > LIMITS.relationshipChars ||
    !ALLOWED_RELATIONSHIPS.has(normalized)
  ) {
    throw new ValidationError(
      `Unsupported relationship type: ${normalized}`,
      "UNSUPPORTED_RELATIONSHIP",
    );
  }

  return normalized;
}

function normalizeNode(node: any): NormalizedNode {
  const id = asNonEmptyString(
    node?.id,
    "node.id",
    LIMITS.nodeIdChars,
  );

  return {
    id,
    label:
      node?.label === undefined
        ? id
        : asNonEmptyString(
            node.label,
            "node.label",
            LIMITS.labelChars,
          ),
    dimension:
      node?.dimension === undefined
        ? "artifact"
        : asNonEmptyString(
            node.dimension,
            "node.dimension",
            LIMITS.dimensionChars,
          ),
    type:
      node?.type === undefined
        ? "entity"
        : asNonEmptyString(
            node.type,
            "node.type",
            LIMITS.typeChars,
          ),
    confidence: clampFiniteNumber(
      node?.metadata?.confidence,
      0.9,
      0,
      1,
    ),
    source:
      node?.metadata?.source === undefined
        ? "CTI Analysis"
        : asNonEmptyString(
            node.metadata.source,
            "node.metadata.source",
            LIMITS.sourceChars,
          ),
  };
}

function normalizeEdge(edge: any): NormalizedEdge {
  const source =
    typeof edge?.source === "object"
      ? edge?.source?.id
      : edge?.source;

  const target =
    typeof edge?.target === "object"
      ? edge?.target?.id
      : edge?.target;

  return {
    src: asNonEmptyString(
      source,
      "edge.source",
      LIMITS.nodeIdChars,
    ),
    tgt: asNonEmptyString(
      target,
      "edge.target",
      LIMITS.nodeIdChars,
    ),
    relationship: normalizeRelationship(edge?.relationship),
    confidence: clampFiniteNumber(
      edge?.confidence,
      0.9,
      0,
      1,
    ),
    dataSource:
      edge?.dataSource === undefined
        ? "Attribution"
        : asNonEmptyString(
            edge.dataSource,
            "edge.dataSource",
            LIMITS.sourceChars,
          ),
  };
}

/* ============================================================================
 * 15. NEO4J GRAPH SYNCHRONIZATION
 * ========================================================================== */

apiRouter.post(
  "/graph/neo4j/sync",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawNodes = Array.isArray(req.body?.nodes)
        ? req.body.nodes
        : [];

      const rawEdges = Array.isArray(req.body?.edges)
        ? req.body.edges
        : [];

      if (rawNodes.length > LIMITS.nodes) {
        throw new ValidationError(
          `nodes exceeds maximum batch size of ${LIMITS.nodes}`,
          "NODE_LIMIT_EXCEEDED",
        );
      }

      if (rawEdges.length > LIMITS.edges) {
        throw new ValidationError(
          `edges exceeds maximum batch size of ${LIMITS.edges}`,
          "EDGE_LIMIT_EXCEEDED",
        );
      }

      const nodes = rawNodes.map(normalizeNode);
      const edges = rawEdges.map(normalizeEdge);

      if (!req.body?.uri || !req.body?.username) {
        return res.status(200).json({
          success: true,
          persisted: false,
          message:
            "Graph state validated successfully but no external Neo4j connection was supplied.",
          syncedNodes: 0,
          syncedEdges: 0,
          validatedNodes: nodes.length,
          validatedEdges: edges.length,
          provenance: {
            provider: "gateway-validation",
            operation: "graph-sync-validation",
            observedAt: new Date().toISOString(),
            state: "derived",
          },
        });
      }

      const config = normalizeNeo4jCredentials(req.body);

      const driver = await createNeo4jDriver(config);
      const session = driver.session({
        database: config.database,
      });

      try {
        /*
         * Nodes are ingested in a single UNWIND operation.
         */
        if (nodes.length > 0) {
          await session.run(
            `
            UNWIND $batch AS item
            MERGE (e:Entity {id: item.id})
            SET
              e.label = item.label,
              e.dimension = item.dimension,
              e.type = item.type,
              e.confidence = item.confidence,
              e.source = item.source,
              e.updatedAt = datetime()
            `,
            {
              batch: nodes,
            },
          );
        }

        /*
         * Relationship types cannot be Cypher parameters.
         *
         * We therefore group edges by a server-validated relationship type.
         * Every interpolated identifier originates exclusively from the
         * ALLOWED_RELATIONSHIPS set.
         */
        const edgesByRelationship = new Map<
          string,
          NormalizedEdge[]
        >();

        for (const edge of edges) {
          const current =
            edgesByRelationship.get(edge.relationship) ?? [];

          current.push(edge);
          edgesByRelationship.set(edge.relationship, current);
        }

        for (const [
          relationship,
          relationshipEdges,
        ] of edgesByRelationship.entries()) {
          await session.run(
            `
            UNWIND $batch AS item
            MATCH (a:Entity {id: item.src})
            MATCH (b:Entity {id: item.tgt})
            MERGE (a)-[r:${relationship}]->(b)
            SET
              r.confidence = item.confidence,
              r.dataSource = item.dataSource,
              r.updatedAt = datetime()
            `,
            {
              batch: relationshipEdges,
            },
          );
        }

        logger.info("Neo4j graph synchronization completed", {
          module: "Graph-Engine",
          nodesCount: nodes.length,
          edgesCount: edges.length,
        });

        return res.status(200).json({
          success: true,
          persisted: true,
          message: "Graph synchronization completed.",
          syncedNodes: nodes.length,
          syncedEdges: edges.length,
          provenance: {
            provider: "neo4j-driver",
            operation: "graph-sync",
            observedAt: new Date().toISOString(),
            state: "observed",
          },
        });
      } finally {
        await session.close();
        await driver.close();
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryable: false,
          },
        });
      }

      logger.error("Neo4j graph synchronization failed", {
        module: "Graph-Engine",
        error:
          error instanceof Error ? error.message : "Unknown sync error",
      });

      return res.status(502).json({
        success: false,
        error: serializeError(error),
      });
    }
  },
);

/* ============================================================================
 * 16. CONTROLLED CYPHER EXECUTION
 * ============================================================================
 *
 * IMPORTANT:
 *
 * Arbitrary Cypher remains inherently privileged. It should ideally be
 * replaced with an operation registry. This endpoint is retained for
 * compatibility, but:
 *
 *   1. request URI access remains explicitly gated;
 *   2. query length is bounded;
 *   3. result count is bounded;
 *   4. query text is never written to logs;
 *   5. credentials are never logged;
 *   6. parameterized Cypher is supported.
 *
 * Production deployments should additionally put this route behind
 * authorization and preferably disable it entirely.
 */

function validateCypher(cypher: unknown): string {
  const query = asNonEmptyString(
    cypher,
    "cypher",
    LIMITS.cypherChars,
  );

  if (/\b(CREATE|DELETE|DETACH|DROP|SET|REMOVE|MERGE)\b/i.test(query)) {
    if (process.env.NEO4J_ALLOW_WRITE_QUERIES !== "true") {
      throw new ValidationError(
        "Write-capable Cypher is disabled.",
        "WRITE_QUERY_DISABLED",
      );
    }
  }

  return query;
}

apiRouter.post(
  "/graph/neo4j/query",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cypher = validateCypher(req.body?.cypher);

      const config = normalizeNeo4jCredentials(req.body);

      const parameters =
        req.body?.parameters &&
        typeof req.body.parameters === "object"
          ? req.body.parameters
          : {};

      const driver = await createNeo4jDriver(config);
      const session = driver.session({
        database: config.database,
      });

      try {
        const result = await withTimeout(
          session.run(cypher, parameters),
          NEO4J_CONNECT_TIMEOUT_MS,
        );

        const records = result.records
          .slice(0, LIMITS.records)
          .map((record) => record.toObject());

        const truncated =
          result.records.length > LIMITS.records;

        logger.info("Cypher query executed", {
          module: "Graph-Engine",
          recordCount: records.length,
          truncated,
        });

        return res.status(200).json({
          success: true,
          records,
          truncated,
          provenance: {
            provider: "neo4j-driver",
            operation: "cypher-query",
            observedAt: new Date().toISOString(),
            state: "observed",
          },
        });
      } finally {
        await session.close();
        await driver.close();
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryable: false,
          },
        });
      }

      logger.warn("Cypher execution failed", {
        module: "Graph-Engine",
        error:
          error instanceof Error ? error.message : "Unknown query error",
      });

      return res.status(502).json({
        success: false,
        error: serializeError(error),
      });
    }
  },
);

/* ============================================================================
 * 17. CENTRAL ERROR HANDLER
 * ============================================================================
 */

apiRouter.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          retryable: false,
        },
      });
    }

    logger.error("Unhandled API gateway exception", {
      module: "API-Gateway",
      error:
        error instanceof Error
          ? error.message
          : "Unknown exception",
    });

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error.",
        retryable: false,
      },
    });
  },
);

export { apiRouter };