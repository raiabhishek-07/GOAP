import { MIND_ARENA_LEVELS } from "../../../lib/game/LevelConfig";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class DeploymentLoadingScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'DeploymentLoadingScene' });
    }

    init(data) {
        this.level = data.level ?? 1;
        this.stage = data.stage ?? 1;
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;
        const levelConfig = MIND_ARENA_LEVELS[this.level] || { color: '#ffffff' };
        const themeColor = Phaser.Display.Color.HexStringToColor(levelConfig.color || '#ffffff').color;

        // ─── BACKGROUND ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 1);
        bg.fillRect(0, 0, width, height);

        // Grid overlay
        const grid = this.add.graphics();
        grid.lineStyle(0.5, themeColor, 0.05);
        const spacing = 60;
        for (let x = 0; x < width; x += spacing) grid.lineBetween(x, 0, x, height);
        for (let y = 0; y < height; y += spacing) grid.lineBetween(0, y, width, y);

        // ─── TACTICAL VIGNETTE ─────────────────────────
        const vignette = this.add.graphics();
        vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.4, 0.4);
        vignette.fillRect(0, 0, width, height);

        // ─── LEVEL OBJECT VISUALIZATION ────────────────
        this.createLevelObject(cx, cy - 40, themeColor);

        // ─── UI ELEMENTS ───────────────────────────────
        this.add.text(cx, cy + 100, 'MISSION DEPLOYMENT IN PROGRESS', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
            letterSpacing: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const statusLabel = this.add.text(cx, cy + 124, 'INITIALIZING TACTICAL OVERLAY...', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: levelConfig.color,
            letterSpacing: 2
        }).setOrigin(0.5);

        // Progress Bar
        const barW = 300, barH = 2;
        const barX = cx - barW / 2;
        const barY = cy + 145;

        this.add.graphics().fillStyle(0xffffff, 0.1).fillRect(barX, barY, barW, barH);
        const progressFill = this.add.graphics();

        // ─── LOADING SEQUENCE ──────────────────────────
        const statuses = [
            'CALIBRATING SENSORS...',
            'SYNCING AGENT CORES...',
            'PARSING GOAP OBJECTIVES...',
            'UPLOADING TERRAIN DATA...',
            'ARMING NEURAL NETS...',
            'READY FOR DEPLOYMENT'
        ];

        let progress = 0;
        this.time.addEvent({
            delay: 50,
            repeat: 40,
            callback: () => {
                progress += 2.5;
                progressFill.clear();
                progressFill.fillStyle(themeColor, 1);
                progressFill.fillRect(barX, barY, (progress / 100) * barW, barH);

                const statusIdx = Math.floor((progress / 100) * statuses.length);
                if (statusIdx < statuses.length) {
                    statusLabel.setText(statuses[statusIdx]);
                }

                if (progress >= 100) {
                    this.time.delayedCall(500, () => {
                        this.cameras.main.fadeOut(400, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.start('GameScene', { level: this.level, stage: this.stage });
                        });
                    });
                }
            }
        });
    }

    createLevelObject(x, y, color) {
        const container = this.add.container(x, y);

        if (this.level === 1) {
            // LEVEL 1: Blue-print Cube (Building Blocks)
            this.drawBlueprintCube(container, color);
        } else if (this.level === 2) {
            // LEVEL 2: Tactical Nodes (Relay)
            this.drawTacticalNodes(container, color);
        } else if (this.level === 0) {
            // LEVEL 0: Virtual Simulation (Training)
            this.drawSimulationGrid(container, color);
        } else {
            // LEVEL 3: Neural Nexus (Mastery)
            this.drawNeuralNexus(container, color);
        }
    }

    drawSimulationGrid(container, color) {
        const g = this.add.graphics();
        container.add(g);

        this.tweens.addCounter({
            from: 0, to: 100, duration: 3000, repeat: -1,
            onUpdate: (tween) => {
                const t = tween.getValue() / 100;
                g.clear();
                g.lineStyle(2, color, 0.6);

                // Scanning horizontal line
                const scanLineY = -100 + (t * 200);
                g.lineBetween(-150, scanLineY, 150, scanLineY);

                // Grid Perspective
                g.lineStyle(1, color, 0.2);
                for (let i = -100; i <= 100; i += 40) {
                    g.lineBetween(i * 1.5, 100, i * 0.5, -100); // Vertical vanishing
                    g.lineBetween(-150, i, 150, i); // Horizontal
                }

                // Hazard warning overlay (tiny icons)
                g.fillStyle(color, 0.4);
                g.fillTriangle(-8, scanLineY - 12, 8, scanLineY - 12, 0, scanLineY - 24);
            }
        });
    }

    drawBlueprintCube(container, color) {
        const g = this.add.graphics();
        container.add(g);

        this.tweens.addCounter({
            from: 0, to: 360, duration: 4000, repeat: -1,
            onUpdate: (tween) => {
                const angle = tween.getValue() * (Math.PI / 180);
                g.clear();
                g.lineStyle(1.5, color, 0.8);

                // Simple iso cube wireframe
                const size = 60;
                const points = [
                    { x: Math.cos(angle) * size, y: Math.sin(angle) * size / 2 },
                    { x: Math.cos(angle + Math.PI / 2) * size, y: Math.sin(angle + Math.PI / 2) * size / 2 },
                    { x: Math.cos(angle + Math.PI) * size, y: Math.sin(angle + Math.PI) * size / 2 },
                    { x: Math.cos(angle + 3 * Math.PI / 2) * size, y: Math.sin(angle + 3 * Math.PI / 2) * size / 2 }
                ];

                // Bottom
                g.strokePoints(points, true);
                // Top
                const topPoints = points.map(p => ({ x: p.x, y: p.y - 60 }));
                g.strokePoints(topPoints, true);
                // Connections
                for (let i = 0; i < 4; i++) {
                    g.lineBetween(points[i].x, points[i].y, topPoints[i].x, topPoints[i].y);
                }

                // Add some blueprint decorations
                g.lineStyle(0.5, color, 0.3);
                g.strokeCircle(0, -30, 100);
            }
        });
    }

    drawTacticalNodes(container, color) {
        const g = this.add.graphics();
        container.add(g);

        const nodes = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            nodes.push({ x: Math.cos(angle) * 70, y: Math.sin(angle) * 70, pulse: Math.random() });
        }

        this.tweens.addCounter({
            from: 0, to: 1, duration: 2000, repeat: -1, yoyo: true,
            onUpdate: (tween) => {
                const val = tween.getValue();
                g.clear();

                // Pulse connections
                g.lineStyle(1, color, 0.2 + val * 0.3);
                nodes.forEach((n, i) => {
                    const next = nodes[(i + 1) % nodes.length];
                    g.lineBetween(n.x, n.y, next.x, next.y);
                    g.lineBetween(n.x, n.y, 0, 0);
                });

                // Nodes
                nodes.forEach(n => {
                    g.fillStyle(color, 0.6 + val * 0.4);
                    g.fillCircle(n.x, n.y, 4);
                    g.lineStyle(1, color, 0.3);
                    g.strokeCircle(n.x, n.y, 10 + val * 10);
                });

                // Core
                g.fillStyle(color, 0.8);
                g.fillTriangle(0, -15, 13, 8, -13, 8);
            }
        });
    }

    drawNeuralNexus(container, color) {
        const g = this.add.graphics();
        container.add(g);

        this.tweens.addCounter({
            from: 0, to: 360, duration: 6000, repeat: -1,
            onUpdate: (tween) => {
                const angle = tween.getValue() * (Math.PI / 180);
                g.clear();

                // Outer rotating hex rings
                const rings = [100, 80, 60, 40];
                rings.forEach((r, i) => {
                    const rot = i % 2 === 0 ? angle : -angle;
                    g.lineStyle(1.5, color, 0.2 + (i / 10));
                    this.drawHex(g, 0, 0, r, rot);
                });

                // Central Core
                const pulse = Math.sin(angle * 4) * 5;
                g.fillStyle(color, 0.8);
                this.drawHex(g, 0, 0, 15 + pulse, angle * 2, true);

                // Glitchy lines
                g.lineStyle(0.5, color, 0.4);
                for (let j = 0; j < 6; j++) {
                    const lAngle = (j / 6) * Math.PI * 2 + angle;
                    g.lineBetween(
                        Math.cos(lAngle) * 20, Math.sin(lAngle) * 20,
                        Math.cos(lAngle) * 120, Math.sin(lAngle) * 120
                    );
                }
            }
        });
    }

    drawHex(g, x, y, size, rotation, fill = false) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = rotation + (i / 6) * Math.PI * 2;
            points.push({ x: x + Math.cos(angle) * size, y: y + Math.sin(angle) * size });
        }
        if (fill) g.fillPoints(points, true);
        else g.strokePoints(points, true);
    }
}
