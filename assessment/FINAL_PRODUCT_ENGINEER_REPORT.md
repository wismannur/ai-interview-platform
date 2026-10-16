# AI INTERVIEW PLATFORM: PRODUCT & ENGINEERING HARDENING REPORT
**Case Study Submission — Senior Staff / Lead Product Engineer**  
**Author:** Wisman Nur  
**Target Branch:** `feat/monozukuri-interview-revamp-wismannur`  
**Base Repository:** `rakamindev/ai-interview-platform`  
**Standard:** Monozukuri (Craftsmanship Beyond Minimum Baseline)  
**Date:** October 2026  

---

## EXECUTIVE SUMMARY

This report documents the end-to-end audit, architectural stabilization, and release engineering for the **AI Interview Platform** (`api/` Ruby on Rails backend + `web/` React 18 TypeScript frontend). 

Operating under the engineering ethos of **Monozukuri** (technological rigor, deep craft, and operational excellence), we transformed a prototype with silent data-loss traps, privacy liabilities, and missing regression harnesses into a **production-grade, legally compliant, and defensively architected candidate assessment platform**.

### Key Outcomes Delivered:
1. **P0/P1 Critical Defect Elimination**:
   - **P0-1 Solved**: Human assessor calibration overrides are now preserved with 100% relational integrity across AI portfolio regenerations via transactional snapshotting.
   - **P0-2 Solved**: Candidate session invite URLs route correctly to the frontend application (`port 5173`) rather than crashing on the API server.
   - **P0-3 Solved**: Gemini HTTP client hardened with strict JSON MIME type negotiation (`application/json`) and markdown code block stripping.
   - **P0-4 & P1-2 Solved**: Implemented comprehensive **UU PDP No. 27/2022** compliance via parameter filtering in Rails and an explicit bilingual candidate consent modal in React before microphone access.
   - **P1-1 Solved**: Hardened assessment deletion with foreign key session guards, returning HTTP 422 with clear UI diagnostic alerts.
2. **Automated Verification Harness**:
   - **Backend**: **24 RSpec specs (100% pass)** covering models, services, clients, and API requests.
   - **Frontend**: **11 Vitest specs (100% pass)** covering privacy consent gating, fit/gap visualization, pagination, and assessor overrides.
   - **Seeded Fault Test**: Deliberately mutated override retention logic, proved the test suite caught the failure (RED at line 91), and verified resolution upon reversion (GREEN).
3. **AI Verification Moment**:
   - Identified and corrected flawed AI proposals that attempted naive array mapping over ActiveRecord cascading deletions (`dependent: :destroy`), preventing catastrophic data loss in production.

---

## 1. PRODUCT CONTEXT & DOMAIN IMMERSION

### 1.1 The Indonesian Tech Hiring Landscape
In Indonesia, high-growth technology companies, unicorns, and digital banking platforms process overwhelming volumes of candidate applications (typically 500–1,500 applicants per junior-to-mid vacancy). Tech recruiters and hiring managers spend up to 70% of their screening bandwidth reading surface-level CVs and conducting repetitive initial phone screens. 

Traditional automated screening tools—such as static multiple-choice quizzes or automated LeetCode tests—fail because they measure memorized algorithmic trivia rather than actual systems design, production debugging, and trade-off reasoning. The AI Interview Platform provides breakthrough leverage by conducting dynamic, conversational interviews that probe for reasoning depth while enforcing standardized rubrics (L1–L5).

### 1.2 Legal Mandate: UU PDP No. 27/2022 Compliance
Candidates do not choose to be interviewed by an AI; they are subjected to algorithmic evaluation as a condition of employment. In Indonesia, the enactment of **Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)** places strict legal obligations on data controllers:
- **Pasal 20 & 21 (Explicit Consent & Notice)**: Processing candidate biometric data (audio/voice) and automated profiling requires explicit, informed, and unambiguous consent prior to session commencement.
- **Pasal 35 & 39 (Confidentiality & Data Protection)**: Personal Identifiable Information (PII) including candidate names, audio chunks, and verbatim transcripts must be protected against accidental leakage into log files, APM traces, or unauthenticated endpoints.
- **Pasal 8 (Rubric Transparency & Right to Explanation)**: Candidates are entitled to know the criteria of their assessment. Scores cannot be arbitrary; every evaluation must be verifiable through verbatim transcript quotes.

---

## 2. SEVERITY-RANKED PROBLEM & GAP ANALYSIS (P0 – P3)

Following a comprehensive codebase audit across backend and frontend services, findings were categorized and prioritized using an industry-standard P0–P3 severity matrix:

| ID | Sev | Category | Root Cause & Code Location | Real-World Impact | Remediation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0-1** | **P0** | **Defective Implementation** | `Portfolios::Generator#save_skills` executes `portfolio.portfolio_skills.destroy_all`. | **Data Loss**: Overwrites human assessor calibration overrides and notes on portfolio regeneration. | **RESOLVED**: Transactional snapshot & override re-linking implemented. |
| **P0-2** | **P0** | **Defective Implementation** | `Session#invite_url` points to `APP_BASE_URL` (`port 3001` Rails API). | **Blocker**: Candidate opening invite link encounters 404 Routing Error because route lives on React frontend (`port 5173`). | **RESOLVED**: Dynamic host/port resolution based on client environment. |
| **P0-3** | **P0** | **Defective Implementation** | `Gemini::HttpClient` lacks `responseMimeType: 'application/json'` and fence cleaning. | **Reliability Failure**: Markdown-wrapped JSON responses crash background workers, leaving portfolios stuck in `generating`. | **RESOLVED**: MIME negotiation + regex block stripping added. |
| **P0-4** | **P0** | **Missing Specification** | Absence of `filter_parameter_logging.rb` in `api/config/initializers/`. | **Legal Breach**: Plain-text PII (names, tokens, transcripts) leaked into production logs in violation of UU PDP. | **RESOLVED**: Initializer deployed with strict PII parameter filters. |
| **P1-1** | **P1** | **Defective Implementation** | `AssessmentsController#destroy` does not verify deletion return value. | **Integrity Flaw**: Returns 200 "Assessment deleted" even when foreign-key sessions block deletion. | **RESOLVED**: HTTP 422 returned with clear dependency error message. |
| **P1-2** | **P1** | **Missing Specification** | `InterviewPage.tsx` lacks explicit privacy consent modal. | **Compliance Risk**: Voice data recorded without statutory candidate consent. | **RESOLVED**: `PrivacyConsentModal.tsx` gating hardware check deployed. |
| **P1-3** | **P1** | **Defective Implementation** | `FitGap::Engine` fallback narrative leaves culture narrative empty on network failure. | **Evaluation Flaw**: Assessors receive an empty report section with no diagnostic alert. | **RESOLVED**: Structured fallback culture and gap narratives implemented. |
| **P1-4** | **P1** | **Missing Specification** | Zero test suites existed in both `api/` and `web/`. | **Engineering Debt**: High risk of silent regressions on every pull request. | **RESOLVED**: 24 RSpec specs + 11 Vitest specs added (100% passing). |
| **P2-1** | **P2** | **Defective Implementation** | `LiveMonitorPage.tsx` permanently sliced transcript to 10 turns. | **UX Limitation**: Assessors in 45-min sessions cannot inspect earlier turns. | **RESOLVED**: Added toggle between Recent (10) and Full Transcript without dropping WebSocket buffer. |
| **P2-2** | **P2** | **Defective Implementation** | `AssessmentListPage.tsx` ignored pagination metadata. | **Feature Blindness**: Assessments beyond page 1 are unreachable in UI. | **RESOLVED**: Next/Prev pagination controls and page indicator deployed. |
| **P2-3** | **P2** | **Defective Implementation** | Unhandled null/empty states for unassessed skills in `ComparisonTable.tsx`. | **Visual Confusion**: Rendered blank dashes without explaining "Not Assessed". | **RESOLVED**: Added distinct `⚪ Not Assessed` badge and summary counter. |

---

## 3. ARCHITECTURAL STRATEGY & TRADE-OFF ANALYSIS

### 3.1 Architecture Decision: Option A vs Option B

```
OPTION A: Direct LLM Audio Stream (WebRTC/Bidi WebSocket)
[Candidate Browser] <==== High-Bandwidth Audio WSS ====> [Gemini Live API]
                         (No local persistence per turn; fragile over 4G)

OPTION B (Selected): Async Decoupled Event-Driven Pipeline
[Candidate Browser] <== WSS ==> [Rails API & Redis] <== Audio Sink ==> [Whisper/Deepgram STT]
                                      ||
                             (Persists Turn & State)
                                      ||
                           [Sidekiq Background Jobs]
                                      ||
                        [Gemini Flash/Pro JSON Engine]
```

#### Detailed Trade-Off Evaluation:

| Dimension | Option A: Direct LLM Audio Stream | Option B: Decoupled Async Event Pipeline (Selected) |
| :--- | :--- | :--- |
| **Audio Latency** | Low (~400–600ms) bidirectional speech. | Moderate (~800–1200ms) per conversational turn. |
| **Network Resilience (SEA/Indonesian 4G)** | **Extremely Poor**: Packet loss triggers socket reset; interview terminates prematurely. | **Resilient**: Audio streamed in finite chunks; automatic reconnect preserves full transcript state. |
| **Operating Cost (OpEx)** | **High**: ~$0.06/minute for raw multimodal streaming audio tokens. | **Optimal**: ~$0.005/minute text token inference with cached prompts. |
| **UU PDP & Audit Compliance** | **High Liability**: Audio streams bypass localized backend storage; difficult to prove audit trail. | **Compliant**: Every turn is recorded in PostgreSQL `ai_interview.transcript_turns` with millisecond timestamps. |
| **Assessor Calibration (Overrides)** | Impossible mid-flight; post-hoc regeneration risks desynchronization. | Native relational persistence with `AssessorOverride` linked to canonical skill entities. |

**Staff Engineer Conclusion**: Option B is superior for Indonesian production reality. Network resilience, auditability, cost predictability, and legal defensibility far outweigh the sub-second latency benefit of Option A.

---

## 4. ENGINEERING IMPLEMENTATION & PROOF OF RIGOR

### 4.1 Backend Implementation Highlights

#### 1. Transactional Override Preservation (`api/app/services/portfolios/generator.rb`)
```ruby
def save_skills(portfolio, data)
  ActiveRecord::Base.transaction do
    # Step 1: Snapshot existing overrides before child records are destroyed
    preserved_overrides = {}
    portfolio.portfolio_skills.includes(:assessor_override).each do |ps|
      if ps.assessor_override.present?
        key = ps.skill_id.presence || ps.skill_label.to_s.downcase.strip
        preserved_overrides[key] = {
          override_level: ps.assessor_override.override_level,
          assessor_notes: ps.assessor_override.assessor_notes,
          overridden_by:  ps.assessor_override.overridden_by,
          overridden_at:  ps.assessor_override.overridden_at
        }
      end
    end

    # Step 2: Clean slate skill recreation
    portfolio.portfolio_skills.destroy_all

    # Step 3: Insert new skills and restore human overrides
    (data['configured_skills'] || []).each do |skill_data|
      ps = portfolio.portfolio_skills.create!(...)
      reapply_override_if_present(ps, preserved_overrides)
    end
  end
end
```

#### 2. Strict PII Logging Sanitization (`api/config/initializers/filter_parameter_logging.rb`)
```ruby
Rails.application.config.filter_parameters += [
  :passw, :email, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn,
  :invite_token, :candidate_name, :audio_data, :audio_chunk, :transcript_text
]
```

### 4.2 Frontend Implementation Highlights

#### 1. UU PDP Candidate Consent Modal (`web/src/components/interview/PrivacyConsentModal.tsx`)
- Renders explicit Indonesian legal disclosures regarding voice recording and AI evaluation.
- Gating mechanism: The "Lanjutkan ke Pengecekan Perangkat" button remains disabled until the candidate explicitly activates the consent checkbox.
- Includes expandable legal disclosures detailing encrypted transmission (TLS/WSS) and localized data storage.

#### 2. Live Monitor Dual-View Toggle (`web/src/pages/monitor/LiveMonitorPage.tsx`)
- Provides seamless switching between `Recent (10)` and `Full Transcript` views.
- Preserves all incoming turns in memory while preventing UI render thrashing.

### 4.3 Automated Test Evidence

#### RSpec Execution (Backend):
```text
$ bundle exec rspec
................2026-10-16T22:21:17.751Z pid=21887 tid=mkn INFO: Sidekiq 7.3.10 connecting to Redis
........

Finished in 0.41643 seconds (files took 0.63413 seconds to load)
24 examples, 0 failures
```

#### Vitest Execution (Frontend):
```text
$ npm test
 ✓ src/test/ComparisonTable.test.tsx (2 tests) 38ms
 ✓ src/test/SkillPortfolioCard.test.tsx (4 tests) 39ms
 ✓ src/test/AssessmentListPage.test.tsx (2 tests) 124ms
 ✓ src/test/PrivacyConsentModal.test.tsx (3 tests) 138ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Duration  961ms
```

### 4.4 Seeded Fault Test: Proof of Suite Integrity

To verify that the automated test suite actively protects critical business logic, a deliberate fault was introduced in `Portfolios::Generator#reapply_override_if_present` by short-circuiting the override restoration loop (`return`):

#### 1. The Red State (Mutation Caught):
```text
$ bundle exec rspec spec/services/portfolios/generator_spec.rb
.F.

Failures:

  1) Portfolios::Generator#call preserves human assessor overrides across portfolio regenerations (P0-1 fix)
     Failure/Error: expect(new_react_skill.assessor_override).to be_present
       expected `nil.present?` to be truthy, got false
     # ./spec/services/portfolios/generator_spec.rb:91:in `block (3 levels) in <top (required)>'

Finished in 0.17107 seconds (files took 0.61863 seconds to load)
3 examples, 1 failure
```

#### 2. The Green State (Reversion Verified):
```text
$ bundle exec rspec spec/services/portfolios/generator_spec.rb
...

Finished in 0.18723 seconds (files took 0.65895 seconds to load)
3 examples, 0 failures
```

---

## 5. AI VERIFICATION MOMENT (STAFF-LEVEL CRITICAL OVERSIGHT)

### The Incident
When prompted for an automated fix to P0-1, an AI coding assistant suggested:
```ruby
# Flawed AI suggestion:
overrides = portfolio.portfolio_skills.map(&:assessor_override).compact
portfolio.portfolio_skills.destroy_all
# ... later in loop:
override.update!(portfolio_skill: new_skill)
```

### The Senior Staff Diagnosis & Pushback
1. **ActiveRecord Cascading Deletion Trap**: In the `PortfolioSkill` model, the relationship is defined as `has_one :assessor_override, dependent: :destroy`. When `destroy_all` executed on parent skills, PostgreSQL and ActiveRecord immediately executed `DELETE FROM assessor_overrides WHERE portfolio_skill_id IN (...)`. The in-memory array `overrides` held destroyed, frozen records. Calling `update!` on them raised `ActiveRecord::RecordNotFound` or failed silently.
2. **Missing Transaction Isolation**: The AI failed to wrap the operation in an `ActiveRecord::Base.transaction`. A failure midway through the loop permanently deleted the candidate's existing portfolio skills without recovery.
3. **The Solution**: We discarded the AI's proposal and implemented the detached value-object snapshot pattern inside an atomic database transaction.

---

## 6. VIDEO WALKTHROUGH SCRIPT & DEFENSE GUIDE

### 6.1 Timestamped Video Outline (3–5 Minutes)
- **00:00 – 00:45 | Introduction & Monozukuri Vision**: Positioning the platform as a production-grade hiring engine respecting Indonesian regulatory standards.
- **00:45 – 01:45 | Root-Cause Analysis (P0–P3)**: Reviewing the severity matrix, highlighting data loss risks and legal liabilities.
- **01:45 – 03:00 | Live Feature Showcase**:
  - Candidate journey: UU PDP consent gating -> hardware check -> interview.
  - Assessor journey: Live monitor with all-turns toggle -> portfolio override calibration -> fit/gap report with unassessed indicators.
- **03:00 – 04:00 | Proof of Rigor**: RSpec & Vitest execution, and live demonstration of the Seeded Fault test logs.
- **04:00 – 04:45 | AI Verification Moment & Closing**: Explaining why human engineering oversight is irreplaceable in AI-augmented development.

### 6.2 Key Pushback Defenses
- *Why Option B over Option A?* Network resilience over Indonesian cellular data networks and strict UU PDP auditability requirements.
- *How is PII protected?* Dual-layer protection: Rails parameter filtering stops server log leakage, and client-side explicit consent blocks unconsented data collection.

---

## CONCLUSION

Through disciplined architectural planning, senior staff oversight, and rigorous automated testing, the **AI Interview Platform** has been elevated from an experimental prototype to a resilient, enterprise-ready evaluation system. Every change has been committed under Conventional Commits on branch `feat/monozukuri-interview-revamp-wismannur`, ready for immediate production deployment.
