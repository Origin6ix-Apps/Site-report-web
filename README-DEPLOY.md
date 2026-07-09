# Deploying Workforge

A Next.js web app connected to Supabase (database, auth, photo storage) and Claude (AI report generation).

---

## Two setup paths — pick one

**A) Brand-new Supabase project (never deployed this before)**
Run only `supabase/schema_master.sql` — one file, does everything.

**B) You already have a Supabase project from earlier setup**
Run only `supabase/schema_v6_final.sql` — it just adds what's new (phone numbers, deadlines, Materials, Daily Logs) without touching anything that already works.

Either way: SQL Editor → New query → paste the file's contents → Run.

---

## Step 1 — Supabase

1. [supabase.com](https://supabase.com) → New project → wait ~2 min to provision.
2. SQL Editor → run the ONE file from above that matches your situation.
3. Project Settings → API → copy three values you'll need in Step 3:
   - Project URL
   - anon public key
   - service_role key (click "Reveal" — keep this secret)
4. Authentication → Providers → Email → turn OFF "Confirm email" (faster testing; turn back on later if you want it).

---

## Step 2 — Claude API key

1. [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys → Create Key.
2. Add a small amount of billing credit.

---

## Step 3 — Push code to GitHub

Use GitHub Desktop: clone your repo, copy all these files into that folder (keeping the exact folder structure), commit, push.

---

## Step 4 — Vercel

1. [vercel.com](https://vercel.com) → sign in with GitHub → Add New → Project → import your repo.
2. Before deploying, add these four Environment Variables:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
   | `ANTHROPIC_API_KEY` | your Claude API key |

3. Deploy. Root Directory should be blank (`./`) unless your repo has an extra wrapper folder.

---

## Step 5 — Create your first Manager account

This is the one manual step, every time you set up fresh:

1. Open your live app → choose any portal → "Create an account" → sign up with your own email.
2. Go to Supabase → Table Editor → `profiles` table.
3. Find your new row, click into the `role` cell, change it to `manager`.
4. Log out and back in through the **Manager** portal.
5. From the Manager dashboard's **Users** tab, assign roles (Admin, Supervisor) to everyone else who signs up from here on — no more manual database editing needed.

---

## How the app works, in short

- **Login is portal-first**: pick Manager, Admin, or Supervisor, then sign in. An account only gets into a portal that matches its assigned role (Managers can enter any of the three).
- **Signup never grants access automatically** — new accounts sit as "Pending" until an Admin or Manager assigns them a role.
- **Admin** creates projects (with deadline, point of contact), assigns Supervisors, adds/removes Employees, sets completion %, views attendance.
- **Supervisor** sees only their assigned projects: updates completion %, adds crew, marks attendance, logs Materials (stock used/required), and posts Daily Logs (text + up to 8 photos, each viewable/printable as a PDF).
- **Manager** sees everything: click any project box to open a full detail view (team, attendance, materials, daily logs, supervisor contact info) — and assigns any role, including promoting people to Admin.
- The original AI-generated report feature (photos + voice note → structured report) is still there too, reachable from a Supervisor's project card as "Full AI daily report" — separate from the simpler Daily Log tab.

---

## Known limitations at pilot stage

- The AI report-generation endpoint (`app/api/generate-report/route.js`) doesn't verify the caller owns the project it's posting to — fine for a small trusted team, worth locking down before a public rollout.
- Costs: Supabase and Vercel are free at this scale. Claude API usage is a few cents per generated report.

---

## If something breaks

Come back with which step you were on and the exact error message (screenshot is great) — happy to debug it with you.
