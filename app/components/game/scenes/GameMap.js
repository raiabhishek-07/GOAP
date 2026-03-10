// ============================================================
// GameMap.js — Tactical Interactive Map System
// Creates a clean, exact miniature version of the true environment
// ============================================================

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class GameMap extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'GameMap' });
    }

    init(data) {
        this.playerData = data.playerData || { x: 0, y: 0 };
        this.gameScene = this.scene.get('GameScene'); // Reference to main scene

        // Ensure we load correct level/stage data from the parent scene
        this.currentLevel = data.level ?? (this.gameScene?.levelNum ?? 1);
        this.currentStage = data.stage ?? (this.gameScene?.stageNum ?? 1);

        // Grab the precise level config geometry
        if (this.gameScene && this.gameScene.levelConfig) {
            this.levelConfig = this.gameScene.levelConfig;
        } else {
            this.levelConfig = null;
        }

        // Map settings
        this.mapScale = 0.08; // Base zoom relative to worldview
        this.isPaused = false;
        this.playerPosition = { x: this.playerData.x, y: this.playerData.y };
        this.isDragging = false;
    }

    create() {
        console.log(`🗺️ Tactical Map Loading (L${this.currentLevel} S${this.currentStage})...`);

        // 1. Map container layout
        this._createMapLayout();

        // 2. Exact Miniature Grid & Obstacles
        this._createExactMiniature();

        // 3. Dynamic Objectives from LevelConfig
        this._createObjectives();

        // 4. Tactical Player UI
        this._createPlayerUI();

        // 5. Input Handlers
        this._setupInput();

        // Init tracking
        this.events.on('update', this.update, this);
    }

    // ═══════════════════════════════════════════════════════
    // CORE UI 
    // ═══════════════════════════════════════════════════════

    _createMapLayout() {
        // Blur background overlay
        this.overlay = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x020617, 0.9);
        this.overlay.setScrollFactor(0);

        // Map Anchor Container
        this.mapContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.mapContainer.setScrollFactor(0);

        // Viewport bounds
        const mapWidth = 720;
        const mapHeight = 480;

        // Blueprint background
        this.mapViewport = this.add.rectangle(0, 0, mapWidth, mapHeight, 0x0f172a, 1);
        this.mapViewport.setStrokeStyle(4, 0x10b981, 0.5);
        this.mapContainer.add(this.mapViewport);

        // Header Title
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - mapHeight / 2 - 25, `TACTICAL SENSOR ARRAY // L${this.currentLevel} S${this.currentStage}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#10b981',
            fontStyle: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0);

        // Close Hint
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + mapHeight / 2 + 25, `[PRESS M OR ESC TO ABORT UPLINK]`, {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#64748b',
            letterSpacing: 3
        }).setOrigin(0.5).setScrollFactor(0);

        // Zoom hints
        this.add.text(this.cameras.main.width / 2 - mapWidth / 2 + 20, this.cameras.main.height / 2 + mapHeight / 2 - 20, `ZOOM: SCROLL // PAN: DRAG`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#10b981'
        }).setOrigin(0, 0.5).setScrollFactor(0);
    }

    // ═══════════════════════════════════════════════════════
    // EXACT GEOMETRY MINIATURE
    // ═══════════════════════════════════════════════════════

    _createExactMiniature() {
        const floorGrid = this.add.graphics();
        this.mapContainer.add(floorGrid);

        // Calculate world bounds from GameScene, default to 4000x3000
        const wWidth = 4000;
        const wHeight = 3000;

        // Center map container to reflect (0,0) of world at an offset so center of world maps to center of window
        // But let's keep container at 0,0 and just offset the drawing
        const offsetX = -wWidth / 2;
        const offsetY = -wHeight / 2;

        // Draw World Grid
        floorGrid.lineStyle(1, 0x1e293b, 0.5);
        for (let x = 0; x <= wWidth; x += 200) {
            floorGrid.lineBetween((x + offsetX) * this.mapScale, offsetY * this.mapScale, (x + offsetX) * this.mapScale, (wHeight + offsetY) * this.mapScale);
        }
        for (let y = 0; y <= wHeight; y += 200) {
            floorGrid.lineBetween(offsetX * this.mapScale, (y + offsetY) * this.mapScale, (wWidth + offsetX) * this.mapScale, (y + offsetY) * this.mapScale);
        }

        // Draw exact obstacles from GameScene
        const obstacles = this.gameScene?.worldObstacles || [];
        floorGrid.fillStyle(0x334155, 0.6); // Slate block color
        floorGrid.lineStyle(1, 0x10b981, 0.4); // Emerald wireframe

        obstacles.forEach(obs => {
            // Some objects might be raw gameobjects instead of Rects
            const ox = typeof obs.x === 'number' ? obs.x : 0;
            const oy = typeof obs.y === 'number' ? obs.y : 0;
            const ow = typeof obs.w === 'number' ? obs.w : (obs.width || 20);
            const oh = typeof obs.h === 'number' ? obs.h : (obs.height || 20);

            // X/Y in world boundaries to local map scale
            const drawX = (ox - ow / 2 + offsetX) * this.mapScale;
            const drawY = (oy - oh / 2 + offsetY) * this.mapScale;
            const drawW = ow * this.mapScale;
            const drawH = oh * this.mapScale;

            floorGrid.fillRect(drawX, drawY, drawW, drawH);
            floorGrid.strokeRect(drawX, drawY, drawW, drawH);
        });

        this.worldOffsetX = offsetX;
        this.worldOffsetY = offsetY;
    }

    // ═══════════════════════════════════════════════════════
    // OBJECTIVES & TACTICAL MARKERS
    // ═══════════════════════════════════════════════════════

    _createObjectives() {
        this.objectiveMarkers = [];
        if (!this.levelConfig) return;

        // Extract tasks directly from live level config
        const tasks = this.levelConfig.tasks || [];

        tasks.forEach(task => {
            if (!task.position) return;
            const mx = (task.position.x + this.worldOffsetX) * this.mapScale;
            const my = (task.position.y + this.worldOffsetY) * this.mapScale;

            const markerGroup = this.add.container(mx, my);
            this.mapContainer.add(markerGroup);

            // Icon background
            const bg = this.add.rectangle(0, 0, 12, 12, 0xf59e0b, 0.8).setRotation(Math.PI / 4);
            markerGroup.add(bg);

            // Label
            const text = this.add.text(0, 12, task.name || "OBJECTIVE", {
                fontSize: '8px',
                fontFamily: 'monospace',
                color: '#fbbf24',
                backgroundColor: 'rgba(0,0,0,0.8)'
            }).setOrigin(0.5);
            markerGroup.add(text);

            this.tweens.add({
                targets: bg,
                scaleX: 1.2, scaleY: 1.2,
                duration: 1000, yoyo: true, repeat: -1
            });

            this.objectiveMarkers.push({ markerGroup, x: task.position.x, y: task.position.y });
        });

        // Extraction Zone
        if (this.levelConfig.extraction) {
            const extX = (this.levelConfig.extraction.x + this.worldOffsetX) * this.mapScale;
            const extY = (this.levelConfig.extraction.y + this.worldOffsetY) * this.mapScale;

            const extRect = this.add.circle(extX, extY, 15, 0x3b82f6, 0.3);
            extRect.setStrokeStyle(2, 0x60a5fa);
            this.mapContainer.add(extRect);

            this.add.text(extX, extY, "EXTRACTION", {
                fontSize: '8px', fontFamily: 'monospace', color: '#60a5fa', backgroundColor: '#000000'
            }).setOrigin(0.5).setDepth(10);
            this.mapContainer.add(this.add.text);
        }
    }

    _createPlayerUI() {
        this.playerMarker = this.add.circle(0, 0, 4, 0x10b981, 1);
        this.playerMarker.setStrokeStyle(2, 0xffffff);
        this.mapContainer.add(this.playerMarker);

        // Sight cone indicator
        this.playerDirection = this.add.polygon(0, 0, [0, -10, -5, 5, 5, 5], 0x10b981, 0.6);
        this.mapContainer.add(this.playerDirection);
    }

    // ═══════════════════════════════════════════════════════
    // LOGIC & INPUT
    // ═══════════════════════════════════════════════════════

    _setupInput() {
        this.input.keyboard.on('keydown-M', () => this.closeMap());
        this.input.keyboard.on('keydown-ESC', () => this.closeMap());

        // Mouse Drag to Pan
        this.input.on('pointerdown', (pointer) => {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
            this.mapStartX = this.mapContainer.x;
            this.mapStartY = this.mapContainer.y;
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                this.mapContainer.x = this.mapStartX + (pointer.x - this.dragStartX);
                this.mapContainer.y = this.mapStartY + (pointer.y - this.dragStartY);
            }
        });

        this.input.on('pointerup', () => this.isDragging = false);

        // Scroll to zoom
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoomAmount = deltaY > 0 ? -0.01 : 0.01;
            const newScale = Phaser.Math.Clamp(this.mapScale + zoomAmount, 0.03, 0.2);

            // Rebuild exact miniature with new scale
            if (newScale !== this.mapScale) {
                this.mapScale = newScale;
                this.mapContainer.removeAll(true);
                this.mapContainer.add(this.mapViewport);
                this._createExactMiniature();
                this._createObjectives();
                this._createPlayerUI();
            }
        });
    }

    closeMap() {
        if (this.gameScene) {
            this.gameScene.scene.resume();
        }
        this.scene.stop();
    }

    update() {
        if (!this.gameScene || !this.gameScene.player) return;

        const px = this.gameScene.player.x;
        const py = this.gameScene.player.y;
        const rot = this.gameScene.player.rotation || 0;

        const mx = (px + this.worldOffsetX) * this.mapScale;
        const my = (py + this.worldOffsetY) * this.mapScale;

        this.playerMarker.setPosition(mx, my);
        this.playerDirection.setPosition(mx, my);
        this.playerDirection.rotation = rot;
    }

    destroy() {
        this.events.off('update', this.update, this);
    }
}
