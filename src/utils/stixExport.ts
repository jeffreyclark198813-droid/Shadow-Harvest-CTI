import { Target, IntelligenceReport, ThreatAssessment, MonitoringEvent, NarrativeEvent, PersonaOSINT, AdvancedPersonaProfile, AttributionReport, SynthesizedOutput, Anomaly } from '../services/dbService';

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
) => {
  const objects: any[] = [];

  // Threat Actor
  const threatActorId = `threat-actor--${target.id || crypto.randomUUID()}`;
  objects.push({
    type: 'threat-actor',
    spec_version: '2.1',
    id: threatActorId,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    name: target.name,
    threat_actor_types: [target.type === 'persona' ? 'hacker' : 'unknown'],
    aliases: target.aliases || [],
    description: `Target type: ${target.type}, Status: ${target.status}`
  });

  // Intelligence Reports -> Report Objects
  reports.forEach(report => {
    objects.push({
      type: 'report',
      spec_version: '2.1',
      id: `report--${report.id || crypto.randomUUID()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      name: `Intelligence Report Phase ${report.phase}`,
      description: report.content,
      published: new Date().toISOString(),
      object_refs: [threatActorId]
    });
  });

  // Threat Assessments -> Indicator/Attack Pattern
  threatAssessments.forEach(assessment => {
    const assessmentId = `indicator--${assessment.id || crypto.randomUUID()}`;
    objects.push({
      type: 'indicator',
      spec_version: '2.1',
      id: assessmentId,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      name: `Threat Assessment`,
      description: `Capabilities: ${assessment.capabilities} | Scope: ${assessment.operationalScope}`,
      pattern_type: 'stix',
      pattern: "[identity:name = '" + target.name + "']",
      valid_from: new Date().toISOString()
    });

    assessment.ttps.forEach(ttp => {
      const apId = `attack-pattern--${crypto.randomUUID()}`;
      objects.push({
        type: 'attack-pattern',
        spec_version: '2.1',
        id: apId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: ttp.tactic,
        description: ttp.procedure,
        kill_chain_phases: [{
          kill_chain_name: 'mitre-attack',
          phase_name: ttp.tactic
        }]
      });
      // Relationship
      objects.push({
        type: 'relationship',
        spec_version: '2.1',
        id: `relationship--${crypto.randomUUID()}`,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        relationship_type: 'uses',
        source_ref: threatActorId,
        target_ref: apId
      });
    });
  });

  // Export Bundle
  return {
    type: 'bundle',
    id: `bundle--${crypto.randomUUID()}`,
    spec_version: '2.1',
    objects
  };
};

export const downloadStixJson = (bundle: any, filename: string) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
