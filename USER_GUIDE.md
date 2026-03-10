# ACFC App User Guide

This guide is for day-to-day users of the ACFC app.

## 1) Open the app
1. Open your browser and go to your ACFC URL.
2. On the home page, choose your role:
   - Conducting Officer
   - Commanders
   - Soldiers

---

## 2) Conducting Officer flow
Use this role to create a session and monitor progress.

### A. Create a session
1. Click **Conducting Officer**.
2. Fill in:
   - Unit
   - Coy
   - Test Date
   - Session Code
   - Password
3. Click **Create**.

### B. Share login details
Share the **Session Code** with:
- Soldiers (to enter details)
- Commanders (to log in with password)

Share the **Password** with commanders only.

### C. View live dashboard and export
1. Go to Conducting Officer Dashboard.
2. Monitor progress by Detail Level and station completion bars.
3. Click **Export Session CSV** to download the session report.

---

## 3) Soldier flow
Use this role to submit individual soldier details.

1. Click **Soldiers**.
2. Enter **Session Code** and continue.
3. Complete all required fields:
   - NRIC
   - Full Name
   - Rank
   - Unit
   - Coy
   - Platoon
   - Detail Level
4. Click **Submit**.
5. Confirm the success message appears.

Notes:
- Text-entry fields are auto-normalized to uppercase.
- Detail Level is selected from a dropdown.

---

## 4) Commander flow
Use this role to enter station scores.

1. Click **Commanders**.
2. Enter:
   - Session Code
   - Password
   - Assigned Station (WBT / RIR / MCS)
3. Click **Log In**.
4. In dashboard rows, enter scores for your assigned station only.
5. Click the matching save button:
   - **Save WBT**
   - **Save RIR**
   - **Save MCS**
6. Confirm the success toast: **Scores recorded successfully.**

Notes:
- WBT and RIR allow 0–100 or DNF.
- MCS Level allows 1–16 or DNF.
- MCS Stage options depend on selected MCS Level.

---

## 5) CSV export format
The exported CSV columns are in this order:

1. TEST_DATE
2. NRIC
3. PLATOON
4. UNIT
5. COY
6. RANK
7. NAME
8. WBT
9. RIR
10. MCS_LEVEL
11. MCS_STAGE

Filename format:

`<UNIT>_<COY>_<DATE>_ACFC.csv`

---

## 6) Quick troubleshooting

### "Session code not found"
- Check for typing errors.
- Confirm session was created by Conducting Officer.

### "Invalid password"
- Reconfirm commander password.
- Ensure correct session code is used.

### No rows to save in commander dashboard
- Ensure scores are selected/entered before saving.

### UI looks outdated after changes
- Hard refresh the page (`Ctrl+F5`) or open in Incognito.

---

## 7) Best practice on operation day
1. Conducting Officer creates one session and confirms dashboard access.
2. Soldiers complete details first.
3. Commanders enter station scores in parallel by assigned station.
4. Conducting Officer verifies progress bars and exports final CSV.
