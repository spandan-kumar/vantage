import fs from 'node:fs/promises';
import path from 'node:path';

const skills = [
  {
    skill: 'Collaboration',
    locales: ['en-IN', 'en-US', 'hi-IN'],
    templates: [
      'User resolves a disagreement by proposing compromise and assigning clear next steps.',
      'User defines goals, roles, and timeline while maintaining psychological safety.',
      'User de-escalates conflict and asks each teammate for constraints before deciding.',
    ],
  },
  {
    skill: 'Creativity',
    locales: ['en-IN', 'en-US', 'hi-IN'],
    templates: [
      'User generates multiple ideas, evaluates tradeoffs, and combines the best elements.',
      'User pushes for originality while keeping feasibility constraints explicit.',
      'User iterates teammate suggestions into a stronger integrated concept.',
    ],
  },
  {
    skill: 'Critical Thinking',
    locales: ['en-IN', 'en-US', 'hi-IN'],
    templates: [
      'User identifies assumptions, asks for evidence quality, and challenges weak inferences.',
      'User separates correlation and causation and requests alternative explanations.',
      'User evaluates source credibility and logical consistency before concluding.',
    ],
  },
];

const args = process.argv.slice(2);
const countArgIndex = args.indexOf('--count');
const count = countArgIndex >= 0 ? Number.parseInt(args[countArgIndex + 1], 10) : 120;
const safeCount = Number.isFinite(count) && count > 0 ? count : 120;

const outputDir = path.join(process.cwd(), 'data', 'runtime');
const outputPath = path.join(outputDir, `calibration-seed-${safeCount}.jsonl`);

const rows = [];
for (let i = 0; i < safeCount; i += 1) {
  const skillBundle = skills[i % skills.length];
  const locale = skillBundle.locales[i % skillBundle.locales.length];
  const template = skillBundle.templates[i % skillBundle.templates.length];
  rows.push({
    id: `seed-${i + 1}`,
    skill: skillBundle.skill,
    locale,
    transcript: [
      { sender: 'Teammate', text: 'Let us align quickly on approach.' },
      { sender: 'User', text: template },
      { sender: 'Teammate', text: 'Can you justify that with one concrete criterion?' },
      { sender: 'User', text: 'I will prioritize feasibility, impact, and team alignment.' },
    ],
    intendedUse: 'manual-rating-calibration',
    createdAt: new Date().toISOString(),
  });
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8');

console.log(`Generated calibration seed dataset: ${outputPath}`);
console.log(`Total conversations: ${rows.length}`);
