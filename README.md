# Vantage: Durable Skills Assessment

Most assessments measure what is easy to score.

Durable skills are harder. Collaboration, creativity, and critical thinking show up in messy conversations, tradeoffs, disagreement, and judgment calls, not clean multiple-choice patterns.

This project was built from that frustration.

It is an independent implementation inspired by Google Research's Vantage work and the paper [Towards Scalable Measurement of Durable Skills](https://services.google.com/fh/files/misc/toward_scalable_measurement_of_durable_skills.pdf), then pushed further with product thinking, domain research, and a real application flow around persistent history, replayable scoring artifacts, reliability signals, and next-step recommendations. If the core question behind the Google work was "can AI create a scalable way to assess future-ready skills?", this repo asks the next one: "what would that look like as a serious, usable product?"

[Google Research blog: Towards developing future-ready skills with generative AI](https://research.google/blog/towards-developing-future-ready-skills-with-generative-ai/)  
[Google Vantage overview](https://research.google.com/p/vantage)

## What It Is

A rubric-driven assessment system where users enter simulated group tasks with AI teammates and are evaluated on how they think, respond, collaborate, and make decisions.

The goal is not to make chat feel smart. The goal is to make hard-to-measure human capability more observable.

The research that inspired this repo makes a compelling case:

- Real durable skills need more natural interaction than multiple-choice tests can provide.
- Good assessment still needs structure, consistency, and enough observable evidence to support scoring.
- An "Executive LLM" can steer a conversation toward skill-relevant moments without making the interaction feel robotic.
- An evaluator can score transcripts against a rubric in a way that approaches expert-human agreement.

This repo takes that seriously:

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

### 1. Debate: Social Media Regulation
**Skill:** Collaboration

Work with AI teammates to choose a stance, build arguments, manage disagreement, and move the group toward a shared opening statement.

Measures:
- Conflict resolution
- Project management
- Shared goal setting

### 2. Zero-waste Festival Design
**Skill:** Creativity

The user helps design a community Earth Day festival with minimal waste, balancing originality, feasibility, and practical constraints.

Measures:
- Idea generation
- Idea evaluation
- Building on ideas

### 3. Editorial Review: Coffee & Health
**Skill:** Critical Thinking

The user acts like a health editor reviewing a strong causal claim before publication, challenging assumptions, inspecting evidence quality, and separating good reasoning from bad reasoning.

Measures:
- Interpretation and analysis
- Evaluation and judgment
- Evidence scrutiny

## What Makes It Strong

- Adaptive scenario-based assessment across three durable skills
- Executive LLM steering to probe for missing evidence
- Turn-level evidence labeling before final scoring
- Multi-pass scoring with confidence and `NA` when evidence is weak
- Separate `assessment` and `practice` modes
- Session history, trends, and next-scenario recommendations
- Account-backed sessions with guest-mode fallback

## Product Flow

1. Choose a scenario.
2. Enter `assessment` or `practice` mode.
3. Complete the task with AI teammates.
4. Get a report with scores, evidence, and development guidance.
5. Track progress over time.

## Stack

`React 19`, `Vite`, `Express`, `Gemini`, `TypeScript`, `Tailwind CSS`

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Required environment variables:

- `GEMINI_API_KEY`
- `AUTH_SESSION_SECRET`

Production-style run:

```bash
npm run build
npm start
```

This project exists to make durable skills feel measurable without reducing them to shallow test mechanics.
