"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { initGame, destroyGame } from "../components/game/GameClient";

export default function GameLayout({ children }) {
    const containerRef = useRef(null);
    const pathname = usePathname();
    const [isLoaded, setIsLoaded] = useState(false);

    // ONLY initialize Phaser during actual gameplay (/game/play/[level]/[stage])
    // All menu pages use pure React — no Phaser at all
    const isPlay = pathname.includes('/play/');
    const isTraining = pathname.includes('/training-ground');
    const isGameplay = isPlay || isTraining;

    // Extract level/stage from URL like /game/play/1/2
    const playMatch = pathname.match(/\/play\/(\d+)\/(\d+)/);
    const level = playMatch ? playMatch[1] : null;
    const stage = playMatch ? playMatch[2] : null;

    useEffect(() => {
        if (!isGameplay || !containerRef.current) return;
        if (isPlay && (level === null || stage === null)) return;

        let gameInstance;
        const setup = async () => {
            if (isTraining) {
                gameInstance = await initGame(containerRef.current, {
                    directLaunch: true,
                    trainingMode: true
                });
            } else {
                gameInstance = await initGame(containerRef.current, {
                    directLaunch: true,
                    level: parseInt(level, 10),
                    stage: parseInt(stage, 10)
                });
            }
            setIsLoaded(true);
        };
        setup();

        const handleResize = () => {
            if (gameInstance && gameInstance.scale) {
                gameInstance.scale.resize(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            destroyGame();
            setIsLoaded(false);
        };
    }, [isGameplay, level, stage]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#020617] text-slate-200">

            {/* ── Phaser Canvas: ONLY during gameplay ── */}
            {isGameplay && (
                <div
                    ref={containerRef}
                    className="absolute inset-0 z-0"
                    style={{ pointerEvents: 'auto' }}
                />
            )}

            {/* ── Clean CSS Background: All menu/dashboard pages ── */}
            {!isGameplay && (
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Subtle grid */}
                    <div className="absolute inset-0 opacity-[0.04]">
                        <div className="h-full w-full bg-[linear-gradient(rgba(16,185,129,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.4)_1px,transparent_1px)] bg-[size:60px_60px]" />
                    </div>
                    {/* Central glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_800px_500px_at_50%_40%,rgba(16,185,129,0.06),transparent)]" />
                    {/* Vignette edges */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(2,6,23,0.8))]" />
                </div>
            )}

            {/* ── React UI Layer ── */}
            <div className={`absolute inset-0 z-10 overflow-auto ${isGameplay ? 'pointer-events-none' : ''}`}>
                <div className="relative min-h-screen">
                    {children}
                </div>
            </div>

            {/* ── Scanline overlay (very subtle) ── */}
            <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

            {/* ── Corner decorations on menus ── */}
            {!isGameplay && (
                <>
                    <div className="absolute top-4 left-6 z-40 text-[10px] font-mono text-emerald-500/20 tracking-[0.3em] font-black uppercase pointer-events-none">
                        MindArena // System_Active
                    </div>
                    <div className="absolute bottom-4 right-6 z-40 text-[8px] font-mono text-slate-500/20 tracking-widest uppercase pointer-events-none">
                        Neural_Link_v2.4 // Tactical_Interface
                    </div>
                </>
            )}
        </div>
    );
}
