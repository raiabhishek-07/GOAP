// ============================================================
// GameStateSync.js — Serialize/deserialize game state
// Optimized for network transfer (delta compression, quantization)
// ============================================================

/**
 * Serialize player state for network transmission.
 * Compact format: only what other clients need to render.
 */
export function serializePlayerState(player, weaponSystem, vehicleSystem) {
    const p = player.playerData;
    const weapon = weaponSystem?.getActiveWeapon();
    const vehData = vehicleSystem?.getHUDData();

    return {
        // Position (quantized to 1 decimal)
        x: Math.round(player.x * 10) / 10,
        y: Math.round(player.y * 10) / 10,
        r: Math.round(player.rotation * 100) / 100,

        // State
        hp: Math.ceil(p.health),
        st: Math.ceil(p.stamina),

        // Weapon
        wep: weapon?.id || null,
        mag: weaponSystem?.magAmmo?.[weaponSystem.activeSlot] || 0,

        // Vehicle
        inVeh: p.inVehicle || false,
        vehId: vehData ? vehData.name : null,
        vehSpd: vehData ? vehData.speed : 0,

        // Timestamp
        t: Date.now(),
    };
}

/**
 * Serialize a game event for broadcast.
 */
export function serializeGameEvent(type, data) {
    return {
        ev: type,
        d: data,
        t: Date.now(),
    };
}

// ═══════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════

export const GameEvent = {
    PLAYER_SHOOT: 'shoot',
    PLAYER_RELOAD: 'reload',
    PLAYER_PICKUP: 'pickup',
    PLAYER_KILL: 'kill',
    PLAYER_DEATH: 'death',
    PLAYER_ENTER_VEH: 'enter_veh',
    PLAYER_EXIT_VEH: 'exit_veh',
    AI_KILL: 'ai_kill',
    CHAT: 'chat',
};

// ═══════════════════════════════════════════════════════
// REMOTE PLAYER RENDERER — Renders other players from network state
// ═══════════════════════════════════════════════════════

export class RemotePlayerManager {
    constructor(scene) {
        this.scene = scene;
        this.remotePlayers = {}; // { playerId: { sprite, nameLabel, lastUpdate } }
    }

    /**
     * Update or create a remote player from network state
     * @param {string} playerId - Remote player ID
     * @param {string} playerName - Remote player name
     * @param {object} state - Serialized state from network
     */
    updateRemotePlayer(playerId, playerName, state) {
        if (!this.remotePlayers[playerId]) {
            this._createRemotePlayer(playerId, playerName, state);
        }

        const rp = this.remotePlayers[playerId];
        if (!rp || !rp.sprite.active) return;

        // Lerp position (smooth interpolation)
        const lerpFactor = 0.15;
        rp.targetX = state.x;
        rp.targetY = state.y;
        rp.targetR = state.r;

        rp.sprite.x += (rp.targetX - rp.sprite.x) * lerpFactor;
        rp.sprite.y += (rp.targetY - rp.sprite.y) * lerpFactor;
        rp.sprite.rotation += (rp.targetR - rp.sprite.rotation) * lerpFactor;

        // Update visual state
        if (state.inVeh) {
            rp.sprite.setAlpha(0.3); // ghost when in vehicle
        } else {
            rp.sprite.setAlpha(1);
        }

        // Health bar
        const hpPct = state.hp / 100;
        if (rp.healthBar) rp.healthBar.scaleX = Math.max(0, hpPct);

        // Update name label
        if (rp.nameLabel) {
            rp.nameLabel.setPosition(rp.sprite.x, rp.sprite.y - 26);
            rp.nameLabel.setText(`${playerName} [${state.hp}HP]`);
        }

        // Shadow
        if (rp.shadow) rp.shadow.setPosition(rp.sprite.x, rp.sprite.y + 5);

        rp.lastUpdate = Date.now();
    }

    _createRemotePlayer(playerId, playerName, state) {
        const x = state.x || 8000;
        const y = state.y || 8000;

        // Shadow
        const shadow = this.scene.add.image(x, y + 5, 'shadow_circle')
            .setDepth(20).setAlpha(0.3).setScale(0.7, 0.4);

        // Sprite (use player texture with different tint)
        const sprite = this.scene.add.image(x, y, 'player')
            .setDepth(22)
            .setScale(1.8)
            .setTint(0x6688ff); // Blue tint for remote players

        // No physics body — remote players are interpolated
        // (server is authoritative)

        // Name label
        const nameLabel = this.scene.add.text(x, y - 26, playerName, {
            fontSize: '7px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#60a5fa', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(23);

        // Health bar
        const healthBg = this.scene.add.rectangle(x - 10, y - 20, 20, 2, 0x333333)
            .setOrigin(0, 0.5).setDepth(23);
        const healthBar = this.scene.add.rectangle(x - 10, y - 20, 20, 2, 0x22c55e)
            .setOrigin(0, 0.5).setDepth(23);

        this.remotePlayers[playerId] = {
            sprite,
            shadow,
            nameLabel,
            healthBg,
            healthBar,
            targetX: x,
            targetY: y,
            targetR: 0,
            lastUpdate: Date.now(),
        };
    }

    /**
     * Remove a remote player (disconnected)
     */
    removeRemotePlayer(playerId) {
        const rp = this.remotePlayers[playerId];
        if (!rp) return;

        rp.sprite.destroy();
        rp.shadow?.destroy();
        rp.nameLabel?.destroy();
        rp.healthBg?.destroy();
        rp.healthBar?.destroy();

        delete this.remotePlayers[playerId];
    }

    /**
     * Clean up stale remote players (no update for 10 seconds)
     */
    cleanupStale() {
        const now = Date.now();
        const timeout = 10000;

        for (const [id, rp] of Object.entries(this.remotePlayers)) {
            if (now - rp.lastUpdate > timeout) {
                console.log(`[NET] Removing stale player: ${id}`);
                this.removeRemotePlayer(id);
            }
        }
    }

    /** Get count of live remote players */
    getPlayerCount() {
        return Object.keys(this.remotePlayers).length;
    }

    destroy() {
        for (const id of Object.keys(this.remotePlayers)) {
            this.removeRemotePlayer(id);
        }
    }
}

// ═══════════════════════════════════════════════════════
// TICK RATE CONTROLLER — Ensures consistent network send rate
// ═══════════════════════════════════════════════════════

export class TickRateController {
    constructor(tickRate = 20) {
        this.tickRate = tickRate;           // ticks per second
        this.tickInterval = 1000 / tickRate; // ms between ticks
        this.lastTick = 0;
    }

    /** Returns true if it's time to send a network update */
    shouldTick(time) {
        if (time - this.lastTick >= this.tickInterval) {
            this.lastTick = time;
            return true;
        }
        return false;
    }
}
