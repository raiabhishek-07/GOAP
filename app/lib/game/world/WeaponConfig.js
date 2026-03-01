// ============================================================
// WeaponConfig.js — Weapon definitions & ammo types
// All stats are tunable, serializable for multiplayer
// ============================================================

export const AMMO_TYPE = {
    PISTOL: 'ammo_pistol',
    SHOTGUN: 'ammo_shotgun',
    RIFLE: 'ammo_rifle',
    SMG: 'ammo_smg',
    SNIPER: 'ammo_sniper',
};

export const WEAPON = {
    PISTOL: {
        id: 'pistol',
        name: 'M9 PISTOL',
        ammoType: AMMO_TYPE.PISTOL,
        damage: 15,
        fireRate: 350,        // ms between shots
        bulletSpeed: 500,
        bulletRange: 350,     // px before bullet dies
        magSize: 12,
        reloadTime: 1200,     // ms
        spread: 3,            // degrees of random spread
        bulletsPerShot: 1,
        auto: false,          // semi-auto
        color: 0xcccccc,
        tier: 1,
        weight: 1.2,
    },
    SMG: {
        id: 'smg',
        name: 'MP5 SMG',
        ammoType: AMMO_TYPE.SMG,
        damage: 12,
        fireRate: 90,
        bulletSpeed: 550,
        bulletRange: 300,
        magSize: 30,
        reloadTime: 1800,
        spread: 6,
        bulletsPerShot: 1,
        auto: true,           // full-auto
        color: 0x888888,
        tier: 2,
        weight: 2.5,
    },
    SHOTGUN: {
        id: 'shotgun',
        name: 'M870 SHOTGUN',
        ammoType: AMMO_TYPE.SHOTGUN,
        damage: 8,            // per pellet
        fireRate: 800,
        bulletSpeed: 450,
        bulletRange: 200,
        magSize: 5,
        reloadTime: 2500,
        spread: 15,
        bulletsPerShot: 6,    // 6 pellets
        auto: false,
        color: 0x6a4a2a,
        tier: 2,
        weight: 3.5,
    },
    RIFLE: {
        id: 'rifle',
        name: 'M4 RIFLE',
        ammoType: AMMO_TYPE.RIFLE,
        damage: 22,
        fireRate: 130,
        bulletSpeed: 700,
        bulletRange: 500,
        magSize: 25,
        reloadTime: 2000,
        spread: 4,
        bulletsPerShot: 1,
        auto: true,
        color: 0x3a3a3a,
        tier: 3,
        weight: 4.2,
    },
    SNIPER: {
        id: 'sniper',
        name: 'AWM SNIPER',
        ammoType: AMMO_TYPE.SNIPER,
        damage: 80,
        fireRate: 1500,
        bulletSpeed: 1000,
        bulletRange: 900,
        magSize: 5,
        reloadTime: 3500,
        spread: 1,
        bulletsPerShot: 1,
        auto: false,
        color: 0x2a4a2a,
        tier: 4,
        weight: 6.5,
    },
};

// All weapons as array for random spawns
export const ALL_WEAPONS = Object.values(WEAPON);

// Default ammo when picking up a weapon
export const DEFAULT_RESERVE_AMMO = {
    [AMMO_TYPE.PISTOL]: 36,
    [AMMO_TYPE.SMG]: 60,
    [AMMO_TYPE.SHOTGUN]: 15,
    [AMMO_TYPE.RIFLE]: 50,
    [AMMO_TYPE.SNIPER]: 10,
};
