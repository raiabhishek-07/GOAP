import { BaseSurvivor } from "./BaseSurvivor";
import { PlayerEntity } from "../../../lib/goap/agent";
import { SoundManager } from "../../../lib/game/SoundManager";

/**
 * GamePlayer — Full player controller with combat, dash, and stamina.
 */
export class GamePlayer extends BaseSurvivor {
    constructor(scene, x, y, label) {
        super(scene, x, y, label, false);
        this.logic = new PlayerEntity();
        this.logic.position = { x, y };

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D'
        });

        // Stats
        this.speed = 220;
        this.power = 0;
        this.health = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRegen = 12; // per second

        // Combat
        this.attackCooldown = 0;
        this.isFlashing = false;
        this.facingX = 1; // Last movement direction

        // Dash
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashSpeed = 600;
        this.isDashing = false;
    }

    // ─── DAMAGE ─────────────────────────────────────────

    takeDamage(amount) {
        if (this.isFlashing || this.isDashing) return;
        this.health = Math.max(0, this.health - amount);
        SoundManager.damageTaken();

        // Screen effects
        this.scene.cameras.main.shake(150, 0.005);
        this.flashCharacter();

        // Red vignette flash
        const { width, height } = this.scene.scale;
        const vignette = this.scene.add.graphics().setScrollFactor(0).setDepth(500);
        vignette.fillStyle(0xff0000, 0.15);
        vignette.fillRect(0, 0, width, height);
        this.scene.tweens.add({
            targets: vignette,
            alpha: 0,
            duration: 300,
            onComplete: () => vignette.destroy()
        });

        if (this.health <= 0) {
            this.scene.events.emit('PLAYER_DIED');
        }
    }

    // ─── POWER COLLECTION ───────────────────────────────

    collectPower(amount) {
        this.power += amount;
    }

    // ─── FLASH (I-FRAMES) ───────────────────────────────

    flashCharacter() {
        this.isFlashing = true;
        this.scene.tweens.add({
            targets: this.visuals,
            alpha: 0.2,
            duration: 80,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                this.isFlashing = false;
                this.visuals.alpha = 1;
            }
        });
    }

    // ─── DASH ───────────────────────────────────────────

    dash() {
        if (this.stamina < 15 || this.dashCooldown > 0 || this.isDashing) return;

        this.stamina -= 15;
        this.isDashing = true;
        this.dashDuration = 0.12;
        this.dashCooldown = 1.5;
        this.isFlashing = true; // i-frames during dash

        SoundManager.dash();

        // Ghost trail effect
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 40, () => {
                const ghost = this.scene.add.circle(this.x, this.y, 12, 0x60a5fa, 0.3).setDepth(45);
                this.scene.tweens.add({
                    targets: ghost,
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    duration: 300,
                    onComplete: () => ghost.destroy()
                });
            });
        }
    }

    // ─── UPDATE LOOP ────────────────────────────────────

    update(dt) {
        // ─ Input ─
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
        else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
        else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

        // Track facing direction
        if (vx !== 0) this.facingX = vx;

        // ─ Dash physics ─
        if (this.isDashing && this.dashDuration > 0) {
            this.dashDuration -= dt;
            const dashDir = (vx !== 0 || vy !== 0) ? { x: vx, y: vy } : { x: this.facingX, y: 0 };
            const len = Math.sqrt(dashDir.x ** 2 + dashDir.y ** 2) || 1;
            this.x += (dashDir.x / len) * this.dashSpeed * dt;
            this.y += (dashDir.y / len) * this.dashSpeed * dt;
            this.logic.position = { x: this.x, y: this.y };

            if (this.dashDuration <= 0) {
                this.isDashing = false;
                this.isFlashing = false;
            }
            return; // Skip normal movement during dash
        }

        // ─ Normal movement ─
        if (vx !== 0 || vy !== 0) {
            const length = Math.sqrt(vx * vx + vy * vy);
            const currentSpeed = this.stamina <= 0 ? this.speed * 0.7 : this.speed;
            this.x += (vx / length) * currentSpeed * dt;
            this.y += (vy / length) * currentSpeed * dt;
            this.logic.position = { x: this.x, y: this.y };

            // Flip character visual based on direction
            this.visuals.scaleX = vx < 0 ? -1 : 1;
        }

        // ─ Stamina regen ─
        if (!this.isDashing && this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
        }

        // ─ Cooldowns ─
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        // ─ Sync ─
        this.logic.update(dt);
        this.updateStats(this.health);
    }
}
