# =============================================================================
# PRODUCTION DEPLOYMENT SECURITY CHECKLIST
# =============================================================================
# Complete this checklist before deploying to production
# Platform: exams.jeff.az (Exam Platform)
# Last Updated: 2026-03-26
# =============================================================================

## PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables ✓
- [ ] Created `.env` file from `.env.example`
- [ ] Generated strong NEXTAUTH_SECRET (min 32 chars): `openssl rand -base64 32`
- [ ] Generated strong CRON_SECRET (min 32 chars, different from NEXTAUTH_SECRET)
- [ ] Set correct DATABASE_URL with strong password
- [ ] Set NEXTAUTH_URL to `https://exams.jeff.az`
- [ ] Configured OPENAI_API_KEY (if using AI features)
- [ ] Configured SMTP settings for email notifications
- [ ] Set NODE_ENV=production
- [ ] Verified no "CHANGE_ME" placeholders remain
- [ ] Secured .env file permissions: `chmod 600 .env`

### 2. Database Security ✓
- [ ] Created PostgreSQL user with limited privileges
- [ ] Used strong database password (16+ chars, mixed case, numbers, symbols)
- [ ] Configured PostgreSQL to only accept local connections (127.0.0.1)
- [ ] Enabled PostgreSQL SSL/TLS (if remote connection needed)
- [ ] Ran database migrations: `npx prisma migrate deploy`
- [ ] Created database backups schedule
- [ ] Restricted database user permissions (no DROP, CREATE on production)
- [ ] Configured connection pooling limits

### 3. Application Security ✓
- [ ] Installed all dependencies: `npm ci` (not `npm install`)
- [ ] Built application for production: `npm run build`
- [ ] Removed all console.log statements that log sensitive data
- [ ] Verified rate limiting is active on all endpoints
- [ ] Tested authentication and authorization flows
- [ ] Verified CRON endpoints require Bearer token
- [ ] Tested file upload size limits and validation
- [ ] Reviewed all API routes for proper authentication
- [ ] Tested error handling doesn't leak sensitive information
- [ ] Verified session timeout and JWT expiration settings

### 4. Server Hardening ✓
- [ ] Ran server hardening script: `sudo bash server-hardening.sh`
- [ ] Configured UFW firewall (only ports 22, 80, 443 open)
- [ ] Hardened SSH configuration
- [ ] Set up SSH key authentication (disable password auth after testing)
- [ ] Configured fail2ban for brute-force protection
- [ ] Applied kernel security parameters (sysctl)
- [ ] Enabled automatic security updates
- [ ] Secured shared memory
- [ ] Set correct file permissions and ownership
- [ ] Installed monitoring tools (htop, fail2ban, etc.)

### 5. Nginx Configuration ✓
- [ ] Copied nginx-production.conf to /etc/nginx/sites-available/aimentor
- [ ] Created symbolic link: `sudo ln -s /etc/nginx/sites-available/aimentor /etc/nginx/sites-enabled/`
- [ ] Removed default site: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Updated server_name to exams.jeff.az
- [ ] Tested Nginx configuration: `sudo nginx -t`
- [ ] Configured SSL certificates (Let's Encrypt)
- [ ] Verified rate limiting zones are active
- [ ] Configured proper request/body size limits
- [ ] Set up log rotation for Nginx logs
- [ ] Verified CRON endpoints only accessible from localhost

### 6. SSL/TLS Configuration ✓
- [ ] Installed certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Generated SSL certificate: `sudo certbot --nginx -d exams.jeff.az`
- [ ] Verified certificate auto-renewal: `sudo certbot renew --dry-run`
- [ ] Configured HSTS header
- [ ] Tested SSL configuration: https://www.ssllabs.com/ssltest/
- [ ] Verified HTTP to HTTPS redirect works
- [ ] Configured SSL session caching
- [ ] Enabled OCSP stapling

### 7. PM2 Process Manager ✓
- [ ] Installed PM2 globally: `sudo npm i -g pm2`
- [ ] Created logs directory: `mkdir -p ~/examsJeff/logs`
- [ ] Reviewed ecosystem.config.js settings
- [ ] Started application: `cd ~/examsJeff && pm2 start ecosystem.config.js --env production`
- [ ] Configured PM2 startup: `pm2 startup systemd -u $USER --hp $HOME`
- [ ] Saved PM2 configuration: `pm2 save`
- [ ] Verified auto-restart on crash
- [ ] Configured memory limits and restart policy
- [ ] Set up log rotation for PM2 logs

### 8. Monitoring and Logging ✓
- [ ] Verified application logs are writing correctly
- [ ] Configured log rotation for all logs
- [ ] Set up monitoring for disk space
- [ ] Configured alerts for high memory/CPU usage
- [ ] Set up monitoring for failed login attempts
- [ ] Configured monitoring for rate limit violations
- [ ] Verified fail2ban email notifications (if configured)
- [ ] Set up database connection monitoring

### 9. Performance Optimization ✓
- [ ] Enabled Gzip compression in Nginx
- [ ] Configured static asset caching
- [ ] Optimized database queries with indexes
- [ ] Configured database connection pooling
- [ ] Verified Next.js production optimizations are applied
- [ ] Tested application under load (if possible)
- [ ] Optimized image delivery
- [ ] Configured CDN (if applicable)

### 10. Backup and Recovery ✓
- [ ] Set up automated database backups
- [ ] Tested database backup restoration
- [ ] Documented backup locations and procedures
- [ ] Set up application code backups (git)
- [ ] Created disaster recovery plan
- [ ] Documented rollback procedures
- [ ] Tested application recovery from backup

### 11. Testing Before Go-Live ✓
- [ ] Tested user registration and login
- [ ] Tested password reset functionality
- [ ] Tested exam creation and assignment
- [ ] Tested exam taking flow (all sections)
- [ ] Tested exam submission and scoring
- [ ] Tested file upload functionality
- [ ] Tested email notifications
- [ ] Tested role-based access control (Student, Teacher, Admin)
- [ ] Tested AI scoring features (if enabled)
- [ ] Tested rate limiting on auth endpoints
- [ ] Verified CRON jobs execute correctly
- [ ] Load tested with expected concurrent users

### 12. DNS and Domain Configuration ✓
- [ ] DNS A record points to server IP
- [ ] DNS propagation completed (use `dig exams.jeff.az`)
- [ ] Verified domain resolves correctly
- [ ] Configured www redirect (if applicable)
- [ ] Set up DNS monitoring/alerts

### 13. Security Scanning and Auditing ✓
- [ ] Ran Lynis security audit: `sudo lynis audit system`
- [ ] Reviewed Lynis recommendations
- [ ] Scanned for rootkits: `sudo rkhunter --check`
- [ ] Verified no default passwords in use
- [ ] Reviewed user accounts and permissions
- [ ] Checked for unnecessary open ports: `sudo ss -tulpn`
- [ ] Verified no development dependencies in node_modules
- [ ] Reviewed package vulnerabilities: `npm audit`

## POST-DEPLOYMENT CHECKLIST

### Immediate (First Hour)
- [ ] Verified application is accessible at https://exams.jeff.az
- [ ] Tested login with existing accounts
- [ ] Verified HTTP redirects to HTTPS
- [ ] Checked application logs for errors
- [ ] Verified database connections are working
- [ ] Tested exam flow end-to-end
- [ ] Checked PM2 status: `pm2 status`
- [ ] Verified fail2ban is running: `sudo fail2ban-client status`
- [ ] Monitored system resources: `htop`

### First 24 Hours
- [ ] Monitored error logs continuously
- [ ] Checked for rate limiting violations
- [ ] Verified CRON jobs executed successfully
- [ ] Monitored fail2ban logs for suspicious activity
- [ ] Checked disk space usage
- [ ] Verified email notifications are being sent
- [ ] Monitored database performance
- [ ] Checked SSL certificate status

### First Week
- [ ] Reviewed all logs for anomalies
- [ ] Adjusted rate limits based on actual traffic
- [ ] Fine-tuned PM2 memory restart limits
- [ ] Optimized database queries if needed
- [ ] Reviewed fail2ban ban list
- [ ] Verified backup system is working
- [ ] Collected performance metrics
- [ ] Gathered user feedback on stability

### Ongoing Maintenance
- [ ] Weekly: Review error logs and security logs
- [ ] Weekly: Check fail2ban status and banned IPs
- [ ] Weekly: Verify backups are completing
- [ ] Monthly: Update system packages
- [ ] Monthly: Rotate and archive old logs
- [ ] Monthly: Review and update rate limits
- [ ] Quarterly: Run security audit with Lynis
- [ ] Quarterly: Review and rotate secrets
- [ ] Quarterly: Update SSL certificates (auto via certbot)
- [ ] Quarterly: Review user permissions and access

## EMERGENCY CONTACTS AND PROCEDURES

### If Site Goes Down
1. Check PM2 status: `pm2 status`
2. Check Nginx status: `sudo systemctl status nginx`
3. Check PostgreSQL: `sudo systemctl status postgresql`
4. Review error logs: `pm2 logs` and `/var/log/nginx/aimentor_error.log`
5. Check disk space: `df -h`
6. Check memory: `free -h`
7. Restart if needed: `pm2 reload ecosystem.config.js`

### If Under Attack
1. Check fail2ban: `sudo fail2ban-client status`
2. Review Nginx access logs for patterns
3. Adjust rate limits in Nginx config
4. Block suspicious IPs manually: `sudo ufw deny from X.X.X.X`
5. Enable maintenance mode if necessary

### Rollback Procedure
1. Stop PM2: `pm2 stop examsJeff`
2. Checkout previous version: `git checkout <previous-commit>`
3. Install dependencies: `npm ci`
4. Run migrations if needed: `npx prisma migrate deploy`
5. Build: `npm run build`
6. Restart: `pm2 reload ecosystem.config.js --env production`

## SECURITY CONTACTS
- Hosting Provider Support: [Hetzner/Provider Contact]
- Domain Registrar: [Domain Provider Contact]
- Database Administrator: [DBA Contact]
- Security Team: [Security Team Contact]

## USEFUL COMMANDS REFERENCE

### PM2
```bash
pm2 status                    # Check application status
pm2 logs examsJeff            # View logs
pm2 restart examsJeff         # Restart application
pm2 reload examsJeff          # Zero-downtime reload
pm2 monit                     # Real-time monitoring
```

### Nginx
```bash
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload configuration
sudo systemctl status nginx   # Check status
```

### Fail2ban
```bash
sudo fail2ban-client status                  # Check status
sudo fail2ban-client status sshd             # Check specific jail
sudo fail2ban-client unban <IP>              # Unban IP
```

### Logs
```bash
pm2 logs                                     # Application logs
sudo tail -f /var/log/nginx/aimentor_error.log   # Nginx errors
sudo tail -f /var/log/auth.log               # Authentication logs
sudo journalctl -u nginx -f                  # Systemd nginx logs
```

### System
```bash
htop                          # System resources
sudo ufw status verbose       # Firewall status
df -h                         # Disk usage
free -h                       # Memory usage
```

## NOTES
- Keep this checklist updated as infrastructure changes
- Review and update security measures regularly
- Document any issues encountered and solutions
- Share lessons learned with the team

=============================================================================
END OF CHECKLIST
=============================================================================
