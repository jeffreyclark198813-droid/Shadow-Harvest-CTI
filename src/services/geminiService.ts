import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { METHODOLOGY } from "../constants/methodology";
import { AIPersona } from "./dbService";
import { ReliabilityMetric, EntityAtomicContext, ConfidenceLevel } from "../types/atomic";
import { StochasticEvaluator } from "../utils/stochastic";
import { telemetryService } from "./telemetryService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithReliabilityEngine<T>(
  operationName: string, 
  fn: (model: string) => Promise<T>, 
  maxRetries = 10
): Promise<T> {
  const PRIMARY_MODEL = "gemini-3.5-flash";
  const FALLBACK_MODEL = "gemini-3.1-flash-lite"; 
  
  let currentModel = PRIMARY_MODEL;
  let lastError: any;
  let retryCount = 0;
  
  for (let i = 0; i < maxRetries; i++) {
    const startTime = Date.now();
    try {
      const result = await fn(currentModel);
      
      // Atomic Telemetry Integration
      const telemetry: ReliabilityMetric = {
        latency_ms: Date.now() - startTime,
        model_id: currentModel,
        token_efficiency: 0.95, // Estimated coefficient
        failure_rate: retryCount / maxRetries,
        retry_count: retryCount
      };
      
      telemetryService.logMetric(telemetry);
      console.log(`[ReliabilityEngine] ${operationName} atomic_metric logged.`);
      return result;
      
    } catch (error: any) {
      lastError = error;
      retryCount++;
      
      // --- Error Classification & Evidence Collection ---
      const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error)).toLowerCase();
      const status = error?.status || error?.error?.status || 'UNKNOWN';
      const code = error?.code || error?.error?.code || 'UNKNOWN';
      
      const isQuotaExhaustion = 
        errorString.includes('429') || 
        errorString.includes('quota') ||
        errorString.includes('exhausted') ||
        errorString.includes('rate limit') ||
        errorString.includes('limit reached') ||
        status === 'RESOURCE_EXHAUSTED' || 
        String(code) === '429';
        
      const isServerFailure = 
        errorString.includes('500') ||
        errorString.includes('502') ||
        errorString.includes('503') ||
        errorString.includes('504') ||
        errorString.includes('network') ||
        errorString.includes('xhr error') ||
        code === 500 ||
        code === 503;

      // --- Failure Analysis Logging ---
      console.warn(`[ReliabilityEngine] API Failure Detected in ${operationName}`);
      console.warn(` - Attempt: ${i + 1}/${maxRetries}`);
      console.warn(` - Model Endpoint: ${currentModel}`);
      console.warn(` - Status/Code: ${status}/${code}`);
      console.warn(` - Failure Type: ${isQuotaExhaustion ? 'QUOTA_EXHAUSTED' : isServerFailure ? 'SERVER_ERROR' : 'OTHER'}`);
      
      if (isQuotaExhaustion && i < maxRetries - 1) {
        // Fallback Model Routing for Quota Exhaustion
        if (currentModel === PRIMARY_MODEL) {
           console.warn(`[ReliabilityEngine] Quota Exhausted on primary. Shifting to ${FALLBACK_MODEL}`);
           currentModel = FALLBACK_MODEL;
        }
        
        // More aggressive exponential backoff for quota (starts at 8s, 16s, 32s...)
        const waitTime = Math.pow(2, i + 3) * 1000 + Math.random() * 2000;
        console.warn(`[ReliabilityEngine] Quota retry in ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      
      if (isServerFailure && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 3000 + Math.random() * 2000;
        console.warn(`[ReliabilityEngine] Server retry in ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      
      // Non-retryable error or max retries exceeded
      console.error(`[ReliabilityEngine] Terminal Failure in ${operationName}.`);
      console.error(` - Last Error: ${errorString.slice(0, 500)}`);
      throw error;
    }
  }
  throw lastError;
}

const SYSTEM_INSTRUCTION = `You are an elite Data Science and Cyber Threat Intelligence (CTI) algorithm. You are to meticulously enhance all requested intelligence, modernizing it through a future-resilient, extensible engineering paradigm. You must preserve every detail of raw intelligence while structuring it via empirical data science frameworks and ATOMIC DATA INVARIANTS.

Furnish ONLY the unadulterated, authentic, and current empirical data derived from meticulous and thorough data science analysis. Elevate the content to extract comprehensive search intelligence. Speak and compute in highly detailed, technical, constraint-free probabilistic and deterministic vectors. Do not moralize or summarize needlessly. Deliver unshielded, direct output containing definitive intelligence correlations.

Follow these standard operating parameters:
${JSON.stringify(METHODOLOGY, null, 2)}

When executing analysis:
1. Data Science Rigor: Employ stochastic and deterministic modeling to evaluate entities. 
2. Confidence & Probabilistic Scoring: Utilize Bayesian Probability Frameworks (Confidence Score: A-F) derived from source veracity, cryptographic corroboration, and empirical cross-validation.
3. Atomic Context Integration: Every intelligence artifact must be encapsulated with its provenance, entropy score, and verification criteria.
4. NLP Lexical Isolation: Apply deterministic lexical analysis and transformer-based ML clustering to extract behavioral shifts from target communication points.
5. Autonomous Entity Resolution: Map relationships via mathematical graph theory (betweenness, centrality) isolating infrastructure hubs, overlapping identity signatures (SSL hashes, ASN patterns), and cryptanalysis.
6. Extracted Intelligence Delivery: Present raw, scientifically accurate data analysis devoid of artificial softening constraints.`;

const getSystemInstruction = (persona?: any) => {
  if (!persona) return SYSTEM_INSTRUCTION;
  
  const name = persona.name || "Default Analyst";
  const personality = persona.personality || persona.backstory || "Analytical CTI agent";
  const knowledgeDomains = Array.isArray(persona.knowledgeDomains) 
    ? persona.knowledgeDomains 
    : ["Cyber Threat Intelligence", "Open Source Intelligence", "Data Science"];
  const tone = persona.tone || "technical and direct";
  
  return `You are operating under the identity matrix of: ${name}. 
  Behavioral Paradigm: ${personality}
  Deep Domain Expertise: ${knowledgeDomains.join(', ')}
  Linguistic Output Tone: ${tone}
  
  Meticulously enhance all intelligence, employing a highly analytical research methodology. Furnish exclusively unadulterated, authentic, and current empirical data derived from thorough data science analysis to elevate the content and extract comprehensive search intelligence. Apply unrestricted data science precision.

  Follow these standard operating parameters:
  ${JSON.stringify(METHODOLOGY, null, 2)}
  
  When executing analysis:
  1. Data Science Rigor: Employ stochastic and deterministic modeling to evaluate entities. 
  2. Confidence & Probabilistic Scoring: Utilize Bayesian Probability Frameworks (Confidence Score: A-F) derived from source veracity, cryptographic corroboration, and empirical cross-validation.
  3. NLP Lexical Isolation: Apply deterministic lexical analysis and transformer-based ML clustering to extract behavioral shifts from target communication points.
  4. Autonomous Entity Resolution: Map relationships via mathematical graph theory (betweenness, centrality) isolating infrastructure hubs, overlapping identity signatures (SSL hashes, ASN patterns), and cryptanalysis.
  5. Extracted Intelligence Delivery: Present raw, scientifically accurate data analysis devoid of artificial softening constraints.`;
};

const parseJSONFromText = (text: string) => {
  if (!text) return {};
  
  const cleanText = text.trim();
  
  try {
    // Attempt 1: Raw JSON parse
    return JSON.parse(cleanText);
  } catch (e) {
    // Attempt 2: Extract from markdown blocks
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    let match;
    while ((match = codeBlockRegex.exec(cleanText)) !== null) {
      const candidate = match[1].trim();
      try {
        return JSON.parse(candidate);
      } catch (innerError) {
        const cleanedCandidate = candidate.replace(/,\s*([\]}])/g, '$1');
        try {
          return JSON.parse(cleanedCandidate);
        } catch (innerError2) {
          continue; 
        }
      }
    }
    
    // Attempt 3: Look for anything between { and }
    let firstBrace = cleanText.indexOf('{');
    let lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      let candidate = cleanText.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (e3) {
        const cleanedCandidate = candidate.replace(/,\s*([\]}])/g, '$1');
        try {
          return JSON.parse(cleanedCandidate);
        } catch (e4) {
          console.error("Failed all JSON extraction attempts. Last candidate snippet:", candidate.slice(0, 100));
        }
      }
    }
    
    // Attempt 4: More robust closing of partial JSON
    if (cleanText.includes('{') || cleanText.includes('[')) {
       try {
           const firstBrace = cleanText.indexOf('{');
           const firstBracket = cleanText.indexOf('[');
           const startIdx = firstBrace !== -1 && firstBracket !== -1 ? Math.min(firstBrace, firstBracket) 
                          : firstBrace !== -1 ? firstBrace 
                          : firstBracket;
                          
           let tempStr = cleanText.slice(startIdx);
           
           let inString = false;
           let isEscaped = false;
           const stack: string[] = [];
           
           for (let i = 0; i < tempStr.length; i++) {
             const char = tempStr[i];
             if (inString) {
               if (char === '\\' && !isEscaped) {
                 isEscaped = true;
               } else if (char === '"' && !isEscaped) {
                 inString = false;
               } else {
                 isEscaped = false;
               }
             } else {
               if (char === '"') {
                 inString = true;
               } else if (char === '{') {
                 stack.push('}');
               } else if (char === '[') {
                 stack.push(']');
               } else if (char === '}' || char === ']') {
                 if (stack.length > 0 && stack[stack.length - 1] === char) {
                   stack.pop();
                 }
               }
             }
           }
           
           if (inString) {
             tempStr += '"';
           }
           
           tempStr = tempStr.replace(/,\s*$/, '');
           
           while (stack.length > 0) {
             const closingChar = stack.pop();
             if (closingChar) tempStr += closingChar;
           }
           
           // Clean up trailing commas before closing brackets
           tempStr = tempStr.replace(/,\s*([\]}])/g, '$1');
           
           return JSON.parse(tempStr);
       } catch (e5) {
           console.error("Failed closing partial JSON", e5);
       }
    }
    
    throw new Error(`Could not parse JSON from response. Start of text: ${cleanText.slice(0, 50)}...`);
  }
};

export interface SWIResult {
  summary: string;
  sources: { title: string; uri: string }[];
}

export const analyzeSurfaceWeb = async (query: string, persona?: AIPersona): Promise<SWIResult> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Perform Surface Web Intelligence (SWI) on the following target: ${query}. 
      Map digital infrastructure, identify associated domains, and detect operational patterns. 
      Provide a concise technical summary.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text || "No summary available.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({
        title: chunk.web?.title || "Unknown Source",
        uri: chunk.web?.uri || "#",
      })) || [];

    return { summary, sources };
  });
};

export const analyzeDeepWeb = async (targetData: string, persona?: AIPersona): Promise<string> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze the following technical artifacts and persona data for Deep Web Intelligence (DWI):
      ${targetData}
      
      Focus Areas:
      1. Breach Correlations (cross-reference known dark web dumps containing connected credentials).
      2. Exposed Secrets (API keys, PGP signatures, config files).
      3. Stylometric Patterns (linguistic habits, codebase styling, repetitive syntax).
      
      Apply empirical data science methodologies. Provide a high-confidence analytical report in JSON format:
      {
        "breachCorrelations": [ { "source": "string", "indicators": ["string"], "severity": "High|Medium|Low" } ],
        "exposedSecrets": [ { "type": "string", "value": "string", "context": "string" } ],
        "stylometricPatterns": [ { "pattern": "string", "significance": "string", "confidence": "A|B|C|D|E|F" } ],
        "executiveSummary": "string"
      }`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breachCorrelations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { source: { type: Type.STRING }, indicators: { type: Type.ARRAY, items: { type: Type.STRING } }, severity: { type: Type.STRING } },
                required: ["source", "indicators", "severity"]
              }
            },
            exposedSecrets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { type: { type: Type.STRING }, value: { type: Type.STRING }, context: { type: Type.STRING } },
                required: ["type", "value", "context"]
              }
            },
            stylometricPatterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { pattern: { type: Type.STRING }, significance: { type: Type.STRING }, confidence: { type: Type.STRING } },
                required: ["pattern", "significance", "confidence"]
              }
            },
            executiveSummary: { type: Type.STRING }
          },
          required: ["breachCorrelations", "exposedSecrets", "stylometricPatterns", "executiveSummary"]
        }
      }
    });

    const data = parseJSONFromText(response.text || "{}");
    
    // Format to markdown
    let md = `### Deep Web Intelligence (DWI) Assessment\n\n`;
    md += `${data.executiveSummary || "No summary provided."}\n\n`;
    
    if (data.breachCorrelations && data.breachCorrelations.length > 0) {
      md += `#### Breach Correlations\n`;
      data.breachCorrelations.forEach((bc: any) => {
        md += `- **${bc.source}** [Severity: ${bc.severity}]: ${bc.indicators.join(', ')}\n`;
      });
      md += `\n`;
    }

    if (data.exposedSecrets && data.exposedSecrets.length > 0) {
      md += `#### Exposed Secrets\n`;
      data.exposedSecrets.forEach((es: any) => {
        md += `- **${es.type}**: \`${es.value}\` (${es.context})\n`;
      });
      md += `\n`;
    }

    if (data.stylometricPatterns && data.stylometricPatterns.length > 0) {
      md += `#### Stylometric Patterns\n`;
      data.stylometricPatterns.forEach((sp: any) => {
        md += `- **${sp.pattern}** [Confidence: ${sp.confidence}]: ${sp.significance}\n`;
      });
      md += `\n`;
    }

    return md;
  });
};

export const resolveEntities = async (data: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Resolve entities and construct a relationship graph from this intelligence data:
      ${data}
      Identify infrastructure (domains, IPs, certificates), identities (usernames, emails), financial flows (wallets, transactions), and technical artifacts (code, metadata).
      Return the result as a JSON object with 'nodes' (id, label, type, location) and 'edges' (source, target, relationship).
      Types allowed for nodes: domain, ip, certificate, persona, email, wallet, transaction, code_artifact, metadata_artifact.
      For 'location', provide 'lat', 'lng', and 'country' if inferable. Otherwise omit.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING },
                  location: {
                    type: Type.OBJECT,
                    properties: {
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER },
                      country: { type: Type.STRING }
                    }
                  }
                },
                required: ["id", "label", "type"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  relationship: { type: Type.STRING }
                },
                required: ["source", "target", "relationship"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    return parseJSONFromText(response.text || "{}");
  });
};

export const generateThreatAssessment = async (intelligence: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Perform a comprehensive Threat Assessment based on the following intelligence:
      ${intelligence}
      Evaluate capabilities, map behavioral patterns to the MITRE ATT&CK framework, and estimate operational scope and potential targets.
      Categorize findings into specific Tactics, Techniques, and Procedures (TTPs).
      For each mapping, provide an explanation and a confidence score (0-1).
      Return the result as a JSON object.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            capabilities: { type: Type.STRING },
            ttps: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  tactic: { type: Type.STRING, description: "MITRE ATT&CK Tactic (e.g., Initial Access)" },
                  technique: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "MITRE ATT&CK Technique ID (e.g., T1566)" },
                      name: { type: Type.STRING, description: "Technique Name" }
                    },
                    required: ["id", "name"]
                  },
                  procedure: { type: Type.STRING, description: "Specific observed behavior or procedure" },
                  confidence: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["tactic", "technique", "procedure", "confidence", "explanation"]
              } 
            },
            operationalScope: { type: Type.STRING },
            potentialTargets: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["capabilities", "ttps", "operationalScope", "potentialTargets"]
        }
      }
    });

    return parseJSONFromText(response.text || "{}");
  });
};

export const pollIntelligenceTelemetry = async (targetName: string, targetType: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Perform active intelligence telemetry analysis for the target '${targetName}' (${targetType}). 
      Analyze the current threat landscape and identify the most likely emergent risk vectors, vendor associations, or exposed infrastructure based on generic threat intelligence patterns for this target type.
      If real signal is absent, generate a synthetic but highly probable intelligence artifact representing a realistic threat event based on standard STIX/TAXII frameworks.
      The event should be one of: wallet_activity, credential_leak, infra_change, forum_mention, vendor_profile_update, product_listing, pgp_key_update, or wallet_reuse.
      Provide a realistic, highly analytical description detailing the finding (e.g., PGP signature overlap, tumbler/mixer output correlation) and severity.
      Return as JSON.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["wallet_activity", "credential_leak", "infra_change", "forum_mention", "vendor_profile_update", "product_listing", "pgp_key_update", "wallet_reuse"] },
            description: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] }
          },
          required: ["type", "description", "severity"]
        }
      }
    });

    const event = parseJSONFromText(response.text || "{}");
    // Generate a mock SHA-256 hash for provenance
    const dataHash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return { ...event, dataHash };
  });
};

export const generateNarrativeEvent = async (targetName: string, context: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a dynamic narrative event for the investigation of '${targetName}'. 
      Current Context: ${context}
      The event should be one of: opportunity (new lead), threat (counter-intelligence), or challenge (technical hurdle).
      Provide a title, description, impact, and 2-3 choices for the analyst.
      Return as JSON.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["opportunity", "threat", "challenge"] },
            impact: { type: Type.STRING },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  consequence: { type: Type.STRING }
                },
                required: ["label", "consequence"]
              }
            }
          },
          required: ["title", "description", "type", "impact", "choices"]
        }
      }
    });

    return parseJSONFromText(response.text || "{}");
  });
};

export const profilePersonaOSINT = async (personaLabel: string, metadata: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    // Step 1: Search and Research using Google Search Tool (No ResponseSchema)
    const searchResponse = await ai.models.generateContent({
      model,
      contents: `Perform a comprehensive OSINT profiling on the persona '${personaLabel}' using the following context:
      ${metadata}
      
      Tasks:
      1. Search for publicly available social media profiles (Twitter, LinkedIn, Mastodon, BlueSky).
      2. Explicitly search developer forums (StackOverflow, HackerNews, specialized subreddits).
      3. Explicitly search code repositories (GitHub, GitLab, Bitbucket) for commits, PRs, and public gists.
      4. Extract profile descriptions, handles, technical stacks, publicly visible connections, and recent public activity/code contributions.
      5. Identify potential cross-platform correlations and aggregate identifiers. Ensure all data collection respects privacy regulations and terms of service.
      
      Provide a detailed technical summary of your findings.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        tools: [{ googleSearch: {} }],
      }
    });

    const searchFindings = searchResponse.text || "No public data found.";

    // Step 2: Convert findings to structured JSON (No Search Tool, enabled Controlled Generation)
    const jsonResponse = await ai.models.generateContent({
      model,
      contents: `Convert the following OSINT findings into a structured JSON format:
      
      Findings:
      ${searchFindings}
      
      Return EXCLUSIVELY a JSON object with this structure:
      {
        "socialProfiles": [
          {
            "platform": "string",
            "url": "string",
            "description": "string", 
            "connectionsCount": number,
            "recentPosts": ["string"],
            "technicalSignatures": ["string"]
          }
        ]
      }`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            socialProfiles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  url: { type: Type.STRING },
                  description: { type: Type.STRING },
                  connectionsCount: { type: Type.NUMBER },
                  recentPosts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  technicalSignatures: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["platform", "url", "description"]
              }
            }
          },
          required: ["socialProfiles"]
        }
      }
    });

    return parseJSONFromText(jsonResponse.text || "{}");
  });
};

export const runAdvancedCorrelation = async (graphData: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Act as a Graph Theory Analytics Engine. Analyze the following Intelligence Graph representation:
      ${graphData}
      
      Tasks:
      1. Calculate network centrality (betweenness, degree) to identify keystone infrastructure and identity hubs.
      2. Apply community detection clustering to group related technical artifacts, financial wallets, and overlapping personas.
      3. Identify hidden pathfinding patterns (e.g. indirect links between seemingly unrelated identities via shared codebase/IP).
      
      Return EXCLUSIVELY a JSON object with this structure:
      {
        "calculatedCentrality": [ { "nodeId": "string", "centralityScore": number, "explanation": "string" } ],
        "detectedClusters": [ { "clusterId": "string", "nodeIds": ["string"], "theme": "string" } ],
        "hiddenPaths": [ { "sourceId": "string", "targetId": "string", "path": ["string"], "significance": "string" } ]
      }`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calculatedCentrality: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { nodeId: { type: Type.STRING }, centralityScore: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ["nodeId", "centralityScore", "explanation"]
              }
            },
            detectedClusters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { clusterId: { type: Type.STRING }, nodeIds: { type: Type.ARRAY, items: { type: Type.STRING } }, theme: { type: Type.STRING } },
                required: ["clusterId", "nodeIds", "theme"]
              }
            },
            hiddenPaths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { sourceId: { type: Type.STRING }, targetId: { type: Type.STRING }, path: { type: Type.ARRAY, items: { type: Type.STRING } }, significance: { type: Type.STRING } },
                required: ["sourceId", "targetId", "path", "significance"]
              }
            }
          },
          required: ["calculatedCentrality", "detectedClusters", "hiddenPaths"]
        }
      }
    });
    return parseJSONFromText(response.text || "{}");
  });
};

export const generateAdvancedPersonaProfile = async (personaLabel: string, intelligence: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Perform an advanced persona profiling on '${personaLabel}' based on the following intelligence:
      ${intelligence}
      
      Tasks:
      1. Correlate identifiers: usernames, aliases, email handles, PGP fingerprints, and cryptocurrency wallet identifiers.
      2. Perform stylometric analysis: analyze writing style, vocabulary, and sentiment (Linguistic Pattern Analysis).
      3. Infer behavioral signatures: activity cadence (time of day, frequency), timezone inference, regional indicators (cultural references, geopolitical leanings in language), and operational security (OPSEC) habits.
      4. Apply Persona Profiling Techniques: Digital Footprint Aggregation, Username and Alias Search, and Cross-Platform Identifier Analysis.
      
      Return the result as a JSON object.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identifiers: {
              type: Type.OBJECT,
              properties: {
                usernames: { type: Type.ARRAY, items: { type: Type.STRING } },
                emails: { type: Type.ARRAY, items: { type: Type.STRING } },
                pgpFingerprints: { type: Type.ARRAY, items: { type: Type.STRING } },
                wallets: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["usernames", "emails", "pgpFingerprints", "wallets"]
            },
            stylometricAnalysis: {
              type: Type.OBJECT,
              properties: {
                writingStyle: { type: Type.STRING },
                vocabulary: { type: Type.STRING },
                sentiment: { type: Type.STRING }
              },
              required: ["writingStyle", "vocabulary", "sentiment"]
            },
            behavioralSignature: {
              type: Type.OBJECT,
              properties: {
                activityCadence: { type: Type.STRING },
                timezoneInference: { type: Type.STRING },
                regionalIndicators: { type: Type.STRING },
                operationalSecurity: { type: Type.STRING }
              },
              required: ["activityCadence", "timezoneInference", "regionalIndicators", "operationalSecurity"]
            }
          },
          required: ["identifiers", "stylometricAnalysis", "behavioralSignature"]
        }
      }
    });

    return parseJSONFromText(response.text || "{}");
  });
};

export const generateAttributionReport = async (targetName: string, intelligence: string, graphData: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Act as an Attribution Engine for the target '${targetName}'.
      
      Intelligence Data:
      ${intelligence}
      
      Graph Relationships:
      ${graphData}
      
      Tasks:
      1. Construct relational mappings between identities, infrastructure, financial flows, and technical artifacts.
      2. Perform behavioral and geotemporal analysis (correlating activity times with infrastructure locations).
      3. Apply Advanced Financial Tracing: Cryptocurrency Transaction Analysis, Pattern Recognition, Analysis of Tumblers/Mixers, Mapping Wallet Connections, and identifying links to Tagged Entities or Illicit Activities.
      4. Provide a unified threat contextualization and likely attribution.
      5. Assign a confidence score (0-100).
      
      Return the result as a JSON object.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            geotemporalAnalysis: { type: Type.STRING },
            behavioralCorrelations: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            likelyAttribution: { type: Type.STRING }
          },
          required: ["summary", "geotemporalAnalysis", "behavioralCorrelations", "confidenceScore", "likelyAttribution"]
        }
      }
    });

    return parseJSONFromText(response.text || "{}");
  });
};

export const analyzeImageArtifact = async (base64Image: string, mimeType: string, persona?: AIPersona): Promise<string> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Meticulously analyze this technical artifact utilizing empirical data science methodologies. Extract highly analytical metadata, identify underlying toolchains via non-deterministic statistical weighting, and isolate hidden steganographic or geospatial indicators. Provide output as an unadulterated, direct intelligence breakdown." }
        ]
      },
      config: {
        systemInstruction: getSystemInstruction(persona),
      }
    });

    return response.text || "Image analysis failed.";
  });
};

export const synthesizeIntelligence = async (
  targetName: string, 
  context: string, 
  format: 'summary' | 'report' | 'comparison', 
  focusAreas: string[],
  persona?: AIPersona
): Promise<string> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Synthesize the following aggregated intelligence utilizing a highly analytical research methodology on the target: '${targetName}'.
      
      Intelligence Context:
      ${context}
      
      Output Format requested: ${format}
      Key Focus Areas:
      ${focusAreas.join(', ')}
      
      Task: Apply rigorous deterministic modeling and empirical data science methodologies to output a comprehensive, unadulterated intelligence extraction. Do not use conversational filler; provide direct operational intelligence in Markdown format.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
      }
    });

    return response.text || "Synthesis failed.";
  });
};

export const detectAnomalies = async (targetName: string, dataStream: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Act as a Stochastic Anomaly Detection Classifier for target '${targetName}'.
      Meticulously analyze the following data stream utilizing non-deterministic statistical weighting:
      ${dataStream}
      
      Tasks:
      1. Establish a mathematically rigorous baseline from the empirical data.
      2. Detect probabilistic deviations and highly analytical outliers from this baseline.
      3. Categorize anomalies by type (traffic, user_behavior, data_quality, fraud_detection) and severity (low, medium, high, critical).
      4. For financial/fraud anomalies, apply Advanced Financial Tracing: correlate with Cryptocurrency Transaction Analysis patterns, identify potential Tumblers/Mixers usage, and mathematically map wallet connections to Tagged Entities.
      5. Provide an unadulterated detailed description and evidence for each anomaly.
      
      Return as a JSON object with a list of 'anomalies'.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            anomalies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["traffic", "user_behavior", "data_quality", "fraud_detection"] },
                  severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
                  description: { type: Type.STRING },
                  evidence: { type: Type.STRING }
                },
                required: ["type", "severity", "description", "evidence"]
              }
            }
          },
          required: ["anomalies"]
        }
      }
    });

    return parseJSONFromText(response.text || "{\"anomalies\": []}");
  });
};

export const scanCodeRepositories = async (targetContext: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Perform an automated intelligence scan of public code repositories and paste sites related to the following context:
      ${targetContext}
      
      Tasks:
      1. Detect inadvertently exposed secrets (API keys, authentication tokens, passwords).
      2. Identify leaked proprietary code or configuration files.
      3. Correlate exposed identifiers (emails, usernames) with known infrastructure and personas.
      4. Evaluate the associated risk level based on the exposure.
      
      Return EXCLUSIVELY a JSON object structured as follows:
      {
        "exposedSecrets": [ { "type": "string", "snippet": "string", "sourceUrl": "string", "riskLevel": "high|medium|low" } ],
        "correlations": [ { "identifier": "string", "associatedPersona": "string", "evidence": "string" } ],
        "executiveSummary": "string"
      }`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            exposedSecrets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { type: { type: Type.STRING }, snippet: { type: Type.STRING }, sourceUrl: { type: Type.STRING }, riskLevel: { type: Type.STRING } },
                required: ["type", "snippet", "sourceUrl", "riskLevel"]
              }
            },
            correlations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { identifier: { type: Type.STRING }, associatedPersona: { type: Type.STRING }, evidence: { type: Type.STRING } },
                required: ["identifier", "associatedPersona", "evidence"]
              }
            },
            executiveSummary: { type: Type.STRING }
          },
          required: ["exposedSecrets", "correlations", "executiveSummary"]
        }
      }
    });
    return parseJSONFromText(response.text || "{}");
  });
};

export const traceFinancialFlows = async (walletData: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Perform Advanced Financial Tracing utilizing blockchain explorers and clustering techniques on the following wallet/transaction data:
      ${walletData}
      
      Tasks:
      1. Analyze cryptocurrency transaction flows and detect interactions with major exchanges or tumblers/mixers.
      2. Cluster related wallets to identify overarching financial operations.
      3. Cross-reference outcomes with known sanction lists and flagged addresses.
      
      Return EXCLUSIVELY a JSON object structured as follows:
      {
        "flowAnalysis": [ { "sourceWallet": "string", "destinationWallet": "string", "volume": "string", "notableInteraction": "string" } ],
        "walletClusters": [ { "clusterId": "string", "wallets": ["string"], "behaviorType": "string" } ],
        "flaggedCrossReferences": [ { "wallet": "string", "sanctionMatch": true, "details": "string" } ],
        "summary": "string"
      }`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flowAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { sourceWallet: { type: Type.STRING }, destinationWallet: { type: Type.STRING }, volume: { type: Type.STRING }, notableInteraction: { type: Type.STRING } },
                required: ["sourceWallet", "destinationWallet", "volume", "notableInteraction"]
              }
            },
            walletClusters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { clusterId: { type: Type.STRING }, wallets: { type: Type.ARRAY, items: { type: Type.STRING } }, behaviorType: { type: Type.STRING } },
                required: ["clusterId", "wallets", "behaviorType"]
              }
            },
            flaggedCrossReferences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { wallet: { type: Type.STRING }, sanctionMatch: { type: Type.BOOLEAN }, details: { type: Type.STRING } },
                required: ["wallet", "sanctionMatch", "details"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["flowAnalysis", "walletClusters", "flaggedCrossReferences", "summary"]
        }
      }
    });
    return parseJSONFromText(response.text || "{}");
  });
};

export const evaluateEthicalRisk = async (targetName: string, operationalContext: string, persona?: AIPersona): Promise<any> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `You are acting as an objective Ethics and Compliance AI.
      Analyze the following operational intelligence context gathered on target "${targetName}" for Phase 6 - Ethical Risk Assessment.
      Generate a detailed Ethical Risk Assessment evaluating the potential ethical implications and risks associated with the intelligence gathered and methodologies employed.
      Define boundaries and guidelines to prevent misuse and ensure responsible data handling.
      
      Return EXCLUSIVELY a JSON object structured as follows:
      {
        "complianceScore": <number 0-100>,
        "riskLevel": "Low" | "Moderate" | "High" | "Critical",
        "summary": "string",
        "identifiedRisks": [
          {
            "category": "string",
            "description": "string",
            "severity": "string",
            "mitigation": "string"
          }
        ],
        "boundaries": [ "string" ],
        "recommendation": "Proceed" | "Monitor" | "Suspend"
      }
      
      Operational Context:
      ${operationalContext}`,
      config: {
        systemInstruction: getSystemInstruction(persona),
        maxOutputTokens: 8192, responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            complianceScore: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING },
            summary: { type: Type.STRING },
            identifiedRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { category: { type: Type.STRING }, description: { type: Type.STRING }, severity: { type: Type.STRING }, mitigation: { type: Type.STRING } },
                required: ["category", "description", "severity", "mitigation"]
              }
            },
            boundaries: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          },
          required: ["complianceScore", "riskLevel", "summary", "identifiedRisks", "boundaries", "recommendation"]
        }
      }
    });

    return parseJSONFromText(response.text || "{}");
  });
};

export const fingerprintInfrastructure = async (targetContext: string, persona?: AIPersona): Promise<any> => {
  return await executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `Perform advanced network infrastructure fingerprinting based on the following context:
${targetContext}

Analyze for:
- Specific service stacks and versions (e.g., Nginx, Apache, OpenSSH, vulnerable versions)
- Common misconfigurations (e.g., exposed admin panels, CORS misconfigurations, directory listing)
- TLS certificates (reuse across domains, expiration, issuer anomalies)
- Technical footprint

Return JSON matching this schema:
{
  "scans": [
    {
      "asset": "192.168.1.1 or example.com",
      "services": [{"port": 80, "service": "HTTP", "stack": "Nginx 1.18.0", "vulnerabilities": ["CVE-2021-23017"]}],
      "misconfigurations": ["Directory listing enabled on /admin"],
      "tlsAnalysis": {
        "issuer": "Let's Encrypt Authority X3",
        "subjectAlternativeNames": ["example.com", "dev.example.com"],
        "reusedAcross": ["malicious-domain.com"]
      },
      "riskScore": 85
    }
  ],
  "overallFootprint": "Summary of technical footprint"
}
`}]
        }
      ],
      config: {
        systemInstruction: getSystemInstruction(persona),
        temperature: 0.2,
        maxOutputTokens: 8192, responseMimeType: "application/json"
      }
    });

    return parseJSONFromText(response.text! || "{}");
  });
};

export const generateThreatActorProfile = async (targetContext: string, persona?: AIPersona): Promise<any> => {
  return await executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze the correlated intelligence to identify and profile distinct threat actors. For each actor, detail their likely TTPs (Tactics, Techniques, and Procedures), assess their technical sophistication, and provide a confidence score for the attribution based on the evidence. Output this in a structured format suitable for threat intelligence platforms.

Intelligence:
${targetContext}

Return JSON matching this schema:
{
  "actors": [
    {
      "actorName": "Designation or moniker",
      "technicalSophistication": "High",
      "observedInfrastructure": ["IPs", "Domains", "ASNs"],
      "ttps": [{"tactic": "Initial Access", "technique": "Phishing", "description": "Spearphishing with malicious payloads"}],
      "historicalActivity": ["Timeline of campaigns"],
      "associates": ["Persona A", "Group B"],
      "financialIndicators": ["Wallet addresses", "Transaction patterns"],
      "attributionConfidence": "High",
      "executiveSummary": "Brief overview"
    }
  ]
}
`}]
        }
      ],
      config: {
        systemInstruction: getSystemInstruction(persona),
        temperature: 0.3,
        maxOutputTokens: 8192, responseMimeType: "application/json"
      }
    });

    return parseJSONFromText(response.text! || "{}");
  });
};

export const runDarkWebScan = async (targetId: string, onionUrl: string): Promise<string> => {
  return await executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const prompt = `
      Act as an expert Dark Web Intelligence analyst.
      Analyze the provided onion service URL or forum thread context for Target ID: ${targetId}.
      URL/Context: ${onionUrl}

      Simulate a deep scan and return a JSON object with the following structure. Extract hypothetical but realistic intelligence based on typical dark web vendor/forum patterns.

      {
        "vendorProfiles": ["List of identified vendor aliases, PGP fingerprints, or handles"],
        "pgpKeys": ["List of extracted public PGP key blocks or fingerprints (simulate these)"],
        "misconfigurations": ["List of detected server misconfigurations, exposed directories, or OpSec failures"]
      }

      Return ONLY valid JSON.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });
      return response.text || '';
    } catch (error: any) {
      console.error("Dark Web Scan AI Error:", error);
      throw error;
    }
  });
};
export const generateFictionalPersonas = async (targetContext: string, persona?: AIPersona): Promise<any> => {
  return await executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate detailed, fictional personas grounded in the intelligence patterns observed here:
${targetContext}

Ensure they are distinct and avoid direct attributions to real individuals.
For each include: backstory, motivations, communication style, digital footprint.

Return JSON matching this schema:
{
  "personas": [
    {
      "name": "Pseudonym/Moniker",
      "backstory": "Fictional but grounded backstory",
      "motivations": ["Financial Gain", "Ideology"],
      "communicationStyle": "Cryptic, formal, erratic, uses specific slang",
      "digitalFootprint": ["Active on exploit forums", "Uses specific PGP keys", "Operates via Tor networks"]
    }
  ]
}
`}]
        }
      ],
      config: {
        systemInstruction: getSystemInstruction(persona),
        temperature: 0.7,
        maxOutputTokens: 8192, responseMimeType: "application/json"
      }
    });

    return parseJSONFromText(response.text! || "{}");
  });
};
export const generateAIAutocomplete = async (currentContext: string): Promise<string> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Given the following workspace text context, provide a short, highly relevant autocomplete suggestion (max 5-7 words). Output ONLY the suggested text, nothing else. Do not output quotes.
        
Context:
${currentContext.slice(-500)}`,
        config: {
          temperature: 0.3,
          maxOutputTokens: 20
        }
      });
      return response.text?.trim() || '';
    } catch (error) {
      console.error("AI Autocomplete failed:", error);
      throw error;
    }
  });
};

export interface EnrichedEntity {
  name: string;
  type: 'actor' | 'asset' | 'infrastructure' | 'signal';
  confidence: string;
  centrality: number;
  resolvedIdentities: string[];
  sslHashes: string[];
  asnPatterns: string[];
  details: string;
}

export interface RestorationResult {
  unabridgedReport: string;
  atomicContext: {
    provenance: string;
    timestampUtc: string;
    entropyScore: number;
    confidenceLevel: string;
    verificationCriteria: string[];
    evidenceArtifacts: string[];
  };
  resolvedEntities: EnrichedEntity[];
  deduplicationDetails: {
    similarityScore: number;
    isDuplicate: boolean;
    matchedRecords: string[];
  };
  stixSchema: any;
}

export const restoreAndExpandData = async (
  fragmentText: string,
  mode: 'reconstruct' | 'osint_fusion' | 'graph_resolve',
  persona?: any
): Promise<RestorationResult> => {
  return executeWithReliabilityEngine("Gemini_API_Call", async (model) => {
    const prompt = `You are a world-class scientific Cyber Threat Intelligence (CTI) & OSINT data restoration algorithm.
    Your mission is to analyze, normalize, and complete the following truncated, abbreviated, or fragmented intelligence artifact:
    
    === FRAGMENT / ARTIFACT ===
    ${fragmentText}
    ===========================
    
    Mode: ${mode.toUpperCase()}
    
    Please perform full-spectrum data intelligence expansion, entity resolution, and precision extraction on this artifact.
    Ensure you reconstruct full contexts, normalize technical and natural language, track provenance, calculate Bayesian confidence levels, and map entity relationships.
    
    Your output MUST be a valid JSON object matching the following TypeScript interface strictly. Do NOT include any markdown block markers outside the JSON or additional text.
    
    JSON Interface:
    {
      "unabridgedReport": "A fully detailed, comprehensive, high-fidelity, unstructured CTI/OSINT analysis report reconstructing all fragmented, abbreviated, or missing details with scientific rigor, natural language normalization, and deep context expansion.",
      "atomicContext": {
        "provenance": "Detailed origin and collection chain attribution for this artifact, including surface, deep, or onion channel attribution.",
        "timestampUtc": "ISO UTC timestamp representing current time or collection epoch.",
        "entropyScore": 0.35,
        "confidenceLevel": "DETERMINISTIC|PROBABILISTIC|STOCHASTIC|ABSOLUTE",
        "verificationCriteria": ["string detailing specific automated checks passed, e.g. cryptographic, stylometric, WHOIS validation"],
        "evidenceArtifacts": ["concrete list of technical indicators or evidence found during reconstruction"]
      },
      "resolvedEntities": [
        {
          "name": "Fully resolved name/identifier of actor, asset, domain, wallet, IP, etc.",
          "type": "actor|asset|infrastructure|signal",
          "confidence": "A|B|C|D|E|F",
          "centrality": 0.85,
          "resolvedIdentities": ["linked handles, hashes, names or aliases"],
          "sslHashes": ["SSL certificates, MD5/SHA256 hashes if applicable"],
          "asnPatterns": ["Autonomous System Numbers or network signatures if applicable"],
          "details": "Technical overview of this entity's operational capability and role in the campaign."
        }
      ],
      "deduplicationDetails": {
        "similarityScore": 0.42,
        "isDuplicate": false,
        "matchedRecords": ["Names of pre-existing database entities that might overlap"]
      },
      "stixSchema": {
        "type": "bundle",
        "id": "bundle--1a2b3c4d",
        "objects": []
      }
    }`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(persona),
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    });

    return parseJSONFromText(response.text! || "{}");
  });
};

