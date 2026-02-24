"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { GoapAgent, PlayerEntity, WORLD_LOCATIONS } from "../../lib/goap/agent";
import DebugPanel from "./DebugPanel";
import styles from "./SimulationCanvas.module.css";

// 2D Renderer for the GOAP world
class WorldRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.time = 0;
        this.treePositions = this._generateTrees();
    }

    _generateTrees() {
        const trees = [];
        const occupied = Object.values(WORLD_LOCATIONS).map(l => ({ x: l.x, y: l.y, r: 60 }));

        for (let i = 0; i < 18; i++) {
            let x, y, valid;
            let attempts = 0;
            do {
                x = 40 + Math.random() * 720;
                y = 40 + Math.random() * 520;
                valid = occupied.every(o => Math.hypot(o.x - x, o.y - y) > o.r + 20);
                valid = valid && trees.every(t => Math.hypot(t.x - x, t.y - y) > 35);
                attempts++;
            } while (!valid && attempts < 50);

            if (valid) {
                trees.push({
                    x, y,
                    size: 10 + Math.random() * 8,
                    hue: 100 + Math.random() * 40,
                    swayOffset: Math.random() * Math.PI * 2
                });
            }
        }
        return trees;
    }

    render() {
        const { ctx, canvas } = this;
        if (!ctx || !this.agent) return;

        this.time += 0.016;
        const debug = this.agent.getDebugState();

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw stylized background (Game Engine feel)
        this._drawBackground();

        // 2. Draw Environment Items
        this._drawEnvironment(debug);

        // 3. Draw Characters
        this._drawPlayer(this.player);
        this._drawAgent(this.agent, debug);

        // 4. Draw HUD Overlays
        this._drawMiniMap(debug);
        this._drawActionPopup(debug);
    }

    _drawBackground() {
        const { ctx, canvas } = this;

        // Base grass
        ctx.fillStyle = '#1e3a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Texture details
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 50; i++) {
            const x = (Math.sin(i * 123.4) * 0.5 + 0.5) * canvas.width;
            const y = (Math.cos(i * 567.8) * 0.5 + 0.5) * canvas.height;
            ctx.fillRect(x, y, 2, 2);
        }
    }

    _drawEnvironment(debugState) {
        const { ctx } = this;

        // Paths between locations
        this._drawPaths();

        // Trees
        this._drawTrees();

        // Buildings / Locations
        this._drawFoodShack();
        this._drawRestArea();
        this._drawDoor(WORLD_LOCATIONS.doorOne, '1');
        this._drawDoor(WORLD_LOCATIONS.doorTwo, '2');

        // Sensor ranges
        this._drawSensorRanges(this.agent, debugState);

        // Move target line
        if (agent.isMoving && agent.moveTarget) {
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(agent.position.x, agent.position.y);
            ctx.lineTo(agent.moveTarget.x, agent.moveTarget.y);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Player
        this._drawPlayer(player);

        // Agent
        this._drawAgent(agent, debugState);

        // HUD labels
        this._drawLocationLabels();
    }

    _drawGround(w, h) {
        const { ctx } = this;
        // Base grass
        const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, '#2d5016');
        grad.addColorStop(0.5, '#1e3a0f');
        grad.addColorStop(1, '#152a0a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Subtle grid
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Grass texture dots
        ctx.fillStyle = 'rgba(100, 180, 50, 0.08)';
        for (let i = 0; i < 150; i++) {
            const gx = ((i * 137) % w);
            const gy = ((i * 251) % h);
            ctx.fillRect(gx, gy, 2, 2);
        }
    }

    _drawPaths() {
        const { ctx } = this;
        const paths = [
            [WORLD_LOCATIONS.agentSpawn, WORLD_LOCATIONS.foodShack],
            [WORLD_LOCATIONS.agentSpawn, WORLD_LOCATIONS.doorOne],
            [WORLD_LOCATIONS.agentSpawn, WORLD_LOCATIONS.doorTwo],
            [WORLD_LOCATIONS.doorOne, WORLD_LOCATIONS.restArea],
            [WORLD_LOCATIONS.doorTwo, WORLD_LOCATIONS.restArea],
        ];

        ctx.lineWidth = 12;
        ctx.lineCap = 'round';

        for (const [from, to] of paths) {
            // Path shadow
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath(); ctx.moveTo(from.x, from.y + 2); ctx.lineTo(to.x, to.y + 2); ctx.stroke();
            // Path
            ctx.strokeStyle = 'rgba(139, 119, 80, 0.35)';
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
            // Path highlight
            ctx.strokeStyle = 'rgba(180, 160, 110, 0.1)';
            ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
            ctx.lineWidth = 12;
        }
    }

    _drawTrees() {
        const { ctx } = this;
        for (const tree of this.treePositions) {
            const sway = Math.sin(this.time * 0.8 + tree.swayOffset) * 1.5;

            // Shadow
            ctx.beginPath();
            ctx.ellipse(tree.x + 3, tree.y + tree.size + 2, tree.size * 0.7, tree.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fill();

            // Trunk
            ctx.fillStyle = '#5a3825';
            ctx.fillRect(tree.x - 2, tree.y, 4, tree.size * 0.6);

            // Canopy layers
            const s = tree.size;
            for (let layer = 0; layer < 3; layer++) {
                const layerSize = s * (1.2 - layer * 0.25);
                const ly = tree.y - layer * (s * 0.35) + sway * (layer * 0.3);
                ctx.beginPath();
                ctx.arc(tree.x + sway, ly, layerSize, 0, Math.PI * 2);
                const lightness = 30 + layer * 8;
                ctx.fillStyle = `hsl(${tree.hue}, 60%, ${lightness}%)`;
                ctx.fill();
            }
        }
    }

    _drawFoodShack() {
        const { ctx } = this;
        const loc = WORLD_LOCATIONS.foodShack;

        ctx.save();
        ctx.translate(loc.x, loc.y);

        // Building shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        this._drawRoundRect(-28, -16, 56, 44, 6);

        // Building body
        const grad = ctx.createLinearGradient(-24, -20, 24, 20);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#d97706');
        ctx.fillStyle = grad;
        this._drawRoundRect(-24, -20, 52, 40, 6);

        // Windows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this._drawRoundRect(-18, -12, 10, 10, 2);
        this._drawRoundRect(8, -12, 10, 10, 2);

        // Roof (Stylized tiles)
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.moveTo(-32, -20);
        ctx.lineTo(0, -42);
        ctx.lineTo(32, -20);
        ctx.closePath();
        ctx.fill();

        // Sign board
        ctx.fillStyle = '#fef3c7';
        this._drawRoundRect(-15, -4, 30, 12, 2);
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FACTORY', 0, 4);

        // Emoji
        ctx.font = '16px sans-serif';
        ctx.fillText('�', 0, -48);

        ctx.restore();
    }

    _drawRestArea() {
        const { ctx } = this;
        const loc = WORLD_LOCATIONS.restArea;

        ctx.save();
        ctx.translate(loc.x, loc.y);

        // Building shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        this._drawRoundRect(-28, -16, 56, 44, 6);

        // Building body
        const grad = ctx.createLinearGradient(-24, -20, 24, 20);
        grad.addColorStop(0, '#8b5cf6');
        grad.addColorStop(1, '#7c3aed');
        ctx.fillStyle = grad;
        this._drawRoundRect(-24, -20, 52, 40, 6);

        // Chimney
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(12, -38, 8, 15);

        // Roof
        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.moveTo(-32, -20);
        ctx.lineTo(0, -44);
        ctx.lineTo(32, -20);
        ctx.closePath();
        ctx.fill();

        // Windows (Glowing)
        ctx.fillStyle = 'rgba(255, 243, 204, 0.6)';
        this._drawRoundRect(-16, -10, 12, 12, 2);

        // Sign board
        ctx.fillStyle = '#ede9fe';
        this._drawRoundRect(-15, 6, 30, 12, 2);
        ctx.fillStyle = '#4c1d95';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CABIN', 0, 14);

        // Emoji
        ctx.font = '16px sans-serif';
        ctx.fillText('🏚️', 0, -50);

        ctx.restore();
    }

    _drawDoor(loc, number) {
        const { ctx } = this;

        // Gate base
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.arc(loc.x, loc.y + 2, 18, 0, Math.PI * 2);
        ctx.fill();

        // Gate circle
        const grad = ctx.createRadialGradient(loc.x, loc.y, 2, loc.x, loc.y, 16);
        grad.addColorStop(0, '#22d3ee');
        grad.addColorStop(1, '#0891b2');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(loc.x, loc.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Gate border
        ctx.strokeStyle = '#164e63';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Gate number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, loc.x, loc.y + 1);
        ctx.textBaseline = 'alphabetic';

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`Door ${number}`, loc.x, loc.y + 30);
    }

    _drawSensorRanges(agent, debug) {
        const { ctx } = this;
        const pos = agent.position;

        // Chase range
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, agent.chaseSensor.detectionRadius, 0, Math.PI * 2);
        ctx.fillStyle = debug.playerInChaseRange
            ? 'rgba(239, 68, 68, 0.06)'
            : 'rgba(59, 130, 246, 0.04)';
        ctx.fill();
        ctx.strokeStyle = debug.playerInChaseRange
            ? 'rgba(239, 68, 68, 0.25)'
            : 'rgba(59, 130, 246, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Attack range
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, agent.attackSensor.detectionRadius, 0, Math.PI * 2);
        ctx.fillStyle = debug.playerInAttackRange
            ? 'rgba(239, 68, 68, 0.12)'
            : 'rgba(245, 158, 11, 0.05)';
        ctx.fill();
        ctx.strokeStyle = debug.playerInAttackRange
            ? 'rgba(239, 68, 68, 0.4)'
            : 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    _drawAgent(agent, debug) {
        const { ctx } = this;
        const pos = agent.position;
        const bob = Math.sin(this.time * 6) * 3;
        const isAttacking = debug.currentAction === 'Attack Player';

        ctx.save();
        ctx.translate(pos.x, pos.y + bob);

        // Body Shadow
        ctx.beginPath();
        ctx.ellipse(0, 16 - bob, 12, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fill();

        // 🎀 Big Red Bow (Matching User's Character)
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        // Left loop
        ctx.ellipse(-8, -14, 8, 6, -Math.PI / 6, 0, Math.PI * 2);
        // Right loop
        ctx.ellipse(8, -14, 8, 6, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#991b1b";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Center knot
        ctx.beginPath();
        ctx.arc(0, -14, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Face / Head (Chibi style)
        const headColor = isAttacking ? "#fee2e2" : "#fef3c7";
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hair (Chibi brown hair)
        ctx.fillStyle = "#713f12";
        ctx.beginPath();
        ctx.arc(0, -4, 15, Math.PI, 0); // Top hair
        ctx.fill();
        // Bangs
        ctx.beginPath();
        ctx.moveTo(-14, -4);
        ctx.lineTo(-6, 2);
        ctx.lineTo(0, -2);
        ctx.lineTo(6, 2);
        ctx.lineTo(14, -4);
        ctx.closePath();
        ctx.fill();

        // Eyes (Large blue chibi eyes)
        const eyePulse = Math.sin(this.time * 2) * 0.5 + 1.5;
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.ellipse(-5, 2, 3, 4 * (isAttacking ? 0.5 : 1), 0, 0, Math.PI * 2);
        ctx.ellipse(5, 2, 3, 4 * (isAttacking ? 0.5 : 1), 0, 0, Math.PI * 2);
        ctx.fill();
        // Sparkle
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(-6, 0.5, 1.2, 0, Math.PI * 2);
        ctx.arc(4, 0.5, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Blush
        ctx.fillStyle = "rgba(244, 114, 182, 0.4)";
        ctx.beginPath();
        ctx.arc(-8, 6, 3, 0, Math.PI * 2);
        ctx.arc(8, 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = "#991b1b";
        ctx.beginPath();
        if (isAttacking) {
            ctx.arc(0, 8, 4, Math.PI, 0); // Angry/frown
        } else {
            ctx.arc(0, 7, 3, 0, Math.PI); // Smile
        }
        ctx.stroke();

        // Body (School uniform blazer)
        ctx.fillStyle = "#475569"; // Grey blazer
        ctx.beginPath();
        ctx.moveTo(-8, 12);
        ctx.lineTo(8, 12);
        ctx.lineTo(10, 20);
        ctx.lineTo(-10, 20);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Label & Status
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GOAP Agent', pos.x, pos.y - 32);

        if (debug.currentAction !== 'None') {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '8px JetBrains Mono, monospace';
            ctx.fillText(debug.currentAction, pos.x, pos.y + 36);
        }

        // Health/Stamina Bars
        const barW = 34;
        const barH = 4;
        const barY = pos.y - 25;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this._drawRoundRect(pos.x - barW / 2, barY, barW, barH, 2);
        ctx.fillStyle = debug.health > 50 ? '#22c55e' : debug.health > 25 ? '#f59e0b' : '#ef4444';
        this._drawRoundRect(pos.x - barW / 2, barY, barW * (debug.health / 100), barH, 2);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this._drawRoundRect(pos.x - barW / 2, barY + 6, barW, barH, 2);
        ctx.fillStyle = '#3b82f6';
        this._drawRoundRect(pos.x - barW / 2, barY + 6, barW * (debug.stamina / 100), barH, 2);
    }

    _drawPlayer(player) {
        const { ctx } = this;
        const pos = player.position;
        const bob = Math.sin(this.time * 4 + 1) * 2;

        ctx.save();
        ctx.translate(pos.x, pos.y + bob);

        // Shadow
        ctx.beginPath();
        ctx.ellipse(0, 14 - bob, 10, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fill();

        // Chibi Player (Red theme)
        ctx.fillStyle = "#fee2e2";
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#991b1b"; ctx.lineWidth = 1.5; ctx.stroke();

        // Hair (Red/Pinkish)
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.arc(0, -3, 13, Math.PI, 0); ctx.fill();

        // Eyes
        ctx.fillStyle = "#1e293b";
        ctx.beginPath(); ctx.arc(-4, 2, 2, 0, Math.PI * 2); ctx.arc(4, 2, 2, 0, Math.PI * 2); ctx.fill();

        ctx.restore();

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Player', pos.x, pos.y - 20);

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '7px Inter, sans-serif';
        ctx.fillText('(click to move)', pos.x, pos.y + 24);
    }

    _drawLocationLabels() {
        const { ctx } = this;

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';

        const locs = [
            { ...WORLD_LOCATIONS.foodShack, yOff: 36 },
            { ...WORLD_LOCATIONS.restArea, yOff: 36 },
        ];

        for (const loc of locs) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText(loc.label, loc.x + 2, loc.y + loc.yOff);
        }
    }

    _drawMiniMap(debug) {
        const { ctx, canvas } = this;
        const size = 120;
        const padding = 20;
        const x = canvas.width - size - padding;
        const y = padding;

        ctx.save();
        ctx.translate(x, y);

        // Backdrop
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this._drawRoundRect(0, 0, size, size, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();

        // Scanline effect
        ctx.fillStyle = 'rgba(0,255,255,0.03)';
        for (let i = 0; i < size; i += 4) {
            ctx.fillRect(0, i, size, 1);
        }

        const scaleX = size / canvas.width;
        const scaleY = size / canvas.height;

        // Draw Player (Red dot)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(this.player.position.x * scaleX, this.player.position.y * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw Agent (Blue dot)
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(this.agent.position.x * scaleX, this.agent.position.y * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Compass
        ctx.fillStyle = 'white';
        ctx.font = '8px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('N', size / 2, 8);

        ctx.restore();
    }

    _drawActionPopup(debug) {
        const { ctx, canvas } = this;
        if (debug.currentAction === 'None') return;

        const pad = 12;
        const text = `EXECUTING: ${debug.currentAction.toUpperCase()}`;
        ctx.font = 'bold 9px JetBrains Mono';
        const metrics = ctx.measureText(text);
        const w = metrics.width + pad * 2;
        const h = 24;
        const x = 20;
        const y = canvas.height - 44;

        ctx.save();
        // Glass background
        ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
        this._drawRoundRect(x, y, w, h, 6);
        ctx.strokeStyle = '#60a5fa';
        ctx.stroke();

        // Text
        ctx.fillStyle = '#60a5fa';
        ctx.textAlign = 'left';
        ctx.fillText(text, x + pad, y + 15);

        ctx.restore();
    }

    _drawRoundRect(x, y, w, h, r) {
        const { ctx } = this;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }
}

// ---- Main Simulation Component ----
export default function SimulationCanvas() {
    const canvasRef = useRef(null);
    const agentRef = useRef(null);
    const playerRef = useRef(null);
    const rendererRef = useRef(null);
    const animRef = useRef(null);
    const lastTimeRef = useRef(null);
    const [debugState, setDebugState] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [simSpeed, setSimSpeed] = useState(1);
    const isPausedRef = useRef(false);
    const simSpeedRef = useRef(1);

    // Keep refs in sync with state
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { simSpeedRef.current = simSpeed; }, [simSpeed]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = 800;
        canvas.height = 600;

        const agent = new GoapAgent();
        const player = new PlayerEntity();
        agent.setPlayerTarget(player);

        agentRef.current = agent;
        playerRef.current = player;
        rendererRef.current = new WorldRenderer(canvas);

        let debugCounter = 0;

        const gameLoop = (timestamp) => {
            // ALWAYS schedule the next frame first — simulation must never stop
            animRef.current = requestAnimationFrame(gameLoop);

            try {
                if (!lastTimeRef.current) lastTimeRef.current = timestamp;
                let rawDt = (timestamp - lastTimeRef.current) / 1000;
                lastTimeRef.current = timestamp;

                // Clamp delta to avoid spiral of death, guard against NaN
                if (!isFinite(rawDt) || rawDt < 0) rawDt = 0.016;
                rawDt = Math.min(rawDt, 0.1);

                if (!isPausedRef.current) {
                    const dt = rawDt * simSpeedRef.current;
                    agent.update(dt);
                    player.update(dt);
                }

                // Render always
                const debug = agent.getDebugState();
                rendererRef.current.render(agent, player, debug);

                // Update React state less often to avoid overhead
                debugCounter++;
                if (debugCounter % 3 === 0) {
                    setDebugState({ ...debug });
                }
            } catch (err) {
                console.error('Simulation loop error:', err);
                // Loop continues because requestAnimationFrame was already scheduled
            }
        };

        animRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    const handleCanvasClick = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas || !playerRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        playerRef.current.moveTo({ x, y });
    }, []);

    const handleReset = useCallback(() => {
        if (!agentRef.current || !playerRef.current) return;

        const agent = new GoapAgent();
        const player = new PlayerEntity();
        agent.setPlayerTarget(player);
        agentRef.current = agent;
        playerRef.current = player;

        // We need to re-reference in the game loop — so force remount
        window.location.reload();
    }, []);

    return (
        <div className={styles.simulationWrapper}>
            <div className={styles.canvasSection}>
                <div className={styles.canvasHeader}>
                    <h3>🌍 2D GOAP World</h3>
                    <div className={styles.controls}>
                        <button
                            id="sim-pause-btn"
                            className={`${styles.controlBtn} ${isPaused ? styles.active : ''}`}
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? '▶ Play' : '⏸ Pause'}
                        </button>
                        <div className={styles.speedControl}>
                            <label>Speed:</label>
                            <select
                                id="sim-speed-select"
                                value={simSpeed}
                                onChange={(e) => setSimSpeed(Number(e.target.value))}
                                className={styles.speedSelect}
                            >
                                <option value={0.25}>0.25x</option>
                                <option value={0.5}>0.5x</option>
                                <option value={1}>1x</option>
                                <option value={2}>2x</option>
                                <option value={3}>3x</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.canvasContainer}>
                    <canvas
                        ref={canvasRef}
                        className={styles.canvas}
                        onClick={handleCanvasClick}
                        id="goap-simulation-canvas"
                    />
                    <div className={styles.legend}>
                        <span className={styles.legendItem}>
                            <span className={styles.dot} style={{ background: '#3b82f6' }} />
                            AI Agent
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.dot} style={{ background: '#ef4444' }} />
                            Player (click to move)
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.dotRing} style={{ borderColor: 'rgba(59,130,246,0.4)' }} />
                            Chase Range
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.dotRing} style={{ borderColor: 'rgba(245,158,11,0.5)' }} />
                            Attack Range
                        </span>
                    </div>
                </div>
            </div>

            <DebugPanel debugState={debugState} />
        </div>
    );
}
