#!/bin/bash
set -e

DOMAIN="twojnfc.pl"
EMAIL="admin@twojnfc.pl"

echo "=== SSL Setup for $DOMAIN ==="

# Step 1: Start nginx with HTTP only (for certbot challenge)
echo "1/3 - Tworzenie tymczasowej konfiguracji nginx (HTTP only)..."

# Create temp nginx config for certbot
cat > /tmp/nginx-temp.conf << 'NGINX'
user nginx;
worker_processes auto;
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name twojnfc.pl www.twojnfc.pl;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / {
            proxy_pass http://app:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
NGINX

# Use temp config
cp nginx.conf nginx.conf.backup
cp /tmp/nginx-temp.conf nginx.conf

echo "2/3 - Uruchamianie nginx i pobieranie certyfikatu..."
docker compose --profile production up -d nginx

sleep 5

docker compose --profile certbot run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email

echo "3/3 - Przywracanie pelnej konfiguracji nginx (HTTPS)..."
cp nginx.conf.backup nginx.conf
rm nginx.conf.backup

docker compose --profile production restart nginx

echo ""
echo "=== SSL GOTOWE! ==="
echo "Strona dostepna pod: https://$DOMAIN"
echo ""
echo "Auto-renewal certyfikatu - dodaj do crontab:"
echo "0 0 1 * * cd $(pwd) && docker compose --profile certbot run --rm certbot renew && docker compose --profile production restart nginx"
