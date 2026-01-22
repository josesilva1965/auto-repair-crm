# Task Plan: Code Quality & visual Polish Improvements

## Goal
Implement approved "Priority 1" suggestions to improve code quality, stability, and maintainability.

## Phase 1: Internationalization (i18n)
- [x] Scan `Settings.tsx` for missing translation keys <!-- id: 0 -->
- [x] Update `i18n.ts` with new keys (en-GB & pt-PT) <!-- id: 1 -->
- [ ] Update `i18n.ts` with new keys (fr-FR, es-ES, de-DE) <!-- id: 9 -->
- [x] Refactor `Settings.tsx` to use `t()` for all text <!-- id: 2 -->

## Phase 2: Standardization (Enums)
- [x] Create `src/types/enums.ts` <!-- id: 3 -->
    - [x] Define `WorkOrderStatus`
    - [x] Define `InspectionStatus`
    - [x] Define `KPITrendColor` (for KPICard)
- [x] Refactor usages to use Enums (where applicable/easy) <!-- id: 4 -->

## Phase 3: Type Safety
- [x] Refactor `KPICard.tsx` <!-- id: 5 -->
    - [x] Remove `@ts-ignore` (partially, fixed types)
    - [x] Fix Chart data types
- [x] Refactor `inspectionService.ts` <!-- id: 6 -->
    - [x] Remove `any` types in `updateItemRecommendation`
    - [x] Remove `any` in `createEstimateFromInspection`
    - [x] Define strict interfaces for parameters

## Phase 4: Verification
- [x] Run `tsc` to verify no type errors <!-- id: 7 -->
- [x] Verify Settings page translations in browser <!-- id: 8 -->

## Phase 5: Empty States
- [x] Create `src/components/EmptyState.tsx` <!-- id: 10 -->
- [x] Implement EmptyState in `WorkOrders.tsx` (Kanban & List) <!-- id: 11 -->
- [x] Implement EmptyState in `Dashboard.tsx` (Active Jobs & Techs) <!-- id: 12 -->
- [x] Update `DataTable.tsx` to support custom Empty State <!-- id: 13 -->

## Phase 4: Empty States Expansion (Inventory, Customers, Vehicles)
- [ ] Implement EmptyState in `Inventory.tsx` <!-- id: 14 -->
- [ ] Implement EmptyState in `Customers.tsx` <!-- id: 15 -->
- [ ] Implement EmptyState in `Vehicles.tsx` <!-- id: 16 -->
- [ ] Implement EmptyState in `Technicians.tsx` <!-- id: 17 -->
- [ ] Add necessary i18n keys for new empty states <!-- id: 18 -->
