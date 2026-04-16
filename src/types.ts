export type SkillCategory = 'Collaboration' | 'Creativity' | 'Critical Thinking';
export type AssessmentMode = 'assessment' | 'practice';
export type LocaleCode = 'en-IN' | 'en-US' | 'hi-IN';
export type ScoringProfileId = 'default' | 'strict' | 'formative';

export interface Task {
  id: string;
  title: string;
  theme: string;
  skill: SkillCategory;
  description: string;
  teammates: string[];
  systemPrompt: string;
  localized?: Partial<
    Record<
      LocaleCode,
      {
        title?: string;
        description?: string;
        systemPrompt?: string;
      }
    >
  >;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface DimensionScore {
  dimension: string;
  score: number | 'NA';
  levelName: string; // e.g., "Demonstrating", "Emerging"
  confidence: number;
  evidenceCount: number;
  scoreSpread?: number;
  feedback: string;
  excerpt: string;
  nextProbe: string;
}

export interface TurnEvidenceLabel {
  dimension: string;
  evidenceType: string;
  strength: number;
  confidence: number;
  rationale: string;
}

export interface TurnEvidence {
  turnId: string;
  turnIndex: number;
  overallTurnConfidence: number;
  insufficientEvidence: boolean;
  dimensionEvidence: TurnEvidenceLabel[];
}

export interface AssessmentResult {
  skill: SkillCategory;
  locale?: LocaleCode;
  assessmentMode: AssessmentMode;
  overallScore: number | 'NA';
  overallConfidence: number;
  dimensions: DimensionScore[];
  summary: string;
  reliabilityFlags: string[];
  validityNotes: string[];
  fairnessChecks: string[];
  developmentPlan: {
    immediateActions: string[];
    nextActions: string[];
    stretchActions: string[];
  };
  evidenceCoverage: { dimension: string; evidenceCount: number }[];
  minimumEvidenceMet: boolean;
  turnEvidence?: TurnEvidence[];
  scoringPasses?: Array<{
    summary: string;
    fairnessChecks: string[];
    validityNotes: string[];
    dimensionScores: Array<{
      dimension: string;
      score: number;
      na: boolean;
      confidence: number;
      feedback: string;
      excerpt: string;
      nextProbe: string;
      evidenceTurnIds: string[];
    }>;
  }>;
  metadata: {
    userTurnCount: number;
    uncoveredDimensions: string[];
    generatedAt: string;
    artifactId?: string;
    sessionId?: string;
    userId?: string;
    scorerVersion?: string;
    policyVersion?: string;
    scoringPasses?: number;
    scoringProfile?: string;
    modelVersions?: {
      executive: string;
      turnLabeler: string;
      scorer: string;
    };
    localeCalibration?: {
      locale: string;
      humanRatings: number;
      artifactCount: number;
      raterCount: number;
      calibrated: boolean;
    } | null;
    securitySignals?: {
      flagged: boolean;
      injection: Array<{ turnIndex: number; sender: string; snippets: string[]; text: string }>;
      gaming: Array<{ turnIndex: number; sender: string; snippets: string[]; text: string }>;
    };
  };
}

export interface HistorySession {
  id: string;
  artifactId: string;
  createdAt: string;
  locale: LocaleCode;
  sessionId: string;
  skill: SkillCategory;
  taskId: string;
  taskTitle: string;
  assessmentMode: AssessmentMode;
  overallScore: number | 'NA';
  overallConfidence: number;
  minimumEvidenceMet: boolean;
  dimensionScores: Record<string, number | 'NA'>;
  dimensionConfidences: Record<string, number>;
}

export interface UserHistoryResponse {
  sessions: HistorySession[];
}

export interface Recommendation {
  dimension: string;
  averageScore: number;
  recommendedScenarioId: string | null;
  recommendedScenarioTitle: string;
  locale: LocaleCode;
  reason: string;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
}

export interface LocaleCalibrationSummary {
  locale: LocaleCode;
  humanRatings: number;
  artifactCount: number;
  raterCount: number;
  calibrated: boolean;
}

export interface LocaleCalibrationResponse {
  locale: LocaleCode;
  summaries: LocaleCalibrationSummary[];
  selected: LocaleCalibrationSummary | null;
}
