# Quick Start: Manual Feature Testing

**Status**: All systems ready for testing
**Build**: ✅ Passing
**Date**: July 9, 2026

---

## Setup (2 minutes)

### 1. Start Development Server

```bash
npm run dev
```

Wait for:
```
✓ built in Xs
→ Local:    http://localhost:5173
```

### 2. Open Browser

Navigate to: **http://localhost:5173**

### 3. Login

- **Email**: `browserverify@test.com`
- **Password**: `Verify123!`

You should see the dashboard with stats.

---

## 10-Minute Test Loop

### Test 1: Dashboard (1 min)
**Expected**: Dashboard loads with 4 stat cards

1. Dashboard should display:
   - Net Worth card (total, breakdown)
   - Recent transactions
   - Activity feed
   - Stats overview

**Check**: No errors in browser console

---

### Test 2: Wallet → Stakes (2 min)
**Expected**: Stake DOT and earn rewards

1. Go to **Wallet** (bottom nav)
2. Click **Stakes** tab
3. Enter amount: `500` (DOT)
4. Click **Stake**
5. Check active stakes list
6. Verify 12% APY displays
7. **Leave here for other tests** (need time to accrue rewards)

**Check**: Stake appears in list with correct amount and "Active" status

---

### Test 3: Pitch Deck (1 min)
**Expected**: Create and manage pitch decks

1. Go to **Pitch Deck** (left nav)
2. Click **Create Deck**
3. Enter:
   - Title: "Test Pitch"
   - URL: "https://example.com/slide.pdf"
4. Click **Save**
5. Verify deck appears in list
6. Click **Share** → verify copy works
7. Click **Edit** → make a change → save
8. Click **Delete** → confirm

**Check**: Deck CRUD operations work

---

### Test 4: Analytics (1 min)
**Expected**: View analytics with charts

1. Go to **Analytics** (left nav)
2. Check all stats load:
   - Views
   - Vouches
   - Investments
   - Wallet
   - Ventures
3. Click **30 days** → chart updates
4. Check activity feed

**Check**: No console errors, charts render

---

### Test 5: Meetings (1 min)
**Expected**: Schedule meetings

1. Go to **Meetings** (left nav)
2. Check if there are available slots
3. If available, click **Request Meeting**
4. Fill form and submit
5. Verify meeting appears in list

**Check**: Form submits without errors

---

### Test 6: Dividends (1 min)
**Expected**: View dividend history in portfolio

1. Go to **Portfolio** (left nav)
2. Scroll down to **Dividend Income** section
3. If dividends exist, verify they display:
   - Venture name
   - Amount
   - Date

**Check**: No errors, data displays correctly

---

### Test 7: Admin Dashboard (1 min)
**Expected**: Admin features work (if user is admin)

1. Go to **Operator** (left nav, if visible)
2. Search for a user
3. Click to view details
4. Try to ban user (requires reason)
5. Verify confirmation dialog

**Check**: Search works, details modal opens

---

### Test 8: Back to Stakes → Claim (1 min)
**Expected**: Claim accrued rewards

1. Go back to **Wallet** → **Stakes** tab
2. Check if **Claim** button is enabled
3. Click **Claim** (if enabled)
4. Verify confirmation toast
5. Check balance updated

**Check**: Rewards claimed successfully

---

## 5-Minute Edge Cases

### Edge Case 1: Insufficient Balance
1. Go to **Wallet** → **Stakes**
2. Try to stake more than available balance
3. Should show error: "Insufficient balance"

**Expected**: ✅ Error message displays

---

### Edge Case 2: Empty States
1. Go to **Analytics** if you have no data
2. Should show placeholder or empty message
3. Try **Meetings** if no meetings exist
4. Should show: "No meetings scheduled"

**Expected**: ✅ Graceful empty state

---

### Edge Case 3: Copy to Clipboard
1. Go to **Pitch Deck**
2. Click **Share** on any deck
3. Try to paste in text editor
4. Should contain deck URL

**Expected**: ✅ URL copied to clipboard

---

## Troubleshooting

### Issue: "Session expired" Error
**Solution**: 
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Login again

### Issue: Stats show "0"
**Solution**:
1. Might be test data issue
2. Check browser console for errors
3. Try different user (if available)

### Issue: Claim button disabled
**Solution**:
1. Rewards need time to accrue (stakes need 1+ day)
2. Must wait 14+ days to complete unbond
3. This is expected behavior

### Issue: "Cannot read property 'data' of undefined"
**Solution**:
- This means API response format changed
- Check browser console Network tab
- Check what API endpoint returned
- Report error with endpoint name and response

---

## Success Criteria

All tests pass if:

- [x] Dashboard loads without errors
- [x] Stake creation succeeds
- [x] Pitch deck CRUD works
- [x] Analytics displays data
- [x] Meetings page loads
- [x] Portfolio shows dividends (if any)
- [x] Admin dashboard accessible (if admin)
- [x] Reward claiming works
- [x] No console errors
- [x] No ".data" errors

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Check build
npm run build

# Check for errors
npm run lint

# Format code
npm run format
```

---

## Test Results Template

Copy and fill this out:

```
Testing Results — [DATE]
========================

User: browserverify@test.com
Build: ✅ Passing
Dev Server: ✅ Running

Dashboard:         [ ] Working
Wallet:            [ ] Working
Stakes:            [ ] Working
Pitch Decks:       [ ] Working
Analytics:         [ ] Working
Meetings:          [ ] Working
Dividends:         [ ] Working
Admin (if admin):  [ ] Working
Reward Claiming:   [ ] Working

Edge Cases:
- Insufficient balance:  [ ] Handled correctly
- Empty states:          [ ] Display correctly
- Copy to clipboard:     [ ] Works

Console Errors: [ ] None

Overall Status: [ ] All Passing / [ ] Issues Found

Issues Found:
(list any problems here)
```

---

## Next Steps

If all tests pass:
1. Mark checklist complete
2. Push branch when ready: `git push`
3. Create PR for review
4. Merge to main after approval

If issues found:
1. Document the issue with:
   - What page/feature
   - What you did
   - What error you saw
   - Browser console error (if any)
2. Check `.hermes/AUDIT-COMPLETION-REPORT.md` for known info
3. Create bug report with details

---

**Time Estimate**: 10 minutes for full test
**Difficulty**: Easy (no coding required)
**Coverage**: 8 major features + edge cases

Good luck! 🚀
