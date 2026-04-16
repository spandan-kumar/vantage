# Vantage Durable Skills Assessment: Design Decisions, Rationale, and Sources

Last updated: 2026-04-16

## 1) What this implementation now does

This system is now built as a full assessment pipeline rather than a one-shot scorer:

1. Turn-level evidence labeling for every user turn.
2. Repeated scorer passes with aggregation and NA handling.
3. Adaptive Executive policy loop for missing dimensions.
4. Practice vs Assessment mode split with different facilitation behavior.
5. Replayable artifacts with scorer/model/policy versioning.
6. Longitudinal history, dimension trends, and next-scenario recommendations.
7. Cookie-based auth and account-backed session history.
8. Locale-aware rubric selection and calibration status checks.
9. Internal rater + eval harness (agreement, evidence density, recovery tests, experiment profiles).

## 2) Decision log

## A. Turn-level evidence first, then score aggregation

Decision:
- We label per-turn evidence before scoring.
- Scoring uses multiple passes and aggregates at conversation level.
- Dimensions can be marked NA when evidence is insufficient.

Why:
- The Google report emphasizes stronger signal from evidence-aware conversation analysis and supports NA semantics when evidence is weak [1][2].
- Psychometric interpretation quality depends on validity evidence, not just one model output [3][4][5].

Implementation details:
- `labelTurnEvidence()` creates dimension-labeled turn evidence.
- `runSingleScoringPass()` runs repeated scoring.
- `aggregateScoringPasses()` computes final dimension scores, confidence, spread, and reliability flags.

## B. Executive LLM as policy loop, not static prompting

Decision:
- Executive behavior is now driven by policy state:
  - uncovered dimensions
  - user turn count
  - targeted probes/challenges
  - pressure tactics
- It dynamically injects probe pressure while preserving mode constraints.

Why:
- The report frames this role as an orchestration mechanism for eliciting diagnostically useful evidence [2].

## C. Strict mode split: Practice vs Assessment

Decision:
- Assessment mode: neutral facilitation, stricter completion criteria.
- Practice mode: one coaching cue per cycle, formative orientation.

Why:
- Controlled assessment and formative practice have different validity and user-intent requirements [3].
- Google’s write-up explicitly points from measurement toward growth-oriented practice [1].

## D. Validity and fairness are first-class outputs

Decision:
- Reports include reliability flags, validity notes, fairness checks, and locale calibration status.
- Prompt-injection / score-gaming signals are detected and surfaced.

Why:
- NIST AI RMF stresses validity, reliability, and fairness as trustworthiness properties [6].
- High-stakes assessment should expose uncertainty and threats to validity [3][4].

## E. Versioned and replayable assessment artifacts

Decision:
- Every evaluation stores a replay artifact with:
  - transcript
  - turn evidence
  - scoring pass outputs
  - aggregate result
  - scorer/policy/model versions
  - scoring profile
- Artifacts are retrievable by ID.

Why:
- This is essential for auditability, reproducibility, and experiment comparisons over time.

## F. Longitudinal progression and recommendations

Decision:
- Per-user history is persisted server-side.
- UI displays dimension trend lines.
- Recommendations map weakest dimensions to next scenarios.

Why:
- A single report is noisy; longitudinal trajectories are more informative for durable skill growth [1][2].

## G. Authenticated account sessions

Decision:
- We use server-issued, signed HTTP-only cookies to identify users.
- Assessment history and session logs are attached to the authenticated account when available.
- Guest mode still exists for exploration, but signed-in users keep history across devices.

Why:
- A durable-skill product needs persistent accounts so session history and progression are portable rather than tied to browser storage.
- Signed cookies keep credentials off the client while still supporting the single-service monolith design.

## H. Internal eval operations

Decision:
- Added scripts for:
  - seed generation for 100–200 calibration conversations
  - internal human rating capture
  - eval harness with weighted kappa and recovery tests

Why:
- Human–human and human–LLM agreement plus stress tests are core to ongoing validation [2][3].

## 3) Remaining practical constraints

1. Locale-specific calibration still depends on collecting sufficient human ratings per locale.
2. Model-level behavior still requires periodic recalibration after model updates.
3. Recovery tests currently combine fixture checks and heuristic signal deltas; broader simulation coverage is recommended.

## 4) Sources

[1] Google Research Blog, "Towards developing future-ready skills with generative AI" (2026): https://research.google/blog/towards-developing-future-ready-skills-with-generative-ai/

[2] Globerson et al., "Towards Scalable Measurement of Durable Skills" (Google Research technical report, 2026): https://services.google.com/fh/files/misc/toward_scalable_measurement_of_durable_skills.pdf

[3] AERA/APA/NCME, *Standards for Educational and Psychological Testing* (2014): https://www.testingstandards.net/uploads/7/6/6/4/76643089/standards_2014edition.pdf

[4] Kane, M. (2013), "The Argument-Based Approach to Validation": https://www.ets.org/research/policy_research_reports/publications/article/2013/jrpe.html

[5] Messick, S. (1994), "Validity of Psychological Assessment": https://files.eric.ed.gov/fulltext/ED380496.pdf

[6] NIST, *AI Risk Management Framework (AI RMF 1.0)* (2023): https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf
