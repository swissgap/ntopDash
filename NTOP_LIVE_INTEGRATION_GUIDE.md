# 🎮 GAMING COMMAND CENTER - LIVE ntop Integration

## ✅ 100% LIVE DATA - KEINE DEMO/TEST/SIMULATION DATEN!

Alle Daten kommen direkt von ntop REST API v2!

---

## 📋 VERWENDETE ntop API ENDPOINTS

### ✅ Basierend auf offizieller ntop REST API v2 Dokumentation

```
1. Interface Data (Hauptstatistiken)
   GET /lua/rest/v2/get/interface/data.lua
   ├─ Throughput (bytes/sec)
   ├─ Packets sent/received
   ├─ Number of flows
   └─ Number of hosts

2. Active Hosts (Top Talkers)
   GET /lua/rest/v2/get/host/active.lua
   ├─ Sortierung nach Traffic
   ├─ Hostname, IP, MAC
   ├─ Bytes sent/received
   └─ Number of flows

3. Active Flows (NetFlow Monitoring)
   GET /lua/rest/v2/get/flow/active.lua
   ├─ Client/Server IPs
   ├─ Ports
   ├─ Protocol (L4/L7)
   └─ Bytes/Packets

4. L7 Application Statistics
   GET /lua/rest/v2/get/interface/l7/stats.lua
   ├─ nDPI Application Detection
   ├─ Traffic per Application
   └─ Flow count per Application

5. Top Local Talkers (PRO - optional)
   GET /lua/pro/rest/v2/get/interface/top/local/talkers.lua
   └─ Top 10 local hosts by traffic

6. Realtime Traffic (PRO - optional)
   GET /lua/pro/rest/v2/get/interface/top/realtime_traffic.lua
   └─ Real-time traffic statistics
```

---

## 🚀 SETUP

### 1. Environment Configuration

Erstelle `.env` Datei:

```env
# ntop Server Configuration
NTOP_HOST=localhost                    # ntop server IP/hostname
NTOP_PORT=3000                        # ntop web interface port
NTOP_PROTOCOL=http                    # http or https
NTOP_USER=admin                       # ntop username
NTOP_PASS=your_secure_password        # ntop password
NTOP_INTERFACE=0                      # Interface ID (0=first, 1=second, etc.)
NTOP_TIMEOUT=10000                    # API timeout in ms
NTOP_REJECT_UNAUTHORIZED=false        # Set to false for self-signed certs

# Server Configuration
PORT=3001                             # Gaming server port
```

### 2. Install Dependencies

```bash
npm install express axios cors
```

### 3. Start Server

```bash
# Development
node gaming_server_live.js

# Production (with PM2)
pm2 start gaming_server_live.js --name gaming-center

# With custom .env
node -r dotenv/config gaming_server_live.js
```

### 4. Access Dashboard

```bash
open http://localhost:3001/gaming_dashboard_live.html
```

---

## 🔌 API RESPONSE EXAMPLES

### GET /api/ntop/stats

```json
{
  "current_speed": 8.42,
  "uplink_percent": 84.2,
  "upload_gbps": 3.21,
  "download_gbps": 5.21,
  "total_bytes": 234000000000,
  "packets_sent": 15420000,
  "packets_rcvd": 18930000,
  "num_flows": 1247,
  "num_hosts": 42,
  "num_local_hosts": 35,
  "num_devices": 42,
  "interface_name": "eth0",
  "interface_speed": 10000,
  "peak_speed": 9.87,
  "avg_speed": 4.56,
  "uptime": 43200,
  "top_talkers": [
    {
      "rank": 1,
      "name": "gaming-pc.local",
      "ip": "192.168.1.50",
      "mac": "00:1A:2B:3C:4D:5E",
      "traffic": "8.42 Gbps",
      "traffic_bytes": 8420000000,
      "percent": "95.0",
      "bytes_sent": 4210000000,
      "bytes_rcvd": 4210000000,
      "num_flows": 247,
      "throughput": 8420000000,
      "is_local": true
    }
  ],
  "active_flows": [
    {
      "client": {
        "ip": "192.168.1.50",
        "port": 54321,
        "name": "gaming-pc.local"
      },
      "server": {
        "ip": "185.42.223.45",
        "port": 443,
        "name": "cdn.steamcontent.com"
      },
      "protocol": "TCP",
      "application": "Steam",
      "bytes": 524288000,
      "packets": 350000,
      "duration": 120,
      "throughput": 4369067
    }
  ],
  "active_flows_count": 1247,
  "top_applications": [
    {
      "name": "Steam",
      "bytes": 3500000000,
      "packets": 2500000,
      "flows": 125
    }
  ],
  "total_devices": 42,
  "local_devices": 35,
  "timestamp": 1706545234567,
  "data_source": "ntop_live",
  "interface_id": 0,
  "wifi_24ghz_clients": 0,
  "wifi_5ghz_clients": 0
}
```

### GET /api/ntop/toptalkers

```json
[
  {
    "rank": 1,
    "name": "gaming-pc.local",
    "ip": "192.168.1.50",
    "mac": "00:1A:2B:3C:4D:5E",
    "traffic": "8.42 Gbps",
    "traffic_bytes": 8420000000,
    "percent": "95.0",
    "bytes_sent": 4210000000,
    "bytes_rcvd": 4210000000,
    "num_flows": 247,
    "throughput": 8420000000,
    "is_local": true
  }
]
```

---

## 🔍 DATENFLUSS

```
┌─────────────────────────────────────────────────────────┐
│ 1. ntop sammelt NetFlow/sFlow/Packet Capture Daten     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. gaming_server_live.js ruft ntop REST API v2 auf     │
│    - GET /lua/rest/v2/get/interface/data.lua           │
│    - GET /lua/rest/v2/get/host/active.lua              │
│    - GET /lua/rest/v2/get/flow/active.lua              │
│    - GET /lua/rest/v2/get/interface/l7/stats.lua       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Server verarbeitet & aggregiert Daten               │
│    - Berechnet 10G Uplink Auslastung                   │
│    - Sortiert Top Talkers                              │
│    - Formatiert für Dashboard                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Dashboard empfängt via /api/ntop/stats              │
│    - Update alle 2 Sekunden                             │
│    - Kein Fallback auf Demo-Daten!                     │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ KONFIGURATION

### ntop Interface ID Ermitteln

```bash
# In ntop Web UI
# Settings → Preferences → Interfaces
# Notiere die Interface ID (meist 0, 1, 2, etc.)

# Oder via API
curl -u admin:password http://localhost:3000/lua/rest/v2/get/interface/data.lua?ifid=0
```

### Authentication

```bash
# Basic Auth Header wird automatisch generiert
# Format: Authorization: Basic base64(username:password)

# Test mit curl:
curl -u admin:password \
  http://localhost:3000/lua/rest/v2/get/interface/data.lua?ifid=0
```

### HTTPS mit Self-Signed Certificate

```env
# In .env
NTOP_PROTOCOL=https
NTOP_REJECT_UNAUTHORIZED=false  # Wichtig für self-signed certs!
```

---

## 🧪 TESTING

### 1. Test ntop Connection

```bash
# Health Check
curl http://localhost:3001/api/health

# Expected:
{
  "status": "online",
  "ntop_connected": true,
  "ntop_url": "http://localhost:3000",
  "ntop_interface": 0,
  "uptime": 123.45,
  "timestamp": 1706545234567
}
```

### 2. Test Live Data

```bash
# Get current stats
curl http://localhost:3001/api/ntop/stats

# Should return LIVE data with:
# - data_source: "ntop_live"
# - current_speed, uplink_percent, etc.
```

### 3. Test Top Talkers

```bash
# Get top 5 talkers
curl http://localhost:3001/api/ntop/toptalkers?limit=5
```

### 4. Test Active Flows

```bash
# Get active flows
curl http://localhost:3001/api/ntop/flows?limit=20
```

---

## 🐛 TROUBLESHOOTING

### Problem: "Cannot connect to ntop"

```bash
# Check ntop is running
systemctl status ntopng

# Check ntop is listening
netstat -tlnp | grep 3000

# Test ntop web interface
curl http://localhost:3000

# Test ntop API directly
curl -u admin:password http://localhost:3000/lua/rest/v2/get/interface/data.lua?ifid=0
```

### Problem: "Authentication Failed"

```bash
# Verify credentials in .env
cat .env | grep NTOP_USER
cat .env | grep NTOP_PASS

# Test credentials manually
curl -u YOUR_USER:YOUR_PASS http://localhost:3000/lua/rest/v2/get/interface/data.lua?ifid=0
```

### Problem: "INVALID_INTERFACE"

```bash
# Try different interface IDs
curl -u admin:password http://localhost:3000/lua/rest/v2/get/interface/data.lua?ifid=0
curl -u admin:password http://localhost:3000/lua/rest/v2/get/interface/data.lua?ifid=1
curl -u admin:password http://localhost:3000/lua/rest/v2/get/interface/data.lua?ifid=2
```

### Problem: Dashboard shows connection error

1. Check server logs:
   ```bash
   node gaming_server_live.js
   # Look for "ntop connection failed" messages
   ```

2. Check browser console (F12):
   ```
   Look for API errors
   ```

3. Test API endpoints:
   ```bash
   curl http://localhost:3001/api/health
   curl http://localhost:3001/api/config
   ```

---

## 📊 DATENMAPPING

### ntop Interface Data → Dashboard

```javascript
{
  // ntop field → Dashboard field
  throughput_bps → current_speed (converted to Gbps)
  eth.egress.bytes → upload_gbps (converted)
  eth.ingress.bytes → download_gbps (converted)
  num_flows → active_flows_count
  num_hosts → total_devices
  num_local_hosts → local_devices
  ifname → interface_name
  speed → interface_speed (Mbps)
}
```

### ntop Host Data → Top Talkers

```javascript
{
  // ntop field → Dashboard field
  name → name
  ip → ip
  mac → mac
  bytes.sent + bytes.rcvd → traffic_bytes
  throughput → throughput
  num_flows → num_flows
  localhost → is_local
}
```

### ntop Flow Data → Active Flows

```javascript
{
  // ntop field → Dashboard field
  'cli.ip' → client.ip
  'cli.port' → client.port
  'cli.name' → client.name
  'srv.ip' → server.ip
  'srv.port' → server.port
  'srv.name' → server.name
  proto/l4proto → protocol
  application/l7proto → application
  bytes → bytes
  packets → packets
  duration → duration
  throughput → throughput
}
```

---

## 🔒 SECURITY

### Best Practices

1. **Use Strong Password**
   ```env
   NTOP_PASS=ComplexPassword123!@#
   ```

2. **Use HTTPS if possible**
   ```env
   NTOP_PROTOCOL=https
   ```

3. **Restrict API Access**
   ```javascript
   // In gaming_server_live.js
   app.use(cors({
       origin: ['http://localhost:3001', 'https://your-domain.com']
   }));
   ```

4. **Use Environment Variables**
   ```bash
   # NEVER commit .env to git!
   echo ".env" >> .gitignore
   ```

5. **Firewall Rules**
   ```bash
   # Only allow localhost to access ntop API
   ufw allow from 127.0.0.1 to any port 3000
   ```

---

## 📈 PERFORMANCE

### Caching Strategy

```javascript
// 2-second cache per request
let dataCache = {
    data: null,
    timestamp: 0,
    ttl: 2000
};

// Dashboard updates every 2 seconds
setInterval(fetchNtopData, 2000);
```

### API Call Optimization

```javascript
// Parallel requests
await Promise.all([
    getInterfaceData(),
    getActiveHosts({ perPage: 10 }),
    getActiveFlows({ perPage: 20 }),
    getL7Stats()
]);
```

### Memory Usage

- **Server:** ~50-100 MB RAM
- **ntop Client:** Minimal overhead
- **Dashboard:** ~100-200 MB (browser)

---

## ✅ VERIFICATION CHECKLIST

### Before Gaming Day:

- [ ] ntop is running (`systemctl status ntopng`)
- [ ] `.env` configured with correct credentials
- [ ] Server starts without errors (`node gaming_server_live.js`)
- [ ] `/api/health` returns `ntop_connected: true`
- [ ] Dashboard shows LIVE data (not demo)
- [ ] `data_source` field equals `"ntop_live"`
- [ ] Top Talkers show real devices
- [ ] Active Flows show real connections
- [ ] Uplink gauge animates with real traffic
- [ ] No console errors in browser (F12)

### During Gaming Day:

- [ ] Dashboard updates every 2 seconds
- [ ] Speed changes reflect real traffic
- [ ] Top Talkers update when gaming starts
- [ ] Active Flows show game servers
- [ ] No "Connection Error" messages
- [ ] Uplink gauge responds to downloads

---

## 🎯 EXPECTED BEHAVIOR

### Startup

```
🎮 GAMING NETWORK COMMAND CENTER - API SERVER 🎮
✅ LIVE DATA ONLY - NO DEMO/TEST DATA!

🚀 Server: http://localhost:3001
📡 ntop: http://localhost:3000
🌐 Interface: 0
👤 User: admin

📊 Fetching LIVE data from ntop...
✅ Live data fetched successfully
   Devices: 42
   Flows: 1247
   Speed: 8.42 Gbps
```

### Dashboard Connection

```
📡 Connecting to ntop...
✅ Live data received
   data_source: "ntop_live"
   timestamp: 1706545234567
```

### Error State (if ntop unavailable)

```
❌ ntop Connection Error
Unable to connect to ntop API

Error: Cannot connect to ntop at http://localhost:3000
Time: 2024-01-29 17:30:00
Retries: 3/3

Troubleshooting:
- Check ntop is running
- Verify .env configuration
- Test ntop URL in browser
```

---

## 🚀 PRODUCTION DEPLOYMENT

### With PM2

```bash
# Start
pm2 start gaming_server_live.js --name gaming-center \
    --env production \
    --max-memory-restart 200M

# Monitor
pm2 monit

# Logs
pm2 logs gaming-center

# Auto-restart on reboot
pm2 startup
pm2 save
```

### With systemd

```bash
# /etc/systemd/system/gaming-center.service
[Unit]
Description=Gaming Network Command Center
After=network.target ntopng.service

[Service]
Type=simple
User=ntop
WorkingDirectory=/opt/gaming-center
Environment=NODE_ENV=production
EnvironmentFile=/opt/gaming-center/.env
ExecStart=/usr/bin/node gaming_server_live.js
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 📝 ZUSAMMENFASSUNG

### ✅ Was du bekommst:

1. **100% LIVE DATA** von ntop REST API v2
2. **KEINE Demo/Test/Simulation Daten**
3. **Real-Time Updates** (alle 2 Sekunden)
4. **Cyberpunk Dashboard** mit echten Metriken
5. **Top Talkers** von echten Hosts
6. **Active Flows** von echten Verbindungen
7. **10G Uplink Monitor** mit Live-Daten
8. **Error Handling** mit klaren Fehlermeldungen

### 🎯 Quick Start:

```bash
# 1. Configure
cp .env.example .env
# Edit .env with your ntop credentials

# 2. Start
node gaming_server_live.js

# 3. Open
open http://localhost:3001/gaming_dashboard_live.html

# 4. Verify
# Check status shows "LIVE" not "DEMO"
# Check console: "data_source: ntop_live"
```

**ALLES MIT ECHTEN LIVE-DATEN VON ntop! 🎉**
