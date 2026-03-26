# QUICK DEPLOYMENT GUIDE
## Exam Platform Production Deployment (exams.jeff.az)

This is a condensed version of the deployment process. For complete details, see `SECURITY_IMPLEMENTATION_SUMMARY.md` and `PRODUCTION_SECURITY_CHECKLIST.md`.

---

## Prerequisites
- Ubuntu 22.04 server with SSH access
- Domain (exams.jeff.az) pointing to server IP
- PostgreSQL database credentials
- SMTP credentials for email
- OpenAI API key (if using AI features)

---

## Step 1: Initial Server Setup (5 minutes)

```bash
# SSH into server
ssh ubuntu@exams.jeff.az

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl nginx postgresql postgresql-contrib ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## Step 2: Install Node.js (2 minutes)

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v   # Should show 10.x.x
```

---

## Step 3: Set Up Database (3 minutes)

```bash
# Create PostgreSQL user and database
sudo -u postgres psql

-- In psql prompt:
CREATE USER murad WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
CREATE DATABASE jeff_exams OWNER murad;
GRANT ALL PRIVILEGES ON DATABASE jeff_exams TO murad;
\q
```

---

## Step 4: Clone and Configure Application (5 minutes)

```bash
# Create application directory
mkdir -p ~/examsJeff
cd ~/examsJeff

# Clone repository (or upload files)
git clone YOUR_GIT_REPO_URL .

# Install dependencies
npm ci

# Copy and configure environment
cp .env.example .env
nano .env

# Required environment variables (MINIMUM):
# NODE_ENV=production
# PORT=3000
# DATABASE_URL="postgresql://murad:YOUR_PASSWORD@127.0.0.1:5432/jeff_exams?schema=public"
# NEXTAUTH_URL="https://exams.jeff.az"
# NEXTAUTH_SECRET="$(openssl rand -base64 32)"
# CRON_SECRET="$(openssl rand -base64 32)"
# OPENAI_API_KEY="your-openai-key"

# Secure .env file
chmod 600 .env

# Run database migrations
npx prisma generate
npx prisma migrate deploy

# Build application
npm run build
```

---

## Step 5: Server Hardening (10 minutes)

```bash
# Run hardening script
cd ~/examsJeff
sudo bash server-hardening.sh

# This script will:
# - Configure UFW firewall
# - Harden SSH
# - Install and configure fail2ban
# - Apply kernel security parameters
# - Enable automatic updates
# - Set up log rotation
# - Install monitoring tools

# IMPORTANT: Test SSH access in a new terminal before continuing!
```

---

## Step 6: Configure Nginx (5 minutes)

```bash
# Copy Nginx configuration
sudo cp ~/examsJeff/nginx-production.conf /etc/nginx/sites-available/aimentor

# Update server_name in config if needed
sudo nano /etc/nginx/sites-available/aimentor
# Change: server_name exams.jeff.az www.exams.jeff.az;

# Enable site
sudo ln -s /etc/nginx/sites-available/aimentor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 7: Set Up SSL Certificate (3 minutes)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d exams.jeff.az

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 8: Start Application with PM2 (5 minutes)

```bash
# Install PM2 globally
sudo npm i -g pm2

# Create logs directory
mkdir -p ~/examsJeff/logs

# Start application
cd ~/examsJeff
pm2 start ecosystem.config.js --env production

# Configure PM2 to start on boot
pm2 startup systemd -u $USER --hp $HOME
# Run the command that PM2 outputs
pm2 save

# Verify application is running
pm2 status
pm2 logs --lines 50
```

---

## Step 9: Verification (5 minutes)

```bash
# 1. Check application health
curl https://exams.jeff.az/api/health
# Should return: {"status":"ok"}

# 2. Check PM2 status
pm2 status
# Should show: examsJeff | online | 2 instances

# 3. Check Nginx
sudo systemctl status nginx
# Should show: active (running)

# 4. Check fail2ban
sudo fail2ban-client status
# Should show active jails: sshd, nginx-http-auth, nginx-limit-req

# 5. Check firewall
sudo ufw status verbose
# Should show: Status: active
# Should allow: 22/tcp, 80/tcp, 443/tcp

# 6. Test website
# Open browser: https://exams.jeff.az
# Should load the homepage

# 7. Test login (if you have an account)
# Navigate to /auth/login and test authentication
```

---

## Step 10: Post-Deployment Monitoring (Ongoing)

```bash
# Monitor application logs
pm2 logs examsJeff --lines 100

# Monitor Nginx errors
sudo tail -f /var/log/nginx/aimentor_error.log

# Monitor fail2ban
sudo fail2ban-client status sshd
sudo tail -f /var/log/fail2ban.log

# Monitor system resources
htop

# Check rate limiting is working
grep "limiting requests" /var/log/nginx/aimentor_error.log
```

---

## Common Commands Reference

### PM2 Commands
```bash
pm2 status                      # Check status
pm2 logs examsJeff             # View logs
pm2 restart examsJeff          # Restart application
pm2 reload examsJeff           # Zero-downtime reload
pm2 monit                      # Real-time monitoring
pm2 stop examsJeff             # Stop application
pm2 delete examsJeff           # Remove from PM2
```

### Update Deployment
```bash
cd ~/examsJeff
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 reload examsJeff
```

### Nginx Commands
```bash
sudo nginx -t                   # Test configuration
sudo systemctl reload nginx     # Reload config
sudo systemctl restart nginx    # Restart Nginx
sudo systemctl status nginx     # Check status
```

### View Logs
```bash
pm2 logs                                          # Application logs
sudo tail -f /var/log/nginx/aimentor_error.log   # Nginx errors
sudo tail -f /var/log/nginx/aimentor_access.log  # Nginx access
sudo tail -f /var/log/auth.log                   # Auth logs
sudo journalctl -u nginx -f                      # Systemd nginx logs
```

### Security Commands
```bash
sudo fail2ban-client status                # Check fail2ban status
sudo fail2ban-client status sshd           # Check SSH jail
sudo fail2ban-client unban <IP>            # Unban IP
sudo lynis audit system                    # Security audit
sudo ufw status verbose                    # Firewall status
```

---

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs --err

# Check if port 3000 is in use
sudo ss -tulpn | grep :3000

# Check environment variables
cat ~/examsJeff/.env

# Check database connection
npx prisma db pull
```

### Nginx 502 Bad Gateway
```bash
# Check if application is running
pm2 status

# Check Nginx error log
sudo tail -n 100 /var/log/nginx/aimentor_error.log

# Check if port 3000 is accessible
curl http://127.0.0.1:3000/api/health

# Restart application
pm2 restart examsJeff
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Test renewal
sudo certbot renew --dry-run
```

### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U murad -d jeff_exams -h 127.0.0.1

# Check connection string in .env
cat ~/examsJeff/.env | grep DATABASE_URL
```

### High Memory Usage
```bash
# Check PM2 memory restart is configured
cat ~/examsJeff/ecosystem.config.js | grep max_memory_restart

# Restart application
pm2 reload examsJeff

# Monitor memory
pm2 monit

# Check for memory leaks
htop
```

### Rate Limit Too Strict
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/aimentor

# Adjust rate limit zones (increase rate or burst)
# Example: limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## Emergency Procedures

### If Site is Down
1. Check PM2: `pm2 status`
2. Check Nginx: `sudo systemctl status nginx`
3. Check logs: `pm2 logs --err`
4. Restart: `pm2 restart examsJeff`

### If Under Attack
1. Check fail2ban: `sudo fail2ban-client status`
2. Review access logs: `sudo tail -n 1000 /var/log/nginx/aimentor_access.log`
3. Ban suspicious IPs: `sudo ufw deny from X.X.X.X`
4. Enable maintenance mode: `export MAINTENANCE_MODE=true && pm2 restart examsJeff`

### Rollback to Previous Version
```bash
cd ~/examsJeff
git log --oneline -5  # Find previous commit
pm2 stop examsJeff
git checkout <previous-commit-hash>
npm ci
npx prisma migrate deploy
npm run build
pm2 restart examsJeff
```

---

## Security Checklist (Quick)

Before going live, verify:
- [ ] Strong passwords set (DB, .env secrets)
- [ ] .env file secured (chmod 600)
- [ ] Firewall enabled (only ports 22, 80, 443)
- [ ] SSL certificate installed
- [ ] Fail2ban running
- [ ] PM2 auto-start configured
- [ ] Backups scheduled
- [ ] Monitoring set up
- [ ] All tests pass
- [ ] Load testing completed

---

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch logs continuously
2. **Adjust rate limits** - Based on actual traffic patterns
3. **Set up backups** - Automate daily database backups
4. **Configure alerts** - Email notifications for errors
5. **Document procedures** - Update team wiki/docs
6. **Load testing** - Test with expected user load
7. **Security scan** - Run Lynis audit weekly

---

## Support Resources

- **Full Documentation**: `SECURITY_IMPLEMENTATION_SUMMARY.md`
- **Complete Checklist**: `PRODUCTION_SECURITY_CHECKLIST.md`
- **Deployment Guide**: `DEPLOY_UBUNTU_22_04.md`
- **Nginx Config**: `nginx-production.conf`
- **Hardening Script**: `server-hardening.sh`
- **PM2 Config**: `ecosystem.config.js`
- **Environment Template**: `.env.example`

---

## Estimated Timeline

| Step | Time | Difficulty |
|------|------|------------|
| Server Setup | 5 min | Easy |
| Node.js Install | 2 min | Easy |
| Database Setup | 3 min | Easy |
| App Configuration | 5 min | Medium |
| Server Hardening | 10 min | Easy |
| Nginx Setup | 5 min | Medium |
| SSL Certificate | 3 min | Easy |
| PM2 Setup | 5 min | Easy |
| Verification | 5 min | Easy |
| **TOTAL** | **~45 min** | **Medium** |

*Note: Times assume no issues. First-time deployment may take longer.*

---

**Last Updated:** March 26, 2026  
**Version:** 1.0  
**For Questions:** Review full documentation or contact DevOps team
