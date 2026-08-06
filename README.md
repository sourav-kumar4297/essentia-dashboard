# Sales Management Portal

BD portal — lead capture to CRM handover.

## Free accounts you need (one-time)

### 1. Neon (Postgres DB) — free

1. Go to https://neon.tech and sign up  
2. Create a project (any name / region)  
3. Open **Dashboard → Connection details**  
4. Copy the **Prisma** connection string (`postgresql://...`)  
5. Paste into `.env` as `DATABASE_URL=...`

### 2. Resend (OTP emails) — free

1. Go to https://resend.com and sign up  
2. **API Keys → Create API Key** → copy `re_...`  
3. Paste into `.env` as `RESEND_API_KEY=...`  
4. Keep `RESEND_FROM="BD Portal <onboarding@resend.dev>"` for free testing  
   - Sandbox can send **to your own Resend account email** first  
   - Later: verify your domain in Resend → use `noreply@yourdomain.com`

## Local setup

```bash
cp .env.example .env
# edit .env → DATABASE_URL + RESEND_API_KEY

npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Seed accounts (after OTP arrives in email):

- Superadmin: `admin@essentia.local` — use a real email you control for OTP tests, or keep ALLOW_DEV_OTP
- Or sign up any email — first login creates a MEMBER user  
- Promote role in Neon SQL / Prisma Studio if needed

### Dev without Resend yet

```env
ALLOW_DEV_OTP=true
```

OTP is shown on the login screen until Resend is configured.

## Scripts

```bash
npm run db:migrate   # prisma migrate dev
npm run db:seed
npm run build
```
