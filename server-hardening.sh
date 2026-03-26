#!/bin/bash
# =============================================================================
# UBUNTU 22.04 SERVER HARDENING SCRIPT FOR EXAM PLATFORM
# =============================================================================
# This script hardens an Ubuntu 22.04 server for production deployment
# Run as root or with sudo
# Usage: sudo bash server-hardening.sh
# =============================================================================

set -e  # Exit on error

echo "=================================================="
echo " EXAM PLATFORM - SERVER HARDENING SCRIPT"
echo " Ubuntu 22.04 LTS"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}ERROR: Please run as root or with sudo${NC}"
   exit 1
fi

echo -e "${GREEN}Starting server hardening...${NC}"
echo ""

# =============================================================================
# 1. UPDATE SYSTEM
# =============================================================================
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
apt update
apt upgrade -y
apt autoremove -y
apt autoclean

# =============================================================================
# 2. CONFIGURE FIREWALL (UFW)
# =============================================================================
echo -e "${YELLOW}[2/10] Configuring firewall (UFW)...${NC}"

# Install UFW if not present
apt install -y ufw

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (change port if using non-standard)
ufw allow OpenSSH

# Allow HTTP and HTTPS
ufw allow 'Nginx Full'

# Enable firewall
echo "y" | ufw enable

# Show status
ufw status verbose

# =============================================================================
# 3. SECURE SSH
# =============================================================================
echo -e "${YELLOW}[3/10] Securing SSH configuration...${NC}"

# Backup original sshd_config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Apply SSH hardening settings
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
# SSH Hardening Configuration

# Disable root login
PermitRootLogin no

# Disable password authentication (use SSH keys only)
# WARNING: Make sure you have SSH key access before enabling this!
# PasswordAuthentication no
PasswordAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Disable X11 forwarding
X11Forwarding no

# Disable TCP forwarding
AllowTcpForwarding no

# Maximum authentication attempts
MaxAuthTries 3

# Maximum sessions per connection
MaxSessions 2

# Login grace time (seconds)
LoginGraceTime 30

# Client alive interval (disconnect idle sessions)
ClientAliveInterval 300
ClientAliveCountMax 2

# Use only strong ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# Use only strong MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256

# Use only strong key exchange algorithms
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512,diffie-hellman-group-exchange-sha256

# Disable host-based authentication
HostbasedAuthentication no

# Disable rhosts-based authentication
IgnoreRhosts yes
EOF

# Test SSH configuration
sshd -t

# Restart SSH service
systemctl restart sshd

echo -e "${GREEN}SSH hardened successfully${NC}"
echo -e "${YELLOW}IMPORTANT: Make sure you can still login before disconnecting!${NC}"

# =============================================================================
# 4. INSTALL AND CONFIGURE FAIL2BAN
# =============================================================================
echo -e "${YELLOW}[4/10] Installing and configuring fail2ban...${NC}"

apt install -y fail2ban

# Create fail2ban configuration
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Ban time: 1 hour
bantime = 3600

# Find time window: 10 minutes
findtime = 600

# Max retry attempts before ban
maxretry = 5

# Email notifications (optional)
# destemail = admin@jeff.az
# sendername = Fail2Ban
# action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/aimentor_error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/aimentor_error.log
maxretry = 10
findtime = 60
bantime = 600

[nginx-botsearch]
enabled = true
port = http,https
filter = nginx-botsearch
logpath = /var/log/nginx/aimentor_access.log
maxretry = 2
EOF

# Create custom filter for nginx rate limiting
cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << 'EOF'
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
ignoreregex =
EOF

# Create custom filter for bot searches
cat > /etc/fail2ban/filter.d/nginx-botsearch.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*"(GET|POST|HEAD).*(\.php|\.asp|\.exe|\.pl|wp-login|phpmyadmin|administrator).*HTTP.*"
ignoreregex =
EOF

# Enable and start fail2ban
systemctl enable fail2ban
systemctl restart fail2ban

# Show fail2ban status
fail2ban-client status

echo -e "${GREEN}Fail2ban configured successfully${NC}"

# =============================================================================
# 5. KERNEL HARDENING (SYSCTL)
# =============================================================================
echo -e "${YELLOW}[5/10] Applying kernel security parameters...${NC}"

cat > /etc/sysctl.d/99-security-hardening.conf << 'EOF'
# IP Forwarding (disable if not routing)
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_syn_retries = 2
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_max_syn_backlog = 4096

# Protection against IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Log martians (packets with impossible addresses)
net.ipv4.conf.all.log_martians = 1

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_all = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Ignore bogus ICMP error responses
net.ipv4.icmp_ignore_bogus_error_responses = 1

# TCP hardening
net.ipv4.tcp_timestamps = 0
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# Increase system file descriptor limit
fs.file-max = 65535

# Increase network buffer sizes
net.core.rmem_max = 8388608
net.core.wmem_max = 8388608
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_rmem = 4096 87380 8388608
net.ipv4.tcp_wmem = 4096 65536 8388608

# Protect against TCP time-wait assassination
net.ipv4.tcp_rfc1337 = 1

# Connection tracking
net.netfilter.nf_conntrack_max = 65536

# Kernel pointer protection
kernel.kptr_restrict = 2

# Restrict kernel logs to root
kernel.dmesg_restrict = 1

# Restrict ptrace scope
kernel.yama.ptrace_scope = 1
EOF

# Apply sysctl settings
sysctl -p /etc/sysctl.d/99-security-hardening.conf

echo -e "${GREEN}Kernel hardening applied${NC}"

# =============================================================================
# 6. INSTALL AND CONFIGURE AUTOMATIC SECURITY UPDATES
# =============================================================================
echo -e "${YELLOW}[6/10] Configuring automatic security updates...${NC}"

apt install -y unattended-upgrades apt-listchanges

# Configure unattended upgrades
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

# Enable automatic updates
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

echo -e "${GREEN}Automatic security updates configured${NC}"

# =============================================================================
# 7. SECURE SHARED MEMORY
# =============================================================================
echo -e "${YELLOW}[7/10] Securing shared memory...${NC}"

# Check if entry already exists
if ! grep -q "tmpfs /run/shm" /etc/fstab; then
    echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" >> /etc/fstab
    mount -o remount /run/shm
    echo -e "${GREEN}Shared memory secured${NC}"
else
    echo -e "${YELLOW}Shared memory already secured${NC}"
fi

# =============================================================================
# 8. CONFIGURE LOG ROTATION
# =============================================================================
echo -e "${YELLOW}[8/10] Configuring log rotation...${NC}"

# Create logrotate config for application
cat > /etc/logrotate.d/aimentor << 'EOF'
/var/log/nginx/aimentor_access.log
/var/log/nginx/aimentor_error.log
/var/log/nginx/cron_access.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF

echo -e "${GREEN}Log rotation configured${NC}"

# =============================================================================
# 9. SET FILE PERMISSIONS AND OWNERSHIP
# =============================================================================
echo -e "${YELLOW}[9/10] Setting secure file permissions...${NC}"

# Nginx configurations
if [ -d /etc/nginx ]; then
    chown -R root:root /etc/nginx
    chmod -R 644 /etc/nginx/*
    chmod 755 /etc/nginx/sites-available
    chmod 755 /etc/nginx/sites-enabled
    find /etc/nginx -type d -exec chmod 755 {} \;
fi

# Application directory (adjust path if needed)
APP_DIR="/home/ubuntu/examsJeff"
if [ -d "$APP_DIR" ]; then
    # Set ownership to application user
    chown -R ubuntu:ubuntu "$APP_DIR"
    
    # Secure .env file (if exists)
    if [ -f "$APP_DIR/.env" ]; then
        chmod 600 "$APP_DIR/.env"
        echo -e "${GREEN}Secured .env file${NC}"
    fi
    
    # Secure node_modules
    if [ -d "$APP_DIR/node_modules" ]; then
        chmod 755 "$APP_DIR/node_modules"
    fi
fi

echo -e "${GREEN}File permissions set${NC}"

# =============================================================================
# 10. INSTALL MONITORING TOOLS
# =============================================================================
echo -e "${YELLOW}[10/10] Installing monitoring and security tools...${NC}"

apt install -y \
    htop \
    iotop \
    nethogs \
    iftop \
    nload \
    lynis \
    rkhunter \
    aide

# Initialize AIDE (file integrity monitoring)
# aideinit
# mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

echo -e "${GREEN}Monitoring tools installed${NC}"

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo ""
echo "=================================================="
echo -e "${GREEN} SERVER HARDENING COMPLETED SUCCESSFULLY!${NC}"
echo "=================================================="
echo ""
echo "Applied security measures:"
echo "  ✓ System packages updated"
echo "  ✓ Firewall (UFW) configured and enabled"
echo "  ✓ SSH hardened with secure ciphers"
echo "  ✓ Fail2ban installed and configured"
echo "  ✓ Kernel security parameters applied"
echo "  ✓ Automatic security updates enabled"
echo "  ✓ Shared memory secured"
echo "  ✓ Log rotation configured"
echo "  ✓ File permissions secured"
echo "  ✓ Monitoring tools installed"
echo ""
echo -e "${YELLOW}IMPORTANT NEXT STEPS:${NC}"
echo "1. Test SSH access before disconnecting"
echo "2. Configure SSH key authentication and disable password auth"
echo "3. Review fail2ban logs: sudo fail2ban-client status"
echo "4. Run security audit: sudo lynis audit system"
echo "5. Check firewall status: sudo ufw status verbose"
echo "6. Monitor logs: sudo tail -f /var/log/auth.log"
echo "7. Set up monitoring alerts (optional)"
echo ""
echo -e "${YELLOW}OPTIONAL SECURITY ENHANCEMENTS:${NC}"
echo "• Set up 2FA for SSH (Google Authenticator)"
echo "• Install and configure AppArmor/SELinux"
echo "• Set up centralized logging (Elasticsearch, Splunk)"
echo "• Configure intrusion detection (OSSEC, Snort)"
echo "• Implement rate limiting at application level"
echo "• Regular security audits with Lynis"
echo ""
echo "=================================================="
