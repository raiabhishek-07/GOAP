import { SoundManager } from "../../../lib/game/SoundManager";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

/**
 * LobbyScene — Multiplayer lobby UI
 * Features: Room list, Create Room, Join by ID
 */
export class LobbyScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    init() {
        this.rooms = [
            { id: 'ALPHA-7', players: 1, max: 4, status: 'OPEN' },
            { id: 'BRAVO-2', players: 3, max: 4, status: 'FULL' },
            { id: 'GHOST-9', players: 2, max: 4, status: 'OPEN' },
        ];
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Background (Reuse main menu style)
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0f0a, 0x0a0f0a, 0x121a12, 0x1a2a1a, 1);
        bg.fillRect(0, 0, width, height);

        // Header
        this.add.text(cx, 40, 'MULTIPLAYER NETWORK', {
            fontSize: '28px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold', letterSpacing: 8
        }).setOrigin(0.5);

        this.add.text(cx, 75, 'ESTABLISHING SECURE CONNECTION TO MIND ARCHIVE', {
            fontSize: '10px', fontFamily: 'monospace', color: '#f59e0b', letterSpacing: 2
        }).setOrigin(0.5);

        // Main Panel
        this.createLobbyPanel(cx, cy, width * 0.8, height * 0.6);

        // Footer Buttons
        this.createFooterButtons(cx, height - 60);
    }

    createLobbyPanel(x, y, w, h) {
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.4);
        panel.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
        panel.lineStyle(1, 0x4a6a4a, 0.3);
        panel.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

        // Room List Title
        this.add.text(x - w / 2 + 30, y - h / 2 + 30, 'ACTIVE MISSIONS', {
            fontSize: '14px', fontFamily: 'monospace', color: '#60a5fa', fontStyle: 'bold'
        });

        // Search Bar (Visual only)
        const search = this.add.graphics();
        search.fillStyle(0x1a2a1a, 0.6);
        search.fillRoundedRect(x + w / 2 - 200, y - h / 2 + 25, 170, 24, 4);
        this.add.text(x + w / 2 - 190, y - h / 2 + 30, 'SEARCH ID...', {
            fontSize: '10px', fontFamily: 'monospace', color: '#4a6a4a'
        });

        // Room List
        this.rooms.forEach((room, i) => {
            this.createRoomRow(x, y - h / 2 + 80 + (i * 50), w - 60, room);
        });
    }

    createRoomRow(x, y, w, room) {
        const row = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a1a, 0.4);
        bg.fillRoundedRect(-w / 2, -20, w, 40, 4);
        row.add(bg);

        // ID
        row.add(this.add.text(-w / 2 + 20, 0, room.id, {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0, 0.5));

        // Players
        row.add(this.add.text(0, 0, `OPERATORS: ${room.players}/${room.max}`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#8a9a8a'
        }).setOrigin(0.5));

        // Status
        const statusColor = room.status === 'OPEN' ? '#00e676' : '#ef4444';
        row.add(this.add.text(w / 2 - 120, 0, room.status, {
            fontSize: '10px', fontFamily: 'monospace', color: statusColor, fontStyle: 'bold'
        }).setOrigin(1, 0.5));

        // Action Button
        const btnW = 80, btnH = 24;
        const btn = this.add.graphics();
        btn.fillStyle(room.status === 'OPEN' ? 0x22c55e : 0x333333, 0.8);
        btn.fillRoundedRect(w / 2 - 90, -btnH / 2, btnW, btnH, 4);
        row.add(btn);

        const btnText = this.add.text(w / 2 - 50, 0, room.status === 'OPEN' ? 'JOIN' : 'LOCKED', {
            fontSize: '10px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        row.add(btnText);

        if (room.status === 'OPEN') {
            const hitArea = new Phaser.Geom.Rectangle(w / 2 - 90, -btnH / 2, btnW, btnH);
            row.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            row.on('pointerover', () => {
                btn.clear();
                btn.fillStyle(0x00e676, 1);
                btn.fillRoundedRect(w / 2 - 90, -btnH / 2, btnW, btnH, 4);
                SoundManager.uiHover();
            });
            row.on('pointerout', () => {
                btn.clear();
                btn.fillStyle(0x22c55e, 0.8);
                btn.fillRoundedRect(w / 2 - 90, -btnH / 2, btnW, btnH, 4);
            });
            row.on('pointerup', () => {
                SoundManager.uiClick();
                this.joinRoom(room.id);
            });
        }
    }

    createFooterButtons(cx, y) {
        const btnW = 180, btnH = 40;

        // BACK Button
        const backBtn = this.createButton(cx - 200, y, '← BACK TO BASE', 0xef4444, () => {
            this.cameras.main.fadeOut(400);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenuScene');
            });
        });

        // CREATE MISSION Button
        const createBtn = this.createButton(cx + 200, y, '+ CREATE MISSION', 0xf59e0b, () => {
            this.createRoom();
        });
    }

    createButton(x, y, label, color, onClick) {
        const w = 180, h = 40;
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.6);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
        bg.lineStyle(2, color, 0.5);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
        container.add(bg);

        const text = this.add.text(0, 0, label, {
            fontSize: '12px', fontFamily: 'monospace', color: color, fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        container.setSize(w, h);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 0.2);
            bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
            bg.lineStyle(2, color, 1);
            bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
            SoundManager.uiHover();
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x000000, 0.6);
            bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
            bg.lineStyle(2, color, 0.5);
            bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
        });

        container.on('pointerup', () => {
            SoundManager.uiClick();
            onClick();
        });

        return container;
    }

    joinRoom(id) {
        console.log(`Joining room: ${id}`);
        // TODO: Socket.io join
        this.cameras.main.shake(200, 0.005);
        this.add.text(this.scale.width / 2, this.scale.height / 2 + 150, `CONNECTING TO ${id}...`, {
            fontSize: '12px', color: '#00e676', fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    createRoom() {
        console.log('Creating room...');
        // TODO: Socket.io create
        this.cameras.main.fadeOut(800, 255, 255, 255);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Mock transition to game with other players
            this.scene.start('GameScene', { level: 1, stage: 1, isMultiplayer: true });
        });
    }
}
