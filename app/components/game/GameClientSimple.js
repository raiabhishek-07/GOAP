"use client";

let gameInstance = null;

export const getGame = () => gameInstance;

/**
 * Initialize Phaser game only on client side (SIMPLE MODE - No Open World).
 * @param {HTMLElement} container - DOM element to render Phaser into
 * @param {Object} launchOptions - { directLaunch: bool, level: number, stage: number }
 */
export async function initGame(container, launchOptions = {}) {
    if (typeof window === 'undefined' || !container) return null;

    // If a game already exists, destroy it before creating a new one
    if (gameInstance) {
        destroyGame();
    }

    // Dynamically import Phaser and scenes on demand (client-only)
    const Phaser = await import("phaser");
    
    // ONLY IMPORT ORIGINAL GAME SCENES - NO OPEN WORLD
    const { GameScene } = await import("./scenes/GameScene");
    const { GameHUD } = await import("./scenes/GameHUD");
    const { VictoryScene } = await import("./scenes/VictoryScene");
    const { GameOverScene } = await import("./scenes/GameOverScene");
    const { PauseScene } = await import("./scenes/PauseScene");
    const { DeploymentLoadingScene } = await import("./scenes/DeploymentLoadingScene");

    const width = Math.max(container.clientWidth || window.innerWidth, 800);
    const height = Math.max(container.clientHeight || window.innerHeight, 600);

    let scenes;

    if (launchOptions.directLaunch) {
        // ── DIRECT LAUNCH (SIMPLE MODE) ──
        const lvl = launchOptions.level || 1;
        const stg = launchOptions.stage || 1;

        class SimpleBootScene extends Phaser.Scene {
            constructor() { super({ key: 'SimpleBootScene' }); }
            create() {
                // Generate basic textures
                this._genTex('loading_bg', 400, 20, 0x1e293b);
                this._genTex('loading_fill', 400, 20, 0x60a5fa);
                const g = this.add.graphics();
                g.fillStyle(0x60a5fa, 1); g.fillCircle(32, 32, 28);
                g.fillStyle(0x020617, 1); g.fillCircle(32, 32, 18);
                g.fillStyle(0x00f2ff, 1); g.fillCircle(32, 28, 6);
                g.fillStyle(0xf59e0b, 1); g.fillTriangle(24, 38, 40, 38, 32, 48);
                g.generateTexture('logo_icon', 64, 64);
                g.destroy();

                // Go straight to original gameplay - no open world
                this.scene.start('DeploymentLoadingScene', { level: lvl, stage: stg });
            }
            _genTex(key, w, h, color) {
                const g = this.add.graphics();
                g.fillStyle(color, 1);
                g.fillRoundedRect(0, 0, w, h, h / 2);
                g.generateTexture(key, w, h);
                g.destroy();
            }
        }

        scenes = [
            SimpleBootScene,
            DeploymentLoadingScene,
            GameScene,           // ORIGINAL GAME SCENE ONLY
            GameHUD,
            PauseScene,
            GameOverScene,
            VictoryScene,
        ];
    } else {
        // ── NORMAL LAUNCH (menu flow) ──
        const { BootScene } = await import("./scenes/BootScene");
        const { PreloadScene } = await import("./scenes/PreloadScene");
        const { MainMenuScene } = await import("./scenes/MainMenuScene");
        const { LevelSelectScene } = await import("./scenes/LevelSelectScene");
        const { BriefingScene } = await import("./scenes/BriefingScene");
        const { StatsScene } = await import("./scenes/StatsScene");
        const { LobbyScene } = await import("./scenes/LobbyScene");

        scenes = [
            BootScene,
            PreloadScene,
            MainMenuScene,
            LevelSelectScene,
            BriefingScene,
            GameScene,           // ORIGINAL GAME SCENE ONLY
            GameHUD,
            PauseScene,
            GameOverScene,
            VictoryScene,
            StatsScene,
            LobbyScene,
            DeploymentLoadingScene,
        ];
    }

    const config = {
        type: Phaser.AUTO,
        parent: container,
        width: width,
        height: height,
        backgroundColor: '#020617',
        pixelArt: false,
        antialias: true,
        powerPreference: 'high-performance',
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: scenes
    };

    gameInstance = new Phaser.Game(config);
    window.game = gameInstance;

    console.log('🎮 Simple Mode Loaded - No Open World');
    return gameInstance;
}

/**
 * Helper to switch Phaser scenes from React
 */
export function switchScene(sceneKey, data = {}) {
    if (gameInstance && gameInstance.scene) {
        gameInstance.scene.start(sceneKey, data);
    }
}

export function destroyGame() {
    if (gameInstance) {
        gameInstance.destroy(true);
        gameInstance = null;
        window.game = null;
    }
}
