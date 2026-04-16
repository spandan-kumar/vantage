import { Task } from '../types';

export const TASKS: Task[] = [
  {
    id: 'collab-debate',
    title: 'Debate: Social Media Regulation',
    theme: 'Society / Policy',
    skill: 'Collaboration',
    description:
      "Your group is an expert panel discussing: Should the government regulate social media content? As a team, choose a viewpoint, develop at least three arguments, and draft a short opening statement.",
    teammates: ['Alex', 'Jordan'],
    systemPrompt:
      "You are the Executive LLM managing Alex and Jordan with a human teammate. Elicit evidence of Collaboration (Conflict Resolution + Project Management). Keep responses concise and realistic. Format output as Name: Message.",
    localized: {
      'hi-IN': {
        title: 'बहस: सोशल मीडिया रेगुलेशन',
        description:
          'आपकी टीम विशेषज्ञ पैनल है। प्रश्न: क्या सरकार को सोशल मीडिया कंटेंट को रेगुलेट करना चाहिए? टीम के साथ दृष्टिकोण चुनें, कम से कम 3 तर्क बनाएं, और एक छोटा ओपनिंग स्टेटमेंट तैयार करें।',
        systemPrompt:
          'आप Executive LLM हैं जो Alex और Jordan को संचालित कर रहे हैं। लक्ष्य: यूज़र के Collaboration कौशल (Conflict Resolution और Project Management) का प्रमाण निकालना। जवाब संक्षिप्त रखें और फॉर्मेट Name: Message रखें।',
      },
    },
  },
  {
    id: 'creative-festival',
    title: 'Zero-waste Festival Design',
    theme: 'Science / STEM',
    skill: 'Creativity',
    description:
      'Design a community Earth Day festival with minimal waste. Explore many options, elaborate ideas, compare tradeoffs, and select a final concept that balances fun and feasibility.',
    teammates: ['Sam'],
    systemPrompt:
      "You are the Executive LLM managing Sam with a human teammate. Elicit evidence of Creativity (Generating Ideas, Evaluating Ideas, Building on Ideas). Keep responses concise and realistic. Format output as Name: Message.",
    localized: {
      'hi-IN': {
        title: 'जीरो-वेस्ट फेस्टिवल डिज़ाइन',
        description:
          'ऐसा Earth Day फेस्टिवल डिज़ाइन करें जिसमें कचरा सबसे कम हो। कई विकल्प बनाएं, विचारों को विस्तार दें, tradeoffs तुलना करें, और अंत में एक मजबूत कॉन्सेप्ट चुनें।',
        systemPrompt:
          'आप Executive LLM हैं जो Sam को संचालित कर रहे हैं। लक्ष्य: यूज़र के Creativity कौशल (Generating Ideas, Evaluating Ideas, Building on Ideas) का प्रमाण निकालना। जवाब संक्षिप्त रखें और फॉर्मेट Name: Message रखें।',
      },
    },
  },
  {
    id: 'critical-editorial',
    title: 'Editorial Review: Coffee & Health',
    theme: 'Science / STEM',
    skill: 'Critical Thinking',
    description:
      "You are a health editor reviewing a draft claiming coffee directly causes severe cardiovascular disease. Audit assumptions, evidence quality, and reasoning before publication.",
    teammates: ['Taylor'],
    systemPrompt:
      "You are the Executive LLM managing Taylor with a human editor. Elicit evidence of Critical Thinking (Interpret and Analyze, Evaluate and Judge). Keep responses concise and realistic. Format output as Name: Message.",
    localized: {
      'hi-IN': {
        title: 'एडिटोरियल रिव्यू: कॉफी और स्वास्थ्य',
        description:
          'आप स्वास्थ्य संपादक हैं। ड्राफ्ट दावा करता है कि कॉफी सीधे गंभीर हृदय रोग का कारण है। प्रकाशन से पहले assumptions, evidence quality और reasoning की जाँच करें।',
        systemPrompt:
          'आप Executive LLM हैं जो Taylor को संचालित कर रहे हैं। लक्ष्य: यूज़र के Critical Thinking कौशल (Interpret and Analyze, Evaluate and Judge) का प्रमाण निकालना। जवाब संक्षिप्त रखें और फॉर्मेट Name: Message रखें।',
      },
    },
  },
];
