import * as Phaser from "phaser";

/**
 * UIFactory — Reusable game UI components for MindArena
 * All UI is Phaser-native, not React.
 */
export class UIFactory {

    /**
     * Creates an interactive button with hover/press animations.
     * Returns a Container with the background + text.
     */
    static createButton(scene, x, y, label, onClick, width = 280, height = 52) {
        const container = scene.add.container(x, y);

        const bg = scene.add.image(0, 0, 'btn_normal')
            .setDisplaySize(width, height);

        const text = scene.add.text(0, 0, label.toUpperCase(), {
            fontSize: '15px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#e2e8f0',
            fontStyle: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            bg.setTexture('btn_hover');
            scene.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Back.easeOut'
            });
            text.setColor('#ffffff');
        });

        container.on('pointerout', () => {
            bg.setTexture('btn_normal');
            scene.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Back.easeOut'
            });
            text.setColor('#e2e8f0');
        });

        container.on('pointerdown', () => {
            bg.setTexture('btn_active');
            container.setScale(0.97);
        });

        container.on('pointerup', () => {
            bg.setTexture('btn_hover');
            container.setScale(1.05);
            if (onClick) onClick();
        });

        return container;
    }

    /**
     * Creates a styled title with wave animation per character.
     */
    static createTitle(scene, x, y, text, size = 64, color = '#ffffff') {
        const chars = text.split('');
        const container = scene.add.container(x, y);
        let offsetX = 0;
        const spacing = size * 0.65;
        const totalWidth = chars.length * spacing;
        const startX = -totalWidth / 2;

        chars.forEach((char, i) => {
            const c = scene.add.text(startX + i * spacing, 0, char, {
                fontSize: `${size}px`,
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                color: color,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Per-character wave animation
            scene.tweens.add({
                targets: c,
                y: -8,
                duration: 1200,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: i * 80
            });

            container.add(c);
        });

        return container;
    }

    /**
     * Creates a progress bar (health, stamina, power, loading).
     */
    static createProgressBar(scene, x, y, width, height, maxValue, color = 0x22c55e) {
        const container = scene.add.container(x, y);

        const bgBar = scene.add.graphics();
        bgBar.fillStyle(0x1e293b, 0.8);
        bgBar.fillRoundedRect(0, 0, width, height, height / 2);

        const fillBar = scene.add.graphics();
        fillBar.fillStyle(color, 1);
        fillBar.fillRoundedRect(0, 0, width, height, height / 2);

        container.add([bgBar, fillBar]);

        // Attach update method
        container.updateValue = (value) => {
            const pct = Math.max(0, Math.min(1, value / maxValue));
            fillBar.clear();
            fillBar.fillStyle(color, 1);
            fillBar.fillRoundedRect(0, 0, width * pct, height, height / 2);
        };

        container.currentMax = maxValue;
        return container;
    }

    /**
     * Creates a dark panel background (for HUD elements).
     */
    static createPanel(scene, x, y, width, height) {
        const container = scene.add.container(x, y);
        const bg = scene.add.graphics();
        bg.fillStyle(0x0f172a, 0.92);
        bg.fillRoundedRect(0, 0, width, height, 12);
        bg.lineStyle(1, 0x334155, 0.5);
        bg.strokeRoundedRect(0, 0, width, height, 12);
        container.add(bg);
        return container;
    }

    /**
     * Floating text popup that rises and fades.
     */
    static createPopup(scene, x, y, text, color = '#00f2ff', size = '14px') {
        const t = scene.add.text(x, y, text, {
            fontSize: size,
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(1000);

        scene.tweens.add({
            targets: t,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => t.destroy()
        });

        return t;
    }
}
