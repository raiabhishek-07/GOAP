// ============================================================
// ObjectFactory.js — Modular Game Object System
// Creates realistic, layered game objects with depth, shadows, and polish
// ============================================================

export class ObjectFactory {
    constructor(scene) {
        this.scene = scene;
        this.objectPool = new Map(); // Object pooling for performance
        this.shadowCache = new Map(); // Cache shadow textures
        this.windOffset = 0; // For wind animation
    }

    // ═══════════════════════════════════════════════════════
    // NATURAL OBJECTS
    // ═══════════════════════════════════════════════════════

    /**
     * Create a realistic tree cluster with multiple trees
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {object} config - Tree configuration
     */
    createTreeCluster(x, y, config = {}) {
        const cluster = this.scene.add.container(x, y);
        const treeCount = config.count || 3 + Math.floor(Math.random() * 4);
        const spread = config.spread || 40;
        
        // Generate tree positions with natural clustering
        const positions = this._generateClusterPositions(treeCount, spread);
        
        positions.forEach((pos, i) => {
            const tree = this._createTree(pos.x, pos.y, {
                size: config.size || (0.8 + Math.random() * 0.4),
                type: config.type || 'oak',
                depth: i // For layering
            });
            cluster.add(tree);
        });

        // Add shadow for entire cluster
        this._addClusterShadow(cluster, spread * 2);
        
        // Set depth based on Y position for proper sorting
        cluster.setDepth(this._calculateDepth(y));
        
        return cluster;
    }

    _createTree(x, y, config) {
        const tree = this.scene.add.container(x, y);
        const scale = config.size || 1;
        
        // Tree trunk
        const trunk = this.scene.add.rectangle(0, 0, 8 * scale, 20 * scale, 0x4a3a18);
        trunk.setOrigin(0.5, 1); // Origin at bottom
        
        // Tree canopy (multiple layers for depth)
        const canopyLayers = [];
        for (let i = 0; i < 3; i++) {
            const layer = this.scene.add.circle(
                0, -15 * scale - (i * 8 * scale), 
                (12 - i * 2) * scale, 
                this._getTreeColor(config.type, i)
            );
            layer.setAlpha(0.9 - i * 0.1);
            canopyLayers.push(layer);
            tree.add(layer);
        }
        
        tree.add(trunk);
        
        // Add wind animation
        this._addWindAnimation(tree, canopyLayers);
        
        // Add individual shadow
        this._addObjectShadow(tree, 15 * scale);
        
        return tree;
    }

    /**
     * Create dense bush with multiple sprites
     */
    createBush(x, y, config = {}) {
        const bush = this.scene.add.container(x, y);
        const density = config.density || 3;
        
        for (let i = 0; i < density; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 10;
            
            const sprite = this.scene.add.circle(offsetX, offsetY, 8 + Math.random() * 4, 0x2a5a1a);
            sprite.setAlpha(0.8 + Math.random() * 0.2);
            bush.add(sprite);
        }
        
        this._addObjectShadow(bush, 12);
        bush.setDepth(this._calculateDepth(y));
        
        return bush;
    }

    /**
     * Create rock formation with multiple rocks
     */
    createRockFormation(x, y, config = {}) {
        const formation = this.scene.add.container(x, y);
        const rockCount = config.count || 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < rockCount; i++) {
            const rock = this._createRock(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20,
                config.size || (0.5 + Math.random() * 0.5)
            );
            formation.add(rock);
        }
        
        formation.setDepth(this._calculateDepth(y));
        return formation;
    }

    _createRock(x, y, scale) {
        const rock = this.scene.add.container(x, y);
        
        // Main rock body with irregular shape
        const body = this.scene.add.polygon(
            0, 0,
            this._generateRockPoints(scale * 15),
            0x666666
        );
        
        // Rock highlight
        const highlight = this.scene.add.polygon(
            -2 * scale, -2 * scale,
            this._generateRockPoints(scale * 12),
            0x888888
        );
        highlight.setAlpha(0.6);
        
        rock.add(body);
        rock.add(highlight);
        
        this._addObjectShadow(rock, 10 * scale);
        return rock;
    }

    /**
     * Create tall grass patch
     */
    createTallGrass(x, y, config = {}) {
        const grass = this.scene.add.container(x, y);
        const bladeCount = config.density || 8;
        
        for (let i = 0; i < bladeCount; i++) {
            const blade = this.scene.add.rectangle(
                (Math.random() - 0.5) * 20,
                Math.random() * 5,
                2,
                8 + Math.random() * 6,
                0x3a5f3a
            );
            blade.setOrigin(0.5, 1);
            blade.setRotation((Math.random() - 0.5) * 0.3);
            grass.add(blade);
        }
        
        // Wind animation for grass
        this._addWindAnimation(grass, grass.list);
        grass.setDepth(this._calculateDepth(y) + 1); // Slightly above ground
        
        return grass;
    }

    /**
     * Create water edge with foam effect
     */
    createWaterEdge(x, y, config = {}) {
        const waterEdge = this.scene.add.container(x, y);
        const length = config.length || 40;
        
        // Water base
        const water = this.scene.add.rectangle(0, 0, length, 20, 0x2a5a8a);
        water.setAlpha(0.7);
        waterEdge.add(water);
        
        // Foam particles
        for (let i = 0; i < 15; i++) {
            const foam = this.scene.add.circle(
                (Math.random() - 0.5) * length,
                (Math.random() - 0.5) * 15,
                1 + Math.random() * 2,
                0xffffff
            );
            foam.setAlpha(0.3 + Math.random() * 0.4);
            waterEdge.add(foam);
            
            // Animate foam
            this.scene.tweens.add({
                targets: foam,
                alpha: 0.1,
                duration: 2000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1
            });
        }
        
        waterEdge.setDepth(this._calculateDepth(y));
        return waterEdge;
    }

    // ═══════════════════════════════════════════════════════
    // URBAN OBJECTS
    // ═══════════════════════════════════════════════════════

    /**
     * Create street lamp with lighting effect
     */
    createStreetLamp(x, y, config = {}) {
        const lamp = this.scene.add.container(x, y);
        
        // Lamp post
        const post = this.scene.add.rectangle(0, 0, 4, 30, 0x333333);
        post.setOrigin(0.5, 1);
        
        // Lamp head
        const head = this.scene.add.rectangle(0, -30, 12, 8, 0x444444);
        
        // Light cone (if night)
        const lightCone = this.scene.add.polygon(
            0, -26,
            0, 0,
            -20, 40,
            20, 40
        );
        lightCone.setFillStyle(0xffff99, 0.2);
        lightCone.setVisible(false); // Only show at night
        
        lamp.add(post);
        lamp.add(head);
        lamp.add(lightCone);
        
        // Store light cone for day/night system
        lamp.lightCone = lightCone;
        
        this._addObjectShadow(lamp, 8);
        lamp.setDepth(this._calculateDepth(y));
        
        return lamp;
    }

    /**
     * Create fence segment
     */
    createFence(x, y, config = {}) {
        const fence = this.scene.add.container(x, y);
        const length = config.length || 40;
        const type = config.type || 'wood';
        
        // Fence posts
        const post1 = this.scene.add.rectangle(-length/2, 0, 4, 20, this._getFenceColor(type));
        const post2 = this.scene.add.rectangle(length/2, 0, 4, 20, this._getFenceColor(type));
        post1.setOrigin(0.5, 1);
        post2.setOrigin(0.5, 1);
        
        // Fence boards/chain
        if (type === 'wood') {
            for (let i = -length/2 + 8; i < length/2; i += 8) {
                const board = this.scene.add.rectangle(i, -8, 6, 12, 0x8b4513);
                fence.add(board);
            }
        } else if (type === 'chain') {
            const chain = this.scene.add.rectangle(0, -10, length, 2, 0x666666);
            fence.add(chain);
        }
        
        fence.add(post1);
        fence.add(post2);
        
        this._addObjectShadow(fence, 10);
        fence.setDepth(this._calculateDepth(y));
        
        return fence;
    }

    /**
     * Create road sign
     */
    createRoadSign(x, y, config = {}) {
        const sign = this.scene.add.container(x, y);
        
        // Sign post
        const post = this.scene.add.rectangle(0, 0, 3, 25, 0x444444);
        post.setOrigin(0.5, 1);
        
        // Sign board
        const board = this.scene.add.rectangle(0, -20, 30, 20, 0xffffff);
        board.setStrokeStyle(2, 0x000000);
        
        // Sign text (simplified - in real game would use texture)
        const text = this.scene.add.text(0, -20, config.text || 'STOP', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);
        
        sign.add(post);
        sign.add(board);
        sign.add(text);
        
        this._addObjectShadow(sign, 8);
        sign.setDepth(this._calculateDepth(y));
        
        return sign;
    }

    // ═══════════════════════════════════════════════════════
    // MILITARY OBJECTS
    // ═══════════════════════════════════════════════════════

    /**
     * Create sandbag barrier
     */
    createSandbagBarrier(x, y, config = {}) {
        const barrier = this.scene.add.container(x, y);
        const length = config.length || 60;
        
        // Create individual sandbags
        for (let i = 0; i < length / 15; i++) {
            const sandbag = this.scene.add.rectangle(
                -length/2 + i * 15 + 7,
                0,
                14, 8,
                0x8b7355
            );
            sandbag.setStrokeStyle(1, 0x6b5345);
            barrier.add(sandbag);
        }
        
        this._addObjectShadow(barrier, 6);
        barrier.setDepth(this._calculateDepth(y));
        
        return barrier;
    }

    /**
     * Create supply crate
     */
    createSupplyCrate(x, y, config = {}) {
        const crate = this.scene.add.container(x, y);
        const size = config.size || 1;
        
        // Crate body
        const body = this.scene.add.rectangle(0, 0, 20 * size, 20 * size, 0x8b4513);
        body.setStrokeStyle(2, 0x654321);
        
        // Crate details (wood grain)
        for (let i = -8 * size; i <= 8 * size; i += 4 * size) {
            const grain = this.scene.add.rectangle(i, 0, 1, 18 * size, 0x654321);
            grain.setAlpha(0.5);
            crate.add(grain);
        }
        
        // Military marking
        const marking = this.scene.add.text(0, 0, 'SUP', {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        crate.add(marking);
        
        crate.add(body);
        
        this._addObjectShadow(crate, 12 * size);
        crate.setDepth(this._calculateDepth(y));
        
        return crate;
    }

    // ═══════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════

    _generateClusterPositions(count, spread) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spread;
            positions.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance
            });
        }
        return positions;
    }

    _generateRockPoints(size) {
        const points = [];
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radius = size * (0.8 + Math.random() * 0.4);
            points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        return points;
    }

    _getTreeColor(type, layer) {
        const colors = {
            oak: ['#2a5a1a', '#1a4a0a', '#0a3a00'],
            pine: ['#1a4a1a', '#0a3a0a', '#052505'],
            birch: ['#4a6a3a', '#3a5a2a', '#2a4a1a']
        };
        return parseInt(colors[type]?.[layer] || colors.oak[layer], 16);
    }

    _getFenceColor(type) {
        const colors = {
            wood: 0x8b4513,
            chain: 0x666666,
            metal: 0x444444
        };
        return colors[type] || colors.wood;
    }

    _calculateDepth(y) {
        // Depth based on Y position (higher Y = deeper in screen)
        return Math.floor(y * 0.1) * 1000 + 500;
    }

    _addObjectShadow(object, radius) {
        const shadow = this.scene.add.circle(0, radius * 0.3, radius, 0x000000, 0.3);
        shadow.setDepth(this._calculateDepth(object.y) - 1);
        object.shadow = shadow;
        
        // Add shadow to scene (not to container)
        this.scene.add.existing(shadow);
    }

    _addClusterShadow(cluster, radius) {
        const shadow = this.scene.add.ellipse(0, radius * 0.2, radius, radius * 0.5, 0x000000, 0.2);
        shadow.setDepth(this._calculateDepth(cluster.y) - 1);
        this.scene.add.existing(shadow);
    }

    _addWindAnimation(container, targets) {
        // Subtle wind animation
        this.scene.tweens.add({
            targets: container,
            rotation: 0.02,
            duration: 2000 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        // Individual target animation
        targets.forEach(target => {
            this.scene.tweens.add({
                targets: target,
                scaleX: 1.02,
                duration: 1500 + Math.random() * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        });
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE METHODS
    // ═══════════════════════════════════════════════════════

    updateWind(delta) {
        this.windOffset += delta * 0.001;
    }

    updateLighting(isNight) {
        // Update all street lamps
        this.scene.children.list.forEach(child => {
            if (child.lightCone) {
                child.lightCone.setVisible(isNight);
            }
        });
    }

    updateShadows(lightAngle) {
        // Update shadow positions based on light angle
        this.scene.children.list.forEach(child => {
            if (child.shadow) {
                const shadowOffset = Math.sin(lightAngle) * 5;
                child.shadow.x = shadowOffset;
            }
        });
    }
}
