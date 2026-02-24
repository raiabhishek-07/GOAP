"use client";
import React, { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import Level1_1 from "./scenes/Level1_1";

export default function MindArena({ level, onGameOver }) {
    const gameContainerRef = useRef(null);
    const gameRef = useRef(null);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        if (!gameContainerRef.current) return;

        const config = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
            width: 1200,
            height: 700,
            backgroundColor: '#000000',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [Level1_1],
            audio: { noAudio: true }
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        // Custom Event Listeners
        game.events.on('PLAYER_DIED', () => {
            setGameOver(true);
            game.scene.pause('Level1_1');
        });

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
            }
        };
    }, []);

    const handleRestart = () => {
        setGameOver(false);
        if (gameRef.current) {
            gameRef.current.scene.start('Level1_1');
            gameRef.current.scene.resume('Level1_1');
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <div ref={gameContainerRef} style={{ width: '100%', height: '100%' }} />

            {gameOver && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(10px)', animation: 'fadeIn 0.5s ease-out'
                }}>
                    <h2 style={{ fontSize: '4rem', fontWeight: '900', color: '#ef4444', marginBottom: '1rem', letterSpacing: '4px' }}>ARENA TERMINATED</h2>
                    <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '3rem' }}>YOUR COGNITIVE FUNCTIONS HAVE CEASED.</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handleRestart}
                            style={{ padding: '1rem 3rem', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                        >RESTART MATCH</button>
                        <button
                            onClick={onGameOver}
                            style={{ padding: '1rem 3rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                        >EXIT TO MENU</button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
