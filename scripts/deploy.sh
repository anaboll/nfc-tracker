#!/bin/bash
set -e

echo "=== NFC Tracker - Deploy Script ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "BLAD: Brak pliku .env!"
    echo "Skopiuj .env.example do .env i uzupelnij wartosci"
    exit 1
fi

# Generate a random NEXTAUTH_SECRET if it's the default
source .env
if [[ "$NEXTAUTH_SECRET" == *"change-this"* ]]; then
    NEW_SECRET=$(openssl rand -hex 32)
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEW_SECRET|" .env
    echo "Wygenerowano nowy NEXTAUTH_SECRET"
fi

echo "1/4 - Budowanie obrazow Docker..."
docker compose build --no-cache app migrate

echo ""
echo "2/4 - Uruchamianie PostgreSQL..."
docker compose up -d postgres
echo "Czekam na gotownosc bazy..."
sleep 10

echo ""
echo "3/4 - Migracja bazy danych i seed..."
docker compose --profile setup run --rm migrate

echo ""
echo "4/4 - Uruchamianie aplikacji..."
docker compose up -d app

echo ""
echo "==================================="
echo "GOTOWE! Aplikacja dziala na porcie 3000"
echo ""
echo "Login: $ADMIN_EMAIL"
echo "Haslo: $ADMIN_PASSWORD"
echo "(Zmien haslo po pierwszym logowaniu!)"
echo ""
echo "Nastepne kroki:"
echo "  1. Skonfiguruj Cloudflare DNS (A record -> $(curl -s ifconfig.me))"
echo "  2. Uruchom nginx + certbot (patrz INSTRUKCJE.md)"
echo "==================================="
