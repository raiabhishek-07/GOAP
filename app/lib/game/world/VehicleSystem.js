// ============================================================
// VehicleSystem.js — Vehicle spawning, driving, enter/exit
// Players can drive vehicles across the open world
// ============================================================

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

import { ALL_VEHICLES, VEHICLE } from './VehicleConfig';

export class VehicleSystem {
    constructor(scene) {
        this.scene = scene;
        this.vehicles = [];
        this.activeVehicle = null; // Vehicle player is currently in
    }

    /** Spawn a vehicle at world position */
    spawnVehicle(x, y, vehicleDef, rotation = 0) {
        const texKey = `vehicle_${vehicleDef.id}`;
        if (!this.scene.textures.exists(texKey)) return null;

        // Shadow
        const shadow = this.scene.add.image(x + 3, y + 4, 'shadow_rect')
            .setDepth(3).setAlpha(0.3)
            .setScale(vehicleDef.width / 32, vehicleDef.height / 24);

        // Vehicle sprite
        const sprite = this.scene.add.image(x, y, texKey)
            .setDepth(14)
            .setScale(2)
            .setRotation(rotation);

        this.scene.physics.add.existing(sprite, false);
        sprite.body.setSize(vehicleDef.width * 0.8, vehicleDef.height * 0.8);
        sprite.body.setCollideWorldBounds(true);

        // Massive weight to ensure humans (mass 1) cannot move it
        sprite.body.setMass(5000);
        sprite.body.setBounce(0);  // Thud impact, no high-speed rebound

        // Prevent player from pushing it by walking into it
        if (sprite.body.setPushable) sprite.body.setPushable(false);
        sprite.body.setImmovable(true);
        sprite.body.moves = false; // COMPLETELY prevents arcade physics collision displacement


        // Very high drag by default so it stays 'grounded'
        const parkedDrag = 5000;
        sprite.body.setDrag(parkedDrag, parkedDrag);
        sprite.body.setFriction(1, 1);

        // Lock body rotation—keeps collisions predictable in Arcade Physics
        sprite.body.setAllowRotation(false);
        sprite.body.setMaxVelocity(vehicleDef.maxSpeed, vehicleDef.maxSpeed);

        // Vehicle data
        sprite.vehicleData = {
            def: vehicleDef,
            health: vehicleDef.health,
            fuel: vehicleDef.fuelMax,
            currentSpeed: 0,
            occupied: false,
            driver: null,
        };
        sprite.shadowRef = shadow;

        // Name label
        sprite.nameLabel = this.scene.add.text(x, y - vehicleDef.height - 8, vehicleDef.name, {
            fontSize: '7px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#3b82f6', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(15);

        // Fuel bar background
        sprite.fuelBarBg = this.scene.add.rectangle(
            x - 12, y - vehicleDef.height - 2,
            24, 3, 0x333333
        ).setOrigin(0, 0.5).setDepth(15);

        sprite.fuelBarFill = this.scene.add.rectangle(
            x - 12, y - vehicleDef.height - 2,
            24, 3, 0xf59e0b
        ).setOrigin(0, 0.5).setDepth(15);

        this.vehicles.push(sprite);
        return sprite;
    }

    /** Try to enter nearest vehicle. Returns true if entered. */
    tryEnterVehicle(playerX, playerY, player) {
        const enterRange = 80; // Increased range for better feel
        let nearest = null;
        let nearDist = Infinity;

        for (const v of this.vehicles) {
            if (!v.active || v.vehicleData.occupied) continue;
            const dist = Phaser.Math.Distance.Between(playerX, playerY, v.x, v.y);
            if (dist < enterRange && dist < nearDist) {
                nearDist = dist;
                nearest = v;
            }
        }

        if (!nearest) return false;

        // Enter vehicle
        nearest.vehicleData.occupied = true;
        nearest.vehicleData.driver = player;
        this.activeVehicle = nearest;

        // Hide player
        player.setVisible(false);
        if (player.body) player.body.enable = false;

        // Vehicle becomes dynamic for the driver so it can hit immovable walls, 
        // but it REMAINS unpushable by other actors.
        if (nearest.body.setPushable) nearest.body.setPushable(false);
        nearest.body.setImmovable(false);
        nearest.body.moves = true; // Re-enable physics simulation for driving


        // Feedback
        this._showMessage(`ENTERED ${nearest.vehicleData.def.name}`);
        return true;
    }

    /** Exit current vehicle */
    exitVehicle(player) {
        if (!this.activeVehicle) return false;

        const v = this.activeVehicle;
        const exitAngle = v.rotation - Math.PI / 2;
        const exitDist = 30;
        const exitX = v.x + Math.cos(exitAngle) * exitDist;
        const exitY = v.y + Math.sin(exitAngle) * exitDist;

        // Place player beside vehicle
        player.setPosition(exitX, exitY);
        player.setVisible(true);
        if (player.body) {
            player.body.enable = true;
            player.body.setVelocity(0, 0);
        }

        // Stop vehicle
        v.vehicleData.occupied = false;
        v.vehicleData.driver = null;
        v.vehicleData.currentSpeed = 0;
        // Reset drag to 'grounded' level (Parking Brake)
        v.body.setDrag(5000, 5000);
        v.body.setVelocity(0, 0);

        // Prevent pushing again
        if (v.body.setPushable) v.body.setPushable(false);
        v.body.setImmovable(true);
        v.body.moves = false; // Disable reaction forces entirely when parked


        this.activeVehicle = null;
        this._showMessage('EXITED VEHICLE');
        return true;
    }

    /** Call every frame when player is in a vehicle */
    updateDriving(cursors, delta) {
        if (!this.activeVehicle) return;

        const v = this.activeVehicle;
        const def = v.vehicleData.def;
        // Reduce drag when driving for normal handling
        v.body.setDrag(def.drag * 0.5, def.drag * 0.5);

        const dt = delta / 1000;

        // Fuel check
        if (v.vehicleData.fuel <= 0) {
            v.vehicleData.currentSpeed = Math.max(0, v.vehicleData.currentSpeed - 50 * dt);
            // Coast to stop
        } else {
            // Acceleration / braking
            if (cursors.up.isDown) {
                v.vehicleData.currentSpeed = Math.min(def.maxSpeed, v.vehicleData.currentSpeed + def.acceleration * dt);
                v.vehicleData.fuel = Math.max(0, v.vehicleData.fuel - def.fuelRate);
            } else if (cursors.down.isDown) {
                v.vehicleData.currentSpeed = Math.max(-def.maxSpeed * 0.3, v.vehicleData.currentSpeed - def.braking * dt);
                v.vehicleData.fuel = Math.max(0, v.vehicleData.fuel - def.fuelRate * 0.5);
            } else {
                // Natural deceleration
                if (v.vehicleData.currentSpeed > 0) {
                    v.vehicleData.currentSpeed = Math.max(0, v.vehicleData.currentSpeed - def.drag * dt);
                } else if (v.vehicleData.currentSpeed < 0) {
                    v.vehicleData.currentSpeed = Math.min(0, v.vehicleData.currentSpeed + def.drag * dt);
                }
            }
        }

        // Steering (only works when moving)
        const speedFactor = Math.abs(v.vehicleData.currentSpeed) / def.maxSpeed;
        if (cursors.left.isDown && speedFactor > 0.05) {
            v.rotation -= def.turnSpeed * dt * speedFactor;
        }
        if (cursors.right.isDown && speedFactor > 0.05) {
            v.rotation += def.turnSpeed * dt * speedFactor;
        }

        // Apply velocity based on heading
        const vx = Math.sin(v.rotation) * v.vehicleData.currentSpeed;
        const vy = -Math.cos(v.rotation) * v.vehicleData.currentSpeed;
        v.body.setVelocity(vx, vy);

        // Exhaust smoke when accelerating
        if (cursors.up.isDown && v.vehicleData.fuel > 0 && Math.random() > 0.7) {
            this._createExhaustSmoke(v.x, v.y, v.rotation);
        }

        // Tire marks (at speed when turning)
        if (Math.abs(v.vehicleData.currentSpeed) > 150 && (cursors.left.isDown || cursors.right.isDown)) {
            this._createTireMark(v.x, v.y, v.rotation);
        }

        // Speed shake (vibration at high speed)
        if (this.activeVehicle && Math.abs(v.vehicleData.currentSpeed) > def.maxSpeed * 0.8) {
            this.scene.cameras.main.shake(100, 0.0005);
        }
    }

    _createExhaustSmoke(x, y, rotation) {
        // Position at rear of vehicle
        const offset = -18;
        const sx = x + Math.sin(rotation) * offset;
        const sy = y - Math.cos(rotation) * offset;

        const smoke = this.scene.add.circle(sx, sy, 2, 0x999999, 0.4)
            .setDepth(13);

        this.scene.tweens.add({
            targets: smoke,
            x: sx + (Math.random() - 0.5) * 10,
            y: sy + (Math.random() - 0.5) * 10,
            scaleX: 4, scaleY: 4,
            alpha: 0,
            duration: 600,
            onComplete: () => smoke.destroy()
        });
    }

    /** Update all vehicle labels and shadows */
    updateVisuals() {
        for (const v of this.vehicles) {
            if (!v.active) continue;

            const def = v.vehicleData.def;

            // Dynamic Depth Sorting
            const depthY = v.y / 10;
            v.setDepth(depthY);

            // Shadow
            if (v.shadowRef) {
                v.shadowRef.setPosition(v.x + 3, v.y + 4);
                v.shadowRef.setRotation(v.rotation);
                v.shadowRef.setDepth(depthY - 0.1);
            }

            // Name label
            if (v.nameLabel) {
                v.nameLabel.setPosition(v.x, v.y - def.height - 8);
                v.nameLabel.setDepth(depthY + 0.1);
                if (v.vehicleData.occupied) {
                    v.nameLabel.setText(`${def.name} [DRIVING]`);
                    v.nameLabel.setColor('#4ade80');
                } else {
                    v.nameLabel.setText(def.name);
                    v.nameLabel.setColor('#3b82f6');
                }
            }

            // Fuel bar
            if (v.fuelBarBg && v.fuelBarFill) {
                v.fuelBarBg.setPosition(v.x - 12, v.y - def.height - 2);
                v.fuelBarBg.setDepth(depthY + 0.1);

                const fuelPct = v.vehicleData.fuel / def.fuelMax;
                v.fuelBarFill.setPosition(v.x - 12, v.y - def.height - 2);
                v.fuelBarFill.scaleX = fuelPct;
                v.fuelBarFill.fillColor = fuelPct > 0.3 ? 0xf59e0b : 0xef4444;
                v.fuelBarFill.setDepth(depthY + 0.1);
            }
        }
    }
    /** Get nearest vehicle info for HUD prompt */
    getNearbyVehicle(px, py) {
        let nearest = null;
        let nearDist = 100; // Increased prompt range for better feedback

        for (const v of this.vehicles) {
            if (!v.active || v.vehicleData.occupied) continue;
            const dist = Phaser.Math.Distance.Between(px, py, v.x, v.y);
            if (dist < nearDist) {
                nearDist = dist;
                nearest = v;
            }
        }

        return nearest ? nearest.vehicleData.def : null;
    }

    /** Is player currently driving? */
    isDriving() {
        return this.activeVehicle != null;
    }

    /** Get active vehicle data for HUD */
    getHUDData() {
        if (!this.activeVehicle) return null;
        const v = this.activeVehicle;
        return {
            name: v.vehicleData.def.name,
            speed: Math.abs(Math.round(v.vehicleData.currentSpeed)),
            maxSpeed: v.vehicleData.def.maxSpeed,
            fuel: Math.round(v.vehicleData.fuel),
            fuelMax: v.vehicleData.def.fuelMax,
            health: v.vehicleData.health,
            healthMax: v.vehicleData.def.health,
        };
    }

    _createTireMark(x, y, rotation) {
        const mark = this.scene.add.graphics();
        mark.setDepth(1);
        mark.fillStyle(0x222222, 0.2);
        mark.fillRect(-1, -2, 2, 4);
        mark.setPosition(x, y);
        mark.setRotation(rotation);

        this.scene.tweens.add({
            targets: mark,
            alpha: 0,
            duration: 3000,
            onComplete: () => mark.destroy(),
        });
    }

    _showMessage(msg) {
        const cam = this.scene.cameras.main;
        const text = this.scene.add.text(cam.width / 2, cam.height * 0.7, msg, {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#3b82f6', stroke: '#000', strokeThickness: 3, letterSpacing: 2,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            y: text.y - 20, alpha: 0, duration: 1500,
            onComplete: () => text.destroy(),
        });
    }

    destroy() {
        for (const v of this.vehicles) {
            v.shadowRef?.destroy();
            v.nameLabel?.destroy();
            v.fuelBarBg?.destroy();
            v.fuelBarFill?.destroy();
            v.destroy();
        }
        this.vehicles = [];
        this.activeVehicle = null;
    }
}
