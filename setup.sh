#!/bin/bash

echo "🚀 Starting Nsoma DigLibs Setup..."

# 1. Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env 2>/dev/null || cat <<EOT >> .env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notes_management
DB_USER=notes_admin
DB_PASSWORD=secure_password_123
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || echo "change_this_secret")
JWT_EXPIRE=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ADMIN_EMAIL=admin@school.com
ADMIN_PASSWORD=Admin@123
EOT
    echo "✅ .env file created."
fi

# 2. Detect LAN IP
LAN_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
if [ -z "$LAN_IP" ]; then
    LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
echo "📡 Detected LAN IP: ${LAN_IP:-unknown}"

# 3. Setup HTTPS certificates with mkcert (for LAN PWA support)
setup_https() {
    echo "🔐 Setting up HTTPS certificates..."

    # Find or install mkcert
    MKCERT_CMD=$(which mkcert 2>/dev/null || echo "$HOME/.local/bin/mkcert")
    if [ ! -f "$MKCERT_CMD" ]; then
        echo "📥 Downloading mkcert..."
        mkdir -p "$HOME/.local/bin"
        curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64" 2>/dev/null
        chmod +x mkcert-v*-linux-amd64
        mv mkcert-v*-linux-amd64 "$HOME/.local/bin/mkcert"
        MKCERT_CMD="$HOME/.local/bin/mkcert"
    fi
    export PATH="$PATH:$HOME/.local/bin"

    "$MKCERT_CMD" -install 2>/dev/null || true

    # Generate cert for LAN IP + localhost
    mkdir -p certs
    if [ -n "$LAN_IP" ]; then
        (cd certs && "$MKCERT_CMD" "$LAN_IP" localhost 127.0.0.1)
        CERT_FILE=$(ls certs/*.pem 2>/dev/null | grep -v key | head -1)
        KEY_FILE=$(ls certs/*-key.pem 2>/dev/null | head -1)
        if [ -n "$CERT_FILE" ] && [ -n "$KEY_FILE" ]; then
            # Update .env with SSL paths
            sed -i '/^SSL_/d' .env
            echo "" >> .env
            echo "# HTTPS / SSL (mkcert — LAN)" >> .env
            echo "SSL_KEY_PATH=/app/certs/$(basename "$KEY_FILE")" >> .env
            echo "SSL_CERT_PATH=/app/certs/$(basename "$CERT_FILE")" >> .env
            echo "SSL_PORT=5443" >> .env
            echo "REDIRECT_HTTP_TO_HTTPS=false" >> .env
            echo "✅ SSL certificates generated."
            echo "📋 Copy the mkcert root CA to your phone:"
            "$MKCERT_CMD" -CAROOT 2>/dev/null && echo "(install rootCA.pem on each Android device to trust the cert)"
        fi
    else
        echo "⚠️  Could not detect LAN IP. Skipping certificate generation."
    fi
}

# Ask user if they want HTTPS
if [ ! -f certs/*.pem ] 2>/dev/null; then
    echo ""
    echo "💡 HTTPS is recommended for PWA features (Add to Home Screen on Android)."
    read -p "Set up HTTPS certificates? [Y/n] " yn
    case "$yn" in
        [nN]*) echo "Skipping HTTPS setup." ;;
        *) setup_https ;;
    esac
fi

# 4. Check for Docker
DOCKER_CMD=""
if command -v docker-compose &>/dev/null; then
    DOCKER_CMD="docker-compose"
elif docker compose version &>/dev/null; then
    DOCKER_CMD="docker compose"
fi

if [ -n "$DOCKER_CMD" ]; then
    echo "🐳 Docker detected ($DOCKER_CMD)! Starting containers..."
    $DOCKER_CMD up -d --build
    echo ""
    echo "✅ Nsoma DigLibs is running!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📍 Local:   http://localhost:5000"
    echo "  📍 HTTPS:   https://localhost:5443"
    if [ -n "$LAN_IP" ]; then
        echo "  📱 Phone:   https://${LAN_IP}:5443  ← open this on your phone"
    fi
    echo "  👤 Admin:   admin@school.com / Admin@123"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 To install on Android: open https://${LAN_IP}:5443 in Chrome → tap ⋮ → 'Add to home screen'"
else
    echo "⚠️  Docker Compose not found. Falling back to manual setup..."
    if ! command -v npm &>/dev/null; then
        echo "❌ Error: npm is not installed. Please install Node.js first."
        exit 1
    fi
    echo "📦 Installing dependencies..."
    npm install
    echo "🌱 Seeding admin account..."
    npm run seed
    echo "✅ Manual setup complete."
    echo "🚀 Start the app with: npm start"
fi
