# Job Application Automation Dashboard

## Overview

A full-stack dashboard that collects job openings from a Greenhouse-hosted
company career page, displays them for browsing/search, and uses headless
browser automation to fill out application forms with a dummy candidate
profile — stopping before final submission and capturing a screenshot as
proof the automation reached the review stage.

Built as an SDE Intern assessment project. **No real job applications are
ever submitted** — see "Important Note" below.

## Technology Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** lowdb (JSON file-based store) — `data/db.json`
- **Automation:** Playwright (Chromium, headless)
- **Data source:** Greenhouse Job Board public API

## Prerequisites

- Node.js 18+
- npm

## Installation

\`\`\`bash
git clone <your-repo-url>
cd job-automation-dashboard
npm install
npx playwright install chromium
\`\`\`

## Configuration

Copy the example env file and adjust if needed:

\`\`\`bash
cp .env.example .env.local
\`\`\`

The only required variable is `GREENHOUSE_BOARD_SLUG`, which determines
which company's Greenhouse board is scraped.

## How to Start the Application

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000`.

## How to Run the Scraper

The scraper runs on-demand via API route rather than a standalone script.
With the dev server running:

\`\`\`bash
curl -X POST http://localhost:3000/api/jobs/scrape
\`\`\`

This fetches 10–15 jobs from the configured Greenhouse board, maps them to
the internal schema, deduplicates by job ID, and saves them to `data/db.json`.
Re-running this replaces the current job list with a fresh scrape.

## How to Configure Candidate Data

Edit `data/candidate.json` directly. All fields are used by the automation's
field-mapping logic (`automation/fieldMapper.ts`) to fill known form fields.

Replace `data/resume.pdf` with any dummy PDF resume — the automation uploads
whatever file is at that path.

## How to Run Individual Application Automation

From the dashboard UI, click **Apply** on any job card. Behind the scenes
this calls:

\`\`\`
POST /api/applications/:jobId/apply
\`\`\`

which returns immediately and runs the automation in the background. The
dashboard polls `/api/applications/:jobId/status` every few seconds to show
live progress.

## How to Run Apply to All

Click **Apply to All** on the dashboard, or call:

\`\`\`
POST /api/applications/apply-all
\`\`\`

Jobs are processed **sequentially**, not in parallel, to keep resource usage
predictable. If one job fails (e.g. CAPTCHA, timeout, missing field), the
batch continues with the remaining jobs — a single failure never stops the
whole run. Progress is available at `GET /api/applications/progress`.

## Where Screenshots Are Stored

`screenshots/job_<jobId>.png` — captured at the final review/submit stage on
success.

`screenshots/job_<jobId>_failure.png` — captured as evidence when
automation fails partway through (e.g. CAPTCHA detected), where possible.

## Known Limitations

- Field mapping is label-based pattern matching; forms with highly
  non-standard field labels or complex custom screening questions may not
  be fully filled.
- CAPTCHA-protected forms are detected and marked `FAILED` rather than
  bypassed — by design, per the assessment's safety constraints.
- Apply-to-All runs sequentially; a full batch of 10–15 jobs can take
  several minutes.
- Status updates are polled (not pushed via websockets), so the UI may lag
  the true backend state by a few seconds.

## Important Note

**This project never submits a real job application.** The automation
explicitly stops at the final review stage, logs a safety-guard warning
instead of clicking the Submit button, and captures a screenshot as proof
of reaching that stage. See `guardAgainstSubmit()` in
`automation/applyToJob.ts`.
