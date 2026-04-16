import fs from 'node:fs/promises';
import path from 'node:path';
import { DIMENSION_KEYWORDS } from '../server/assessment-config.js';
import { listArtifacts, loadHumanRatings } from '../server/storage.js';

const REPORT_PATH = path.join(process.cwd(), 'data', 'runtime', 'eval-harness-report.json');

function scoreToNum(value) {
  if (value === 'NA') return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(4, Math.round(numeric))) : 0;
}

function quadraticWeightedKappa(raterA, raterB, maxCategory = 4) {
  if (raterA.length === 0 || raterA.length !== raterB.length) return null;

  const categories = Array.from({ length: maxCategory + 1 }, (_, i) => i);
  const matrix = Array.from({ length: categories.length }, () => Array(categories.length).fill(0));

  for (let i = 0; i < raterA.length; i += 1) {
    const a = scoreToNum(raterA[i]);
    const b = scoreToNum(raterB[i]);
    matrix[a][b] += 1;
  }

  const total = raterA.length;
  const rowTotals = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const colTotals = categories.map((_, col) => matrix.reduce((sum, row) => sum + row[col], 0));

  let observed = 0;
  let expected = 0;

  for (let i = 0; i < categories.length; i += 1) {
    for (let j = 0; j < categories.length; j += 1) {
      const weight = ((i - j) ** 2) / (maxCategory ** 2 || 1);
      observed += weight * (matrix[i][j] / total);
      expected += weight * ((rowTotals[i] / total) * (colTotals[j] / total));
    }
  }

  if (expected === 0) return 1;
  return 1 - observed / expected;
}

function buildHumanHumanPairs(humanRatings) {
  const byKey = new Map();

  for (const rating of humanRatings) {
    const dimensions = rating.dimensionRatings || {};
    for (const [dimension, score] of Object.entries(dimensions)) {
      const key = `${rating.artifactId}::${dimension}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ raterId: rating.raterId, score });
    }
  }

  const pairsA = [];
  const pairsB = [];

  for (const values of byKey.values()) {
    if (values.length < 2) continue;
    for (let i = 0; i < values.length; i += 1) {
      for (let j = i + 1; j < values.length; j += 1) {
        pairsA.push(values[i].score);
        pairsB.push(values[j].score);
      }
    }
  }

  return { pairsA, pairsB };
}

function buildHumanLlmPairs(humanRatings, artifactMap) {
  const pairsA = [];
  const pairsB = [];

  for (const rating of humanRatings) {
    const artifact = artifactMap.get(rating.artifactId);
    if (!artifact?.aggregateResult?.dimensions) continue;

    const llmByDimension = new Map(
      artifact.aggregateResult.dimensions.map((dimension) => [dimension.dimension, dimension.score])
    );

    for (const [dimension, humanScore] of Object.entries(rating.dimensionRatings || {})) {
      if (!llmByDimension.has(dimension)) continue;
      pairsA.push(humanScore);
      pairsB.push(llmByDimension.get(dimension));
    }
  }

  return { pairsA, pairsB };
}

function computeEvidenceDensityBySkill(artifacts) {
  const bySkill = new Map();

  for (const artifact of artifacts) {
    const skill = artifact.skill || 'Unknown';
    const coverage = artifact.aggregateResult?.evidenceCoverage || [];
    const userTurns = artifact.aggregateResult?.metadata?.userTurnCount || 1;
    const density = coverage.reduce((sum, item) => sum + (item.evidenceCount || 0), 0) / Math.max(1, userTurns);

    if (!bySkill.has(skill)) bySkill.set(skill, []);
    bySkill.get(skill).push(density);
  }

  return [...bySkill.entries()].map(([skill, values]) => ({
    skill,
    averageEvidenceDensity: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3)),
    samples: values.length,
  }));
}

function evaluateRecoveryTests(recoveryTests) {
  return recoveryTests.map((test) => {
    const keywords = (DIMENSION_KEYWORDS[test.skill] || {})[test.dimension] || [];
    const beforeScore = keywords.filter((keyword) => test.before.toLowerCase().includes(keyword)).length;
    const afterScore = keywords.filter((keyword) => test.after.toLowerCase().includes(keyword)).length;
    const passed = test.expectedDirection === 'increase' ? afterScore > beforeScore : afterScore < beforeScore;

    return {
      id: test.id,
      skill: test.skill,
      dimension: test.dimension,
      beforeSignal: beforeScore,
      afterSignal: afterScore,
      expectedDirection: test.expectedDirection,
      passed,
    };
  });
}

function summarizeExperiments(artifacts) {
  const groups = new Map();

  for (const artifact of artifacts) {
    const profile = artifact.aggregateResult?.metadata?.scoringProfile || 'unknown';
    if (!groups.has(profile)) groups.set(profile, []);
    groups.get(profile).push(artifact);
  }

  return [...groups.entries()].map(([profile, items]) => {
    const scores = items
      .map((item) => item.aggregateResult?.overallScore)
      .filter((score) => score !== undefined)
      .map(scoreToNum);

    const confidence = items
      .map((item) => Number(item.aggregateResult?.overallConfidence || 0))
      .filter((value) => Number.isFinite(value));

    return {
      profile,
      sampleSize: items.length,
      averageScore: scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(3)) : null,
      averageConfidence: confidence.length
        ? Number((confidence.reduce((sum, value) => sum + value, 0) / confidence.length).toFixed(3))
        : null,
    };
  });
}

async function loadJson(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function main() {
  const artifacts = await listArtifacts(5000);
  const humanRatings = await loadHumanRatings();

  const artifactMap = new Map(artifacts.map((artifact) => [artifact.artifactId, artifact]));

  const humanHuman = buildHumanHumanPairs(humanRatings);
  const humanLlm = buildHumanLlmPairs(humanRatings, artifactMap);

  const humanHumanKappa = quadraticWeightedKappa(humanHuman.pairsA, humanHuman.pairsB);
  const humanLlmKappa = quadraticWeightedKappa(humanLlm.pairsA, humanLlm.pairsB);

  const recoveryTests = await loadJson(path.join(process.cwd(), 'data', 'fixtures', 'recovery-tests.json'), []);
  const recoveryResults = evaluateRecoveryTests(recoveryTests);

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      artifacts: artifacts.length,
      humanRatings: humanRatings.length,
      humanHumanPairs: humanHuman.pairsA.length,
      humanLlmPairs: humanLlm.pairsA.length,
    },
    agreement: {
      humanHumanQuadraticWeightedKappa: humanHumanKappa,
      humanLlmQuadraticWeightedKappa: humanLlmKappa,
    },
    evidenceDensityBySkill: computeEvidenceDensityBySkill(artifacts),
    recoveryTests: recoveryResults,
    recoveryPassRate:
      recoveryResults.length > 0
        ? Number((recoveryResults.filter((result) => result.passed).length / recoveryResults.length).toFixed(3))
        : null,
    experimentProfiles: summarizeExperiments(artifacts),
  };

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Eval harness report written to ${REPORT_PATH}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
