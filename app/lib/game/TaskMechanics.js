// ============================================================
// TaskMechanics.js — Specialized game mechanics for each task type
// Zone Capture, Defense Hold, Intel Gather, Fog of War
// ============================================================

import * as Phaser from 'phaser';
import { TASK_TYPE, TASK_STATE } from './TaskSystem.js';

// ─── ZONE CAPTURE ───────────────────────────────────────────
// Circular area on the map. Player must stand inside for channelTime.
// If enemy enters, capture is contested/reset.

export class ZoneCaptureRenderer {
    constructor(scene) {
        this.scene = scene;
        this.zones = new Map(); // taskId → { container, fill, ring, progressArc, label }
    }

    createZone(task) {
        const radius = task.captureRadius || 60;
        const container = this.scene.add.container(task.position.x, task.position.y);
        container.setDepth(3);

        // Outer ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0xff7043, 0.3);
        ring.strokeCircle(0, 0, radius);
        // Inner dashed ring
        ring.lineStyle(1, 0xff7043, 0.15);
        ring.strokeCircle(0, 0, radius * 0.7);

        // Fill (shows progress as a growing pie)
        const fill = this.scene.add.graphics();

        // Progress arc (animated as player channels)
        const progressArc = this.scene.add.graphics();

        // Corner markers
        const markers = this.scene.add.graphics();
        markers.lineStyle(2, 0xff7043, 0.5);
        const markerLen = 12;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 - Math.PI / 4;
            const mx = Math.cos(angle) * radius;
            const my = Math.sin(angle) * radius;
            markers.lineBetween(
                mx - Math.cos(angle) * markerLen, my - Math.sin(angle) * markerLen,
                mx, my
            );
        }

        // Label
        const label = this.scene.add.text(0, radius + 16, '🏴 CAPTURE ZONE', {
            fontSize: '9px',
            fontFamily: '"Courier New", monospace',
            color: '#ff7043',
            fontStyle: 'bold',
            letterSpacing: 1,
        }).setOrigin(0.5);

        // Status text
        const status = this.scene.add.text(0, -8, '', {
            fontSize: '11px',
            fontFamily: '"Courier New", monospace',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        container.add([ring, fill, progressArc, markers, label, status]);

        // Pulsing ring animation
        this.scene.tweens.add({
            targets: ring,
            alpha: 0.1,
            duration: 2000,
            yoyo: true,
            repeat: -1,
        });

        this.zones.set(task.id, {
            container, fill, ring, progressArc, label, status,
            radius, task,
        });
    }

    update(tasks, playerPos, enemies) {
        for (const [taskId, zone] of this.zones) {
            const task = tasks.get(taskId);
            if (!task) continue;

            const dist = Phaser.Math.Distance.Between(
                playerPos.x, playerPos.y,
                task.position.x, task.position.y
            );

            const playerInZone = dist < zone.radius;
            const pct = task.getChannelPercent();

            // Check if any enemy is in the zone (contested)
            let contested = false;
            if (enemies) {
                contested = enemies.some(e => {
                    if (!e.active) return false;
                    const ed = Phaser.Math.Distance.Between(
                        e.x, e.y, task.position.x, task.position.y
                    );
                    return ed < zone.radius;
                });
            }

            // Update fill graphic
            zone.fill.clear();
            if (task.state === TASK_STATE.COMPLETED) {
                zone.fill.fillStyle(0x22c55e, 0.12);
                zone.fill.fillCircle(0, 0, zone.radius);
                zone.status.setText('✅ CAPTURED');
                zone.status.setColor('#22c55e');
                zone.ring.clear();
                zone.ring.lineStyle(2, 0x22c55e, 0.4);
                zone.ring.strokeCircle(0, 0, zone.radius);
            } else if (task.state === TASK_STATE.IN_PROGRESS) {
                // Show progress pie
                const color = contested ? 0xef4444 : 0xff7043;
                zone.fill.fillStyle(color, 0.08 + pct * 0.12);
                zone.fill.slice(0, 0, zone.radius, 0, pct * Math.PI * 2, false);
                zone.fill.fillPath();

                // Progress arc
                zone.progressArc.clear();
                zone.progressArc.lineStyle(3, color, 0.7);
                zone.progressArc.beginPath();
                zone.progressArc.arc(0, 0, zone.radius - 4, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2, false);
                zone.progressArc.strokePath();

                const pctText = `${Math.round(pct * 100)}%`;
                if (contested) {
                    zone.status.setText(`⚔ CONTESTED ${pctText}`);
                    zone.status.setColor('#ef4444');
                } else if (playerInZone) {
                    zone.status.setText(`⏳ CAPTURING ${pctText}`);
                    zone.status.setColor('#ff7043');
                } else {
                    zone.status.setText(`⏸ ENTER ZONE ${pctText}`);
                    zone.status.setColor('#94a3b8');
                }
            } else if (task.state === TASK_STATE.AVAILABLE) {
                if (playerInZone) {
                    zone.fill.fillStyle(0xff7043, 0.05);
                    zone.fill.fillCircle(0, 0, zone.radius);
                    zone.status.setText('[ E ] CAPTURE');
                    zone.status.setColor('#ff7043');
                } else {
                    zone.status.setText('STAND INSIDE');
                    zone.status.setColor('#475569');
                }
            } else if (task.state === TASK_STATE.LOCKED) {
                zone.status.setText('🔒 LOCKED');
                zone.status.setColor('#475569');
            }
        }
    }

    /**
     * Check if player is inside a zone and should auto-channel
     */
    getActiveZone(playerPos, tasks) {
        for (const [taskId, zone] of this.zones) {
            const task = tasks.get(taskId);
            if (!task || task.state === TASK_STATE.COMPLETED || task.state === TASK_STATE.LOCKED) continue;

            const dist = Phaser.Math.Distance.Between(
                playerPos.x, playerPos.y,
                task.position.x, task.position.y
            );

            if (dist < zone.radius) {
                return task;
            }
        }
        return null;
    }

    destroy() {
        for (const [, zone] of this.zones) {
            zone.container.destroy();
        }
        this.zones.clear();
    }
}

// ─── DEFENSE HOLD ───────────────────────────────────────────
// Player enters zone → waves of enemies spawn → survive channelTime

export class DefenseHoldRenderer {
    constructor(scene) {
        this.scene = scene;
        this.holds = new Map(); // taskId → { container, ... }
        this.activeWaves = new Map(); // taskId → { enemies, waveIndex, timer }
    }

    createHold(task) {
        const radius = task.captureRadius || 70;
        const container = this.scene.add.container(task.position.x, task.position.y);
        container.setDepth(3);

        // Hexagonal border
        const hex = this.scene.add.graphics();
        hex.lineStyle(2, 0xef5350, 0.4);
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
            points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
        }
        hex.beginPath();
        hex.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < 6; i++) hex.lineTo(points[i].x, points[i].y);
        hex.closePath();
        hex.strokePath();

        // Warning stripes around edge
        const stripes = this.scene.add.graphics();
        stripes.lineStyle(1, 0xef5350, 0.1);
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            stripes.lineBetween(
                Math.cos(angle) * (radius - 15), Math.sin(angle) * (radius - 15),
                Math.cos(angle) * radius, Math.sin(angle) * radius
            );
        }

        // Shield icon in center
        const icon = this.scene.add.text(0, -5, '🛡️', { fontSize: '24px' }).setOrigin(0.5);

        // Status
        const status = this.scene.add.text(0, 18, 'DEFENSE POINT', {
            fontSize: '9px',
            fontFamily: '"Courier New", monospace',
            color: '#ef5350',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Timer ring
        const timerRing = this.scene.add.graphics();

        // Wave counter
        const waveText = this.scene.add.text(0, radius + 16, '', {
            fontSize: '8px',
            fontFamily: '"Courier New", monospace',
            color: '#ef5350',
        }).setOrigin(0.5);

        container.add([hex, stripes, icon, status, timerRing, waveText]);

        this.holds.set(task.id, {
            container, hex, icon, status, timerRing, waveText,
            radius, task,
        });
    }

    update(tasks, playerPos) {
        for (const [taskId, hold] of this.holds) {
            const task = tasks.get(taskId);
            if (!task) continue;

            const pct = task.getChannelPercent();
            const dist = Phaser.Math.Distance.Between(
                playerPos.x, playerPos.y,
                task.position.x, task.position.y
            );
            const playerInZone = dist < hold.radius;

            // Update timer ring
            hold.timerRing.clear();
            if (task.state === TASK_STATE.IN_PROGRESS) {
                hold.timerRing.lineStyle(4, 0xef5350, 0.8);
                hold.timerRing.beginPath();
                hold.timerRing.arc(0, 0, hold.radius + 5, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2, false);
                hold.timerRing.strokePath();

                hold.status.setText(`⏳ SURVIVE ${Math.round(pct * 100)}%`);
                hold.status.setColor('#ef5350');

                // Wave info
                const wave = this.activeWaves.get(taskId);
                if (wave) {
                    hold.waveText.setText(`WAVE ${wave.waveIndex + 1}/3 — ${wave.enemies.filter(e => e.active).length} enemies`);
                }
            } else if (task.state === TASK_STATE.COMPLETED) {
                hold.status.setText('✅ DEFENDED');
                hold.status.setColor('#22c55e');
                hold.icon.setText('✅');
                hold.hex.clear();
                hold.hex.lineStyle(2, 0x22c55e, 0.4);
                const points = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
                    points.push({ x: Math.cos(angle) * hold.radius, y: Math.sin(angle) * hold.radius });
                }
                hold.hex.beginPath();
                hold.hex.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < 6; i++) hold.hex.lineTo(points[i].x, points[i].y);
                hold.hex.closePath();
                hold.hex.strokePath();
            } else if (task.state === TASK_STATE.AVAILABLE) {
                if (playerInZone) {
                    hold.status.setText('[ E ] DEFEND');
                    hold.status.setColor('#ef5350');
                } else {
                    hold.status.setText('ENTER TO DEFEND');
                    hold.status.setColor('#475569');
                }
            } else if (task.state === TASK_STATE.LOCKED) {
                hold.status.setText('🔒 LOCKED');
                hold.status.setColor('#475569');
            }
        }
    }

    /**
     * Spawn defense wave enemies around a hold point
     */
    spawnWave(taskId, waveIndex = 0) {
        const hold = this.holds.get(taskId);
        if (!hold) return [];

        const count = 2 + waveIndex; // 2, 3, 4 enemies per wave
        const enemies = [];

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const spawnDist = hold.radius + 80;
            const sx = hold.task.position.x + Math.cos(angle) * spawnDist;
            const sy = hold.task.position.y + Math.sin(angle) * spawnDist;

            // Create a simple defense enemy
            const enemy = this._createDefenseEnemy(sx, sy);
            if (enemy) {
                // Move toward center
                enemy._defenseTarget = { x: hold.task.position.x, y: hold.task.position.y };
                enemies.push(enemy);
            }
        }

        this.activeWaves.set(taskId, {
            enemies,
            waveIndex,
            timer: 0,
        });

        return enemies;
    }

    _createDefenseEnemy(x, y) {
        // Create a simple circle-based enemy
        const container = this.scene.add.container(x, y).setDepth(40);

        const body = this.scene.add.graphics();
        body.fillStyle(0xef4444, 0.9);
        body.fillCircle(0, 0, 10);
        body.lineStyle(1, 0xff6666, 0.8);
        body.strokeCircle(0, 0, 10);

        const eye = this.scene.add.circle(0, -2, 3, 0xffffff);
        const pupil = this.scene.add.circle(0, -2, 1.5, 0x000000);

        const label = this.scene.add.text(0, -18, 'DEF', {
            fontSize: '6px', fontFamily: 'monospace',
            color: '#ef4444', fontStyle: 'bold',
        }).setOrigin(0.5);

        container.add([body, eye, pupil, label]);

        // Add simple AI
        container.health = 40;
        container.speed = 60;
        container.position = { x, y };
        container.active = true;

        container.update = (dt) => {
            if (!container.active || !container._defenseTarget) return;
            const dx = container._defenseTarget.x - container.x;
            const dy = container._defenseTarget.y - container.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 20) {
                const speed = container.speed * dt;
                container.x += (dx / dist) * speed;
                container.y += (dy / dist) * speed;
            }
        };

        container.takeDamage = (amount) => {
            container.health -= amount;
            if (container.health <= 0) {
                container.active = false;
                container.destroy();
            }
        };

        return container;
    }

    getActiveHold(playerPos, tasks) {
        for (const [taskId, hold] of this.holds) {
            const task = tasks.get(taskId);
            if (!task || task.state === TASK_STATE.COMPLETED || task.state === TASK_STATE.LOCKED) continue;

            const dist = Phaser.Math.Distance.Between(
                playerPos.x, playerPos.y,
                task.position.x, task.position.y
            );

            if (dist < hold.radius) return task;
        }
        return null;
    }

    destroy() {
        for (const [, hold] of this.holds) hold.container.destroy();
        this.holds.clear();
        this.activeWaves.clear();
    }
}

// ─── INTEL GATHER ───────────────────────────────────────────
// Scattered collectible fragments in a radius around the task

export class IntelGatherRenderer {
    constructor(scene) {
        this.scene = scene;
        this.intels = new Map(); // taskId → { fragments: [], container, status }
    }

    createIntel(task) {
        const container = this.scene.add.container(task.position.x, task.position.y);
        container.setDepth(4);

        // Scan radius indicator
        const scanRadius = task.captureRadius || 100;
        const scanRing = this.scene.add.graphics();
        scanRing.lineStyle(1, 0x29b6f6, 0.15);
        scanRing.strokeCircle(0, 0, scanRadius);

        // Central beacon
        const beacon = this.scene.add.graphics();
        beacon.fillStyle(0x29b6f6, 0.3);
        beacon.fillCircle(0, 0, 12);
        beacon.lineStyle(1.5, 0x29b6f6, 0.7);
        beacon.strokeCircle(0, 0, 12);

        const icon = this.scene.add.text(0, -2, '📡', { fontSize: '16px' }).setOrigin(0.5);

        const status = this.scene.add.text(0, 22, '', {
            fontSize: '8px',
            fontFamily: '"Courier New", monospace',
            color: '#29b6f6',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        container.add([scanRing, beacon, icon, status]);

        // Pulse animation
        this.scene.tweens.add({
            targets: scanRing,
            scaleX: 1.05,
            scaleY: 1.05,
            alpha: 0.05,
            duration: 2500,
            yoyo: true,
            repeat: -1,
        });

        // Spawn fragment collectibles
        const fragCount = task.intelFragments || 5;
        const fragments = [];

        for (let i = 0; i < fragCount; i++) {
            const angle = (i / fragCount) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 30 + Math.random() * (scanRadius - 40);
            const fx = task.position.x + Math.cos(angle) * dist;
            const fy = task.position.y + Math.sin(angle) * dist;

            const frag = this._createFragment(fx, fy, i);
            fragments.push(frag);
        }

        this.intels.set(task.id, {
            container, status, beacon, fragments,
            totalFragments: fragCount,
            task, scanRadius,
        });
    }

    _createFragment(x, y, index) {
        const container = this.scene.add.container(x, y).setDepth(20);

        // Glow
        const glow = this.scene.add.graphics();
        glow.fillStyle(0x29b6f6, 0.15);
        glow.fillCircle(0, 0, 14);

        // Core diamond shape
        const diamond = this.scene.add.graphics();
        diamond.fillStyle(0x29b6f6, 0.9);
        diamond.beginPath();
        diamond.moveTo(0, -7);
        diamond.lineTo(5, 0);
        diamond.lineTo(0, 7);
        diamond.lineTo(-5, 0);
        diamond.closePath();
        diamond.fillPath();
        diamond.lineStyle(1, 0x64b5f6, 0.8);
        diamond.strokePath();

        container.add([glow, diamond]);
        container.collected = false;
        container.fragIndex = index;

        // Float animation
        this.scene.tweens.add({
            targets: container,
            y: y - 4,
            duration: 1200 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Glow pulse
        this.scene.tweens.add({
            targets: glow,
            alpha: 0.05,
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
        });

        return container;
    }

    /**
     * Check if player collected any fragments. Returns number collected.
     */
    collectNearFragments(playerPos, collectRadius = 25) {
        let collected = 0;

        for (const [taskId, intel] of this.intels) {
            const task = intel.task;
            if (task.state === TASK_STATE.COMPLETED || task.state === TASK_STATE.LOCKED) continue;

            for (const frag of intel.fragments) {
                if (frag.collected) continue;
                const dist = Phaser.Math.Distance.Between(
                    playerPos.x, playerPos.y,
                    frag.x, frag.y
                );

                if (dist < collectRadius) {
                    frag.collected = true;
                    collected++;
                    task.intelCollected = (task.intelCollected || 0) + 1;

                    // Collect animation
                    this.scene.tweens.add({
                        targets: frag,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        y: frag.y - 30,
                        duration: 300,
                        onComplete: () => frag.setVisible(false),
                    });

                    // Popup
                    const popText = this.scene.add.text(frag.x, frag.y - 15,
                        `INTEL ${task.intelCollected}/${intel.totalFragments}`, {
                        fontSize: '10px',
                        fontFamily: '"Courier New", monospace',
                        color: '#29b6f6',
                        fontStyle: 'bold',
                        stroke: '#000000',
                        strokeThickness: 2,
                    }).setOrigin(0.5).setDepth(200);

                    this.scene.tweens.add({
                        targets: popText,
                        y: popText.y - 30,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => popText.destroy(),
                    });
                }
            }

            // Check if all fragments collected → complete task
            if (task.intelCollected >= intel.totalFragments && task.state !== TASK_STATE.COMPLETED) {
                return { collected, completedTaskId: taskId };
            }
        }

        return { collected, completedTaskId: null };
    }

    update(tasks, playerPos) {
        for (const [taskId, intel] of this.intels) {
            const task = tasks.get(taskId);
            if (!task) continue;

            if (task.state === TASK_STATE.COMPLETED) {
                intel.status.setText('✅ ALL INTEL GATHERED');
                intel.status.setColor('#22c55e');
                intel.fragments.forEach(f => f.setVisible(false));
            } else if (task.state === TASK_STATE.LOCKED) {
                intel.status.setText('🔒 LOCKED');
                intel.status.setColor('#475569');
            } else {
                const remaining = intel.totalFragments - (task.intelCollected || 0);
                intel.status.setText(`INTEL: ${task.intelCollected || 0}/${intel.totalFragments}`);
            }
        }
    }

    destroy() {
        for (const [, intel] of this.intels) {
            intel.container.destroy();
            intel.fragments.forEach(f => f.destroy());
        }
        this.intels.clear();
    }
}

// ─── FOG OF WAR ─────────────────────────────────────────────
// Darkens unexplored areas. Clears as the player moves.

export class FogOfWar {
    constructor(scene, worldWidth, worldHeight) {
        this.scene = scene;
        this.worldW = worldWidth;
        this.worldH = worldHeight;
        this.cellSize = 60;
        this.revealRadius = 150; // pixels around player that are revealed

        // Grid of fog cells
        this.cols = Math.ceil(worldWidth / this.cellSize);
        this.rows = Math.ceil(worldHeight / this.cellSize);
        this.revealed = new Array(this.cols * this.rows).fill(false);

        // Create fog graphics layer
        this.fogGraphics = scene.add.graphics().setDepth(150);

        // Initial full fog
        this._drawFull();
    }

    _drawFull() {
        this.fogGraphics.clear();
        this.fogGraphics.fillStyle(0x000000, 0.75);
        this.fogGraphics.fillRect(0, 0, this.worldW, this.worldH);
    }

    /**
     * Call every frame with player position to reveal fog around them
     */
    update(playerPos) {
        const pcx = Math.floor(playerPos.x / this.cellSize);
        const pcy = Math.floor(playerPos.y / this.cellSize);
        const revealCells = Math.ceil(this.revealRadius / this.cellSize);

        let changed = false;

        // Mark cells as revealed
        for (let dy = -revealCells; dy <= revealCells; dy++) {
            for (let dx = -revealCells; dx <= revealCells; dx++) {
                const cx = pcx + dx;
                const cy = pcy + dy;

                if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) continue;

                // Check actual distance
                const cellCenterX = cx * this.cellSize + this.cellSize / 2;
                const cellCenterY = cy * this.cellSize + this.cellSize / 2;
                const dist = Phaser.Math.Distance.Between(
                    playerPos.x, playerPos.y,
                    cellCenterX, cellCenterY
                );

                if (dist < this.revealRadius) {
                    const idx = cy * this.cols + cx;
                    if (!this.revealed[idx]) {
                        this.revealed[idx] = true;
                        changed = true;
                    }
                }
            }
        }

        // Redraw fog only when cells change
        if (changed) {
            this._redraw(playerPos);
        }
    }

    _redraw(playerPos) {
        this.fogGraphics.clear();

        for (let cy = 0; cy < this.rows; cy++) {
            for (let cx = 0; cx < this.cols; cx++) {
                const idx = cy * this.cols + cx;
                const cellX = cx * this.cellSize;
                const cellY = cy * this.cellSize;

                if (!this.revealed[idx]) {
                    // Full fog
                    this.fogGraphics.fillStyle(0x000000, 0.75);
                    this.fogGraphics.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                } else {
                    // Revealed — slight shadow at edges of explored area
                    const cellCenterX = cellX + this.cellSize / 2;
                    const cellCenterY = cellY + this.cellSize / 2;
                    const dist = Phaser.Math.Distance.Between(
                        playerPos.x, playerPos.y,
                        cellCenterX, cellCenterY
                    );

                    // Active vision area = fully clear  |  Past explored = slight shadow
                    if (dist > this.revealRadius) {
                        this.fogGraphics.fillStyle(0x000000, 0.3);
                        this.fogGraphics.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                    }
                    // Within current vision = completely clear (no draw)
                }
            }
        }
    }

    destroy() {
        this.fogGraphics.destroy();
    }
}
