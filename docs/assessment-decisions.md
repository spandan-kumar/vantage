# Vantage Durable Skills Assessment: Product Decisions and Rationale

Last updated: 2026-04-15

## 1) Why we changed the assessment flow

The Google Vantage research emphasizes an adaptive "Executive LLM" that steers conversation toward high-density evidence for target skills, then an AI evaluator that scores against the same rubric [1][2].

In the current app, this translated into three concrete priorities:

1. Gather more useful behavioral evidence during the chat (not just free-form dialogue).
2. Make scoring uncertainty visible (confidence, reliability, minimum evidence checks).
3. Support growth, not just grading (practice mode + actionable development plan), aligned with Google's stated next step toward skill growth [1].

## 2) Implemented decisions

## Decision A: Adaptive evidence coverage in chat orchestration

What we implemented:
- Added backend evidence-coverage analysis by skill dimension.
- Added adaptive facilitation guidance so the teammate generator nudges conversation toward uncovered dimensions.
- Added an explicit `assessmentMode` behavior split (`assessment` vs `practice`) in chat generation.

Why:
- The technical report describes the Executive LLM as explicitly steering for measurable evidence density while preserving natural interaction [2].
- This improves observability and reduces random drift in open-ended chat.

Tradeoff:
- Heuristic coverage detection (keyword-based) is lightweight and interpretable, but not as robust as a learned evidence classifier.

## Decision B: Minimum evidence gating before stable evaluation

What we implemented:
- In assessment mode, the UI blocks "End & Evaluate" until a minimum user-turn threshold is reached.
- Backend reports `minimumEvidenceMet`, `uncoveredDimensions`, and reliability flags when evidence is sparse.

Why:
- The report frames assessment quality as evidence-dependent and explicitly contrasts informative vs non-informative interactions [2].
- The Standards for Educational and Psychological Testing emphasize that interpretation quality depends on appropriate evidence and intended use [3].

Tradeoff:
- Slightly longer assessment sessions, but better score stability and interpretability.

## Decision C: Confidence-aware multidimensional scoring output

What we implemented:
- Expanded result schema with per-dimension confidence, evidence count, next probe, and overall confidence.
- Added NA handling for insufficient evidence.
- Added reliability, validity, and fairness notes in the report payload.

Why:
- The Vantage report explicitly uses turn-level rating logic, NA outcomes, and agreement-based psychometric framing [2].
- Validity should be treated as an evidence-backed interpretive argument, not a single metric [4][5].

Tradeoff:
- More complex output schema, but this supports auditability and better user trust.

## Decision D: Fairness and risk surfacing in feedback

What we implemented:
- Added explicit fairness checks in evaluation output.
- Added reliability/validity disclosures to communicate uncertainty and scope limits.

Why:
- NIST AI RMF identifies trustworthiness as including validity/reliability and fairness with harmful bias managed [6].
- For high-impact educational signals, fairness statements and bias-risk visibility are a minimum responsible default.

Tradeoff:
- Slightly denser report UI; mitigated via grouped sections.

## Decision E: Practice mode + longitudinal trend

What we implemented:
- Added mode switch in the app: `Assessment` (neutral facilitation) and `Practice` (coaching-oriented facilitation).
- Added local longitudinal history (recent same-skill attempts) to visualize directional growth.

Why:
- Google explicitly notes the next phase beyond assessment is skill growth through practice in simulated environments [1].
- Repeated observations across sessions are more useful for growth than a single-point score.

Tradeoff:
- Local history is currently client-side only (not cross-device). Good for iteration speed, but not enterprise analytics.

## 3) What this does *not* solve yet

1. Human-rater calibration workflow: we still need periodic expert benchmarking against model ratings.
2. Advanced psychometrics: no IRT/G-theory layer yet; current system is rubric + confidence + evidence diagnostics.
3. Population-level fairness analytics: no cohort-level disparity dashboard yet.
4. Transfer validation: simulation-to-real-world transfer is still an open research problem called out in [1][2].

## 4) Recommended next implementation milestones

1. Add a calibration set and periodic human-vs-model agreement tracking.
2. Replace keyword evidence heuristics with a dedicated evidence-classification model.
3. Add scenario-level blueprinting to guarantee balanced dimension coverage across tasks.
4. Add organization-level analytics (distribution shift, drift, and subgroup fairness monitoring).

## Sources

[1] Google Research Blog, "Towards developing future-ready skills with generative AI" (2026): https://research.google/blog/towards-developing-future-ready-skills-with-generative-ai/

[2] Globerson et al., "Towards Scalable Measurement of Durable Skills" (Google Research technical report, 2026): https://services.google.com/fh/files/misc/toward_scalable_measurement_of_durable_skills.pdf

[3] AERA/APA/NCME, *Standards for Educational and Psychological Testing* (2014): https://www.testingstandards.net/uploads/7/6/6/4/76643089/standards_2014edition.pdf

[4] Kane, M. (2013), "The Argument-Based Approach to Validation": https://www.ets.org/research/policy_research_reports/publications/article/2013/jrpe.html

[5] Messick, S. (1994), "Validity of Psychological Assessment" (ETS report): https://files.eric.ed.gov/fulltext/ED380496.pdf

[6] NIST, *AI Risk Management Framework (AI RMF 1.0)* (2023): https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf
