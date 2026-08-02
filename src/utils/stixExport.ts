import {
  Target,
  IntelligenceReport,
  ThreatAssessment,
  MonitoringEvent,
  NarrativeEvent,
  PersonaOSINT,
  AdvancedPersonaProfile,
  AttributionReport,
  SynthesizedOutput,
  Anomaly,
} from '../services/dbService';


/**
 * STIX 2.1 Core Types
 */

export interface STIXObject {
  type: string;
  spec_version: "2.1";
  id: string;
  created: string;
  modified: string;
  [key: string]: unknown;
}


export interface STIXBundle {
  type: "bundle";
  id: string;
  spec_version: "2.1";
  objects: STIXObject[];
}


/**
 * Utility Layer
 */

const timestamp = (): string =>
  new Date().toISOString();


const createSTIXId = (
  type: string,
  id?: string
): string =>
  `${type}--${id ?? crypto.randomUUID()}`;


const createSTIXObject = <T extends object>(
  type: string,
  data: T,
  id?: string
): STIXObject => {

  const time = timestamp();

  return {
    type,
    spec_version: "2.1",
    id: createSTIXId(type, id),
    created: time,
    modified: time,
    ...data,
  };
};


const sanitizeSTIXValue = (
  value: string
): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");


/**
 * STIX Builders
 */

class STIXBuilder {

  private objects = new Map<string, STIXObject>();


  add(object: STIXObject): STIXObject {

    if (!this.objects.has(object.id)) {
      this.objects.set(
        object.id,
        object
      );
    }

    return object;
  }


  relationship(
    source: STIXObject,
    target: STIXObject,
    type: string
  ): STIXObject {

    return this.add(
      createSTIXObject(
        "relationship",
        {
          relationship_type: type,
          source_ref: source.id,
          target_ref: target.id,
        }
      )
    );
  }


  bundle(): STIXBundle {

    return {
      type: "bundle",
      id: createSTIXId("bundle"),
      spec_version: "2.1",
      objects:
        [...this.objects.values()],
    };
  }
}


/**
 * Object Generators
 */

const buildThreatActor = (
  target: Target
): STIXObject =>
  createSTIXObject(
    "threat-actor",
    {
      name:
        target.name,

      threat_actor_types:
        [
          target.type === "persona"
            ? "hacker"
            : "unknown",
        ],

      aliases:
        target.aliases ?? [],

      description:
        `Target Type: ${target.type}; Status: ${target.status}`,
    },
    target.id
  );


const buildReport = (
  report: IntelligenceReport,
  actor: STIXObject
): STIXObject =>
  createSTIXObject(
    "report",
    {
      name:
        `Intelligence Report Phase ${report.phase}`,

      description:
        report.content,

      published:
        timestamp(),

      object_refs:
        [actor.id],
    },
    report.id
  );


const buildIndicator = (
  assessment: ThreatAssessment,
  target: Target
): STIXObject =>
  createSTIXObject(
    "indicator",
    {
      name:
        "Threat Assessment",

      pattern_type:
        "stix",

      pattern:
        `[identity:name = '${sanitizeSTIXValue(target.name)}']`,

      valid_from:
        timestamp(),

      description:
        [
          `Capabilities: ${assessment.capabilities}`,
          `Scope: ${assessment.operationalScope}`,
        ].join(" | "),
    },
    assessment.id
  );


const buildAttackPattern = (
  tactic: string,
  procedure: string
): STIXObject =>
  createSTIXObject(
    "attack-pattern",
    {
      name:
        tactic,

      description:
        procedure,

      kill_chain_phases:
        [
          {
            kill_chain_name:
              "mitre-attack",

            phase_name:
              tactic,
          },
        ],
    }
  );


/**
 * Main Export Pipeline
 */

export const generateStixBundle = (
  target: Target,
  reports: IntelligenceReport[] = [],
  threatAssessments: ThreatAssessment[] = [],
  monitoringEvents: MonitoringEvent[] = [],
  narrativeEvents: NarrativeEvent[] = [],
  personaOSINT: PersonaOSINT[] = [],
  personaProfiles: AdvancedPersonaProfile[] = [],
  attributionReports: AttributionReport[] = [],
  synthesizedOutputs: SynthesizedOutput[] = [],
  anomalies: Anomaly[] = []
): STIXBundle => {

  const builder =
    new STIXBuilder();


  const actor =
    builder.add(
      buildThreatActor(target)
    );


  reports.forEach(report => {

    builder.add(
      buildReport(
        report,
        actor
      )
    );

  });


  threatAssessments.forEach(
    assessment => {

      builder.add(
        buildIndicator(
          assessment,
          target
        )
      );


      assessment.ttps.forEach(
        ttp => {

          const attackPattern =
            builder.add(
              buildAttackPattern(
                ttp.tactic,
                ttp.procedure
              )
            );


          builder.relationship(
            actor,
            attackPattern,
            "uses"
          );

        }
      );

    }
  );


  /*
    Extension pipeline:

    monitoringEvents
      -> observed-data

    personaOSINT
      -> identity

    personaProfiles
      -> identity + notes

    attributionReports
      -> relationships

    synthesizedOutputs
      -> reports

    anomalies
      -> indicators
  */


  return builder.bundle();
};


/**
 * Export Utilities
 */

export const downloadStixJson = (
  bundle: STIXBundle,
  filename =
    "stix-bundle.json"
): void => {

  const json =
    JSON.stringify(
      bundle,
      null,
      2
    );


  const blob =
    new Blob(
      [json],
      {
        type:
          "application/json",
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href =
    url;

  link.download =
    filename;


  link.click();


  URL.revokeObjectURL(url);
};