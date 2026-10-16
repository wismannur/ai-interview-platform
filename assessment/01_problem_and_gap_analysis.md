# Problem & Gap Analysis: AI Interview Platform
**Author:** Wisman Nur (Lead / Senior Staff Product Engineer)  
**Standard:** Monozukuri (Craftsmanship Beyond Minimum Baseline)  
**Date:** October 2026  

---

## 1. Product Context & Domain Immersion (5 Core Pillars)

### Pillar 1: The Product (Actual End-to-End Reality)
The AI Interview Platform is designed to automate technical and behavioral candidate assessments using generative AI (Gemini Live for real-time bidirectional audio probing, Gemini Flash for async coverage analysis, and Gemini Pro for portfolio synthesis). Rather than asking static question lists, the platform dynamically analyzes candidate responses, challenges assumptions, tracks coverage across competency levels (L1–L5), and compiles a fit/gap report against specific vacancy profiles.

### Pillar 2: The Indonesian Hiring Industry Context
In Indonesia, high-growth technology companies and enterprises face extreme applicant volume for engineering and product roles (often 500–1,500 applicants per junior-to-mid vacancy). Recruiters and hiring managers spend up to 70% of their screening time filtering surface-level resumes and conducting repetitive first-round screening calls. Traditional automated screening (multiple-choice or LeetCode clones) tests theoretical memorization rather than real production trade-off thinking. The real leverage is an intelligent, conversational interviewer that can test *depth of reasoning* while maintaining standardized rubric calibration.

### Pillar 3: What It Is For (Outcome & Akuntabilitas)
This product exists to produce an objective, defensible, and actionable skill portfolio for every candidate. For it to remain useful and trusted:
1. Every score must be backed by tangible verbatim transcript quotes (*evidence-grounded*).
2. The AI must remain impartial, avoiding hallucinated ratings or superficial affirmations.
3. Human assessors must retain final authority to calibrate and override AI recommendations.

### Pillar 4: The Users (Assessor, Recruiter, Hiring Manager)
- **Recruiters**: Need high-throughput batch invites, real-time live monitoring of interview status, and clear pass/fail fit indicators without technical jargon.
- **Assessors & Hiring Managers**: Need granular evidence breakdowns, the ability to stress-test candidate claims, compare candidate profiles directly against vacancy benchmarks, and override ratings with explicit reasoning notes.

### Pillar 5: The People Affected Who Never Chose It (Candidates & UU PDP)
Candidates do not choose this software; they are evaluated by it, and an unfair or buggy assessment can derail their career trajectory.
Under **Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**:
- **Pasal 20 & 21 (Explicit Consent & Transparency)**: Processing candidate voice data and algorithmic automated decision-making requires explicit, informed consent prior to recording.
- **Pasal 35 & 39 (Security & Confidentiality)**: Personal identifiable information (PII) including candidate names, voice transcripts, and evaluation ratings must never leak into server logs or public endpoints.
- **Pasal 8 (Right to Rectification & Explanation)**: Candidates are entitled to fair assessment and transparency on the criteria evaluated.

---

## 2. Severity-Ranked Problem & Gap Analysis (P0 - P3)

| ID | Sev | Finding Category | Root Cause & Location | One-Line Real-World Impact |
| :--- | :--- | :--- | :--- | :--- |
| **P0-1** | **P0** | **Defective Implementation** | `Portfolios::Generator#save_skills` executes `portfolio.portfolio_skills.destroy_all`. | **Data Loss**: Overwrites human assessor calibration overrides and notes on portfolio regeneration, or crashes with foreign key violation. |
| **P0-2** | **P0** | **Defective Implementation** | `Session#invite_url` defaults to `APP_BASE_URL` (`http://localhost:3001` - Rails API port). | **System Blocker**: Candidates opening the interview link receive a 404 Routing Error because `/interview/:token` lives on the frontend. |
| **P0-3** | **P0** | **Defective Implementation** | `Gemini::HttpClient` lacks `responseMimeType: "application/json"` and strict JSON parse error recovery. | **Reliability Failure**: LLM responses containing markdown fences or commentary cause background worker crashes and failed evaluations. |
| **P0-4** | **P0** | **Missing Specification** | Absence of `filter_parameter_logging.rb` in `api/config/initializers/`. | **Legal & Privacy Violation**: Candidate names, JWT tokens, and interview transcripts are logged in plain text, breaching UU PDP Pasal 35 & 39. |
| **P1-1** | **P1** | **Defective Implementation** | `AssessmentsController#destroy` does not verify deletion return value with `restrict_with_error`. | **Data Integrity Flaw**: Returns 200 "Assessment deleted" even when foreign key sessions block deletion, misleading the recruiter. |
| **P1-2** | **P1** | **Missing Specification** | `InterviewPage.tsx` lacks explicit UU PDP consent checkbox and audio recording notice. | **Compliance & Trust Breach**: Candidates are recorded and algorithmically evaluated without statutory consent under UU PDP Pasal 20. |
| **P1-3** | **P1** | **Defective Implementation** | `FitGap::Engine` fallback narrative leaves `culture_narrative` as `nil` when model call fails. | **Evaluation Degradation**: Assessors receive an empty culture fit section without diagnostic failure indicators. |
| **P1-4** | **P1** | **Missing Specification** | Absence of test suites (0 specs in `api/`, 0 tests in `web/`). | **Engineering Risk**: Zero automated safety harness to detect regressions or verify core business logic across PRs. |
| **P2-1** | **P2** | **Defective Implementation** | `LiveMonitorPage.tsx` permanently slices transcript to only 10 turns (`slice(-10)`). | **UX Degradation**: Assessors observing 45-minute live sessions cannot review earlier turns to verify prior skill evidence. |
| **P2-2** | **P2** | **Defective Implementation** | `AssessmentListPage.tsx` ignores Kaminari pagination metadata (`meta`). | **Feature Blindness**: Assessments beyond page 1 (over 25 items) are permanently unreachable in the UI. |
| **P2-3** | **P2** | **Defective Implementation** | Unhandled null/empty states in `ComparisonTable.tsx` for `not_assessed` skills. | **Visual Bug**: Renders broken layout or confusing hyphens without explaining unassessed status. |
| **P3-1** | **P3** | **Missing Specification** | Lack of smooth skeleton loading and empty state guidance in portfolio and assessment views. | **Sub-optimal Craft**: UI lacks modern feedback states and actionable micro-interactions. |
| **P3-2** | **P3** | **Defective Implementation** | `Exports::PdfGenerator` lacks professional typography, score summaries, and corporate branding. | **Client Presentation Gap**: Exported reports look unformatted and lack executive readability. |

---

## 3. Constraint Signals & Technical Escalation

As a Senior Staff Engineer, the following architectural debts and blocking constraints are escalated:

1. **Dual Schema Search Path & Multitenancy Scoping**:
   - The database uses `schema_search_path: "ai_interview,public"`. While `Organization` lives in `public`, all interview tables reside in `ai_interview`.
   - `TenantScoped` depends on `RequestStore.store.key?(:tenant_id)`. In background workers (Sidekiq) where RequestStore is uninitialized, calling `.find` without tenant scoping can accidentally leak cross-tenant records if not explicitly managed.
2. **WebSocket Audio Bridge & Resource Management**:
   - `AudioWebSocketMiddleware` uses EventMachine (`EM::Timer`) and Faye::WebSocket. Long-running connections can accumulate memory if client disconnects are not properly reaped. Proactive reconnect timers must be strictly cancelled on browser close.
3. **Synchronous vs Asynchronous LLM Generation**:
   - Gemini Pro portfolio generation takes 60–120 seconds. It is correctly offloaded to Sidekiq, but the frontend polling mechanism must handle network disconnections, tab backgrounding, and retry limits gracefully.
