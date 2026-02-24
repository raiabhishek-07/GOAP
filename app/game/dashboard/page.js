"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SaveSystem } from "../../../lib/game/SaveSystem";
import { TacticalPanel, TacticalStat, TacticalProgressBar } from "../../../components/game/TacticalUI";

/**
 * Tactical Command Dashboard
 * Central hub for player progress and mission oversight.
 */
export default function CommandDashboard() {
    const router = useRouter();
    const [summary, setSummary] = useState(null);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        setSummary(SaveSystem.getProgressionSummary());

        const tick = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!summary) return null;

    return (
        <div className="flex flex-col min-h-screen bg-slate-950/60 text-slate-200 p-8 space-y-8 animate-in fade-in duration-1000">
            {/* Header / ID Bar */}
            <div className="flex justify-between items-center border-b border-white/10 pb-6">
                <div className="flex gap-6 items-center">
                    <div className="w-16 h-16 border-2 border-emerald-500/50 flex items-center justify-center bg-black/40 rotate-45">
                        <span className="-rotate-45 text-2xl">◈</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-[0.5em] text-white uppercase">COMMAND_HUB</h1>
                        <span className="text-[10px] font-mono text-emerald-500 tracking-[0.2em] uppercase">Status: Authorization_Verified</span>
                    </div>
                </div>

                <div className="flex gap-12 text-right">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Local Time</span>
                        <span className="text-xl font-mono font-black text-emerald-400">{currentTime}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Neural Rank</span>
                        <span className="text-xl font-mono font-black text-white">{summary.stats.highestRank || 'INITIATE'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column - Core Metrics */}
                <div className="md:col-span-4 space-y-8">
                    <TacticalPanel title="OPERATIONAL_SYNC">
                        <div className="space-y-6 pt-2">
                            <TacticalProgressBar label="Overall Completion" val={summary.completionPercent} color="emerald" />
                            <TacticalProgressBar label="Adaptability Index" val={summary.cognitiveAverages.adaptability} color="amber" />
                            <TacticalProgressBar label="Strategic Depth" val={summary.cognitiveAverages.planning} color="blue" />
                        </div>
                    </TacticalPanel>

                    <TacticalPanel title="SYSTEM_ALERTS">
                        <div className="space-y-3 font-mono text-[9px] text-slate-400">
                            <div className="flex gap-2">
                                <span className="text-emerald-500">[OK]</span>
                                <span>Neural link stability at 98.4%</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-amber-500">[!]</span>
                                <span>New mission profile detected in Sector 2</span>
                            </div>
                            <div className="flex gap-2 text-slate-600">
                                <span>[INFO]</span>
                                <span>Auto-save sequence complete</span>
                            </div>
                        </div>
                    </TacticalPanel>
                </div>

                {/* Right Column - Mission Control & Launch */}
                <div className="md:col-span-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <button
                            onClick={() => router.push('/game/select')}
                            className="group relative h-48 bg-emerald-950/20 border border-emerald-500/30 overflow-hidden hover:border-emerald-500 transition-all text-left p-6"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-8xl">⚔</span>
                            </div>
                            <h3 className="text-xl font-black tracking-widest text-emerald-400 mb-2 uppercase">Solo Campaign</h3>
                            <p className="text-[10px] text-slate-400 leading-relaxed w-2/3">
                                Advance through the MindArena sectors. Deploy against advanced AI agents in tactical scenarios.
                            </p>
                            <div className="absolute bottom-6 right-6 px-4 py-2 border border-emerald-500/50 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                <span className="text-[10px] font-black tracking-widest">LAUNCH_SELECTOR</span>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/game/stats')}
                            className="group relative h-48 bg-slate-900/40 border border-white/5 overflow-hidden hover:border-white/20 transition-all text-left p-6"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-slate-400">
                                <span className="text-8xl">👤</span>
                            </div>
                            <h3 className="text-xl font-black tracking-widest text-white mb-2 uppercase">Operative Dossier</h3>
                            <p className="text-[10px] text-slate-400 leading-relaxed w-2/3">
                                Review detailed career performance, neural metrics, and unlocked combat abilities.
                            </p>
                            <div className="absolute bottom-6 right-6 px-4 py-2 border border-white/20 group-hover:bg-white group-hover:text-black transition-all">
                                <span className="text-[10px] font-black tracking-widest">ACCESS_FILE</span>
                            </div>
                        </button>
                    </div>

                    <TacticalPanel title="RECENT_PERFORMANCE">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-2">
                            <TacticalStat label="Total Kills" value={summary.stats.totalKills} icon="🎯" />
                            <TacticalStat label="Tasks Finished" value={summary.stats.totalTasksCompleted} icon="⚙" />
                            <TacticalStat label="Mission Time" value={`${(summary.stats.totalTimeSeconds / 60).toFixed(1)}m`} icon="⏱" />
                            <TacticalStat label="Rank Pts" value={summary.stats.totalScore} icon="⭐" />
                        </div>
                    </TacticalPanel>

                    <div className="flex gap-4 mt-auto">
                        <button className="flex-1 py-4 border border-white/5 bg-black/20 text-[10px] font-black tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all uppercase">
                            ⚙ Settings
                        </button>
                        <button className="flex-1 py-4 border border-white/5 bg-black/20 text-[10px] font-black tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all uppercase">
                            📁 Archives
                        </button>
                        <button
                            onClick={() => router.push('/game')}
                            className="px-8 py-4 border border-red-500/30 text-red-500 text-[10px] font-black tracking-widest hover:bg-red-500 hover:text-black transition-all uppercase"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
