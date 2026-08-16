# HubSpot Service Key — full CRM read + write

On **Create a service key**, enable the scopes below for broad CRM access.

> HubSpot only lets you grant scopes **your user already has**.  
> You need a HubSpot user with CRM edit rights (Super Admin / Sales access).

---

## Recommended scopes (contacts + companies + deals)

### Contacts (required for our lead sync)
- [x] `crm.objects.contacts.read`
- [x] `crm.objects.contacts.write`

### Companies
- [x] `crm.objects.companies.read`
- [x] `crm.objects.companies.write`

### Deals
- [x] `crm.objects.deals.read`
- [x] `crm.objects.deals.write`

### Properties / schemas (helps custom fields)
- [x] `crm.schemas.contacts.read`
- [x] `crm.schemas.contacts.write`
- [x] `crm.schemas.companies.read`
- [x] `crm.schemas.companies.write`
- [x] `crm.schemas.deals.read`
- [x] `crm.schemas.deals.write`

### Optional (enable if you use them in HubSpot)
- [ ] `crm.objects.owners.read` — who owns the contact
- [ ] `crm.objects.quotes.read` / `write`
- [ ] `crm.objects.line_items.read` / `write`
- [ ] `tickets` / `crm.objects.tickets.read` / `write` — if you use Service Hub tickets
- [ ] `sales-email-read` — email engagement (if available on your plan)

---

## Steps

1. Click **Use Service Keys instead** (skip legacy private app)
2. **Create a service key** → name: `BD Portal full CRM`
3. Tick **all scopes above** you need (at least contacts + companies + deals read/write)
4. Create → **Show** → **Copy**
5. Paste into `.env`:

```env
HUBSPOT_ACCESS_TOKEN="pat-xxxxx"
```

6. Restart `npm run dev`
7. Admin → **Settings** → **Pull latest** (or wait for the daily 2:00 AM IST cron)

On Vercel, set `HUBSPOT_ACCESS_TOKEN` and `CRON_SECRET`. Opening All Leads / Dashboard pulls HubSpot (new + updated contacts) and repeats every minute while the page is open. Dates shown are HubSpot `createdate`. Daily cron at `/api/hubspot/cron` is a backup.

---

## What our app does today
| Direction | Status |
|-----------|--------|
| HubSpot → Dashboard (contacts) | **Daily cron** + Settings “Pull latest” |
| Dashboard → HubSpot (create/update) | **Not built yet** — key will be ready when we add it |

If you want **write-back** (new portal leads push to HubSpot), say so and we’ll add that next.
