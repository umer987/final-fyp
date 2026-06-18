#!/usr/bin/env bash
# Voice2Law — Ubuntu 22.04 EC2 bootstrap (run once as ubuntu user with sudo).
# Usage: chmod +x setup-ec2.sh && ./setup-ec2.sh
set -euo pipefail

echo "==> Updating system packages..."
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

echo "==> Installing base tools..."
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  git curl ca-certificates gnupg build-essential \
  nginx \
  tesseract-ocr tesseract-ocr-eng tesseract-ocr-urd \
  poppler-utils ffmpeg

echo "==> Installing Node.js 20..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v

echo "==> Installing PM2..."
sudo npm install -g pm2

echo "==> Installing Python 3.12..."
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  python3.12 python3.12-venv python3.12-dev

echo "==> Creating app directory..."
mkdir -p /home/ubuntu/voice2law

echo ""
echo "Bootstrap complete."
echo ""
echo "Next steps:"
echo "  1. git clone <your-repo-url> /home/ubuntu/voice2law"
echo "  2. Copy deploy/aws/.env.production.example → .env, backend/.env, nlp-service/.env"
echo "  3. scp -r nlp-service/data/chroma ubuntu@<EC2-IP>:/home/ubuntu/voice2law/nlp-service/data/"
echo "  4. See deploy/aws/README-AWS-DEPLOY.md for build, pm2, and nginx"
