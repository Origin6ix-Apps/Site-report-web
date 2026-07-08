# Deploying Site Report AI

This is a real Next.js web app connected to Supabase (database, auth, photo storage) and Claude (AI report generation). No local coding needed — you'll create two free accounts and click through a few forms.

Total time: ~30-40 minutes the first time.

---

## Step 1 — Create a Supabase project (database + login + photo storage)

1. Go to [supabase.com](https://supabase.com) → sign up → **New project**.
2. Pick any name/region, set a database password (save it somewhere), wait ~2 minutes for it to provision.
3. Once it's ready, go to **SQL Editor** → **New query**.
4. Open the file `supabase/schema.sql` from this folder, copy all of it, paste into the SQL editor, click **Run**.
   This creates your tables, security rules, and the photo storage bucket in one shot.
5. Go to **Project Settings → API**. You'll need three values from this page in Step 3:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "Reveal" — keep this one secret, never share it)

---

## Step 2 — Get a Claude API key

1. Go to [console.anthropic.com](https://console.anthropic.com) → sign up if needed.
2. **Settings → API Keys → Create Key**. Copy it (starts with `sk-ant-...`).
3. Add a small amount of billing credit — a few dollars covers hundreds of test reports.

---

## Step 3 — Put the code on GitHub

1. Go to [github.com](https://github.com) → sign up if needed → **New repository** → name it `site-report-web` → **Create repository**.
2. On the new repo's page, click **uploading an existing file**.
3. Drag in every file and folder from this project (keep the folder structure intact).
4. Scroll down, click **Commit changes**.

*(If you're comfortable with GitHub Desktop instead, that works too — same result.)*

---

## Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up using your GitHub account (this links them automatically).
2. Click **Add New → Project**, select your `site-report-web` repo, click **Import**.
3. Before clicking Deploy, open **Environment Variables** and add these four, using the values from Steps 1 and 2:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
   | `ANTHROPIC_API_KEY` | your Claude API key |

4. Click **Deploy**. Wait ~2 minutes.
5. Vercel gives you a live URL like `site-report-web.vercel.app` — that's your real app.

---

## Step 5 — Test it

1. Open your new URL, create an account (any email + password), sign in.
2. Create a project, go into it, tap **New report**.
3. Upload 1-2 photos, type or speak a quick note, tap **Generate daily report**.
4. It should return a structured report in ~10-20 seconds.
5. Back on the Projects page, click **Owner view** on your project — that link is what you send to a client. It needs no login.

---

## Sharing with a client (this is your pilot pitch)

Every project has an **Owner view** link (a long URL with a unique code). Anyone with that link can see all daily reports for that project — no account required. That's the link you text or email your pilot client.

---

## Known limitations at pilot stage (fix before wider rollout)

- **Anyone who knows a project's ID could, in theory, submit a report to it** via the API — the report-generation endpoint doesn't yet check that the caller is logged in as that project's owner. Fine for a handful of trusted pilot users; before opening this up publicly, add a login check to `app/api/generate-report/route.js`.
- **Email confirmation:** by default, Supabase may require users to click a confirmation email before signing in. You can turn this off for faster pilot testing under **Authentication → Providers → Email → Confirm email**.
- **Costs:** Supabase and Vercel are free at this scale. Claude API costs are usage-based — roughly a few cents per generated report depending on photo count.

---

## If something breaks

Come back with:
1. Which step you were on
2. The exact error message (screenshot is great)

and I'll help you debug it directly.
