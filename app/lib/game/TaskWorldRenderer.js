// ============================================================
// TaskWorldRenderer.js — Renders task objects in the game world
// Each task type gets unique visuals, animations, and states
// ============================================================

import * as Phaser from 'phaser';
import { TASK_STATE, TASK_META, TASK_TYPE } from './TaskSystem.js';

// Color palette
const COLORS = {
    locked: 0x475569,
    available: 0x22c55e,
    inProgress: 0xf59e0b,
    completed: 0x3b82f6,
    failed: 0xef4444,
    contested: 0xff6b6b,
    bg: 0x0f1a0f,
    gold: 0xf59e0b,
};

/**
 * Renders all tasks from TaskSystem as interactive world objects.
 */
export class TaskWorldRenderer {
    constructor(scene, taskSystem) {
        this.scene = scene;
        this.taskSystem = taskSystem;
        this.taskVisuals = new Map();   // taskId → { container, elements }
        this.interactionRadius = 60;    // px — how close player must be
    }

    /**
     * Create all task visuals from the task system
     */
    createAll() {
        const tasks = this.taskSystem.getAllTasks();
        for (const task of tasks) {
            this.createTaskVisual(task);
        }
    }

    /**
     * Create a single task's visual representation
     */
    createTaskVisual(task) {
        const meta = TASK_META[task.type] || TASK_META.terminal;
        const pos = task.position;
        const container = this.scene.add.container(pos.x, pos.y);
        container.setDepth(15);

        const elements = {};

        // ── 1. INTERACTION RADIUS INDICATOR ──
        elements.radiusCircle = this.scene.add.graphics();
        elements.radiusCircle.lineStyle(1, 0xffffff, 0.08);
        elements.radiusCircle.strokeCircle(0, 0, this.interactionRadius);
        container.add(elements.radiusCircle);

        // ── 2. ZONE CAPTURE area (for zone tasks) ──
        if (task.type === TASK_TYPE.ZONE_CAPTURE || task.type === TASK_TYPE.DEFENSE_HOLD) {
            const zoneRadius = task.captureRadius || 60;
            elements.zoneArea = this.scene.add.graphics();
            elements.zoneArea.lineStyle(2, Phaser.Display.Color.HexStringToColor(meta.color).color, 0.3);
            elements.zoneArea.strokeCircle(0, 0, zoneRadius);
            elements.zoneArea.fillStyle(Phaser.Display.Color.HexStringToColor(meta.color).color, 0.06);
            elements.zoneArea.fillCircle(0, 0, zoneRadius);
            container.add(elements.zoneArea);

            // Pulsing zone border
            this.scene.tweens.add({
                targets: elements.zoneArea,
                alpha: 0.4,
                duration: 1500,
                yoyo: true,
                repeat: -1,
            });
        }

        // ── 3. GLOW ──
        const glowColor = Phaser.Display.Color.HexStringToColor(meta.color).color;
        elements.glow = this.scene.add.graphics();
        elements.glow.fillStyle(glowColor, 0.12);
        elements.glow.fillCircle(0, 0, 35);
        container.add(elements.glow);

        // Pulse glow
        this.scene.tweens.add({
            targets: elements.glow,
            alpha: 0.03,
            duration: 2000,
            yoyo: true,
            repeat: -1,
        });

        // ── 4. BASE SHAPE ──
        elements.base = this.scene.add.graphics();
        this._drawBase(elements.base, task, meta);
        container.add(elements.base);

        // ── 5. ICON ──
        elements.icon = this.scene.add.text(0, -2, meta.icon, {
            fontSize: '22px',
        }).setOrigin(0.5);
        container.add(elements.icon);

        // ── 6. LABEL ──
        elements.label = this.scene.add.text(0, 30, task.name.toUpperCase(), {
            fontSize: '9px',
            fontFamily: '"Courier New", monospace',
            color: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 6, y: 3 },
        }).setOrigin(0.5);
        container.add(elements.label);

        // ── 7. PRIORITY BADGE ──
        if (task.priority >= 3) {
            const priBg = this.scene.add.graphics();
            priBg.fillStyle(0xf59e0b, 0.9);
            priBg.fillRoundedRect(-10, -42, 20, 14, 4);
            const priText = this.scene.add.text(0, -35, `P${task.priority}`, {
                fontSize: '8px',
                fontFamily: '"Courier New", monospace',
                color: '#000000',
                fontStyle: 'bold',
            }).setOrigin(0.5);
            container.add([priBg, priText]);
            elements.priorityBadge = priBg;
            elements.priorityText = priText;
        }

        // ── 8. POINTS LABEL ──
        elements.points = this.scene.add.text(0, 44, `${task.basePoints} PTS`, {
            fontSize: '8px',
            fontFamily: '"Courier New", monospace',
            color: meta.color,
            fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(elements.points);

        // ── 9. LOCK ICON (for locked tasks) ──
        elements.lockIcon = this.scene.add.text(0, -2, '🔒', {
            fontSize: '18px',
        }).setOrigin(0.5).setVisible(false);
        container.add(elements.lockIcon);

        // ── 10. CHANNEL PROGRESS BAR ──
        elements.channelBg = this.scene.add.graphics();
        elements.channelFill = this.scene.add.graphics();
        elements.channelBg.setVisible(false);
        elements.channelFill.setVisible(false);
        container.add([elements.channelBg, elements.channelFill]);

        // ── 11. COMPLETION CHECKMARK ──
        elements.checkmark = this.scene.add.text(0, -2, '✅', {
            fontSize: '22px',
        }).setOrigin(0.5).setVisible(false);
        container.add(elements.checkmark);

        // ── 12. DEPENDENCY ARROWS (visual hint) ──
        if (task.requiredTasks && task.requiredTasks.length > 0) {
            elements.depText = this.scene.add.text(0, 56, `REQUIRES: ${task.requiredTasks.join(', ')}`, {
                fontSize: '7px',
                fontFamily: '"Courier New", monospace',
                color: '#ef4444',
                fontStyle: 'bold',
            }).setOrigin(0.5).setAlpha(0.7);
            container.add(elements.depText);
        }

        // Store
        this.taskVisuals.set(task.id, { container, elements, task });

        // Initial state
        this._updateVisualState(task.id);
    }

    /**
     * Draw the base shape for a task
     */
    _drawBase(graphics, task, meta) {
        const color = Phaser.Display.Color.HexStringToColor(meta.color).color;

        graphics.clear();

        switch (task.type) {
            case TASK_TYPE.TERMINAL:
                // Monitor shape
                graphics.fillStyle(0x1a1a2e, 0.9);
                graphics.fillRoundedRect(-18, -18, 36, 36, 6);
                graphics.lineStyle(2, color, 0.8);
                graphics.strokeRoundedRect(-18, -18, 36, 36, 6);
                break;

            case TASK_TYPE.KEY_COLLECT:
                // Circular golden pad
                graphics.fillStyle(0x2a2a0a, 0.9);
                graphics.fillCircle(0, 0, 16);
                graphics.lineStyle(2, color, 0.9);
                graphics.strokeCircle(0, 0, 16);
                break;

            case TASK_TYPE.DOOR_UNLOCK:
                // Door frame
                graphics.fillStyle(0x1a0a2a, 0.9);
                graphics.fillRoundedRect(-20, -22, 40, 44, 4);
                graphics.lineStyle(2, color, 0.8);
                graphics.strokeRoundedRect(-20, -22, 40, 44, 4);
                // Door handle
                graphics.fillStyle(color, 0.6);
                graphics.fillCircle(12, 2, 3);
                break;

            case TASK_TYPE.RESOURCE_CACHE:
                // Crate/box
                graphics.fillStyle(0x1a2a1a, 0.9);
                graphics.fillRect(-16, -14, 32, 28);
                graphics.lineStyle(2, color, 0.8);
                graphics.strokeRect(-16, -14, 32, 28);
                // Cross on top
                graphics.lineStyle(1, color, 0.4);
                graphics.lineBetween(-16, 0, 16, 0);
                graphics.lineBetween(0, -14, 0, 14);
                break;

            case TASK_TYPE.ZONE_CAPTURE:
                // Flag/banner base
                graphics.fillStyle(0x2a1a0a, 0.9);
                graphics.fillRoundedRect(-14, -14, 28, 28, 14);
                graphics.lineStyle(2, color, 0.8);
                graphics.strokeRoundedRect(-14, -14, 28, 28, 14);
                break;

            case TASK_TYPE.SEQUENCE_CHAIN:
                // Hexagonal
                graphics.fillStyle(0x1a0a2a, 0.9);
                this._fillHexagon(graphics, 0, 0, 18);
                graphics.lineStyle(2, color, 0.8);
                this._strokeHexagon(graphics, 0, 0, 18);
                break;

            case TASK_TYPE.INTEL_GATHER:
                // Diamond
                graphics.fillStyle(0x0a1a2a, 0.9);
                graphics.fillTriangle(-16, 0, 0, -18, 16, 0);
                graphics.fillTriangle(-16, 0, 0, 18, 16, 0);
                graphics.lineStyle(2, color, 0.8);
                graphics.strokeTriangle(-16, 0, 0, -18, 16, 0);
                graphics.strokeTriangle(-16, 0, 0, 18, 16, 0);
                break;

            case TASK_TYPE.DEFENSE_HOLD:
                // Shield shape — double octagon
                graphics.fillStyle(0x2a0a0a, 0.9);
                this._fillHexagon(graphics, 0, 0, 20);
                graphics.lineStyle(2, color, 0.8);
                this._strokeHexagon(graphics, 0, 0, 20);
                graphics.lineStyle(1, color, 0.4);
                this._strokeHexagon(graphics, 0, 0, 14);
                break;

            case TASK_TYPE.EXTRACTION:
                // Arrow/portal
                graphics.fillStyle(0x0a2a0a, 0.9);
                graphics.fillCircle(0, 0, 22);
                graphics.lineStyle(3, color, 0.9);
                graphics.strokeCircle(0, 0, 22);
                graphics.lineStyle(1, color, 0.4);
                graphics.strokeCircle(0, 0, 16);
                break;

            default:
                graphics.fillStyle(0x1a1a1a, 0.9);
                graphics.fillRoundedRect(-16, -16, 32, 32, 8);
                graphics.lineStyle(2, color, 0.8);
                graphics.strokeRoundedRect(-16, -16, 32, 32, 8);
        }
    }

    _fillHexagon(g, cx, cy, r) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < 6; i++) g.lineTo(points[i].x, points[i].y);
        g.closePath();
        g.fillPath();
    }

    _strokeHexagon(g, cx, cy, r) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < 6; i++) g.lineTo(points[i].x, points[i].y);
        g.closePath();
        g.strokePath();
    }

    /**
     * Update all task visuals based on current states
     */
    updateAll() {
        for (const [taskId] of this.taskVisuals) {
            this._updateVisualState(taskId);
        }
    }

    /**
     * Update a single task's visual state
     */
    _updateVisualState(taskId) {
        const visual = this.taskVisuals.get(taskId);
        if (!visual) return;

        const task = this.taskSystem.getTask(taskId);
        if (!task) return;

        const { elements } = visual;
        const meta = TASK_META[task.type];

        switch (task.state) {
            case TASK_STATE.LOCKED:
                elements.icon.setVisible(false);
                elements.lockIcon.setVisible(true);
                elements.checkmark.setVisible(false);
                elements.glow.setAlpha(0.04);
                elements.base.setAlpha(0.4);
                elements.label.setAlpha(0.5);
                elements.points.setAlpha(0.3);
                if (elements.radiusCircle) elements.radiusCircle.setAlpha(0);
                break;

            case TASK_STATE.AVAILABLE:
                elements.icon.setVisible(true);
                elements.lockIcon.setVisible(false);
                elements.checkmark.setVisible(false);
                elements.glow.setAlpha(0.12);
                elements.base.setAlpha(1);
                elements.label.setAlpha(1);
                elements.points.setAlpha(1);
                if (elements.radiusCircle) elements.radiusCircle.setAlpha(0.08);
                break;

            case TASK_STATE.IN_PROGRESS:
                elements.icon.setVisible(true);
                elements.lockIcon.setVisible(false);
                elements.checkmark.setVisible(false);
                elements.glow.setAlpha(0.25);
                elements.base.setAlpha(1);
                // Show channel progress
                this._drawChannelBar(elements, task);
                break;

            case TASK_STATE.COMPLETED:
                elements.icon.setVisible(false);
                elements.lockIcon.setVisible(false);
                elements.checkmark.setVisible(true);
                elements.glow.setAlpha(0.05);
                elements.base.setAlpha(0.3);
                elements.label.setAlpha(0.4);
                elements.points.setAlpha(0);
                elements.channelBg.setVisible(false);
                elements.channelFill.setVisible(false);
                if (elements.radiusCircle) elements.radiusCircle.setAlpha(0);

                // Show who completed it
                const whoText = task.completedBy === 'player' ? '✓ YOU' : '✗ AI';
                const whoColor = task.completedBy === 'player' ? '#22c55e' : '#ef4444';
                elements.label.setText(whoText);
                elements.label.setColor(whoColor);
                break;

            case TASK_STATE.FAILED:
                elements.icon.setVisible(false);
                elements.lockIcon.setVisible(false);
                elements.checkmark.setVisible(false);
                elements.glow.setAlpha(0.02);
                elements.base.setAlpha(0.15);
                elements.label.setText('FAILED');
                elements.label.setColor('#ef4444');
                elements.label.setAlpha(0.5);
                break;
        }
    }

    /**
     * Draw the channel progress bar above a task
     */
    _drawChannelBar(elements, task) {
        const percent = task.getChannelPercent();
        const barW = 40;
        const barH = 6;
        const x = -barW / 2;
        const y = -34;

        elements.channelBg.clear();
        elements.channelBg.fillStyle(0x000000, 0.8);
        elements.channelBg.fillRoundedRect(x - 1, y - 1, barW + 2, barH + 2, 3);
        elements.channelBg.setVisible(true);

        elements.channelFill.clear();
        elements.channelFill.fillStyle(0xf59e0b, 1);
        elements.channelFill.fillRoundedRect(x, y, barW * percent, barH, 2);
        elements.channelFill.setVisible(true);
    }

    /**
     * Find the nearest interactable task to a position
     * Returns { task, distance } or null
     */
    findNearestInteractable(position) {
        let nearest = null;
        let minDist = Infinity;

        for (const [taskId, visual] of this.taskVisuals) {
            const task = this.taskSystem.getTask(taskId);
            if (!task) continue;
            if (task.state !== TASK_STATE.AVAILABLE && task.state !== TASK_STATE.IN_PROGRESS) continue;

            const dist = Phaser.Math.Distance.Between(
                position.x, position.y,
                task.position.x, task.position.y
            );

            if (dist <= this.interactionRadius && dist < minDist) {
                minDist = dist;
                nearest = { task, distance: dist };
            }
        }

        return nearest;
    }

    /**
     * Show interaction prompt near a task
     */
    showInteractPrompt(taskId) {
        const visual = this.taskVisuals.get(taskId);
        if (!visual) return;

        if (!visual.elements.prompt) {
            visual.elements.prompt = this.scene.add.text(0, -50, '[ E ] INTERACT', {
                fontSize: '10px',
                fontFamily: '"Courier New", monospace',
                color: '#f59e0b',
                fontStyle: 'bold',
                backgroundColor: 'rgba(0,0,0,0.85)',
                padding: { x: 8, y: 4 },
            }).setOrigin(0.5);
            visual.container.add(visual.elements.prompt);

            // Bounce animation
            this.scene.tweens.add({
                targets: visual.elements.prompt,
                y: -55,
                duration: 600,
                yoyo: true,
                repeat: -1,
            });
        }
        visual.elements.prompt.setVisible(true);
    }

    /**
     * Hide interaction prompt
     */
    hideInteractPrompt(taskId) {
        const visual = this.taskVisuals.get(taskId);
        if (visual?.elements?.prompt) {
            visual.elements.prompt.setVisible(false);
        }
    }

    /**
     * Hide all prompts
     */
    hideAllPrompts() {
        for (const [taskId] of this.taskVisuals) {
            this.hideInteractPrompt(taskId);
        }
    }

    /**
     * Play task completion animation
     */
    playCompletionEffect(taskId) {
        const visual = this.taskVisuals.get(taskId);
        if (!visual) return;

        const { x, y } = visual.container;

        // Burst particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particle = this.scene.add.circle(x, y, 3, 0xf59e0b).setDepth(100);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: 500,
                onComplete: () => particle.destroy(),
            });
        }

        // Flash ring
        const ring = this.scene.add.graphics().setDepth(100);
        ring.lineStyle(3, 0xf59e0b, 1);
        ring.strokeCircle(x, y, 10);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 600,
            onComplete: () => ring.destroy(),
        });
    }

    /**
     * Get all task positions for minimap
     */
    getTaskPositions() {
        const positions = [];
        for (const [taskId, visual] of this.taskVisuals) {
            const task = this.taskSystem.getTask(taskId);
            if (!task) continue;
            const meta = TASK_META[task.type];
            positions.push({
                x: task.position.x,
                y: task.position.y,
                state: task.state,
                color: meta.color,
                type: task.type,
            });
        }
        return positions;
    }

    /**
     * Destroy all visuals
     */
    destroy() {
        for (const [, visual] of this.taskVisuals) {
            visual.container.destroy();
        }
        this.taskVisuals.clear();
    }
}
