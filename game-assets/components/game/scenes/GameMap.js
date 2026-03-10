// ============================================================
// GameMap.js — Interactive Map System for Solo Gameplay
// Shows player location, objectives, and world visualization
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
        this.playerData = data.playerData;
        this.worldSize = data.worldSize || 2000;
        this.currentLevel = data.level || 1;
        this.currentStage = data.stage || 1;
        
        // Map settings
        this.mapScale = 0.1; // Scale factor for map view
        this.isPaused = false;
        this.playerPosition = { x: 0, y: 0 };
        this.objectives = [];
        this.exploredAreas = new Set();
    }

    create() {
        console.log('🗺️ GameMap Loading...');

        // Create map background
        this._createMapBackground();

        // Create map viewport
        this._createMapViewport();

        // Create player marker
        this._createPlayerMarker();

        // Create objective markers
        this._createObjectiveMarkers();

        // Create map controls
        this._createMapControls();

        // Create minimap
        this._createMinimap();

        // Setup input handlers
        this._setupInputHandlers();

        // Initialize map data
        this._initializeMapData();

        console.log('✅ GameMap Ready!');
    }

    // ═══════════════════════════════════════════════════════
    // MAP VISUALIZATION
    // ═══════════════════════════════════════════════════════

    _createMapBackground() {
        // Dark overlay background
        this.overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8);
        this.overlay.setOrigin(0.5, 0.5);
        this.overlay.setScrollFactor(0);

        // Map container
        this.mapContainer = this.add.container(0, 0);
        this.mapContainer.setScrollFactor(0);

        // Map background grid
        this._createMapGrid();
    }

    _createMapGrid() {
        const gridSize = 50;
        const gridCount = Math.ceil(this.worldSize / gridSize);

        // Create grid lines
        for (let i = 0; i <= gridCount; i++) {
            const pos = (i * gridSize - this.worldSize / 2) * this.mapScale;
            
            // Vertical lines
            const vLine = this.add.line(pos, 0, 0, -this.worldSize * this.mapScale / 2, 0, this.worldSize * this.mapScale / 2, 0x333333, 0.3);
            vLine.setScrollFactor(0);
            this.mapContainer.add(vLine);
            
            // Horizontal lines
            const hLine = this.add.line(0, pos, -this.worldSize * this.mapScale / 2, 0, this.worldSize * this.mapScale / 2, 0, 0x333333, 0.3);
            hLine.setScrollFactor(0);
            this.mapContainer.add(hLine);
        }
    }

    _createMapViewport() {
        // Main map viewport
        const mapWidth = 600;
        const mapHeight = 400;
        
        this.mapViewport = this.add.rectangle(0, 0, mapWidth, mapHeight, 0x1a1a2e, 0.9);
        this.mapViewport.setStrokeStyle(2, 0x00ff88);
        this.mapViewport.setScrollFactor(0);
        this.mapContainer.add(this.mapViewport);

        // Map title
        this.mapTitle = this.add.text(0, -mapHeight/2 - 30, `LEVEL ${this.currentLevel} - STAGE ${this.currentStage}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff88',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);
        this.mapContainer.add(this.mapTitle);

        // Map border
        this.mapBorder = this.add.rectangle(0, 0, mapWidth + 10, mapHeight + 10, 0x000000, 0);
        this.mapBorder.setStrokeStyle(3, 0x00ff88, 0.5);
        this.mapBorder.setScrollFactor(0);
        this.mapContainer.add(this.mapBorder);
    }

    _createPlayerMarker() {
        // Player position marker
        this.playerMarker = this.add.circle(0, 0, 8, 0x00ff00, 0.8);
        this.playerMarker.setStrokeStyle(2, 0xffffff);
        this.playerMarker.setScrollFactor(0);
        this.mapContainer.add(this.playerMarker);

        // Player direction indicator
        this.playerDirection = this.add.triangle(0, -12, 0, 0, -4, 8, 4, 8, 0xffffff, 0.8);
        this.playerDirection.setScrollFactor(0);
        this.mapContainer.add(this.playerDirection);

        // Player view cone
        this.playerViewCone = this.add.polygon(0, 0, [
            0, 0,
            -20, -30,
            20, -30
        ], 0x00ff00, 0.1);
        this.playerViewCone.setScrollFactor(0);
        this.mapContainer.add(this.playerViewCone);
    }

    _createObjectiveMarkers() {
        // Sample objectives - in real game, these would come from game state
        this.objectives = [
            { id: 1, type: 'target', x: 200, y: 150, completed: false, name: 'Eliminate Target' },
            { id: 2, type: 'extract', x: -300, y: -200, completed: false, name: 'Extraction Point' },
            { id: 3, type: 'intel', x: 100, y: -100, completed: false, name: 'Gather Intel' },
            { id: 4, type: 'supply', x: -150, y: 100, completed: false, name: 'Supply Cache' }
        ];

        this.objectiveMarkers = [];

        this.objectives.forEach(obj => {
            const marker = this._createObjectiveMarker(obj);
            this.objectiveMarkers.push(marker);
        });
    }

    _createObjectiveMarker(objective) {
        let marker;
        let color;

        switch (objective.type) {
            case 'target':
                marker = this.add.star(0, 0, 5, 8, 4, 0xff0000, 0.8);
                color = '#ff0000';
                break;
            case 'extract':
                marker = this.add.rectangle(0, 0, 12, 12, 0x0088ff, 0.8);
                color = '#0088ff';
                break;
            case 'intel':
                marker = this.add.circle(0, 0, 6, 0xffff00, 0.8);
                color = '#ffff00';
                break;
            case 'supply':
                marker = this.add.triangle(0, 0, 0, -8, -6, 6, 6, 6, 0x00ff00, 0.8);
                color = '#00ff00';
                break;
            default:
                marker = this.add.circle(0, 0, 5, 0xffffff, 0.8);
                color = '#ffffff';
        }

        marker.setScrollFactor(0);
        this.mapContainer.add(marker);

        // Objective label
        const label = this.add.text(0, 15, objective.name, {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: color,
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5).setScrollFactor(0);
        this.mapContainer.add(label);

        // Pulse animation for active objectives
        if (!objective.completed) {
            this.tweens.add({
                targets: marker,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }

        return { marker, label, objective };
    }

    _createMapControls() {
        // Close button
        this.closeButton = this.add.rectangle(250, -180, 80, 30, 0xff4444, 0.8);
        this.closeButton.setStrokeStyle(2, 0xffffff);
        this.closeButton.setScrollFactor(0);
        this.mapContainer.add(this.closeButton);

        this.closeText = this.add.text(250, -180, 'CLOSE (M)', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        this.mapContainer.add(this.closeText);

        // Zoom controls
        this.zoomInButton = this.add.rectangle(250, 180, 30, 30, 0x444444, 0.8);
        this.zoomInButton.setStrokeStyle(1, 0x00ff88);
        this.zoomInButton.setScrollFactor(0);
        this.mapContainer.add(this.zoomInButton);

        this.zoomInText = this.add.text(250, 180, '+', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff88'
        }).setOrigin(0.5).setScrollFactor(0);
        this.mapContainer.add(this.zoomInText);

        this.zoomOutButton = this.add.rectangle(200, 180, 30, 30, 0x444444, 0.8);
        this.zoomOutButton.setStrokeStyle(1, 0x00ff88);
        this.zoomOutButton.setScrollFactor(0);
        this.mapContainer.add(this.zoomOutButton);

        this.zoomOutText = this.add.text(200, 180, '-', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff88'
        }).setOrigin(0.5).setScrollFactor(0);
        this.mapContainer.add(this.zoomOutText);

        // Legend
        this._createLegend();
    }

    _createLegend() {
        const legendX = -250;
        const legendY = 150;

        this.legendTitle = this.add.text(legendX, legendY - 20, 'LEGEND:', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#00ff88'
        }).setScrollFactor(0);
        this.mapContainer.add(this.legendTitle);

        const legendItems = [
            { symbol: '●', color: '#00ff00', text: 'Player' },
            { symbol: '★', color: '#ff0000', text: 'Target' },
            { symbol: '■', color: '#0088ff', text: 'Extract' },
            { symbol: '●', color: '#ffff00', text: 'Intel' },
            { symbol: '▲', color: '#00ff00', text: 'Supply' }
        ];

        legendItems.forEach((item, index) => {
            const y = legendY + index * 15;
            const symbol = this.add.text(legendX, y, item.symbol, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: item.color
            }).setScrollFactor(0);
            this.mapContainer.add(symbol);

            const text = this.add.text(legendX + 20, y, item.text, {
                fontSize: '8px',
                fontFamily: 'monospace',
                color: '#ffffff'
            }).setScrollFactor(0);
            this.mapContainer.add(text);
        });
    }

    _createMinimap() {
        // Minimap in corner
        const minimapSize = 120;
        const minimapX = this.cameras.main.width / 2 - minimapSize / 2 - 10;
        const minimapY = this.cameras.main.height / 2 - minimapSize / 2 - 10;

        this.minimapContainer = this.add.container(minimapX, minimapY);
        this.minimapContainer.setScrollFactor(0);

        // Minimap background
        this.minimapBg = this.add.rectangle(0, 0, minimapSize, minimapSize, 0x1a1a2e, 0.9);
        this.minimapBg.setStrokeStyle(1, 0x00ff88);
        this.minimapBg.setScrollFactor(0);
        this.minimapContainer.add(this.minimapBg);

        // Minimap player
        this.minimapPlayer = this.add.circle(0, 0, 3, 0x00ff00, 0.8);
        this.minimapPlayer.setScrollFactor(0);
        this.minimapContainer.add(this.minimapPlayer);

        // Minimap objectives
        this.minimapObjectives = [];
        this.objectives.forEach(obj => {
            const minimapObj = this.add.circle(0, 0, 2, this._getObjectiveColor(obj.type), 0.8);
            minimapObj.setScrollFactor(0);
            this.minimapContainer.add(minimapObj);
            this.minimapObjectives.push({ marker: minimapObj, objective: obj });
        });
    }

    _getObjectiveColor(type) {
        const colors = {
            target: 0xff0000,
            extract: 0x0088ff,
            intel: 0xffff00,
            supply: 0x00ff00
        };
        return colors[type] || 0xffffff;
    }

    // ═══════════════════════════════════════════════════════
    // INPUT HANDLING
    // ═══════════════════════════════════════════════════════

    _setupInputHandlers() {
        // Keyboard controls
        this.input.keyboard.on('keydown-M', () => {
            this.closeMap();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.closeMap();
        });

        // Mouse controls
        this.closeButton.setInteractive();
        this.closeButton.on('pointerdown', () => {
            this.closeMap();
        });

        // Zoom controls
        this.zoomInButton.setInteractive();
        this.zoomInButton.on('pointerdown', () => {
            this.zoomMap(0.1);
        });

        this.zoomOutButton.setInteractive();
        this.zoomOutButton.on('pointerdown', () => {
            this.zoomMap(-0.1);
        });

        // Map panning
        this.input.on('pointerdown', (pointer) => {
            if (this._isPointInMap(pointer.x, pointer.y)) {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
                this.mapStartX = this.mapContainer.x;
                this.mapStartY = this.mapContainer.y;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const dx = pointer.x - this.dragStartX;
                const dy = pointer.y - this.dragStartY;
                this.mapContainer.x = this.mapStartX + dx;
                this.mapContainer.y = this.mapStartY + dy;
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });
    }

    _isPointInMap(x, y) {
        const bounds = this.mapViewport.getBounds();
        return x >= bounds.x && x <= bounds.x + bounds.width &&
               y >= bounds.y && y <= bounds.y + bounds.height;
    }

    // ═══════════════════════════════════════════════════════
    // MAP FUNCTIONALITY
    // ═══════════════════════════════════════════════════════

    _initializeMapData() {
        // Get current player position from game scene
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.player) {
            this.updatePlayerPosition(gameScene.player.x, gameScene.player.y);
        }

        // Start update loop
        this.events.on('update', this.update, this);
    }

    updatePlayerPosition(x, y) {
        this.playerPosition = { x, y };
        
        // Update main map markers
        const mapX = x * this.mapScale;
        const mapY = y * this.mapScale;
        
        this.playerMarker.setPosition(mapX, mapY);
        this.playerDirection.setPosition(mapX, mapY - 12);
        this.playerViewCone.setPosition(mapX, mapY);

        // Update minimap
        const minimapScale = 0.05;
        const minimapX = x * minimapScale;
        const minimapY = y * minimapScale;
        this.minimapPlayer.setPosition(minimapX, minimapY);

        // Update objective markers
        this.objectiveMarkers.forEach(({ marker, label, objective }) => {
            const objMapX = objective.x * this.mapScale;
            const objMapY = objective.y * this.mapScale;
            marker.setPosition(objMapX, objMapY);
            label.setPosition(objMapX, objMapY + 15);
        });

        // Update minimap objectives
        this.minimapObjectives.forEach(({ marker, objective }) => {
            const objMinimapX = objective.x * 0.05;
            const objMinimapY = objective.y * 0.05;
            marker.setPosition(objMinimapX, objMinimapY);
        });
    }

    zoomMap(delta) {
        this.mapScale = Phaser.Math.Clamp(this.mapScale + delta, 0.05, 0.3);
        
        // Update all markers with new scale
        this.updatePlayerPosition(this.playerPosition.x, this.playerPosition.y);
    }

    closeMap() {
        // Resume game scene
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.scene.resume();
        }

        // Close map scene
        this.scene.stop();
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════

    update(time, delta) {
        // Update player position from game scene
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.player) {
            this.updatePlayerPosition(gameScene.player.x, gameScene.player.y);
        }

        // Update objective completion status
        this._updateObjectiveStatus();
    }

    _updateObjectiveStatus() {
        // In a real game, this would check actual objective completion
        // For now, just animate active objectives
        this.objectiveMarkers.forEach(({ marker, objective }) => {
            if (!objective.completed) {
                // Add subtle animation
                marker.rotation += 0.01;
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════

    destroy() {
        // Clean up event listeners
        this.events.off('update', this.update, this);
        
        console.log('🗺️ GameMap Cleaned Up');
    }
}
