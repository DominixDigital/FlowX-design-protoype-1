# Dependencies needing backend, AI or sports-expert validation

## Sports experts and coaches
- [ ] Dit Score method: inputs, weights, mappings, update cadence, minimum data (DS-01, DS-02).
- [ ] Sport-specific skill tests and development stages (the "skill development" dimension).
- [ ] Whether and how match performance should count (the "performance outcomes" dimension).
- [ ] Reassessment outcome vocabulary and its mapping to progress.
- [ ] Comparison fairness: improvement vs level, cohort minimum size, age thresholds (DS-04, DS-05).
- [ ] Wellbeing review of scores and comparison for ages 7–18.

## AI and companion
- [ ] Model selection, hosting, data residency, retention, and no-training guarantees for children's data.
- [ ] Retrieval scope per role, enforced server-side (XS02 visibility scopes).
- [ ] Evaluation set: score explanations, mistake explanations, parent rewrites, athlete-friendly drafts. Measure groundedness, tone by age, and refusals.
- [ ] Uncertainty handling: when to answer, when to defer to the coach, when to say data is missing.
- [ ] Speech-to-text vendor, on-device options, consent for athlete voice (off in the prototype).
- [ ] Safety: child-safety review, prompt-injection defences on coach notes, red-teaming.
- [ ] Logging of AI-drafted content and coach approvals (the audit trail exists in the prototype).

## Backend
- [ ] Score computation service with history snapshots (the prototype recalculates on read).
- [ ] Coach review and pause, with an audit trail and an appeal path (DS-08).
- [ ] Visibility and consent store per athlete and guardian (DS-06, DS-07), age-based transitions (AT01.05).
- [ ] Share requests, guardian approvals, and share-card rendering kept inside ditdit.
- [ ] Notification kinds: milestone, share request, athlete question → coach, feedback published.
- [ ] Companion preferences per person and surface (intro seen, quiet mode, dismissed nudges).
- [ ] Academy governance settings (enable, comparison batches, ages).

## Legal, brand and product
- [ ] Trademark checks for "ditdit", "dit" and "Dit Score".
- [ ] Final logo drawing, avatar illustration, motion specs, app icons.
- [ ] Parental-consent model by market (for example COPPA, GDPR-K).
- [ ] Policy on reversing a milestone and withdrawing shared cards.
