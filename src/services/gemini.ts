import { GoogleGenAI, Type } from "@google/genai";
import { Message, Task, AssessmentResult } from "../types";
import { COLLABORATION_RUBRIC, CREATIVITY_RUBRIC, CRITICAL_THINKING_RUBRIC } from "../data/rubrics";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getRubricForSkill(skill: string) {
  switch (skill) {
    case 'Collaboration': return COLLABORATION_RUBRIC;
    case 'Creativity': return CREATIVITY_RUBRIC;
    case 'Critical Thinking': return CRITICAL_THINKING_RUBRIC;
    default: return '';
  }
}

export async function chatWithExecutiveLLM(messages: Message[], task: Task): Promise<Message[]> {
  const systemInstruction = task.systemPrompt;
  
  const formattedHistory = messages.map(m => m.sender + ": " + m.text).join('\\n');
  const prompt = "Conversation History:\\n" + formattedHistory + "\\n\\nGenerate the next response(s) from the AI teammates. Remember to format as 'Name: Message'. You can output multiple lines if multiple teammates speak.";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  const text = response.text || '';
  const newMessages: Message[] = [];
  
  const teammateNames = task.teammates.join('|');
  const regex = new RegExp(`(?:^|\\s)(${teammateNames}):\\s*`, 'g');
  const matches = [...text.matchAll(regex)];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const sender = match[1];
      const startContent = (match.index || 0) + match[0].length;
      const endContent = i + 1 < matches.length ? (matches[i + 1].index || text.length) : text.length;
      const msgText = text.substring(startContent, endContent).trim();
      
      if (msgText) {
        newMessages.push({
          id: Date.now().toString() + Math.random().toString(),
          sender,
          text: msgText,
          isUser: false,
          timestamp: Date.now()
        });
      }
    }
  } else if (text.trim().length > 0) {
    // Fallback if parsing fails but we got text
    newMessages.push({
      id: Date.now().toString(),
      sender: task.teammates[0],
      text: text.trim(),
      isUser: false,
      timestamp: Date.now()
    });
  }

  return newMessages;
}

export async function evaluateTranscript(messages: Message[], task: Task): Promise<AssessmentResult> {
  const rubric = getRubricForSkill(task.skill);
  const formattedHistory = messages.map(m => m.sender + ": " + m.text).join('\\n');

  const prompt = "You are an expert AI Evaluator assessing a user's '" + task.skill + "' skills based on a conversation transcript.\\n" +
"Task Description: " + task.description + "\\n\\n" +
"Rubric:\\n" + rubric + "\\n\\n" +
"Transcript:\\n" + formattedHistory + "\\n\\n" +
"Evaluate the human user ('User') on the dimensions specified in the rubric.\\n" +
"Return a JSON object matching this schema:\\n" +
"{\\n" +
'  "skill": "' + task.skill + '",\\n' +
'  "overallScore": number (1-4) or "NA",\\n' +
'  "summary": "A brief 2-3 sentence summary of their performance.",\\n' +
'  "dimensions": [\\n' +
'    {\\n' +
'      "dimension": "Name of the dimension (e.g., Conflict Resolution, Fluidity)",\\n' +
'      "score": number (1-4) or "NA",\\n' +
'      "levelName": "e.g., Demonstrating, Emerging, Dormant, Excelling",\\n' +
'      "feedback": "Specific qualitative feedback explaining the score.",\\n' +
'      "excerpt": "A specific quote from the User in the transcript that justifies this score."\\n' +
'    }\\n' +
'  ]\\n' +
"}";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          overallScore: { type: Type.NUMBER }, // Can't easily mix types in schema, we'll use 0 for NA and map it later if needed, or just let it be a number. Let's use STRING to allow "NA" or "3".
          summary: { type: Type.STRING },
          dimensions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dimension: { type: Type.STRING },
                score: { type: Type.NUMBER }, // We will treat 0 as NA
                levelName: { type: Type.STRING },
                feedback: { type: Type.STRING },
                excerpt: { type: Type.STRING }
              },
              required: ["dimension", "score", "levelName", "feedback", "excerpt"]
            }
          }
        },
        required: ["skill", "overallScore", "summary", "dimensions"]
      }
    }
  });

  let text = response.text || '{}';
  text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '').trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```.*\\n/, '').replace(/\\n```$/, '').trim();
  }
  const result = JSON.parse(text);
  
  // Map 0 to 'NA' if needed, though schema enforces NUMBER.
  return result as AssessmentResult;
}
