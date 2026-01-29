#!/usr/bin/env node
/**
 * Quick API Test - Simple ntop Connection Test
 * Testet nur die wichtigsten Endpoints
 */

const axios = require('axios');
const https = require('https');
require('dotenv').config();

// Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// Config
const config = {
    host: process.env.NTOP_HOST || '192.168.1.50',
    port: process.env.NTOP_PORT || '3000',
    protocol: process.env.NTOP_PROTOCOL || 'http',
    username: process.env.NTOP_USER || 'admin',
    password: process.env.NTOP_PASS || 'admin',
    interface: parseInt(process.env.NTOP_INTERFACE || '1')
};

const BASE_URL = `${config.protocol}://${config.host}:${config.port}`;

console.log('\n🚀 Quick API Test\n');
console.log(`Testing: ${BASE_URL}`);
console.log(`Interface: ${config.interface}\n`);

async function quickTest() {
    try {
        // Test 1: Interface Data
        console.log(`${CYAN}📡 Testing Interface Data...${RESET}`);
        const response = await axios.get(`${BASE_URL}/lua/rest/v2/get/interface/data.lua`, {
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
        
        console.log(`${GREEN}✅ Connected!${RESET}\n`);
        
        // Show response structure
        console.log('Response structure:');
        console.log('  rc:', response.data.rc);
        console.log('  rc_str:', response.data.rc_str || response.data.rc_str_hr);
        console.log('  rsp exists:', !!response.data.rsp);
        console.log('');
        
        // Try to access data
        const data = response.data.rsp || response.data;
        
        if (data) {
            console.log(`${GREEN}Interface Data:${RESET}`);
            console.log(`  Name: ${data.ifname || 'N/A'}`);
            console.log(`  ID: ${data.ifid || config.interface}`);
            console.log(`  Speed: ${data.speed || 'N/A'} Mbps`);
            console.log(`  Hosts: ${data.num_hosts || 0}`);
            console.log(`  Flows: ${data.num_flows || 0}`);
            console.log(`  Throughput: ${((data.throughput_bps || 0) / 1000000).toFixed(2)} Mbps`);
            console.log(`  Uptime: ${data.uptime || 'N/A'}`);
            console.log('');
            
            // Test 2: Active Hosts
            console.log(`${CYAN}📡 Testing Active Hosts...${RESET}`);
            const hostsResponse = await axios.get(`${BASE_URL}/lua/rest/v2/get/host/active.lua`, {
                params: { ifid: config.interface, currentPage: 1, perPage: 5 },
                auth: {
                    username: config.username,
                    password: config.password
                },
                timeout: 5000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
            
            const hostsData = hostsResponse.data.rsp || hostsResponse.data;
            if (hostsData && hostsData.data) {
                console.log(`${GREEN}✅ Found ${hostsData.data.length} hosts${RESET}`);
                hostsData.data.slice(0, 3).forEach(host => {
                    console.log(`  - ${host.ip || host.name}: ${((host.bytes?.sent || 0) + (host.bytes?.rcvd || 0)) / 1024 / 1024} MB`);
                });
            } else {
                console.log(`${YELLOW}⚠️  No host data${RESET}`);
            }
            console.log('');
            
            // Test 3: Active Flows
            console.log(`${CYAN}📡 Testing Active Flows...${RESET}`);
            const flowsResponse = await axios.get(`${BASE_URL}/lua/rest/v2/get/flow/active.lua`, {
                params: { ifid: config.interface, currentPage: 1, perPage: 5 },
                auth: {
                    username: config.username,
                    password: config.password
                },
                timeout: 5000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
            
            const flowsData = flowsResponse.data.rsp || flowsResponse.data;
            if (flowsData && flowsData.data) {
                console.log(`${GREEN}✅ Found ${flowsData.data.length} flows${RESET}`);
                flowsData.data.slice(0, 3).forEach(flow => {
                    const src = flow['cli.ip'] || flow.client || 'N/A';
                    const dst = flow['srv.ip'] || flow.server || 'N/A';
                    const app = flow.l7proto_name || flow.application || 'N/A';
                    console.log(`  - ${src} → ${dst} (${app})`);
                });
            } else {
                console.log(`${YELLOW}⚠️  No flow data${RESET}`);
            }
            console.log('');
            
            // Success!
            console.log(`${GREEN}╔════════════════════════════════════════╗${RESET}`);
            console.log(`${GREEN}║  ✅ ALL TESTS PASSED!                 ║${RESET}`);
            console.log(`${GREEN}╚════════════════════════════════════════╝${RESET}`);
            console.log('');
            console.log('🎉 ntop API is working correctly!');
            console.log('');
            console.log('Next steps:');
            console.log(`  ${CYAN}node gaming_server_live_v2.js${RESET}`);
            console.log(`  ${CYAN}open http://localhost:3001/gaming_dashboard_live_v2.html${RESET}`);
            console.log('');
            
        } else {
            throw new Error('No data in response');
        }
        
    } catch (error) {
        console.error(`${RED}╔════════════════════════════════════════╗${RESET}`);
        console.error(`${RED}║  ❌ TEST FAILED                       ║${RESET}`);
        console.error(`${RED}╚════════════════════════════════════════╝${RESET}`);
        console.error('');
        console.error(`${RED}Error: ${error.message}${RESET}`);
        console.error('');
        
        if (error.response) {
            console.error(`HTTP Status: ${error.response.status}`);
            console.error(`Response:`, error.response.data);
        } else if (error.request) {
            console.error('No response received from server');
            console.error('');
            console.error('Troubleshooting:');
            console.error(`  1. Check if ntop is running: systemctl status ntopng`);
            console.error(`  2. Check if port is open: netstat -tlnp | grep ${config.port}`);
            console.error(`  3. Test manually: curl ${BASE_URL}`);
        }
        console.error('');
        process.exit(1);
    }
}

quickTest();
