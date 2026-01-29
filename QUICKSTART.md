# 🚀 QUICK START - Gaming Network Command Center v2.0

## ⚡ 3 Schritte zur funktionierenden Installation

### 1️⃣ Setup ausführen
```bash
./setup.sh
```
Das war's! Das Script führt dich durch alles.

---

## 🔧 Oder manuell in 60 Sekunden:

### Schritt 1: Dependencies installieren
```bash
npm install
```

### Schritt 2: .env erstellen
```bash
cat > .env << 'EOF'
NTOP_HOST=192.168.1.50
NTOP_PORT=3000
NTOP_PROTOCOL=http
NTOP_USER=admin
NTOP_PASS=admin
NTOP_INTERFACE=1
NTOP_TIMEOUT=10000
NTOP_REJECT_UNAUTHORIZED=false
PORT=3001
EOF
```

**⚠️ WICHTIG: Passe diese Werte an:**
- `NTOP_HOST` → Deine ntop IP-Adresse
- `NTOP_PASS` → Dein ntop Passwort
- `NTOP_INTERFACE` → Deine Interface-ID (meist 0, 1, oder 2)

### Schritt 3: Verbindung testen
```bash
node ntop_diagnostic_v2.js
```

**Erwartete Ausgabe:**
```
✅ ALL TESTS PASSED!
🎉 ntop connection is working perfectly!
```

### Schritt 4: Server starten
```bash
node gaming_server_live_v2.js
```

### Schritt 5: Dashboard öffnen
```
http://localhost:3001/gaming_dashboard_live.html
```

---

## 🆘 Häufigste Probleme & Lösungen

### ❌ "Cannot connect to ntop"
```bash
# Prüfe ob ntop läuft
systemctl status ntopng

# Starte ntop falls nötig
sudo systemctl start ntopng
```

### ❌ "Authentication failed"
```bash
# Teste Credentials
curl -u admin:DEIN_PASSWORD \
  http://192.168.1.50:3000/lua/rest/v2/get/interface/data.lua?ifid=1

# Falls 401 → Falsches Passwort, ändere in .env
```

### ❌ "Interface not found" oder "Empty data"
```bash
# Finde die richtige Interface-ID
node ntop_diagnostic_v2.js
# Zeigt alle verfügbaren Interfaces

# Update .env mit korrekter ID
nano .env  # Ändere NTOP_INTERFACE=X
```

### ❌ "connect ECONNREFUSED ::1:3000"
```bash
# Problem: localhost wird zu IPv6 aufgelöst
# Lösung: Verwende IPv4-Adresse in .env
NTOP_HOST=192.168.1.50  # oder 127.0.0.1
```

---

## 🎯 Checkliste

Prüfe diese 5 Punkte:

- [ ] ntop läuft: `systemctl status ntopng` → ✅ active (running)
- [ ] Port offen: `curl http://192.168.1.50:3000` → ✅ HTML Response
- [ ] .env existiert: `cat .env` → ✅ Zeigt Konfiguration
- [ ] Interface ID korrekt: `node ntop_diagnostic_v2.js` → ✅ Zeigt Interface
- [ ] Credentials korrekt: Diagnostic Test → ✅ Authentication successful

---

## 💡 Deine funktionierende API:

```bash
curl -u admin:password \
  http://192.168.1.50:3000/lua/rest/v2/get/interface/data.lua?ifid=1
```

**Daraus folgt diese .env:**
```env
NTOP_HOST=192.168.1.50    # Deine IP
NTOP_PORT=3000            # Dein Port
NTOP_INTERFACE=1          # Deine Interface-ID
NTOP_USER=admin           # Dein Username
NTOP_PASS=dein_password   # Dein Password
```

---

## 📞 Support

**Problem weiterhin da?**

Führe aus und sende das Ergebnis:
```bash
node ntop_diagnostic_v2.js > diagnostic.log 2>&1
cat diagnostic.log
```

---

## ✅ Erfolg!

Wenn du das siehst, läuft alles:

```
╔════════════════════════════════════════════════════════╗
║  🎮 GAMING NETWORK COMMAND CENTER v2.0 🎮            ║
╚════════════════════════════════════════════════════════╝

🚀 Server: http://localhost:3001
📡 ntop: http://192.168.1.50:3000
✅ ntop connection successful!
   Interface: eth0 (ID: 1)
   Hosts: 39
   Flows: 51
🎉 Ready to serve dashboard data!
```

**Dashboard zeigt:**
- ✅ ntop Status: LIVE (grün)
- ✅ Echte Geräte-Zahlen
- ✅ Echte Traffic-Daten
- ✅ Live Charts

🎮 **Happy Monitoring!** 🚀
