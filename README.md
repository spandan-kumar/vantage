# Vantage Durable Skills Assessment

Monolith deployment of an adaptive durable-skills assessment system inspired by Google's Vantage work.

## What it includes

- Adaptive Executive policy loop that targets missing rubric dimensions.
- Turn-level evidence labeling before scoring.
- Multi-pass scorer aggregation with confidence, NA handling, and reliability flags.
- Practice vs Assessment mode split.
- Locale-aware rubric selection and locale calibration diagnostics.
- Replayable scoring artifacts with scorer/model/policy versioning.
- Per-user longitudinal history, dimension trends, and next-scenario recommendations.
- Cookie-based auth with server-side account sessions.
- Session history tied to authenticated accounts or guest mode.
- Internal evaluation tooling (seed generation, human ratings, kappa harness).

## Local development

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Start frontend dev server:

```bash
npm run dev
```

4. Start monolith API/server (serves `dist`):

```bash
npm run build
npm start
```

## Core scripts

```bash
npm run lint
npm run build
npm run eval:seed
npm run eval:rater -- list --limit 20
npm run eval:harness
```

## API endpoints

- `POST /api/chat`
- `POST /api/evaluate`
- `GET /api/auth/me`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/history?userId=<id>&skill=<optional>`
- `GET /api/sessions?userId=<id>&skill=<optional>`
- `GET /api/recommendations?userId=<id>&locale=<locale>`
- `GET /api/locale-calibration?locale=<locale>`
- `GET /api/artifacts/:artifactId`
- `POST /api/internal/human-rating`

## Decision docs

- `docs/assessment-decisions.md`
- `docs/evaluation-operations.md`
