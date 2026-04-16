import { getAssessmentArtifact, listArtifacts, saveHumanRating } from '../server/storage.js';
import { normalizeLocale } from '../server/assessment-config.js';

function parseArgs(argv) {
  const output = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        output[key] = true;
      } else {
        output[key] = next;
        i += 1;
      }
    } else {
      output._.push(token);
    }
  }
  return output;
}

async function commandList(limit = 20) {
  const artifacts = await listArtifacts(limit);
  if (artifacts.length === 0) {
    console.log('No artifacts found.');
    return;
  }
  for (const artifact of artifacts) {
    console.log(
      `${artifact.artifactId} | ${artifact.createdAt} | ${artifact.skill} | ${artifact.locale} | mode=${artifact.assessmentMode}`
    );
  }
}

async function commandRate(args) {
  const artifactId = args.artifact;
  const raterId = args.rater;
  const scoresRaw = args.scores;

  if (!artifactId || !raterId || !scoresRaw) {
    throw new Error('Usage: rate --artifact <id> --rater <name> --scores "{\\"Dimension\\":3}" [--locale en-IN] [--notes text]');
  }

  const artifact = await getAssessmentArtifact(artifactId);
  if (!artifact) {
    throw new Error(`Artifact not found: ${artifactId}`);
  }

  let dimensionRatings;
  try {
    dimensionRatings = JSON.parse(scoresRaw);
  } catch {
    throw new Error('Invalid JSON in --scores argument.');
  }

  const payload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    artifactId,
    raterId,
    locale: normalizeLocale(args.locale || artifact.locale || 'en-IN'),
    skill: artifact.skill,
    dimensionRatings,
    notes: args.notes || '',
  };

  await saveHumanRating(payload);
  console.log('Human rating saved:');
  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'help';

  if (command === 'list') {
    await commandList(Number.parseInt(args.limit || '20', 10));
    return;
  }

  if (command === 'rate') {
    await commandRate(args);
    return;
  }

  console.log('rater-tool commands:');
  console.log('  node scripts/rater-tool.mjs list [--limit 20]');
  console.log('  node scripts/rater-tool.mjs rate --artifact <id> --rater <name> --scores "{\\"Dimension\\":3}" --locale en-IN');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
