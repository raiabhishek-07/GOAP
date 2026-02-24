"use client";

let gameInstance = null;

export const getGame = () => gameInstance;

/**
 * Initialize the Phaser game only on the client side.
 */
export async function initGame(container) {
    if (typeof window === 'undefined' || !container) return null;

    // If a game already exists, destroy it before creating a new one
    // Phaser canvases are tied to their parent containers
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

    // Ensure we have valid dimensions to avoid "Incomplete Attachment" WebGL errors
    // clientWidth/Height are usually more reliable for the actual render surface
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
        powerPreference: 'high-performance', // Can help with WebGL attachment issues
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

    return gameInstance;
}

/**
 * Helper to switch Phaser scenes from React
 */
export function switchScene(sceneKey, data = {}) {
    if (gameInstance && gameInstance.scene) {
        // Stop all scenes except the target (optional, depends on architecture)
        // gameInstance.scene.getScenes(true).forEach(s => s.scene.stop());
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
