/**
 * AI Methodology Knowledge Architecture
 *
 * Designed for:
 * - AI knowledge bases
 * - Research repositories
 * - Curriculum systems
 * - Model training datasets
 * - Method comparison engines
 * - Enterprise methodology catalogs
 */

export type MaturityLevel =
  | "Foundational"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Emerging";

export type AdoptionLevel =
  | "Experimental"
  | "Early Adoption"
  | "Widely Adopted"
  | "Industry Standard";

export type MethodologyType =
  | "Rule-Based"
  | "Statistical"
  | "Machine Learning"
  | "Deep Learning"
  | "Hybrid"
  | "Generative AI"
  | "Knowledge-Based"
  | "Optimization"
  | "Other";

export type ComplexityLevel =
  | "Low"
  | "Medium"
  | "High"
  | "Very High";

export type DataRequirement =
  | "None"
  | "Small Dataset"
  | "Moderate Dataset"
  | "Large Dataset"
  | "Massive Dataset";

export type EvaluationMetric =
  | "Accuracy"
  | "Precision"
  | "Recall"
  | "F1 Score"
  | "ROC-AUC"
  | "BLEU"
  | "ROUGE"
  | "Human Evaluation"
  | "Domain Specific";


// --------------------------------------------------
// Core Methodology Section
// --------------------------------------------------

export interface MethodologySection {
  readonly id?: string;

  readonly title: string;

  readonly description: string;

  readonly category: MethodologyType | string;


  // Core functionality

  readonly capabilities: readonly string[];

  readonly examples: readonly string[];

  readonly applications: readonly string[];


  // Constraints

  readonly limitations?: readonly string[];

  readonly risks?: readonly string[];

  readonly challenges?: readonly string[];


  // Ecosystem

  readonly frameworks?: readonly string[];

  readonly libraries?: readonly string[];

  readonly tools?: readonly string[];


  // Technical requirements

  readonly prerequisites?: readonly string[];

  readonly dependencies?: readonly string[];

  readonly dataRequirements?: DataRequirement;

  readonly computationalRequirements?: readonly string[];

  readonly complexity?: ComplexityLevel;


  // Performance

  readonly evaluationMetrics?: readonly EvaluationMetric[];

  readonly optimizationStrategies?: readonly string[];

  readonly scalabilityConsiderations?: readonly string[];


  // Knowledge relationships

  readonly relatedConcepts?: readonly string[];

  readonly predecessorMethods?: readonly string[];

  readonly successorMethods?: readonly string[];

  readonly alternativeMethods?: readonly string[];


  // Learning and implementation

  readonly learningObjectives?: readonly string[];

  readonly implementationSteps?: readonly string[];

  readonly bestPractices?: readonly string[];

  readonly commonFailureModes?: readonly string[];


  // Future readiness

  readonly emergingTrends?: readonly string[];

  readonly futureDirections?: readonly string[];
}


// --------------------------------------------------
// Methodology Domain
// --------------------------------------------------

export interface MethodologyDomain {

  readonly id: string;

  readonly topic: string;

  readonly domain: string;


  // Classification

  readonly maturity: MaturityLevel;

  readonly methodologyType?: MethodologyType;

  readonly adoption?: AdoptionLevel;


  // Description

  readonly summary?: string;

  readonly objectives?: readonly string[];


  // Knowledge structure

  readonly sections: readonly MethodologySection[];


  // Research metadata

  readonly origin?: {
    readonly period?: string;
    readonly contributors?: readonly string[];
    readonly foundationalPapers?: readonly string[];
  };


  // Industry information

  readonly industries?: readonly string[];

  readonly useCases?: readonly string[];


  // Governance

  readonly ethicalConsiderations?: readonly string[];

  readonly securityConsiderations?: readonly string[];

  readonly complianceConsiderations?: readonly string[];


  // Evolution tracking

  readonly version?: string;

  readonly lastUpdated?: string;

  readonly status?: 
    | "Active"
    | "Deprecated"
    | "Experimental"
    | "Superseded";
}


// --------------------------------------------------
// Methodology Knowledge Base
// --------------------------------------------------

export const METHODOLOGY = [
  {
    id: "sentiment-analysis",

    topic: "Sentiment Analysis Techniques",

    domain:
      "Artificial Intelligence / Natural Language Processing",


    summary:
      "Methods for automatically identifying, extracting, and interpreting emotional polarity and subjective opinions from textual data.",


    maturity: "Advanced",

    methodologyType: "Hybrid",

    adoption: "Widely Adopted",


    objectives: [
      "Classify sentiment polarity",
      "Understand user opinions",
      "Extract emotional signals from text",
      "Support decision-making through language analytics"
    ],


    sections: [

      {
        id: "lexicon-based-analysis",

        title: "Lexicon-Based Analysis",

        description:
          "Analyzes sentiment through predefined linguistic resources containing sentiment-associated words, polarity scores, and manually designed rules.",


        category:
          "Rule-Based",


        capabilities: [
          "Positive, negative, and neutral classification",
          "Keyword polarity scoring",
          "Transparent decision logic",
          "Rapid deployment without model training",
          "Low computational requirements"
        ],


        examples: [
          "AFINN",
          "SentiWordNet",
          "VADER"
        ],


        applications: [
          "Customer feedback analysis",
          "Social media monitoring",
          "Review classification",
          "Brand reputation tracking",
          "Market sentiment analysis"
        ],


        limitations: [
          "Limited contextual understanding",
          "Poor sarcasm detection",
          "Weak handling of implicit sentiment",
          "Requires domain-specific vocabulary adaptation"
        ],


        risks: [
          "Incorrect interpretation of ambiguous language",
          "Bias from incomplete lexicons"
        ],


        challenges: [
          "Domain adaptation",
          "Multilingual support",
          "Context awareness"
        ],


        frameworks: [
          "NLTK",
          "TextBlob"
        ],


        libraries: [
          "VADER Sentiment",
          "spaCy"
        ],


        tools: [
          "Text preprocessing pipelines",
          "NLP annotation systems"
        ],


        prerequisites: [
          "Tokenization",
          "Text normalization",
          "Basic linguistic analysis"
        ],


        dependencies: [
          "Sentiment dictionaries",
          "Language resources"
        ],


        dataRequirements:
          "None",


        computationalRequirements: [
          "Low CPU requirements",
          "Minimal memory usage"
        ],


        complexity:
          "Low",


        evaluationMetrics: [
          "Accuracy",
          "Precision",
          "Recall",
          "F1 Score"
        ],


        optimizationStrategies: [
          "Domain-specific lexicon expansion",
          "Context-aware weighting",
          "Hybrid ML integration"
        ],


        scalabilityConsiderations: [
          "Highly scalable for large text streams",
          "Limited improvement without richer linguistic models"
        ],


        relatedConcepts: [
          "Natural Language Processing",
          "Opinion Mining",
          "Text Classification",
          "Affective Computing"
        ],


        successorMethods: [
          "Machine Learning Sentiment Models",
          "Transformer-Based Sentiment Analysis"
        ],


        alternativeMethods: [
          "Supervised Classification",
          "Large Language Model Analysis"
        ],


        learningObjectives: [
          "Understand rule-based sentiment classification",
          "Evaluate lexicon strengths and limitations"
        ],


        implementationSteps: [
          "Acquire sentiment lexicon",
          "Preprocess text",
          "Calculate polarity scores",
          "Aggregate sentiment results",
          "Validate performance"
        ],


        bestPractices: [
          "Combine multiple linguistic resources",
          "Validate against domain-specific data",
          "Monitor classification errors"
        ],


        commonFailureModes: [
          "Ignoring context",
          "Overreliance on keywords",
          "Missing cultural language differences"
        ],


        emergingTrends: [
          "Hybrid symbolic-neural systems",
          "LLM-assisted sentiment reasoning"
        ],


        futureDirections: [
          "Emotion-aware AI systems",
          "Multimodal sentiment understanding",
          "Explainable sentiment intelligence"
        ]
      }
    ],


    industries: [
      "Customer Experience",
      "Marketing",
      "Finance",
      "Healthcare",
      "Social Analytics"
    ],


    ethicalConsiderations: [
      "Avoid misuse for invasive profiling",
      "Account for linguistic and cultural bias"
    ],


    securityConsiderations: [
      "Protect analyzed user data",
      "Prevent sensitive information leakage"
    ],


    version: "2.0.0",

    status: "Active"

  }

] as const satisfies readonly MethodologyDomain[];