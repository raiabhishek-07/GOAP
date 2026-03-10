"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SaveSystem } from "../../lib/game/SaveSystem";
import { TacticalPanel, TacticalStat, TacticalProgressBar } from "../../components/game/TacticalUI";
import { MIND_ARENA_LEVELS, isLevelUnlocked } from "../../lib/game/LevelConfig";

/**
 * Tactical Command Dashboard
 * Unified hub for training, missions, and progression.
 */
export default function CommandDashboard() {
    const router = useRouter();
    const [summary, setSummary] = useState(null);
    const [currentTime, setCurrentTime] = useState("");
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        try {
            setSummary(SaveSystem.getProgressionSummary());
            setProgress(SaveSystem.getProgress());
        } catch (e) {
            setSummary({
                completionPercent: 0,
                cognitiveAverages: { planning: 0, adaptability: 0, efficiency: 0 },
                stats: { highestRank: 'INITIATE', totalKills: 0, totalTasksCompleted: 0, totalTimeSeconds: 0, totalScore: 0, gamesPlayed: 0 },
                abilities: {}
            });
            setProgress({});
        }

        const tick = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!summary) return null;

    const safeStats = summary.stats || {};
    const safeCog = summary.cognitiveAverages || {};

    return (
        <>
            <CyberBackground />
            <div className="flex flex-col min-h-screen bg-slate-950/60 text-slate-200 p-8 space-y-8 animate-in fade-in duration-700 relative overflow-hidden">
                {/* Header / ID Bar */}
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 gap-4">
                    <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 border-2 border-emerald-500/50 flex items-center justify-center bg-black/60 rotate-45 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <span className="-rotate-45 text-2xl text-emerald-400">◈</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black tracking-[0.3em] text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">COMMAND_HUB</h1>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-emerald-500 tracking-[0.2em] uppercase animate-pulse">● System_Online</span>
                                <span className="text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase">Auth: V7-G-ALPHA</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-8 sm:gap-12 text-right">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Sector_Temporal</span>
                            <span className="text-xl font-mono font-black text-emerald-400 tabular-nums">{currentTime}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
                    {/* Left Panel: Profile & Stats */}
                    <div className="lg:col-span-3 space-y-6 relative z-10">
                        <TacticalPanel title="OPERATIVE_DATA">
                            <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-lg mb-4 text-center">
                                <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest block mb-1">Neural Rank</span>
                                <span className="text-2xl font-mono font-black text-white">{safeStats.highestRank || 'INITIATE'}</span>
                            </div>
                            <div className="space-y-4">
                                <TacticalProgressBar label="Progression" val={summary.completionPercent || 0} color="emerald" />
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="p-2 border border-white/5 bg-black/20 text-center">
                                        <span className="text-[8px] text-slate-500 block uppercase">Kills</span>
                                        <span className="text-sm font-mono text-emerald-400">{safeStats.totalKills || 0}</span>
                                    </div>
                                    <div className="p-2 border border-white/5 bg-black/20 text-center">
                                        <span className="text-[8px] text-slate-500 block uppercase">Tasks</span>
                                        <span className="text-sm font-mono text-emerald-400">{safeStats.totalTasksCompleted || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </TacticalPanel>

                        <TacticalPanel title="SYSTEM_LOGS">
                            <div className="space-y-2 font-mono text-[9px] text-slate-400">
                                <div className="flex justify-between border-b border-white/5 pb-1">
                                    <span>CONNECTION</span>
                                    <span className="text-emerald-500">OPTIMAL</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-1">
                                    <span>NEURAL_LINK</span>
                                    <span className="text-emerald-500">98.4%</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-1">
                                    <span>ENCRYPTION</span>
                                    <span className="text-amber-500">V7_ACTIVE</span>
                                </div>
                            </div>
                        </TacticalPanel>
                    </div>

                    {/* Center: Main Deployment */}
                    <div className="lg:col-span-6 space-y-6 relative z-10">
                        {/* Training Ground Hero */}
                        <div className="relative group cursor-pointer overflow-hidden border border-orange-500/30 bg-orange-950/10 rounded-xl p-8 transition-all duration-500 hover:border-orange-500 hover:bg-orange-900/20"
                            onClick={() => router.push('/game/training-ground')}>
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all text-8xl grayscale-0 group-hover:scale-110">🏋️</div>
                            <div className="relative z-10">
                                <span className="inline-block px-3 py-1 bg-orange-500 text-black text-[9px] font-black tracking-widest uppercase mb-4 rounded-sm">Highly Recommended</span>
                                <h2 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase group-hover:text-orange-400 transition-colors">Training Ground</h2>
                                <p className="text-sm text-slate-400 leading-relaxed max-w-md mb-6 font-medium">
                                    Master tactical movement, weapon systems, and vehicle handling in a zero-risk
                                    cybernetic simulation environment. Essential for new operatives.
                                </p>
                                <div className="flex gap-4">
                                    <span className="px-6 py-2 border border-orange-500/50 text-orange-500 text-[10px] font-black tracking-widest uppercase group-hover:bg-orange-500 group-hover:text-black transition-all">
                                        Initialize_Drill
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 border border-white/5 bg-black/20 rounded-lg">
                                <span className="text-[8px] text-slate-500 block uppercase tracking-widest mb-1">Total Score</span>
                                <span className="text-xl font-mono text-white">{safeStats.totalScore || 0}</span>
                            </div>
                            <div className="p-4 border border-white/5 bg-black/20 rounded-lg">
                                <span className="text-[8px] text-slate-500 block uppercase tracking-widest mb-1">Time Active</span>
                                <span className="text-xl font-mono text-white">{((safeStats.totalTimeSeconds || 0) / 60).toFixed(1)}m</span>
                            </div>
                            <div className="p-4 border border-white/5 bg-black/20 rounded-lg">
                                <span className="text-[8px] text-slate-500 block uppercase tracking-widest mb-1">Adaptability</span>
                                <span className="text-xl font-mono text-amber-500">{safeCog.adaptability || 0}%</span>
                            </div>
                            <div className="p-4 border border-white/5 bg-black/20 rounded-lg">
                                <span className="text-[8px] text-slate-500 block uppercase tracking-widest mb-1">Strategic</span>
                                <span className="text-xl font-mono text-blue-500">{safeCog.planning || 0}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Mission Roster */}
                    <div className="lg:col-span-3 space-y-6 relative z-10">
                        <div className="relative group cursor-pointer overflow-hidden border border-emerald-500/30 bg-emerald-950/10 rounded-xl p-8 transition-all duration-500 hover:border-emerald-500 hover:bg-emerald-900/20"
                            onClick={() => router.push('/game/select')}>
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all text-8xl grayscale-0 group-hover:scale-110">🗺️</div>
                            <div className="relative z-10">
                                <span className="inline-block px-3 py-1 bg-emerald-500 text-black text-[9px] font-black tracking-widest uppercase mb-4 rounded-sm">Primary Objective</span>
                                <h2 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase group-hover:text-emerald-400 transition-colors">Solo Campaign</h2>
                                <p className="text-sm text-slate-400 leading-relaxed max-w-md mb-6 font-medium">
                                    Deploy into active warzones, dismantle hostile AI architectures, and execute strategic operations to stabilize the sector.
                                </p>
                                <div className="flex gap-4">
                                    <span className="px-6 py-2 border border-emerald-500/50 text-emerald-500 text-[10px] font-black tracking-widest uppercase group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                        Mission_Select
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button onClick={() => router.push('/game/stats')} className="w-full py-3 border border-blue-500/20 bg-blue-500/5 text-[9px] font-black text-blue-400 tracking-widest uppercase hover:bg-blue-500/10 transition-all rounded">Dossier Access</button>
                            <button onClick={() => router.push('/game/settings')} className="w-full py-3 border border-white/5 bg-black/20 text-[9px] font-black text-slate-500 tracking-widest uppercase hover:text-white transition-all rounded">System Settings</button>
                            <button onClick={() => router.push('/game')} className="w-full py-3 border border-red-500/20 bg-red-500/5 text-[9px] font-black text-red-500 tracking-widest uppercase hover:bg-red-500/10 transition-all rounded">Abort Connection</button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .glow-text {
                    text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </>
    );
}

function CyberBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020617]">
            <div className="absolute inset-0 opacity-[0.1]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] animate-scan" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full" />
            <style jsx>{`
                @keyframes scan {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 100%; }
                }
                .animate-scan {
                    animation: scan 10s linear infinite;
                }
            `}</style>
        </div>
    );
}

function NavCard({ onClick, icon, title, desc, cta, accentClass, ctaClass, titleClass }) {
    return (
        <button
            onClick={onClick}
            className={`group relative h-48 ${accentClass} border overflow-hidden transition-all duration-300 text-left p-6 shadow-xl`}
        >
            {/* Holographic background line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                <span className="text-8xl">{icon}</span>
            </div>

            <div className="relative z-10">
                <h3 className={`text-xl font-black tracking-widest ${titleClass} mb-3 uppercase group-hover:translate-x-1 transition-transform`}>{title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed w-5/6 font-medium">{desc}</p>
            </div>

            <div className={`absolute bottom-6 right-6 px-4 py-2 border ${ctaClass} group-hover:text-black transition-all duration-300 shadow-lg`}>
                <span className="text-[10px] font-black tracking-widest uppercase">{cta}</span>
            </div>

            {/* Hover Glitch Line */}
            <div className="absolute bottom-0 left-0 w-0 h-1 bg-current opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-500" />
        </button>
    );
}


