'use client';

import React from 'react';
import CodeClash from '../../code_clash/CodeClash';

/**
 * Temporary Test Page for Code Clash
 * 
 * Navigate to /test-clash to view the game.
 * Delete this folder once ready to share.
 */

export default function TestClashPage() {
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
                <h1 style={{ color: '#facc15', fontSize: '32px', marginBottom: '10px', letterSpacing: '4px' }}>CODE CLASH: TEST MODE</h1>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Verify combat, treasure hunting, and logic-learning features below.</p>
            </div>

            <CodeClash />

            <div style={{ marginTop: '40px', color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>
                COMPONENT VERSION 1.0.0  |  REDUX-ENABLED: NO  |  SSR-SAFE: YES
            </div>
        </main>
    );
}
