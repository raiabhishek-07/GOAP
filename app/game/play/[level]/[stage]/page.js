"use client";
import React, { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { switchScene } from "../../../../components/game/GameClient";

/**
 * PlayPage — This is the "In-Game" overlay.
 * It's mostly transparent because Phaser handles the HUD and gameplay.
 * But we can use it for React-based overlays like a Pause Menu or refined HUD elements.
 */
export default function PlayPage({ params }) {
    const { level, stage } = use(params);
    const router = useRouter();

    useEffect(() => {
        // Start the deployment loading scene first
        switchScene('DeploymentLoadingScene', { level, stage });

        // Cleanup: when leaving this page, maybe return to briefing or select
        return () => {
            // We could stop the game scene here, but usually Phaser handles the transition
        };
    }, [level, stage]);

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* The actual Phaser game is rendering in the background layer of the layout */}

            {/* React-based Pause button overlay if desired */}
            <div className="absolute top-6 right-8 pointer-events-auto">
                <button
                    onClick={() => router.push('/game/select')}
                    className="group relative px-6 py-2 bg-slate-900/40 border border-white/10 hover:border-red-500/50 transition-all duration-300"
                >
                    <div className="absolute top-0 left-0 w-1 h-1 bg-white/20 group-hover:bg-red-500" />
                    <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/20 group-hover:bg-red-500" />
                    <span className="text-[9px] font-black tracking-[0.2em] text-slate-500 group-hover:text-red-400 uppercase">
                        Abort_Operational_Link
                    </span>
                </button>
            </div>

            {/* Hint overlay or dynamic markers could go here */}
        </div>
    );
}
