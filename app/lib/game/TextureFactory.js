/**
 * TextureFactory — Procedural texture generator for MindArena
 * Generates ALL game textures at boot time using Phaser Graphics → RenderTexture
 * Zero external image files needed.
 */
export class TextureFactory {

    static generateAllTextures(scene) {
        this.createGlow(scene, 'particle_glow', 32, 0xffffff);
        this.createGlow(scene, 'particle_cyan', 24, 0x00f2ff);
        this.createGlow(scene, 'particle_red', 24, 0xff4444);
        this.createGlow(scene, 'particle_gold', 24, 0xf59e0b);
        this.createGlow(scene, 'particle_green', 24, 0x22c55e);
        this.createSpark(scene, 'particle_spark', 16, 0xffffff);
        this.createOrb(scene, 'orb_cyan', 28, 0x00f2ff);
        this.createOrb(scene, 'orb_gold', 28, 0xf59e0b);
        this.createOrb(scene, 'orb_health', 22, 0xef4444);
        this.createPanel(scene, 'panel_dark', 64, 64, 0x0f172a, 0.92, 0x334155);
        this.createPanel(scene, 'panel_red', 64, 64, 0x450a0a, 0.92, 0xef4444);
        this.createButton(scene, 'btn_normal', 200, 52, 0x1e293b, 0x475569);
        this.createButton(scene, 'btn_hover', 200, 52, 0x334155, 0x60a5fa);
        this.createButton(scene, 'btn_active', 200, 52, 0x60a5fa, 0xffffff);
        this.createStation(scene, 'station_food', 64, 0xf59e0b);
        this.createStation(scene, 'station_rest', 64, 0x8b5cf6);
        this.createStation(scene, 'station_weapon', 64, 0xef4444);
        this.createPortal(scene, 'portal_exit', 80);
        this.createRock(scene, 'rock_sm', 20);
        this.createRock(scene, 'rock_lg', 40);
        this.createCrate(scene, 'crate_tech', 32);
        this.createTree(scene, 'tree_dead', 32, 72);
        this.createWall(scene, 'wall_h', 64, 16);
        this.createCharSprite(scene, 'char_player', 0xfee2e2, 0xef4444, 0x991b1b);
        this.createCharSprite(scene, 'char_agent', 0xfef3c7, 0x713f12, 0x475569);
        this.createCharSprite(scene, 'char_stalker', 0x64748b, 0x1e293b, 0x0f172a);
        this.createCharSprite(scene, 'char_brute', 0x581c87, 0x1e1b4b, 0x3b0764);
        this.createCharSprite(scene, 'char_drone', 0x22c55e, 0x166534, 0x14532d);
        this.createMinimap(scene, 'minimap_bg', 180, 180);
        this.createVignette(scene, 'vignette_red', 400, 300, 0xff0000);
        this.createSlash(scene, 'slash_arc', 60);
        this.createLoadingBar(scene, 'loading_bar_bg', 400, 20, 0x1e293b);
        this.createLoadingBar(scene, 'loading_bar_fill', 400, 20, 0x60a5fa);
    }

    // ── Primitives ──────────────────────────────────────

    static createGlow(scene, key, size, color) {
        const rt = scene.add.renderTexture(0, 0, size, size).setVisible(false);
        const g = scene.add.graphics();
        const cx = size / 2, cy = size / 2;
        for (let i = 5; i > 0; i--) {
            const alpha = (6 - i) / 12;
            const r = (i / 5) * (size / 2);
            g.fillStyle(color, alpha);
            g.fillCircle(cx, cy, r);
        }
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createSpark(scene, key, size, color) {
        const rt = scene.add.renderTexture(0, 0, size, size).setVisible(false);
        const g = scene.add.graphics();
        const cx = size / 2, cy = size / 2;
        g.fillStyle(color, 1);
        // 4-point star
        const pts = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? size / 2 : size / 6;
            pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        g.fillPoints(pts, true);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createOrb(scene, key, size, color) {
        const rt = scene.add.renderTexture(0, 0, size, size).setVisible(false);
        const g = scene.add.graphics();
        const cx = size / 2, cy = size / 2;
        // Outer glow
        g.fillStyle(color, 0.15);
        g.fillCircle(cx, cy, size / 2);
        // Core
        g.fillStyle(color, 0.9);
        g.fillCircle(cx, cy, size / 4);
        // Highlight
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(cx - 2, cy - 3, size / 8);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    // ── UI Pieces ───────────────────────────────────────

    static createPanel(scene, key, w, h, fill, alpha, border) {
        const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
        const g = scene.add.graphics();
        g.fillStyle(fill, alpha);
        g.fillRoundedRect(0, 0, w, h, 12);
        g.lineStyle(1, border, 0.5);
        g.strokeRoundedRect(0, 0, w, h, 12);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createButton(scene, key, w, h, fill, border) {
        const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
        const g = scene.add.graphics();
        g.fillStyle(fill, 0.95);
        g.fillRoundedRect(0, 0, w, h, 10);
        g.lineStyle(2, border, 0.7);
        g.strokeRoundedRect(0, 0, w, h, 10);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createLoadingBar(scene, key, w, h, color) {
        const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
        const g = scene.add.graphics();
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, w, h, h / 2);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    // ── Environment ─────────────────────────────────────

    static createStation(scene, key, size, color) {
        const rt = scene.add.renderTexture(0, 0, size, size).setVisible(false);
        const g = scene.add.graphics();
        // Glow ring
        g.fillStyle(color, 0.15);
        g.fillCircle(size / 2, size / 2, size / 2);
        // Building
        g.fillStyle(color, 0.9);
        g.fillRoundedRect(size * 0.2, size * 0.25, size * 0.6, size * 0.5, 6);
        g.lineStyle(2, 0xffffff, 0.3);
        g.strokeRoundedRect(size * 0.2, size * 0.25, size * 0.6, size * 0.5, 6);
        // Door
        g.fillStyle(0x000000, 0.5);
        g.fillRect(size * 0.4, size * 0.5, size * 0.2, size * 0.25);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createPortal(scene, key, size) {
        const rt = scene.add.renderTexture(0, 0, size, size).setVisible(false);
        const g = scene.add.graphics();
        const cx = size / 2, cy = size / 2;
        for (let i = 4; i > 0; i--) {
            g.lineStyle(2, 0x00f2ff, i / 5);
            g.strokeCircle(cx, cy, (i / 4) * (size / 2));
        }
        g.fillStyle(0x00f2ff, 0.12);
        g.fillCircle(cx, cy, size / 2);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createRock(scene, key, size) {
        const rt = scene.add.renderTexture(0, 0, size, size).setVisible(false);
        const g = scene.add.graphics();
        g.fillStyle(0x334155, 0.9);
        const pts = [];
        for (let a = 0; a < Math.PI * 2; a += 0.7) {
            const r = (size / 2) * (0.7 + Math.random() * 0.3);
            pts.push({ x: size / 2 + Math.cos(a) * r, y: size / 2 + Math.sin(a) * r });
        }
        g.fillPoints(pts, true);
        g.lineStyle(1, 0x1e293b, 0.6);
        g.strokePoints(pts, true);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createCrate(scene, key, size) {
        const rt = scene.add.renderTexture(0, 0, size, size).setVisible(false);
        const g = scene.add.graphics();
        g.fillStyle(0x1e293b, 0.95);
        g.fillRect(2, 2, size - 4, size - 4);
        g.lineStyle(2, 0x60a5fa, 0.6);
        g.strokeRect(2, 2, size - 4, size - 4);
        // Cross braces
        g.lineStyle(1, 0x60a5fa, 0.3);
        g.lineBetween(2, 2, size - 2, size - 2);
        g.lineBetween(size - 2, 2, 2, size - 2);
        // Neon strip
        g.fillStyle(0x60a5fa, 0.8);
        g.fillRect(4, size / 2 - 1, size - 8, 2);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createTree(scene, key, w, h) {
        const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
        const g = scene.add.graphics();
        // Trunk
        g.fillStyle(0x1c1917, 0.9);
        g.fillRect(w * 0.35, h * 0.4, w * 0.3, h * 0.6);
        // Bare branches
        g.lineStyle(3, 0x292524, 0.8);
        g.lineBetween(w / 2, h * 0.4, w * 0.1, h * 0.1);
        g.lineBetween(w / 2, h * 0.35, w * 0.85, h * 0.05);
        g.lineBetween(w / 2, h * 0.5, w * 0.2, h * 0.25);
        g.lineBetween(w / 2, h * 0.45, w * 0.9, h * 0.2);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createWall(scene, key, w, h) {
        const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
        const g = scene.add.graphics();
        g.fillStyle(0x1e293b, 1);
        g.fillRect(0, 0, w, h);
        g.lineStyle(1, 0x475569, 0.6);
        g.strokeRect(0, 0, w, h);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    // ── Characters ──────────────────────────────────────

    static createCharSprite(scene, key, skinColor, hairColor, bodyColor) {
        const w = 32, h = 48;
        const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
        const g = scene.add.graphics();
        // Shadow
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(w / 2, h - 4, 22, 8);
        // Body
        g.fillStyle(bodyColor, 1);
        g.fillRoundedRect(w / 2 - 8, h / 2 + 2, 16, 14, 3);
        // Head
        g.fillStyle(skinColor, 1);
        g.fillCircle(w / 2, h / 2 - 6, 10);
        g.lineStyle(1, 0x000000, 0.2);
        g.strokeCircle(w / 2, h / 2 - 6, 10);
        // Hair (arc using slice + fillPath, Phaser 3 API)
        g.fillStyle(hairColor, 1);
        g.slice(w / 2, h / 2 - 8, 11, Math.PI, Math.PI * 2, true);
        g.fillPath();
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    // ── HUD / Overlay ───────────────────────────────────

    static createMinimap(scene, key, w, h) {
        const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
        const g = scene.add.graphics();
        g.fillStyle(0x020617, 0.85);
        g.fillRoundedRect(0, 0, w, h, 12);
        g.lineStyle(2, 0x334155, 0.6);
        g.strokeRoundedRect(0, 0, w, h, 12);
        // Grid
        g.lineStyle(1, 0x1e293b, 0.3);
        for (let x = 20; x < w; x += 20) g.lineBetween(x, 4, x, h - 4);
        for (let y = 20; y < h; y += 20) g.lineBetween(4, y, w - 4, y);
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createVignette(scene, key, w, h, color) {
        const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
        const g = scene.add.graphics();
        // Edges only
        const thickness = 80;
        for (let i = 0; i < thickness; i++) {
            const a = (1 - i / thickness) * 0.4;
            g.fillStyle(color, a);
            g.fillRect(i, 0, 1, h); // left
            g.fillRect(w - i, 0, 1, h); // right
            g.fillRect(0, i, w, 1); // top
            g.fillRect(0, h - i, w, 1); // bottom
        }
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }

    static createSlash(scene, key, size) {
        const rt = scene.add.renderTexture(0, 0, size, size).setVisible(false);
        const g = scene.add.graphics();
        g.lineStyle(4, 0xffffff, 0.9);
        g.beginPath();
        const cx = size / 2, cy = size / 2;
        for (let a = -Math.PI / 4; a <= Math.PI / 4; a += 0.05) {
            const r = size / 2 - 4;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            if (a === -Math.PI / 4) g.moveTo(x, y);
            else g.lineTo(x, y);
        }
        g.strokePath();
        rt.draw(g); rt.saveTexture(key);
        g.destroy(); rt.destroy();
    }
}
