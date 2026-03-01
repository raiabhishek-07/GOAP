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
import { BriefingScene } from "./scenes/BriefingScene";
import { StatsScene } from "./scenes/StatsScene";
import { LobbyScene } from "./scenes/LobbyScene";
import { DeploymentLoadingScene } from "./scenes/DeploymentLoadingScene";
import { SettingsScene } from "./scenes/SettingsScene";

/**
 * GameLauncher — The ONLY React component in the game.
 * Mounts Phaser, registers all scenes, and gets out of the way.
 * ALL game UI, menus, and HUD are Phaser-native.
 */
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
            backgroundColor: '#020617',
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
                DeploymentLoadingScene,
                SettingsScene
            ],
            render: {
                pixelArt: false,
                antialias: true
            }
        };

        gameRef.current = new Phaser.Game(config);

        // Handle window resize
        const handleResize = () => {
            if (gameRef.current) {
                gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                background: '#020617',
                overflow: 'hidden',
                margin: 0,
                padding: 0
            }}
        />
    );
}
