/**
 * WorldGenerator — Procedural environment generator for MindArena.
 * Creates vast, atmospheric arenas with environmental obstacles.
 */
export class WorldGenerator {

    static generate(scene, worldW, worldH, levelConfig) {
        this.worldW = worldW;
        this.worldH = worldH;
        this.levelConfig = levelConfig;

        this.generateTerrain(scene, worldW, worldH);
        this.generateRocks(scene, worldW, worldH, 50);
        this.generateTechScraps(scene, worldW, worldH, 20);
        this.generateDeadTrees(scene, worldW, worldH, 12);
        this.generateCrates(scene, worldW, worldH, 8);
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

    // ─── SPATIAL UTILITY ────────────────────────────────

    static isNearObjective(x, y) {
        if (!this.levelConfig?.locations) return false;
        const locs = this.levelConfig.locations;
        const pts = Object.values(locs).filter(p => p && typeof p.x === 'number');
        return pts.some(p => Math.hypot(x - p.x, y - p.y) < 120);
    }
}
