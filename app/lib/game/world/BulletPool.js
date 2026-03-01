// ============================================================
// BulletPool.js — Efficient bullet pooling system
// Reuses bullet objects to avoid GC pressure
// ============================================================

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class BulletPool {
    constructor(scene, maxBullets = 200) {
        this.scene = scene;
        this.maxBullets = maxBullets;
        this.pool = [];
        this.active = [];

        // Bullet collision group
        this.group = scene.physics.add.group({
            defaultKey: 'bullet',
            maxSize: maxBullets,
            allowGravity: false,
        });

        // Pre-create bullet objects
        for (let i = 0; i < maxBullets; i++) {
            const bullet = scene.add.image(0, 0, 'bullet')
                .setDepth(15)
                .setVisible(false)
                .setActive(false);

            scene.physics.add.existing(bullet, false);
            bullet.body.setSize(4, 4);
            bullet.body.setAllowGravity(false);
            bullet.body.enable = false;

            bullet.bulletData = {
                damage: 0,
                range: 0,
                startX: 0,
                startY: 0,
                owner: null,  // 'player' or agent ID
            };

            this.pool.push(bullet);
        }
    }

    /**
     * Fire a bullet from position toward angle
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} angle - Radians
     * @param {object} weaponDef - Weapon config object
     * @param {string} owner - 'player' or agent ID
     * @returns {object|null} The bullet, or null if pool exhausted
     */
    fire(x, y, angle, weaponDef, owner = 'player') {
        const bullet = this.pool.pop();
        if (!bullet) return null;

        // Activate
        bullet.setPosition(x, y);
        bullet.setVisible(true);
        bullet.setActive(true);
        bullet.setRotation(angle);

        // Scale based on weapon
        bullet.setScale(weaponDef.id === 'sniper' ? 2 : 1.2);

        // Tint by weapon
        bullet.setTint(0xffee88);

        // Physics
        bullet.body.enable = true;
        bullet.body.setVelocity(
            Math.cos(angle) * weaponDef.bulletSpeed,
            Math.sin(angle) * weaponDef.bulletSpeed
        );

        // Bullet data
        bullet.bulletData.damage = weaponDef.damage;
        bullet.bulletData.range = weaponDef.bulletRange;
        bullet.bulletData.startX = x;
        bullet.bulletData.startY = y;
        bullet.bulletData.owner = owner;

        this.active.push(bullet);
        return bullet;
    }

    /** Call every frame to recycle out-of-range bullets */
    update() {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const b = this.active[i];
            if (!b.active) {
                // Already deactivated (by collision callback)
                this.active.splice(i, 1);
                this.pool.push(b);
                continue;
            }

            // Range check
            const dist = Phaser.Math.Distance.Between(
                b.bulletData.startX, b.bulletData.startY,
                b.x, b.y
            );
            if (dist > b.bulletData.range) {
                this._deactivate(b);
                this.active.splice(i, 1);
                this.pool.push(b);
            }
        }
    }

    /** Deactivate and return bullet to pool (call from collision) */
    recycle(bullet) {
        this._deactivate(bullet);
        const idx = this.active.indexOf(bullet);
        if (idx !== -1) this.active.splice(idx, 1);
        this.pool.push(bullet);
    }

    _deactivate(b) {
        b.setVisible(false);
        b.setActive(false);
        b.body.enable = false;
        b.body.setVelocity(0, 0);
        b.setPosition(-100, -100);
    }

    /** Get all active bullets for collision setup */
    getGroup() {
        return this.group;
    }

    /** Get active bullet sprites array */
    getActive() {
        return this.active;
    }

    destroy() {
        this.pool.forEach(b => b.destroy());
        this.active.forEach(b => b.destroy());
        this.pool = [];
        this.active = [];
    }
}
