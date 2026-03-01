// ============================================================
// WeaponSystem.js — Handles equipping, shooting, reloading
// Manages player's 3 weapon slots + ammo inventory
// ============================================================

import { WEAPON, ALL_WEAPONS, DEFAULT_RESERVE_AMMO, AMMO_TYPE } from './WeaponConfig';

export class WeaponSystem {
    constructor(scene, bulletPool) {
        this.scene = scene;
        this.bulletPool = bulletPool;

        // 3 weapon slots
        this.slots = [null, null, null];
        this.activeSlot = -1; // -1 = unarmed

        // Ammo in magazine (per slot)
        this.magAmmo = [0, 0, 0];

        // Reserve ammo (shared by ammo type)
        this.reserveAmmo = {
            [AMMO_TYPE.PISTOL]: 0,
            [AMMO_TYPE.SMG]: 0,
            [AMMO_TYPE.SHOTGUN]: 0,
            [AMMO_TYPE.RIFLE]: 0,
            [AMMO_TYPE.SNIPER]: 0,
        };

        // State
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadTimer = null;

        // Muzzle flash
        this.muzzleFlash = null;
    }

    // ═══════════════════════════════════════════════════════
    // EQUIP / PICKUP
    // ═══════════════════════════════════════════════════════

    /** Pick up a weapon. Returns dropped weapon if slot is full, or null */
    pickupWeapon(weaponDef) {
        // Find empty slot
        for (let i = 0; i < 3; i++) {
            if (!this.slots[i]) {
                this.slots[i] = weaponDef;
                this.magAmmo[i] = weaponDef.magSize;
                this.reserveAmmo[weaponDef.ammoType] += DEFAULT_RESERVE_AMMO[weaponDef.ammoType];
                if (this.activeSlot === -1) this.activeSlot = i;
                return null;
            }
        }

        // All slots full — swap with active
        const dropped = this.slots[this.activeSlot];
        this.slots[this.activeSlot] = weaponDef;
        this.magAmmo[this.activeSlot] = weaponDef.magSize;
        this.reserveAmmo[weaponDef.ammoType] += DEFAULT_RESERVE_AMMO[weaponDef.ammoType];
        return dropped;
    }

    /** Pick up ammo */
    pickupAmmo(ammoType, amount) {
        this.reserveAmmo[ammoType] = (this.reserveAmmo[ammoType] || 0) + amount;
    }

    /** Switch to slot 0, 1, or 2 */
    switchSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex > 2) return;
        if (!this.slots[slotIndex]) return;
        if (this.isReloading) this._cancelReload();
        this.activeSlot = slotIndex;
    }

    /** Get current weapon definition or null */
    getActiveWeapon() {
        if (this.activeSlot < 0) return null;
        return this.slots[this.activeSlot];
    }

    /** Cycle to next weapon */
    cycleWeapon() {
        for (let i = 1; i <= 3; i++) {
            const next = (this.activeSlot + i) % 3;
            if (this.slots[next]) {
                this.switchSlot(next);
                return;
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // SHOOTING
    // ═══════════════════════════════════════════════════════

    /**
     * Attempt to fire. Call every frame while mouse is down.
     * @param {number} x - Fire origin X
     * @param {number} y - Fire origin Y
     * @param {number} angle - Fire angle in radians
     * @param {number} time - Current game time
     * @returns {boolean} true if fired
     */
    tryFire(x, y, angle, time) {
        const weapon = this.getActiveWeapon();
        if (!weapon) return false;
        if (this.isReloading) return false;

        // Fire rate check
        if (time - this.lastFireTime < weapon.fireRate) return false;

        // Ammo check
        if (this.magAmmo[this.activeSlot] <= 0) {
            this.reload();
            return false;
        }

        this.lastFireTime = time;
        this.magAmmo[this.activeSlot]--;

        // Fire bullets (shotgun fires multiple)
        for (let i = 0; i < weapon.bulletsPerShot; i++) {
            const spreadRad = (weapon.spread * (Math.random() - 0.5) * 2) * (Math.PI / 180);
            const fireAngle = angle + spreadRad;

            this.bulletPool.fire(x, y, fireAngle, weapon, 'player');
        }

        // Muzzle flash effect
        this._showMuzzleFlash(x, y, angle);

        return true;
    }

    /** AI shooting (simpler) */
    aiTryFire(x, y, angle, time, weaponDef, ownerId) {
        // AI has infinite ammo for now
        if (time - this.lastFireTime < weaponDef.fireRate * 1.5) return false;

        for (let i = 0; i < weaponDef.bulletsPerShot; i++) {
            const spreadRad = (weaponDef.spread * 1.5 * (Math.random() - 0.5) * 2) * (Math.PI / 180);
            this.bulletPool.fire(x, y, angle + spreadRad, weaponDef, ownerId);
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════
    // RELOADING
    // ═══════════════════════════════════════════════════════

    reload() {
        const weapon = this.getActiveWeapon();
        if (!weapon) return;
        if (this.isReloading) return;
        if (this.magAmmo[this.activeSlot] >= weapon.magSize) return;

        const reserve = this.reserveAmmo[weapon.ammoType] || 0;
        if (reserve <= 0) return; // No ammo to reload

        this.isReloading = true;

        this.reloadTimer = this.scene.time.delayedCall(weapon.reloadTime, () => {
            const needed = weapon.magSize - this.magAmmo[this.activeSlot];
            const toLoad = Math.min(needed, this.reserveAmmo[weapon.ammoType]);
            this.magAmmo[this.activeSlot] += toLoad;
            this.reserveAmmo[weapon.ammoType] -= toLoad;
            this.isReloading = false;
        });
    }

    _cancelReload() {
        if (this.reloadTimer) {
            this.reloadTimer.remove();
            this.reloadTimer = null;
        }
        this.isReloading = false;
    }

    // ═══════════════════════════════════════════════════════
    // MUZZLE FLASH
    // ═══════════════════════════════════════════════════════

    _showMuzzleFlash(x, y, angle) {
        const flashX = x + Math.cos(angle) * 20;
        const flashY = y + Math.sin(angle) * 20;

        if (!this.muzzleFlash) {
            this.muzzleFlash = this.scene.add.image(flashX, flashY, 'muzzle_flash')
                .setDepth(26)
                .setScale(1.5)
                .setAlpha(0);
        }

        this.muzzleFlash.setPosition(flashX, flashY);
        this.muzzleFlash.setRotation(angle);
        this.muzzleFlash.setAlpha(1);

        this.scene.tweens.add({
            targets: this.muzzleFlash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 80,
        });
    }

    // ═══════════════════════════════════════════════════════
    // HUD DATA
    // ═══════════════════════════════════════════════════════

    getHUDData() {
        const weapon = this.getActiveWeapon();
        return {
            weaponName: weapon ? weapon.name : 'UNARMED',
            magAmmo: weapon ? this.magAmmo[this.activeSlot] : 0,
            magSize: weapon ? weapon.magSize : 0,
            reserveAmmo: weapon ? (this.reserveAmmo[weapon.ammoType] || 0) : 0,
            isReloading: this.isReloading,
            activeSlot: this.activeSlot,
            slots: this.slots.map((s, i) => ({
                name: s ? s.name : 'EMPTY',
                id: s ? s.id : null,
                mag: this.magAmmo[i],
                active: i === this.activeSlot,
            })),
        };
    }

    destroy() {
        this._cancelReload();
        this.bulletPool?.destroy();
    }
}
