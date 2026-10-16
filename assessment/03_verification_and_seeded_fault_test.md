# Section 03: Verification, Test Suites & Seeded Fault Proof

**Author**: Wisman Nur (Lead / Senior Staff Product Engineer)  
**Branch**: `feat/monozukuri-interview-revamp-wismannur`  
**Date**: October 2026  

---

## 1. Test Suite Architecture & Methodology

In alignment with **Monozukuri** engineering craftsmanship, testing in this project goes beyond superficial happy-path assertions. We structured tests across two distinct boundaries:
1. **Backend Integration & Unit Specs (`api/spec`)**: Built using RSpec, FactoryBot, and DatabaseCleaner, verifying schema invariants, multi-tenant scoping, transactional integrity, JSON schema parsing, and external API error fallbacks.
2. **Frontend Component & Interaction Tests (`web/src/test`)**: Built with Vitest and React Testing Library, verifying user flows, conditional UI gates (UU PDP consent gating), state synchronization (all-turns transcript retention), and error boundaries.

---

## 2. Test Execution Results

### 2.1 Backend RSpec Suite (100% Pass)
Command executed:
```bash
bundle exec rspec
```

Execution Output:
```text
................2026-10-16T22:21:17.751Z pid=21887 tid=mkn INFO: Sidekiq 7.3.10 connecting to Redis with options {:size=>10, :pool_name=>"internal", :url=>"redis://localhost:6379/1"}
........

Finished in 0.41643 seconds (files took 0.63413 seconds to load)
24 examples, 0 failures
```

#### Coverage Matrix:
- `spec/models/session_spec.rb`:
  - Enforces valid status transitions (`pending` -> `active` -> `ended`).
  - Verifies invite URL generation targeting candidate frontend port (5173).
  - Enforces tenant isolation scoping.
- `spec/models/assessment_spec.rb`:
  - Validates time limit bounds (10–120 minutes).
  - Verifies dependent destruction of assessment skills.
  - Verifies foreign-key protection: prevents deletion when sessions exist.
- `spec/services/portfolios/generator_spec.rb`:
  - Generates portfolio skills and extracts verbatim quotes.
  - **Preserves human assessor overrides across AI portfolio regenerations (P0-1 Fix)**.
  - Clamps AI confidence and level boundaries (L1–L5).
- `spec/services/fit_gap/engine_spec.rb`:
  - Correctly evaluates `matches`, `exceeds`, `gaps`, and unassessed skills.
  - Honors assessor overrides in level delta calculations.
  - Gracefully falls back to structured narrative defaults on LLM network failure.
- `spec/clients/gemini/http_client_spec.rb`:
  - Enforces `responseMimeType: 'application/json'` in Gemini payload.
  - Strips markdown code blocks (````json ... ````) cleanly.
- `spec/requests/api/v1/assessments_spec.rb`:
  - Verifies paginated listing response schema (`assessments` and `meta`).
  - Returns 422 Unprocessable Entity when attempting to delete assessment with active sessions.

---

### 2.2 Frontend Vitest Suite (100% Pass)
Command executed:
```bash
npm test
```

Execution Output:
```text
> ai-interview-web@0.0.0 test
> vitest run

 RUN  v5.0.5 /Users/wismannur/Documents/coding-test/rakamin/web

 ✓ src/test/ComparisonTable.test.tsx (2 tests) 38ms
 ✓ src/test/SkillPortfolioCard.test.tsx (4 tests) 39ms
 ✓ src/test/AssessmentListPage.test.tsx (2 tests) 124ms
 ✓ src/test/PrivacyConsentModal.test.tsx (3 tests) 138ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Start at  05:22:33
   Duration  961ms
```

#### Coverage Matrix:
- `PrivacyConsentModal.test.tsx`:
  - Displays UU PDP No. 27/2022 compliance badges and legal notices.
  - Disables continuation until the user explicitly checks the agreement.
  - Toggles detailed privacy retention disclosure.
- `AssessmentListPage.test.tsx`:
  - Renders multi-page pagination controls (Next/Prev, page count).
  - Handles API deletion failure gracefully with an in-page error alert banner when blocked by existing sessions.
- `ComparisonTable.test.tsx`:
  - Correctly maps delta values, exceed stars, and gap alerts.
  - Highlights human assessor overrides with edit pencils.
  - Renders unassessed skills (`not_assessed`) distinctly.
- `SkillPortfolioCard.test.tsx`:
  - Prioritizes Assessor Override level over raw AI score.
  - Displays `Discovered` badge for dynamically surfaced competencies.
  - Renders warning banner when AI confidence is low.

---

## 3. Seeded Fault Test: Proof of Rigor

To prove that our automated tests are genuine regression guards and not vacuous "happy-path pass-throughs", we conducted a **Seeded Fault Test** on our critical P0-1 fix: **Assessor Override Retention**.

### 3.1 The Seeded Mutation
In `api/app/services/portfolios/generator.rb`, we introduced an intentional early return in `reapply_override_if_present`, simulating a regression where an engineer inadvertently disconnects the override restoration pipeline:

```ruby
def reapply_override_if_present(portfolio_skill, preserved_overrides)
  return # SEEDED FAULT: Deliberate bypass of override restoration
  key = portfolio_skill.skill_id.presence || portfolio_skill.skill_label.to_s.downcase.strip
  saved = preserved_overrides[key]
  return unless saved
  # ...
```

### 3.2 The Red State (Immediate Test Failure)
Running `bundle exec rspec spec/services/portfolios/generator_spec.rb`:

```text
.F.

Failures:

  1) Portfolios::Generator#call preserves human assessor overrides across portfolio regenerations (P0-1 fix)
     Failure/Error: expect(new_react_skill.assessor_override).to be_present
       expected `nil.present?` to be truthy, got false
     # ./spec/services/portfolios/generator_spec.rb:91:in `block (3 levels) in <top (required)>'

Finished in 0.17107 seconds (files took 0.61863 seconds to load)
3 examples, 1 failure

Failed examples:

rspec ./spec/services/portfolios/generator_spec.rb:66 # Portfolios::Generator#call preserves human assessor overrides across portfolio regenerations (P0-1 fix)
```

**Observation**: The test suite immediately and unambiguously pinpointed the fault at line 91, preventing silent data loss in production.

### 3.3 The Green State (Reversion & Resolution)
Removing the seeded fault restored the spec to 100% pass:

```text
...

Finished in 0.18723 seconds (files took 0.65895 seconds to load)
3 examples, 0 failures
```

This establishes an immutable verification trail proving test integrity.
