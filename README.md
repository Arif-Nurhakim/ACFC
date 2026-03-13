# ACFC Fitness Test Submission App

This app now uses a role-based process from a home page:
- Conducting Officer creates session (Unit, Coy, Test Date, Session Code, Password)
- Conducting Officer uploads pre-templated detail sheet (.xlsx)
- Commander logs in with Session Code + Password
- Commander selects assigned station during login (`WBT`, `RIR`, or `MCS`)
- Commander views soldiers grouped by Detail Level in dropdown sections
- Commander enters WBT, RIR, MCS Stage and MCS Level for each soldier row
- Commander can save scores by station (`Save WBT`, `Save RIR`, `Save MCS`) so each station commits independently
- Previously saved station scores remain visible to subsequent commanders/stations
- Conducting Officer has a read-only live dashboard with all soldiers and scores
- Export session CSV is centralized on Conducting Officer dashboard only
- Conducting Officer dashboard auto-refreshes to reflect soldier and commander updates
- Reupload approach is clean replace: clear imported details first, then upload corrected sheet

## Input Rules
- Session Code and Password must both be unique across conducts; reuse prompts officer to change details.
- Imported Detail Level is restricted to integer values from 1 to 20.
- Required detail-sheet columns: `NRIC`, `NAME`, `RANK`, `UNIT`, `COY`, `PLATOON`, `DETAIL_LEVEL`
- Commander station score dropdown rules:
   - WBT: 0 to 100 or DNF
   - RIR: 0 to 100 or DNF
   - MCS Level: 1 to 16 or DNF
   - MCS Stage: constrained by selected MCS Level (or DNF)

## MCS Level to Stage Mapping
- 1 → 0
- 2 → 0
- 3 → 0
- 4 → 1
- 5 → 1-2
- 6 → 1-2
- 7 → 1-4
- 8 → 1-6
- 9 → 1-8
- 10 → 1-8
- 11 → 1-10
- 12 → 1-12
- 13 → 1-14
- 14 → 1-12
- 15 → 1-9
- 16 → 1-2

Existing CSV/report APIs from the earlier MVP are still available.

## User Guide
- End-user walkthrough: see [USER_GUIDE.md](USER_GUIDE.md)

## Stack
- FastAPI backend
- SQLite storage
- Plain HTML/CSS/JS frontend

## Run
1. Create and activate a virtual environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Start the app:
   - `uvicorn main:app --reload`
4. Open:
   - `http://127.0.0.1:8000`

## Go Live (Public Internet)

This app can be deployed publicly and mapped to a domain like `acfc.app` or `acfc.com`.

### Option A: Render (quickest)
1. Push this repo to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Render will detect `render.yaml` automatically.
4. Set `APP_BASE_URL` in Render environment variables to your final HTTPS URL.
5. Deploy.

### Add custom domain (`acfc.app` / `acfc.com`)
1. Buy domain from a registrar (Cloudflare, Namecheap, GoDaddy, etc.).
2. In Render service settings, add custom domain (e.g. `www.acfc.app`).
3. Add DNS records at registrar exactly as Render instructs (CNAME/A records).
4. Wait for DNS propagation and TLS certificate issuance.
5. Update `APP_BASE_URL` to the final domain URL (e.g. `https://www.acfc.app`).

### Option B: Docker deploy (any cloud)
- `Dockerfile` is included for deployment to platforms that support containers (Fly.io, Railway, VPS, Azure, etc.).

## Pages
- `/` → home role selection
- `/conducting-officer` → create session
- `/api/officer/import-template` → download detail-sheet template (.xlsx)
- `/commander/login` → commander login
- `/commander/dashboard` → grouped score entry

## Email (optional)
Set environment variables:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Optional base URL:
- `APP_BASE_URL`

You can copy `.env.example` values into your environment setup.
