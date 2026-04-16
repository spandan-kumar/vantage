import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./model-config.js";

export const DIMENSIONS_BY_SKILL = {
  Collaboration: ["Conflict Resolution", "Project Management"],
  Creativity: ["Generating Ideas", "Evaluating Ideas", "Building on Ideas"],
  "Critical Thinking": ["Interpret and Analyze", "Evaluate and Judge"],
};

export const DIMENSION_KEYWORDS = {
  Collaboration: {
    "Conflict Resolution": ["disagree", "conflict", "resolve", "compromise", "middle ground", "tradeoff", "tension"],
    "Project Management": ["plan", "timeline", "next step", "role", "assign", "goal", "priority", "track", "milestone"],
  },
  Creativity: {
    "Generating Ideas": ["idea", "what if", "option", "alternative", "brainstorm", "concept", "approach"],
    "Evaluating Ideas": ["pros", "cons", "feasible", "cost", "impact", "risk", "best option", "tradeoff"],
    "Building on Ideas": ["build on", "combine", "improve", "iterate", "expand", "adapt", "merge"],
  },
  "Critical Thinking": {
    "Interpret and Analyze": ["claim", "assumption", "evidence", "argument", "interpret", "context", "premise"],
    "Evaluate and Judge": ["bias", "fallacy", "credible", "valid", "causation", "correlation", "reasoning", "source quality"],
  },
};

const RUBRICS_EN = {
  Collaboration: `
# Collaboration Rubric
## Conflict Resolution
1. Overall: Fails to identify conflicts (1) -> Recognizes presence but struggles to address (2) -> Effectively responds to acknowledged conflicts (3) -> Proactively identifies and resolves conflicts, investigating root causes (4).
2. Conflict Identification: Fails to identify (1) -> Acknowledges only when prompted (2) -> Clearly identifies overt conflicts (3) -> Proactively surfaces potential gaps (4).
3. Scoping and Analysis: Mischaracterizes conflict (1) -> Oversimplifies in binary terms (2) -> Scopes the width of the conflict (3) -> Investigates conflict depth/type (4).
4. Strategy Application: Detrimental strategies (1) -> Limited/mismatched strategy (2) -> Standard resolution practices (3) -> Adaptive strategies tailored to conflict type (4).
5. Monitoring and Regulation: Hostile environment (1) -> Negative emotional response (2) -> Respectful tone (3) -> Psychological safety and de-escalation (4).

## Project Management
1. Overall Competence: Antagonistic/apathetic (1) -> Reactive participation (2) -> Active participation (3) -> Leads co-construction and adaptive planning (4).
2. Goal Setting: Ignores goals (1) -> Passively accepts goals (2) -> Contributes to defining goals (3) -> Facilitates clear shared goals (4).
3. Planning & Roles: Ignores planning/roles (1) -> Relies on others (2) -> Contributes practical ideas (3) -> Leads adaptive planning proactively (4).
4. Status Monitoring: Limits shared awareness (1) -> Limited contribution (2) -> Shares status openly (3) -> Builds shared awareness and prompts others (4).
`,
  Creativity: `
# Creativity Rubric
## Generating Ideas
1. Fluidity: Well below average distinct ideas (1) -> Below average (2) -> Average/above average (3) -> Well above average (4).
2. Originality: Predictable solutions (1) -> Slight variation on common solutions (2) -> Unconventional solutions (3) -> Surprising/novel solutions (4).
3. Quality: Irrelevant/infeasible (1) -> Partially addresses problem (2) -> Relevant and feasible (3) -> Meets criteria and adaptable (4).

## Evaluating Ideas
1. Elaborating: Minimal detail (1) -> Surface-level detail (2) -> Detailed specs (3) -> Substantive functionality rationale (4).
2. Selecting: Poor fit (1) -> Partial fit (2) -> Feasible and addresses core problem (3) -> Adaptable and balanced utility/novelty (4).

## Building on Ideas
1. Overall Competence: Dismisses others (1) -> Adjusts only own ideas (2) -> Incorporates others effectively (3) -> Seamlessly synthesizes ideas into stronger concept (4).
`,
  "Critical Thinking": `
# Critical Thinking Rubric
## Interpret and Analyze
1. Overall: Flat narrative reading (1) -> Rigid isolated interpretation (2) -> Clarifies ambiguity and maps structure (3) -> Considers intent/context and missing info (4).
2. Clarifying Intent: Misidentifies components (1) -> Distinguishes some content but miscategorizes (2) -> Accurate categorization (3) -> Intent plus contextual reading (4).
3. Outlining Arguments: Fails to detect arguments (1) -> Mislabels relationships (2) -> Accurate deconstruction/map (3) -> Identifies hidden assumptions/gaps (4).

## Evaluate and Judge
1. Overall: Agreement-based judgment (1) -> Surface-trait judgment (2) -> Criteria-based evaluation with fallacies (3) -> Source quality and exact flaw explanation (4).
2. Assessing Information: Chooses by prior belief (1) -> Surface characteristics (2) -> Systematic criteria-based evaluation (3) -> Claim-specific evidence evaluation (4).
3. Assessing Reasoning: Agreement with conclusion (1) -> Obvious flaw recognition only (2) -> Identifies invalid/unsound logic (3) -> Explains exactly why valid/sound or not (4).
`,
};

const RUBRICS_HI = {
  Collaboration: `
# सहयोग रूब्रिक (Collaboration)
## Conflict Resolution
1. Overall: संघर्ष पहचानने में असफल (1) -> संकेत मिलने पर पहचान (2) -> स्वीकारे गए संघर्ष का प्रभावी समाधान (3) -> सक्रिय रूप से संघर्ष पहचानकर मूल कारण तक समाधान (4).
2. Conflict Identification: संघर्ष नहीं पहचानता (1) -> संकेत पर पहचान (2) -> स्पष्ट संघर्ष पहचानता (3) -> संभावित अंतर/तनाव सक्रिय रूप से सामने लाता (4).
3. Scoping & Analysis: संघर्ष का गलत आकलन (1) -> अत्यधिक सरल/द्विआधारी आकलन (2) -> संघर्ष की चौड़ाई समझता (3) -> गहराई और प्रकार का विश्लेषण (4).
4. Strategy Application: हानिकारक रणनीति (1) -> सीमित/गलत रणनीति (2) -> मानक समाधान रणनीति (3) -> संघर्ष-प्रकार आधारित अनुकूली रणनीति (4).

## Project Management
1. Overall: निष्क्रिय/विरोधी (1) -> प्रतिक्रियाशील सहभागिता (2) -> सक्रिय सहभागिता (3) -> साझा लक्ष्य और योजना का नेतृत्व (4).
2. Goal Setting: लक्ष्य अनदेखा (1) -> केवल स्वीकार (2) -> लक्ष्य निर्धारण में योगदान (3) -> स्पष्ट साझा लक्ष्यों का संचालन (4).
3. Planning & Roles: योजना/भूमिका अनदेखी (1) -> दूसरों पर निर्भर (2) -> व्यावहारिक विचार देता (3) -> सक्रिय अनुकूली योजना का नेतृत्व (4).
`,
  Creativity: RUBRICS_EN.Creativity,
  "Critical Thinking": RUBRICS_EN["Critical Thinking"],
};

const RUBRICS_BY_LOCALE = {
  "en-IN": RUBRICS_EN,
  "en-US": RUBRICS_EN,
  "hi-IN": RUBRICS_HI,
};

export const TARGETED_PROBES = {
  Collaboration: {
    "Conflict Resolution": [
      "Introduce a mild disagreement and ask the learner to mediate a resolution path.",
      "Ask the learner to identify root causes and propose a de-escalation strategy.",
    ],
    "Project Management": [
      "Ask for a concrete plan with roles, milestones, and ownership.",
      "Create planning pressure: introduce a constraint and request reprioritization.",
    ],
  },
  Creativity: {
    "Generating Ideas": [
      "Request three additional alternatives under a strict constraint.",
      "Challenge for novelty by asking what would be surprising but feasible.",
    ],
    "Evaluating Ideas": [
      "Force tradeoff analysis across cost, impact, and risk.",
      "Ask the learner to reject one option and justify with criteria.",
    ],
    "Building on Ideas": [
      "Ask the learner to synthesize teammate ideas into one improved concept.",
      "Prompt iteration by asking what version 2 would improve and why.",
    ],
  },
  "Critical Thinking": {
    "Interpret and Analyze": [
      "Ask the learner to identify assumptions and missing information.",
      "Inject ambiguity and require clarification of claim boundaries.",
    ],
    "Evaluate and Judge": [
      "Ask the learner to evaluate source credibility and reasoning quality.",
      "Challenge causation claims by requiring alternative explanations.",
    ],
  },
};

export const DIMENSION_TO_SCENARIO = {
  "Conflict Resolution": "collab-debate",
  "Project Management": "collab-debate",
  "Generating Ideas": "creative-festival",
  "Evaluating Ideas": "creative-festival",
  "Building on Ideas": "creative-festival",
  "Interpret and Analyze": "critical-editorial",
  "Evaluate and Judge": "critical-editorial",
};

export function normalizeLocale(locale) {
  if (locale && SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }
  return DEFAULT_LOCALE;
}

export function getRubricForSkill(skill, locale) {
  const safeLocale = normalizeLocale(locale);
  const bundle = RUBRICS_BY_LOCALE[safeLocale] || RUBRICS_BY_LOCALE[DEFAULT_LOCALE];
  return bundle[skill] || RUBRICS_BY_LOCALE[DEFAULT_LOCALE][skill] || "";
}

export function getDimensions(skill) {
  return DIMENSIONS_BY_SKILL[skill] || [];
}

export function getSkillFromDimension(dimension) {
  return Object.keys(DIMENSIONS_BY_SKILL).find((skill) => (DIMENSIONS_BY_SKILL[skill] || []).includes(dimension));
}
