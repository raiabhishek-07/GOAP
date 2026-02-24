# 🎮 MINDARENA: BATTLE OF INTELLIGENCE
## Complete Professional Game Development Plan

> **Document Version:** 1.0  
> **Date:** February 22, 2026  
> **Engine:** Phaser 3 (Primary) + React (Overlay UI)  
> **Platform:** Web Browser (Desktop-First)  

---

## TABLE OF CONTENTS

1. [Current State Audit](#1-current-state-audit)
2. [Vision & Design Philosophy](#2-vision--design-philosophy)
3. [Architecture Overhaul](#3-architecture-overhaul)
4. [Phase 1 — Game Shell & Scene Management](#4-phase-1--game-shell--scene-management)
5. [Phase 2 — Boot, Preload & Asset Pipeline](#5-phase-2--boot-preload--asset-pipeline)
6. [Phase 3 — Main Menu (Full Game UI)](#6-phase-3--main-menu-full-game-ui)
7. [Phase 4 — Player Controller & Combat System](#7-phase-4--player-controller--combat-system)
8. [Phase 5 — Enemy AI & Entity System](#8-phase-5--enemy-ai--entity-system)
9. [Phase 6 — Level Design & World Building](#9-phase-6--level-design--world-building)
10. [Phase 7 — In-Game HUD (Phaser-Native)](#10-phase-7--in-game-hud-phaser-native)
11. [Phase 8 — Audio, Particles & Juice](#11-phase-8--audio-particles--juice)
12. [Phase 9 — Progression, Scoring & Save System](#12-phase-9--progression-scoring--save-system)
13. [Phase 10 — Polish, Testing & Deployment](#13-phase-10--polish-testing--deployment)
14. [File Structure (Final)](#14-file-structure-final)
15. [Implementation Priority Matrix](#15-implementation-priority-matrix)

---

## 1. CURRENT STATE AUDIT

### What Exists (Green ✅)
| File | Purpose | Status |
|---|---|---|
| `app/game/page.js` | React page wrapper, menu state | ✅ Works |
| `app/game/page.module.css` | CSS for a website-style menu | ⚠️ Needs full rethink |
| `MindArena.js` | Phaser initializer + Game Over overlay | ✅ Works |
| `Level1_1.js` | Level scene with player, agent, stalkers, orbs | ✅ Works (basic) |
| `BaseSurvivor.js` | Polymorphic character base class | ✅ Solid foundation |
| `GamePlayer.js` | Player input, damage, power collection | ✅ Works |
| `GameAgent.js` | GOAP AI visual entity | ✅ Works |
| `ShadowStalker.js` | Hostile zombie with red aura | ✅ Works |
| `MindOrb.js` | Collectible power orb | ✅ Works |
| `WorldGenerator.js` | Procedural rocks + tech scraps | ⚠️ Basic |
| `LevelConfig.js` | Level spatial data | ⚠️ Needs expansion |
| `AnalyticsManager.js` | Score tracking | ⚠️ Not integrated |
| `lib/goap/engine.js` | Core GOAP AI engine | ✅ Solid, battle-tested |
| `lib/goap/agent.js` | Agent beliefs, actions, goals | ✅ Solid |

### What's Wrong (Red ❌)
| Problem | Impact | Root Cause |
|---|---|---|
| **Menu is a React webpage, not a game screen** | Feels like a website, not a game | Menu is built with React/CSS, lives outside Phaser |
| **No Phaser scene management** | Can't transition between Boot → Menu → Level | Only one scene exists (`Level1_1`) |
| **No preloader or loading screen** | Feels janky on start | No `Preload` scene |
| **HUD is bare-bones Phaser text** | Doesn't look like a professional game HUD | No structured HUD scene or UI layer |
| **No camera system** | Can't follow player or zoom | Default static camera |
| **No tile/sprite assets** | Everything is drawn with Graphics primitives | No asset pipeline |
| **No sound design** | Silent game feels empty | Audio explicitly disabled |
| **No pause screen** | Can't pause during gameplay | No pause state |
| **World is tiny and flat** | 1200×700 is one static screen | No world scrolling, no camera follow |
| **Enemies just wander** | Stalkers use basic GOAP but don't really "hunt" | GOAP destinations don't include "player chase" well |
| **No death/win animations** | Game over is a React overlay, not a game transition | React handles what should be Phaser's job |
| **Player has no attack** | Player can only run, not fight back | No combat input or weapon system |
| **No minimap** | In a larger world, navigation is impossible | Not implemented |

---

## 2. VISION & DESIGN PHILOSOPHY

### The Core Principle
> **Everything the player sees and touches must live inside Phaser.**  
> React's only job is to mount/destroy the Phaser canvas.

This means:
- ❌ No React-based menus
- ❌ No React-based HUD overlays
- ❌ No React-based game over screens
- ✅ All UI rendered as Phaser scenes or overlays
- ✅ Scene transitions handled by Phaser's `SceneManager`
- ✅ React is just the "launcher" — one `<div>` that holds the canvas

### Game Feel Reference
Think of these games as visual inspiration:
- **Vampire Survivors** — top-down, swarm enemies, auto-attack, power-ups, satisfying kills
- **PUBG/Fortnite Menus** — cinematic backgrounds, smooth transitions, rank displays
- **Diablo/Path of Exile** — dark atmosphere, glowing effects, loot feedback
- **Hades** — incredible UI, every button feels alive

### Design Rules
1. **Dark, atmospheric, neon-accented** color palette (slate/navy base, cyan/amber/red accents)
2. **Every interaction must have feedback** — sound, particles, screen shake, tween
3. **UI elements are Phaser GameObjects** — containers, bitmapText, nineslice panels
4. **Camera follows the player** — the world is bigger than the screen
5. **Enemies telegraph their attacks** — visual + audio cue before damage

---

## 3. ARCHITECTURE OVERHAUL

### Current Flow (Broken)
```
React Page → React Menu → Mount Phaser → Level1_1 Scene
     ↑                                        |
     └── React GameOver Overlay ←──────────────┘
```

### Target Flow (Professional)
```
React Page → Mount Phaser (ONCE) → BootScene → PreloadScene → MainMenuScene
                                                                    |
                                                           ┌────────┴────────┐
                                                           ↓                 ↓
                                                    SinglePlayer        Settings
                                                           |
                                                    LevelSelect
                                                           |
                                                     GameScene (Level1_1, 1_2, etc.)
                                                           |
                                                    ┌──────┴──────┐
                                                    ↓             ↓
                                              PauseOverlay   GameOverScene
                                                              |
                                                        ScoreboardScene
                                                              |
                                                        MainMenuScene
```

### Scene Registry (All Phaser Scenes)
| Scene Key | Purpose | Type |
|---|---|---|
| `BootScene` | Load minimal assets (logo, loading bar texture) | Sequential |
| `PreloadScene` | Load ALL game assets, show loading bar | Sequential |
| `MainMenuScene` | Animated main menu with buttons | Standalone |
| `SettingsScene` | Audio, controls, display settings | Overlay |
| `LevelSelectScene` | World map / level grid | Standalone |
| `GameScene` | The actual gameplay (replaces Level1_1) | Standalone |
| `GameHUD` | Health, power, minimap, timer | Parallel overlay |
| `PauseScene` | Pause menu overlay | Overlay |
| `GameOverScene` | Death screen with score | Standalone |
| `VictoryScene` | Level complete with rewards | Standalone |

---

## 4. PHASE 1 — GAME SHELL & SCENE MANAGEMENT

### Goal
Strip React down to a pure launcher. Move ALL game logic into Phaser scenes.

### Step 1.1 — Simplify `app/game/page.js`
```javascript
// The ENTIRE page becomes this:
"use client";
import dynamic from "next/dynamic";
const GameLauncher = dynamic(() => import("../components/game/GameLauncher"), { ssr: false });

export default function GamePage() {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
            <GameLauncher />
        </div>
    );
}
```
- No Navbar import
- No React state management
- No CSS module
- Full viewport, zero padding
- React's job is DONE after this render

### Step 1.2 — Create `GameLauncher.js` (replaces `MindArena.js`)
```javascript
// GameLauncher.js — The single React↔Phaser bridge
"use client";
import React, { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { GameScene } from "./scenes/GameScene";
import { GameHUD } from "./scenes/GameHUD";
import { PauseScene } from "./scenes/PauseScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { VictoryScene } from "./scenes/VictoryScene";

export default function GameLauncher() {
    const containerRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || gameRef.current) return;

        const config = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#000000',
            scale: {
                mode: Phaser.Scale.RESIZE,  // Auto-resize to fill viewport
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            },
            scene: [
                BootScene, PreloadScene, MainMenuScene, 
                LevelSelectScene, GameScene, GameHUD,
                PauseScene, GameOverScene, VictoryScene
            ],
            // Audio will be enabled in Phase 8
            audio: { noAudio: true },
            render: {
                pixelArt: false,
                antialias: true,
                antialiasGL: true
            }
        };

        gameRef.current = new Phaser.Game(config);

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
```

### Step 1.3 — Create Scene Template
Every scene follows this pattern:
```javascript
export class ExampleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExampleScene' });
    }
    
    init(data) {
        // Receive data from previous scene
        this.transitionData = data;
    }
    
    preload() {
        // Load scene-specific assets if any
    }
    
    create() {
        // Build the scene
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
    
    transitionTo(sceneKey, data = {}) {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(sceneKey, data);
        });
    }
}
```

### Files to Create
- `app/components/game/GameLauncher.js`
- `app/components/game/scenes/BootScene.js`

### Files to Delete/Archive
- `app/game/page.module.css` → delete (no more React UI)
- `app/components/game/MindArena.js` → replaced by `GameLauncher.js`

---

## 5. PHASE 2 — BOOT, PRELOAD & ASSET PIPELINE

### Goal
Professional loading experience. Generate procedural textures at boot time.

### Step 2.1 — `BootScene` (loads in < 1 second)
Responsibilities:
- Create a tiny procedural "logo" texture
- Create loading bar background texture
- Transition immediately to `PreloadScene`

### Step 2.2 — `PreloadScene` (the main loading screen)
Responsibilities:
- Show the MindArena logo (procedural or generated image)
- Animated loading bar with percentage
- Loading tips text that cycles
- Generate ALL procedural textures:

**Procedural Texture Registry:**
| Texture Key | Description | Size |
|---|---|---|
| `particle_glow` | Soft white circle for particles | 32×32 |
| `particle_spark` | Sharp star for combat effects | 16×16 |
| `orb_cyan` | Cyan power orb sprite | 32×32 |
| `orb_gold` | Gold experience orb | 32×32 |
| `health_potion` | Red health pickup | 24×24 |
| `shield_icon` | Blue shield icon | 24×24 |
| `player_body` | Player character sprite (multi-frame) | 32×48 |
| `stalker_body` | Shadow Stalker sprite | 32×48 |
| `rock_small` | Environmental rock | 24×24 |
| `rock_large` | Large environmental rock | 48×48 |
| `tree_dead` | Dead tree silhouette | 32×64 |
| `crate_tech` | Tech crate obstacle | 32×32 |
| `station_food` | Food station building | 64×64 |
| `station_rest` | Rest station building | 64×64 |
| `btn_normal` | UI button nine-slice (normal) | 48×16 |
| `btn_hover` | UI button nine-slice (hover) | 48×16 |
| `panel_dark` | UI panel nine-slice | 48×48 |
| `minimap_bg` | Minimap background | 200×200 |

All textures are **procedurally generated** using `Phaser.GameObjects.Graphics` → `RenderTexture.saveTexture()`. No external image files needed.

### Step 2.3 — Procedural Texture Generator Utility
```
app/lib/game/TextureFactory.js
```
This class provides static methods:
- `TextureFactory.generateAllTextures(scene)` — called during PreloadScene
- `TextureFactory.createGlowTexture(scene, key, size, color)`
- `TextureFactory.createButtonTexture(scene, key, w, h, color, borderColor)`
- `TextureFactory.createPanelTexture(scene, key, w, h)`
- `TextureFactory.createCharacterTexture(scene, key, skinColor, hairColor, bodyColor)`

### Files to Create
- `app/components/game/scenes/PreloadScene.js`
- `app/lib/game/TextureFactory.js`

---

## 6. PHASE 3 — MAIN MENU (FULL GAME UI)

### Goal
A cinematic main menu rendered entirely inside Phaser. No React.

### Step 3.1 — `MainMenuScene`
**Visual Layout:**
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   [Animated particle background]                     │
│                                                      │
│            ╔══════════════════════╗                   │
│            ║   M I N D A R E N A ║   ← Glitch text   │
│            ║  BATTLE OF INTEL.   ║                   │
│            ╚══════════════════════╝                   │
│                                                      │
│         ┌─────────────────────────┐                  │
│         │   ▶ START CAMPAIGN      │  ← Big buttons   │
│         ├─────────────────────────┤                  │
│         │   ⚙ SETTINGS            │                  │
│         ├─────────────────────────┤                  │
│         │   📊 LEADERBOARD        │                  │
│         ├─────────────────────────┤                  │
│         │   ❌ QUIT               │                  │
│         └─────────────────────────┘                  │
│                                                      │
│   [v0.1.0 ALPHA]              [GOAP AI POWERED]      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Implementation Details:**
- **Background**: Slow-moving particle field (stars/dust) using Phaser particle emitter
- **Title**: Large bitmap text with a per-character wave animation + glitch flicker
- **Buttons**: Procedural nine-slice panels with hover scale/glow tweens
- **Music**: (Phase 8) Ambient dark synth loop
- **Transition**: Camera fade-out on button press → target scene

### Step 3.2 — `UIFactory` Utility
A reusable UI builder for consistent game-wide styling:
```javascript
class UIFactory {
    static createButton(scene, x, y, text, onClick) { ... }
    static createPanel(scene, x, y, w, h) { ... }
    static createTitle(scene, x, y, text, size) { ... }
    static createProgressBar(scene, x, y, w, h, value, maxValue, color) { ... }
}
```

### Files to Create
- `app/components/game/scenes/MainMenuScene.js`
- `app/components/game/scenes/LevelSelectScene.js`
- `app/components/game/scenes/SettingsScene.js`
- `app/lib/game/UIFactory.js`

---

## 7. PHASE 4 — PLAYER CONTROLLER & COMBAT SYSTEM

### Goal
Transform the player from a "thing that moves" into a character that fights.

### Step 4.1 — Enhanced Player Controller
**Current:** WASD/Arrows move, that's it.  
**Target:**

| Input | Action | Feedback |
|---|---|---|
| WASD / Arrows | 8-directional movement | Dust particles behind player |
| SPACE | Melee attack (swing) | Weapon arc graphic, damage zone |
| SHIFT | Dash/dodge (short burst) | Ghost trail + i-frames |
| E | Interact (pick up items, use stations) | UI prompt when near interactable |
| TAB | Toggle minimap zoom | Minimap expands/contracts |
| ESC | Pause menu | Opens PauseScene overlay |

### Step 4.2 — Combat System Design
```
MELEE ATTACK:
  - Player presses SPACE
  - A 90° arc appears in front of the player (based on last movement direction)
  - Any enemy in the arc takes damage (15-25 per hit)
  - 0.4s cooldown between swings
  - Each kill: +5 Power, +15 Score
  - Visual: white slash arc that fades out

DASH/DODGE:
  - Player presses SHIFT
  - Player moves 150px instantly in movement direction
  - 0.15s of invincibility frames
  - 2.0s cooldown
  - Uses 10 stamina
  - Visual: afterimage ghost trail (3 copies, fading)

DAMAGE RECEIVED:
  - Screen shake (existing ✅)
  - Red vignette flash at screen edges
  - I-frames for 0.5s (existing ✅)
  - Health bar flash red
  - Hit direction indicator (red arrow at screen edge)
```

### Step 4.3 — Weapon/Attack Visualizer
```javascript
class MeleeAttack extends Phaser.GameObjects.Graphics {
    // Draws a 90° arc in the player's facing direction
    // Checks overlap with enemy hitboxes
    // Auto-destroys after 0.2s
}
```

### Step 4.4 — Stamina System
- Max stamina: 100
- Dash costs: 10 stamina
- Regeneration: 5/sec while not dashing
- At 0 stamina: can't dash, movement speed reduced 30%
- Near Rest Station: regen rate triples

### Files to Modify
- `app/components/game/entities/GamePlayer.js` — major expansion

### Files to Create
- `app/components/game/entities/MeleeAttack.js`

---

## 8. PHASE 5 — ENEMY AI & ENTITY SYSTEM

### Goal
Make enemies feel intelligent, threatening, and varied.

### Step 5.1 — Enemy Types
| Type | Speed | Health | Damage | AI Behavior | Visual |
|---|---|---|---|---|---|
| **Shadow Stalker** | 110 | 60 | 10/hit | Chase + attack (GOAP) | Grey body, red eyes, red aura |
| **Brute** | 60 | 150 | 25/hit | Slow chase, heavy attack | Large body, dark purple, ground slam |
| **Swarm Drone** | 180 | 20 | 5/hit | Direct beeline to player | Tiny, green glow, dies in 1 hit |
| **Tactician** | 90 | 80 | 15/hit | Uses GOAP strategically (heals, flanks) | Blue body, shield icon |
| **Boss: Arbiter** | 70 | 500 | 30/hit | Multi-phase GOAP, summons drones | Large, golden aura, multiple attacks |

### Step 5.2 — Enemy Spawner System
```javascript
class EnemySpawner {
    constructor(scene, config) {
        this.scene = scene;
        this.pool = [];         // Object pool for recycling
        this.maxActive = 30;    // Perf limit
        this.waveNumber = 0;
        this.spawnTimer = null;
    }

    startWave(waveConfig) {
        // waveConfig = { enemies: [{type, count, delay}], duration }
    }

    spawnEnemy(type, x, y) {
        // Pull from pool or create new
        // Assign GOAP brain based on type
    }

    recycleEnemy(enemy) {
        // Return to pool instead of destroying
    }
}
```

### Step 5.3 — Wave Configuration (Level 1.1)
```javascript
const WAVE_CONFIG = {
    waves: [
        { 
            delay: 5,  // seconds before wave starts
            enemies: [
                { type: 'stalker', count: 3, spawnDelay: 1.0 }
            ]
        },
        {
            delay: 30,
            enemies: [
                { type: 'stalker', count: 5, spawnDelay: 0.8 },
                { type: 'drone', count: 8, spawnDelay: 0.3 }
            ]
        },
        {
            delay: 60,
            enemies: [
                { type: 'brute', count: 2, spawnDelay: 2.0 },
                { type: 'stalker', count: 6, spawnDelay: 0.6 },
                { type: 'drone', count: 12, spawnDelay: 0.2 }
            ]
        }
    ]
};
```

### Step 5.4 — Enemy Death Effects
When an enemy dies:
1. **Freeze frame** (50ms pause effect via time scale)
2. **Particle burst** (8-12 particles in enemy's color)
3. **Drop loot** (health orb, power orb, or nothing — weighted random)
4. **Score popup** (+15, +25 etc. floating text)
5. **Screen flash** (subtle white flash for 1 frame)

### Files to Create
- `app/components/game/entities/Brute.js`
- `app/components/game/entities/SwarmDrone.js`
- `app/components/game/entities/Tactician.js`
- `app/lib/game/EnemySpawner.js`
- `app/lib/game/WaveConfig.js`

### Files to Modify
- `app/components/game/entities/ShadowStalker.js` — death effects, loot drops

---

## 9. PHASE 6 — LEVEL DESIGN & WORLD BUILDING

### Goal
A world that's bigger than the screen, with camera tracking, varied terrain, and environmental storytelling.

### Step 6.1 — World Size & Camera
**Current:** 1200×700 (exactly one screen)  
**Target:** 2400×1600 (4× larger, camera follows player)

```javascript
// In GameScene.create():
this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
this.cameras.main.setZoom(1.0);
this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
```

### Step 6.2 — Terrain Zones
The world is divided into themed zones:

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────┐        ┌──────────┐          │
│   │  FOOD   │        │   REST   │   NORTH  │
│   │ STATION │        │  STATION │   ZONE   │
│   └─────────┘        └──────────┘  (Safe)  │
│                                             │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│              COMBAT ZONE                    │
│        (Enemy spawn area)                   │
│                                             │
│    [Rocks] [Crates]  ★Player   [Trees]      │
│                      Spawn                  │
│                                             │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│                                             │
│   ┌──────────┐       ┌──────────┐  SOUTH   │
│   │  WEAPON  │       │  PORTAL  │   ZONE   │
│   │  CACHE   │       │ (Exit)   │(Danger)  │
│   └──────────┘       └──────────┘          │
│                                             │
└─────────────────────────────────────────────┘
```

### Step 6.3 — Environmental Objects
| Object | Behavior | Visual |
|---|---|---|
| **Rocks** | Block movement (physics body) | Jagged grey polygons (existing) |
| **Dead Trees** | Block movement, destructible (3 hits) | Dark trunk + bare branches |
| **Tech Crates** | Destructible, drops loot | Glowing blue box |
| **Fog Zones** | Reduce visibility (circular dark overlay) | Semi-transparent dark circle |
| **Lava Pools** | Damage over time if walked through | Red/orange animated glow |
| **Walls/Barriers** | Impassable, define zone boundaries | Dark concrete texture |
| **Portal** | Level exit (activated when objective complete) | Swirling cyan vortex animation |

### Step 6.4 — World Generator Upgrade
```javascript
class WorldGenerator {
    static generate(scene, worldW, worldH, levelConfig) {
        this.generateTerrain(scene, worldW, worldH);
        this.generateObstacles(scene, levelConfig.obstacles);
        this.generateStations(scene, levelConfig.stations);
        this.generateFogZones(scene, levelConfig.fogZones);
        this.generatePortal(scene, levelConfig.exitPortal);
        this.generateDecorations(scene, worldW, worldH);
    }
}
```

### Step 6.5 — Level Config Expansion
```javascript
export const LEVEL_1_1 = {
    name: "Survival Basics",
    objective: "COLLECT 5 ORBS & REACH THE PORTAL",
    worldSize: { w: 2400, h: 1600 },
    stations: [
        { type: 'food', x: 400, y: 300 },
        { type: 'rest', x: 1800, y: 300 },
        { type: 'weapon', x: 400, y: 1300 }
    ],
    playerSpawn: { x: 1200, y: 800 },
    exitPortal: { x: 2000, y: 1400 },
    obstacles: [
        { type: 'rock_cluster', x: 800, y: 600, count: 5 },
        { type: 'wall_h', x: 600, y: 1000, length: 400 },
        // ... more
    ],
    fogZones: [
        { x: 1600, y: 1000, radius: 200 }
    ],
    waves: [ /* ... wave config ... */ ],
    orbCount: 8,
    orbPositions: 'random', // or explicit [{x,y}, ...]
    par: { time: 120, score: 5000 } // Target for S-rank
};
```

### Files to Modify
- `app/lib/game/WorldGenerator.js` — major expansion
- `app/lib/game/LevelConfig.js` — restructure entirely

### Files to Create
- `app/components/game/scenes/GameScene.js` (replaces Level1_1)
- `app/components/game/objects/Portal.js`
- `app/components/game/objects/FogZone.js`
- `app/components/game/objects/TechCrate.js`
- `app/components/game/objects/LavaPool.js`

---

## 10. PHASE 7 — IN-GAME HUD (PHASER-NATIVE)

### Goal
A professional game HUD rendered as a Phaser scene running in parallel with GameScene.

### Step 7.1 — HUD Layout
```
┌──────────────────────────────────────────────────────┐
│  ┌──────────────┐                    ┌─────────────┐ │
│  │ ❤️ ████████░░ │  80/100           │  ⏱ 01:23    │ │
│  │ ⚡ ██████░░░░ │  60/100           │  🏆 2,450   │ │
│  │ 🔮 ████░░░░░░ │  40%             │  ☠ 12 kills │ │
│  └──────────────┘                    └─────────────┘ │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│  ┌─────────────┐                   ┌────────────────┐│
│  │  OBJECTIVE   │                   │   [MINIMAP]   ││
│  │ Collect 3    │                   │   ┌───────┐   ││
│  │ more orbs    │                   │   │  •P   │   ││
│  └─────────────┘                   │   │ •E •E │   ││
│                                    │   └───────┘   ││
│  [SPACE] Attack  [SHIFT] Dash      └────────────────┘│
└──────────────────────────────────────────────────────┘
```

### Step 7.2 — HUD Components
| Component | Position | Data Source |
|---|---|---|
| **Health Bar** | Top-left | `player.health` |
| **Stamina Bar** | Top-left (below health) | `player.stamina` |
| **Power Meter** | Top-left (below stamina) | `player.power` |
| **Timer** | Top-right | Scene elapsed time |
| **Score** | Top-right | `AnalyticsManager` |
| **Kill Counter** | Top-right | Scene kill count |
| **Objective Panel** | Bottom-left | Level config |
| **Control Hints** | Bottom-left (below objective) | Static |
| **Minimap** | Bottom-right | Camera + entity positions |
| **Wave Indicator** | Top-center | `EnemySpawner.waveNumber` |
| **Boss Health Bar** | Top-center | Boss entity (when active) |

### Step 7.3 — Minimap Implementation
```javascript
class Minimap {
    constructor(scene, x, y, w, h, worldW, worldH) {
        this.container = scene.add.container(x, y);
        this.bg = scene.add.graphics();
        this.scaleX = w / worldW;
        this.scaleY = h / worldH;
        // Draw static elements (stations, walls) once
        // Update dynamic elements (player, enemies) every frame
    }

    update(playerPos, enemies, orbs) {
        // Clear dynamic dots
        // Draw player as green dot
        // Draw enemies as red dots
        // Draw orbs as cyan dots
    }
}
```

### Step 7.4 — HUD Scene (Parallel)
The HUD runs as a **separate Phaser scene** launched in parallel:
```javascript
// In GameScene.create():
this.scene.launch('GameHUD', { player: this.player, spawner: this.spawner });
```

Key advantage: HUD uses its own camera that doesn't scroll, while GameScene camera follows the player.

### Files to Create
- `app/components/game/scenes/GameHUD.js`
- `app/components/game/ui/Minimap.js`
- `app/components/game/ui/HealthBar.js`
- `app/components/game/ui/ObjectivePanel.js`

---

## 11. PHASE 8 — AUDIO, PARTICLES & JUICE

### Goal
Make the game FEEL incredible. Every action should have satisfying feedback.

### Step 8.1 — Procedural Audio (Web Audio API)
Since we want zero external dependencies, we'll generate sounds procedurally:

```javascript
class SoundFactory {
    static generateHitSound(scene) { /* short noise burst */ }
    static generatePickupSound(scene) { /* ascending chime */ }
    static generateDashSound(scene) { /* whoosh */ }
    static generateDeathSound(scene) { /* low boom */ }
    static generateMenuClick(scene) { /* soft click */ }
    static generateAmbientLoop(scene) { /* dark drone */ }
}
```

Alternative: Use the Phaser `BaseSoundManager` with small generated `AudioBuffer` objects.

### Step 8.2 — Particle Systems
| Event | Particles | Description |
|---|---|---|
| **Player movement** | Dust trail | Small grey puffs behind feet |
| **Player dash** | Ghost trail | 3 fading copies of player |
| **Player attack** | Slash arc | White curved line |
| **Enemy death** | Color burst | 12 particles in enemy's theme color |
| **Orb collection** | Sparkle implosion | Cyan particles rush to player |
| **Damage taken** | Blood splash | Red particles burst outward |
| **Station healing** | Rising hearts | Small green crosses float up |
| **Wave start** | Warning pulse | Red ring expands from center |
| **Portal active** | Vortex swirl | Cyan particles orbit portal center |
| **Level complete** | Fireworks | Multi-color particle burst |

### Step 8.3 — Screen Effects ("Juice")
| Effect | Trigger | Implementation |
|---|---|---|
| **Screen shake** | Damage taken, heavy attack | `camera.shake()` ✅ exists |
| **Freeze frame** | Enemy killed | `scene.time.timeScale = 0` for 50ms |
| **Vignette flash** | Damage taken | Red overlay at screen edges |
| **Slow motion** | Dash, last enemy in wave | `scene.time.timeScale = 0.3` for 300ms |
| **Zoom pulse** | Boss appears, wave complete | `camera.zoomTo()` briefly |
| **Chromatic aberration** | Low health | RGB offset on player sprite |

### Files to Create
- `app/lib/game/SoundFactory.js`
- `app/lib/game/ParticleFactory.js`
- `app/lib/game/ScreenEffects.js`

---

## 12. PHASE 9 — PROGRESSION, SCORING & SAVE SYSTEM

### Goal
Give the player reasons to come back. Track progress permanently.

### Step 9.1 — Scoring Formula
```
FINAL_SCORE = (SURVIVAL_TIME × 10)
            + (ENEMIES_KILLED × 25)
            + (ORBS_COLLECTED × 50)
            + (HEALTH_REMAINING × 5)
            + (DECISION_QUALITY_BONUS)
            - (DAMAGE_TAKEN × 2)
            + (SPEED_BONUS if under par time)

RANK:
  S  = 90%+ of max possible score
  A  = 75-89%
  B  = 50-74%
  C  = 25-49%
  D  = 0-24%
```

### Step 9.2 — Cognitive Metrics (Unique to MindArena)
These metrics make the game unique by measuring "intelligence":

| Metric | What It Measures | How Scored |
|---|---|---|
| **Planning Depth** | Did you prepare before engaging? | Visited stations before combat |
| **Resource Efficiency** | How well you used health/stamina | % of time above 50% for both |
| **Threat Assessment** | Did you prioritize dangerous enemies? | Killed high-threat first |
| **Spatial Awareness** | Did you use terrain advantageously? | Used obstacles as cover |
| **Adaptation Speed** | How quickly you responded to waves | Time between wave start and first kill |

### Step 9.3 — LocalStorage Save System
```javascript
class SaveManager {
    static SAVE_KEY = 'mindarena_save_v1';

    static save(data) {
        const save = {
            version: 1,
            timestamp: Date.now(),
            ...data
        };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(save));
    }

    static load() {
        const raw = localStorage.getItem(this.SAVE_KEY);
        return raw ? JSON.parse(raw) : this.getDefault();
    }

    static getDefault() {
        return {
            version: 1,
            levelsUnlocked: ['1_1'],
            levelScores: {},        // { '1_1': { score, rank, time } }
            totalPlaytime: 0,
            settings: {
                sfxVolume: 0.8,
                musicVolume: 0.5,
                screenShake: true,
                showMinimap: true
            }
        };
    }
}
```

### Step 9.4 — Victory Scene
After completing a level:
```
┌──────────────────────────────────────────┐
│                                          │
│          ★ LEVEL COMPLETE ★              │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  SCORE:          2,450           │   │
│   │  RANK:           ★★★ A          │   │
│   │  TIME:           01:47           │   │
│   │  KILLS:          18              │   │
│   │  ORBS:           8/8             │   │
│   ├──────────────────────────────────┤   │
│   │  COGNITIVE ANALYSIS              │   │
│   │  Planning:       ████████░░ 82%  │   │
│   │  Efficiency:     █████████░ 91%  │   │
│   │  Awareness:      ██████░░░░ 64%  │   │
│   │  Adaptation:     ███████░░░ 73%  │   │
│   └──────────────────────────────────┘   │
│                                          │
│   [ NEXT LEVEL ]     [ REPLAY ]          │
│                      [ MENU ]            │
│                                          │
└──────────────────────────────────────────┘
```

### Files to Create
- `app/lib/game/SaveManager.js`
- `app/components/game/scenes/VictoryScene.js`
- `app/components/game/scenes/GameOverScene.js`

### Files to Modify
- `app/lib/game/AnalyticsManager.js` — major expansion

---

## 13. PHASE 10 — POLISH, TESTING & DEPLOYMENT

### Step 10.1 — Performance Optimization
- **Object pooling** for all enemies, particles, projectiles
- **Culling** — don't update off-screen entities
- **Texture atlas** — batch all procedural textures into one atlas
- **FPS counter** during development (removable)

### Step 10.2 — Responsive Design
```javascript
// In GameLauncher config:
scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
}
```
- The game renders at a fixed resolution (e.g., 1280×720)
- Phaser scales it to fit the browser window
- No CSS media queries needed — Phaser handles it

### Step 10.3 — Browser Compatibility
- Test on Chrome, Firefox, Safari, Edge
- Ensure WebGL fallback to Canvas works
- Handle tab-unfocus (pause game, suspend audio)

### Step 10.4 — Build Optimization
```bash
# Production build
npm run build
# The Phaser bundle should be tree-shaken
# Target < 500KB gzipped for game code
```

---

## 14. FILE STRUCTURE (FINAL)

```
app/
├── game/
│   └── page.js                          # React launcher (5 lines)
│
├── components/
│   └── game/
│       ├── GameLauncher.js              # Phaser initializer (replaces MindArena.js)
│       │
│       ├── scenes/
│       │   ├── BootScene.js             # Minimal loader
│       │   ├── PreloadScene.js          # Asset generation + loading bar
│       │   ├── MainMenuScene.js         # Full game menu
│       │   ├── LevelSelectScene.js      # Level grid/map
│       │   ├── SettingsScene.js         # Audio/display settings
│       │   ├── GameScene.js             # Main gameplay (replaces Level1_1.js)
│       │   ├── GameHUD.js               # Parallel HUD overlay
│       │   ├── PauseScene.js            # Pause menu overlay
│       │   ├── GameOverScene.js         # Death screen
│       │   └── VictoryScene.js          # Level complete + score
│       │
│       ├── entities/
│       │   ├── BaseSurvivor.js          # Base class ✅
│       │   ├── GamePlayer.js            # Player (enhanced) ✅
│       │   ├── GameAgent.js             # GOAP agent ✅
│       │   ├── ShadowStalker.js         # Zombie enemy ✅
│       │   ├── Brute.js                 # Heavy enemy (new)
│       │   ├── SwarmDrone.js            # Fast weak enemy (new)
│       │   ├── Tactician.js             # Smart enemy (new)
│       │   ├── MindOrb.js               # Collectible ✅
│       │   └── MeleeAttack.js           # Attack hitbox (new)
│       │
│       ├── objects/
│       │   ├── Portal.js                # Level exit
│       │   ├── FogZone.js               # Visibility reducer
│       │   ├── TechCrate.js             # Destructible container
│       │   ├── LavaPool.js              # Damage zone
│       │   └── DeadTree.js              # Destructible obstacle
│       │
│       └── ui/
│           ├── Minimap.js               # Minimap component
│           ├── HealthBar.js             # Health bar component
│           └── ObjectivePanel.js        # Mission tracker
│
├── lib/
│   ├── goap/
│   │   ├── engine.js                    # GOAP core ✅
│   │   └── agent.js                     # Agent logic ✅
│   │
│   └── game/
│       ├── LevelConfig.js               # Level definitions (expanded)
│       ├── WaveConfig.js                # Enemy wave data
│       ├── WorldGenerator.js            # Procedural world (expanded)
│       ├── TextureFactory.js            # Procedural texture generator
│       ├── UIFactory.js                 # Reusable UI builder
│       ├── SoundFactory.js              # Procedural audio
│       ├── ParticleFactory.js           # Particle effect library
│       ├── ScreenEffects.js             # Screen juice (shake, flash, slo-mo)
│       ├── EnemySpawner.js              # Wave-based spawn controller
│       ├── SaveManager.js               # LocalStorage persistence
│       └── AnalyticsManager.js          # Cognitive scoring (expanded)
```

---

## 15. IMPLEMENTATION PRIORITY MATRIX

### Sprint 1: Foundation (Days 1-2)
| # | Task | Priority | Effort |
|---|---|---|---|
| 1 | Strip `page.js` to launcher | 🔴 Critical | 15min |
| 2 | Create `GameLauncher.js` | 🔴 Critical | 30min |
| 3 | Create `BootScene` + `PreloadScene` | 🔴 Critical | 1hr |
| 4 | Create `TextureFactory` | 🔴 Critical | 2hr |
| 5 | Create `MainMenuScene` | 🔴 Critical | 2hr |

### Sprint 2: Core Gameplay (Days 3-5)
| # | Task | Priority | Effort |
|---|---|---|---|
| 6 | Create `GameScene` (replaces Level1_1) | 🔴 Critical | 2hr |
| 7 | Camera follow + world bounds | 🔴 Critical | 30min |
| 8 | Player combat (SPACE attack) | 🔴 Critical | 2hr |
| 9 | Player dash (SHIFT) | 🟡 High | 1hr |
| 10 | `GameHUD` scene | 🔴 Critical | 3hr |
| 11 | `PauseScene` | 🟡 High | 1hr |

### Sprint 3: Enemies & Combat (Days 6-8)
| # | Task | Priority | Effort |
|---|---|---|---|
| 12 | `EnemySpawner` + wave system | 🔴 Critical | 2hr |
| 13 | `SwarmDrone` entity | 🟡 High | 1hr |
| 14 | `Brute` entity | 🟡 High | 1hr |
| 15 | Enemy death effects (particles, loot) | 🟡 High | 2hr |
| 16 | `ParticleFactory` | 🟡 High | 2hr |

### Sprint 4: World & Polish (Days 9-11)
| # | Task | Priority | Effort |
|---|---|---|---|
| 17 | World expansion (2400×1600) | 🟡 High | 2hr |
| 18 | Environment objects (crates, trees, fog) | 🟡 High | 3hr |
| 19 | `Minimap` | 🟡 High | 2hr |
| 20 | `Portal` + level transition | 🟡 High | 1hr |
| 21 | `ScreenEffects` (slo-mo, vignette) | 🟢 Medium | 2hr |

### Sprint 5: Progression (Days 12-14)
| # | Task | Priority | Effort |
|---|---|---|---|
| 22 | `VictoryScene` + scoring | 🟡 High | 2hr |
| 23 | `GameOverScene` (Phaser-native) | 🟡 High | 1hr |
| 24 | `SaveManager` (localStorage) | 🟡 High | 1hr |
| 25 | `LevelSelectScene` with unlock | 🟡 High | 2hr |
| 26 | `AnalyticsManager` integration | 🟢 Medium | 2hr |
| 27 | Level 1.2 + 1.3 content | 🟢 Medium | 3hr |

### Sprint 6: Audio & Final Polish (Days 15-17)
| # | Task | Priority | Effort |
|---|---|---|---|
| 28 | `SoundFactory` (procedural audio) | 🟢 Medium | 3hr |
| 29 | `SettingsScene` | 🟢 Medium | 1hr |
| 30 | Responsive scaling | 🟢 Medium | 1hr |
| 31 | Performance optimization (pooling) | 🟢 Medium | 2hr |
| 32 | Final playtesting & balance | 🔴 Critical | 2hr |

---

## SUMMARY

### The Core Transformation
```
BEFORE:  Website with a game canvas embedded
AFTER:   A full game that happens to run in a browser
```

### Key Architectural Decisions
1. **React does NOTHING** except mount one `<div>` — all UI lives in Phaser
2. **10 Phaser Scenes** replace the single Level1_1 + React overlays
3. **Procedural everything** — textures, audio, particles — zero external assets
4. **Camera follows player** in a world 4× larger than the screen
5. **Player can FIGHT BACK** — melee attack with satisfying feedback
6. **Enemies spawn in WAVES** — escalating difficulty, varied types
7. **Professional HUD** — health, stamina, power, minimap, objectives
8. **Save progress** — localStorage persistence across sessions
9. **Cognitive scoring** — what makes MindArena unique

This document serves as the complete blueprint. Each phase can be executed independently, and at any checkpoint the game should be playable.

---

> *"A game is a series of interesting decisions."* — Sid Meier  
> *MindArena makes those decisions measurable.*
