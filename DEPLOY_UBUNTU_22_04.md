# Deploy to Ubuntu 22.04 (Next.js + Prisma + Postgres + Nginx)

This project is a **Next.js** app (`npm run build` + `npm run start`) using **Prisma** with **PostgreSQL** (per `prisma/schema.prisma`).

This guide sets up:

- Node.js (recommended: **Node 20 LTS**)
- PostgreSQL (local on server)
- Prisma migrations (**`npx prisma migrate deploy`**)
- systemd service (auto-restart + start on boot)
- Nginx reverse proxy (removes `:3000`)
- HTTPS via Let’s Encrypt (certbot)

Replace **all** placeholders like `example.com`, `CHANGE_ME_...`, and `<YOUR_GIT_REPO_URL>`.

---

## 0) Decide values

- **domain**: your real domain (recommended) or server IP
- **app path**: `~/examsJeff` (single folder, no `/var/www`)
- **linux user**: your normal SSH user (example: `ubuntu`)
- **app port**: `3000` (internal only)
- **postgres db**: `jeff_exams` (from your current `.env`)
- **postgres user**: `murad` (from your current `.env`)

---

## 1) Base server setup

```bash
sudo apt update && sudo apt -y upgrade

sudo apt -y install nginx postgresql postgresql-contrib git curl ufw

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## 2) Install Node.js (Node 20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs

node -v
npm -v
```

---

## 3) Create app folder (single folder)

```bash
mkdir -p ~/examsJeff
```

---

## 4) Put code on the server

### Option A: clone with git

```bash
cd ~/examsJeff && git clone <YOUR_GIT_REPO_URL> .
```

### Option B: upload (scp/rsync)

Upload your project into `~/examsJeff`, then:

```bash
cd ~/examsJeff
```

---

## 5) Create PostgreSQL DB + user (Postgres)

```bash
sudo -u postgres psql
```

In the `psql` prompt (matches your current `.env`):

```sql
-- Create user/role (skip if it already exists)
CREATE USER murad WITH ENCRYPTED PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

-- Create DB owned by the user (recommended)
CREATE DATABASE jeff_exams OWNER murad;

-- If the DB already exists, ensure privileges:
GRANT ALL PRIVILEGES ON DATABASE jeff_exams TO murad;
\q
```

---

## 6) Create production environment file

Create `~/examsJeff/.env`.

```bash
nano ~/examsJeff/.env
```

Minimum recommended keys (add any others your app needs):

```env
NODE_ENV=production
PORT=3000

DATABASE_URL="postgresql://murad:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/jeff_exams?schema=public"

NEXTAUTH_URL="https://example.com"
NEXTAUTH_SECRET="CHANGE_ME_TO_A_LONG_RANDOM_SECRET"

OPENAI_API_KEY="..."
```

Generate a strong `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

---

## 7) Install deps, run migrations, build

```bash
cd ~/examsJeff &&
npm ci &&
npx prisma generate &&
npx prisma migrate deploy &&
npm run build
```

---

## 8) systemd service (keep app running)

Create the service file:

```bash
sudo nano /etc/systemd/system/aimentor.service
```

Paste:

```ini
[Unit]
Description=AIMentor Next.js App
After=network.target

[Service]
Type=simple
User=YOUR_SSH_USER
Group=YOUR_SSH_USER
WorkingDirectory=/home/YOUR_SSH_USER/examsJeff
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/home/YOUR_SSH_USER/examsJeff/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable aimentor
sudo systemctl start aimentor

sudo systemctl status aimentor --no-pager
sudo journalctl -u aimentor -f
```

---

## 8b) Alternative: PM2 (recommended if you prefer PM2)

If you use PM2, you **do not need** the systemd service above (PM2 will generate its own startup service).

### Install PM2

```bash
sudo npm i -g pm2
pm2 -v
```

### Create PM2 ecosystem file

Create `~/examsJeff/ecosystem.config.js`:

```bash
nano ~/examsJeff/ecosystem.config.js
```

Paste:

```js
module.exports = {
  apps: [
    {
      name: "examsJeff",
      cwd: process.env.HOME + "/examsJeff",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
```

### Start with PM2 (loads `.env`)

```bash
cd ~/examsJeff &&
pm2 start ecosystem.config.js --update-env --env production
```

If you want PM2 to load your `.env` automatically, start like this instead:

```bash
cd ~/examsJeff &&
pm2 start ecosystem.config.js --update-env --env production --env-file "$HOME/examsJeff/.env"
```

### Enable PM2 on boot

```bash
pm2 startup systemd -u "$USER" --hp "$HOME"
```

PM2 will print a command starting with `sudo env ...`. Copy/paste that command exactly, then:

```bash
pm2 save
```

### PM2 useful commands

```bash
pm2 status
pm2 logs examsJeff
pm2 restart examsJeff
pm2 reload examsJeff
```

### Deploy updates with PM2

```bash
cd ~/examsJeff &&
git pull &&
npm ci &&
npx prisma generate &&
npx prisma migrate deploy &&
npm run build &&
pm2 reload ecosystem.config.js --update-env
```

---

## 9) Nginx reverse proxy (remove `:3000`)

Create Nginx site:

```bash
sudo nano /etc/nginx/sites-available/aimentor
```

Paste (replace domain):

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  client_max_body_size 20m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/aimentor /etc/nginx/sites-enabled/aimentor
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

Now your app should be available at `http://example.com` (no `:3000`).

---

## 10) HTTPS (Let’s Encrypt)

```bash
sudo apt -y install certbot python3-certbot-nginx

sudo certbot --nginx -d example.com -d www.example.com
sudo certbot renew --dry-run
```

---

## 11) Update deployment (pull, migrate, rebuild, restart)

```bash
cd ~/examsJeff &&
git pull &&
npm ci &&
npx prisma generate &&
npx prisma migrate deploy &&
npm run build

sudo systemctl restart aimentor
sudo systemctl status aimentor --no-pager
```

---

## 12) Troubleshooting

```bash
sudo systemctl status aimentor --no-pager
sudo journalctl -u aimentor -n 200 --no-pager

sudo nginx -t
sudo journalctl -u nginx -n 200 --no-pager

sudo tail -n 200 /var/log/nginx/error.log
sudo tail -n 200 /var/log/nginx/access.log

sudo ss -ltnp | grep -E ':80|:443|:3000'
```

