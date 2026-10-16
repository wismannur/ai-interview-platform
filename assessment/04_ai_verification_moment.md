# Section 04: AI Verification Moment (Senior Staff Critical Oversight)

**Author**: Wisman Nur (Lead / Senior Staff Product Engineer)  
**Date**: October 2026  

---

## 1. Context & Motivation

In modern AI-assisted engineering workflows, LLMs (such as GPT-4, Claude, or Copilot) frequently accelerate boilerplate generation. However, without deep architectural understanding and senior staff scrutiny, LLM-generated code often introduces subtle, high-severity bugs that pass superficial tests but cause catastrophic silent failures in production.

This section documents a concrete **AI Verification Moment** encountered during the audit and hardening of `ai-interview-platform`.

---

## 2. The Hallucinated / Flawed AI Suggestion

### The Scenario
When prompted to resolve **P0-1** (*"Portfolio regeneration wipes human assessor overrides"*), an AI assistant proposed the following "quick fix" in `Portfolios::Generator#save_skills`:

```ruby
# AI-GENERATED NAIVE PROPOSAL (REJECTED):
def save_skills(portfolio, data)
  # Preserve overrides by array
  overrides = portfolio.portfolio_skills.map(&:assessor_override).compact

  # Recreate skills
  portfolio.portfolio_skills.destroy_all
  
  (data['configured_skills'] || []).each do |skill_data|
    ps = portfolio.portfolio_skills.create!(...)
    # AI thought this would work:
    matching_override = overrides.find { |o| o.portfolio_skill.skill_label == ps.skill_label }
    matching_override.update!(portfolio_skill: ps) if matching_override
  end
end
```

### Why This Proposal Was Lethally Flawed (Senior Staff Critique)

1. **ActiveRecord Association Cascading Deletion (`dependent: :destroy`)**:
   In `PortfolioSkill`, the association is declared as:
   ```ruby
   has_one :assessor_override, dependent: :destroy
   ```
   When `portfolio.portfolio_skills.destroy_all` executes, PostgreSQL and ActiveRecord immediately cascade-delete all existing `assessor_overrides` rows in the database. Thus, the in-memory array `overrides` held frozen, deleted objects (`o.destroyed? == true`). Calling `matching_override.update!(...)` later would either raise `ActiveRecord::RecordNotFound` or silently fail because the foreign key had already been destroyed on disk!

2. **No Database Transaction Boundary**:
   The AI did not wrap the destruction and recreation in an `ActiveRecord::Base.transaction`. If network latency or a Gemini JSON syntax error occurred halfway through skill recreation, the candidate's existing portfolio skills were already destroyed, leaving the portfolio permanently corrupted in a partial state.

3. **Loss of Assessor Metadata**:
   The AI suggestion failed to account for `overridden_by` and `overridden_at` timestamps, causing audit log truncation.

---

## 3. The Senior Staff Engineering Solution

Recognizing the relational and transactional trap, we engineered a robust solution:

1. **Pre-Extraction into Detached Attribute Value Objects**:
   Before destroying existing records, we snapshot the override attributes (`override_level`, `assessor_notes`, `overridden_by`, `overridden_at`) into a decoupled ruby Hash keyed by `skill_id` (or normalized `skill_label`).

2. **Atomic Transactional Rollback Protection**:
   We wrapped the entire wipe-and-rebuild sequence inside `ActiveRecord::Base.transaction do ... end`. If any step fails, the database automatically rolls back to the pre-existing state without data loss.

3. **Re-Creation and Re-Association**:
   After the new `PortfolioSkill` is inserted with its fresh AI evidence and level, we query the preserved hash and call `portfolio_skill.create_assessor_override!(...)` with the preserved human notes, level, and timestamp.

```ruby
# PRODUCTION HARDENED IMPLEMENTATION:
def save_skills(portfolio, data)
  ActiveRecord::Base.transaction do
    # 1. Snapshot human overrides before destroying child records
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

    # 2. Recreate skills cleanly
    portfolio.portfolio_skills.destroy_all

    # 3. Insert and reapply overrides
    (data['configured_skills'] || []).each do |skill_data|
      ps = portfolio.portfolio_skills.create!(...)
      reapply_override_if_present(ps, preserved_overrides)
    end
    # ...
  end
end
```

---

## 4. Key Takeaways for AI-Augmented Engineering

1. **Verify Relational Lifecycle Semantics**: AI models frequently understand code syntax but fail to model relational database cascade triggers (`dependent: :destroy`) and state mutation lifecycles.
2. **Never Trust Unbounded Generative Output**: An AI prompt requesting JSON will frequently wrap the response in markdown blocks (````json ... ````) or append explanatory prose. Hardening must include strict JSON MIME-type parameters and regex fence stripping.
3. **The Role of the Senior Engineer**: AI is a force multiplier for ideation and scaffolding, but the human staff engineer remains the essential guardian of data integrity, security compliance, and system correctness.
