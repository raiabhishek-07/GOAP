import React from "react";

/**
 * TacticalPanel - A premium tactical panel with decorative corner brackets
 */
export function TacticalPanel({ title, children, className = "", borderColor = "border-emerald-500/30", titleColor = "text-emerald-500" }) {
    return (
        <div className={`relative bg-slate-900/40 backdrop-blur-md border ${borderColor} p-6 shadow-2xl ${className}`}>
            {/* Corner Brackets */}
            <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${borderColor.replace('border-', 'border-')}`} />
            <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${borderColor.replace('border-', 'border-')}`} />
            <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${borderColor.replace('border-', 'border-')}`} />
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${borderColor.replace('border-', 'border-')}`} />

            {title && (
                <div className="mb-4">
                    <span className={`text-[9px] font-mono font-black tracking-[0.3em] uppercase ${titleColor}`}>
                        {title}
                    </span>
                    <div className={`h-[1px] w-full bg-gradient-to-r from-current to-transparent opacity-20 mt-1 ${titleColor}`} />
                </div>
            )}

            {children}
        </div>
    );
}

/**
 * TacticalButton - A sleek tactical button with hover effects
 */
export function TacticalButton({ label, onClick, sub, primary, className = "", color = "emerald" }) {
    const colorClasses = {
        emerald: "from-emerald-900/80 to-emerald-950 border-emerald-500/50 text-emerald-400 hover:border-emerald-400 group-hover:text-white",
        amber: "from-amber-900/80 to-amber-950 border-amber-500/50 text-amber-400 hover:border-amber-400 group-hover:text-white",
        blue: "from-blue-900/80 to-blue-950 border-blue-500/50 text-blue-400 hover:border-blue-400 group-hover:text-white",
        slate: "from-slate-800/80 to-slate-900 border-slate-700/50 text-slate-400 hover:border-slate-500 group-hover:text-white",
        red: "from-red-900/80 to-red-950 border-red-500/50 text-red-400 hover:border-red-400 group-hover:text-white",
    };

    const activeColor = colorClasses[color] || colorClasses.emerald;

    return (
        <button
            onClick={onClick}
            className={`
                group relative flex flex-col items-center justify-center py-4 px-8 transition-all duration-300 overflow-hidden
                bg-gradient-to-b border ${activeColor}
                hover:scale-[1.02] active:scale-95 shadow-lg
                ${className}
            `}
        >
            {/* Corner highlights */}
            <div className="absolute top-0 left-0 w-1 h-1 bg-current opacity-40" />
            <div className="absolute top-0 right-0 w-1 h-1 bg-current opacity-40" />
            <div className="absolute bottom-0 left-0 w-1 h-1 bg-current opacity-40" />
            <div className="absolute bottom-0 right-0 w-1 h-1 bg-current opacity-40" />

            <span className="text-sm font-black tracking-[0.2em] mb-1">
                {label.toUpperCase()}
            </span>
            {sub && (
                <span className="text-[8px] tracking-widest uppercase opacity-60 font-bold group-hover:opacity-100 transition-opacity">
                    {sub}
                </span>
            )}

            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent h-[2px] -top-full group-hover:top-full transition-all duration-700 ease-in-out" />
        </button>
    );
}

/**
 * TacticalStat - Small stat item
 */
export function TacticalStat({ label, value, icon, color = "text-slate-500" }) {
    return (
        <div className="flex flex-col items-center bg-black/20 p-2 border border-white/5 rounded">
            {icon && <span className="text-sm mb-1">{icon}</span>}
            <span className="text-xs font-mono font-black text-white">{value}</span>
            <span className={`text-[7px] font-black tracking-widest uppercase mt-0.5 ${color}`}>{label}</span>
        </div>
    );
}

/**
 * TacticalProgressBar - Segmented progress bar
 */
export function TacticalProgressBar({ val, max = 100, label, color = "emerald" }) {
    const barColors = {
        emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
        amber: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
        blue: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
        red: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
    };

    const percentage = Math.min(100, Math.max(0, (val / max) * 100));

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between items-end">
                <span className="text-[8px] font-black tracking-[0.1em] text-slate-500 uppercase">{label}</span>
                <span className="text-[10px] font-mono font-black text-white">{percentage.toFixed(0)}%</span>
            </div>
            <div className="relative h-2 bg-white/5 p-[2px] overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${barColors[color]}`}
                    style={{
                        width: `${percentage}%`,
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                    }}
                />
                {/* Segment Overlay */}
                <div className="absolute inset-0 flex">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex-1 border-r border-black/40 last:border-0 h-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}
