#!/usr/bin/env node
/**
 * Gaming Network Command Center - ntop API Integration
 * 
 * ✅ LIVE DATA ONLY - NO DEMO/TEST/SIMULATION DATA!
 * Uses actual ntop REST API v2 endpoints
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');

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
    host: process.env.NTOP_HOST || '127.0.0.1',  // Use IPv4 instead of 'localhost'
    port: process.env.NTOP_PORT || '3000',
    protocol: process.env.NTOP_PROTOCOL || 'http',
    username: process.env.NTOP_USER || 'admin',
    password: process.env.NTOP_PASS || 'admin',
    interface: parseInt(process.env.NTOP_INTERFACE || '0'),
    timeout: parseInt(process.env.NTOP_TIMEOUT || '10000'),
    // For self-signed certificates
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
    headers: {
        'Authorization': 'Basic ' + Buffer.from(`${NTOP_CONFIG.username}:${NTOP_CONFIG.password}`).toString('base64')
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
            throw new Error(`ntop API error: rc=${response.data.rc}, ${response.data.rc_str || 'Unknown error'}`);
        }
        
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error(`❌ ntop API error (${endpoint}):`, error.response.status, error.response.data);
            throw new Error(`ntop API error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            console.error(`❌ ntop connection error (${endpoint}):`, error.message);
            throw new Error(`Cannot connect to ntop at ${NTOP_BASE_URL}`);
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
    return data.rsp || data;
}

/**
 * Get active hosts (for top talkers)
 * Endpoint: /lua/rest/v2/get/host/active.lua
 */
async function getActiveHosts(params = {}) {
    const defaultParams = {
        currentPage: 1,
        perPage: 10,
        sortColumn: 'traffic',
        sortOrder: 'desc',
        ...params
    };
    
    const data = await ntopRequest('/lua/rest/v2/get/host/active.lua', defaultParams);
    return data.rsp || data;
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
    return data.rsp || data;
}

/**
 * Get L7 (application) statistics
 * Endpoint: /lua/rest/v2/get/interface/l7/stats.lua
 */
async function getL7Stats() {
    const data = await ntopRequest('/lua/rest/v2/get/interface/l7/stats.lua');
    return data.rsp || data;
}

/**
 * Get top local talkers (PRO endpoint if available)
 * Endpoint: /lua/pro/rest/v2/get/interface/top/local/talkers.lua
 */
async function getTopLocalTalkers() {
    try {
        const data = await ntopRequest('/lua/pro/rest/v2/get/interface/top/local/talkers.lua');
        return data.rsp || data;
    } catch (error) {
        // Fallback to get/host/active if PRO endpoint not available
        console.log('ℹ️  PRO endpoint not available, using fallback');
        return null;
    }
}

/**
 * Get top realtime traffic (PRO endpoint if available)
 * Endpoint: /lua/pro/rest/v2/get/interface/top/realtime_traffic.lua
 */
async function getRealtimeTraffic() {
    try {
        const data = await ntopRequest('/lua/pro/rest/v2/get/interface/top/realtime_traffic.lua');
        return data.rsp || data;
    } catch (error) {
        console.log('ℹ️  Realtime traffic endpoint not available');
        return null;
    }
}

// ============================================================================
// DATA PROCESSING - REAL DATA ONLY!
// ============================================================================

/**
 * Process interface data for dashboard
 */
function processInterfaceData(interfaceData) {
    if (!interfaceData) return null;
    
    // Extract throughput (bytes per second)
    const throughputBps = interfaceData.throughput_bps || 0;
    const throughputGbps = throughputBps / 1000000000;
    
    // Extract traffic stats
    const bytesSent = interfaceData.eth?.egress?.bytes || interfaceData.bytes_sent || 0;
    const bytesRcvd = interfaceData.eth?.ingress?.bytes || interfaceData.bytes_rcvd || 0;
    
    // Calculate for 10G uplink
    const uplinkCapacityGbps = 10;
    const uplinkPercent = Math.min((throughputGbps / uplinkCapacityGbps) * 100, 100);
    
    return {
        current_speed: throughputGbps,
        uplink_percent: uplinkPercent,
        upload_gbps: bytesSent / 1000000000,
        download_gbps: bytesRcvd / 1000000000,
        total_bytes: (bytesSent + bytesRcvd),
        packets_sent: interfaceData.eth?.egress?.packets || interfaceData.packets_sent || 0,
        packets_rcvd: interfaceData.eth?.ingress?.packets || interfaceData.packets_rcvd || 0,
        num_flows: interfaceData.num_flows || 0,
        num_hosts: interfaceData.num_hosts || 0,
        num_local_hosts: interfaceData.num_local_hosts || 0,
        num_devices: interfaceData.num_devices || 0,
        interface_name: interfaceData.ifname || 'eth0',
        interface_speed: interfaceData.speed || 10000 // Mbps
    };
}

/**
 * Process active hosts for top talkers
 */
function processTopTalkers(hostsData) {
    if (!hostsData || !hostsData.data) return [];
    
    const hosts = hostsData.data;
    
    // Find max traffic for percentage calculation
    const maxTraffic = Math.max(...hosts.map(h => (h.bytes?.sent || 0) + (h.bytes?.rcvd || 0)), 1);
    
    return hosts.slice(0, 10).map((host, index) => {
        const totalBytes = (host.bytes?.sent || 0) + (host.bytes?.rcvd || 0);
        const trafficGbps = totalBytes / 1000000000;
        const percent = (totalBytes / maxTraffic) * 100;
        
        return {
            rank: index + 1,
            name: host.name || host.ip || 'Unknown',
            ip: host.ip || 'N/A',
            mac: host.mac || 'N/A',
            traffic: trafficGbps.toFixed(2) + ' Gbps',
            traffic_bytes: totalBytes,
            percent: percent.toFixed(1),
            bytes_sent: host.bytes?.sent || 0,
            bytes_rcvd: host.bytes?.rcvd || 0,
            num_flows: host.num_flows || 0,
            throughput: host.throughput || 0,
            is_local: host.localhost || false
        };
    });
}

/**
 * Process active flows
 */
function processActiveFlows(flowsData) {
    if (!flowsData || !flowsData.data) return [];
    
    const flows = flowsData.data;
    
    return flows.slice(0, 20).map(flow => ({
        client: {
            ip: flow['cli.ip'] || flow.client || 'N/A',
            port: flow['cli.port'] || 0,
            name: flow['cli.name'] || ''
        },
        server: {
            ip: flow['srv.ip'] || flow.server || 'N/A',
            port: flow['srv.port'] || 0,
            name: flow['srv.name'] || ''
        },
        protocol: flow.proto || flow.l4proto || 'Unknown',
        application: flow.application || flow.l7proto || 'Unknown',
        bytes: flow.bytes || 0,
        packets: flow.packets || 0,
        duration: flow.duration || 0,
        throughput: flow.throughput || 0
    }));
}

/**
 * Process L7 stats for application breakdown
 */
function processL7Stats(l7Data) {
    if (!l7Data) return [];
    
    // L7 data can be in different formats
    const stats = l7Data.applications || l7Data.ndpi || l7Data;
    
    if (!stats || typeof stats !== 'object') return [];
    
    // Convert to array and sort by traffic
    const applications = Object.entries(stats).map(([name, data]) => ({
        name: name,
        bytes: data.bytes || data.traffic || 0,
        packets: data.packets || 0,
        flows: data.num_flows || 0
    })).sort((a, b) => b.bytes - a.bytes);
    
    return applications.slice(0, 10);
}

// ============================================================================
// STATISTICS TRACKING
// ============================================================================

let statsHistory = {
    peak_speed: 0,
    avg_samples: [],
    max_samples: 30,
    start_time: Date.now()
};

function updateStatistics(currentSpeed) {
    // Track peak speed
    if (currentSpeed > statsHistory.peak_speed) {
        statsHistory.peak_speed = currentSpeed;
    }
    
    // Track average speed
    statsHistory.avg_samples.push(currentSpeed);
    if (statsHistory.avg_samples.length > statsHistory.max_samples) {
        statsHistory.avg_samples.shift();
    }
    
    const avgSpeed = statsHistory.avg_samples.reduce((a, b) => a + b, 0) / statsHistory.avg_samples.length;
    
    return {
        peak_speed: statsHistory.peak_speed,
        avg_speed: avgSpeed,
        uptime: Math.floor((Date.now() - statsHistory.start_time) / 1000)
    };
}

// ============================================================================
// MAIN DATA AGGREGATION
// ============================================================================

/**
 * Get all dashboard data - LIVE FROM NTOP!
 */
async function getDashboardData() {
    try {
        console.log('📊 Fetching LIVE data from ntop...');
        
        // Fetch all data in parallel
        const [interfaceData, hostsData, flowsData, l7Data] = await Promise.all([
            getInterfaceData(),
            getActiveHosts({ perPage: 10 }),
            getActiveFlows({ perPage: 20 }),
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
            interface_id: NTOP_CONFIG.interface,
            interface_name: interfaceStats.interface_name,
            
            // WiFi stats (would need additional integration)
            wifi_24ghz_clients: 0, // TODO: Integrate with WiFi controller
            wifi_5ghz_clients: 0   // TODO: Integrate with WiFi controller
        };
        
        console.log('✅ Live data fetched successfully');
        console.log(`   Devices: ${dashboardData.total_devices}`);
        console.log(`   Flows: ${dashboardData.active_flows_count}`);
        console.log(`   Speed: ${dashboardData.current_speed.toFixed(2)} Gbps`);
        
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
    ttl: 2000 // 2 seconds
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
            suggestion: 'Check ntop connection and credentials'
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
        await getInterfaceData();
        
        res.json({
            status: 'online',
            ntop_connected: true,
            ntop_url: NTOP_BASE_URL,
            ntop_interface: NTOP_CONFIG.interface,
            uptime: process.uptime(),
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(503).json({
            status: 'degraded',
            ntop_connected: false,
            ntop_url: NTOP_BASE_URL,
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
        uplink_capacity_gbps: 10,
        cache_ttl_ms: dataCache.ttl,
        data_source: 'ntop_live_only'
    });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  🎮 GAMING NETWORK COMMAND CENTER - API SERVER 🎮     ║');
    console.log('║  ✅ LIVE DATA ONLY - NO DEMO/TEST DATA!               ║');
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
    console.log('');
    console.log('🎯 Dashboard: http://localhost:' + PORT + '/gaming_command_center.html');
    console.log('');
    console.log('⚠️  NOTE: All data comes from LIVE ntop API - NO demo data!');
    console.log('');
    
    // Test connection on startup
    getInterfaceData()
        .then(() => {
            console.log('✅ ntop connection successful!');
        })
        .catch((error) => {
            console.error('❌ ntop connection failed:', error.message);
            console.error('   Check your .env configuration');
        });
});

module.exports = app;
