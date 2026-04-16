# Vantage: Durable Skills Assessment

Most assessment systems are good at measuring what is easy to score.

Durable skills are the opposite.

Collaboration, creativity, and critical thinking show up in messy conversations, tradeoffs, disagreements, incomplete information, and moments where someone has to make a call under pressure. Those are exactly the moments traditional testing flattens out.

This project was built from that frustration.

It is an independent implementation inspired by Google Research's Vantage work and the paper [Towards Scalable Measurement of Durable Skills](https://services.google.com/fh/files/misc/toward_scalable_measurement_of_durable_skills.pdf), then pushed further with product thinking, domain research, and a real application flow around persistent history, replayable scoring artifacts, reliability signals, and next-step recommendations. If the core question behind the Google work was "can AI create a scalable way to assess future-ready skills?", this repo asks the next one: "what would that look like as a serious, usable product?"

[Google Research blog: Towards developing future-ready skills with generative AI](https://research.google/blog/towards-developing-future-ready-skills-with-generative-ai/)  
[Google Vantage overview](https://research.google.com/p/vantage)

> This is not a generic chatbot demo wrapped in assessment language.  
> It is a rubric-driven assessment system where the conversation, evidence collection, scoring, and feedback loop are all designed around durable-skill measurement.

## Why This Exists

What gets measured gets taught. The problem is that many of the skills people keep calling "future-ready" are also the ones most systems fail to measure well.

The research that inspired this repo makes a compelling case:

- Real durable skills need more natural interaction than multiple-choice tests can provide.
- Good assessment still needs structure, consistency, and enough observable evidence to support scoring.
- An "Executive LLM" can steer a conversation toward skill-relevant moments without making the interaction feel robotic.
- An evaluator can score transcripts against a rubric in a way that approaches expert-human agreement.

That is the opening this project is built around.

Instead of asking users abstract questions about creativity or teamwork, the system drops them into simulated group tasks with AI teammates, watches how they respond, labels evidence turn by turn, and produces a report that tries to be honest about both signal and uncertainty.

## What This Repo Actually Implements

- Adaptive scenario-based assessment for three durable skills.
- An Executive LLM loop that probes for missing rubric evidence.
- Turn-level evidence labeling before conversation-level scoring.
- Multi-pass scoring with confidence, NA handling, spread, and reliability flags.
- Separate `assessment` and `practice` modes.
- Locale-aware rubric selection and calibration checks.
- Replayable scoring artifacts with scorer, model, and policy versioning.
- Per-user history, dimension trends, and next-scenario recommendations.
- Account-backed sessions with guest-mode fallback.
- Internal evaluation tooling for seed generation, human ratings, and harness runs.

## The Three Scenarios

These assessments are built around three imagined but realistic scenarios, each chosen to make a different durable skill visible in action instead of in theory.

### 1. Debate: Social Media Regulation
**Skill:** Collaboration

The user joins an expert-panel style discussion and has to work with AI teammates to choose a position, build arguments, manage disagreement, and move the group toward a coherent opening statement.

What this surfaces:

- Conflict resolution
- Project management
- Shared goal setting
- Team coordination under disagreement

### 2. Zero-waste Festival Design
**Skill:** Creativity

The user helps design a community Earth Day festival with minimal waste, balancing originality, feasibility, and practical constraints.

What this surfaces:

- Idea generation
- Idea evaluation
- Building on others' ideas
- Creative tradeoff-making

### 3. Editorial Review: Coffee & Health
**Skill:** Critical Thinking

The user acts like a health editor reviewing a strong causal claim before publication, challenging assumptions, inspecting evidence quality, and separating good reasoning from bad reasoning.

What this surfaces:

- Interpretation and analysis
- Evaluation and judgment
- Argument mapping
- Evidence scrutiny

## Why The System Is Credible

The interesting part is not that an LLM can chat. The interesting part is whether the system is structured enough to make the chat diagnostically useful.

This repo tries to do that in a few specific ways:

### Executive LLM, not freeform roleplay

The AI teammates are not just improvising. The conversation is guided by a policy loop that looks for missing evidence and steers toward moments that reveal skill.

If conflict resolution is the target, the system does not sit back and hope conflict appears. It creates the conditions where the user has to deal with it.

### Evidence before score

The system does not jump straight from transcript to headline number. It first labels evidence at the turn level, then aggregates repeated scoring passes into a conversation-level judgment.

That matters because durable skills are usually not visible in every message. They emerge across turns.

### Honest uncertainty

A clean-looking score can still be weak. This implementation exposes confidence, reliability flags, fairness checks, calibration status, and `NA` when evidence is not good enough.

That is important because assessment systems become dangerous the second they pretend to be more certain than they are.

### Growth, not just grading

One session is useful. A sequence of sessions is where the product starts becoming meaningful.

That is why this repo stores history, tracks dimension trends, and recommends the next scenario based on weaker areas instead of treating each run like an isolated quiz.

## Product Experience

From the user's point of view, the flow is simple:

1. Choose a scenario.
2. Enter either `assessment` or `practice` mode.
3. Work through a simulated task with AI teammates.
4. Receive a report with scores, evidence excerpts, confidence, and development actions.
5. Review progression across sessions.

Behind that simple flow is a more serious assessment stack:

- rubric selection
- executive steering
- transcript capture
- turn-level evidence labeling
- repeated scorer passes
- aggregation and reliability analysis
- artifact persistence
- history and recommendation generation

## Stack

- `React 19`
- `Vite`
- `Express`
- `Gemini`
- `TypeScript`
- `Tailwind CSS`

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set the required values in `.env`, especially:

- `GEMINI_API_KEY`
- `AUTH_SESSION_SECRET`

Optional model and scoring controls are exposed through environment variables such as:

- `EXECUTIVE_MODEL_ID`
- `TURN_LABELER_MODEL_ID`
- `SCORER_MODEL_ID`
- `SCORING_PASSES`
- `MIN_EVIDENCE_TURNS`

### 3. Start the app in development

```bash
npm run dev
```

This runs the web client and API together.

### 4. Production-style run

```bash
npm run build
npm start
```

## Core Scripts

```bash
npm run lint
npm run build
npm run eval:seed
npm run eval:rater -- list --limit 20
npm run eval:harness
```

## API Surface

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

## Repo Docs

- `docs/assessment-decisions.md`
- `docs/evaluation-operations.md`
- `design.md`

## Suggested README Assets

I did not pull external images from Google's materials into this repo. For quality and clarity, the best version of this README would add product-native visuals instead of borrowed research graphics.

If you want, add these and I can wire them into the README cleanly:

- `assets/readme/hero-dashboard.png`
  Place directly below the opening section. Best image: the scenario selection screen or a polished full-app screenshot.
- `assets/readme/scenarios.png`
  Place under `The Three Scenarios`. Best image: a stitched image showing all three scenario cards.
- `assets/readme/report.png`
  Place under `Why The System Is Credible` or `Product Experience`. Best image: the assessment report showing score breakdown, evidence, and reliability/calibration sections.
- `assets/readme/flow.png`
  Place under `Product Experience`. Best image: a simple product flow diagram: scenario -> conversation -> evidence -> scoring -> report -> progression.

## Closing Thought

The value of a system like this is not that it automates judgment.

The value is that it makes hard-to-see human capability more observable, more discussable, and more improvable without reducing everything to shallow test mechanics.

That is the bet behind this repo.
