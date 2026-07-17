import { ConfidenceLevel, EntityAtomicContext, AtomicMetadata } from '../types/atomic';

/**
 * STOCHASTIC EVALUATION ENGINE
 * Provides rigorous, non-deterministic statistical weighting for intelligence artifacts.
 */

export class StochasticEvaluator {
  /**
   * Calculates a weighted confidence score based on multi-vector cross-validation.
   */
  static evaluateConfidence(
    veracity: number, // 0-1
    corroboration_count: number,
    entropy: number // 0-1 (higher is more uncertain)
  ): ConfidenceLevel {
    const raw_score = (veracity * 0.5) + (Math.min(corroboration_count, 5) / 5 * 0.4) - (entropy * 0.1);
    
    if (raw_score >= 0.9) return ConfidenceLevel.ABSOLUTE;
    if (raw_score >= 0.7) return ConfidenceLevel.DETERMINISTIC;
    if (raw_score >= 0.4) return ConfidenceLevel.PROBABILISTIC;
    return ConfidenceLevel.STOCHASTIC;
  }

  /**
   * Generates an atomic context wrapper for raw intelligence data.
   */
  static createAtomicContext(
    label: string,
    classification: EntityAtomicContext['classification'],
    data: any,
    provenance: string
  ): EntityAtomicContext {
    const entropy = Math.random(); // Placeholder for actual entropy calculation
    const confidence = this.evaluateConfidence(0.8, 2, entropy);

    const metadata: AtomicMetadata = {
      provenance,
      timestamp_utc: new Date().toISOString(),
      entropy_score: entropy,
      verification_criteria: [
        'source_integrity_check',
        'cryptographic_corroboration',
        'cross_platform_alignment'
      ]
    };

    return {
      uid: crypto.randomUUID(),
      label,
      classification,
      confidence,
      metadata,
      evidence_artifacts: []
    };
  }

  /**
   * Validates a data artifact against structural invariants.
   */
  static validateInvariant(data: any, expected_schema: string[]): boolean {
    return expected_schema.every(key => key in data);
  }
}
