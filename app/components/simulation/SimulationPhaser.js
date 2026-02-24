"use client";
import React, { useEffect, useRef, useState } from "react";
import { GoapAgent, PlayerEntity, WORLD_LOCATIONS } from "../../lib/goap/agent";
import DebugPanel from "./DebugPanel";
import styles from "./SimulationCanvas.module.css";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require('phaser');
}

// Premium Color Palette
const COLORS = {
    GRASS_BASE: 0x1a2e05,
    GRASS_DARK: 0x152a0a,
    PATH_DIRT: 0x3d2b1f,
    PATH_HIGHLIGHT: 0x4d3b2f,
    FACTORY_BODY: 0xf59e0b,
    FACTORY_ROOF: 0x78350f,
    CABIN_BODY: 0x8b5cf6,
    CABIN_ROOF: 0x4c1d95,
    UI_ACCENT: 0x60a5fa,
    UI_BG: 0x0f172a
};

export default function SimulationPhaser() {
    const gameContainerRef = useRef(null);
    const gameRef = useRef(null);
    const [debugState, setDebugState] = useState(null);

    useEffect(() => {
        if (!gameContainerRef.current) return;

        const agentLogic = new GoapAgent();
        const playerLogic = new PlayerEntity();
        agentLogic.setPlayerTarget(playerLogic);

        const config = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
            width: 800,
            height: 600,
            transparent: true,
            audio: {
                noAudio: true
            },
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            },
            scene: {
                create: create,
                update: update
            }
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        let agentGroup;
        let playerGroup;
        let hudContainer;
        let actionLabel;
        let cursors;
        let wasd;
        let timer = 0;

        function create() {
            const scene = this;

            // --- 1. PRO ENVIRONMENT RENDERING ---

            // Base Terrain with Deep Gradients
            const bg = scene.add.graphics();
            bg.fillGradientStyle(COLORS.GRASS_DARK, COLORS.GRASS_DARK, COLORS.GRASS_BASE, COLORS.GRASS_BASE, 1);
            bg.fillRect(0, 0, 800, 600);

            // Subtle Vignette Effect
            const vignette = scene.add.graphics();
            vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.4, 0.4);
            vignette.fillRect(0, 0, 800, 600);
            vignette.setDepth(100);

            // Organic Paths
            const paths = scene.add.graphics();
            paths.lineStyle(24, COLORS.PATH_DIRT, 0.4);
            const drawOrganicPath = (from, to) => {
                paths.beginPath();
                paths.moveTo(from.x, from.y);
                // Add some jitter to make it look "hand-drawn"
                const centerX = (from.x + to.x) / 2 + (Math.random() * 20 - 10);
                const centerY = (from.y + to.y) / 2 + (Math.random() * 20 - 10);
                paths.lineTo(centerX, centerY);
                paths.lineTo(to.x, to.y);
                paths.strokePath();
            };
            drawOrganicPath(WORLD_LOCATIONS.agentSpawn, WORLD_LOCATIONS.foodShack);
            drawOrganicPath(WORLD_LOCATIONS.agentSpawn, WORLD_LOCATIONS.doorOne);
            drawOrganicPath(WORLD_LOCATIONS.doorOne, WORLD_LOCATIONS.restArea);
            drawOrganicPath(WORLD_LOCATIONS.doorTwo, WORLD_LOCATIONS.restArea);

            // Nature Assets (Procedural Trees & Rocks)
            for (let i = 0; i < 40; i++) {
                const x = Phaser.Math.Between(0, 800);
                const y = Phaser.Math.Between(0, 600);
                // Skip if near key locations
                let tooClose = false;
                [WORLD_LOCATIONS.foodShack, WORLD_LOCATIONS.restArea, WORLD_LOCATIONS.agentSpawn].forEach(loc => {
                    if (Phaser.Math.Distance.Between(x, y, loc.x, loc.y) < 60) tooClose = true;
                });

                if (!tooClose) {
                    if (Math.random() > 0.4) {
                        createStylizedTree(scene, x, y);
                    } else {
                        createStylizedRock(scene, x, y);
                    }
                }
            }

            // --- 2. PREMIUM BUILDINGS ---
            createProfessionalBuilding(scene, WORLD_LOCATIONS.foodShack, COLORS.FACTORY_BODY, COLORS.FACTORY_ROOF, "FOOD FACTORY", "🥩", 0xfacc15);
            createProfessionalBuilding(scene, WORLD_LOCATIONS.restArea, COLORS.CABIN_BODY, COLORS.CABIN_ROOF, "SLEEP CABIN", "💤", 0xa78bfa);

            // Interactive Doors (Portals)
            createPortal(scene, WORLD_LOCATIONS.doorOne, 'GATE ALPHA');
            createPortal(scene, WORLD_LOCATIONS.doorTwo, 'GATE BETA');

            // --- 3. THE CHIBI AGENT (RIBBON GIRL) ---
            agentGroup = createChibiCharacter(scene, "AGENT", true);
            playerGroup = createChibiCharacter(scene, "PLAYER", false);

            // --- 4. HUD UPGRADE ---
            setupLuxuryHUD(scene);

            // Input handlers
            cursors = scene.input.keyboard.createCursorKeys();
            wasd = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            });

            scene.input.on('pointerdown', (pointer) => {
                playerLogic.moveTo({ x: pointer.x, y: pointer.y });
                createClickRipple(scene, pointer.x, pointer.y);
            });
        }

        function update(time, delta) {
            const dt = delta / 1000;
            timer += dt;

            // Keyboard Movement (WASD + Arrows)
            const playerSpeed = 300;
            const moveX = (cursors.left.isDown || wasd.left.isDown) ? -1 : (cursors.right.isDown || wasd.right.isDown) ? 1 : 0;
            const moveY = (cursors.up.isDown || wasd.up.isDown) ? -1 : (cursors.down.isDown || wasd.down.isDown) ? 1 : 0;

            if (moveX !== 0 || moveY !== 0) {
                const newX = playerLogic.position.x + moveX * playerSpeed * dt;
                const newY = playerLogic.position.y + moveY * playerSpeed * dt;
                playerLogic.moveTo({ x: newX, y: newY });
            }

            // Logic Update
            agentLogic.update(dt);
            playerLogic.update(dt);

            // Smoothing & Interpolation
            agentGroup.x = Phaser.Math.Linear(agentGroup.x, agentLogic.position.x, 0.2);
            agentGroup.y = Phaser.Math.Linear(agentGroup.y, agentLogic.position.y, 0.2);

            playerGroup.x = Phaser.Math.Linear(playerGroup.x, playerLogic.position.x, 0.2);
            playerGroup.y = Phaser.Math.Linear(playerGroup.y, playerLogic.position.y, 0.2);

            // Dynamic Bobbing & Sway
            const bob = Math.sin(timer * 6) * 4;
            agentGroup.getAt(0).y = bob;
            playerGroup.getAt(0).y = Math.sin(timer * 5 + 1) * 3;

            // AI State Visuals
            const debug = agentLogic.getDebugState();
            setDebugState(debug);

            if (debug.currentAction !== "None" && actionLabel.text !== `▶ ${debug.currentAction.toUpperCase()}`) {
                actionLabel.setText(`▶ ${debug.currentAction.toUpperCase()}`);

                // Spawn Floating Notification
                createActionNotification(this, debug.currentAction);

                if (debug.currentAction.includes("Attack")) {
                    this.cameras.main.shake(100, 0.005);
                    agentGroup.setScale(1.15);
                } else {
                    agentGroup.setScale(1);
                }
            }
        }

        function createActionNotification(scene, action) {
            const text = scene.add.text(agentGroup.x, agentGroup.y - 40, action.toUpperCase(), {
                fontSize: '10px',
                fontWeight: '900',
                color: '#fff',
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);

            scene.tweens.add({
                targets: text,
                y: text.y - 60,
                alpha: 0,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => text.destroy()
            });
        }

        // --- PREFAB FUNCTIONS (THE "DESIGNER" PART) ---

        function createStylizedTree(scene, x, y) {
            const group = scene.add.container(x, y);
            const trunk = scene.add.rectangle(0, 0, 6, 20, 0x422006).setOrigin(0.5, 0);
            const shadow = scene.add.ellipse(0, 20, 20, 8, 0x000000, 0.2);

            const leaves = scene.add.graphics();
            leaves.fillStyle(0x064e3b, 0.9);
            leaves.fillCircle(0, -5, 12);
            leaves.fillCircle(-8, 5, 10);
            leaves.fillCircle(8, 5, 10);

            group.add([shadow, trunk, leaves]);
            scene.tweens.add({
                targets: leaves,
                x: 2,
                duration: 2000 + Math.random() * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        function createStylizedRock(scene, x, y) {
            const g = scene.add.graphics({ x, y });
            g.fillStyle(0x475569, 0.8);
            const points = [
                { x: -10, y: 5 }, { x: 0, y: -8 }, { x: 12, y: 3 }, { x: 5, y: 10 }, { x: -8, y: 8 }
            ];
            g.fillPoints(points, true);
            g.lineStyle(1, 0x1e293b);
            g.strokePoints(points, true);
        }

        function createProfessionalBuilding(scene, loc, bodyColor, roofColor, label, emoji, glowColor) {
            const container = scene.add.container(loc.x, loc.y);

            // Neon Glow effect
            const glow = scene.add.graphics();
            glow.fillStyle(glowColor, 0.15);
            glow.fillCircle(0, 0, 45);

            // Ground Shadow
            const shadow = scene.add.ellipse(0, 20, 70, 30, 0x000000, 0.3);

            // Main Structure (Beveled look)
            const body = scene.add.graphics();
            body.fillStyle(bodyColor);
            body.fillRoundedRect(-30, -20, 60, 50, 8);
            body.lineStyle(2, 0xffffff, 0.3);
            body.strokeRoundedRect(-30, -20, 60, 50, 8);

            // Roof
            const roof = scene.add.graphics();
            roof.fillStyle(roofColor);
            roof.fillTriangle(-38, -20, 38, -20, 0, -55);
            roof.lineStyle(2, 0xffffff, 0.2);
            roof.strokeTriangle(-38, -20, 38, -20, 0, -55);

            // Windows with light
            const win1 = scene.add.rectangle(-15, 0, 12, 12, 0xffffff, 0.2);
            const win2 = scene.add.rectangle(15, 0, 12, 12, 0xffffff, 0.2);

            const labelText = scene.add.text(0, 40, label, {
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'Inter, sans-serif',
                color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5);

            const icon = scene.add.text(0, -35, emoji, { fontSize: '24px' }).setOrigin(0.5);

            container.add([shadow, glow, body, roof, win1, win2, labelText, icon]);
        }

        function createPortal(scene, loc, name) {
            const core = scene.add.circle(loc.x, loc.y, 20, 0x0ea5e9, 0.2).setStrokeStyle(2, 0x0ea5e9, 0.8);
            const label = scene.add.text(loc.x, loc.y + 35, name, { fontSize: '9px', color: '#0ea5e9' }).setOrigin(0.5);

            scene.tweens.add({
                targets: core,
                scale: 1.3,
                alpha: 0.1,
                duration: 1500,
                repeat: -1,
                yoyo: false
            });
        }

        function createChibiCharacter(scene, label, isAgent) {
            const root = scene.add.container(0, 0);
            const inner = scene.add.container(0, 0);
            root.add(inner);

            // Character Shadow
            const shadow = scene.add.ellipse(0, 15, 24, 8, 0x000000, 0.2);

            // 🎀 The Ribbon (Agent Only)
            if (isAgent) {
                const ribbon = scene.add.graphics();
                ribbon.fillStyle(0xef4444);
                ribbon.fillEllipse(-10, -18, 14, 10);
                ribbon.fillEllipse(10, -18, 14, 10);
                ribbon.fillCircle(0, -18, 4);
                ribbon.lineStyle(1, 0x000000, 0.4);
                ribbon.strokeEllipse(-10, -18, 14, 10);
                ribbon.strokeEllipse(10, -18, 14, 10);
                inner.add(ribbon);
            }

            // Head (Smooth gradient skin)
            const head = scene.add.graphics();
            head.fillStyle(isAgent ? 0xfef3c7 : 0xfee2e2);
            head.fillCircle(0, 0, 16);
            head.lineStyle(1.5, 0x422006);
            head.strokeCircle(0, 0, 16);

            // Hair (Stylized)
            const hair = scene.add.graphics();
            hair.fillStyle(isAgent ? 0x713f12 : 0xef4444);
            // Top hair (Semi-circle)
            hair.slice(0, -4, 17, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), true);
            hair.fillPath();
            // Bangs
            const bangs = [
                { x: -16, y: -4 }, { x: -8, y: 4 }, { x: 0, y: -2 }, { x: 8, y: 4 }, { x: 16, y: -4 }
            ];
            hair.fillPoints(bangs, true);

            // Eyes (Expressive)
            const eyes = scene.add.graphics();
            eyes.fillStyle(0x1e3a8a);
            eyes.fillEllipse(-6, 2, 6, 8);
            eyes.fillEllipse(6, 2, 6, 8);
            // Sparkle
            eyes.fillStyle(0xffffff);
            eyes.fillCircle(-7, 0, 2);
            eyes.fillCircle(5, 0, 2);

            // Body (Suit / Uniform)
            const body = scene.add.graphics();
            body.fillStyle(isAgent ? 0x475569 : 0x991b1b);
            body.fillRoundedRect(-10, 12, 20, 12, 4);

            const nameTag = scene.add.text(0, -38, label, {
                fontSize: '10px',
                fontWeight: '900',
                color: isAgent ? '#60a5fa' : '#ef4444'
            }).setOrigin(0.5);

            inner.add([shadow, body, head, hair, eyes, nameTag]);
            return root;
        }

        function setupLuxuryHUD(scene) {
            hudContainer = scene.add.container(20, 530);

            const bg = scene.add.graphics();
            bg.fillStyle(COLORS.UI_BG, 0.9);
            bg.fillRoundedRect(0, 0, 260, 50, 12);
            bg.lineStyle(2, COLORS.UI_ACCENT, 0.5);
            bg.strokeRoundedRect(0, 0, 260, 50, 12);

            const title = scene.add.text(15, 10, "GOAP SYSTEM LOG", {
                fontSize: '9px',
                color: COLORS.UI_ACCENT,
                fontWeight: 'bold'
            });

            actionLabel = scene.add.text(15, 24, "INITIALIZING...", {
                fontSize: '13px',
                color: '#fff',
                fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace'
            });

            hudContainer.add([bg, title, actionLabel]);
        }

        function createClickRipple(scene, x, y) {
            const ripple = scene.add.circle(x, y, 2, 0xffffff, 0.5);
            scene.tweens.add({
                targets: ripple,
                scale: 15,
                alpha: 0,
                duration: 600,
                onComplete: () => ripple.destroy()
            });
        }

        return () => {
            game.destroy(true);
        };
    }, []);

    return (
        <div className={styles.simulationWrapper}>
            <div className={styles.canvasSection}>
                <div className={styles.canvasHeader}>
                    <h3>⚡ Pro 2D Engine</h3>
                    <div className={styles.engineBadge}>ULTRA HIGH QUALITY</div>
                </div>
                <div className={styles.canvasContainer} ref={gameContainerRef} />
            </div>
            <DebugPanel debugState={debugState} />
        </div>
    );
}
