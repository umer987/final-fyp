# Voice2Law on AWS

This is the simplest way to put the whole project online:

- one EC2 server
- one Nginx "front door"
- one React frontend build
- one Node backend process
- one Python NLP process

That is enough to run the app end to end without splitting it into multiple AWS services.

## What each part does

- `Nginx` serves the website and sends API requests to the right process.
- `Frontend` is the React/Vite app that users open in the browser.
- `Backend` is the Node/Express API on port `5000`.
- `NLP service` is the Python/FastAPI service on port `8001`.

The important wiring is:

- browser -> Nginx -> frontend files
- browser -> Nginx -> backend (`/api`)
- browser -> Nginx -> NLP (`/nlp`)
- backend -> NLP over localhost

## Recommended AWS setup

- EC2: Ubuntu 24.04 LTS
- Size: start with at least `t3.large` or `t3.xlarge`
- Security group:
  - allow `22` from your IP only
  - allow `80` from anywhere
  - allow `443` from anywhere
- Do not open `5000` or `8001` to the internet

## Files in this repo that matter

- `deploy/aws/nginx/voice2law.conf`
- `deploy/aws/systemd/voice2law-backend.service`
- `deploy/aws/systemd/voice2law-nlp.service`
- root `.env` for the frontend build
- `backend/.env` for the Node API
- `nlp-service/.env` for the Python NLP service

## 1. Install server packages

Run these on the EC2 server:

```bash
sudo apt update
sudo apt upgrade -y

sudo apt install -y \
  git curl nginx build-essential \
  python3 python3-venv python3-pip \
  tesseract-ocr poppler-utils ffmpeg \
  libgl1

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Put the project on the server

Use any folder you like. This guide assumes `/opt/voice2law`.

```bash
sudo mkdir -p /opt/voice2law
sudo chown $USER:$USER /opt/voice2law
cd /opt/voice2law
git clone <your-repo-url> .
```

If you are not using GitHub, just upload the project folder to `/opt/voice2law`.

## 3. Create the frontend env file

Create `/opt/voice2law/.env` with production values.

For a simple first launch:

```env
VITE_API_URL=/api
VITE_NLP_SERVICE_URL=/nlp
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_STT_ENGINE=webspeech
```

If you use Firebase on the frontend, add the Firebase web values too.

Important:

- `VITE_API_URL=/api` makes the browser talk to the same AWS domain.
- `VITE_NLP_SERVICE_URL=/nlp` makes browser audio fallback go through Nginx.
- `VITE_GOOGLE_CLIENT_ID` must match the same OAuth client used in Google Cloud.

## 4. Create the backend env file

Create `/etc/voice2law/backend.env`:

```env
PORT=5000
CLIENT_URL=https://your-domain.com
NLP_SERVICE_URL=http://127.0.0.1:8001
NLP_TIMEOUT_MS=45000
NLP_TTS_TIMEOUT_MS=120000
MAX_TTS_CHARS=1500
NLP_HEALTH_CACHE_MS=30000

GOOGLE_CLIENT_ID=your_google_client_id
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
ADMIN_EMAILS=admin@example.com

FIREBASE_SERVICE_ACCOUNT_PATH=/etc/voice2law/service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Notes:

- `CLIENT_URL` must be your real public site URL.
- `NLP_SERVICE_URL` stays internal on the same server.
- `OPENAI_API_KEY` is optional. Leave it blank if you want to rely on the NLP service.
- If you use both `www` and non-`www`, put both in `CLIENT_URL` separated by commas.
- If you want Firestore/admin features, copy your Firebase service account JSON to `/etc/voice2law/service-account.json`.
- If you do not need Firestore, you can remove the Firebase lines and the app will still run.

## 5. Create the NLP env file

Create `/etc/voice2law/nlp.env`:

```env
NLP_PORT=8001
CORS_ORIGINS=https://your-domain.com

HF_TOKEN=your_huggingface_token
HF_INFERENCE_ENDPOINT=https://router.huggingface.co/hf-inference

LLM_PROVIDER=huggingface
HF_LLM_MODEL=meta-llama/Llama-3.2-3B-Instruct
HF_LLM_INFERENCE_PROVIDER=auto

STT_PROVIDER=huggingface
HF_STT_MODEL=openai/whisper-large-v3

TTS_PROVIDER=huggingface
HF_TTS_MODEL=facebook/mms-tts-urd

EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
CHROMA_DIR=./data/chroma
ANONYMIZED_TELEMETRY=False

LLM_EXTRACTIVE_ONLY=false
RETRIEVAL_K=5
RETRIEVAL_MAX_QUERIES=2
MAX_CONTEXT_CHARS=1600
LLM_MAX_TOKENS_URDU=750
LLM_TIMEOUT_SECONDS=90
ANSWER_CACHE_MIN_CHARS=550
TTS_MAX_CHARS=1500

OCR_ENGINE=tesseract
TESSERACT_CMD=
ANSWER_LANGUAGE=urdu
```

Notes:

- If you want faster first deployment, set `LLM_EXTRACTIVE_ONLY=true`.
- If you want to use Azure OCR instead of local Tesseract, switch `OCR_ENGINE=azure` and add the Azure key values.
- If you already have `nlp-service/data/chroma` in the repo, the NLP service can answer right away after startup.
- If you use both `www` and non-`www`, put both in `CORS_ORIGINS` separated by commas.

## 6. Install app dependencies

Frontend:

```bash
cd /opt/voice2law
npm install
```

Backend:

```bash
cd /opt/voice2law/backend
npm install
```

NLP service:

```bash
cd /opt/voice2law/nlp-service
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
```

## 7. Build the frontend

```bash
cd /opt/voice2law
npm run build
```

This writes the production site into `build/`.

## 8. Install the service files

Copy the systemd files into `/etc/systemd/system/`:

```bash
sudo mkdir -p /etc/voice2law
sudo cp /opt/voice2law/deploy/aws/systemd/voice2law-backend.service /etc/systemd/system/
sudo cp /opt/voice2law/deploy/aws/systemd/voice2law-nlp.service /etc/systemd/system/
```

Then reload systemd:

```bash
sudo systemctl daemon-reload
sudo systemctl enable voice2law-nlp
sudo systemctl enable voice2law-backend
```

## 9. Install the Nginx config

```bash
sudo cp /opt/voice2law/deploy/aws/nginx/voice2law.conf /etc/nginx/sites-available/voice2law.conf
sudo ln -sf /etc/nginx/sites-available/voice2law.conf /etc/nginx/sites-enabled/voice2law.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
```

The config serves the frontend from `/opt/voice2law/build` and proxies:

- `/api` to the backend
- `/nlp` to the NLP service

## 10. Start everything

```bash
sudo systemctl start voice2law-nlp
sudo systemctl start voice2law-backend
sudo systemctl restart nginx
```

If you want them to auto-start after reboot:

```bash
sudo systemctl enable voice2law-nlp
sudo systemctl enable voice2law-backend
sudo systemctl enable nginx
```

## 11. Check that it works

Run these on the server:

```bash
curl http://127.0.0.1:5000/api/health
curl http://127.0.0.1:8001/health
```

Then open your domain in a browser.

## 12. If you change the legal PDFs

Rebuild the Chroma index:

```bash
cd /opt/voice2law/nlp-service
./venv/bin/python ingest.py --input ./legal_data --reset
```

If you only copied the existing `data/chroma` folder, you can skip this step.

## 13. Add HTTPS

If you have a domain name, use Certbot:

```bash
sudo snap install core
sudo snap install --classic certbot
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 14. Most common mistakes

- `origin_mismatch` from Google sign-in:
  - add your production domain to Google Cloud Console
  - make sure `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` match
- Frontend loads but API calls fail:
  - check `VITE_API_URL=/api`
  - check Nginx is running
- Voice fallback fails:
  - check `VITE_NLP_SERVICE_URL=/nlp`
  - check `CORS_ORIGINS` includes your public domain
- Backend says NLP is offline:
  - check `systemctl status voice2law-nlp`
  - check `curl http://127.0.0.1:8001/health`
- Service will not start:
  - look at logs with `journalctl -u voice2law-backend -f`
  - look at logs with `journalctl -u voice2law-nlp -f`

## 15. Simple mental model

If this still feels like too much, keep only this in your head:

1. EC2 is the machine.
2. Nginx is the front door.
3. Backend is the brain for login and API routes.
4. NLP is the legal answer engine.
5. Frontend is the website people see.

If all five are running, the app is deployed.
