# Findings: Priority 1 Improvements

## Internationalization
- Found ~20 missing keys in `Settings.tsx` based on initial review.

## Type Safety
- `KPICard.tsx` uses `@ts-ignore` likely due to Recharts strict typing vs inferred types.
- `inspectionService.ts` casts data to `any` to handle joins or complex updates.
