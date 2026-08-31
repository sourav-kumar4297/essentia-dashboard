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
4. Set `RESEND_FROM` to an address **on that verified domain**  
   - Example: `RESEND_FROM="Essentia <noreply@essentia.in>"`  
   - `onboarding@resend.dev` can only send to your own Resend account email  
5. Set `AUTH_SECRET` to any long random string (signs login JWTs)

Login is **email OTP**. Any valid email can request a code for testing.

Resend’s free sandbox can only deliver to **your Resend account email** until you verify a domain. If delivery fails and `ALLOW_DEV_OTP=true`, the code is shown on the login screen.

## Local setup

```bash
cp .env.example .env
# edit .env → DATABASE_URL + RESEND_API_KEY

npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Seed: first successful OTP login creates the user. `souravkumar4297@gmail.com` is Super Admin. Other emails start as MEMBER.

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
