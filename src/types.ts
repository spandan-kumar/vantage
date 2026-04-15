export type SkillCategory = 'Collaboration' | 'Creativity' | 'Critical Thinking';

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
  feedback: string;
  excerpt: string;
}

export interface AssessmentResult {
  skill: SkillCategory;
  overallScore: number | 'NA';
  dimensions: DimensionScore[];
  summary: string;
}
