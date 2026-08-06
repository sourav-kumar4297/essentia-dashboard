# Step-by-step: Neon Postgres (free)

Do this once. Takes ~5 minutes.

## 1. Create account
1. Open https://console.neon.tech
2. Sign up with Google / GitHub / email (free)

## 2. Create a project
1. Click **Create a project**
2. **Project name:** `bd-portal` (anything)
3. **Postgres version:** leave default
4. **Region:** pick closest (e.g. Singapore / Mumbai if shown)
5. Click **Create project**

## 3. Copy the connection string
1. On the project home / dashboard, find **Connection string**
2. Choose **Prisma** in the dropdown (or **Connection string** format)
3. Make sure it looks like:

```
postgresql://neondb_owner:xxxxx@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

4. Click **Copy**

> Tip: If you see “pooled” vs “direct”, for Prisma migrate use the **direct** (non-pooler) URL if offered. Runtime can use pooled later.

## 4. Put it in this project
1. In the repo root `F:\essentia-portfolio`, open or create `.env`
2. Paste:

```env
DATABASE_URL="postgresql://PASTE_YOUR_NEON_URL_HERE"
RESEND_API_KEY=""
RESEND_FROM="BD Portal <onboarding@resend.dev>"
ALLOW_DEV_OTP="true"
```

3. Save the file

## 5. Create tables + seed data
From the project folder in terminal:

```bash
npx prisma migrate deploy
npx prisma db seed
```

You should see seeded emails:
- `admin@essentia.local`
- `ops@essentia.local`
- `bd@essentia.local`

## 6. Confirm it worked
Optional — open Neon → **Tables** / SQL Editor → you should see `User`, `Lead`, `Session`, etc.

---

## Next: Resend (OTP email) — brief
1. https://resend.com → Sign up  
2. **API Keys → Create** → copy `re_...`  
3. Add to `.env`: `RESEND_API_KEY="re_..."`  
4. Set `ALLOW_DEV_OTP="false"` when email works  
5. Restart `npm run dev`

Until Resend is ready, leave `ALLOW_DEV_OTP="true"` — OTP still shows on the login screen.
