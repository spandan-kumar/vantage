import { GoogleGenAI, Type } from "@google/genai";

const COLLABORATION_RUBRIC = `
# Collaboration Rubric

## Conflict Resolution
1. Overall: Fails to identify conflicts (1) -> Recognizes presence but struggles to address (2) -> Effectively responds to acknowledged conflicts (3) -> Proactively identifies and resolves conflicts, investigating root causes (4).
2. Conflict Identification: Fails to identify (1) -> Acknowledges only when prompted (2) -> Clearly identifies overt conflicts (3) -> Proactively surfaces potential gaps (4).
3. Scoping and Analysis: Mischaracterizes conflict (1) -> Oversimplifies in binary terms (2) -> Scopes the 'width' of the conflict (3) -> Investigates the conflict's 'depth' and 'type' (4).
4. Strategy Application: Applies detrimental strategies like stonewalling (1) -> Applies limited/mismatched strategy (2) -> Applies standard resolution practices like voting (3) -> Applies adaptive resolution practices tailored to conflict type (4).
5. Monitoring and Regulation: Creates hostile environment (1) -> Shows signs of negative emotional response (2) -> Maintains respectful tone (3) -> Fosters psychological safety and de-escalates tension (4).

## Project Management
1. Overall Competence: Antagonistic/apathetic (1) -> Reactive participation (2) -> Active participation (3) -> Leads co-construction and adaptive planning proactively (4).
2. Goal Setting & Shared Task Definition: Ignores/undermines goals (1) -> Passively accepts goals (2) -> Actively contributes to defining goals (3) -> Initiates and facilitates co-construction of clear goals (4).
3. Collaborative Planning & Role Definition: Ignores planning/roles (1) -> Relies on others for defining plan (2) -> Actively contributes practical ideas (3) -> Leads co-construction and adaptive planning proactively (4).
4. Mutual Status Monitoring: Limits shared awareness (1) -> Has limited contribution to shared awareness (2) -> Contributes to shared awareness by openly sharing status (3) -> Creates shared awareness and prompts team members (4).
`;

const CREATIVITY_RUBRIC = `
# Creativity Rubric

## Generating Ideas
1. Fluidity: Produces well below average number of distinct ideas (1) -> Below average (2) -> Average/above average (3) -> Well above average number of distinct ideas (4).
2. Originality: Produces well-known/predictable solutions (1) -> Slight variations on common solutions (2) -> Unconventional solutions (3) -> Surprising or novel solutions (4).
3. Quality: Suggestions are clearly irrelevant/infeasible (1) -> Address only a portion of the problem (2) -> Relevant and feasible, satisfy main constraints (3) -> Meet all criteria and adaptable to changing conditions (4).

## Evaluating Ideas
1. Elaborating: Provides little to no detail (1) -> Surface-level description (2) -> Details beyond surface-level specs (3) -> Substantive explanations including functionality (4).
2. Selecting: Chooses ideas that fail to address core problem (1) -> Chooses ideas that only partially address problem (2) -> Chooses feasible ideas that address core problem (3) -> Chooses ideas that are adaptable and balance utility/novelty (4).

## Building on Ideas
1. Overall Competence: Ignores/dismisses others' suggestions (1) -> Focuses on adjusting own ideas rather than incorporating others (2) -> Actively adapts and improves concepts by incorporating others' ideas (3) -> Seamlessly weaves together own ideas with others to create a stronger concept (4).
`;

const CRITICAL_THINKING_RUBRIC = `
# Critical Thinking Rubric

## Interpret and Analyze
1. Overall: Treats text as flat narrative, relies on others (1) -> Interprets rigidly in isolation (2) -> Clarifies ambiguous terms, maps structure accurately (3) -> Considers intent along with context, identifies missing info (4).
2. Clarifying Intent: Misidentifies core components (1) -> Distinguishes informational content from filler but miscategorizes (2) -> Accurately categorizes informational statements (3) -> Considers intent along with context (4).
3. Outlining Arguments: Fails to detect arguments (1) -> Mislabels components or relationships (2) -> Deconstructs and maps structure accurately (3) -> Identifies hidden assumptions and subtle gaps (4).

## Evaluate and Judge
1. Overall: Evaluates based on personal agreement (1) -> Evaluates based on surface traits (2) -> Evaluates using established criteria, identifies fallacies (3) -> Evaluates quality of sources, explains why argument is flawed (4).
2. Assessing Information: Selects based on pre-existing beliefs (1) -> Evaluates based on surface characteristics (2) -> Systematically evaluates using established criteria (3) -> Evaluates evidence with respect to specific claims, considers subtle issues (4).
3. Assessing Reasoning: Evaluates based on agreement with conclusion (1) -> Identifies obvious flaws but fails to diagnose (2) -> Identifies invalid logic or unsound arguments (3) -> Explains exactly why an argument is valid/sound or not (4).
`;

let ai = null;

function getAiClient() {
  if (ai) return ai;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
}

function getRubricForSkill(skill) {
  switch (skill) {
    case "Collaboration":
      return COLLABORATION_RUBRIC;
    case "Creativity":
      return CREATIVITY_RUBRIC;
    case "Critical Thinking":
      return CRITICAL_THINKING_RUBRIC;
    default:
      return "";
  }
}

function parseTeammateMessages(text, task) {
  const newMessages = [];
  const teammateNames = task.teammates.join("|");
  const regex = new RegExp(`(?:^|\\s)(${teammateNames}):\\s*`, "g");
  const matches = [...text.matchAll(regex)];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i += 1) {
      const match = matches[i];
      const sender = match[1];
      const startContent = (match.index || 0) + match[0].length;
      const endContent = i + 1 < matches.length ? (matches[i + 1].index || text.length) : text.length;
      const messageText = text.substring(startContent, endContent).trim();

      if (messageText) {
        newMessages.push({
          id: `${Date.now()}-${Math.random()}`,
          sender,
          text: messageText,
          isUser: false,
          timestamp: Date.now(),
        });
      }
    }
  } else if (text.trim().length > 0) {
    newMessages.push({
      id: `${Date.now()}`,
      sender: task.teammates[0],
      text: text.trim(),
      isUser: false,
      timestamp: Date.now(),
    });
  }

  return newMessages;
}

export async function chatWithExecutiveLLM(messages, task) {
  const aiClient = getAiClient();
  const formattedHistory = messages.map((m) => `${m.sender}: ${m.text}`).join("\\n");
  const prompt =
    "Conversation History:\\n" +
    formattedHistory +
    "\\n\\nGenerate the next response(s) from the AI teammates. Remember to format as 'Name: Message'. You can output multiple lines if multiple teammates speak.";

  const response = await aiClient.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: task.systemPrompt,
      temperature: 0.7,
    },
  });

  return parseTeammateMessages(response.text || "", task);
}

export async function evaluateTranscript(messages, task) {
  const aiClient = getAiClient();
  const rubric = getRubricForSkill(task.skill);
  const formattedHistory = messages.map((m) => `${m.sender}: ${m.text}`).join("\\n");

  const prompt =
    `You are an expert AI Evaluator assessing a user's '${task.skill}' skills based on a conversation transcript.\\n` +
    `Task Description: ${task.description}\\n\\n` +
    `Rubric:\\n${rubric}\\n\\n` +
    `Transcript:\\n${formattedHistory}\\n\\n` +
    `Evaluate the human user ('User') on the dimensions specified in the rubric.\\n` +
    `Return a JSON object matching this schema:\\n` +
    `{\\n` +
    `  "skill": "${task.skill}",\\n` +
    `  "overallScore": number (1-4) or "NA",\\n` +
    `  "summary": "A brief 2-3 sentence summary of their performance.",\\n` +
    `  "dimensions": [\\n` +
    `    {\\n` +
    `      "dimension": "Name of the dimension (e.g., Conflict Resolution, Fluidity)",\\n` +
    `      "score": number (1-4) or "NA",\\n` +
    `      "levelName": "e.g., Demonstrating, Emerging, Dormant, Excelling",\\n` +
    `      "feedback": "Specific qualitative feedback explaining the score.",\\n` +
    `      "excerpt": "A specific quote from the User in the transcript that justifies this score."\\n` +
    `    }\\n` +
    `  ]\\n` +
    `}`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          overallScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          dimensions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dimension: { type: Type.STRING },
                score: { type: Type.NUMBER },
                levelName: { type: Type.STRING },
                feedback: { type: Type.STRING },
                excerpt: { type: Type.STRING },
              },
              required: ["dimension", "score", "levelName", "feedback", "excerpt"],
            },
          },
        },
        required: ["skill", "overallScore", "summary", "dimensions"],
      },
    },
  });

  let text = response.text || "{}";
  text = text.replace(/^```json\\n/, "").replace(/\\n```$/, "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```.*\\n/, "").replace(/\\n```$/, "").trim();
  }

  return JSON.parse(text);
}
