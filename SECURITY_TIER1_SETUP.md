# TIER 1 SECURITY HARDENING - SETUP GUIDE

## Overview
This document guides you through the TIER 1 security hardening implementation which includes:
1. Credential Management (Removed hardcoded passwords)
2. HTTPS Enforcement (Middleware + Security Headers)
3. Token Security (httpOnly Cookies via Sanctum)

---

## 1. Environment Setup

### Step 1.1: Backend Environment
```bash
cd isp-billing-backend

# For development
cp .env.example .env

# For production
cp .env.production .env.production
```

**Important - Update these variables in your .env:**
```env
APP_KEY=base64:YOUR_GENERATED_KEY
DB_PASSWORD=your_strong_password
ADMIN_PASSWORD=your_strong_admin_password
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
```

Generate APP_KEY:
```bash
php artisan key:generate
```

### Step 1.2: Frontend Environment
```bash
cd ../isp-billing-frontend

# For development
cp .env.example .env.local

# Update VITE_API_URL to match your backend
VITE_API_URL=http://localhost:8000  # or your backend domain
```

---

## 2. Docker Deployment

### Step 2.1: Using .env.docker
```bash
# Copy and configure docker environment
cp .env.docker .env.docker.local

# Edit .env.docker.local with your values:
# - DB_PASSWORD
# - APP_KEY
# - ADMIN_PASSWORD
# - SANCTUM_STATEFUL_DOMAINS
# - FRONTEND_URL
# - VITE_API_URL

# Start containers with security settings
docker compose --env-file .env.docker.local up -d --build
```

### Step 2.2: Database Migration & Seeding
```bash
# Run migrations with environment variables
docker exec -it billing-backend php artisan migrate --force

# Seed database (creates default admin user)
docker exec -it billing-backend php artisan db:seed

# Health check
curl http://localhost:8000/health
```

---

## 3. Security Features Implemented

### 3.1 Credential Management
✅ **Changes Made:**
- Removed hardcoded `DB_PASSWORD: root` from docker-compose.yml
- Updated to use `${DB_PASSWORD}` environment variable with required flag
- Moved database seeder passwords to environment variables
- Created `.env.production` template with production-grade security
- Dockerfile cleanup: Remove .git, .env files, and sensitive data

**Files Updated:**
- docker-compose.yml
- .env.example / .env.production
- database/seeders/DatabaseSeeder.php
- Dockerfile (multi-stage build)
- .env.docker (deployment template)

### 3.2 HTTPS Enforcement & Security Headers
✅ **Changes Made:**
- Created `ForceHttpsAndSecurityHeaders.php` middleware
- Registered middleware in bootstrap/app.php
- Added HSTS (HTTP Strict Transport Security)
- Added CSP (Content Security Policy)
- Added X-Frame-Options, X-Content-Type-Options
- Removed server version disclosure

**Middleware Features:**
```php
- Strict-Transport-Security: max-age=31536000
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: [restrictive policy]
- Referrer-Policy: strict-origin-when-cross-origin
```

**Enable in Production:**
Set `HTTPS_ONLY=true` in .env

### 3.3 Token Security (Sanctum httpOnly Cookies)
✅ **Changes Made:**
- Updated `config/sanctum.php`:
  - Added localhost:5173 to stateful domains
  - Set token expiration to 60 minutes (configurable)
- Updated `src/api.js` (frontend):
  - Enabled `withCredentials: true` for cookie-based auth
  - Added proper interceptors for session expiration
  - Graceful fallback to token-based auth if needed
- Updated `config/app.php`:
  - SESSION_ENCRYPT set to true
  - Proper domain/SameSite settings

**Benefits:**
- Cookies are httpOnly = not accessible via JavaScript (prevents XSS theft)
- Cookies are secure = only sent over HTTPS
- SameSite=lax = prevents CSRF attacks
- Token expiration = automatic session timeout after 60 minutes

---

## 4. Testing Security Setup

### Test 4.1: HTTPS Redirect (Production Only)
```bash
# Should redirect to HTTPS
curl -I http://yourdomain.com
# Should include HSTS header
curl -I https://yourdomain.com
# Expected header: Strict-Transport-Security: max-age=31536000
```

### Test 4.2: Security Headers
```bash
curl -I https://yourdomain.com/api/health

# Should show:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: ...
```

### Test 4.3: Authentication
```bash
# Login with new credentials
curl -X POST https://yourdomain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Verify httpOnly cookie is set (check Set-Cookie header)
```

### Test 4.4: Password Security
```bash
# Verify no hardcoded passwords in files
grep -r "DB_PASSWORD=root" .
grep -r "password.*=.*root" .
grep -r "admin123" .

# Should return no results
```

---

## 5. Production Checklist

Before deploying to production:

- [ ] Generate new APP_KEY: `php artisan key:generate`
- [ ] Set strong DB_PASSWORD (min 20 characters, mixed case, numbers, symbols)
- [ ] Set strong ADMIN_PASSWORD (min 16 characters)
- [ ] Update SANCTUM_STATEFUL_DOMAINS to your domain
- [ ] Configure SSL certificate (Let's Encrypt recommended)
- [ ] Set HTTPS_ONLY=true
- [ ] Set APP_DEBUG=false
- [ ] Set APP_ENV=production
- [ ] Configure MAIL settings for notifications
- [ ] Test database backup strategy
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Run seeders: `php artisan db:seed --class=DatabaseSeeder`
- [ ] Change admin password immediately after first login
- [ ] Setup log rotation for storage/logs
- [ ] Configure firewall to block direct database access
- [ ] Enable database SSL connection if remote DB
- [ ] Setup rate limiting for API endpoints (implemented in next TIER)

---

## 6. Migration Guide (From Old Setup)

If migrating from old insecure setup:

```bash
# 1. Backup existing database
docker exec billing-db mysqldump -u root -proot billing_db > backup.sql

# 2. Create new database with secure credentials
docker exec billing-db mysql -u root -proot \
  -e "CREATE USER 'billing_user'@'%' IDENTIFIED BY 'new_secure_password';"
docker exec billing-db mysql -u root -proot \
  -e "GRANT ALL PRIVILEGES ON billing_db.* TO 'billing_user'@'%';"

# 3. Restore data
docker exec -i billing-db mysql -u billing_user -pnew_secure_password billing_db < backup.sql

# 4. Update .env with new credentials
# 5. Remove old root user if needed
docker exec billing-db mysql -u root -proot \
  -e "DROP USER 'root'@'%';"
```

---

## 7. Troubleshooting

### Issue: HTTPS redirect loop
**Solution:** Ensure load balancer/reverse proxy properly forwards X-Forwarded-Proto header
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $remote_addr;
```

### Issue: Cookie not being set
**Solution:** Ensure frontend and backend domains match SANCTUM_STATEFUL_DOMAINS
- Frontend: https://yourdomain.com
- Backend: https://yourdomain.com (or same domain)

### Issue: 403 CSRF token mismatch
**Solution:** Ensure Sanctum middleware is properly configured and CSRF is not disabled

---

## 8. Next Steps

After completing TIER 1, proceed to TIER 2 security hardening:
- Input validation & sanitization
- Global rate limiting
- Debug mode hardening
- Database encryption at rest

See: [SECURITY_ROADMAP.md](../SECURITY_ROADMAP.md) for full plan

---

## 9. Support

For issues or questions:
1. Check logs: `docker logs billing-backend`
2. Run health check: `curl https://yourdomain.com/api/health`
3. Review security headers: `curl -I https://yourdomain.com/api`
4. Test authentication: Check browser DevTools > Cookies
