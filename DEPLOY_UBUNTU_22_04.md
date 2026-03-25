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
- **app path**: `/var/www/examsJeff`
- **linux user**: `aimentor`
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

## 3) Create app user + folder

```bash
sudo adduser --system --group --home /var/www/examsJeff --shell /bin/bash aimentor

sudo mkdir -p /var/www/examsJeff
sudo chown -R aimentor:aimentor /var/www/examsJeff
```

---

## 4) Put code on the server

### Option A: clone with git

```bash
sudo -u aimentor -H bash -c "cd /var/www/examsJeff && git clone <YOUR_GIT_REPO_URL> ."
```

### Option B: upload (scp/rsync)

Upload your project into `/var/www/examsJeff`, then:

```bash
sudo chown -R aimentor:aimentor /var/www/examsJeff
```

---

## 5) Create PostgreSQL DB + user (Postgres)

```bash
sudo -u postgres psql
```

In the `psql` prompt (matches your current `.env`):

```sql
-- Create user/role (skip if it already exists)
CREATE USER murad WITH ENCRYPTED PASSWORD 'SeninSehfre123!';

-- Create DB owned by the user (recommended)
CREATE DATABASE jeff_exams OWNER murad;

-- If the DB already exists, ensure privileges:
GRANT ALL PRIVILEGES ON DATABASE jeff_exams TO murad;
\q
```

---

## 6) Create production environment file

Create `/var/www/examsJeff/.env` (owned by user `aimentor`).

```bash
sudo -u aimentor -H bash -c "nano /var/www/examsJeff/.env"
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
sudo -u aimentor -H bash -c "
cd /var/www/examsJeff &&
npm ci &&
npx prisma generate &&
npx prisma migrate deploy &&
npm run build
"
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
User=aimentor
Group=aimentor
WorkingDirectory=/var/www/aimentor
Environment=NODE_ENV=production
Environment=PORT=3000
WorkingDirectory=/var/www/examsJeff
EnvironmentFile=/var/www/examsJeff/.env
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
sudo -u aimentor -H bash -c "
cd /var/www/aimentor &&
cd /var/www/examsJeff &&
git pull &&
npm ci &&
npx prisma generate &&
npx prisma migrate deploy &&
npm run build
"

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

