// ============================================================
// NetworkManager.js — WebSocket client for multiplayer
// Handles connection, reconnection, message routing
// Ready for any WebSocket server (Socket.io, ws, Colyseus, etc.)
// ============================================================

export class NetworkManager {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.roomId = null;
        this.playerId = null;
        this.playerName = '';

        // Message handlers by type
        this._handlers = {};

        // Reconnection
        this._reconnectAttempts = 0;
        this._maxReconnects = 5;
        this._reconnectDelay = 2000;
        this._serverUrl = '';

        // Outbound message queue (buffered during disconnect)
        this._queue = [];

        // Stats
        this.latency = 0;
        this._lastPing = 0;

        // Event callbacks
        this.onConnected = null;
        this.onDisconnected = null;
        this.onError = null;
        this.onRoomJoined = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onStateUpdate = null;
    }

    // ═══════════════════════════════════════════════════════
    // CONNECTION
    // ═══════════════════════════════════════════════════════

    /**
     * Connect to game server
     * @param {string} url - WebSocket URL (e.g. ws://localhost:8080)
     * @param {string} playerName - Display name
     */
    connect(url, playerName) {
        this._serverUrl = url;
        this.playerName = playerName;
        this.playerId = this._generateId();

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                this.connected = true;
                this._reconnectAttempts = 0;
                console.log(`[NET] Connected to ${url}`);

                // Send join message
                this.send('join', {
                    playerId: this.playerId,
                    playerName: this.playerName,
                    timestamp: Date.now(),
                });

                // Flush queued messages
                this._flushQueue();

                if (this.onConnected) this.onConnected();
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this._handleMessage(msg);
                } catch (e) {
                    console.warn('[NET] Invalid message:', event.data);
                }
            };

            this.ws.onclose = (event) => {
                this.connected = false;
                console.log(`[NET] Disconnected (code: ${event.code})`);
                if (this.onDisconnected) this.onDisconnected(event.code);
                this._tryReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[NET] Error:', error);
                if (this.onError) this.onError(error);
            };
        } catch (e) {
            console.error('[NET] Connection failed:', e);
            if (this.onError) this.onError(e);
        }
    }

    disconnect() {
        this._maxReconnects = 0; // prevent reconnect
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.connected = false;
        this.roomId = null;
    }

    _tryReconnect() {
        if (this._reconnectAttempts >= this._maxReconnects) return;
        this._reconnectAttempts++;

        console.log(`[NET] Reconnecting (${this._reconnectAttempts}/${this._maxReconnects})...`);
        setTimeout(() => {
            this.connect(this._serverUrl, this.playerName);
        }, this._reconnectDelay * this._reconnectAttempts);
    }

    // ═══════════════════════════════════════════════════════
    // MESSAGING
    // ═══════════════════════════════════════════════════════

    /**
     * Send a message to the server
     * @param {string} type - Message type
     * @param {object} data - Payload
     */
    send(type, data = {}) {
        const msg = {
            type,
            playerId: this.playerId,
            roomId: this.roomId,
            timestamp: Date.now(),
            ...data,
        };

        if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        } else {
            // Queue for later
            this._queue.push(msg);
        }
    }

    /** Register a handler for a message type */
    on(type, callback) {
        if (!this._handlers[type]) this._handlers[type] = [];
        this._handlers[type].push(callback);
    }

    /** Remove handler */
    off(type, callback) {
        if (!this._handlers[type]) return;
        this._handlers[type] = this._handlers[type].filter(h => h !== callback);
    }

    _handleMessage(msg) {
        const { type } = msg;

        // Built-in handlers
        switch (type) {
            case 'room_joined':
                this.roomId = msg.roomId;
                if (this.onRoomJoined) this.onRoomJoined(msg);
                break;

            case 'player_joined':
                if (this.onPlayerJoined) this.onPlayerJoined(msg);
                break;

            case 'player_left':
                if (this.onPlayerLeft) this.onPlayerLeft(msg);
                break;

            case 'state_update':
                if (this.onStateUpdate) this.onStateUpdate(msg);
                break;

            case 'pong':
                this.latency = Date.now() - this._lastPing;
                break;
        }

        // Custom handlers
        if (this._handlers[type]) {
            this._handlers[type].forEach(h => h(msg));
        }
    }

    _flushQueue() {
        while (this._queue.length > 0) {
            const msg = this._queue.shift();
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(msg));
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // ROOM MANAGEMENT
    // ═══════════════════════════════════════════════════════

    createRoom(roomName, maxPlayers = 10) {
        this.send('create_room', { roomName, maxPlayers });
    }

    joinRoom(roomId) {
        this.send('join_room', { roomId });
    }

    leaveRoom() {
        this.send('leave_room', {});
        this.roomId = null;
    }

    // ═══════════════════════════════════════════════════════
    // GAME STATE SYNC
    // ═══════════════════════════════════════════════════════

    /** Send player position/state (called every tick) */
    sendPlayerState(state) {
        this.send('player_state', state);
    }

    /** Send a game event (shoot, kill, pickup, etc.) */
    sendGameEvent(event) {
        this.send('game_event', event);
    }

    /** Ping for latency measurement */
    ping() {
        this._lastPing = Date.now();
        this.send('ping', {});
    }

    // ═══════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════

    _generateId() {
        return 'p_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }

    getLatency() {
        return this.latency;
    }

    isConnected() {
        return this.connected;
    }
}

// Singleton instance
let _networkInstance = null;
export function getNetwork() {
    if (!_networkInstance) _networkInstance = new NetworkManager();
    return _networkInstance;
}
