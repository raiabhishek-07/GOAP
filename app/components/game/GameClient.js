"use client";

let gameInstance = null;

export const getGame = () => gameInstance;

/**
 * Initialize the Phaser game only on the client side.
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
    const { BootScene } = await import("./scenes/BootScene");
    const { PreloadScene } = await import("./scenes/PreloadScene");
    const { MainMenuScene } = await import("./scenes/MainMenuScene");
    const { LevelSelectScene } = await import("./scenes/LevelSelectScene");
    const { BriefingScene } = await import("./scenes/BriefingScene");
    const { GameScene } = await import("./scenes/GameScene");
    const { GameHUD } = await import("./scenes/GameHUD");
    const { VictoryScene } = await import("./scenes/VictoryScene");
    const { GameOverScene } = await import("./scenes/GameOverScene");
    const { PauseScene } = await import("./scenes/PauseScene");
    const { DeploymentLoadingScene } = await import("./scenes/DeploymentLoadingScene");
    const { StatsScene } = await import("./scenes/StatsScene");
    const { LobbyScene } = await import("./scenes/LobbyScene");

    const width = Math.max(container.clientWidth || window.innerWidth, 800);
    const height = Math.max(container.clientHeight || window.innerHeight, 600);

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
        scene: [
            BootScene,
            PreloadScene,
            MainMenuScene,
            LevelSelectScene,
            BriefingScene,
            GameScene,
            GameHUD,
            PauseScene,
            GameOverScene,
            VictoryScene,
            StatsScene,
            LobbyScene,
            DeploymentLoadingScene
        ]
    };

    gameInstance = new Phaser.Game(config);
    window.game = gameInstance;

    // Store launch options in the registry so scenes can read them
    // This tells PreloadScene to skip MainMenuScene and go straight to gameplay
    if (launchOptions.directLaunch) {
        gameInstance.registry.set('directLaunch', true);
        gameInstance.registry.set('directLevel', launchOptions.level || 1);
        gameInstance.registry.set('directStage', launchOptions.stage || 1);
    }

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
