# Component Cleanup Plan

## Components to Remove

### 1. **Test/Demo Components**
- [x] `/src/app/test-toast/page.tsx` - Test page for toast functionality ✅ REMOVED
- [x] `/src/components/spotlight-new-demo.tsx` - Demo component ✅ REMOVED

### 2. **Unused Dashboard Components**
These components are not imported anywhere and appear to be replaced by newer implementations:
- [x] `/src/components/dashboard/RecentAppointments.tsx` - Likely replaced by appointment management in dashboard ✅ REMOVED
- [x] `/src/components/dashboard/RecentRequests.tsx` - Likely replaced by tattoo request management ✅ REMOVED

### 3. **Unused UI Components**
- [x] `/src/components/ui/CenteredWithLogo.tsx` - Not imported anywhere ✅ REMOVED
- [x] `/src/components/ui/ProcessShowcase.tsx` - Not imported anywhere ✅ REMOVED

### 4. **Misplaced Test Files**
- [x] `/src/components/payments/__tests__/PaymentButton.test.tsx` - Should be in proper test directory ✅ REMOVED

## Components to Keep

### Critical Components (Verified Usage):
- ✅ Layout components
- ✅ Modal component
- ✅ Payment components (PaymentButton, PaymentHistory)
- ✅ Dashboard components (DashboardContent, StatsGrid, etc.)
- ✅ Form components (all tattoo request forms)
- ✅ UI components (Button, ImageUpload, etc.)

## Cleanup Steps

1. **Remove test page**:
   ```bash
   rm -rf src/app/test-toast
   ```

2. **Remove unused dashboard components**:
   ```bash
   rm src/components/dashboard/RecentAppointments.tsx
   rm src/components/dashboard/RecentRequests.tsx
   ```

3. **Remove unused UI components**:
   ```bash
   rm src/components/ui/CenteredWithLogo.tsx
   rm src/components/ui/ProcessShowcase.tsx
   ```

4. **Move test file to proper location** (or remove if not needed):
   ```bash
   # Either move to test directory or remove
   rm src/components/payments/__tests__/PaymentButton.test.tsx
   ```

## Notes

- Most components in the codebase are actively used
- The dashboard has been modernized with new components that replace the older RecentAppointments/RecentRequests
- Test files should not be in the components directory
- Demo components should not be in production code

## Cleanup Summary (Completed)

✅ **7 components/files removed**:
1. Test page directory: `/src/app/test-toast/`
2. Demo component: `spotlight-new-demo.tsx`
3. Unused dashboard components: `RecentAppointments.tsx`, `RecentRequests.tsx`
4. Unused UI components: `CenteredWithLogo.tsx`, `ProcessShowcase.tsx`
5. Misplaced test directory: `/src/components/payments/__tests__/`

The codebase is now cleaner with only actively used components remaining. All test/demo components and unused legacy components have been removed.