#!/usr/bin/env node
/**
 * ntop Connection Diagnostic Tool v2.0
 * Tests ntop connection and helps debug issues
 * 
 * ✅ IMPROVED: Bessere Tests basierend auf echter ntop API v2
 */

const axios = require('axios');
const https = require('https');
const dns = require('dns').promises;
const net = require('net');
require('dotenv').config();

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration from .env or defaults
const config = {
    host: process.env.NTOP_HOST || '192.168.1.50',
    port: process.env.NTOP_PORT || '3000',
    protocol: process.env.NTOP_PROTOCOL || 'http',
    username: process.env.NTOP_USER || 'admin',
    password: process.env.NTOP_PASS || 'admin',
    interface: parseInt(process.env.NTOP_INTERFACE || '1')
};

console.log('');
log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
log('║  🔍 ntop CONNECTION DIAGNOSTIC TOOL v2.0                 ║', 'cyan');
log('║  ✅ IMPROVED: Bessere Tests für ntop REST API v2         ║', 'cyan');
log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
console.log('');

// ============================================================================
// DIAGNOSTIC TESTS
// ============================================================================

/**
 * Test 1: DNS Resolution
 */
async function testDNS() {
    log('📋 Test 1: DNS Resolution', 'blue');
    log(`   Resolving: ${config.host}`, 'blue');
    
    try {
        if (net.isIP(config.host)) {
            log(`   ✅ ${config.host} is already an IP address`, 'green');
            return config.host;
        }
        
        const addresses = await dns.resolve4(config.host);
        log(`   ✅ Resolved to: ${addresses[0]}`, 'green');
        return addresses[0];
    } catch (error) {
        log(`   ❌ DNS resolution failed: ${error.message}`, 'red');
        
        // Suggestions
        if (config.host === 'localhost') {
            log(`   💡 Suggestion: Try using 127.0.0.1 instead of localhost`, 'yellow');
            log(`      export NTOP_HOST=127.0.0.1`, 'yellow');
        }
        
        throw error;
    }
}

/**
 * Test 2: TCP Connection
 */
async function testTCP(host) {
    log('', 'blue');
    log('📋 Test 2: TCP Connection', 'blue');
    log(`   Testing: ${host}:${config.port}`, 'blue');
    
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
            socket.destroy();
            reject(new Error('Connection timeout (5 seconds)'));
        }, 5000);
        
        socket.connect(config.port, host, () => {
            clearTimeout(timeout);
            socket.destroy();
            log(`   ✅ TCP connection successful`, 'green');
            resolve();
        });
        
        socket.on('error', (error) => {
            clearTimeout(timeout);
            log(`   ❌ TCP connection failed: ${error.message}`, 'red');
            
            if (error.code === 'ECONNREFUSED') {
                log(`   💡 ntop is not listening on port ${config.port}`, 'yellow');
                log(`      Check if ntop is running:`, 'yellow');
                log(`      systemctl status ntopng`, 'cyan');
            } else if (error.code === 'ETIMEDOUT') {
                log(`   💡 Connection timeout - firewall or network issue?`, 'yellow');
            } else if (error.code === 'EHOSTUNREACH') {
                log(`   💡 Host unreachable - check network connectivity`, 'yellow');
            }
            
            reject(error);
        });
    });
}

/**
 * Test 3: HTTP/HTTPS Connection
 */
async function testHTTP() {
    log('', 'blue');
    log('📋 Test 3: HTTP/HTTPS Connection', 'blue');
    
    const url = `${config.protocol}://${config.host}:${config.port}`;
    log(`   Testing: ${url}`, 'blue');
    
    try {
        const response = await axios.get(url, {
            timeout: 5000,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            validateStatus: () => true // Accept any status
        });
        
        log(`   ✅ HTTP connection successful`, 'green');
        log(`   Status: ${response.status} ${response.statusText}`, 'green');
        
        if (response.status === 401) {
            log(`   ℹ️  Authentication required (this is expected)`, 'cyan');
        } else if (response.status === 200) {
            log(`   ℹ️  Server accessible (might have no auth or public page)`, 'cyan');
        }
        
        return true;
    } catch (error) {
        log(`   ❌ HTTP connection failed: ${error.message}`, 'red');
        
        if (error.code === 'ECONNREFUSED') {
            log(`   💡 ntop web interface is not accessible`, 'yellow');
        } else if (error.code === 'ENOTFOUND') {
            log(`   💡 Host not found`, 'yellow');
        } else if (error.code === 'ETIMEDOUT') {
            log(`   💡 Connection timeout - firewall blocking?`, 'yellow');
        }
        
        throw error;
    }
}

/**
 * Test 4: Authentication
 */
async function testAuth() {
    log('', 'blue');
    log('📋 Test 4: Authentication', 'blue');
    log(`   User: ${config.username}`, 'blue');
    log(`   Pass: ${'*'.repeat(config.password.length)}`, 'blue');
    
    const url = `${config.protocol}://${config.host}:${config.port}/lua/rest/v2/get/interface/data.lua`;
    
    try {
        const response = await axios.get(url, {
            params: { ifid: config.interface },
            auth: {
                username: config.username,
                password: config.password
            },
            timeout: 5000,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        
        log(`   ✅ Authentication successful`, 'green');
        log(`   Response code: ${response.data.rc || 0}`, 'green');
        
        if (response.data.rc !== 0 && response.data.rc !== undefined) {
            log(`   ⚠️  API returned error code: ${response.data.rc}`, 'yellow');
            log(`   Error: ${response.data.rc_str || response.data.rc_str_hr || 'Unknown'}`, 'yellow');
        } else {
            log(`   Response: ${response.data.rc_str_hr || response.data.rc_str || 'OK'}`, 'green');
        }
        
        return response.data;
    } catch (error) {
        log(`   ❌ Authentication failed: ${error.message}`, 'red');
        
        if (error.response) {
            if (error.response.status === 401) {
                log(`   💡 Invalid username or password`, 'yellow');
                log(`      Check NTOP_USER and NTOP_PASS in .env`, 'yellow');
            } else if (error.response.status === 403) {
                log(`   💡 Access forbidden - insufficient permissions`, 'yellow');
            } else if (error.response.status === 404) {
                log(`   💡 API endpoint not found - check ntop version`, 'yellow');
            }
        }
        
        throw error;
    }
}

/**
 * Test 5: Interface ID Validation
 */
async function testInterface(authData) {
    log('', 'blue');
    log('📋 Test 5: Interface ID Validation', 'blue');
    log(`   Testing interface: ${config.interface}`, 'blue');
    
    // Try to get interface data if not provided
    let ifData = null;
    
    if (authData && authData.rsp) {
        ifData = authData.rsp;
    } else {
        // Try to fetch it directly
        try {
            const url = `${config.protocol}://${config.host}:${config.port}/lua/rest/v2/get/interface/data.lua`;
            const response = await axios.get(url, {
                params: { ifid: config.interface },
                auth: {
                    username: config.username,
                    password: config.password
                },
                timeout: 5000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
            ifData = response.data.rsp || response.data;
        } catch (error) {
            log(`   ⚠️  Could not fetch interface data: ${error.message}`, 'yellow');
        }
    }
    
    if (!ifData) {
        log(`   ⚠️  No interface data available`, 'yellow');
        log(`   💡 This might be OK - continuing with other tests...`, 'cyan');
        return;
    }
    
    if (ifData.ifid !== undefined || ifData.ifname !== undefined) {
        log(`   ✅ Interface ID ${config.interface} is valid`, 'green');
        log(`   Interface name: ${ifData.ifname || 'N/A'}`, 'green');
        log(`   Speed: ${ifData.speed || 'N/A'} Mbps`, 'green');
        log(`   Hosts: ${ifData.num_hosts || 0}`, 'green');
        log(`   Flows: ${ifData.num_flows || 0}`, 'green');
        
        if (ifData.throughput_bps !== undefined) {
            log(`   Throughput: ${(ifData.throughput_bps / 1000000).toFixed(2)} Mbps`, 'green');
        }
        
        // Show uptime
        if (ifData.uptime) {
            log(`   Uptime: ${ifData.uptime}`, 'green');
        }
    } else {
        log(`   ⚠️  Could not validate interface`, 'yellow');
    }
    
    // Try to list available interfaces
    try {
        log('', 'blue');
        log(`   🔍 Fetching list of available interfaces...`, 'cyan');
        
        const listUrl = `${config.protocol}://${config.host}:${config.port}/lua/rest/v2/get/interfaces/data.lua`;
        const response = await axios.get(listUrl, {
            auth: {
                username: config.username,
                password: config.password
            },
            timeout: 5000,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        
        if (response.data && response.data.rsp) {
            log(`   📋 Available interfaces:`, 'cyan');
            response.data.rsp.forEach(iface => {
                const marker = iface.ifid === config.interface ? '→' : ' ';
                const active = iface.ifid === config.interface ? ' (CURRENT)' : '';
                log(`   ${marker} ID ${iface.ifid}: ${iface.ifname} - ${iface.ifDescription || 'No description'}${active}`, 'cyan');
            });
        }
    } catch (error) {
        log(`   ⚠️  Could not fetch interface list: ${error.message}`, 'yellow');
    }
}

/**
 * Test 6: API Endpoints
 */
async function testAPIEndpoints() {
    log('', 'blue');
    log('📋 Test 6: API Endpoints', 'blue');
    
    const endpoints = [
        { path: '/lua/rest/v2/get/interface/data.lua', name: 'Interface Data', critical: true },
        { path: '/lua/rest/v2/get/host/active.lua', name: 'Active Hosts', critical: true },
        { path: '/lua/rest/v2/get/flow/active.lua', name: 'Active Flows', critical: true },
        { path: '/lua/rest/v2/get/interface/l7/stats.lua', name: 'L7 Stats', critical: false },
        { path: '/lua/rest/v2/get/interfaces/data.lua', name: 'Interfaces List', critical: false }
    ];
    
    let criticalFailed = false;
    
    for (const endpoint of endpoints) {
        try {
            const url = `${config.protocol}://${config.host}:${config.port}${endpoint.path}`;
            const response = await axios.get(url, {
                params: { ifid: config.interface },
                auth: {
                    username: config.username,
                    password: config.password
                },
                timeout: 5000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
            
            const rc = response.data.rc;
            if (rc === 0 || rc === undefined) {
                log(`   ✅ ${endpoint.name}`, 'green');
                
                // Show some stats for interesting endpoints
                if (endpoint.path.includes('host/active') && response.data.rsp) {
                    const hostCount = response.data.rsp.perPage || 0;
                    log(`      Found ${hostCount} hosts`, 'cyan');
                } else if (endpoint.path.includes('flow/active') && response.data.rsp) {
                    const flowCount = response.data.rsp.perPage || 0;
                    log(`      Found ${flowCount} flows`, 'cyan');
                }
            } else {
                const level = endpoint.critical ? 'red' : 'yellow';
                const symbol = endpoint.critical ? '❌' : '⚠️';
                log(`   ${symbol} ${endpoint.name} - Error code: ${rc}`, level);
                if (endpoint.critical) criticalFailed = true;
            }
        } catch (error) {
            const level = endpoint.critical ? 'red' : 'yellow';
            const symbol = endpoint.critical ? '❌' : '⚠️';
            log(`   ${symbol} ${endpoint.name} - ${error.message}`, level);
            if (endpoint.critical) criticalFailed = true;
        }
    }
    
    if (criticalFailed) {
        throw new Error('One or more critical API endpoints failed');
    }
}

/**
 * Test 7: Sample Data Quality
 */
async function testDataQuality() {
    log('', 'blue');
    log('📋 Test 7: Data Quality Check', 'blue');
    
    try {
        // Get interface data
        const url = `${config.protocol}://${config.host}:${config.port}/lua/rest/v2/get/interface/data.lua`;
        const response = await axios.get(url, {
            params: { ifid: config.interface },
            auth: {
                username: config.username,
                password: config.password
            },
            timeout: 5000,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        
        const data = response.data.rsp || response.data;
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response structure - no data object found');
        }
        
        // Check critical fields
        const checks = [
            { field: 'ifname', value: data.ifname, required: true },
            { field: 'speed', value: data.speed, required: true },
            { field: 'throughput_bps', value: data.throughput_bps, required: true },
            { field: 'num_hosts', value: data.num_hosts, required: true },
            { field: 'num_flows', value: data.num_flows, required: true },
            { field: 'bytes', value: data.bytes, required: true },
            { field: 'packets', value: data.packets, required: true }
        ];
        
        let allGood = true;
        
        for (const check of checks) {
            if (check.value !== undefined && check.value !== null) {
                log(`   ✅ ${check.field}: ${check.value}`, 'green');
            } else {
                const level = check.required ? 'red' : 'yellow';
                const symbol = check.required ? '❌' : '⚠️';
                log(`   ${symbol} ${check.field}: Missing or undefined`, level);
                if (check.required) allGood = false;
            }
        }
        
        if (!allGood) {
            throw new Error('Critical data fields are missing');
        }
        
        log('   ✅ All critical data fields present', 'green');
        
    } catch (error) {
        log(`   ❌ Data quality check failed: ${error.message}`, 'red');
        throw error;
    }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runDiagnostics() {
    let resolvedHost = config.host;
    
    try {
        // Test 1: DNS
        resolvedHost = await testDNS();
        
        // Test 2: TCP
        await testTCP(resolvedHost);
        
        // Test 3: HTTP
        await testHTTP();
        
        // Test 4: Auth
        const authData = await testAuth();
        
        // Test 5: Interface
        await testInterface(authData);
        
        // Test 6: API Endpoints
        await testAPIEndpoints();
        
        // Test 7: Data Quality
        await testDataQuality();
        
        // Summary
        console.log('');
        log('╔═══════════════════════════════════════════════════════════╗', 'green');
        log('║  ✅ ALL TESTS PASSED!                                    ║', 'green');
        log('╚═══════════════════════════════════════════════════════════╝', 'green');
        console.log('');
        log('🎉 ntop connection is working perfectly!', 'green');
        log('   Your configuration is correct and all API endpoints are accessible.', 'green');
        console.log('');
        log('📝 Next steps:', 'cyan');
        log('   1. Start the Gaming Command Center server:', 'cyan');
        log('      node gaming_server_live_v2.js', 'magenta');
        console.log('');
        log('   2. Open the dashboard in your browser:', 'cyan');
        log('      http://localhost:3001/gaming_dashboard_live.html', 'magenta');
        console.log('');
        log('   3. Enjoy real-time network monitoring! 🎮', 'cyan');
        console.log('');
        
        process.exit(0);
        
    } catch (error) {
        // Summary
        console.log('');
        log('╔═══════════════════════════════════════════════════════════╗', 'red');
        log('║  ❌ DIAGNOSTICS FAILED                                   ║', 'red');
        log('╚═══════════════════════════════════════════════════════════╝', 'red');
        console.log('');
        log('💡 Troubleshooting Steps:', 'yellow');
        console.log('');
        
        log('1. Check your .env configuration:', 'yellow');
        log('   cat .env', 'cyan');
        log('   Make sure these are set correctly:', 'yellow');
        log(`   - NTOP_HOST=${config.host}`, 'cyan');
        log(`   - NTOP_PORT=${config.port}`, 'cyan');
        log(`   - NTOP_USER=${config.username}`, 'cyan');
        log(`   - NTOP_INTERFACE=${config.interface}`, 'cyan');
        console.log('');
        
        log('2. Check if ntop is running:', 'yellow');
        log('   systemctl status ntopng', 'cyan');
        log('   If not running:', 'yellow');
        log('   sudo systemctl start ntopng', 'cyan');
        console.log('');
        
        log('3. Check if ntop is listening on the correct port:', 'yellow');
        log('   netstat -tlnp | grep 3000', 'cyan');
        log('   # or', 'yellow');
        log('   ss -tlnp | grep 3000', 'cyan');
        console.log('');
        
        log('4. Test ntop web interface manually:', 'yellow');
        log(`   curl -u ${config.username}:YOUR_PASSWORD \\`, 'cyan');
        log(`     ${config.protocol}://${config.host}:${config.port}/lua/rest/v2/get/interface/data.lua?ifid=${config.interface}`, 'cyan');
        console.log('');
        
        log('5. Check firewall settings:', 'yellow');
        log('   sudo ufw status', 'cyan');
        log('   If blocked, allow the port:', 'yellow');
        log(`   sudo ufw allow ${config.port}`, 'cyan');
        console.log('');
        
        log('6. Verify ntop REST API is enabled:', 'yellow');
        log('   Open ntop web UI and check Settings > Preferences', 'yellow');
        log('   Make sure REST API is enabled', 'yellow');
        console.log('');
        
        process.exit(1);
    }
}

// Print configuration
console.log('Configuration loaded from .env:');
console.log(`  Protocol: ${config.protocol}`);
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Username: ${config.username}`);
console.log(`  Password: ${'*'.repeat(config.password.length)}`);
console.log(`  Interface: ${config.interface}`);
console.log('');
log('Starting diagnostics...', 'cyan');
console.log('');

// Run diagnostics
runDiagnostics();
