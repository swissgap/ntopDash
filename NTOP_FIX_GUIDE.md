# 🔧 ntop Connection Error - QUICK FIX GUIDE

## ❌ Error: "connect ECONNREFUSED ::1:3000"

### Problem: IPv6 localhost Resolution
Node.js versucht sich mit IPv6 `::1` zu verbinden statt IPv4 `127.0.0.1`

---

## ✅ LÖSUNG 1: .env Konfiguration (EMPFOHLEN)

### Schritt 1: Erstelle .env Datei

```bash
cd /opt/netMon  # oder dein Projekt-Verzeichnis

# Kopiere Template
cp .env.example .env

# Editiere .env
nano .env
```

### Schritt 2: Setze NTOP_HOST auf IPv4

```env
# ❌ FALSCH (verwendet IPv6)
NTOP_HOST=localhost

# ✅ RICHTIG (verwendet IPv4)
NTOP_HOST=127.0.0.1

# Komplette Konfiguration:
NTOP_HOST=127.0.0.1
NTOP_PORT=3000
NTOP_PROTOCOL=http
NTOP_USER=admin
NTOP_PASS=your_password
NTOP_INTERFACE=0
```

### Schritt 3: Starte Server neu

```bash
node gaming_server_live.js

# Sollte zeigen:
# ✅ ntop connection successful!
```

---

## ✅ LÖSUNG 2: Environment Variable

```bash
# Setze nur NTOP_HOST
export NTOP_HOST=127.0.0.1

# Starte Server
node gaming_server_live.js
```

---

## ✅ LÖSUNG 3: Inline beim Start

```bash
NTOP_HOST=127.0.0.1 node gaming_server_live.js
```

---

## 🧪 TESTEN VOR DEM START

### Quick Test mit curl

```bash
# Test 1: ntop läuft?
curl http://127.0.0.1:3000

# Test 2: ntop API erreichbar?
curl -u admin:password \
  http://127.0.0.1:3000/lua/rest/v2/get/interface/data.lua?ifid=0

# Test 3: Sollte JSON zurückgeben mit:
# {"rc":0,"rsp":{...}}
```

### Diagnostic Tool (EMPFOHLEN)

```bash
# Führe komplette Diagnose aus
node ntop_diagnostic.js

# Output sollte zeigen:
# ✅ DNS Resolution
# ✅ TCP Connection  
# ✅ HTTP Connection
# ✅ Authentication
# ✅ Interface Validation
# ✅ API Endpoints
```

---

## 🔍 WEITERE PROBLEME?

### Problem: ntop läuft nicht

```bash
# Check Status
systemctl status ntopng

# Start ntop
sudo systemctl start ntopng

# Enable auto-start
sudo systemctl enable ntopng
```

### Problem: Falscher Port

```bash
# Check welcher Port ntop verwendet
sudo netstat -tlnp | grep ntopng
# oder
sudo ss -tlnp | grep ntopng

# Sollte zeigen:
# tcp  0  0  0.0.0.0:3000  *  LISTEN  1234/ntopng
#                    ^^^^
#                   Dieser Port!

# Setze in .env:
NTOP_PORT=3000  # oder den gefundenen Port
```

### Problem: Firewall blockiert

```bash
# Check Firewall
sudo ufw status

# Erlaube Port 3000 (nur localhost)
sudo ufw allow from 127.0.0.1 to any port 3000

# Oder für alle (VORSICHT!)
sudo ufw allow 3000
```

### Problem: Falsche Credentials

```bash
# Test Credentials
curl -u admin:your_password http://127.0.0.1:3000

# Wenn 401 Unauthorized:
# → Username oder Passwort falsch
# → Check in ntop Web UI unter Settings → Users

# Update in .env:
NTOP_USER=your_username
NTOP_PASS=your_password
```

### Problem: Interface ID falsch

```bash
# Liste alle Interfaces
node ntop_diagnostic.js

# Suche in Output nach:
# 📋 Available interfaces:
#  → ID 0: eth0 (Primary Interface)
#    ID 1: wlan0 (WiFi Interface)

# Setze in .env:
NTOP_INTERFACE=0  # oder die gefundene ID
```

---

## ✅ VOLLSTÄNDIGER TEST-WORKFLOW

```bash
# 1. Check .env existiert
ls -la .env

# 2. Check Inhalt
cat .env | grep NTOP_HOST
# Sollte zeigen: NTOP_HOST=127.0.0.1

# 3. Check ntop läuft
systemctl status ntopng
# Sollte zeigen: active (running)

# 4. Test ntop Web UI
curl http://127.0.0.1:3000
# Sollte HTML zurückgeben

# 5. Run Diagnostic
node ntop_diagnostic.js
# Sollte: ✅ ALL TESTS PASSED!

# 6. Start Gaming Server
node gaming_server_live.js
# Sollte: ✅ ntop connection successful!

# 7. Open Dashboard
open http://localhost:3001/gaming_dashboard_live.html
# Sollte: ntop Status: LIVE (grün)
```

---

## 🎯 SCHNELL-FIX (Copy & Paste)

```bash
# Alles in einem!
cat > .env << 'EOF'
NTOP_HOST=127.0.0.1
NTOP_PORT=3000
NTOP_PROTOCOL=http
NTOP_USER=admin
NTOP_PASS=admin
NTOP_INTERFACE=0
EOF

# Test
node ntop_diagnostic.js

# Start
node gaming_server_live.js
```

---

## 📋 CHECKLIST

Vor dem Start prüfen:

- [ ] ✅ ntop läuft (`systemctl status ntopng`)
- [ ] ✅ .env Datei existiert (`ls -la .env`)
- [ ] ✅ NTOP_HOST=127.0.0.1 (NICHT localhost)
- [ ] ✅ NTOP_PORT stimmt (meist 3000)
- [ ] ✅ NTOP_USER korrekt (meist admin)
- [ ] ✅ NTOP_PASS korrekt
- [ ] ✅ curl test funktioniert
- [ ] ✅ ntop_diagnostic.js erfolgreich
- [ ] ✅ Server startet ohne Fehler
- [ ] ✅ Dashboard zeigt "LIVE"

---

## 🚨 HÄUFIGSTE FEHLER

### #1: localhost statt 127.0.0.1
```
❌ NTOP_HOST=localhost  
✅ NTOP_HOST=127.0.0.1
```

### #2: Falsches Passwort
```
❌ NTOP_PASS=admin (wenn geändert)
✅ NTOP_PASS=dein_echtes_passwort
```

### #3: ntop läuft nicht
```bash
# Check & Start
sudo systemctl start ntopng
```

### #4: Falsche Interface ID
```bash
# Use diagnostic tool
node ntop_diagnostic.js
# Zeigt verfügbare Interface IDs
```

### #5: Firewall blockiert
```bash
# Allow localhost
sudo ufw allow from 127.0.0.1 to any port 3000
```

---

## ✅ NACH DEM FIX

Erwartete Output:

```
🎮 GAMING NETWORK COMMAND CENTER - API SERVER 🎮
✅ LIVE DATA ONLY - NO DEMO/TEST DATA!

🚀 Server: http://localhost:3001
📡 ntop: http://127.0.0.1:3000
🌐 Interface: 0
👤 User: admin

📊 Fetching LIVE data from ntop...
✅ Live data fetched successfully
   Devices: 42
   Flows: 1247
   Speed: 8.42 Gbps

✅ ntop connection successful!
```

Dashboard zeigt:
- **ntop Status: LIVE** (grün)
- Echte Device-Zahlen
- Echte Flow-Zahlen
- Live Bandwidth Chart

---

## 💬 SUPPORT

Wenn alles nicht hilft:

```bash
# 1. Collect Debug Info
echo "=== System Info ===" > debug.txt
uname -a >> debug.txt
echo "" >> debug.txt

echo "=== ntop Status ===" >> debug.txt
systemctl status ntopng >> debug.txt
echo "" >> debug.txt

echo "=== Network Listening ===" >> debug.txt
netstat -tlnp | grep 3000 >> debug.txt
echo "" >> debug.txt

echo "=== .env Config ===" >> debug.txt
cat .env >> debug.txt
echo "" >> debug.txt

echo "=== Diagnostic Output ===" >> debug.txt
node ntop_diagnostic.js >> debug.txt 2>&1

# 2. Check debug.txt
cat debug.txt
```

**Dann hast du alle relevanten Infos zum Debuggen! 🔍**
