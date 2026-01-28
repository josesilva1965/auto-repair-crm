# Task Plan: Refactor i18n to Centralized Structure

## Goal
Refactor the 2300+ line i18n.ts file into a modular, maintainable structure using separate JSON files per language with namespace-based organization.

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand current i18n.ts structure
- [x] Identify all languages supported (en-GB, pt-PT, fr-FR, es-ES, de-DE)
- [x] Count and categorize translation keys
- [x] Document findings in findings.md
- **Status:** in_progress

### Phase 2: Planning & Structure
- [ ] Design new folder structure for locales
- [ ] Define namespace categories (common, vehicles, billing, etc.)
- [ ] Plan migration strategy (minimize breaking changes)
- [ ] Document decisions with rationale
- **Status:** pending

### Phase 3: Implementation
- [ ] Create src/locales/ folder structure
- [ ] Extract translations to JSON files per language/namespace
- [ ] Update i18n.ts to load from new structure
- [ ] Ensure backwards compatibility in components
- **Status:** pending

### Phase 4: Testing & Verification
- [ ] Run TypeScript compilation
- [ ] Test app loads without errors
- [ ] Verify translations display correctly
- [ ] Test language switching works
- **Status:** pending

### Phase 5: Delivery
- [ ] Review all output files
- [ ] Update walkthrough with changes
- [ ] Deliver to user
- **Status:** pending

## Key Questions
1. How many unique translation keys exist? (~400-500 per language)
2. What namespace categories make sense? (navigation, vehicles, billing, settings, work_orders, inspection, portal)
3. Should we keep fallback behavior? (Yes - i18next handles this automatically)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use JSON files | Standard i18next format, easier to manage, enables tooling |
| Namespace by feature | Groups related translations, easier to find/edit |
| Keep 5 language folders | Matches current languages (en-GB, pt-PT, fr-FR, es-ES, de-DE) |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
- Current i18n.ts is 2304 lines, ~109KB
- All translations are inline in a single file
- i18next already supports JSON backends via i18next-http-backend
