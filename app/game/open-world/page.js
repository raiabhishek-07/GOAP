"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

const MultiplayerLobby = dynamic(() => import('../../components/game/MultiplayerLobby'), { ssr: false });

export default function OpenWorldPage() {
    const router = useRouter();
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showLobby, setShowLobby] = useState(false);
    const [mpData, setMpData] = useState(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let game;
        const setup = async () => {
            const Phaser = await import("phaser");
            const { OpenWorldScene } = await import("../../components/game/scenes/OpenWorldScene");
            const { OpenWorldHUD } = await import("../../components/game/scenes/OpenWorldHUD");
            const { SettingsScene } = await import("../../components/game/scenes/SettingsScene");

            // Generate boot textures inline (no separate BootScene needed)
            class QuickBoot extends Phaser.Scene {
                constructor() { super({ key: 'QuickBoot' }); }
                create() {
                    // Generate minimal textures
                    const g = this.add.graphics();
                    g.fillStyle(0x60a5fa, 1); g.fillCircle(32, 32, 28);
                    g.generateTexture('logo_icon', 64, 64);
                    g.destroy();
                    this._genTex('loading_bg', 400, 20, 0x1e293b);
                    this._genTex('loading_fill', 400, 20, 0x60a5fa);
                    this.scene.start('OpenWorldScene', {
                        seed: 12345,
                        multiplayer: !!mpData,
                        roomCode: mpData?.roomCode,
                        playerName: mpData?.playerName || 'OPERATIVE_07',
                    });
                }
                _genTex(key, w, h, color) {
                    const g = this.add.graphics();
                    g.fillStyle(color, 1);
                    g.fillRoundedRect(0, 0, w, h, h / 2);
                    g.generateTexture(key, w, h);
                    g.destroy();
                }
            }

            const config = {
                type: Phaser.AUTO,
                parent: containerRef.current,
                width: Math.max(containerRef.current.clientWidth || window.innerWidth, 800),
                height: Math.max(containerRef.current.clientHeight || window.innerHeight, 600),
                backgroundColor: '#020617',
                pixelArt: false,
                antialias: true,
                powerPreference: 'high-performance',
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 0 },
                        debug: false,
                    },
                },
                scene: [QuickBoot, OpenWorldScene, OpenWorldHUD, SettingsScene],
            };

            game = new Phaser.Game(config);
            gameRef.current = game;
            setIsLoaded(true);
        };

        setup();

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    const handleStartMultiplayer = (data) => {
        setMpData(data);
        setShowLobby(false);
        // Restart game with multiplayer config
        if (gameRef.current) {
            gameRef.current.destroy(true);
            gameRef.current = null;
        }
        // Re-trigger setup
        setIsLoaded(false);
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#020617]">
            {/* Phaser Canvas */}
            <div
                ref={containerRef}
                className="absolute inset-0 z-0"
                style={{ pointerEvents: 'auto' }}
            />

            {/* React UI Overlay — Enhanced top-right corner */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute top-4 right-4 flex flex-col gap-3 pointer-events-auto">
                    {/* Multiplayer Button */}
                    <button
                        onClick={() => setShowLobby(true)}
                        className="group relative px-4 py-2.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 transform hover:scale-105"
                        style={{
                            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(59, 130, 246, 0.6))',
                            border: '2px solid rgba(96, 165, 250, 0.4)',
                            color: '#ffffff',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        }}
                        onMouseEnter={e => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(29, 78, 216, 0.9), rgba(37, 99, 235, 0.7))';
                            e.target.style.borderColor = 'rgba(147, 197, 253, 0.6)';
                            e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={e => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(59, 130, 246, 0.6))';
                            e.target.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                            e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-lg">⚔</span>
                            <span>MULTI</span>
                        </span>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>

                    {/* Exit Button */}
                    <button
                        onClick={() => router.push('/game/dashboard')}
                        className="group relative px-4 py-2.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 transform hover:scale-105"
                        style={{
                            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8), rgba(239, 68, 68, 0.6))',
                            border: '2px solid rgba(248, 113, 113, 0.4)',
                            color: '#ffffff',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        }}
                        onMouseEnter={e => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(185, 28, 28, 0.9), rgba(220, 38, 38, 0.7))';
                            e.target.style.borderColor = 'rgba(252, 165, 165, 0.6)';
                            e.target.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={e => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.8), rgba(239, 68, 68, 0.6))';
                            e.target.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                            e.target.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-lg">✕</span>
                            <span>EXIT</span>
                        </span>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                </div>
            </div>

            {/* Multiplayer Lobby Overlay */}
            {showLobby && (
                <MultiplayerLobby
                    onStartGame={handleStartMultiplayer}
                    onBack={() => setShowLobby(false)}
                />
            )}
        </div>
    );
}
