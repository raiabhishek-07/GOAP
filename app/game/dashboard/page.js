"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SaveSystem } from "../../lib/game/SaveSystem";
import { TacticalPanel, TacticalStat, TacticalProgressBar } from "../../components/game/TacticalUI";
import { MIND_ARENA_LEVELS, isLevelUnlocked } from "../../lib/game/LevelConfig";

// --- GAMIFICATION / XP LOGIC ---
const XP_BASE = 500;
const XP_MULTIPLIER = 1.25;

function calculateProgression(totalScore) {
    let level = 1;
    let requiredXP = XP_BASE;
    let currentXP = totalScore || 0;
    
    while (currentXP >= requiredXP && level < 50) {
        currentXP -= requiredXP;
        level++;
        requiredXP = Math.floor(requiredXP * XP_MULTIPLIER);
    }
    
    return {
        level,
        currentXP,
        requiredXP,
        progressPercent: (currentXP / requiredXP) * 100,
        rankName: getRankName(level)
    };
}

function getRankName(level) {
    if (level < 3) return "INITIATE";
    if (level < 6) return "OPERATIVE";
    if (level < 10) return "SPECIALIST";
    if (level < 15) return "VANGUARD";
    if (level < 25) return "COMMANDER";
    return "APEX PREDATOR";
}

export default function CommandDashboard() {
    const router = useRouter();
    const [summary, setSummary] = useState(null);
    const [currentTime, setCurrentTime] = useState("");
    const [activeTab, setActiveTab] = useState("deployment"); // deployment, armory, logs
    const audioRef = useRef(null);

    useEffect(() => {
        try {
            setSummary(SaveSystem.getProgressionSummary());
        } catch (e) {
            setSummary({
                completionPercent: 0,
                cognitiveAverages: { planning: 0, adaptability: 0, efficiency: 0 },
                stats: { highestRank: 'INITIATE', totalKills: 0, totalTasksCompleted: 0, totalTimeSeconds: 0, totalScore: 0, gamesPlayed: 0 },
                abilities: {}
            });
        }

        const tick = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        tick();
        const timer = setInterval(tick, 1000);
        
        // Setup synthetic audio context
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioRef.current = ctx;
        } catch(e) {}

        return () => clearInterval(timer);
    }, []);

    const playHoverSound = () => {
        if (!audioRef.current || audioRef.current.state !== 'running') return;
        const osc = audioRef.current.createOscillator();
        const gain = audioRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioRef.current.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, audioRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioRef.current.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioRef.current.destination);
        osc.start();
        osc.stop(audioRef.current.currentTime + 0.05);
    };

    if (!summary) return null;

    const safeStats = summary.stats || {};
    const safeCog = summary.cognitiveAverages || {};
    const progression = calculateProgression(safeStats.totalScore || 0);

    return (
        <>
            <CyberBackground />
            
            <div className="flex flex-col min-h-screen bg-slate-950/70 text-slate-200 p-4 lg:p-8 space-y-6 animate-in fade-in duration-700 relative overflow-hidden font-sans cursor-crosshair">
                
                {/* GLOBAL HUD HEADER */}
                <header className="relative z-10 flex flex-col md:flex-row justify-between items-center bg-black/40 border border-emerald-500/20 backdrop-blur-md p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="flex gap-4 items-center mb-4 md:mb-0">
                        <div className="w-12 h-12 relative animate-pulse-slow">
                            <div className="absolute inset-0 border-2 border-emerald-500 rounded-full rotate-45 border-t-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-spin-slow"></div>
                            <div className="absolute inset-1 border border-emerald-400/50 rounded-full border-b-transparent animate-spin-reverse"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-emerald-400 font-black text-xl">v7</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black tracking-[0.4em] text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">COMMAND_CENTER</h1>
                            <div className="flex gap-4 items-center">
                                <span className="text-[9px] font-mono text-emerald-500 tracking-[0.2em] uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Uplink Secure
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* TOP NAVIGATION TABS */}
                    <div className="flex gap-2 p-1 bg-black/50 border border-white/10 rounded-lg">
                        {['deployment', 'armory', 'logs'].map(tab => (
                            <button 
                                key={tab}
                                onMouseEnter={playHoverSound}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-300 rounded ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="hidden lg:flex flex-col text-right">
                        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Local Temporal Sync</span>
                        <span className="text-xl font-mono font-black text-emerald-400 tabular-nums glow-text">{currentTime}</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 relative z-10">
                    
                    {/* LEFT PANEL: XP & PROGRESSION GAMIFICATION */}
                    <div className="lg:col-span-3 space-y-6">
                        <TacticalPanel title="OPERATIVE_ID" borderColor="border-blue-500/30" titleColor="text-blue-500">
                            {/* Rank Badge */}
                            <div className="relative h-32 flex items-center justify-center mb-6">
                                <svg width="120" height="120" viewBox="0 0 100 100" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 animate-spin-slow">
                                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#3b82f6" strokeWidth="1" />
                                    <polygon points="50,15 85,30 85,70 50,85 15,70 15,30" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="4 4" />
                                </svg>
                                <div className="z-10 text-center">
                                    <span className="text-[10px] text-blue-400 tracking-[0.3em] uppercase block mb-1 font-black">Lvl {progression.level}</span>
                                    <span className="text-2xl font-black text-white glow-text whitespace-nowrap">{progression.rankName}</span>
                                </div>
                            </div>
                            
                            {/* XP Bar */}
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-[9px] font-mono tracking-widest uppercase">
                                    <span className="text-slate-400">XP Prog</span>
                                    <span className="text-blue-400">{progression.currentXP} / {progression.requiredXP}</span>
                                </div>
                                <div className="h-2 w-full bg-black/50 border border-white/10 rounded-full overflow-hidden relative">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.max(2, progression.progressPercent)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/40 border border-white/5 p-3 text-center rounded relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                    <span className="text.xl font-mono text-white block">{safeStats.totalKills || 0}</span>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Hostiles Down</span>
                                </div>
                                <div className="bg-black/40 border border-white/5 p-3 text-center rounded relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                    <span className="text-xl font-mono text-white block">{safeStats.totalTasksCompleted || 0}</span>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Terminals Hacked</span>
                                </div>
                            </div>
                        </TacticalPanel>

                        <TacticalPanel title="NEURAL_EVALUATION" borderColor="border-amber-500/30" titleColor="text-amber-500">
                            <div className="space-y-4">
                                <TacticalProgressBar label="Adaptability" val={safeCog.adaptability || 0} color="amber" />
                                <TacticalProgressBar label="Strategic Planning" val={safeCog.planning || 0} color="amber" />
                                <TacticalProgressBar label="Execution Efficiency" val={safeCog.efficiency || 0} color="amber" />
                            </div>
                        </TacticalPanel>
                    </div>

                    {/* CENTER INTERACTIVE PANEL */}
                    <div className="lg:col-span-9 h-[700px] flex flex-col bg-black/40 border border-white/10 rounded-xl relative overflow-hidden shadow-2xl">
                        
                        {/* Static scanline overlay for screen effect */}
                        <div className="absolute inset-0 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928GBgYGWxcDEgAEIQJgH+Y1vAAAAABJRU5ErkJggg==')] opacity-[0.03] z-20"></div>

                        {activeTab === 'deployment' && (
                            <TabDeployment router={router} hoverSound={playHoverSound} />
                        )}

                        {activeTab === 'armory' && (
                            <TabArmory hoverSound={playHoverSound} />
                        )}

                        {activeTab === 'logs' && (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center font-mono opacity-50">
                                    <div className="text-4xl mb-4">🖧</div>
                                    <p className="tracking-widest uppercase">Fetching encrypted mission logs...</p>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .glow-text { text-shadow: 0 0 10px currentColor; }
                .animate-spin-slow { animation: spin 20s linear infinite; }
                .animate-spin-reverse { animation: spin 15s linear infinite reverse; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}

// -------------------------------------------------------------
// SECTOR MAP / DEPLOYMENT SCREEN
// -------------------------------------------------------------
function TabDeployment({ router, hoverSound }) {
    // Treat the levels object as an array of sectors
    const levels = Object.values(MIND_ARENA_LEVELS);
    
    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <h2 className="text-xl font-black tracking-[0.3em] uppercase text-emerald-400 mb-8 border-b border-emerald-500/20 pb-4 inline-block">Active Sectors</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Simulated Special "Training Ground" Sector */}
                <div 
                    onMouseEnter={hoverSound}
                    onClick={() => router.push('/game/training-ground')}
                    className="relative group cursor-pointer border border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-emerald-500 transition-all duration-300 rounded-lg overflow-hidden h-48 flex items-center p-6"
                >
                    <div className="absolute right-0 top-0 h-full w-48 bg-emerald-500/5 rotate-12 translate-x-10 scale-150 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative z-10 w-full">
                        <span className="text-[9px] bg-slate-800 text-emerald-400 px-2 py-1 uppercase tracking-widest font-black rounded-sm mb-3 inline-block">Safe Zone</span>
                        <h3 className="text-2xl font-black uppercase text-white tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">NEURAL SIM-CHAMBER</h3>
                        <p className="text-[11px] text-slate-400 font-medium mb-4 max-w-[80%] leading-relaxed">Simulated combat theater. Zero mortality risk. Highly recommended before live deployment.</p>
                        
                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                            <span className="font-mono text-[9px] text-emerald-500 tracking-widest">THREAT: NONE</span>
                            <span className="text-[10px] uppercase font-black tracking-widest text-white px-3 py-1 bg-white/10 group-hover:bg-emerald-500 group-hover:text-black transition-colors rounded">Initialize _&gt;</span>
                        </div>
                    </div>
                </div>

                {levels.map((level, idx) => {
                    const isUnlocked = isLevelUnlocked(idx + 1);
                    return (
                        <div 
                            key={idx}
                            onMouseEnter={isUnlocked ? hoverSound : undefined}
                            onClick={() => isUnlocked ? router.push('/game/select') : null}
                            className={`relative group border rounded-lg overflow-hidden h-48 flex items-center p-6 transition-all duration-300 
                                ${isUnlocked ? 'cursor-pointer border-red-500/30 bg-red-950/10 hover:border-red-500 hover:bg-red-900/20 shadow-[0_0_15px_rgba(239,68,68,0)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'opacity-40 border-slate-800 bg-slate-900/50 grayscale cursor-not-allowed'}`}
                        >
                            {!isUnlocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                                    <span className="text-xl">🔒</span>
                                </div>
                            )}

                            {/* Tactical Radar Sweep background */}
                            <div className="absolute right-0 top-0 h-full w-full opacity-10 group-hover:opacity-20 transition-all pointer-events-none"
                                style={{
                                    backgroundImage: 'repeating-radial-gradient(circle at 100% 50%, transparent 0, transparent 20px, #ef4444 20px, #ef4444 21px)'
                                }}>
                            </div>

                            <div className="relative z-10 w-full">
                                <span className={`text-[9px] px-2 py-1 uppercase tracking-widest font-black rounded-sm mb-3 inline-block ${isUnlocked ? 'bg-red-900 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
                                    Sector 0{idx+1}
                                </span>
                                <h3 className={`text-2xl font-black uppercase text-white tracking-widest mb-1 ${isUnlocked ? 'group-hover:text-red-400 glow-text' : ''} transition-colors`}>{level.name}</h3>
                                <p className="text-[11px] text-slate-400 font-medium mb-4 max-w-[80%] leading-relaxed truncate whitespace-normal line-clamp-2">{level.description}</p>
                                
                                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                                    <span className={`font-mono text-[9px] tracking-widest ${isUnlocked ? 'text-red-500' : 'text-slate-500'}`}>THREAT: SEVERE</span>
                                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-white/10 rounded transition-colors ${isUnlocked ? 'text-white group-hover:bg-red-500 group-hover:text-black' : 'text-slate-500'}`}>
                                        Deployment _&gt;
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// ARMORY / SAFEHOUSE MOCKUP
// -------------------------------------------------------------
function TabArmory({ hoverSound }) {
    return (
        <div className="flex-1 p-8 overflow-y-auto w-full h-full relative font-mono text-center">
            <h2 className="text-xl font-black text-left tracking-[0.3em] uppercase text-amber-500 mb-8 border-b border-amber-500/20 pb-4 inline-block w-full">Armory Framework</h2>
            
            {/* Intel Display */}
            <div className="absolute top-8 right-8 bg-amber-500/10 border border-amber-500/30 px-6 py-3 rounded">
                <span className="text-[10px] tracking-[0.3em] uppercase text-amber-500/70 block mb-1">Available Intel</span>
                <span className="text-2xl text-amber-400 font-black glow-text">0 DATA</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
                
                {/* Health Upgrade */}
                <div onMouseEnter={hoverSound} className="border border-white/10 bg-black/40 p-6 rounded hover:border-emerald-500/50 transition-colors group cursor-not-allowed">
                    <div className="text-4xl mb-4 group-hover:-translate-y-2 transition-transform">🧬</div>
                    <h4 className="text-white text-sm tracking-widest font-black uppercase mb-2 group-hover:text-emerald-400 transition-colors">Neural Suit</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Increases maximum health capacity by 20%. Sustains combat efficiency.</p>
                    <div className="w-full bg-black/60 p-2 border border-dashed border-white/10 text-amber-500/50 text-[10px] tracking-widest uppercase">Cost: 1500 Intel</div>
                </div>

                {/* Speed Upgrade */}
                <div onMouseEnter={hoverSound} className="border border-white/10 bg-black/40 p-6 rounded hover:border-blue-500/50 transition-colors group cursor-not-allowed">
                    <div className="text-4xl mb-4 group-hover:-translate-y-2 transition-transform">⚡</div>
                    <h4 className="text-white text-sm tracking-widest font-black uppercase mb-2 group-hover:text-blue-400 transition-colors">Actuators</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Enhances base movement speed by 15%. Outmaneuver hostiles.</p>
                    <div className="w-full bg-black/60 p-2 border border-dashed border-white/10 text-amber-500/50 text-[10px] tracking-widest uppercase">Cost: 2000 Intel</div>
                </div>

                {/* Damage Upgrade */}
                <div onMouseEnter={hoverSound} className="border border-white/10 bg-black/40 p-6 rounded hover:border-red-500/50 transition-colors group cursor-not-allowed">
                    <div className="text-4xl mb-4 group-hover:-translate-y-2 transition-transform">🎯</div>
                    <h4 className="text-white text-sm tracking-widest font-black uppercase mb-2 group-hover:text-red-400 transition-colors">Targeting V2</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Injects a 10% flat damage multiplier to all equipped firearms.</p>
                    <div className="w-full bg-black/60 p-2 border border-dashed border-white/10 text-amber-500/50 text-[10px] tracking-widest uppercase">Cost: 3500 Intel</div>
                </div>
            </div>

            <p className="text-amber-500/50 text-[10px] tracking-[0.3em] uppercase absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">Armory integration pending Intel economy...</p>
        </div>
    );
}

function CyberBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050B14]">
            {/* Hex Grid pattern */}
            <div className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0l25.98 15v30L30 60 4.02 45V15z\' fill-opacity=\'0\' stroke=\'%2300D4FF\' stroke-width=\'1\'/%3E%3C/svg%3E")',
                    backgroundSize: '40px 60px'
                }}
            />
            {/* Scanlines layer */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(0,255,100,0.03),rgba(0,200,255,0.02),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] z-50 opacity-50" />
            
            {/* Glowing Orbs */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full" />
        </div>
    );
}
