import {
  ConfidenceLevel,
  EntityAtomicContext,
  AtomicMetadata,
} from '../types/atomic';


/**
 * Evidence reliability model
 */
export interface EvidenceFactor {
  name: string;
  weight: number;        // 0-1
  value: number;         // 0-1
}


/**
 * Intelligence evaluation request
 */
export interface EvaluationInput {
  veracity: number;
  corroborationCount: number;
  entropy: number;

  sourceReliability?: number;
  evidenceFactors?: EvidenceFactor[];

  createdAt?: string;
  halfLifeDays?: number;
}


/**
 * Explainable evaluation result
 */
export interface EvaluationResult {
  confidence: ConfidenceLevel;
  score: number;

  breakdown: {
    factor: string;
    contribution: number;
  }[];
}


/**
 * Atomic creation request
 */
export interface AtomicContextRequest<T> {
  label: string;
  classification: EntityAtomicContext['classification'];
  data: T;
  provenance: string;

  evaluation?: EvaluationInput;

  verificationCriteria?: string[];
}


export class StochasticEvaluator {

  private static readonly DEFAULTS = {

    veracityWeight: 0.35,

    corroborationWeight: 0.25,

    entropyWeight: 0.15,

    sourceWeight: 0.15,

    temporalWeight: 0.10,

  };


  /**
   * Clamp values safely.
   */
  private static normalize(
    value: number
  ): number {

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        1,
        value
      )
    );
  }


  /**
   * Advanced confidence evaluation.
   */
  static evaluateConfidence(
    input: EvaluationInput
  ): EvaluationResult {

    const breakdown:
      EvaluationResult["breakdown"] = [];


    const veracity =
      this.normalize(
        input.veracity
      );


    const corroboration =
      this.normalize(
        Math.min(
          input.corroborationCount / 5,
          1
        )
      );


    const entropy =
      this.normalize(
        input.entropy
      );


    const reliability =
      this.normalize(
        input.sourceReliability ?? 0.5
      );


    const temporal =
      this.calculateTemporalConfidence(
        input.createdAt,
        input.halfLifeDays
      );


    const add = (
      name: string,
      value: number,
      weight: number
    ) => {

      const contribution =
        value * weight;

      breakdown.push({
        factor: name,
        contribution,
      });

      return contribution;
    };


    let score = 0;


    score += add(
      "veracity",
      veracity,
      this.DEFAULTS.veracityWeight
    );


    score += add(
      "corroboration",
      corroboration,
      this.DEFAULTS.corroborationWeight
    );


    score += add(
      "entropy_penalty",
      1 - entropy,
      this.DEFAULTS.entropyWeight
    );


    score += add(
      "source_reliability",
      reliability,
      this.DEFAULTS.sourceWeight
    );


    score += add(
      "temporal_validity",
      temporal,
      this.DEFAULTS.temporalWeight
    );


    for (
      const factor of
      input.evidenceFactors ?? []
    ) {

      score += add(
        factor.name,
        this.normalize(
          factor.value
        ),
        this.normalize(
          factor.weight
        )
      );
    }


    score =
      this.normalize(
        Number(
          score.toFixed(4)
        )
      );


    return {
      confidence:
        this.scoreToLevel(score),

      score,

      breakdown,
    };
  }


  /**
   * Creates intelligence atomic context.
   */
  static createAtomicContext<T>(
    request: AtomicContextRequest<T>
  ): EntityAtomicContext {

    const evaluation =
      this.evaluateConfidence(
        request.evaluation ??
        {
          veracity: 0.5,
          corroborationCount: 0,
          entropy: 0.5,
        }
      );


    const metadata: AtomicMetadata = {

      provenance:
        request.provenance,

      timestamp_utc:
        new Date()
          .toISOString(),

      entropy_score:
        request.evaluation?.entropy ?? 0.5,

      verification_criteria:
        request.verificationCriteria ??
        [
          "source_integrity_check",
          "cross_validation",
          "artifact_consistency",
        ],

    };


    return {

      uid:
        crypto.randomUUID(),

      label:
        request.label,

      classification:
        request.classification,

      confidence:
        evaluation.confidence,

      metadata,

      evidence_artifacts:
        [],

    };
  }


  /**
   * Temporal confidence decay.
   */
  private static calculateTemporalConfidence(
    createdAt?: string,
    halfLifeDays = 30
  ): number {

    if (!createdAt) {
      return 1;
    }


    const age =
      Date.now() -
      Date.parse(createdAt);


    if (
      !Number.isFinite(age)
    ) {
      return 0;
    }


    const days =
      age /
      86_400_000;


    return Math.pow(
      0.5,
      days / halfLifeDays
    );
  }


  private static scoreToLevel(
    score: number
  ): ConfidenceLevel {

    if (score >= 0.9)
      return ConfidenceLevel.ABSOLUTE;

    if (score >= 0.7)
      return ConfidenceLevel.DETERMINISTIC;

    if (score >= 0.4)
      return ConfidenceLevel.PROBABILISTIC;

    return ConfidenceLevel.STOCHASTIC;
  }


  /**
   * Structural validation.
   */
  static validateInvariant<T extends object>(
    data: T,
    schema: readonly string[]
  ): boolean {

    if (
      !data ||
      typeof data !== "object"
    ) {
      return false;
    }


    return schema.every(
      key =>
        Object.prototype.hasOwnProperty.call(
          data,
          key
        )
    );
  }
}