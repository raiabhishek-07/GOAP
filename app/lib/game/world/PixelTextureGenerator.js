// ============================================================
// PixelTextureGenerator.js — Generates pixel art textures
// Creates all game sprites/tiles using canvas pixel operations
// Zero external assets — everything is code-generated
// ============================================================

export class PixelTextureGenerator {
    constructor(scene) {
        this.scene = scene;
        this.generated = false;
    }

    /** Generate ALL game textures. Call once in boot/preload. */
    generateAll() {
        if (this.generated) return;

        // ── TERRAIN TILES (32×32) ──
        this._genGrassTiles();
        this._genDirtTiles();
        this._genRoadTiles();
        this._genWaterTiles();
        this._genSandTile();
        this._genConcreteTile();
        this._genForestFloor();

        // ── OBSTACLES ──
        this._genTreeDeciduous();
        this._genTreePine();
        this._genRockSmall();
        this._genRockLarge();
        this._genBush();
        this._genCrate();
        this._genBarrel();
        this._genSandbag();

        // ── BUILDINGS ──
        this._genWallTile();
        this._genRoofTile();
        this._genWindowTile();
        this._genWindowTileLit();
        this._genDoorTile();
        this._genFloorTile();
        this._genFurnitureTextures();
        this._genFenceTextures();

        // ── CHARACTERS ──
        this._genPlayerSprite();
        this._genPlayerModularParts(); // Legs, body, arms for modular animation
        this._genEnemySprite();

        // ── WEAPONS & COMBAT ──
        this._genBullet();
        this._genMuzzleFlash();
        this._genLootPistol();
        this._genLootSMG();
        this._genLootShotgun();
        this._genLootRifle();
        this._genLootSniper();
        this._genLootAmmo();

        // ── VEHICLES ──
        this._genVehicleCar();
        this._genVehicleTruck();
        this._genVehicleBike();

        // ── ATMOSPHERE & CLUTTER ──
        this._genStreetLamp();
        this._genLightGlow();
        this._genGroundClutter();
        this._genFogTexture();
        this._genTempleTextures();
        this._genInteractiveProps();
        this._genTrapTextures();
        this._genEnvDetailTextures();

        // ── UI & PROMPTS ──
        this._genKeyIcons();

        // ── MISC ──
        this._genShadowCircle();
        this._genShadowRect();

        this.generated = true;
    }

    // ═══════════════════════════════════════════════════════
    // NEW: ATMOSPHERE & UI
    // ═══════════════════════════════════════════════════════

    _genFogTexture() {
        const size = 512;
        const { canvas, ctx } = this._createTex('fog', size, size);
        
        // Very soft, dispersed mist clouds
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 100 + Math.random() * 150;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        this._finish(canvas);
    }

    // ═══════════════════════════════════════════════════════
    // NEW: ATMOSPHERE & UI
    // ═══════════════════════════════════════════════════════

    _genStreetLamp() {
        const { canvas, ctx } = this._createTex('street_lamp', 32, 32);
        // Base/Pole (center)
        this._rect(ctx, 15, 15, 2, 2, '#333');
        // Top head (offset)
        const M = '#444'; const L = '#ccddee';
        this._rect(ctx, 12, 4, 8, 8, M);
        this._rect(ctx, 13, 5, 6, 6, '#222');
        this._rect(ctx, 14, 6, 4, 4, L, 0.8);
        this._finish(canvas);
    }

    _genLightGlow() {
        // Soft yellow glow
        const { canvas, ctx } = this._createTex('light_glow', 128, 128);
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 230, 150, 0.4)');
        grad.addColorStop(0.4, 'rgba(255, 210, 100, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        this._finish(canvas);
    }

    _genGroundClutter() {
        // Cracks
        const { canvas: cc, ctx: cCtx } = this._createTex('clutter_crack', 32, 32);
        cCtx.strokeStyle = 'rgba(0,0,0,0.2)';
        cCtx.beginPath();
        cCtx.moveTo(4, 4); cCtx.lineTo(12, 10); cCtx.lineTo(18, 8); cCtx.lineTo(26, 14);
        cCtx.stroke();
        this._finish(cc);

        // Grass tuft
        const { canvas: gc, ctx: gCtx } = this._createTex('clutter_grass', 16, 16);
        const col = '#3a8a2a';
        this._px(gCtx, 8, 4, col);
        this._px(gCtx, 7, 6, col); this._px(gCtx, 9, 6, col);
        this._px(gCtx, 6, 8, col); this._px(gCtx, 10, 8, col);
        this._finish(gc);
    }

    _genKeyIcons() {
        const keys = ['E', 'V', 'R', '1', '2', '3'];
        keys.forEach(k => {
            const { canvas, ctx } = this._createTex(`key_${k}`, 24, 24);
            // Key cap
            this._rect(ctx, 2, 2, 20, 18, '#1e293b');
            this._rect(ctx, 2, 2, 20, 2, '#334155'); // Highlight
            this._rect(ctx, 2, 20, 20, 2, '#0f172a'); // Bottom shadow
            
            // Text (simple pixel representation of the letter)
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(k, 8, 16);
            
            this._finish(canvas);
        });
    }

    _genTempleTextures() {
        // Temple Wall (Old Stone)
        const { canvas: wc, ctx: wCtx } = this._createTex('wall_temple', 32, 32);
        this._rect(wCtx, 0, 0, 32, 32, '#475569'); // Base stone
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 32;
            const y = Math.random() * 32;
            this._px(wCtx, x, y, '#334155', 0.6); // Cracks/Dirt
        }
        this._rect(wCtx, 0, 0, 32, 2, '#64748b', 0.4); // Top highlight
        this._finish(wc);

        // Temple Pillar (Marble-ish)
        const { canvas: pc, ctx: pCtx } = this._createTex('pillar', 24, 48);
        this._rect(pCtx, 2, 0, 20, 48, '#94a3b8'); // Main shaft
        this._rect(pCtx, 0, 40, 24, 8, '#64748b'); // Base
        this._rect(pCtx, 0, 0, 24, 8, '#64748b');  // Capital
        // Vertical grooves
        for (let i = 6; i < 20; i += 4) {
            this._rect(pCtx, i, 8, 2, 32, '#475569', 0.3);
        }
        this._finish(pc);
    }

    _genInteractiveProps() {
        // Treasure Chest
        const { canvas: tc, ctx: tCtx } = this._createTex('chest', 32, 32);
        this._rect(tCtx, 4, 10, 24, 16, '#713f12'); // Body
        this._rect(tCtx, 4, 10, 24, 4, '#422006'); // Lid edge
        this._rect(tCtx, 14, 12, 4, 4, '#fbbf24'); // Lock
        this._rect(tCtx, 4, 10, 2, 16, '#92400e', 0.4); // Left shadow
        this._finish(tc);

        // Explosive Barrel (Red)
        const { canvas: ec, ctx: eCtx } = this._createTex('barrel_red', 16, 20);
        this._rect(eCtx, 1, 1, 14, 18, '#ef4444'); // Body
        this._rect(eCtx, 1, 1, 14, 2, '#991b1b'); // Top rim
        this._rect(eCtx, 1, 17, 14, 2, '#991b1b'); // Bottom rim
        this._rect(eCtx, 4, 8, 8, 4, '#fee2e2', 0.4); // Danger stripe
        this._finish(ec);

        // Stone Well
        const { canvas: sw, ctx: sCtx } = this._createTex('well', 48, 48);
        // Base circle
        sCtx.fillStyle = '#64748b';
        sCtx.beginPath();
        sCtx.arc(24, 24, 20, 0, Math.PI * 2);
        sCtx.fill();
        // Inner water hole
        sCtx.fillStyle = '#1e293b';
        sCtx.beginPath();
        sCtx.arc(24, 24, 14, 0, Math.PI * 2);
        sCtx.fill();
        // Stone texture
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 14 + Math.random() * 6;
            this._px(sCtx, 24 + Math.cos(angle) * dist, 24 + Math.sin(angle) * dist, '#334155');
        }
        this._finish(sw);

        // Loot: Key
        const { canvas: kc, ctx: kCtx } = this._createTex('loot_key', 20, 20);
        this._rect(kCtx, 8, 4, 4, 12, '#fbbf24'); // Shaft
        this._rect(kCtx, 8, 14, 6, 2, '#fbbf24');  // Bit
        this._rect(kCtx, 7, 4, 6, 4, '#fbbf24');   // Head
        this._finish(kc);

        // Loot: Armor
        const { canvas: ac, ctx: aCtx } = this._createTex('loot_armor', 24, 24);
        this._rect(aCtx, 4, 4, 16, 16, '#94a3b8'); // Chest piece
        this._rect(aCtx, 4, 4, 16, 4, '#64748b');  // Shoulders
        this._rect(aCtx, 8, 8, 8, 8, '#cbd5e1', 0.5); // Plate highlight
        this._finish(ac);
    }

    _genTrapTextures() {
        // Spike Trap
        const { canvas: sc, ctx: sCtx } = this._createTex('trap_spikes', 32, 32);
        this._rect(sCtx, 2, 2, 28, 28, '#475569'); // Base plate
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                this._rect(sCtx, 6 + i*6, 6 + j*6, 2, 2, '#94a3b8'); // Spikes down
            }
        }
        this._finish(sc);

        // Pressure Plate
        const { canvas: pp, ctx: pCtx } = this._createTex('pressure_plate', 24, 24);
        this._rect(pCtx, 2, 2, 20, 20, '#64748b'); // Outer
        this._rect(pCtx, 6, 6, 12, 12, '#334155'); // Inner plate
        this._finish(pp);

        // Mimic (Chest with teeth)
        const { canvas: mc, ctx: mCtx } = this._createTex('mimic', 32, 32);
        this._rect(mCtx, 4, 10, 24, 16, '#713f12'); // Body
        this._rect(mCtx, 4, 10, 24, 4, '#ef4444'); // Red lid (evil)
        this._rect(mCtx, 8, 11, 4, 2, '#fff');    // Teeth 1
        this._rect(mCtx, 20, 11, 4, 2, '#fff');   // Teeth 2
        this._finish(mc);
    }

    _genEnvDetailTextures() {
        // Road Cracks
        const { canvas: rc, ctx: rCtx } = this._createTex('road_crack', 32, 32);
        rCtx.strokeStyle = '#1e293b';
        rCtx.lineWidth = 1;
        rCtx.beginPath();
        rCtx.moveTo(0, 16); rCtx.lineTo(8, 12); rCtx.lineTo(16, 20); rCtx.lineTo(32, 14);
        rCtx.stroke();
        this._finish(rc);

        // Dirt Edges (for blending)
        const { canvas: de, ctx: dCtx } = this._createTex('dirt_patch', 32, 32);
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * 32;
            const y = Math.random() * 32;
            this._px(dCtx, x, y, '#78350f', 0.2 + Math.random() * 0.3);
        }
        this._finish(de);
    }

    // ═══════════════════════════════════════════════════════
    // HELPER: Canvas pixel drawing
    // ═══════════════════════════════════════════════════════

    _createTex(key, w, h) {
        const canvas = this.scene.textures.createCanvas(key, w, h);
        const ctx = canvas.getContext();
        return { canvas, ctx };
    }

    _px(ctx, x, y, color, alpha = 1) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1;
    }

    _rect(ctx, x, y, w, h, color, alpha = 1) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
    }

    /** Draw from a pixel map: 2D array of hex color strings, '.' = transparent */
    _drawPixelMap(ctx, map, ox = 0, oy = 0, scale = 1) {
        for (let y = 0; y < map.length; y++) {
            const row = map[y];
            for (let x = 0; x < row.length; x++) {
                const c = row[x];
                if (c === '.' || c === ' ') continue;
                ctx.fillStyle = c;
                ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
            }
        }
    }

    _noise(x, y, seed = 0) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
        return n - Math.floor(n);
    }

    _finish(canvas) {
        canvas.refresh();
    }

    // ═══════════════════════════════════════════════════════
    // TERRAIN TILES
    // ═══════════════════════════════════════════════════════

    _genGrassTiles() {
        // Generate 4 variants for visual variety
        for (let v = 0; v < 4; v++) {
            const { canvas, ctx } = this._createTex(`grass_${v}`, 32, 32);

            // Base grass color
            for (let y = 0; y < 32; y++) {
                for (let x = 0; x < 32; x++) {
                    const n = this._noise(x, y, v * 100);
                    const g = Math.floor(90 + n * 40);      // green: 90-130
                    const r = Math.floor(40 + n * 20);      // red: 40-60
                    const b = Math.floor(30 + n * 15);      // blue: 30-45
                    this._px(ctx, x, y, `rgb(${r},${g},${b})`);
                }
            }

            // Grass blades (darker spots)
            for (let i = 0; i < 12; i++) {
                const gx = Math.floor(this._noise(i, v, 50) * 30) + 1;
                const gy = Math.floor(this._noise(v, i, 60) * 30) + 1;
                this._px(ctx, gx, gy, '#2a5020');
                this._px(ctx, gx, gy + 1, '#2a5020');
            }

            // Occasional flower pixel
            if (v === 2) {
                this._px(ctx, 12, 8, '#ee6688');
                this._px(ctx, 22, 20, '#eecc44');
            }

            this._finish(canvas);
        }
    }

    _genDirtTiles() {
        for (let v = 0; v < 2; v++) {
            const { canvas, ctx } = this._createTex(`dirt_${v}`, 32, 32);

            for (let y = 0; y < 32; y++) {
                for (let x = 0; x < 32; x++) {
                    const n = this._noise(x, y, v * 200 + 50);
                    const r = Math.floor(100 + n * 30);
                    const g = Math.floor(80 + n * 25);
                    const b = Math.floor(50 + n * 15);
                    this._px(ctx, x, y, `rgb(${r},${g},${b})`);
                }
            }

            // Pebbles
            for (let i = 0; i < 6; i++) {
                const px = Math.floor(this._noise(i, v, 70) * 28) + 2;
                const py = Math.floor(this._noise(v, i, 80) * 28) + 2;
                this._px(ctx, px, py, '#8a7a5a');
                this._px(ctx, px + 1, py, '#7a6a4a');
            }

            this._finish(canvas);
        }
    }

    _genRoadTiles() {
        // Horizontal road
        const { canvas: hc, ctx: hCtx } = this._createTex('road_h', 32, 32);
        // Asphalt base
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const n = this._noise(x, y, 300);
                const v = Math.floor(50 + n * 15);
                this._px(hCtx, x, y, `rgb(${v},${v},${v})`);
            }
        }
        // Edge lines (white)
        for (let x = 0; x < 32; x++) {
            this._px(hCtx, x, 1, '#aaa', 0.6);
            this._px(hCtx, x, 30, '#aaa', 0.6);
        }
        // Center dashes (yellow)
        for (let x = 4; x < 28; x += 6) {
            this._px(hCtx, x, 15, '#cc9922');
            this._px(hCtx, x + 1, 15, '#cc9922');
            this._px(hCtx, x + 2, 15, '#cc9922');
            this._px(hCtx, x, 16, '#cc9922');
            this._px(hCtx, x + 1, 16, '#cc9922');
            this._px(hCtx, x + 2, 16, '#cc9922');
        }
        this._finish(hc);

        // Vertical road
        const { canvas: vc, ctx: vCtx } = this._createTex('road_v', 32, 32);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const n = this._noise(x, y, 310);
                const v = Math.floor(50 + n * 15);
                this._px(vCtx, x, y, `rgb(${v},${v},${v})`);
            }
        }
        for (let y = 0; y < 32; y++) {
            this._px(vCtx, 1, y, '#aaa', 0.6);
            this._px(vCtx, 30, y, '#aaa', 0.6);
        }
        for (let y = 4; y < 28; y += 6) {
            this._rect(vCtx, 15, y, 2, 3, '#cc9922');
        }
        this._finish(vc);

        // Intersection
        const { canvas: ic, ctx: iCtx } = this._createTex('road_cross', 32, 32);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const n = this._noise(x, y, 320);
                const v = Math.floor(55 + n * 12);
                this._px(iCtx, x, y, `rgb(${v},${v},${v})`);
            }
        }
        // Crosswalk
        for (let i = 0; i < 4; i++) {
            this._rect(iCtx, 4 + i * 7, 14, 4, 4, '#aaa', 0.35);
            this._rect(iCtx, 14, 4 + i * 7, 4, 4, '#aaa', 0.35);
        }
        this._finish(ic);
    }

    _genWaterTiles() {
        for (let v = 0; v < 2; v++) {
            const key = v === 0 ? 'water' : 'water_deep';
            const { canvas, ctx } = this._createTex(key, 32, 32);
            const depth = v === 0 ? 0 : 30;

            for (let y = 0; y < 32; y++) {
                for (let x = 0; x < 32; x++) {
                    const n = this._noise(x, y, 400 + v * 50);
                    const wave = Math.sin((x + y) * 0.3) * 0.5 + 0.5;
                    const r = Math.floor(20 + n * 10 - depth);
                    const g = Math.floor(70 + n * 30 + wave * 15 - depth);
                    const b = Math.floor(120 + n * 40 + wave * 20 - depth);
                    this._px(ctx, x, y, `rgb(${Math.max(0, r)},${Math.max(0, g)},${Math.max(0, b)})`);
                }
            }

            // Highlights (wave crests)
            for (let i = 0; i < 4; i++) {
                const wx = Math.floor(this._noise(i, v, 90) * 28) + 2;
                const wy = Math.floor(this._noise(v, i, 91) * 28) + 2;
                this._px(ctx, wx, wy, '#6ab0dd', 0.5);
                this._px(ctx, wx + 1, wy, '#6ab0dd', 0.3);
            }

            this._finish(canvas);
        }
    }

    _genSandTile() {
        const { canvas, ctx } = this._createTex('sand', 32, 32);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const n = this._noise(x, y, 500);
                const r = Math.floor(190 + n * 20);
                const g = Math.floor(165 + n * 18);
                const b = Math.floor(100 + n * 15);
                this._px(ctx, x, y, `rgb(${r},${g},${b})`);
            }
        }
        // Shell/pebble dots
        this._px(ctx, 8, 12, '#c4a868');
        this._px(ctx, 20, 24, '#b89858');
        this._px(ctx, 26, 6, '#d4b878');
        this._finish(canvas);
    }

    _genConcreteTile() {
        const { canvas, ctx } = this._createTex('concrete', 32, 32);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const n = this._noise(x, y, 600);
                const v = Math.floor(110 + n * 20);
                this._px(ctx, x, y, `rgb(${v},${v},${v + 5})`);
            }
        }
        // Crack
        for (let i = 0; i < 8; i++) {
            this._px(ctx, 10 + i, 14 + Math.floor(Math.sin(i) * 2), '#888', 0.5);
        }
        // Expansion joint
        this._rect(ctx, 0, 15, 32, 1, '#999', 0.3);
        this._rect(ctx, 15, 0, 1, 32, '#999', 0.3);
        this._finish(canvas);
    }

    _genForestFloor() {
        const { canvas, ctx } = this._createTex('forest_floor', 32, 32);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const n = this._noise(x, y, 700);
                const r = Math.floor(35 + n * 20);
                const g = Math.floor(60 + n * 25);
                const b = Math.floor(25 + n * 12);
                this._px(ctx, x, y, `rgb(${r},${g},${b})`);
            }
        }
        // Fallen leaves
        this._px(ctx, 6, 10, '#6a4a20');
        this._px(ctx, 18, 22, '#7a5a30');
        this._px(ctx, 24, 8, '#5a3a18');
        this._px(ctx, 12, 26, '#8a6a40');
        this._finish(canvas);
    }

    /** Modular player parts: body (torso only), legs, arms — for procedural limb animation */
    _genPlayerModularParts() {
        const _ = '.';
        // Human Warrior Colors - brown leather armor, red loincloth, dark hair
        const BR1 = '#8b4513'; // brown leather primary
        const BR2 = '#654321'; // brown leather secondary
        const BR3 = '#4a2c17'; // brown leather dark
        const RC = '#dc2626'; // red loincloth primary
        const RD = '#991b1b'; // red loincloth dark
        const SK = '#f4a460'; // sandy beige skin
        const SD = '#d2691e'; // darker skin shading
        const EY = '#2c1810'; // dark brown eyes
        const HR = '#2c1810'; // dark brown hair/top knot
        const HD = '#1a0e08'; // darker hair shading
        const A1 = '#8b4513'; // arm guards brown primary
        const A2 = '#654321'; // arm guards brown secondary
        const A3 = '#4a2c17'; // arm guards brown dark
        const CP = '#654321'; // brown leather pouch
        const CD = '#4a2c17'; // dark brown pouch
        const BL = '#1a1a1a'; // black boots
        const BD = '#0d0d0d'; // black boots dark
        const GR = '#2c1810'; // dark brown eyes/hair

        // Body only (head + torso, no legs) — 24×16 - Improved Human Warrior design
        const { canvas: bodyCanvas, ctx: bodyCtx } = this._createTex('player_body', 24, 16);
        this._drawPixelMap(bodyCtx, [
            // Top knot hair - more refined
            [_, _, _, _, _, _, _, HR, HR, HR, HR, HR, HR, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, HR, HD, HR, HD, HR, HD, HR, HD, _, _, _, _, _, _, _, _, _],
            // Head with better facial features
            [_, _, _, _, _, _, HR, SK, EY, SK, SK, EY, SK, HR, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, HR, SK, SD, SK, SK, SD, SK, HR, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, SK, SD, SK, SK, SD, SK, _, _, _, _, _, _, _, _, _, _],
            // Beard - more natural shape
            [_, _, _, _, _, _, _, HR, HR, HR, HR, HR, HR, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, HD, HR, HD, HR, HD, HR, _, _, _, _, _, _, _, _, _, _],
            // Neck and shoulders
            [_, _, _, _, _, _, _, SK, SK, SK, SK, SK, SK, _, _, _, _, _, _, _, _, _, _],
            // Torso with better armor design
            [_, _, _, _, A3, A2, A1, A1, A1, A2, A2, A1, A1, A1, A2, A3, _, _, _, _, _, _],
            [_, _, _, CP, A3, A2, A1, A1, BR2, A1, A1, BR2, A1, A1, A2, A3, CP, _, _, _, _, _, _],
            [_, _, _, CP, A3, A1, A1, A2, A1, A1, A1, A2, A1, A1, A1, A3, CP, _, _, _, _, _, _],
            [_, _, _, CP, A3, A1, A1, A1, A1, A2, A2, A1, A1, A1, A1, A3, CP, _, _, _, _, _, _],
            [_, _, _, CD, A3, A1, A1, A1, A1, A2, A2, A1, A1, A1, A1, A3, CD, _, _, _, _, _, _],
            // Red loincloth - better shape
            [_, _, _, CD, _, A3, RC, RC, RC, RC, RC, RC, RC, RC, A3, _, CD, _, _, _, _, _, _],
            [_, _, _, _, _, _, RC, RD, RC, RD, RC, RD, RC, RD, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ], 0, 0);
        this._px(bodyCtx, 10, 3, GR);
        this._px(bodyCtx, 11, 3, GR);
        this._finish(bodyCanvas);

        // Single leg (boot + shin) — 12×20, origin at top center; refined design
        const { canvas: legCanvas, ctx: legCtx } = this._createTex('player_leg', 12, 20);
        const BD2 = '#0d0d0d';
        const BL2 = '#1a1a1a';
        // More detailed leg with better proportions
        this._rect(legCtx, 5, 0, 2, 6, A1);     // upper leg armor (thinner)
        this._rect(legCtx, 4, 1, 1, 4, A2, 0.7);  // armor shading
        this._rect(legCtx, 5, 6, 2, 6, A2);     // lower leg / shin armor
        this._rect(legCtx, 4, 7, 1, 4, A3, 0.6); // shin shading
        this._rect(legCtx, 3, 12, 6, 4, BL2);   // black boot (wider)
        this._rect(legCtx, 3, 16, 6, 2, BD2);   // boot sole
        // Add boot details
        this._px(legCtx, 4, 14, A1); // boot buckle
        this._px(legCtx, 7, 14, A1);
        this._finish(legCanvas);

        // Single arm (sleeve + hand) — 10×18, origin at shoulder; refined design
        const { canvas: armCanvas, ctx: armCtx } = this._createTex('player_arm', 10, 18);
        const SK2 = '#f4a460';
        // More detailed arm with better proportions
        this._rect(armCtx, 4, 0, 2, 8, A1);     // arm guard (thinner)
        this._rect(armCtx, 3, 1, 1, 6, A2, 0.7);  // arm guard shading
        this._rect(armCtx, 4, 8, 2, 5, SK2);    // hand (smaller)
        this._rect(armCtx, 3, 9, 1, 3, SD, 0.5); // hand shading
        // Add hand details
        this._px(armCtx, 4, 12, SK2); // fingers
        this._px(armCtx, 5, 12, SK2);
        this._px(armCtx, 6, 12, SK2);
        this._finish(armCanvas);
    }

    // ═══════════════════════════════════════════════════════
    // OBSTACLES
    // ═══════════════════════════════════════════════════════

    _genTreeDeciduous() {
        const { canvas, ctx } = this._createTex('tree', 32, 40);
        const _ = '.';
        const T = '#5a3a18'; // trunk
        const D = '#3a2a0e'; // trunk dark
        const L = '#2a8818'; // leaf
        const M = '#228812'; // leaf mid
        const K = '#1a6a0e'; // leaf dark
        const H = '#44aa28'; // leaf highlight

        // Trunk (bottom)
        this._drawPixelMap(ctx, [
            [_, _, _, _, _, _, _, _],
            [_, _, _, T, T, _, _, _],
            [_, _, _, T, D, _, _, _],
            [_, _, _, T, T, _, _, _],
            [_, _, _, T, D, _, _, _],
            [_, _, _, T, T, _, _, _],
            [_, _, T, T, D, T, _, _],
        ], 12, 28);

        // Canopy (top)
        this._drawPixelMap(ctx, [
            [_, _, _, _, K, K, _, _, _, _, _, _],
            [_, _, _, K, M, L, K, _, _, _, _, _],
            [_, _, K, M, L, H, L, K, _, _, _, _],
            [_, K, M, L, H, L, L, M, K, _, _, _],
            [_, K, L, H, L, L, L, L, M, K, _, _],
            [K, M, L, L, L, H, L, L, L, M, K, _],
            [K, L, L, H, L, L, L, H, L, L, K, _],
            [_, K, M, L, L, L, L, L, M, K, _, _],
            [_, _, K, M, L, H, L, M, K, _, _, _],
            [_, _, _, K, K, M, K, K, _, _, _, _],
        ], 10, 2);

        this._finish(canvas);
    }

    _genTreePine() {
        const { canvas, ctx } = this._createTex('tree_pine', 24, 40);
        const _ = '.';
        const T = '#4a2a0a';
        const P = '#1a5a12';
        const L = '#228822';
        const H = '#2aaa2a';

        // Trunk
        this._rect(ctx, 11, 30, 2, 8, T);

        // Pine layers (3 triangles)
        this._drawPixelMap(ctx, [
            [_, _, _, _, _, H, _, _, _, _, _, _],
            [_, _, _, _, H, L, H, _, _, _, _, _],
            [_, _, _, H, L, L, L, H, _, _, _, _],
            [_, _, H, L, L, L, L, L, H, _, _, _],
            [_, H, L, L, L, L, L, L, L, H, _, _],
        ], 6, 4);

        this._drawPixelMap(ctx, [
            [_, _, _, _, L, L, _, _, _, _, _, _],
            [_, _, _, L, P, L, L, _, _, _, _, _],
            [_, _, L, P, L, L, P, L, _, _, _, _],
            [_, L, P, L, L, L, L, P, L, _, _, _],
            [L, P, L, L, L, L, L, L, P, L, _, _],
        ], 6, 12);

        this._drawPixelMap(ctx, [
            [_, _, _, P, L, L, P, _, _, _, _, _],
            [_, _, P, L, P, L, L, P, _, _, _, _],
            [_, P, L, P, L, L, P, L, P, _, _, _],
            [P, L, P, L, L, L, L, P, L, P, _, _],
            [P, L, L, L, L, L, L, L, L, P, _, _],
            [_, P, P, P, P, P, P, P, P, _, _, _],
        ], 6, 20);

        this._finish(canvas);
    }

    _genRockSmall() {
        const { canvas, ctx } = this._createTex('rock_small', 16, 14);
        const _ = '.';
        const D = '#555';
        const M = '#777';
        const L = '#999';
        const H = '#aaa';

        this._drawPixelMap(ctx, [
            [_, _, _, _, _, D, D, D, D, _, _, _, _, _, _, _],
            [_, _, _, D, D, M, M, M, M, D, D, _, _, _, _, _],
            [_, _, D, M, M, L, L, M, M, M, M, D, _, _, _, _],
            [_, D, M, L, H, H, L, M, M, M, M, M, D, _, _, _],
            [_, D, M, L, H, L, L, M, M, D, M, M, D, _, _, _],
            [_, D, M, M, L, L, M, M, D, D, M, M, D, _, _, _],
            [_, D, D, M, M, M, M, M, M, M, M, D, D, _, _, _],
            [_, _, D, D, M, M, M, M, M, M, D, D, _, _, _, _],
            [_, _, _, D, D, D, D, D, D, D, D, _, _, _, _, _],
        ], 1, 2);

        this._finish(canvas);
    }

    _genRockLarge() {
        const { canvas, ctx } = this._createTex('rock_large', 28, 22);
        const _ = '.';
        const D = '#555'; const M = '#777';
        const L = '#999'; const H = '#bbb';

        this._drawPixelMap(ctx, [
            [_, _, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _, _, _, _],
            [_, _, _, _, D, D, M, M, M, M, M, M, D, D, _, _, _, _, _, _],
            [_, _, _, D, M, M, L, L, L, M, M, M, M, M, D, _, _, _, _, _],
            [_, _, D, M, L, H, H, H, L, L, M, M, M, M, M, D, _, _, _, _],
            [_, D, M, L, H, H, L, L, L, M, M, M, D, M, M, M, D, _, _, _],
            [_, D, M, L, H, L, L, M, M, M, D, D, D, M, M, M, D, _, _, _],
            [_, D, M, M, L, L, M, M, M, D, D, M, M, M, M, M, D, _, _, _],
            [_, D, M, M, M, M, M, M, M, M, M, M, M, M, M, D, D, _, _, _],
            [_, D, D, M, M, M, M, M, M, M, M, M, M, D, D, D, _, _, _, _],
            [_, _, D, D, D, M, M, M, M, M, M, D, D, D, _, _, _, _, _, _],
            [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _, _, _, _, _],
        ], 2, 4);

        this._finish(canvas);
    }

    _genBush() {
        const { canvas, ctx } = this._createTex('bush', 20, 16);
        const _ = '.';
        const D = '#1a5a0e'; const L = '#2a8a1a';
        const M = '#228812'; const H = '#3aaa28';
        const B = '#cc3344'; // berry

        this._drawPixelMap(ctx, [
            [_, _, _, _, _, _, D, D, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, D, D, M, M, D, D, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, D, M, L, H, L, M, M, D, _, _, D, D, _, _, _, _, _],
            [_, _, D, M, L, H, L, L, L, L, M, D, D, M, M, D, _, _, _, _],
            [_, D, M, L, L, L, L, L, L, L, M, M, L, H, L, M, D, _, _, _],
            [_, D, M, L, L, H, L, L, M, L, L, L, L, L, L, M, D, _, _, _],
            [_, D, M, L, L, L, L, L, M, D, M, L, H, L, M, D, _, _, _, _],
            [_, _, D, M, L, L, B, M, D, D, M, L, L, M, D, _, _, _, _, _],
            [_, _, _, D, D, M, M, D, _, _, D, D, D, D, _, _, _, _, _, _],
            [_, _, _, _, _, D, D, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ], 0, 3);

        this._finish(canvas);
    }

    _genCrate() {
        const { canvas, ctx } = this._createTex('crate', 16, 16);
        const _ = '.';
        const W = '#7a5a2a'; const D = '#5a3a1a';
        const L = '#9a7a4a'; const N = '#4a2a10';

        // Fill body
        this._rect(ctx, 1, 1, 14, 14, W);
        // Border
        this._rect(ctx, 0, 0, 16, 1, D);
        this._rect(ctx, 0, 15, 16, 1, D);
        this._rect(ctx, 0, 0, 1, 16, D);
        this._rect(ctx, 15, 0, 1, 16, D);
        // Planks
        this._rect(ctx, 1, 5, 14, 1, N);
        this._rect(ctx, 1, 10, 14, 1, N);
        this._rect(ctx, 7, 1, 1, 14, N);
        // Highlight
        this._rect(ctx, 1, 1, 14, 1, L, 0.5);
        this._rect(ctx, 1, 1, 1, 14, L, 0.3);

        this._finish(canvas);
    }

    _genBarrel() {
        const { canvas, ctx } = this._createTex('barrel', 14, 16);
        const M = '#555'; const D = '#444';
        const L = '#666'; const H = '#777';
        const R = '#888'; // rim

        this._rect(ctx, 3, 1, 8, 14, M);
        this._rect(ctx, 2, 2, 1, 12, D);
        this._rect(ctx, 11, 2, 1, 12, D);
        this._rect(ctx, 4, 0, 6, 1, R);
        this._rect(ctx, 4, 15, 6, 1, R);
        this._rect(ctx, 3, 3, 8, 1, R);
        this._rect(ctx, 3, 12, 8, 1, R);
        // Highlight
        this._rect(ctx, 5, 1, 2, 14, H, 0.4);
        // Top circle
        this._rect(ctx, 5, 1, 4, 2, L, 0.5);

        this._finish(canvas);
    }

    _genSandbag() {
        const { canvas, ctx } = this._createTex('sandbag', 24, 12);
        const S = '#9a8a5a'; const D = '#7a6a3a';
        const L = '#b09a6a'; const N = '#5a4a2a';

        // Bottom bags
        this._rect(ctx, 1, 5, 10, 6, S);
        this._rect(ctx, 13, 5, 10, 6, S);
        this._rect(ctx, 1, 5, 10, 1, L);
        this._rect(ctx, 13, 5, 10, 1, L);
        this._rect(ctx, 0, 11, 24, 1, D);
        // Ties
        this._rect(ctx, 5, 6, 1, 4, N);
        this._rect(ctx, 18, 6, 1, 4, N);
        // Top bag
        this._rect(ctx, 4, 0, 16, 6, S);
        this._rect(ctx, 4, 0, 16, 1, L);
        this._rect(ctx, 12, 1, 1, 4, N);

        this._finish(canvas);
    }

    // ═══════════════════════════════════════════════════════
    // BUILDING TILES
    // ═══════════════════════════════════════════════════════

    _genWallTile() {
        const { canvas, ctx } = this._createTex('wall', 32, 32);
        const brickA = '#8a6a5a';
        const brickB = '#7a5a4a';
        const mortar = '#aaa08a';

        for (let row = 0; row < 32; row += 6) {
            const offset = (Math.floor(row / 6) % 2) * 8;
            for (let col = 0; col < 32; col++) {
                const isJoint = (row % 6 === 0) || ((col - offset) % 16 === 0);
                if (isJoint) {
                    this._px(ctx, col, row, mortar);
                } else {
                    const n = this._noise(col, row, 800);
                    this._px(ctx, col, row, n > 0.5 ? brickA : brickB);
                }
            }
        }
        this._finish(canvas);
    }

    _genRoofTile() {
        const { canvas, ctx } = this._createTex('roof', 32, 32);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const n = this._noise(x, y, 900);
                const isShingle = (y % 4 === 0);
                const r = Math.floor(90 + n * 20 - (isShingle ? 15 : 0));
                const g = Math.floor(50 + n * 15 - (isShingle ? 10 : 0));
                const b = Math.floor(40 + n * 10);
                this._px(ctx, x, y, `rgb(${r},${g},${b})`);
            }
        }
        this._finish(canvas);
    }

    _genWindowTile() {
        const { canvas, ctx } = this._createTex('window', 8, 8);
        this._rect(ctx, 0, 0, 8, 8, '#333'); // frame
        this._rect(ctx, 1, 1, 6, 6, '#4488aa'); // glass
        this._rect(ctx, 1, 1, 3, 3, '#5599bb', 0.7); // reflection
        this._rect(ctx, 4, 1, 1, 6, '#222', 0.6); // crossbar
        this._rect(ctx, 1, 4, 6, 1, '#222', 0.6);
        this._finish(canvas);
    }

    _genWindowTileLit() {
        const { canvas, ctx } = this._createTex('window_lit', 8, 8);
        this._rect(ctx, 0, 0, 8, 8, '#333');
        this._rect(ctx, 1, 1, 6, 6, '#eedd88');
        this._rect(ctx, 4, 1, 1, 6, '#222', 0.4);
        this._rect(ctx, 1, 4, 6, 1, '#222', 0.4);
        this._finish(canvas);
    }

    _genDoorTile() {
        const { canvas, ctx } = this._createTex('door', 32, 32);
        // Better door: perspective top-down
        const frame = '#3a2a1a';
        const panel = '#6a4a2a';
        const detail = '#5a3a1a';
        const knob = '#ccaa44';

        // Outer frame
        this._rect(ctx, 4, 4, 24, 24, frame);
        // Door surface
        this._rect(ctx, 6, 6, 20, 22, panel);
        // Panels
        this._rect(ctx, 8, 8, 16, 8, detail);
        this._rect(ctx, 8, 18, 16, 6, detail);
        // Brass handle
        this._rect(ctx, 21, 15, 2, 2, knob);
        // Step
        this._rect(ctx, 4, 28, 24, 4, '#777');
        this._finish(canvas);
    }

    _genFloorTile() {
        const { canvas, ctx } = this._createTex('floor', 32, 32);
        // Better wood floor
        const woodA = '#6a4a2a';
        const woodB = '#5a3a1a';
        const line = '#3a2a1a';

        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const n = this._noise(x, y, 950);
                const isPlank = (y % 8 === 0);
                const isGap = (x % 16 === (y % 16 === 0 ? 8 : 0));
                if (isPlank || isGap) {
                    this._px(ctx, x, y, line);
                } else {
                    this._px(ctx, x, y, n > 0.5 ? woodA : woodB);
                }
            }
        }
        this._finish(canvas);
    }

    _genFurnitureTextures() {
        // Table (32x32)
        const { canvas: tc, ctx: tCtx } = this._createTex('table', 32, 32);
        this._rect(tCtx, 2, 2, 28, 28, '#8b5a2b'); // Surface
        this._rect(tCtx, 4, 4, 24, 1, '#a67c52', 0.4); // Highlight
        this._rect(tCtx, 2, 2, 28, 2, '#5d3a1a'); // Edge
        this._finish(tc);

        // Chair (16x16)
        const { canvas: cc, ctx: cCtx } = this._createTex('chair', 16, 16);
        this._rect(cCtx, 2, 2, 12, 12, '#8b5a2b'); // Seat
        this._rect(cCtx, 2, 2, 12, 2, '#5d3a1a'); // Backrest top
        this._finish(cc);

        // Bed (32x48)
        const { canvas: bc, ctx: bCtx } = this._createTex('bed', 32, 48);
        this._rect(bCtx, 2, 2, 28, 44, '#5d3a1a'); // Frame
        this._rect(bCtx, 4, 4, 24, 40, '#eee'); // Mattress
        this._rect(bCtx, 4, 4, 24, 12, '#ddd'); // Pillow
        this._rect(bCtx, 4, 16, 24, 28, '#4466aa'); // Blanket
        this._finish(bc);

        // Couch (48x24)
        const { canvas: coc, ctx: coCtx } = this._createTex('couch', 48, 24);
        this._rect(coCtx, 2, 2, 44, 20, '#aa4444'); // Main
        this._rect(coCtx, 2, 2, 44, 4, '#882222'); // Backrest
        this._rect(coCtx, 2, 2, 4, 20, '#882222'); // Arm L
        this._rect(coCtx, 42, 2, 4, 20, '#882222'); // Arm R
        this._finish(coc);

        // Bookshelf (32x16)
        const { canvas: bsc, ctx: bsCtx } = this._createTex('bookshelf', 32, 16);
        this._rect(bsCtx, 0, 0, 32, 16, '#5d3a1a');
        for (let i = 0; i < 4; i++) {
            const colors = ['#aa4444', '#44aa44', '#4444aa', '#eeeeee'];
            this._rect(bsCtx, 2 + i * 7, 2, 5, 12, colors[i % 4]);
        }
        this._finish(bsc);

        // TV (32x24)
        const { canvas: tvc, ctx: tvCtx } = this._createTex('tv', 32, 24);
        this._rect(tvCtx, 0, 0, 32, 24, '#222'); // Frame
        this._rect(tvCtx, 2, 2, 28, 16, '#112233'); // Screen
        this._rect(tvCtx, 4, 4, 10, 4, '#224466', 0.5); // Reflection
        this._finish(tvc);

        // Fridge (24x24)
        const { canvas: fc, ctx: fCtx } = this._createTex('fridge', 24, 24);
        this._rect(fCtx, 0, 0, 24, 24, '#eee');
        this._rect(fCtx, 2, 2, 20, 10, '#ddd'); // Upper door
        this._rect(fCtx, 18, 14, 2, 6, '#aaa'); // Handle
        this._finish(fc);
    }

    _genFenceTextures() {
        // Fence horizontal
        const { canvas: hfc, ctx: hfCtx } = this._createTex('fence_h', 32, 8);
        this._rect(hfCtx, 0, 2, 32, 4, '#8b5a2b'); // Rail
        for (let i = 0; i < 32; i += 8) {
            this._rect(hfCtx, i, 0, 3, 8, '#a67c52'); // Post
        }
        this._finish(hfc);

        // Fence vertical
        const { canvas: vfc, ctx: vfCtx } = this._createTex('fence_v', 8, 32);
        this._rect(vfCtx, 2, 0, 4, 32, '#8b5a2b'); // Rail
        for (let i = 0; i < 32; i += 8) {
            this._rect(vfCtx, 0, i, 8, 3, '#a67c52'); // Post
        }
        this._finish(vfc);
    }

    // ═══════════════════════════════════════════════════════
    // CHARACTERS — Pixel art top-down view
    // ═══════════════════════════════════════════════════════

    _genPlayerSprite() {
        const { canvas, ctx } = this._createTex('player', 24, 28);
        const _ = '.';
        // Color palette — Golden Warrior
        const G1 = '#d4a020'; // helmet gold bright
        const G2 = '#b8860b'; // helmet gold mid
        const G3 = '#8b6914'; // helmet gold dark
        const RC = '#c62828'; // red crest/plume
        const RD = '#991b1b'; // dark red
        const SK = '#deb887'; // skin
        const SD = '#c4956a'; // skin shadow
        const EY = '#1a1a2e'; // eyes
        const A1 = '#8b8b8b'; // armor light
        const A2 = '#6b6b6b'; // armor mid
        const A3 = '#4a4a4a'; // armor dark
        const CP = '#7c2d12'; // cape brown
        const CD = '#5c1f0d'; // cape dark
        const BL = '#2a2a2a'; // belt/boots
        const BD = '#1a1a1a'; // boots dark
        const SW = '#c0c0c0'; // sword silver
        const SH = '#a0a0a0'; // sword handle
        const GR = '#22c55e'; // direction indicator

        this._drawPixelMap(ctx, [
            // Row 0:  Red crest/plume on top
            [_, _, _, _, _, _, _, _, RC, RC, RC, RC, RC, RC, RC, _, _, _, _, _, _, _, _, _],
            // Row 1: Plume extends
            [_, _, _, _, _, _, _, RC, RD, RC, RC, RC, RD, RC, RD, _, _, _, _, _, _, _, _, _],
            // Row 2: Helmet top
            [_, _, _, _, _, _, G3, G1, G1, G2, G2, G2, G1, G1, G3, _, _, _, _, _, _, _, _, _],
            // Row 3: Helmet visor
            [_, _, _, _, _, G3, G2, G1, G1, G1, G1, G1, G1, G1, G2, G3, _, _, _, _, _, _, _, _],
            // Row 4: Face visible in visor
            [_, _, _, _, _, G3, G2, SK, EY, SK, SK, SK, EY, SK, G2, G3, _, _, _, _, _, _, _, _],
            // Row 5: Lower face / chin guard
            [_, _, _, _, _, _, G3, SK, SD, SK, SK, SK, SD, SK, G3, _, _, _, _, _, _, _, _, _],
            // Row 6: Neck / armor collar
            [_, _, _, _, _, _, _, A2, A1, A1, A1, A1, A1, A2, _, _, _, _, _, _, _, _, _, _],
            // Row 7: Shoulder armor (pauldrons)
            [_, _, _, _, A3, A2, A1, A1, A1, A2, A2, A1, A1, A1, A2, A3, _, _, _, _, _, _, _, _],
            // Row 8: Cape + chest armor
            [_, _, _, CP, A3, A2, A1, A1, G2, A1, A1, G2, A1, A1, A2, A3, CP, _, _, _, _, _, _, _],
            // Row 9: Chest plate
            [_, _, _, CP, A3, A1, A1, A2, A1, A1, A1, A1, A2, A1, A1, A3, CP, _, _, _, _, _, _, _],
            // Row 10: Chest + sword arm
            [_, _, _, CD, A3, A1, A1, A1, A1, A2, A2, A1, A1, A1, A1, A3, CD, SW, _, _, _, _, _, _],
            // Row 11: Belt area
            [_, _, _, CD, _, A3, BL, BL, G2, BL, BL, G2, BL, BL, A3, _, CD, SW, _, _, _, _, _, _],
            // Row 12: Belt
            [_, _, _, _, _, _, BL, BL, BL, BL, BL, BL, BL, BL, _, _, _, SH, _, _, _, _, _, _],
            // Row 13: Upper legs + armor
            [_, _, _, _, _, _, A2, A1, A2, _, _, A2, A1, A2, _, _, _, _, _, _, _, _, _, _],
            // Row 14: Mid legs
            [_, _, _, _, _, _, A3, A1, A3, _, _, A3, A1, A3, _, _, _, _, _, _, _, _, _, _],
            // Row 15: Lower legs
            [_, _, _, _, _, _, A3, A2, A3, _, _, A3, A2, A3, _, _, _, _, _, _, _, _, _, _],
            // Row 16: Shin guards
            [_, _, _, _, _, _, A3, A1, A3, _, _, A3, A1, A3, _, _, _, _, _, _, _, _, _, _],
            // Row 17: Boots
            [_, _, _, _, _, BL, BD, BD, BD, BL, BL, BD, BD, BD, BL, _, _, _, _, _, _, _, _, _],
            // Row 18: Boot soles
            [_, _, _, _, _, BD, BD, BD, BD, BD, BD, BD, BD, BD, BD, _, _, _, _, _, _, _, _, _],
        ], 0, 5);

        // Direction indicator (green arrow at top)
        this._px(ctx, 10, 0, GR); this._px(ctx, 11, 0, GR);
        this._px(ctx, 9, 1, GR); this._px(ctx, 12, 1, GR);
        this._px(ctx, 10, 1, GR); this._px(ctx, 11, 1, GR);

        this._finish(canvas);
    }

    _genEnemySprite() {
        const { canvas, ctx } = this._createTex('enemy', 24, 28);
        const _ = '.';
        // Color palette — Dark Bandit/Raider
        const H1 = '#3d3d3d'; // helmet dark
        const H2 = '#555555'; // helmet mid
        const SP = '#8b0000'; // spike/horn red
        const SK = '#8b7355'; // skin (weathered)
        const EY = '#ff2222'; // red eyes
        const ED = '#660000'; // eye dark
        const A1 = '#4a4a4a'; // armor light
        const A2 = '#333333'; // armor mid
        const A3 = '#1a1a1a'; // armor dark
        const SC = '#5c5c5c'; // skull details
        const BL = '#222222'; // belt
        const BD = '#111111'; // boots
        const RD = '#6b2020'; // red accent
        const RI = '#ff3333'; // hostile indicator

        this._drawPixelMap(ctx, [
            // Row 0: Spiked helmet spikes
            [_, _, _, _, _, _, _, SP, _, _, _, _, _, SP, _, _, _, _, _, _, _, _, _, _],
            // Row 1: Helmet top
            [_, _, _, _, _, _, SP, H1, H2, H1, H1, H1, H2, H1, SP, _, _, _, _, _, _, _, _, _],
            // Row 2: Helmet
            [_, _, _, _, _, H1, H2, H1, H2, H2, H2, H2, H1, H2, H1, _, _, _, _, _, _, _, _, _],
            // Row 3: Helmet visor band
            [_, _, _, _, _, H1, A3, H2, H2, H2, H2, H2, H2, A3, H1, _, _, _, _, _, _, _, _, _],
            // Row 4: Face - skull mask with red eyes
            [_, _, _, _, _, H1, SC, EY, SC, SC, SC, SC, EY, SC, H1, _, _, _, _, _, _, _, _, _],
            // Row 5: Jaw area
            [_, _, _, _, _, _, H1, SC, SC, A3, A3, SC, SC, H1, _, _, _, _, _, _, _, _, _, _],
            // Row 6: Neck
            [_, _, _, _, _, _, _, A2, SK, SK, SK, SK, A2, _, _, _, _, _, _, _, _, _, _, _],
            // Row 7: Massive shoulder plates
            [_, _, _, A3, A2, A1, A2, A1, A2, A2, A2, A2, A1, A2, A1, A2, A3, _, _, _, _, _, _, _],
            // Row 8: Chest + shoulder spikes
            [_, _, _, RD, A3, A2, A1, A2, RD, A2, A2, RD, A2, A1, A2, A3, RD, _, _, _, _, _, _, _],
            // Row 9: Chest plate
            [_, _, _, _, A3, A2, A1, A2, A2, A1, A1, A2, A2, A1, A2, A3, _, _, _, _, _, _, _, _],
            // Row 10: Mid torso
            [_, _, _, _, A3, A2, A1, A1, A2, A2, A2, A2, A1, A1, A2, A3, _, _, _, _, _, _, _, _],
            // Row 11: Belt
            [_, _, _, _, _, A3, BL, BL, RD, BL, BL, RD, BL, BL, A3, _, _, _, _, _, _, _, _, _],
            // Row 12: Belt low
            [_, _, _, _, _, _, BL, BL, BL, BL, BL, BL, BL, BL, _, _, _, _, _, _, _, _, _, _],
            // Row 13: Upper legs
            [_, _, _, _, _, _, A2, A1, A2, _, _, A2, A1, A2, _, _, _, _, _, _, _, _, _, _],
            // Row 14: Mid legs
            [_, _, _, _, _, _, A3, A2, A3, _, _, A3, A2, A3, _, _, _, _, _, _, _, _, _, _],
            // Row 15: Lower legs
            [_, _, _, _, _, _, A3, A2, A3, _, _, A3, A2, A3, _, _, _, _, _, _, _, _, _, _],
            // Row 16: Shin guards
            [_, _, _, _, _, _, A3, A1, A3, _, _, A3, A1, A3, _, _, _, _, _, _, _, _, _, _],
            // Row 17: Boots
            [_, _, _, _, _, BD, BD, BD, BD, BD, BD, BD, BD, BD, BD, _, _, _, _, _, _, _, _, _],
            // Row 18: Boot soles
            [_, _, _, _, _, BD, BD, BD, BD, BD, BD, BD, BD, BD, BD, _, _, _, _, _, _, _, _, _],
        ], 0, 5);

        // Hostile indicator (top, red)
        this._px(ctx, 10, 2, RI); this._px(ctx, 11, 2, RI);
        this._px(ctx, 9, 3, RI); this._px(ctx, 12, 3, RI);

        this._finish(canvas);
    }

    // ═══════════════════════════════════════════════════════
    // SHADOWS
    // ═══════════════════════════════════════════════════════

    _genShadowCircle() {
        const { canvas, ctx } = this._createTex('shadow_circle', 32, 16);
        // Radial gradient for soft shadow edge
        const grd = ctx.createRadialGradient(16, 8, 0, 16, 8, 14);
        grd.addColorStop(0, 'rgba(0,0,0,0.45)');
        grd.addColorStop(0.6, 'rgba(0,0,0,0.25)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(16, 8, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        this._finish(canvas);
    }

    _genShadowRect() {
        const { canvas, ctx } = this._createTex('shadow_rect', 32, 8);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(2, 1, 28, 6);
        this._finish(canvas);
    }

    // ═══════════════════════════════════════════════════════
    // WEAPONS & COMBAT
    // ═══════════════════════════════════════════════════════

    _genBullet() {
        const { canvas, ctx } = this._createTex('bullet', 6, 3);
        this._rect(ctx, 0, 0, 4, 3, '#ffee88');
        this._rect(ctx, 4, 0, 2, 3, '#ffffff');
        this._rect(ctx, 1, 1, 3, 1, '#ffffff', 0.6);
        this._finish(canvas);
    }

    _genMuzzleFlash() {
        const { canvas, ctx } = this._createTex('muzzle_flash', 10, 10);
        const _ = '.';
        const Y = '#ffee44';
        const O = '#ffaa22';
        const W = '#ffffff';

        this._drawPixelMap(ctx, [
            [_, _, _, _, Y, Y, _, _, _, _],
            [_, _, _, Y, O, O, Y, _, _, _],
            [_, _, Y, O, W, W, O, Y, _, _],
            [_, Y, O, W, W, W, W, O, Y, _],
            [Y, O, W, W, W, W, W, W, O, Y],
            [Y, O, W, W, W, W, W, W, O, Y],
            [_, Y, O, W, W, W, W, O, Y, _],
            [_, _, Y, O, W, W, O, Y, _, _],
            [_, _, _, Y, O, O, Y, _, _, _],
            [_, _, _, _, Y, Y, _, _, _, _],
        ], 0, 0);
        this._finish(canvas);
    }

    _genLootPistol() {
        const { canvas, ctx } = this._createTex('loot_pistol', 14, 10);
        const M = '#aaa'; const D = '#777'; const H = '#ccc'; const G = '#555';
        // Slide
        this._rect(ctx, 2, 1, 10, 3, M);
        this._rect(ctx, 2, 1, 10, 1, H, 0.5);
        // Grip
        this._rect(ctx, 3, 4, 4, 5, D);
        this._rect(ctx, 3, 4, 1, 5, G);
        // Barrel
        this._rect(ctx, 12, 2, 2, 2, D);
        // Trigger
        this._rect(ctx, 6, 5, 1, 2, G);
        this._finish(canvas);
    }

    _genLootSMG() {
        const { canvas, ctx } = this._createTex('loot_smg', 18, 10);
        const M = '#888'; const D = '#666'; const H = '#aaa'; const G = '#444';
        // Body
        this._rect(ctx, 2, 2, 14, 3, M);
        this._rect(ctx, 2, 2, 14, 1, H, 0.4);
        // Stock
        this._rect(ctx, 0, 2, 3, 3, D);
        // Grip
        this._rect(ctx, 8, 5, 3, 4, D);
        this._rect(ctx, 8, 5, 1, 4, G);
        // Barrel
        this._rect(ctx, 16, 3, 2, 1, D);
        // Magazine
        this._rect(ctx, 5, 5, 2, 5, G);
        this._finish(canvas);
    }

    _genLootShotgun() {
        const { canvas, ctx } = this._createTex('loot_shotgun', 22, 8);
        const W = '#6a4a2a'; const D = '#4a2a10'; const M = '#888'; const H = '#aaa';
        // Stock (wood)
        this._rect(ctx, 0, 2, 6, 4, W);
        this._rect(ctx, 0, 2, 6, 1, '#8a6a3a', 0.4);
        // Receiver
        this._rect(ctx, 6, 2, 6, 3, M);
        this._rect(ctx, 6, 2, 6, 1, H, 0.3);
        // Barrel
        this._rect(ctx, 12, 3, 10, 2, D);
        this._rect(ctx, 12, 3, 10, 1, M, 0.3);
        // Trigger
        this._rect(ctx, 9, 5, 1, 2, '#444');
        this._finish(canvas);
    }

    _genLootRifle() {
        const { canvas, ctx } = this._createTex('loot_rifle', 24, 10);
        const M = '#3a3a3a'; const D = '#222'; const H = '#555'; const G = '#444';
        // Stock
        this._rect(ctx, 0, 3, 5, 4, M);
        // Body
        this._rect(ctx, 5, 2, 12, 4, M);
        this._rect(ctx, 5, 2, 12, 1, H, 0.3);
        // Barrel
        this._rect(ctx, 17, 3, 7, 2, D);
        this._rect(ctx, 17, 3, 7, 1, H, 0.2);
        // Grip
        this._rect(ctx, 10, 6, 3, 4, G);
        // Magazine
        this._rect(ctx, 7, 6, 2, 4, D);
        // Scope
        this._rect(ctx, 8, 0, 6, 2, H);
        this._rect(ctx, 9, 0, 4, 1, '#66aacc', 0.6);
        this._finish(canvas);
    }

    _genLootSniper() {
        const { canvas, ctx } = this._createTex('loot_sniper', 28, 10);
        const M = '#2a4a2a'; const D = '#1a3a1a'; const H = '#4a6a4a'; const G = '#333';
        // Stock
        this._rect(ctx, 0, 3, 6, 4, M);
        this._rect(ctx, 0, 3, 2, 4, D);
        // Body
        this._rect(ctx, 6, 2, 12, 4, M);
        this._rect(ctx, 6, 2, 12, 1, H, 0.3);
        // Long barrel
        this._rect(ctx, 18, 3, 10, 2, D);
        this._rect(ctx, 18, 3, 10, 1, H, 0.2);
        // Grip
        this._rect(ctx, 11, 6, 3, 4, G);
        // Magazine
        this._rect(ctx, 8, 6, 2, 3, D);
        // Big scope
        this._rect(ctx, 8, 0, 8, 2, '#555');
        this._rect(ctx, 9, 0, 6, 1, '#4488cc', 0.7);
        // Bipod
        this._rect(ctx, 16, 6, 1, 3, G);
        this._rect(ctx, 18, 6, 1, 3, G);
        this._finish(canvas);
    }

    _genLootAmmo() {
        const { canvas, ctx } = this._createTex('loot_ammo', 12, 10);
        const G = '#2a6a2a'; const D = '#1a4a1a'; const H = '#4a8a4a';
        // Box
        this._rect(ctx, 1, 1, 10, 8, G);
        this._rect(ctx, 0, 0, 12, 1, D);
        this._rect(ctx, 0, 9, 12, 1, D);
        this._rect(ctx, 0, 0, 1, 10, D);
        this._rect(ctx, 11, 0, 1, 10, D);
        // Highlight
        this._rect(ctx, 1, 1, 10, 1, H, 0.4);
        // Ammo icon (bullets)
        this._rect(ctx, 3, 3, 1, 4, '#ccaa44');
        this._rect(ctx, 5, 3, 1, 4, '#ccaa44');
        this._rect(ctx, 7, 3, 1, 4, '#ccaa44');
        this._rect(ctx, 9, 3, 1, 4, '#ccaa44');
        this._finish(canvas);
    }

    // ═══════════════════════════════════════════════════════
    // VEHICLES — Top-down pixel art
    // ═══════════════════════════════════════════════════════

    _genVehicleCar() {
        const { canvas, ctx } = this._createTex('vehicle_car', 20, 36);
        const B = '#2266aa'; // body
        const D = '#1a4a80'; // body dark
        const W = '#223344'; // windshield
        const L = '#ccddee'; // headlight
        const R = '#cc2222'; // taillight
        const T = '#111111'; // tire
        const M = '#888888'; // metal
        const H = '#4488cc'; // highlight

        // Body
        this._rect(ctx, 3, 4, 14, 28, B);
        // Hood gradient
        this._rect(ctx, 3, 4, 14, 3, H, 0.4);
        // Roof
        this._rect(ctx, 4, 14, 12, 8, D);
        // Windshield (front)
        this._rect(ctx, 5, 10, 10, 4, W);
        this._rect(ctx, 5, 10, 10, 1, '#4466aa', 0.4);
        // Rear window
        this._rect(ctx, 5, 24, 10, 3, W);
        // Headlights
        this._rect(ctx, 4, 4, 3, 2, L);
        this._rect(ctx, 13, 4, 3, 2, L);
        // Taillights
        this._rect(ctx, 4, 30, 3, 2, R);
        this._rect(ctx, 13, 30, 3, 2, R);
        // Bumpers
        this._rect(ctx, 3, 3, 14, 1, M);
        this._rect(ctx, 3, 32, 14, 1, M);
        // Side mirrors
        this._rect(ctx, 1, 12, 2, 2, M);
        this._rect(ctx, 17, 12, 2, 2, M);
        // Wheels
        this._rect(ctx, 1, 6, 3, 5, T);
        this._rect(ctx, 16, 6, 3, 5, T);
        this._rect(ctx, 1, 26, 3, 5, T);
        this._rect(ctx, 16, 26, 3, 5, T);
        // Door lines
        this._rect(ctx, 3, 15, 1, 10, D, 0.5);
        this._rect(ctx, 16, 15, 1, 10, D, 0.5);

        this._finish(canvas);
    }

    _genVehicleTruck() {
        const { canvas, ctx } = this._createTex('vehicle_truck', 24, 44);
        const B = '#555555'; // body grey
        const D = '#3a3a3a'; // dark
        const C = '#444444'; // cab
        const W = '#223344'; // windshield
        const L = '#ccddee'; // headlight
        const R = '#cc2222'; // taillight
        const T = '#111111'; // tire
        const M = '#777777'; // metal
        const Bd = '#4a4a4a'; // bed

        // Truck bed (back, open)
        this._rect(ctx, 3, 18, 18, 22, Bd);
        this._rect(ctx, 3, 18, 18, 1, M);
        // Bed walls
        this._rect(ctx, 3, 18, 1, 22, D);
        this._rect(ctx, 20, 18, 1, 22, D);
        this._rect(ctx, 3, 39, 18, 1, D);
        // Bed floor texture
        for (let i = 0; i < 5; i++) {
            this._rect(ctx, 4, 20 + i * 4, 16, 1, M, 0.15);
        }

        // Cab (front)
        this._rect(ctx, 2, 4, 20, 16, B);
        this._rect(ctx, 2, 4, 20, 2, M, 0.3);
        // Windshield
        this._rect(ctx, 5, 8, 14, 4, W);
        this._rect(ctx, 5, 8, 14, 1, '#446688', 0.3);
        // Roof
        this._rect(ctx, 4, 12, 16, 5, D);
        // Headlights
        this._rect(ctx, 3, 4, 4, 2, L);
        this._rect(ctx, 17, 4, 4, 2, L);
        // Taillights
        this._rect(ctx, 4, 40, 4, 2, R);
        this._rect(ctx, 16, 40, 4, 2, R);
        // Bumper
        this._rect(ctx, 2, 3, 20, 1, M);
        this._rect(ctx, 2, 42, 20, 1, M);
        // Big wheels
        this._rect(ctx, 0, 6, 3, 7, T);
        this._rect(ctx, 21, 6, 3, 7, T);
        this._rect(ctx, 0, 33, 3, 7, T);
        this._rect(ctx, 21, 33, 3, 7, T);

        this._finish(canvas);
    }

    _genVehicleBike() {
        const { canvas, ctx } = this._createTex('vehicle_bike', 10, 24);
        const F = '#cc3333'; // frame red
        const D = '#881111'; // dark
        const M = '#666666'; // metal
        const T = '#111111'; // tire
        const L = '#eedd88'; // headlight
        const S = '#444';    // seat

        // Front wheel
        this._rect(ctx, 3, 1, 4, 4, T);
        this._rect(ctx, 4, 0, 2, 1, M);
        // Headlight
        this._rect(ctx, 4, 1, 2, 1, L);
        // Handlebars
        this._rect(ctx, 1, 3, 2, 1, M);
        this._rect(ctx, 7, 3, 2, 1, M);
        // Frame
        this._rect(ctx, 4, 5, 2, 10, F);
        this._rect(ctx, 3, 6, 1, 6, D);
        // Seat
        this._rect(ctx, 3, 12, 4, 4, S);
        this._rect(ctx, 3, 12, 4, 1, '#555');
        // Engine/exhaust
        this._rect(ctx, 7, 9, 2, 3, M);
        this._rect(ctx, 8, 12, 1, 4, '#aa4400');
        // Rear wheel
        this._rect(ctx, 3, 18, 4, 5, T);
        this._rect(ctx, 4, 23, 2, 1, '#aa2222');

        this._finish(canvas);
    }

    // ═══════════════════════════════════════════════════════
    // MISSING GENERATORS (Fixing broken references)
    // ═══════════════════════════════════════════════════════

    _genTempleTextures() {
        const { canvas, ctx } = this._createTex('temple_pillar', 16, 48);
        const P = '#cbd5e1'; // light marble
        const D = '#94a3b8'; // darker stone
        const M = '#64748b'; // metal bands
        this._rect(ctx, 2, 0, 12, 48, P);
        this._rect(ctx, 2, 0, 3, 48, D, 0.3); // edge shadow
        this._rect(ctx, 0, 0, 16, 4, D); // base
        this._rect(ctx, 0, 44, 16, 4, D); // top
        this._rect(ctx, 0, 10, 16, 2, M, 0.5);
        this._rect(ctx, 0, 34, 16, 2, M, 0.5);
        this._finish(canvas);
    }

    _genInteractiveProps() {
        // Treasure Chest
        const { canvas: c1, ctx: x1 } = this._createTex('chest', 24, 20);
        this._rect(x1, 2, 2, 20, 16, '#8a6a3a');
        this._rect(x1, 2, 2, 20, 5, '#5c4033'); // lid
        this._rect(x1, 10, 5, 4, 2, '#fbbf24'); // lock
        this._finish(c1);

        // Locked Chest
        const { canvas: c1L, ctx: x1L } = this._createTex('chest_locked', 24, 20);
        this._rect(x1L, 2, 2, 20, 16, '#475569'); // darker/iron
        this._rect(x1L, 2, 2, 20, 5, '#1e293b');
        this._rect(x1L, 10, 5, 4, 3, '#94a3b8'); // silver lock
        this._finish(c1L);

        // Well
        const { canvas: c2, ctx: x2 } = this._createTex('well', 32, 32);
        this._rect(x2, 4, 4, 24, 24, '#64748b'); // stone ring
        this._rect(x2, 8, 8, 16, 16, '#1e3a8a'); // water inside
        this._finish(c2);

        // Explosive Barrel
        const { canvas: c3, ctx: x3 } = this._createTex('barrel_red', 16, 22);
        this._rect(x3, 2, 2, 12, 18, '#dc2626');
        this._rect(x3, 2, 4, 12, 2, '#000', 0.4); // bands
        this._rect(x3, 2, 14, 12, 2, '#000', 0.4);
        this._rect(x3, 6, 8, 4, 4, '#fbbf24'); // hazard symbol
        this._finish(c3);
    }

    _genTrapTextures() {
        // Spike Trap
        const { canvas: c1, ctx: x1 } = this._createTex('trap_spikes', 32, 32);
        this._rect(x1, 2, 2, 28, 28, '#475569'); // plate
        for(let i=0; i<4; i++) {
            for(let j=0; j<4; j++) {
                this._rect(x1, 6+i*6, 6+j*6, 2, 2, '#cbd5e1'); // spikes
            }
        }
        this._finish(c1);

        // Pressure Plate
        const { canvas: c2, ctx: x2 } = this._createTex('pressure_plate', 24, 24);
        this._rect(x2, 2, 2, 20, 20, '#64748b');
        this._rect(x2, 6, 6, 12, 12, '#94a3b8'); // center button
        this._finish(c2);

        // Moving Blade
        const { canvas: c3, ctx: x3 } = this._createTex('trap_blade', 48, 12);
        this._rect(x3, 0, 4, 48, 4, '#94a3b8'); // blade edge
        this._rect(x3, 0, 4, 48, 1, '#fff', 0.5); // sharpen highlight
        this._finish(c3);
    }

    _genEnvDetailTextures() {
        // Road Crack
        const { canvas: c1, ctx: x1 } = this._createTex('road_crack', 32, 32);
        x1.strokeStyle = 'rgba(0,0,0,0.4)';
        x1.lineWidth = 1;
        x1.beginPath();
        x1.moveTo(5, 5); x1.lineTo(25, 25);
        x1.moveTo(25, 5); x1.lineTo(5, 25);
        x1.stroke();
        this._finish(c1);

        // Dirt Patch
        const { canvas: c2, ctx: x2 } = this._createTex('dirt_patch', 48, 48);
        const grad = x2.createRadialGradient(24, 24, 0, 24, 24, 24);
        grad.addColorStop(0, 'rgba(120, 80, 40, 0.4)');
        grad.addColorStop(1, 'rgba(120, 80, 40, 0)');
        x2.fillStyle = grad;
        x2.fillRect(0, 0, 48, 48);
        this._finish(c2);
    }

    _genKeyIcons() {
        const { canvas, ctx } = this._createTex('loot_key', 12, 12);
        const K = '#fbbf24'; // gold
        this._rect(ctx, 4, 1, 4, 4, K); // head
        this._rect(ctx, 5, 2, 2, 2, '#000', 0.5); // head hole
        this._rect(ctx, 5, 5, 2, 6, K); // shaft
        this._rect(ctx, 7, 7, 2, 1, K); // teeth
        this._rect(ctx, 7, 9, 2, 1, K);
        this._finish(canvas);
    }
}
