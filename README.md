# DealRadar — Deployment Guide

## What you have
- `public/index.html` — the full frontend
- `api/search.js` — the backend (calls Anthropic AI + web search securely)
- `vercel.json` — Vercel routing config
- `package.json` — project info

---

## Deploy in 15 minutes (free)

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up (free)
3. Click **API Keys** → **Create Key**
4. Copy it — looks like `sk-ant-api03-...`
5. Add a payment method (you pay per search, roughly $0.01–0.03 each)

### Step 2 — Put your code on GitHub
1. Go to https://github.com and sign up (free)
2. Click **New repository** → name it `dealradar` → Create
3. Upload ALL these files keeping the same folder structure:
   ```
   dealradar/
   ├── api/
   │   └── search.js
   ├── public/
   │   └── index.html
   ├── package.json
   └── vercel.json
   ```

### Step 3 — Deploy to Vercel (free hosting)
1. Go to https://vercel.com → sign up with GitHub
2. Click **Add New Project** → import your `dealradar` repo
3. Click **Deploy** (no settings to change)
4. Wait ~60 seconds — it deploys automatically

### Step 4 — Add your API key
1. In Vercel dashboard, go to your project → **Settings** → **Environment Variables**
2. Click **Add New**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: paste your key (`sk-ant-api03-...`)
3. Click **Save**
4. Go to **Deployments** → click the three dots → **Redeploy**

### Step 5 — Done! 🎉
Your site is live at `https://dealradar-xxx.vercel.app`

---

## Get a custom domain (optional, ~$10/year)
1. Buy `dealradar.com` (or similar) at https://namecheap.com
2. In Vercel → **Settings** → **Domains** → add your domain
3. Follow the DNS instructions Vercel gives you
4. Done — live on your own domain in minutes

---

## How to make money (affiliate links)

The app already shows a "View deal" button that opens store pages.
To earn commission from these clicks:

1. **Amazon Associates** — https://affiliate-program.amazon.com
   - Free to join, earn 1–10% per sale
   - Get your tracking ID (looks like `yourname-20`)

2. **Walmart Affiliates** — https://affiliates.walmart.com
   - Free to join, earn 1–4%

3. **CJ Affiliate** — https://cj.com
   - Connects you to 1000s of stores at once

Once approved, the AI already generates real URLs — you can add your
affiliate tag to Amazon URLs by appending `?tag=YOURTAG-20`

---

## Estimated costs

| Usage | Monthly Anthropic cost |
|-------|----------------------|
| 100 searches/day | ~$3–9/month |
| 1,000 searches/day | ~$30–90/month |
| 10,000 searches/day | ~$300–900/month |

Vercel hosting is free up to 100GB bandwidth/month.

At $0.50 per search (charged to users), 1,000 searches/day = $15,000/month revenue.
Or go free + earn via affiliate commissions instead.

---

## Need help?
The code is fully self-contained. If anything breaks, check:
1. Vercel logs: Dashboard → your project → **Functions** tab
2. Make sure `ANTHROPIC_API_KEY` env variable is set and redeployed
