/**
 * WorldGenerator — Procedural environment generator for MindArena.
 * Creates vast, atmospheric arenas with environmental obstacles.
 */
export class WorldGenerator {

    static generate(scene, worldW, worldH, levelConfig) {
        this.worldW = worldW;
        this.worldH = worldH;
        this.levelConfig = levelConfig;

        scene.worldObstacles = [];
        scene.worldCars = [];

        // Special logic for Training Ground
        if (levelConfig?.isTraining) {
            this.generateTrainingGround(scene, worldW, worldH, levelConfig);
            return;
        }

        this.generateTerrain(scene, worldW, worldH);
        this.generateLakes(scene, worldW, worldH, 6);
        this.generateRoads(scene, worldW, worldH);
        this.generateRocks(scene, worldW, worldH, 80);
        this.generateTechScraps(scene, worldW, worldH, 30);
        this.generateDeadTrees(scene, worldW, worldH, 25);
        this.generateHouses(scene, worldW, worldH, 20);
        this.generateSpecialBuildings(scene, worldW, worldH);
        this.generateCars(scene, worldW, worldH, 8);
        this.generateCrates(scene, worldW, worldH, 15);
    }

    // ─── TERRAIN (ground markings) ──────────────────────

    static generateTerrain(scene, worldW, worldH) {
        const terrain = scene.add.graphics();
        terrain.setDepth(-3);

        // Zone boundaries (faint dashed lines)
        terrain.lineStyle(1, 0x334155, 0.15);
        // Horizontal divider
        terrain.lineBetween(100, worldH / 3, worldW - 100, worldH / 3);
        terrain.lineBetween(100, worldH * 2 / 3, worldW - 100, worldH * 2 / 3);
        // Vertical divider
        terrain.lineBetween(worldW / 3, 100, worldW / 3, worldH - 100);
        terrain.lineBetween(worldW * 2 / 3, 100, worldW * 2 / 3, worldH - 100);

        // Zone labels (very subtle)
        const zoneStyle = {
            fontSize: '10px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#1e293b',
            fontStyle: 'bold',
            letterSpacing: 3
        };

        scene.add.text(worldW / 6, 50, 'ZONE A', zoneStyle).setOrigin(0.5).setDepth(-2);
        scene.add.text(worldW / 2, 50, 'ZONE B', zoneStyle).setOrigin(0.5).setDepth(-2);
        scene.add.text(worldW * 5 / 6, 50, 'ZONE C', zoneStyle).setOrigin(0.5).setDepth(-2);
    }

    // ─── LAKES ──────────────────────────────────────────

    static generateLakes(scene, worldW, worldH, count) {
        for (let i = 0; i < count; i++) {
            const x = 300 + Math.random() * (worldW - 600);
            const y = 300 + Math.random() * (worldH - 600);

            // Don't spawn on absolute center (roads mostly)
            if (Math.abs(x - worldW / 2) < 250 || Math.abs(y - worldH / 2) < 250) continue;
            if (this.isNearObjective(x, y)) continue;

            const size = 60 + Math.random() * 80;
            const lake = scene.add.graphics();
            lake.fillStyle(0x0284c7, 0.7); // deep water blue

            const pts = [];
            const sides = 8 + Math.floor(Math.random() * 6);
            for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / sides) {
                const r = size * (0.6 + Math.random() * 0.4);
                pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            }
            lake.fillPoints(pts, true);

            // Lighter shore outline
            lake.lineStyle(4, 0x38bdf8, 0.5);
            lake.strokePoints(pts, true);

            lake.setPosition(x, y);
            lake.setDepth(-2.8); // Below roads, above bg

            // Lake hitbox (approximated as a rectangle for simplicity)
            scene.worldObstacles.push({ x: x, y: y, w: size * 1.5, h: size * 1.5 });
        }
    }

    // ─── ROADS ──────────────────────────────────────────

    static generateRoads(scene, worldW, worldH) {
        const road = scene.add.graphics();
        road.setDepth(-2.5);

        const roadW = 120;

        // Asphalt
        road.fillStyle(0x3f3f46, 1);
        road.fillRect(worldW / 2 - roadW / 2, 0, roadW, worldH); // Vertical
        road.fillRect(0, worldH / 2 - roadW / 2, worldW, roadW); // Horizontal

        // Dark road edges
        road.lineStyle(4, 0x27272a, 1);
        road.lineBetween(worldW / 2 - roadW / 2, 0, worldW / 2 - roadW / 2, worldH);
        road.lineBetween(worldW / 2 + roadW / 2, 0, worldW / 2 + roadW / 2, worldH);
        road.lineBetween(0, worldH / 2 - roadW / 2, worldW, worldH / 2 - roadW / 2);
        road.lineBetween(0, worldH / 2 + roadW / 2, worldW, worldH / 2 + roadW / 2);

        // Yellow dashed center lines
        road.lineStyle(4, 0xfacc15, 0.8);
        for (let y = 0; y < worldH; y += 60) {
            if (y > worldH / 2 - roadW && y < worldH / 2 + roadW) continue;
            road.lineBetween(worldW / 2, y, worldW / 2, y + 30);
        }
        for (let x = 0; x < worldW; x += 60) {
            if (x > worldW / 2 - roadW && x < worldW / 2 + roadW) continue;
            road.lineBetween(x, worldH / 2, x + 30, worldH / 2);
        }
    }

    // ─── ROCKS ──────────────────────────────────────────

    static generateRocks(scene, worldW, worldH, count) {
        for (let i = 0; i < count; i++) {
            const x = 50 + Math.random() * (worldW - 100);
            const y = 50 + Math.random() * (worldH - 100);
            if (this.isNearObjective(x, y)) continue;

            const size = 10 + Math.random() * 25;
            const rock = scene.add.graphics();
            rock.fillStyle(0x334155, 0.7 + Math.random() * 0.2);

            const pts = [];
            const sides = 6 + Math.floor(Math.random() * 4);
            for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / sides) {
                const r = size * (0.7 + Math.random() * 0.35);
                pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            }
            rock.fillPoints(pts, true);
            rock.lineStyle(1, 0x1e293b, 0.5);
            rock.strokePoints(pts, true);
            rock.setPosition(x, y);
            rock.setDepth(2);
        }
    }

    // ─── TECH SCRAPS ────────────────────────────────────

    static generateTechScraps(scene, worldW, worldH, count) {
        for (let i = 0; i < count; i++) {
            const x = 50 + Math.random() * (worldW - 100);
            const y = 50 + Math.random() * (worldH - 100);
            if (this.isNearObjective(x, y)) continue;

            const scrap = scene.add.graphics();
            scrap.lineStyle(2, 0x60a5fa, 0.25);
            scrap.strokeRect(-14, -14, 28, 28);
            scrap.fillStyle(0x1e293b, 0.4);
            scrap.fillRect(-14, -14, 28, 28);
            // Neon strip
            scrap.fillStyle(0x60a5fa, 0.6);
            scrap.fillRect(-11, 9, 22, 2);

            scrap.setPosition(x, y);
            scrap.angle = Math.random() * 360;
            scrap.setDepth(1);
        }
    }

    // ─── DEAD TREES ─────────────────────────────────────

    static generateDeadTrees(scene, worldW, worldH, count) {
        for (let i = 0; i < count; i++) {
            const x = 80 + Math.random() * (worldW - 160);
            const y = 80 + Math.random() * (worldH - 160);
            if (this.isNearObjective(x, y)) continue;

            const tree = scene.add.graphics();
            // Trunk
            tree.fillStyle(0x1c1917, 0.8);
            tree.fillRect(-4, 0, 8, 30);
            // Branches
            tree.lineStyle(2, 0x292524, 0.7);
            tree.lineBetween(0, 8, -15, -15);
            tree.lineBetween(0, 5, 18, -12);
            tree.lineBetween(0, 14, -10, -5);
            tree.lineBetween(0, 12, 12, -2);

            tree.setPosition(x, y);
            tree.setDepth(3);

            // Tree trunk hitbox
            scene.worldObstacles.push({ x: x, y: y, w: 16, h: 16 });
        }
    }

    // ─── CRATES ─────────────────────────────────────────

    static generateCrates(scene, worldW, worldH, count) {
        for (let i = 0; i < count; i++) {
            const x = 100 + Math.random() * (worldW - 200);
            const y = 100 + Math.random() * (worldH - 200);
            if (this.isNearObjective(x, y)) continue;

            const crate = scene.add.graphics();
            crate.fillStyle(0x1e293b, 0.9);
            crate.fillRect(-14, -14, 28, 28);
            crate.lineStyle(2, 0x60a5fa, 0.5);
            crate.strokeRect(-14, -14, 28, 28);
            // Cross
            crate.lineStyle(1, 0x60a5fa, 0.2);
            crate.lineBetween(-14, -14, 14, 14);
            crate.lineBetween(14, -14, -14, 14);
            // Glow strip
            crate.fillStyle(0x60a5fa, 0.7);
            crate.fillRect(-11, -1, 22, 2);

            crate.setPosition(x, y);
            crate.setDepth(2);
        }
    }

    // ─── HOUSES ─────────────────────────────────────────

    static generateHouses(scene, worldW, worldH, count) {
        for (let i = 0; i < count; i++) {
            const x = 200 + Math.random() * (worldW - 400);
            const y = 200 + Math.random() * (worldH - 400);

            if (this.isNearObjective(x, y)) continue;
            // Space away from central roads
            if (Math.abs(x - worldW / 2) < 180 || Math.abs(y - worldH / 2) < 180) continue;

            const house = scene.add.container(x, y);
            const g = scene.add.graphics();

            const w = 100 + Math.random() * 40;
            const h = 90 + Math.random() * 30;

            // 1. Drop Shadow (Soft)
            g.fillStyle(0x000000, 0.25);
            g.fillRoundedRect(-w / 2 + 8, -h / 2 + 8, w, h, 4);

            // 2. Main Wall Body
            const wallColors = [0xd6d3d1, 0xe7e5e4, 0xf5f5f4, 0xa8a29e];
            const wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
            g.fillStyle(wallColor, 1);
            g.fillRect(-w / 2, -h / 2, w, h);

            // Wall border / thickness
            g.lineStyle(3, 0x44403c, 1);
            g.strokeRect(-w / 2, -h / 2, w, h);

            // 3. Roof (Premium Shingle Look)
            const roofColors = [0x7c2d12, 0x1e3a8a, 0x14532d, 0x44403c];
            const rColor = roofColors[Math.floor(Math.random() * roofColors.length)];
            const rOverhang = 8;

            // Roof Base
            g.fillStyle(rColor, 1);
            g.fillRect(-w / 2 - rOverhang, -h / 2 - rOverhang, w + rOverhang * 2, h + rOverhang * 2);

            // Shingle texture (Lines)
            g.lineStyle(1, 0x000000, 0.15);
            for (let ry = -h / 2 - rOverhang; ry < h / 2 + rOverhang; ry += 6) {
                g.lineBetween(-w / 2 - rOverhang, ry, w / 2 + rOverhang, ry);
            }

            // Ridge line (center peak)
            g.lineStyle(2, 0x000000, 0.4);
            g.lineBetween(-w / 2 - rOverhang, 0, w / 2 + rOverhang, 0);

            // Roof highlight
            g.lineStyle(2, 0xffffff, 0.1);
            g.lineBetween(-w / 2 - rOverhang, -h / 2 - rOverhang + 2, w / 2 + rOverhang, -h / 2 - rOverhang + 2);

            // 4. Windows (with glass effect)
            const drawWindow = (wx, wy) => {
                // Frame
                g.fillStyle(0x44403c, 1);
                g.fillRect(wx - 10, wy - 10, 20, 20);
                // Glass
                g.fillStyle(0xbae6fd, 1);
                g.fillRect(wx - 8, wy - 8, 16, 16);
                // Shine
                g.fillStyle(0xffffff, 0.4);
                g.fillRect(wx - 6, wy - 6, 4, 4);
                // Cross frame
                g.lineStyle(1, 0x44403c, 0.8);
                g.lineBetween(wx, wy - 8, wx, wy + 8);
                g.lineBetween(wx - 8, wy, wx + 8, wy);
            };

            // Four windows
            drawWindow(-w / 3, -h / 4 - 2);
            drawWindow(w / 3, -h / 4 - 2);
            drawWindow(-w / 3, h / 4 + 2);
            drawWindow(w / 3, h / 4 + 2);

            // 5. Door (Detailed)
            const doorW = 24;
            const doorH = 12;
            const doorY = h / 2; // Put it at the edge

            // Door Frame / Step
            g.fillStyle(0x57534e, 1);
            g.fillRect(-doorW / 2 - 4, doorY - 4, doorW + 8, 10);

            // Door wood
            g.fillStyle(0x451a03, 1);
            g.fillRect(-doorW / 2, doorY - 4, doorW, 6);

            // Door knob (tiny gold dot)
            g.fillStyle(0xfacc15, 1);
            g.fillCircle(doorW / 2 - 6, doorY, 2);

            // 6. Chimney
            if (Math.random() > 0.5) {
                const cx = w / 3;
                const cy = -h / 2 - 12;
                g.fillStyle(0x78716c, 1);
                g.fillRect(cx, cy, 14, 14);
                g.lineStyle(1, 0x000000, 0.5);
                g.strokeRect(cx, cy, 14, 14);
                // Chimney hole
                g.fillStyle(0x1c1917, 1);
                g.fillRect(cx + 3, cy + 3, 8, 8);
            }

            house.add(g);
            house.setDepth(1);

            scene.worldObstacles.push({ x: x, y: y, w: w, h: h });
        }
    }

    static generateSpecialBuildings(scene, worldW, worldH) {
        // Create 2 Garage Depots at semi-random locations
        for (let i = 0; i < 2; i++) {
            const x = (i === 0) ? worldW * 0.25 : worldW * 0.75;
            const y = (i === 0) ? worldH * 0.25 : worldH * 0.75;

            this.createEnterableBuilding(scene, x, y, 350, 250, "GARAGE DEPOT", 0x451a03);
        }
    }

    static createEnterableBuilding(scene, x, y, w, h, labelText, floorColor = 0xd6d3d1) {
        const container = scene.add.container(x, y);
        const g = scene.add.graphics();

        // 1. Floor (Tiled)
        g.fillStyle(floorColor, 1);
        g.fillRect(-w / 2, -h / 2, w, h);

        // Tile lines
        g.lineStyle(1, 0x000000, 0.1);
        for (let tx = -w / 2; tx < w / 2; tx += 32) g.lineBetween(tx, -h / 2, tx, h / 2);
        for (let ty = -h / 2; ty < h / 2; ty += 32) g.lineBetween(-w / 2, ty, w / 2, ty);

        // 2. Thick Outer Walls
        g.lineStyle(6, 0x1c1917, 1);
        g.strokeRect(-w / 2, -h / 2, w, h);

        // 3. Label plate
        const label = scene.add.text(0, -h / 2 - 25, labelText, {
            fontSize: '18px',
            fontFamily: '"Outfit", sans-serif',
            color: '#facc15',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        container.add(label);

        // 4. Windows (on back wall)
        for (let wx = -w / 2 + 40; wx < w / 2; wx += 60) {
            g.fillStyle(0xbae6fd, 1);
            g.fillRect(wx - 10, -h / 2 - 3, 20, 6);
            g.lineStyle(1, 0x000000, 0.5);
            g.strokeRect(wx - 10, -h / 2 - 3, 20, 6);
        }

        // 5. Door Opening (bottom wall)
        g.fillStyle(floorColor, 1);
        g.fillRect(-25, h / 2 - 4, 50, 8);

        // 6. Roof (A separate graphic we can fade)
        const roof = scene.add.graphics();
        roof.fillStyle(0x44403c, 1);
        roof.fillRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20);
        // Roof texture
        roof.lineStyle(2, 0x000000, 0.2);
        for (let ry = -h / 2; ry < h / 2; ry += 8) roof.lineBetween(-w / 2, ry, w / 2, ry);

        container.add(g);
        container.add(roof);
        container.setDepth(1);

        // Add Wall Obstacles (Left, Right, Top, Bottom with gaps)
        const wallT = 10;
        scene.worldObstacles.push({ x: x - w / 2, y: y, w: wallT, h: h }); // Left
        scene.worldObstacles.push({ x: x + w / 2, y: y, w: wallT, h: h }); // Right
        scene.worldObstacles.push({ x: x, y: y - h / 2, w: w, h: wallT }); // Top
        // Bottom wall with door gap
        scene.worldObstacles.push({ x: x - w / 2 + (w / 2 - 25) / 2, y: y + h / 2, w: w / 2 - 25, h: wallT });
        scene.worldObstacles.push({ x: x + w / 2 - (w / 2 - 25) / 2, y: y + h / 2, w: w / 2 - 25, h: wallT });

        // Interior Loot
        for (let j = 0; j < 6; j++) {
            const ix = x + (Math.random() - 0.5) * (w - 60);
            const iy = y + (Math.random() - 0.5) * (h - 60);
            const isCrate = Math.random() > 0.5;

            const item = scene.add.circle(ix, iy, 8, isCrate ? 0x8a7040 : 0x5a5a5a);
            item.setDepth(2);
            scene.worldObstacles.push({ x: ix, y: iy, w: 16, h: 16 });
        }

        // Interaction logic for roof
        scene.events.on('update', () => {
            if (!scene.player) return;
            const dist = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, x, y);
            const inside = (Math.abs(scene.player.x - x) < w / 2 && Math.abs(scene.player.y - y) < h / 2);

            if (inside) {
                roof.setAlpha(Phaser.Math.Interpolation.Linear([roof.alpha, 0], 0.1));
            } else {
                roof.setAlpha(Phaser.Math.Interpolation.Linear([roof.alpha, 1], 0.1));
            }
        });
    }

    // ─── CARS ───────────────────────────────────────────

    static generateCars(scene, worldW, worldH, count) {
        for (let i = 0; i < count; i++) {
            // Cars spawn near roads
            const onVertRoad = Math.random() > 0.5;
            let x, y, ang;

            if (onVertRoad) {
                x = worldW / 2 + (Math.random() > 0.5 ? 25 : -25);
                y = 150 + Math.random() * (worldH - 300);
                ang = 90;
            } else {
                x = 150 + Math.random() * (worldW - 300);
                y = worldH / 2 + (Math.random() > 0.5 ? 25 : -25);
                ang = 0;
            }

            if (this.isNearObjective(x, y)) continue;

            const car = scene.add.container(x, y);
            const g = scene.add.graphics();

            // Shadow
            g.fillStyle(0x000000, 0.5);
            g.fillRoundedRect(-22, -12, 48, 28, 4);

            // Car colors
            const colors = [0xef4444, 0x3b82f6, 0x10b981, 0x64748b, 0xf59e0b, 0xa855f7];
            const cColor = colors[Math.floor(Math.random() * colors.length)];

            // Base Chassis
            g.fillStyle(cColor, 1);
            g.fillRoundedRect(-25, -14, 50, 28, 6);
            g.lineStyle(2, 0x0f172a, 0.8);
            g.strokeRoundedRect(-25, -14, 50, 28, 6);

            // Windshield / Windows
            g.fillStyle(0x0f172a, 0.9);
            g.fillRect(-10, -12, 24, 24); // main glass

            // Roof
            g.fillStyle(cColor, 1);
            g.fillRect(-5, -12, 14, 24);

            // Headlights
            g.fillStyle(0xfef08a, 1);
            g.fillRect(23, -12, 3, 6);
            g.fillRect(23, 6, 3, 6);

            // Taillights
            g.fillStyle(0xef4444, 1);
            g.fillRect(-26, -12, 3, 6);
            g.fillRect(-26, 6, 3, 6);

            car.add(g);
            car.angle = ang;
            if (Math.random() > 0.5) car.angle += 180;

            car.setDepth(2);

            // Add the prompt text
            const promptText = scene.add.text(0, 25, '[E] RIDE', {
                fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fbbf24', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 2, y: 1 }
            }).setOrigin(0.5).setAlpha(0).setDepth(20);

            // Revert rotation of text so it stays readable
            promptText.angle = -car.angle;
            car.add(promptText);

            let bw = ang === 0 || ang === 180 ? 50 : 28;
            let bh = ang === 0 || ang === 180 ? 28 : 50;

            const carObj = {
                container: car,
                promptText: promptText,
                x: x, y: y, w: bw, h: bh,
                angle: car.angle,
                active: true,
                isDriven: false,
                health: 120,
                maxHealth: 120,
                isExploded: false,
                color: cColor
            };

            // Hitbox for the car
            carObj.obstacle = { x: x, y: y, w: bw + 10, h: bh + 10, sourceEvent: carObj };
            scene.worldObstacles.push(carObj.obstacle);
            scene.worldCars.push(carObj);
        }
    }

    // ─── SPATIAL UTILITY ────────────────────────────────

    /**
     * Special high-contrast layout for the Training Ground
     */
    static generateTrainingGround(scene, worldW, worldH, config) {
        const tr = scene.add.graphics();
        tr.setDepth(-3);

        // 1. Cyber Grid Floor
        tr.fillStyle(0x0f172a, 1);
        tr.fillRect(0, 0, worldW, worldH);

        tr.lineStyle(1, 0x1e293b, 0.5);
        for (let x = 0; x < worldW; x += 100) tr.lineBetween(x, 0, x, worldH);
        for (let y = 0; y < worldH; y += 100) tr.lineBetween(0, y, worldW, y);

        // 2. Safety Dividers (Yellow/Black Hazard Stripes)
        const drawHazard = (rx, ry, rw, rh) => {
            tr.fillStyle(0xfacc15, 1);
            tr.fillRect(rx, ry, rw, rh);
            tr.lineStyle(4, 0x000000, 0.4);
            const step = 20;
            for (let i = 0; i < rw + rh; i += step) {
                tr.lineBetween(rx + i, ry, rx + i - rh, ry + rh);
            }
        };

        // Middle dividers
        drawHazard(worldW / 2 - 10, 0, 20, worldH); // Vertical
        drawHazard(0, worldH / 2 - 10, worldW, 20); // Horizontal

        // 3. Zone Labels
        const labelStyle = {
            fontSize: '48px',
            fontFamily: '"Outfit", sans-serif',
            color: '#ffffff',
            fontStyle: '900',
            stroke: '#000000',
            strokeThickness: 8,
            alpha: 0.1
        };

        scene.add.text(worldW * 0.25, worldH * 0.25, 'ARMORY', labelStyle).setOrigin(0.5).setDepth(-2.5);
        scene.add.text(worldW * 0.75, worldH * 0.25, 'FIRING RANGE', labelStyle).setOrigin(0.5).setDepth(-2.5);
        scene.add.text(worldW * 0.25, worldH * 0.75, 'CQB_KILLHOUSE', labelStyle).setOrigin(0.5).setDepth(-2.5);
        scene.add.text(worldW * 0.75, worldH * 0.75, 'VEHICLE_BAY', labelStyle).setOrigin(0.5).setDepth(-2.5);

        // --- CYBER VISUALS ---
        for (let i = 0; i < 20; i++) {
            const lx = Math.random() * worldW;
            const ly = Math.random() * worldH;
            const light = scene.add.pointlight(lx, ly, 0x10b981, 60, 0.08);
            scene.tweens.add({
                targets: light,
                intensity: 0.15,
                duration: 800 + Math.random() * 1200,
                yoyo: true,
                repeat: -1
            });
        }

        // 4. QUADRANT A: ARMORY (Fixed layout)
        // Walls around the armory
        this.createEnterableBuilding(scene, 400, 400, 300, 300, "ARMORY HUB", 0x1e293b);

        // 5. QUADRANT B: FIRING RANGE
        // Target lanes
        tr.lineStyle(2, 0x334155, 1);
        for (let lx = worldW / 2 + 100; lx < worldW - 100; lx += 200) {
            tr.lineBetween(lx, 100, lx, worldH / 2 - 100);
            // Shooting pads
            tr.fillStyle(0x334155, 0.5);
            tr.fillRect(lx - 40, worldH / 2 - 200, 80, 80);
        }

        // 6. QUADRANT C: KILL HOUSE
        this.createEnterableBuilding(scene, 2500, 2300, 600, 500, "CQB COURSE", 0x292524);
        // Interior walls for the kill house
        scene.worldObstacles.push({ x: 2500, y: 2300, w: 10, h: 400 }); // Center divider

        // 7. QUADRANT D: VEHICLE BAY
        // Asphalt track
        const track = scene.add.graphics();
        track.setDepth(-2.8);
        track.fillStyle(0x111827, 1);
        track.fillCircle(worldW * 0.75, worldH * 0.75, 400);
        track.fillStyle(0x0f172a, 1);
        track.fillCircle(worldW * 0.75, worldH * 0.75, 250);
        // Cones (represented as tiny orange triangles)
        for (let a = 0; a < Math.PI * 2; a += 0.5) {
            const cx = worldW * 0.75 + Math.cos(a) * 320;
            const cy = worldH * 0.75 + Math.sin(a) * 320;
            const cone = scene.add.triangle(cx, cy, 0, -8, -6, 8, 6, 8, 0xf97316);
            cone.setDepth(2);
            scene.worldObstacles.push({ x: cx, y: cy, w: 12, h: 12 });
        }

        // Place a test car
        this.generateCars(scene, worldW, worldH, 2);

        // Final Extraction Area Visual
        const ext = config.extraction;
        const extG = scene.add.graphics();
        extG.lineStyle(4, 0x10b981, 0.8);
        extG.strokeCircle(ext.x, ext.y, 60);
        extG.fillStyle(0x10b981, 0.2);
        extG.fillCircle(ext.x, ext.y, 60);
        extG.setDepth(-2);
        scene.add.text(ext.x, ext.y - 80, 'EXTRACTION_READY', {
            fontSize: '12px', color: '#10b981', fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    static isNearObjective(x, y) {
        if (!this.levelConfig?.locations) return false;
        const locs = this.levelConfig.locations;
        const pts = Object.values(locs).filter(p => p && typeof p.x === 'number');
        return pts.some(p => Math.hypot(x - p.x, y - p.y) < 120);
    }
}
