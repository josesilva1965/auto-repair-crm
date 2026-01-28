# Findings & Decisions

## Requirements
- Refactor i18n.ts from monolithic 2300+ line file to modular structure
- Maintain support for 5 languages: en-GB, pt-PT, fr-FR, es-ES, de-DE
- Keep backwards compatibility (no changes needed in components)
- Make translations easier to manage and extend

## Research Findings
- Current structure: Single `resources` object with language codes as keys
- Each language has ~400-500 translation keys
- Keys are grouped by comments (Navigation, Customers, Vehicles, etc.)
- i18next supports loading JSON files via `resources` option or `i18next-http-backend`

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use `/public/locales/` folder | Static assets accessible at build time |
| Namespace by feature area | Logical grouping for maintainability |
| Single namespace per language | Simplifies loading, avoids namespace complexity |
| Use JSON format | Standard, tooling support, easy to edit |
| Keep i18n.ts as config | Just imports JSON files, minimal code |

## Proposed Namespace Categories
Based on comment sections in current i18n.ts:
1. **common** - Navigation, buttons, status, general UI
2. **customers** - Customer management
3. **vehicles** - Vehicle management, service history
4. **workOrders** - Work orders, items, technician assignment
5. **billing** - Invoices, estimates, payments
6. **inventory** - Parts, supplies, purchasing
7. **settings** - Configuration, regional, email, hours
8. **inspection** - DVI, inspection items, categories
9. **portal** - Customer portal translations
10. **messages** - Notifications, errors

## Folder Structure
```
src/
  locales/
    en-GB.json
    pt-PT.json
    fr-FR.json
    es-ES.json
    de-DE.json
  i18n.ts (simplified config that imports JSON files)
```

## Issues Encountered
| Issue | Resolution |
|-------|------------|
|       |            |

## Resources
- i18n.ts: c:\Users\jsilv\Downloads\crm\code\auto-repair-crm\src\i18n.ts
- i18next docs: https://www.i18next.com/

---
*Update this file after every 2 view/browser/search operations*
