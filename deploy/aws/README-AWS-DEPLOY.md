# Voice2Law — AWS EC2 Deployment (FYP)

Deploy the full stack on **one EC2 instance** (recommended for FYP):

| Component | Port | Public? |
|-----------|------|---------|
| React build (nginx) | 80 / 443 | Yes |
| Express backend | 5000 | No — nginx proxies `/api` only |
| FastAPI NLP + Chroma RAG | 8001 | No — `127.0.0.1` only |

**Region:** `eu-north-1` (Stockholm) is fine. Steps are the same in any region.

**Instance:** `t3.large` (2 vCPU, 8 GB RAM), Ubuntu 22.04 LTS.

---

## Before you start

1. **Do NOT zip the whole project folder** and upload it. The repo is large (node_modules, venv, etc.). **Git clone on the EC2** instead.
2. **Chroma vector DB** (`nlp-service/data/chroma/`) is **gitignored**. Copy it separately from your laptop via `scp` after cloning.
3. Push your latest code to GitHub/GitLab so EC2 can `git clone`.
4. Have ready: Google OAuth Web client ID, Hugging Face token, optional Firebase service account JSON.

---

## Part 1 — AWS Console (EC2 + networking)

### 1. Launch EC2 instance

1. AWS Console → **EC2** → **Launch instance**
2. **Name:** `voice2law`
3. **AMI:** Ubuntu Server 22.04 LTS (64-bit x86)
4. **Instance type:** `t3.large`
5. **Key pair:** Create or select one (download `.pem` — you need it for SSH)
6. **Network settings → Security group** (create new):
   - **SSH (22)** — Source: **My IP** only (not `0.0.0.0/0`)
   - **HTTP (80)** — Source: `0.0.0.0/0`
   - **HTTPS (443)** — Source: `0.0.0.0/0`
   - **Do NOT** open ports **5000** or **8001** to the internet
7. **Storage:** 30–50 GB gp3 (Chroma + Python deps need space)
8. Click **Launch instance**

### 2. Elastic IP (recommended)

A reboot changes the public IP and breaks Google OAuth origins.

1. EC2 → **Elastic IPs** → **Allocate Elastic IP address** → Allocate
2. Select the new IP → **Actions** → **Associate Elastic IP address**
3. Choose your `voice2law` instance → Associate
4. Note this IP — use it as `YOUR_DOMAIN_OR_IP` until you add a real domain

### 3. SSH into the instance

From your laptop (PowerShell / terminal):

```bash
chmod 400 voice2law-key.pem          # Linux/macOS only
ssh -i voice2law-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

## Part 2 — Server bootstrap

On the EC2 instance:

```bash
git clone https://github.com/YOUR_USER/final-fyp-main.git /home/ubuntu/voice2law
cd /home/ubuntu/voice2law
chmod +x deploy/aws/setup-ec2.sh
./deploy/aws/setup-ec2.sh
```

---

## Part 3 — Clone, env files, Chroma data

### Environment files

```bash
cd /home/ubuntu/voice2law
cp deploy/aws/.env.production.example /tmp/v2l-env-reference.txt   # reference only

# Create three real .env files (edit placeholders!)
nano .env                    # frontend — VITE_* vars
nano backend/.env
nano nlp-service/.env
```

**Critical — build-time frontend URL:**

```bash
# In .env at repo root BEFORE npm run build:
VITE_API_URL=https://YOUR_ELASTIC_IP_OR_DOMAIN/api
```

Use `https://` only after you enable HTTPS (certbot). For first test with HTTP only, use:

```bash
VITE_API_URL=http://YOUR_ELASTIC_IP/api
```

Generate JWT secret on EC2:

```bash
openssl rand -base64 32
# paste into backend/.env as JWT_SECRET=
```

### Copy Chroma from your laptop (one-time)

On **your laptop** (not EC2), from the project folder:

```bash
scp -i voice2law-key.pem -r nlp-service/data/chroma ubuntu@YOUR_ELASTIC_IP:/home/ubuntu/voice2law/nlp-service/data/
```

If `data/` does not exist on EC2 yet:

```bash
ssh -i voice2law-key.pem ubuntu@YOUR_ELASTIC_IP "mkdir -p /home/ubuntu/voice2law/nlp-service/data"
```

### Optional: Firebase service account

```bash
scp -i voice2law-key.pem backend/service-account.json ubuntu@YOUR_ELASTIC_IP:/home/ubuntu/voice2law/backend/
```

---

## Part 4 — Install dependencies & build

```bash
cd /home/ubuntu/voice2law

# Frontend
npm ci
npm run build          # outputs to build/ — needs .env with VITE_API_URL set first

# Backend
cd backend && npm ci && cd ..

# NLP Python venv
cd nlp-service
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ..
```

First NLP start downloads embedding models (~400 MB) — allow a few minutes.

---

## Part 5 — PM2 (backend + NLP)

```bash
cd /home/ubuntu/voice2law
pm2 start deploy/aws/ecosystem.config.cjs
pm2 status
pm2 logs                          # Ctrl+C to exit

# Persist across reboot
pm2 save
pm2 startup
# Run the sudo command PM2 prints, then:
pm2 save
```

Quick health checks (on EC2):

```bash
curl -s http://127.0.0.1:5000/api/health
curl -s http://127.0.0.1:8001/health
```

---

## Part 6 — nginx (serve frontend + proxy API)

```bash
sudo cp /home/ubuntu/voice2law/deploy/aws/nginx-voice2law.conf /etc/nginx/sites-available/voice2law
sudo ln -sf /etc/nginx/sites-available/voice2law /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
```

Open in browser: `http://YOUR_ELASTIC_IP`

---

## Part 7 — Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your **OAuth 2.0 Web client**
2. **Authorized JavaScript origins** — add:
   - `http://YOUR_ELASTIC_IP` (or `https://your-domain.com` after HTTPS)
3. **Authorized redirect URIs** — usually not needed for GIS button flow; add origin if Google asks
4. If app is in **Testing**, add your Gmail under **OAuth consent screen → Test users**
5. Use the **same** Web client ID in:
   - `.env` → `VITE_GOOGLE_CLIENT_ID`
   - `backend/.env` → `GOOGLE_CLIENT_ID`
6. Rebuild frontend after changing `.env`: `npm run build`

---

## Part 8 — HTTPS (optional but recommended)

Requires a domain pointing to your Elastic IP (Route 53 A record or your registrar).

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Then update:

- `.env` → `VITE_API_URL=https://your-domain.com/api`
- `backend/.env` → `CLIENT_URL=https://your-domain.com`
- Google OAuth origins → add `https://your-domain.com`
- Rebuild: `npm run build`
- Reload nginx: `sudo systemctl reload nginx`

---

## Updating after code changes

```bash
cd /home/ubuntu/voice2law
git pull
npm ci && npm run build
cd backend && npm ci && cd ..
cd nlp-service && source venv/bin/activate && pip install -r requirements.txt && deactivate && cd ..
pm2 restart all
```

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Blank page / 502 | `pm2 status`, `pm2 logs`, `sudo nginx -t` |
| Google sign-in fails | Origins match exact URL (http vs https, no trailing slash) |
| RAG returns empty | Chroma copied? `ls nlp-service/data/chroma/` |
| NLP slow on first ask | Embedding model cold start; wait 2–5 min |
| CORS errors | `CLIENT_URL` in `backend/.env` matches browser URL |
| Out of memory | `free -h` — t3.large should be enough; restart NLP if OOM |

### Useful commands

```bash
pm2 logs voice2law-backend --lines 50
pm2 logs voice2law-nlp --lines 50
sudo tail -f /var/log/nginx/error.log
```

---

## Files in this folder

| File | Purpose |
|------|---------|
| `README-AWS-DEPLOY.md` | This guide |
| `setup-ec2.sh` | One-time Ubuntu bootstrap |
| `ecosystem.config.cjs` | PM2 config (backend + NLP) |
| `nginx-voice2law.conf` | nginx: `build/` + `/api` proxy |
| `.env.production.example` | Production env snippets |

---

## Architecture diagram

```
Internet
   │
   ▼
[Security Group: 22 (your IP), 80, 443]
   │
   ▼
┌──────────────────────────────────────┐
│  EC2 t3.large — Ubuntu 22.04         │
│                                      │
│  nginx :80/:443                      │
│    ├─ /        → build/ (React)      │
│    └─ /api/    → 127.0.0.1:5000      │
│                                      │
│  pm2: voice2law-backend  :5000       │
│  pm2: voice2law-nlp      :8001       │
│         (127.0.0.1 only)             │
│         └─ Chroma RAG data/chroma    │
└──────────────────────────────────────┘
```
