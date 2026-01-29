#!/usr/bin/env node
/**
 * ntop Connection Diagnostic Tool
 * Tests ntop connection and helps debug issues
 */

const axios = require('axios');
const https = require('https');
const dns = require('dns').promises;
const net = require('net');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const config = {
    host: process.env.NTOP_HOST || '127.0.0.1',
    port: process.env.NTOP_PORT || '3000',
    protocol: process.env.NTOP_PROTOCOL || 'http',
    username: process.env.NTOP_USER || 'admin',
    password: process.env.NTOP_PASS || 'admin',
    interface: parseInt(process.env.NTOP_INTERFACE || '0')
};

console.log('');
log('╔════════════════════════════════════════════════════════╗', 'cyan');
log('║  🔍 ntop CONNECTION DIAGNOSTIC TOOL                   ║', 'cyan');
log('╚════════════════════════════════════════════════════════╝', 'cyan');
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
        
        // Try common alternatives
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
            reject(new Error('Connection timeout'));
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
                log(`      systemctl status ntopng`, 'yellow');
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
            log(`   Error: ${response.data.rc_str || 'Unknown'}`, 'yellow');
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
            }
        }
        
        throw error;
    }
}

/**
 * Test 5: Interface ID
 */
async function testInterface(authData) {
    log('', 'blue');
    log('📋 Test 5: Interface ID Validation', 'blue');
    log(`   Testing interface: ${config.interface}`, 'blue');
    
    if (!authData || !authData.rsp) {
        log(`   ⚠️  No interface data available`, 'yellow');
        return;
    }
    
    const ifData = authData.rsp;
    
    if (ifData.ifid !== undefined) {
        log(`   ✅ Interface ID ${config.interface} is valid`, 'green');
        log(`   Interface name: ${ifData.ifname || 'N/A'}`, 'green');
        log(`   Speed: ${ifData.speed || 'N/A'} Mbps`, 'green');
        log(`   Hosts: ${ifData.num_hosts || 0}`, 'green');
        log(`   Flows: ${ifData.num_flows || 0}`, 'green');
    } else {
        log(`   ⚠️  Could not validate interface`, 'yellow');
    }
    
    // Try to list available interfaces
    try {
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
            log(``, 'blue');
            log(`   📋 Available interfaces:`, 'cyan');
            response.data.rsp.forEach(iface => {
                const marker = iface.ifid === config.interface ? '→' : ' ';
                log(`   ${marker} ID ${iface.ifid}: ${iface.ifname} (${iface.ifDescription || 'No description'})`, 'cyan');
            });
        }
    } catch (error) {
        // Ignore errors here
    }
}

/**
 * Test 6: API Endpoints
 */
async function testAPIEndpoints() {
    log('', 'blue');
    log('📋 Test 6: API Endpoints', 'blue');
    
    const endpoints = [
        { path: '/lua/rest/v2/get/interface/data.lua', name: 'Interface Data' },
        { path: '/lua/rest/v2/get/host/active.lua', name: 'Active Hosts' },
        { path: '/lua/rest/v2/get/flow/active.lua', name: 'Active Flows' },
        { path: '/lua/rest/v2/get/interface/l7/stats.lua', name: 'L7 Stats' }
    ];
    
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
            } else {
                log(`   ⚠️  ${endpoint.name} - Error code: ${rc}`, 'yellow');
            }
        } catch (error) {
            log(`   ❌ ${endpoint.name} - ${error.message}`, 'red');
        }
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
        
        // Summary
        console.log('');
        log('╔════════════════════════════════════════════════════════╗', 'green');
        log('║  ✅ ALL TESTS PASSED!                                 ║', 'green');
        log('╚════════════════════════════════════════════════════════╝', 'green');
        console.log('');
        log('🎉 ntop connection is working correctly!', 'green');
        log('   You can now start the Gaming Command Center:', 'green');
        log('   node gaming_server_live.js', 'cyan');
        console.log('');
        
    } catch (error) {
        // Summary
        console.log('');
        log('╔════════════════════════════════════════════════════════╗', 'red');
        log('║  ❌ DIAGNOSTICS FAILED                                ║', 'red');
        log('╚════════════════════════════════════════════════════════╝', 'red');
        console.log('');
        log('💡 Troubleshooting Steps:', 'yellow');
        console.log('');
        log('1. Check ntop is running:', 'yellow');
        log('   systemctl status ntopng', 'cyan');
        console.log('');
        log('2. Check ntop is listening:', 'yellow');
        log('   netstat -tlnp | grep 3000', 'cyan');
        log('   # or', 'yellow');
        log('   ss -tlnp | grep 3000', 'cyan');
        console.log('');
        log('3. Test ntop web interface:', 'yellow');
        log(`   curl ${config.protocol}://${config.host}:${config.port}`, 'cyan');
        console.log('');
        log('4. Check your .env configuration:', 'yellow');
        log('   cat .env', 'cyan');
        console.log('');
        log('5. Verify firewall settings:', 'yellow');
        log('   sudo ufw status', 'cyan');
        console.log('');
        
        process.exit(1);
    }
}

// Print configuration
console.log('Configuration:');
console.log(`  Protocol: ${config.protocol}`);
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Username: ${config.username}`);
console.log(`  Password: ${'*'.repeat(config.password.length)}`);
console.log(`  Interface: ${config.interface}`);
console.log('');

// Run diagnostics
runDiagnostics();
