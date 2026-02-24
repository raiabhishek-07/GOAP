"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { initGame, destroyGame } from "../components/game/GameClient";

export default function GameLayout({ children }) {
    const containerRef = useRef(null);
    const pathname = usePathname();
    const [isLoaded, setIsLoaded] = useState(false);

    // Only show Phaser background on specific pages if desired
    // For now, we keep it initialized but can hide it on the Dashboard to avoid "blur" feel
    const isGameplay = pathname.includes('/play/');
    const isMenu = !isGameplay;

    useEffect(() => {
        if (!containerRef.current) return;

        let gameInstance;
        const setup = async () => {
            gameInstance = await initGame(containerRef.current);
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
        };
    }, []);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#020617] text-slate-200">
            {/* Phaser Container - Always at the bottom */}
            <div
                ref={containerRef}
                className={`absolute inset-0 z-0 transition-all duration-1000 ${isMenu ? 'opacity-40 scale-110' : 'opacity-100 scale-100'}`}
                style={{
                    filter: isMenu ? 'blur(4px) brightness(0.5)' : 'none',
                    pointerEvents: isGameplay ? 'auto' : 'none'
                }}
            />

            {/* Overlay for React-based UI */}
            <div className={`absolute inset-0 z-10 overflow-auto ${isMenu ? 'bg-slate-950/20' : 'pointer-events-none'}`}>
                <div className="relative min-h-screen">
                    {children}
                </div>
            </div>

            {/* Global scanline overlay */}
            <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

            {/* Corner Decorative Elements for Dashboard feel */}
            {isMenu && (
                <>
                    <div className="absolute top-4 left-6 z-40 text-[10px] font-mono text-emerald-500/40 tracking-[0.3em] font-black uppercase">
                        MindArena // System_Active
                    </div>
                    <div className="absolute bottom-4 right-6 z-40 text-[8px] font-mono text-slate-500/40 tracking-widest uppercase">
                        Neural_Link_v2.4 // Tactical_Interface
                    </div>
                </>
            )}
        </div>
    );
}
