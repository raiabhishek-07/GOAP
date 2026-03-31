'use client';

import React from 'react';
import CodeClashTactical from './CodeClashTactical';

/**
 * TEST MODE: LEVEL 1/1 INTEGRATION
 * 
 * Target: /test
 * Description: A standalone version of the tactical cockpit HUD and level 1 gameplay.
 * Dev: Antigravity Systems
 */

export default function IntegrationTestPage() {
    return (
        <main style={{ 
            minHeight: '100vh', 
            backgroundColor: '#020617', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '40px'
        }}>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ 
                    color: '#22c55e', 
                    fontSize: '28px', 
                    marginBottom: '10px', 
                    letterSpacing: '8px',
                    fontFamily: '"Courier New", monospace',
                    fontWeight: 'black'
                }}>
                    MISSION_DEPLOYMENT // TEST_PROCOCOL_1.1
                </h1>
                <p style={{ 
                    color: '#64748b', 
                    fontSize: '11px', 
                    fontFamily: 'monospace',
                    letterSpacing: '2px'
                }}>
                    VERIFYING TACTICAL COCKPIT HUD & HIVE MENTALITY LOOP
                </p>
            </div>

            {/* Standalone Game Component */}
            <CodeClashTactical />

            <div style={{ 
                marginTop: '40px', 
                color: '#1e293b', 
                fontSize: '9px', 
                fontFamily: 'monospace',
                letterSpacing: '1px',
                textAlign: 'center'
            }}>
                ID: LVL_1_STAGE_1_ALPHA_PRIME | INTEGRATION_READY: YES | ASSETS: PROCEDURAL
            </div>
        </main>
    );
}
