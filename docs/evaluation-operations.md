# Evaluation Operations Guide

## Objectives

Use this workflow to operate calibration, validation, and scorer experiments safely.

## 1) Generate a 100-200 conversation calibration seed

Default (120 conversations):

```bash
npm run eval:seed
```

Custom count:

```bash
node scripts/simulate-calibration-set.mjs --count 180
```

Output file:
- `data/runtime/calibration-seed-<count>.jsonl`

## 2) Capture human ratings (internal raters)

List recent replay artifacts:

```bash
npm run eval:rater -- list --limit 20
```

Submit a rating:

```bash
npm run eval:rater -- rate \
  --artifact <artifact-id> \
  --rater alice \
  --locale en-IN \
  --scores '{"Conflict Resolution":3,"Project Management":2}' \
  --notes 'Good planning, weaker conflict diagnosis.'
```

Ratings are written to:
- `data/runtime/human-ratings.jsonl`

## 3) Run eval harness

```bash
npm run eval:harness
```

Outputs:
- agreement metrics (human-human kappa, human-LLM kappa)
- evidence density by skill
- recovery test outcomes
- profile comparison summary

Report path:
- `data/runtime/eval-harness-report.json`

## 4) Scorer experiment profiles

Supported profiles:
- `default`
- `strict`
- `formative`

Pass profile from frontend and API via `scoringProfileId`.

## 5) Version pinning and replayability

Set pinned versions in `.env` / deployment secrets:
- `EXECUTIVE_MODEL_ID`
- `TURN_LABELER_MODEL_ID`
- `SCORER_MODEL_ID`
- `SCORER_VERSION`
- `PROMPT_POLICY_VERSION`

Every evaluation artifact stores these versions for reproducible replay.
