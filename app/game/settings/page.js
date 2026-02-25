"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SaveSystem } from "../../lib/game/SaveSystem";
import { TacticalPanel, TacticalButton } from "../../components/game/TacticalUI";

export default function SettingsPage() {
    const router = useRouter();
    const [musicVol, setMusicVol] = useState(70);
    const [sfxVol, setSfxVol] = useState(85);
    const [showFPS, setShowFPS] = useState(false);
    const [showTutorials, setShowTutorials] = useState(true);
    const [graphicsQuality, setGraphicsQuality] = useState("high");
    const [showReset, setShowReset] = useState(false);

    const handleReset = () => {
        SaveSystem.reset();
        setShowReset(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950/60 text-slate-200 p-8 lg:p-12">
            {/* Header */}
            <header className="w-full max-w-4xl mx-auto mb-12 animate-in fade-in slide-in-from-top duration-700">
                <div className="flex items-end justify-between border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-[0.3em] text-white uppercase">
                            System_Config
                        </h2>
                        <p className="text-[10px] font-black tracking-[0.3em] text-amber-500/60 uppercase mt-2">
                            Audio &middot; Display &middot; Data Management
                        </p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">v2.4.1</span>
                </div>
            </header>

            <main className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-700 delay-200">

                {/* Audio Settings */}
                <TacticalPanel title="AUDIO_PARAMETERS" titleColor="text-amber-500" borderColor="border-amber-500/20">
                    <div className="space-y-6">
                        <SettingsSlider label="Music Volume" value={musicVol} onChange={setMusicVol} color="amber" />
                        <SettingsSlider label="SFX Volume" value={sfxVol} onChange={setSfxVol} color="amber" />
                    </div>
                </TacticalPanel>

                {/* Display Settings */}
                <TacticalPanel title="DISPLAY_OPTIONS" titleColor="text-blue-500" borderColor="border-blue-500/20">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest block">Graphics Quality</span>
                                <span className="text-[8px] text-slate-500 tracking-widest uppercase">Affects rendering performance</span>
                            </div>
                            <div className="flex gap-2">
                                {["low", "medium", "high"].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setGraphicsQuality(q)}
                                        className={`px-4 py-2 text-[9px] font-black tracking-widest uppercase border transition-all ${graphicsQuality === q
                                            ? 'bg-blue-500 border-blue-400 text-black'
                                            : 'border-white/10 text-slate-500 hover:border-blue-500/50 hover:text-white'
                                            }`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <SettingsToggle label="Show FPS Counter" desc="Display frame rate overlay" checked={showFPS} onChange={setShowFPS} />
                        <SettingsToggle label="Show Tutorials" desc="Enable in-mission guidance popups" checked={showTutorials} onChange={setShowTutorials} />
                    </div>
                </TacticalPanel>

                {/* Data Management */}
                <TacticalPanel title="DATA_MANAGEMENT" titleColor="text-red-400" borderColor="border-red-500/20">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest block">Reset All Progress</span>
                                <span className="text-[8px] text-slate-500 tracking-widest uppercase">Warning: This action is irreversible</span>
                            </div>
                            {!showReset ? (
                                <button
                                    onClick={() => setShowReset(true)}
                                    className="px-6 py-2 border border-red-500/30 text-red-500 text-[9px] font-black tracking-widest hover:bg-red-500 hover:text-black transition-all uppercase"
                                >
                                    PURGE_DATA
                                </button>
                            ) : (
                                <div className="flex gap-3 animate-in fade-in duration-300">
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-2 bg-red-500 border border-red-400 text-black text-[9px] font-black tracking-widest hover:bg-red-400 transition-all uppercase"
                                    >
                                        CONFIRM_PURGE
                                    </button>
                                    <button
                                        onClick={() => setShowReset(false)}
                                        className="px-6 py-2 border border-white/10 text-slate-500 text-[9px] font-black tracking-widest hover:text-white transition-all uppercase"
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </TacticalPanel>
            </main>

            {/* Back */}
            <button
                onClick={() => router.push('/game/dashboard')}
                className="mx-auto mt-12 text-[10px] font-black tracking-[0.3em] text-slate-600 hover:text-amber-500 transition-colors uppercase flex items-center gap-3 animate-in fade-in duration-700 delay-500"
            >
                <div className="w-8 h-[1px] bg-current" />
                Return to Command
            </button>
        </div>
    );
}

function SettingsSlider({ label, value, onChange, color = "emerald" }) {
    const barColor = {
        emerald: "accent-emerald-500",
        amber: "accent-amber-500",
        blue: "accent-blue-500",
    };

    return (
        <div className="flex items-center justify-between gap-8">
            <div className="min-w-[140px]">
                <span className="text-[10px] font-black text-white uppercase tracking-widest block">{label}</span>
            </div>
            <div className="flex-1 flex items-center gap-4">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className={`flex-1 h-1 bg-white/10 appearance-none cursor-pointer ${barColor[color]}`}
                />
                <span className="text-[10px] font-mono font-black text-white min-w-[35px] text-right">{value}%</span>
            </div>
        </div>
    );
}

function SettingsToggle({ label, desc, checked, onChange }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest block">{label}</span>
                {desc && <span className="text-[8px] text-slate-500 tracking-widest uppercase">{desc}</span>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 rounded-sm border transition-all duration-300 ${checked ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-black/40 border-white/10'
                    }`}
            >
                <div className={`absolute top-0.5 w-5 h-5 transition-all duration-300 ${checked ? 'left-[calc(100%-22px)] bg-emerald-500' : 'left-0.5 bg-slate-600'
                    }`} />
            </button>
        </div>
    );
}
