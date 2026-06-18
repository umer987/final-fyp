/**
 * PM2 process manager — Voice2Law on a single EC2 instance.
 *
 * Usage (from repo root on EC2):
 *   pm2 start deploy/aws/ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup   # run the printed sudo command, then pm2 save again
 */
const path = require('path');

const APP_ROOT = process.env.VOICE2LAW_ROOT || '/home/ubuntu/voice2law';

module.exports = {
  apps: [
    {
      name: 'voice2law-backend',
      cwd: path.join(APP_ROOT, 'backend'),
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: 'voice2law-nlp',
      cwd: path.join(APP_ROOT, 'nlp-service'),
      script: path.join(APP_ROOT, 'nlp-service/venv/bin/uvicorn'),
      args: 'app.main:app --host 127.0.0.1 --port 8001',
      interpreter: 'none',
      env: {
        PYTHONUNBUFFERED: '1',
      },
      max_restarts: 10,
      restart_delay: 10000,
    },
  ],
};
