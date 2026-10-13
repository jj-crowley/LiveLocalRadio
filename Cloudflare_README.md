# Route666.live Home Server + Cloudflare Tunnel Install Guide

This guide explains how to run Route666.live from a home server or home laptop while publishing it safely through Cloudflare Tunnel.

The main idea:

- Your Route666 app runs locally on the machine at `http://127.0.0.1:3000`.
- nginx listens locally on port `80` and proxies requests to the app.
- `cloudflared` creates an outbound tunnel from your home machine to Cloudflare.
- Visitors go to `https://route666.live`.
- Cloudflare handles the public HTTPS certificate.
- Your home machine does not need a public HTTPS certificate from Let's Encrypt.
- You do not need to open inbound ports on your router for normal Cloudflare Tunnel use.

Official Cloudflare references:

- Cloudflare Tunnel overview: https://developers.cloudflare.com/tunnel/
- Cloudflare Tunnel setup: https://developers.cloudflare.com/tunnel/setup/
- Cloudflare Tunnel routing: https://developers.cloudflare.com/tunnel/routing/
- Locally managed tunnel CLI setup: https://developers.cloudflare.com/tunnel/advanced/local-management/create-local-tunnel/

## 1. Assumptions

This guide assumes:

- Domain: `route666.live`
- Production server path: `/var/www/route666`
- Linux user: `jjcrowley`
- App service name: `route666`
- nginx listens on local HTTP port `80`
- Next.js app listens on local port `3000`
- Cloudflare Tunnel public hostname points to `http://localhost:80`

Adjust names if your server user, domain, or directory are different.

## 2. Cloudflare Account And DNS

Before touching the server:

1. Create or log in to a Cloudflare account.
2. Add your domain, for example `route666.live`, to Cloudflare.
3. At your domain registrar, set the domain nameservers to the nameservers Cloudflare gives you.
4. Wait until Cloudflare says the domain is active.

With Cloudflare Tunnel, you do not need an A record pointing to your home IP. Cloudflare will create a tunnel-backed DNS record that points to a `cfargotunnel.com` target.

## 3. Prepare The Ubuntu Server

SSH into the server or open a terminal on the home machine.

Update the system:

```bash
sudo apt update
sudo apt upgrade
```

Install system packages:

```bash
sudo apt install nginx sqlite3 curl ca-certificates gnupg build-essential rsync
```

Enable nginx:

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

Check nginx:

```bash
sudo nginx -t
sudo systemctl status nginx
```

## 4. Install Node.js

Route666 uses Node's built-in `node:sqlite` module. Use Node `22.5+`; Node `24+` is recommended.

One simple way is NodeSource. Check NodeSource documentation if you want a different major version.

Example for Node 24:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install nodejs
```

Check versions:

```bash
node -v
npm -v
```

You should see Node `v24...` or another version newer than `22.5`.

## 5. Create The Website Directory

Create the production directory:

```bash
sudo mkdir -p /var/www/route666
sudo chown -R jjcrowley:www-data /var/www/route666
```

Create runtime directories:

```bash
cd /var/www/route666
mkdir -p data storage/uploads storage/radio storage/videos
```

Set group permissions:

```bash
sudo chown -R jjcrowley:www-data /var/www/route666
sudo chmod -R g+rw /var/www/route666/data /var/www/route666/storage
sudo find /var/www/route666/data /var/www/route666/storage -type d -exec chmod g+rwx {} \;
```

## 6. Copy Route666 Code To Production

From your dev machine, run:

```bash
rsync -avz \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'data/*.db' \
  --exclude 'data/*.db-*' \
  --exclude 'data/backups/' \
  --exclude 'storage/uploads/' \
  --exclude 'storage/radio/' \
  --exclude 'storage/videos/' \
  /Users/jcrowley/Sites/route666/ \
  jjcrowley@route666:/var/www/route666/
```

Important:

- Do not add `--delete` for normal updates.
- Do not overwrite production `data/route666.db`.
- Do not overwrite production `storage/uploads`, `storage/radio`, or `storage/videos`.
- Those directories contain artists, songs, uploaded photos, radio schedules, videos, messages, admin accounts, and site settings.
- The trailing `/` on the runtime directory excludes matters. It prevents rsync from touching those production directories or their `.gitkeep` files.

## 7. Install App Dependencies

On production:

```bash
cd /var/www/route666
npm install
```

If you see:

```text
sh: 1: next: not found
```

it means dependencies are missing. Run `npm install`.

## 8. Initialize The SQLite Database

On production:

```bash
cd /var/www/route666
npm run db:init
```

This creates missing tables and indexes. It does not erase existing data.

Do not run this unless you intentionally want a fresh database:

```bash
npm run db:init -- --backup-reset
```

That command backs up and replaces the database for testing.

## 9. Build The Website

On production:

```bash
cd /var/www/route666
npm run build
```

Avoid running `npm run build` with `sudo`. If you build as root, `.next` files may become root-owned and cause permission problems later.

If you already built with `sudo`, fix ownership:

```bash
sudo chown -R jjcrowley:www-data /var/www/route666
```

## 10. Create The Route666 systemd Service

Create the systemd service:

```bash
sudo nano /etc/systemd/system/route666.service
```

Paste:

```ini
[Unit]
Description=Route666.live Next.js app
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/route666
Environment=NODE_ENV=production
Environment=ROUTE666_DB_PATH=/var/www/route666/data/route666.db
Environment=ROUTE666_UPLOAD_DIR=/var/www/route666/storage/uploads
Environment=ROUTE666_RADIO_DIR=/var/www/route666/storage/radio
Environment=ROUTE666_TIME_ZONE=America/Denver
Environment=ROUTE666_VIDEO_DIR=/var/www/route666/storage/videos
Environment=ROUTE666_BAND_VIDEO_FILE=band-video.mp4
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable route666
sudo systemctl restart route666
sudo systemctl status route666
```

Check logs:

```bash
sudo journalctl -u route666 -n 80 --no-pager
```

At this point the app should be running locally:

```bash
curl -I http://127.0.0.1:3000
```

## 11. Configure nginx For Cloudflare Tunnel

For Cloudflare Tunnel, use HTTP-only nginx on the origin. Do not configure Let's Encrypt certificates on the home server unless you are intentionally exposing nginx directly to the internet.

Create the nginx site:

```bash
sudo nano /etc/nginx/sites-available/route666.live
```

Paste:

```nginx
server {
    listen 80;
    server_name route666.live www.route666.live;

    client_max_body_size 200m;

    location /uploads/ {
        alias /var/www/route666/storage/uploads/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public";
    }

    location /radio/_root/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }

    location /radio/ {
        alias /var/www/route666/storage/radio/;
        access_log off;
        expires 1d;
        add_header Cache-Control "public";
        types {
            audio/mpeg mp3;
        }
    }

    location /videos/id/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }

    location /videos/ {
        alias /var/www/route666/storage/videos/;
        access_log off;
        expires 1d;
        add_header Cache-Control "public";
        types {
            video/mp4 mp4;
            video/webm webm;
            video/ogg ogg ogv;
        }
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/route666.live /etc/nginx/sites-enabled/route666.live
```

If the default site is still enabled, disable it:

```bash
sudo rm /etc/nginx/sites-enabled/default
```

Test and restart nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

Test local nginx:

```bash
curl -I http://127.0.0.1
```

## 12. Install cloudflared

Cloudflare's official apt setup for Debian/Ubuntu:

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update
sudo apt-get install cloudflared
```

Check:

```bash
cloudflared --version
```

## 13. Create A Cloudflare Tunnel Using The Dashboard

This is the easiest production setup.

1. Open the Cloudflare dashboard.
2. Go to your account.
3. Go to **Zero Trust**.
4. Go to **Networks** or **Networking**.
5. Open **Tunnels**.
6. Click **Create a tunnel**.
7. Choose **Cloudflared**.
8. Name it something like:

```text
route666-home
```

9. Choose Linux as the environment.
10. Cloudflare will show a command like:

```bash
sudo cloudflared service install <TUNNEL_TOKEN>
```

Run that exact command on your server.

Then check:

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 80 --no-pager
```

## 14. Publish The Website Through The Tunnel

In the Cloudflare tunnel dashboard:

1. Open the tunnel you created.
2. Add a route or public hostname.
3. Hostname:

```text
route666.live
```

4. Service type:

```text
HTTP
```

5. Service URL:

```text
http://localhost:80
```

6. Save.

Add another public hostname for `www` if you want:

```text
www.route666.live
```

Service URL:

```text
http://localhost:80
```

Cloudflare should automatically create tunnel-backed DNS records.

## 15. Cloudflare SSL/TLS Settings

Because Cloudflare is public-facing and nginx is local HTTP behind the tunnel:

- Public users still see HTTPS.
- nginx does not need a cert.
- Do not use the nginx `listen 443 ssl` config on the home server.

Recommended Cloudflare settings:

1. SSL/TLS mode should be compatible with tunnel HTTP origin.
2. Enable **Always Use HTTPS** if available.
3. Keep DNS records proxied through Cloudflare.
4. Do not expose your home IP with an A record unless you intentionally want direct origin access.

If you see Cloudflare error `525`, Cloudflare is trying to negotiate HTTPS with your origin. For this tunnel setup, route the tunnel service to:

```text
http://localhost:80
```

not:

```text
https://localhost:443
```

## 16. Create The First Admin Account

On production:

```bash
cd /var/www/route666
npm run admin:create -- username strong-password
```

Then log in at:

```text
https://route666.live/admin/login
```

If login fails, check the database being used by the service:

```bash
sudo systemctl cat route666
sqlite3 /var/www/route666/data/route666.db "SELECT id, username, created_at FROM admin_users;"
```

If the service uses a different `ROUTE666_DB_PATH`, query that database instead.

## 17. Directory Ownership And Permissions

The app runs as `www-data` in the systemd service. It must be able to write:

- `data/`
- `storage/uploads/`
- `storage/radio/`
- `storage/videos/`

Run after deploys:

```bash
sudo chown -R jjcrowley:www-data /var/www/route666
sudo chmod -R g+rw /var/www/route666/data /var/www/route666/storage
sudo find /var/www/route666/data /var/www/route666/storage -type d -exec chmod g+rwx {} \;
```

## 18. Safe Updates From Dev To Production

From the dev machine:

```bash
rsync -avz \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'data/*.db' \
  --exclude 'data/*.db-*' \
  --exclude 'data/backups/' \
  --exclude 'storage/uploads/' \
  --exclude 'storage/radio/' \
  --exclude 'storage/videos/' \
  /Users/jcrowley/Sites/route666/ \
  jjcrowley@route666:/var/www/route666/
```

Then on production:

```bash
cd /var/www/route666
npm install
npm run db:init
npm run build
sudo chown -R jjcrowley:www-data /var/www/route666
sudo chmod -R g+rw /var/www/route666/data /var/www/route666/storage
sudo find /var/www/route666/data /var/www/route666/storage -type d -exec chmod g+rwx {} \;
sudo systemctl restart route666
sudo systemctl status route666
```

The trailing `/` on `storage/uploads/`, `storage/radio/`, and `storage/videos/` keeps rsync from touching the production runtime directories themselves. Do not add `--delete` to the rsync command unless you have already backed up production `data/` and `storage/`.

## 19. Backups

Back up SQLite:

```bash
cd /var/www/route666
mkdir -p data/backups
sqlite3 data/route666.db ".backup 'data/backups/route666.db.manual-backup'"
```

Back up uploaded media and radio folders:

```bash
cd /var/www/route666
tar -czf data/backups/storage.manual-backup.tar.gz storage
```

Copy backups off the home server occasionally:

```bash
rsync -avz jjcrowley@route666:/var/www/route666/data/backups/ ~/Route666Backups/
```

## 20. Logs And Troubleshooting

Route666 app logs:

```bash
sudo journalctl -u route666 -n 120 --no-pager
sudo journalctl -u route666 -f
```

nginx logs:

```bash
sudo tail -n 120 /var/log/nginx/error.log
sudo tail -n 120 /var/log/nginx/access.log
```

cloudflared logs:

```bash
sudo journalctl -u cloudflared -n 120 --no-pager
sudo journalctl -u cloudflared -f
```

Check services:

```bash
sudo systemctl status route666
sudo systemctl status nginx
sudo systemctl status cloudflared
```

Check local app:

```bash
curl -I http://127.0.0.1:3000
```

Check local nginx:

```bash
curl -I http://127.0.0.1
```

Check public site:

```bash
curl -I https://route666.live
```

### `next: not found`

Run:

```bash
cd /var/www/route666
npm install
```

### nginx cannot load `/etc/letsencrypt/live/.../fullchain.pem`

You are using an HTTPS nginx config without a local certificate.

For Cloudflare Tunnel, use the HTTP-only nginx config in this guide. Do not use:

```nginx
listen 443 ssl;
ssl_certificate ...
```

### Cloudflare error 525

Cloudflare is trying to speak HTTPS to the origin but the origin does not have a valid cert.

For this setup, the tunnel service should be:

```text
http://localhost:80
```

### Cloudflare error 502 or 1033

Check:

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 120 --no-pager
sudo systemctl status nginx
sudo systemctl status route666
```

### Admin login keeps failing

Check admin users:

```bash
cd /var/www/route666
sqlite3 data/route666.db "SELECT id, username, created_at FROM admin_users;"
```

Check service DB path:

```bash
sudo systemctl cat route666
```

Reset admin users if needed:

```bash
cd /var/www/route666
sqlite3 data/route666.db "DELETE FROM admin_sessions; DELETE FROM admin_users;"
npm run admin:create -- username strong-password
sudo systemctl restart route666
```

### Uploaded songs/photos do not save

Fix permissions:

```bash
sudo chown -R jjcrowley:www-data /var/www/route666
sudo chmod -R g+rw /var/www/route666/data /var/www/route666/storage
sudo find /var/www/route666/data /var/www/route666/storage -type d -exec chmod g+rwx {} \;
sudo systemctl restart route666
```

## 21. Optional: Locally Managed Cloudflare Tunnel CLI Setup

The dashboard/token setup above is usually easiest. If you prefer managing a tunnel config file locally, use this route.

Authenticate:

```bash
cloudflared tunnel login
```

Create tunnel:

```bash
cloudflared tunnel create route666-home
```

Create config directory:

```bash
sudo mkdir -p /etc/cloudflared
```

Copy the generated credentials JSON into `/etc/cloudflared/`. Cloudflare prints the path when the tunnel is created.

Create config:

```bash
sudo nano /etc/cloudflared/config.yml
```

Example:

```yaml
tunnel: route666-home
credentials-file: /etc/cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: route666.live
    service: http://localhost:80
  - hostname: www.route666.live
    service: http://localhost:80
  - service: http_status:404
```

Create DNS routes:

```bash
cloudflared tunnel route dns route666-home route666.live
cloudflared tunnel route dns route666-home www.route666.live
```

Install as a service:

```bash
sudo cloudflared service install
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

## 22. Security Notes

- Keep `/admin/*` protected by login.
- Use strong admin passwords.
- Do not commit `data/*.db`.
- Do not commit real uploads from `storage/`.
- Do not expose port `3000` publicly.
- Do not expose your home IP if using Cloudflare Tunnel.
- Keep `cloudflared`, Node, nginx, and system packages updated.
- Back up `data/route666.db` and `storage/` regularly.

Update cloudflared if installed through apt:

```bash
sudo apt-get update
sudo apt-get install --only-upgrade cloudflared
sudo systemctl restart cloudflared
```
