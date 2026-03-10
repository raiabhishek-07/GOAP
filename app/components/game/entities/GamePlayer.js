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
        this.healthKits = 0;

        // Combat
        this.attackCooldown = 0;
        this.isFlashing = false;
        this.facingX = 1; // Last movement direction

        // Dash
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashSpeed = 600;
        this.isDashing = false;

        // Vehicles
        this.isDriving = false;
        this.drivenCar = null;
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

    // ─── CAR INTERACTION ────────────────────────────────

    enterCar(carData) {
        this.isDriving = true;
        this.drivenCar = carData;
        carData.isDriven = true;

        // Hide player, move to car center
        this.visuals.setVisible(false);
        this.x = carData.x;
        this.y = carData.y;

        // Remove car's own obstacle so player inside can move
        const idx = this.scene.worldObstacles.indexOf(carData.obstacle);
        if (idx !== -1) {
            this.scene.worldObstacles.splice(idx, 1);
        }
        carData.promptText.setAlpha(0); // hide [E] RIDE
    }

    exitCar() {
        if (!this.isDriving || !this.drivenCar) return;

        this.isDriving = false;
        this.visuals.setVisible(true);
        this.drivenCar.isDriven = false;

        // Pop player out slightly to side
        this.x += 40;

        // Re-enable hitboxes
        this.drivenCar.x = this.x - 40;
        this.drivenCar.y = this.y;
        this.drivenCar.obstacle.x = this.drivenCar.x;
        this.drivenCar.obstacle.y = this.drivenCar.y;
        this.scene.worldObstacles.push(this.drivenCar.obstacle);

        this.drivenCar = null;
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
            const currentSpeed = this.isDriving ? 800 : (this.stamina <= 0 ? this.speed * 0.7 : this.speed);

            let newX = this.x + (vx / length) * currentSpeed * dt;
            let newY = this.y + (vy / length) * currentSpeed * dt;

            // Simple Axis-Aligned Bounding Box Collision
            if (this.scene.worldObstacles) {
                const pW = this.isDriving ? 40 : 16;
                const pH = this.isDriving ? 40 : 16;

                for (const obs of this.scene.worldObstacles) {
                    if (obs.x === undefined || obs.w === undefined) continue;

                    // AABB Collision check
                    if (Math.abs(newX - obs.x) < (pW + obs.w) / 2 && Math.abs(newY - obs.y) < (pH + obs.h) / 2) {
                        // Slide along X if possible
                        if (Math.abs(this.x - obs.x) >= (pW + obs.w) / 2) {
                            newX = this.x;
                        }
                        // Slide along Y if possible
                        else if (Math.abs(this.y - obs.y) >= (pH + obs.h) / 2) {
                            newY = this.y;
                        } else {
                            newX = this.x;
                            newY = this.y;
                        }
                    }
                }
            }

            this.x = newX;
            this.y = newY;
            this.logic.position = { x: this.x, y: this.y };

            // Movement Sounds
            this.lastStepTime = this.lastStepTime || 0;
            if (this.scene.time.now - this.lastStepTime > (this.isDriving ? 150 : 300)) {
                this.lastStepTime = this.scene.time.now;
                if (this.isDriving) {
                    SoundManager.carEngine();
                } else {
                    // Check if running (just example logic, or standard walk)
                    if (currentSpeed > this.speed) SoundManager.run();
                    else SoundManager.walk();
                }
            }

            if (this.isDriving) {
                // Update car visuals
                this.drivenCar.angle = Math.atan2(vy, vx) * (180 / Math.PI);
                this.drivenCar.container.setAngle(this.drivenCar.angle);
                this.drivenCar.x = this.x;
                this.drivenCar.y = this.y;
                this.drivenCar.container.setPosition(this.x, this.y);
            } else {
                // Flip character visual based on direction
                this.visuals.scaleX = vx < 0 ? -1 : 1;
            }
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
