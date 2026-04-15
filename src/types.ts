export type SkillCategory = 'Collaboration' | 'Creativity' | 'Critical Thinking';
export type AssessmentMode = 'assessment' | 'practice';

export interface Task {
  id: string;
  title: string;
  theme: string;
  skill: SkillCategory;
  description: string;
  teammates: string[];
  systemPrompt: string;
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
  feedback: string;
  excerpt: string;
  nextProbe: string;
}

export interface AssessmentResult {
  skill: SkillCategory;
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
  metadata: {
    userTurnCount: number;
    uncoveredDimensions: string[];
    generatedAt: string;
  };
}
