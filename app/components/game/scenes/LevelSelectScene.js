import { MIND_ARENA_LEVELS, isStageUnlocked, isLevelUnlocked } from "../../../lib/game/LevelConfig";
import { SaveSystem } from "../../../lib/game/SaveSystem";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

/**
 * LevelSelectScene — 3 Levels × 3 Stages mission select
 * Premium military tab-based layout
 */
export class LevelSelectScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'LevelSelectScene' });
        this.activeLevel = 1;
        this.progress = SaveSystem.getProgress();
    }

    create() {
        // Reload progress from save each time (in case player just completed a stage)
        this.progress = SaveSystem.getProgress();

        const { width, height } = this.scale;
        const cx = width / 2;

        this.cameras.main.fadeIn(500, 0, 0, 0);

        // ─── BACKGROUND ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0f0a, 0x0a0f0a, 0x1a2a1a, 0x1a2a1a, 1);
        bg.fillRect(0, 0, width, height);

        // Grid pattern
        const grid = this.add.graphics();
        grid.lineStyle(0.5, 0xffffff, 0.02);
        for (let i = -height; i < width + height; i += 40) {
            grid.lineBetween(i, 0, i + height, height);
        }

        // ─── TOP: TITLE ────────────────────────────────
        const topBar = this.add.graphics();
        topBar.fillStyle(0x000000, 0.6);
        topBar.fillRect(0, 0, width, 55);
        topBar.lineStyle(1.5, 0xf59e0b, 0.5);
        topBar.lineBetween(0, 55, width, 55);

        this.add.text(cx, 16, 'MISSION SELECT', {
            fontSize: '22px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 8,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        this.add.text(cx, 38, 'Choose your challenge. Plan your approach.', {
            fontSize: '9px', fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#6a8a6a', letterSpacing: 2,
        }).setOrigin(0.5);

        // ─── LEVEL TABS ────────────────────────────────
        this.levelTabContainer = this.add.container(0, 0);
        this.stageContainer = this.add.container(0, 0);

        this.createLevelTabs(cx, width);
        this.showLevel(this.activeLevel);

        // ─── BACK BUTTON ───────────────────────────────
        this.createBackButton(cx, height);
    }

    // ─── LEVEL TABS ─────────────────────────────────────

    createLevelTabs(cx, width) {
        const tabY = 80;
        const tabW = 180;
        const tabGap = 20;
        const totalW = 3 * tabW + 2 * tabGap;
        const startX = cx - totalW / 2 + tabW / 2;

        this.tabButtons = [];

        [1, 2, 3].forEach((levelNum, idx) => {
            const level = MIND_ARENA_LEVELS[levelNum];
            const x = startX + idx * (tabW + tabGap);
            const unlocked = isLevelUnlocked(levelNum, this.progress);

            const tab = this.add.container(x, tabY);
            const isActive = levelNum === this.activeLevel;

            // Tab background
            const tabBg = this.add.graphics();
            if (isActive) {
                tabBg.fillStyle(0x2a5a2a, 0.9);
                tabBg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(level.color).color, 0.8);
            } else {
                tabBg.fillStyle(unlocked ? 0x1a2a1a : 0x111411, 0.8);
                tabBg.lineStyle(1, 0x333333, 0.4);
            }
            tabBg.fillRoundedRect(-tabW / 2, -18, tabW, 36, { tl: 8, tr: 8, bl: 0, br: 0 });
            tabBg.strokeRoundedRect(-tabW / 2, -18, tabW, 36, { tl: 8, tr: 8, bl: 0, br: 0 });
            tab.add(tabBg);

            // Level number
            const numText = this.add.text(-tabW / 2 + 14, -1, `L${levelNum}`, {
                fontSize: '14px', fontFamily: 'monospace',
                color: level.color, fontStyle: 'bold',
            }).setOrigin(0, 0.5);
            tab.add(numText);

            // Level name
            const nameText = this.add.text(10, -5, level.name.toUpperCase(), {
                fontSize: '12px',
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                color: isActive ? '#ffffff' : (unlocked ? '#8a9a8a' : '#444444'),
                fontStyle: 'bold', letterSpacing: 1,
            }).setOrigin(0, 0.5);
            tab.add(nameText);

            // Subtitle
            const subText = this.add.text(10, 9, level.subtitle, {
                fontSize: '7px',
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                color: isActive ? '#8a9a8a' : '#3a4a3a',
                letterSpacing: 1,
            }).setOrigin(0, 0.5);
            tab.add(subText);

            // Lock icon
            if (!unlocked) {
                const lock = this.add.text(tabW / 2 - 14, 0, '🔒', { fontSize: '14px' }).setOrigin(0.5);
                tab.add(lock);
            }

            // Interactive
            if (unlocked) {
                tab.setSize(tabW, 36);
                tab.setInteractive({ useHandCursor: true });
                tab.on('pointerup', () => {
                    this.activeLevel = levelNum;
                    this.refreshTabs();
                    this.showLevel(levelNum);
                });
                tab.on('pointerover', () => {
                    if (levelNum !== this.activeLevel) nameText.setColor('#ffffff');
                });
                tab.on('pointerout', () => {
                    if (levelNum !== this.activeLevel) nameText.setColor('#8a9a8a');
                });
            } else {
                tab.setAlpha(0.5);
            }

            this.tabButtons.push({ container: tab, levelNum, tabBg, nameText, subText, unlocked, level });
            this.levelTabContainer.add(tab);
        });
    }

    refreshTabs() {
        this.tabButtons.forEach(({ container, levelNum, tabBg, nameText, subText, unlocked, level }) => {
            const isActive = levelNum === this.activeLevel;
            const tabW = 180;

            tabBg.clear();
            if (isActive) {
                tabBg.fillStyle(0x2a5a2a, 0.9);
                tabBg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(level.color).color, 0.8);
            } else {
                tabBg.fillStyle(unlocked ? 0x1a2a1a : 0x111411, 0.8);
                tabBg.lineStyle(1, 0x333333, 0.4);
            }
            tabBg.fillRoundedRect(-tabW / 2, -18, tabW, 36, { tl: 8, tr: 8, bl: 0, br: 0 });
            tabBg.strokeRoundedRect(-tabW / 2, -18, tabW, 36, { tl: 8, tr: 8, bl: 0, br: 0 });

            nameText.setColor(isActive ? '#ffffff' : (unlocked ? '#8a9a8a' : '#444444'));
            subText.setColor(isActive ? '#8a9a8a' : '#3a4a3a');
        });
    }

    // ─── STAGE CARDS ────────────────────────────────────

    showLevel(levelNum) {
        // Clear previous
        this.stageContainer.removeAll(true);

        const level = MIND_ARENA_LEVELS[levelNum];
        const stages = Object.entries(level.stages);
        const { width, height } = this.scale;
        const cx = width / 2;

        // Level description
        const descText = this.add.text(cx, 125, level.description, {
            fontSize: '9px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#6a8a6a',
            wordWrap: { width: 550 },
            align: 'center',
            lineSpacing: 4,
        }).setOrigin(0.5, 0);
        this.stageContainer.add(descText);

        // Stage cards
        const cardW = 180, cardH = 230, cardGap = 25;
        const totalW = stages.length * (cardW + cardGap) - cardGap;
        const startX = cx - totalW / 2 + cardW / 2;
        const cardStartY = 175;

        stages.forEach(([stageNum, stage], index) => {
            const x = startX + index * (cardW + cardGap);
            const y = cardStartY + cardH / 2;
            const sNum = parseInt(stageNum);
            const unlocked = isStageUnlocked(levelNum, sNum, this.progress);
            const stageProgress = this.progress[levelNum]?.[sNum] || null;

            this.createStageCard(x, y, cardW, cardH, levelNum, sNum, stage, unlocked, level.color, index, stageProgress);
        });
    }

    createStageCard(x, y, w, h, levelNum, stageNum, stage, unlocked, levelColor, index, stageProgress = null) {
        const card = this.add.container(x, y);

        // Card shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.3);
        shadow.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w, h, 10);
        card.add(shadow);

        // Card background
        const cardBg = this.add.graphics();
        cardBg.fillStyle(unlocked ? 0x1a2a1a : 0x111411, 0.95);
        cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        card.add(cardBg);

        // Top accent stripe
        const accent = this.add.graphics();
        const accentColor = unlocked ? Phaser.Display.Color.HexStringToColor(levelColor).color : 0x333333;
        accent.fillStyle(accentColor, unlocked ? 0.8 : 0.3);
        accent.fillRoundedRect(-w / 2, -h / 2, w, 5, { tl: 10, tr: 10, bl: 0, br: 0 });
        card.add(accent);

        // Stage number badge
        const badgeSize = 36;
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(unlocked ? accentColor : 0x222222, 0.9);
        badgeBg.fillCircle(0, -h / 2 + 40, badgeSize / 2);
        badgeBg.lineStyle(2, 0xffffff, unlocked ? 0.2 : 0.05);
        badgeBg.strokeCircle(0, -h / 2 + 40, badgeSize / 2);
        card.add(badgeBg);

        const badgeText = this.add.text(0, -h / 2 + 40, `${levelNum}.${stageNum}`, {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
        card.add(badgeText);

        // Stage name
        const nameText = this.add.text(0, -h / 2 + 75, stage.name.toUpperCase(), {
            fontSize: '13px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: unlocked ? '#ffffff' : '#444444',
            fontStyle: 'bold', letterSpacing: 1,
        }).setOrigin(0.5);
        card.add(nameText);

        // Subtitle
        const subText = this.add.text(0, -h / 2 + 93, stage.subtitle || '', {
            fontSize: '8px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: unlocked ? levelColor : '#333333',
            fontStyle: 'bold', letterSpacing: 1,
        }).setOrigin(0.5);
        card.add(subText);

        // Divider
        const divider = this.add.graphics();
        divider.lineStyle(0.5, 0xffffff, unlocked ? 0.1 : 0.03);
        divider.lineBetween(-w / 2 + 15, -h / 2 + 108, w / 2 - 15, -h / 2 + 108);
        card.add(divider);

        // Stats row
        const statsY = -h / 2 + 125;
        const stats = [
            { icon: '🤖', value: `${stage.agents?.length || 0}`, label: 'Agents' },
            { icon: '📋', value: `${stage.tasks?.length || 0}`, label: 'Tasks' },
            { icon: '⏱️', value: `${stage.timeLimit}s`, label: 'Time' },
        ];
        stats.forEach((s, i) => {
            const sx = -48 + i * 48;
            this.add.text(x + sx, y + statsY, s.icon, { fontSize: '12px' }).setOrigin(0.5);
            this.add.text(x + sx, y + statsY + 16, s.value, {
                fontSize: '11px', fontFamily: 'monospace',
                color: unlocked ? '#ffffff' : '#444444', fontStyle: 'bold',
            }).setOrigin(0.5);
            this.add.text(x + sx, y + statsY + 28, s.label, {
                fontSize: '7px', fontFamily: '"Inter", "Segoe UI", sans-serif',
                color: unlocked ? '#6a8a6a' : '#333333',
            }).setOrigin(0.5);
        });

        // Objective text
        this.add.text(x, y - h / 2 + 180, stage.objective || '', {
            fontSize: '8px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: unlocked ? '#8a9a8a' : '#333333',
            wordWrap: { width: w - 24 },
            align: 'center',
            lineSpacing: 3,
        }).setOrigin(0.5);

        // Bottom button
        if (unlocked) {
            const btnY = h / 2 - 25;
            const btnW = w - 30, btnH = 32;

            const btnBg = this.add.graphics();
            btnBg.fillStyle(Phaser.Display.Color.HexStringToColor(levelColor).color, 0.9);
            btnBg.fillRoundedRect(-btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
            card.add(btnBg);

            // Show rank badge if previously completed
            if (stageProgress?.completed && stageProgress.bestRank) {
                const rankColors = { S: '#ffd740', A: '#22c55e', B: '#42a5f5', C: '#aaaaaa', D: '#666666' };
                const rankBadges = { S: '🏆', A: '⭐', B: '🎖️', C: '📋', D: '🔰' };
                const rc = rankColors[stageProgress.bestRank] || '#666666';
                const rb = rankBadges[stageProgress.bestRank] || '';

                const rankLabel = this.add.text(0, btnY - 28, `${rb} RANK ${stageProgress.bestRank} — ${stageProgress.bestScore || 0} pts`, {
                    fontSize: '8px', fontFamily: '"Courier New", monospace',
                    color: rc, fontStyle: 'bold', letterSpacing: 1,
                }).setOrigin(0.5);
                card.add(rankLabel);
            }

            const btnText = this.add.text(0, btnY, stageProgress?.completed ? '▶  REPLAY' : '▶  DEPLOY', {
                fontSize: '11px',
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                color: '#ffffff', fontStyle: 'bold',
                letterSpacing: 3,
                stroke: '#000000', strokeThickness: 2,
            }).setOrigin(0.5);
            card.add(btnText);

            // Card border
            cardBg.lineStyle(1, accentColor, 0.3);
            cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

            // Interactive
            card.setSize(w, h);
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                this.tweens.add({ targets: card, scaleX: 1.04, scaleY: 1.04, y: y - 5, duration: 200, ease: 'Back.easeOut' });
            });
            card.on('pointerout', () => {
                this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, y: y, duration: 200 });
            });
            card.on('pointerup', () => {
                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('BriefingScene', { level: levelNum, stage: stageNum });
                });
            });
        } else {
            card.setAlpha(0.4);
            const lockText = this.add.text(0, h / 2 - 25, '🔒 LOCKED', {
                fontSize: '10px', fontFamily: '"Inter", "Segoe UI", sans-serif',
                color: '#444444', fontStyle: 'bold', letterSpacing: 2,
            }).setOrigin(0.5);
            card.add(lockText);
        }

        // Entry animation
        card.setAlpha(0).setScale(0.9);
        this.tweens.add({
            targets: card, alpha: 1, scaleX: 1, scaleY: 1,
            duration: 400, delay: index * 120, ease: 'Back.easeOut',
        });

        this.stageContainer.add(card);
    }

    // ─── BACK BUTTON ────────────────────────────────────

    createBackButton(cx, height) {
        const btn = this.add.container(cx, height - 40);
        const text = this.add.text(0, 0, '← BACK  TO  MENU', {
            fontSize: '11px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#4a6a4a', fontStyle: 'bold', letterSpacing: 2,
        }).setOrigin(0.5);
        btn.add(text);
        btn.setSize(200, 30);
        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => text.setColor('#f59e0b'));
        btn.on('pointerout', () => text.setColor('#4a6a4a'));
        btn.on('pointerup', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenuScene');
            });
        });
    }
}
