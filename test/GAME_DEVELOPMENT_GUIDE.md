# Developer’s Guide: Building the Tactical Cockpit (game/play/1/1)

This document outlines the architecture, logic, and development process for the **Code Clash** mission: *Level 1, Stage 1 - The Blueprint*.

---

## 1. High-Level Architecture
The game uses a **Hybrid React-Phaser Engine**. This allows us to use the high-performance physics of Phaser for the battlefield, while using the sleek, modern styling of React/Tailwind for the menus and overlays.

### The Component Stack
*   **Next.js (App Router)**: Orchestrates the routes (`/game/play/[level]/[stage]`).
*   **Phaser 3**: The 2D rendering and physics engine (Arcade Physics).
*   **Web Audio API**: Synthetic audio generation (Zero MP3/WAV files).
*   **Lucide-React / Framer Motion**: Used for the premium UI animations in the React layer.

---

## 2. Core Modules & Directories
To recreate the level 1/1 experience, the following structure is used:

### A. The Mounting Layer (`GameClient.js`)
- **Responsibility**: Initializes the Phaser instance on the client-side.
- **Key Feature**: It dynamically imports Phaser to avoid SSR (Server-Side Rendering) conflicts and mounts the game into a specific DOM `div`.

### B. The Gameplay Engine (`GameScene.js`)
- **Environment**: Uses `WorldGenerator` to map the terrain from `LevelConfig.js`.
- **Entities**: Manages the `GamePlayer` and spawns `Bugs` (enemies) via the `AgentFactory`.
- **Loop**: Handles the shooting, collision detection, and trigger points for the "Logic Treasures."

### C. The Tactical HUD (`GameHUD.js`)
- **Radar System**: Tracks enemies and objectives relative to the player's position.
- **Compass**: Provides a real-time bearing (0-360°) as the player moves.
- **Arsenal Panel**: Tracks ammo count, weapon type, and reloads.
- **Objective Tracker**: Dynamically updates as the `TaskSystem` marks missions complete.

---

## 3. The "Hunt-to-Learn" Mechanic
The unique differentiator for Level 1/1 is the **Educational Loop**:
1.  **Hunt**: The player navigates the tactical environment to locate "Bug" clusters.
2.  **Fight**: Combat using the top-down shooter mechanics.
3.  **Learn**: Upon death, enemies drop **Logic Fragments**. Collecting these triggers a UI modal (defined in the React layer) that explains core programming syntax:
    *   *Variables*: (e.g., `let health = 100;`)
    *   *Conditionals*: (e.g., `if(enemyVisible) { shoot(); }`)
    *   *Loops*: (e.g., `while(bullets > 0) { ... }`)

---

## 4. Zero-Asset Asset Pipeline
The game is designed to be extremely lightweight and portable by generating all assets programmatically at boot time.

*   **TextureFactory**: Uses the Phaser `RenderTexture` API. It draws characters, trees, and UI panels using pure code (drawing circles, rectangles, and arcs).
*   **SoundManager**: Instead of loading `.mp3` files, it uses oscillators and noise generators to create the "sci-fi" sound signature (shoots, hit-pings, and ambient drones).
*   **LevelConfig**: A JSON-like configuration that "maps" the world. For 1/1, it defines the olive-drab terrain, the orange "Logic Terminals," and the player's starting coordinates.

---

## 5. Development Steps for Level 1/1
If you are developing or modifying this level:
1.  **Define Phase**: Set the world bounds and terrain colors in `LevelConfig.js`.
2.  **Init Phase**: Load `TextureFactory.generateAllTextures()` to prepare the sprites.
3.  **Boot Phase**: Launch `DeploymentLoadingScene` to show mission parameters.
4.  **HUD Sync**: Use `events.emit('HUD_UPDATE', data)` to keep the React/Phaser layers in sync.
5.  **Completion**: Detect when the `extractionPoint` is reached after all `TaskSystem` objectives are met.

---
*Created by the Advanced Agentic Coding Team - Antigravity Systems.*
