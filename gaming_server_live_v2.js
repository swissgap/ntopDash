#!/usr/bin/env node
/**
 * Gaming Network Command Center - ntop API Integration v2.0
 * 
 * ✅ FIXED VERSION - Korrekte Datenverarbeitung für ntop REST API v2
 * ✅ LIVE DATA ONLY - NO DEMO/TEST/SIMULATION DATA!
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ============================================================================
// NTOP CONFIGURATION
// ============================================================================

const NTOP_CONFIG = {
    host: process.env.NTOP_HOST || '192.168.1.50',  // Default basierend auf deinem funktionierenden Beispiel
    port: process.env.NTOP_PORT || '3000',
    protocol: process.env.NTOP_PROTOCOL || 'http',
    username: process.env.NTOP_USER || 'admin',
    password: process.env.NTOP_PASS || 'admin',
    interface: parseInt(process.env.NTOP_INTERFACE || '1'),  // Default Interface 1 basierend auf deinem Beispiel
    timeout: parseInt(process.env.NTOP_TIMEOUT || '10000'),
    rejectUnauthorized: process.env.NTOP_REJECT_UNAUTHORIZED !== 'false'
};

const NTOP_BASE_URL = `${NTOP_CONFIG.protocol}://${NTOP_CONFIG.host}:${NTOP_CONFIG.port}`;

console.log('📡 ntop Configuration:');
console.log(`   URL: ${NTOP_BASE_URL}`);
console.log(`   Interface: ${NTOP_CONFIG.interface}`);
console.log(`   User: ${NTOP_CONFIG.username}`);

// ============================================================================
// NTOP API CLIENT
// ============================================================================

/**
 * Create axios instance with authentication
 */
const ntopClient = axios.create({
    baseURL: NTOP_BASE_URL,
    timeout: NTOP_CONFIG.timeout,
    auth: {
        username: NTOP_CONFIG.username,
        password: NTOP_CONFIG.password
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: NTOP_CONFIG.rejectUnauthorized
    })
});

/**
 * Make authenticated request to ntop API v2
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Query parameters
 * @returns {Promise<object>} API response data
 */
async function ntopRequest(endpoint, params = {}) {
    try {
        const fullParams = {
            ifid: NTOP_CONFIG.interface,
            ...params
        };
        
        console.log(`📡 ntop API: ${endpoint}`, fullParams);
        
        const response = await ntopClient.get(endpoint, {
            params: fullParams
        });
        
        // Check for ntop error codes in response
        if (response.data && response.data.rc !== undefined && response.data.rc !== 0) {
            throw new Error(`ntop API error: rc=${response.data.rc}, ${response.data.rc_str || response.data.rc_str_hr || 'Unknown error'}`);
        }
        
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error(`❌ ntop API error (${endpoint}):`, error.response.status, error.response.data);
            throw new Error(`ntop API error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            console.error(`❌ ntop connection error (${endpoint}):`, error.message);
            throw new Error(`Cannot connect to ntop at ${NTOP_BASE_URL}. Check if ntop is running and accessible.`);
        } else {
            console.error(`❌ Error (${endpoint}):`, error.message);
            throw error;
        }
    }
}

// ============================================================================
// NTOP API ENDPOINTS - LIVE DATA ONLY!
// ============================================================================

/**
 * Get interface statistics
 * Endpoint: /lua/rest/v2/get/interface/data.lua
 */
async function getInterfaceData() {
    const data = await ntopRequest('/lua/rest/v2/get/interface/data.lua');
    return data.rsp || {};
}

/**
 * Get active hosts (for top talkers)
 * Endpoint: /lua/rest/v2/get/host/active.lua
 */
async function getActiveHosts(params = {}) {
    const defaultParams = {
        currentPage: 1,
        perPage: 10,
        sortColumn: 'bytes',
        sortOrder: 'desc',
        ...params
    };
    
    const data = await ntopRequest('/lua/rest/v2/get/host/active.lua', defaultParams);
    return data.rsp || {};
}

/**
 * Get active flows
 * Endpoint: /lua/rest/v2/get/flow/active.lua
 */
async function getActiveFlows(params = {}) {
    const defaultParams = {
        currentPage: 1,
        perPage: 100,
        sortColumn: 'bytes',
        sortOrder: 'desc',
        ...params
    };
    
    const data = await ntopRequest('/lua/rest/v2/get/flow/active.lua', defaultParams);
    return data.rsp || {};
}

/**
 * Get L7 (application) statistics
 * Endpoint: /lua/rest/v2/get/interface/l7/stats.lua
 */
async function getL7Stats() {
    const data = await ntopRequest('/lua/rest/v2/get/interface/l7/stats.lua');
    return data.rsp || {};
}

// ============================================================================
// DATA PROCESSING - BASIEREND AUF ECHTEN NTOP RESPONSES
// ============================================================================

/**
 * Process interface data for dashboard
 * Basierend auf der echten ntop API Response-Struktur
 */
function processInterfaceData(interfaceData) {
    if (!interfaceData) return null;
    
    // Extrahiere Throughput (basierend auf echter API Response)
    const throughput = interfaceData.throughput || {};
    const downloadBps = throughput.download?.bps || 0;
    const uploadBps = throughput.upload?.bps || 0;
    const totalBps = interfaceData.throughput_bps || (downloadBps + uploadBps);
    
    // Konvertiere zu Gbps
    const downloadGbps = downloadBps / 1000000000;
    const uploadGbps = uploadBps / 1000000000;
    const totalGbps = totalBps / 1000000000;
    
    // Calculate for uplink (basierend auf Interface Speed)
    const interfaceSpeedMbps = interfaceData.speed || 1000;
    const uplinkCapacityGbps = interfaceSpeedMbps / 1000;
    const uplinkPercent = Math.min((totalGbps / uplinkCapacityGbps) * 100, 100);
    
    // Traffic stats
    const bytesDownload = interfaceData.bytes_download || 0;
    const bytesUpload = interfaceData.bytes_upload || 0;
    const totalBytes = interfaceData.bytes || (bytesDownload + bytesUpload);
    
    // Packet stats
    const packetsDownload = interfaceData.packets_download || 0;
    const packetsUpload = interfaceData.packets_upload || 0;
    const totalPackets = interfaceData.packets || (packetsDownload + packetsUpload);
    
    return {
        // Speed & Throughput
        current_speed: totalGbps,
        download_gbps: downloadGbps,
        upload_gbps: uploadGbps,
        uplink_percent: uplinkPercent,
        uplink_capacity_gbps: uplinkCapacityGbps,
        
        // Traffic totals
        total_bytes: totalBytes,
        bytes_download: bytesDownload,
        bytes_upload: bytesUpload,
        
        // Packet stats
        total_packets: totalPackets,
        packets_download: packetsDownload,
        packets_upload: packetsUpload,
        
        // Flow & Host counts
        num_flows: interfaceData.num_flows || 0,
        num_hosts: interfaceData.num_hosts || 0,
        num_local_hosts: interfaceData.num_local_hosts || 0,
        num_devices: interfaceData.num_devices || 0,
        
        // Interface info
        interface_id: interfaceData.ifid,
        interface_name: interfaceData.ifname || 'eth0',
        interface_speed: interfaceSpeedMbps,
        
        // Alert stats
        alerted_flows: interfaceData.alerted_flows || 0,
        engaged_alerts: interfaceData.engaged_alerts || 0,
        
        // System stats
        uptime: interfaceData.uptime || 'N/A',
        uptime_sec: interfaceData.uptime_sec || 0,
        
        // Additional stats
        drops: interfaceData.drops || 0,
        tcpPacketStats: interfaceData.tcpPacketStats || {}
    };
}

/**
 * Process active hosts for top talkers
 */
function processTopTalkers(hostsData) {
    if (!hostsData || !hostsData.data) {
        console.log('⚠️  No hosts data available');
        return [];
    }
    
    const hosts = hostsData.data;
    
    // Find max traffic for percentage calculation
    let maxTraffic = 0;
    hosts.forEach(host => {
        const totalBytes = (host.bytes?.sent || 0) + (host.bytes?.rcvd || 0);
        if (totalBytes > maxTraffic) maxTraffic = totalBytes;
    });
    
    if (maxTraffic === 0) maxTraffic = 1; // Avoid division by zero
    
    return hosts.slice(0, 10).map((host, index) => {
        const bytesSent = host.bytes?.sent || 0;
        const bytesRcvd = host.bytes?.rcvd || 0;
        const totalBytes = bytesSent + bytesRcvd;
        const trafficGbps = totalBytes / 1000000000;
        const percent = (totalBytes / maxTraffic) * 100;
        
        return {
            rank: index + 1,
            name: host.name || host.ip || 'Unknown',
            ip: host.ip || 'N/A',
            mac: host.mac || 'N/A',
            traffic: trafficGbps.toFixed(3) + ' Gbps',
            traffic_raw: totalBytes,
            bytes_sent: bytesSent,
            bytes_rcvd: bytesRcvd,
            percent: percent.toFixed(1),
            color: getColorForRank(index + 1)
        };
    });
}

/**
 * Process active flows
 */
function processActiveFlows(flowsData) {
    if (!flowsData || !flowsData.data) {
        console.log('⚠️  No flows data available');
        return [];
    }
    
    const flows = flowsData.data;
    
    return flows.slice(0, 50).map(flow => {
        const totalBytes = (flow.bytes?.sent || 0) + (flow.bytes?.rcvd || 0);
        const trafficMbps = (totalBytes * 8) / 1000000; // Convert bytes to Mbps
        
        return {
            src_ip: flow['cli.ip'] || flow.client || 'N/A',
            dst_ip: flow['srv.ip'] || flow.server || 'N/A',
            src_port: flow['cli.port'] || flow.client_port || 0,
            dst_port: flow['srv.port'] || flow.server_port || 0,
            protocol: flow.protocol || flow.l7proto || 'TCP',
            application: flow.l7proto_name || flow.application || 'Unknown',
            bytes: totalBytes,
            bytes_sent: flow.bytes?.sent || 0,
            bytes_rcvd: flow.bytes?.rcvd || 0,
            traffic_mbps: trafficMbps.toFixed(2),
            packets: (flow.packets?.sent || 0) + (flow.packets?.rcvd || 0),
            duration: flow.duration || 0
        };
    });
}

/**
 * Process L7 (application layer) statistics
 */
function processL7Stats(l7Data) {
    if (!l7Data || typeof l7Data !== 'object') {
        console.log('⚠️  No L7 data available');
        return [];
    }
    
    // Convert L7 stats object to array
    const apps = [];
    for (const [appName, stats] of Object.entries(l7Data)) {
        if (typeof stats === 'object' && stats.bytes) {
            const totalBytes = stats.bytes.sent + stats.bytes.rcvd;
            apps.push({
                name: appName,
                bytes: totalBytes,
                bytes_sent: stats.bytes.sent,
                bytes_rcvd: stats.bytes.rcvd,
                packets: (stats.packets?.sent || 0) + (stats.packets?.rcvd || 0),
                flows: stats.num_flows || 0
            });
        }
    }
    
    // Sort by bytes and take top 10
    apps.sort((a, b) => b.bytes - a.bytes);
    
    // Find max for percentage calculation
    const maxBytes = apps.length > 0 ? apps[0].bytes : 1;
    
    return apps.slice(0, 10).map((app, index) => {
        const trafficGbps = app.bytes / 1000000000;
        const percent = (app.bytes / maxBytes) * 100;
        
        return {
            rank: index + 1,
            name: app.name,
            traffic: trafficGbps.toFixed(3) + ' Gbps',
            traffic_raw: app.bytes,
            bytes_sent: app.bytes_sent,
            bytes_rcvd: app.bytes_rcvd,
            packets: app.packets,
            flows: app.flows,
            percent: percent.toFixed(1),
            color: getColorForRank(index + 1)
        };
    });
}

/**
 * Get color for ranking
 */
function getColorForRank(rank) {
    const colors = [
        '#00f3ff', // cyan
        '#ff00ff', // pink
        '#00ff41', // green
        '#ffff00', // yellow
        '#ff6600', // orange
        '#b000ff', // purple
        '#ff0066', // red-pink
        '#00ffff', // cyan-light
        '#ff3366', // red
        '#66ff00'  // lime
    ];
    return colors[rank - 1] || colors[0];
}

// ============================================================================
// STATISTICS TRACKING
// ============================================================================

let speedHistory = [];
const MAX_HISTORY = 30;

function updateStatistics(currentSpeed) {
    // Add to history
    speedHistory.push(currentSpeed);
    if (speedHistory.length > MAX_HISTORY) {
        speedHistory.shift();
    }
    
    // Calculate stats
    const sum = speedHistory.reduce((a, b) => a + b, 0);
    const avg = sum / speedHistory.length || 0;
    const max = Math.max(...speedHistory, 0);
    const min = Math.min(...speedHistory.filter(s => s > 0), currentSpeed);
    
    return {
        avg_speed: avg,
        max_speed: max,
        min_speed: min,
        speed_history: [...speedHistory]
    };
}

// ============================================================================
// MAIN DATA AGGREGATION
// ============================================================================

/**
 * Fetch and aggregate all dashboard data from ntop
 */
async function getDashboardData() {
    try {
        console.log('📊 Fetching LIVE data from ntop...');
        
        // Fetch all data in parallel
        const [interfaceData, hostsData, flowsData, l7Data] = await Promise.all([
            getInterfaceData(),
            getActiveHosts({ perPage: 15 }),
            getActiveFlows({ perPage: 100 }),
            getL7Stats()
        ]);
        
        // Process interface data
        const interfaceStats = processInterfaceData(interfaceData);
        
        if (!interfaceStats) {
            throw new Error('Failed to process interface data');
        }
        
        // Update statistics
        const stats = updateStatistics(interfaceStats.current_speed);
        
        // Process top talkers
        const topTalkers = processTopTalkers(hostsData);
        
        // Process flows
        const activeFlows = processActiveFlows(flowsData);
        
        // Process L7 stats
        const applications = processL7Stats(l7Data);
        
        // Combine all data
        const dashboardData = {
            // Interface stats
            ...interfaceStats,
            
            // Statistics
            ...stats,
            
            // Top talkers
            top_talkers: topTalkers,
            
            // Active flows
            active_flows: activeFlows,
            active_flows_count: interfaceStats.num_flows,
            
            // Applications
            top_applications: applications,
            
            // Device counts
            total_devices: interfaceStats.num_hosts,
            local_devices: interfaceStats.num_local_hosts,
            
            // Metadata
            timestamp: Date.now(),
            data_source: 'ntop_live',
            ntop_interface: NTOP_CONFIG.interface,
            ntop_interface_name: interfaceStats.interface_name,
            
            // WiFi stats (would need additional integration)
            wifi_24ghz_clients: 0, // TODO: Integrate with WiFi controller if available
            wifi_5ghz_clients: 0   // TODO: Integrate with WiFi controller if available
        };
        
        console.log('✅ Live data fetched successfully');
        console.log(`   Devices: ${dashboardData.total_devices}`);
        console.log(`   Flows: ${dashboardData.active_flows_count}`);
        console.log(`   Speed: ${dashboardData.current_speed.toFixed(2)} Gbps`);
        console.log(`   Top Talkers: ${topTalkers.length}`);
        console.log(`   Applications: ${applications.length}`);
        
        return dashboardData;
        
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error.message);
        throw error;
    }
}

// ============================================================================
// CACHE SYSTEM
// ============================================================================

let dataCache = {
    data: null,
    timestamp: 0,
    ttl: 2000 // 2 seconds cache
};

async function getCachedData() {
    const now = Date.now();
    
    // Return cache if valid
    if (dataCache.data && (now - dataCache.timestamp) < dataCache.ttl) {
        console.log('📦 Returning cached data');
        return dataCache.data;
    }
    
    // Fetch fresh data
    const data = await getDashboardData();
    
    // Update cache
    dataCache = {
        data: data,
        timestamp: now,
        ttl: 2000
    };
    
    return data;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Main stats endpoint - LIVE DATA ONLY!
 */
app.get('/api/ntop/stats', async (req, res) => {
    try {
        const stats = await getCachedData();
        res.json(stats);
    } catch (error) {
        console.error('Error in /api/ntop/stats:', error);
        res.status(503).json({
            error: 'Failed to fetch data from ntop',
            message: error.message,
            ntop_url: NTOP_BASE_URL,
            ntop_interface: NTOP_CONFIG.interface,
            suggestion: 'Check ntop connection and credentials. Run: node ntop_diagnostic.js'
        });
    }
});

/**
 * Top talkers endpoint
 */
app.get('/api/ntop/toptalkers', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const hostsData = await getActiveHosts({ perPage: limit });
        const topTalkers = processTopTalkers(hostsData);
        
        res.json(topTalkers);
    } catch (error) {
        console.error('Error in /api/ntop/toptalkers:', error);
        res.status(503).json({ error: error.message });
    }
});

/**
 * Active flows endpoint
 */
app.get('/api/ntop/flows', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const flowsData = await getActiveFlows({ perPage: limit });
        const flows = processActiveFlows(flowsData);
        
        res.json(flows);
    } catch (error) {
        console.error('Error in /api/ntop/flows:', error);
        res.status(503).json({ error: error.message });
    }
});

/**
 * L7 applications endpoint
 */
app.get('/api/ntop/applications', async (req, res) => {
    try {
        const l7Data = await getL7Stats();
        const applications = processL7Stats(l7Data);
        
        res.json(applications);
    } catch (error) {
        console.error('Error in /api/ntop/applications:', error);
        res.status(503).json({ error: error.message });
    }
});

/**
 * Health check
 */
app.get('/api/health', async (req, res) => {
    try {
        // Test ntop connection
        const interfaceData = await getInterfaceData();
        
        res.json({
            status: 'online',
            ntop_connected: true,
            ntop_url: NTOP_BASE_URL,
            ntop_interface: NTOP_CONFIG.interface,
            ntop_interface_name: interfaceData.ifname,
            ntop_hosts: interfaceData.num_hosts,
            ntop_flows: interfaceData.num_flows,
            uptime: process.uptime(),
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(503).json({
            status: 'degraded',
            ntop_connected: false,
            ntop_url: NTOP_BASE_URL,
            ntop_interface: NTOP_CONFIG.interface,
            error: error.message,
            uptime: process.uptime(),
            timestamp: Date.now()
        });
    }
});

/**
 * Configuration endpoint
 */
app.get('/api/config', (req, res) => {
    res.json({
        ntop_host: NTOP_CONFIG.host,
        ntop_port: NTOP_CONFIG.port,
        ntop_protocol: NTOP_CONFIG.protocol,
        ntop_interface: NTOP_CONFIG.interface,
        cache_ttl_ms: dataCache.ttl,
        data_source: 'ntop_live_only',
        version: '2.0-fixed'
    });
});

/**
 * Raw interface data endpoint (for debugging)
 */
app.get('/api/ntop/raw/interface', async (req, res) => {
    try {
        const data = await getInterfaceData();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});

/**
 * Raw hosts data endpoint (for debugging)
 */
app.get('/api/ntop/raw/hosts', async (req, res) => {
    try {
        const data = await getActiveHosts();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  🎮 GAMING NETWORK COMMAND CENTER v2.0 🎮            ║');
    console.log('║  ✅ FIXED VERSION - Korrekte Datenverarbeitung!      ║');
    console.log('║  ✅ LIVE DATA ONLY - NO DEMO/TEST DATA!              ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📡 ntop: ${NTOP_BASE_URL}`);
    console.log(`🌐 Interface: ${NTOP_CONFIG.interface}`);
    console.log(`👤 User: ${NTOP_CONFIG.username}`);
    console.log('');
    console.log('📋 Endpoints:');
    console.log(`   GET /api/ntop/stats        - Main dashboard data (LIVE)`);
    console.log(`   GET /api/ntop/toptalkers   - Top talkers (LIVE)`);
    console.log(`   GET /api/ntop/flows        - Active flows (LIVE)`);
    console.log(`   GET /api/ntop/applications - Application stats (LIVE)`);
    console.log(`   GET /api/health            - Health check`);
    console.log(`   GET /api/config            - Configuration`);
    console.log(`   GET /api/ntop/raw/interface - Raw interface data (DEBUG)`);
    console.log(`   GET /api/ntop/raw/hosts    - Raw hosts data (DEBUG)`);
    console.log('');
    console.log('🎯 Dashboard: http://localhost:' + PORT + '/gaming_dashboard_live.html');
    console.log('');
    console.log('⚠️  NOTE: All data comes from LIVE ntop API - NO demo data!');
    console.log('');
    
    // Test connection on startup
    console.log('🔍 Testing ntop connection...');
    getInterfaceData()
        .then((data) => {
            console.log('✅ ntop connection successful!');
            console.log(`   Interface: ${data.ifname} (ID: ${data.ifid})`);
            console.log(`   Speed: ${data.speed} Mbps`);
            console.log(`   Hosts: ${data.num_hosts}`);
            console.log(`   Flows: ${data.num_flows}`);
            console.log('');
            console.log('🎉 Ready to serve dashboard data!');
        })
        .catch((error) => {
            console.error('❌ ntop connection failed:', error.message);
            console.error('');
            console.error('💡 Troubleshooting:');
            console.error('   1. Check .env configuration');
            console.error('   2. Run diagnostic: node ntop_diagnostic.js');
            console.error('   3. Verify ntop is running: systemctl status ntopng');
            console.error('   4. Test API manually:');
            console.error(`      curl -u ${NTOP_CONFIG.username}:*** \\`);
            console.error(`        ${NTOP_BASE_URL}/lua/rest/v2/get/interface/data.lua?ifid=${NTOP_CONFIG.interface}`);
            console.error('');
        });
});

module.exports = app;
