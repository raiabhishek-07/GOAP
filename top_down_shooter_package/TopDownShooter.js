'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * TopDownShooter - A premium, self-contained Phaser 3 component for Next.js.
 * 
 * Features:
 * - WASD Movement
 * - Mouse Aiming + Shooting
 * - Procedural "Gun Person" Character (Zero external assets needed)
 * - Futuristic Health Monitor & Stats HUD
 * 
 * Integration:
 * 1. Install Phaser: `npm install phaser`
 * 2. Copy this file into your `components` folder.
 * 3. Import and use: `<TopDownShooter />`
 */

const TopDownShooter = () => {
    const gameContainerRef = useRef(null);
    const [health, setHealth] = useState(100);
    const [ammo, setAmmo] = useState(30);
    const [status, setStatus] = useState('OPERATIONAL');

    useEffect(() => {
        // Dynamic import to avoid SSR issues with Phaser
        let game;
        import('phaser').then((Phaser) => {
            
            // --- PLAYER ENTITY CLASS ---
            class Soldier extends Phaser.GameObjects.Container {
                constructor(scene, x, y) {
                    super(scene, x, y);
                    scene.add.existing(this);
                    scene.physics.add.existing(this);
                    
                    this.body.setCollideWorldBounds(true);
                    this.body.setCircle(15);
                    this.body.setOffset(-15, -15);

                    // Draw the soldier body (procedural)
                    const g = scene.add.graphics();
                    
                    // Shadow
                    g.fillStyle(0x000000, 0.3);
                    g.fillEllipse(0, 5, 20, 10);

                    // Main Body Armor (Red)
                    g.lineStyle(2, 0x000000, 1);
                    g.fillStyle(0xef4444, 1);
                    g.fillCircle(0, 0, 15);
                    g.strokeCircle(0, 0, 15);

                    // Tactical Vest (White/Light Gray)
                    g.fillStyle(0xf8fafc, 1);
                    g.fillRect(-10, -10, 20, 12);
                    g.strokeRect(-10, -10, 20, 12);

                    // Head/Helmet
                    g.fillStyle(0x1e293b, 1);
                    g.fillCircle(0, -2, 6);
                    g.strokeCircle(0, -2, 6);

                    // Gun Barrel (pointing right initially)
                    const gun = scene.add.graphics();
                    gun.fillStyle(0x334155, 1);
                    gun.fillRect(5, -3, 20, 6); // Barrel
                    gun.fillStyle(0x000000, 1);
                    gun.fillRect(20, -1, 3, 2); // Muzzle
                    gun.lineStyle(1, 0x000000, 1);
                    gun.strokeRect(5, -3, 20, 6);

                    this.add([g, gun]);
                    this.gun = gun;
                }

                updateAim(mouseX, mouseY) {
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, mouseX, mouseY);
                    this.setRotation(angle);
                }
            }
            // --- BUILDING & ENVIRONMENT CLASSES ---
            class Building extends Phaser.GameObjects.Container {
                constructor(scene, x, y, w, h, baseColor, roofColor) {
                    super(scene, x, y);
                    const g = scene.add.graphics();
                    
                    // Base
                    g.fillStyle(baseColor, 1);
                    g.fillRect(-w/2, -h/2, w, h);
                    g.lineStyle(2, 0x000000, 0.5);
                    g.strokeRect(-w/2, -h/2, w, h);

                    // Windows
                    g.fillStyle(0xccf1ff, 0.8);
                    const winSize = 10;
                    const padding = 15;
                    for(let r = -h/2 + padding; r < h/2 - padding; r += padding * 2) {
                        for(let c = -w/2 + padding; c < w/2 - padding; c += padding * 2) {
                            g.fillRect(c, r, winSize, winSize);
                            g.lineStyle(1, 0x000000, 0.3);
                            g.strokeRect(c, r, winSize, winSize);
                        }
                    }

                    // Roof (Slight overlap)
                    g.fillStyle(roofColor, 0.9);
                    g.fillRect(-w/2 - 2, -h/2 - 2, w + 4, 15);
                    
                    this.add(g);
                    scene.add.existing(this);
                    scene.physics.add.existing(this, true); // static
                    this.body.setSize(w, h).setOffset(-w/2, -h/2);
                }
            }

            class Rock extends Phaser.GameObjects.Container {
                constructor(scene, x, y, size) {
                    super(scene, x, y);
                    const g = scene.add.graphics();
                    g.fillStyle(0x475569, 1);
                    const points = [];
                    for(let i=0; i<6; i++) {
                        const angle = (i/6) * Math.PI * 2;
                        const radius = size * (0.8 + Math.random() * 0.4);
                        points.push({x: Math.cos(angle)*radius, y: Math.sin(angle)*radius});
                    }
                    g.fillPoints(points, true);
                    g.lineStyle(1, 0x1e293b, 1);
                    g.strokePoints(points, true);
                    
                    this.add(g);
                    scene.add.existing(this);
                    scene.physics.add.existing(this, true); // static
                    this.body.setCircle(size).setOffset(-size, -size);
                }
            }

            // --- MAIN GAME SCENE ---
            class GameScene extends Phaser.Scene {
                constructor() {
                    super('GameScene');
                }

                create() {
                    const { width: vw, height: vh } = this.scale;
                    this.physics.world.setBounds(0, 0, vw, vh);

                    // 1. Tactical Grid Floor
                    this.add.grid(vw/2, vh/2, vw, vh, 40, 40, 0x0a1f0a, 1, 0x1a3a1a, 0.1).setDepth(-10);
                    
                    // 2. Environment (Buildings & Rocks - like reference)
                    this.env = this.physics.add.staticGroup();
                    
                    // Rocks
                    for(let i=0; i<15; i++) {
                        const rX = Phaser.Math.Between(50, vw-50);
                        const rY = Phaser.Math.Between(50, vh-50);
                        if(Phaser.Math.Distance.Between(rX, rY, vw/2, vh/2) > 80) {
                            const r = new Rock(this, rX, rY, 15 + Math.random()*20);
                            this.env.add(r);
                        }
                    }

                    // Buildings
                    const home1 = new Building(this, vw*0.7, vh*0.8, 120, 80, 0x78350f, 0x451a03);
                    const home2 = new Building(this, vw*0.8, vh*0.85, 100, 100, 0x134e4a, 0x064e3b);
                    this.env.add(home1);
                    this.env.add(home2);

                    // 3. Player
                    this.player = new Soldier(this, vw / 2, vh / 2);
                    this.physics.add.collider(this.player, this.env);

                    // 4. Bullets
                    this.bullets = this.physics.add.group({
                        defaultKey: 'bullet',
                        maxSize: 30
                    });

                    // 5. Controls
                    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
                    
                    // 6. Shooting Logic
                    this.input.on('pointerdown', (pointer) => {
                        this.shoot(pointer.worldX, pointer.worldY);
                    });

                    // 7. World Bounds
                    this.physics.world.setBounds(0, 0, vw, vh);

                    // Muzzle Flash Effect
                    this.flash = this.add.circle(0, 0, 8, 0xfacc15).setAlpha(0).setDepth(100);
                }

                update() {
                    const speed = 200;
                    const { W, A, S, D } = this.wasd;
                    
                    // Movement
                    let vx = 0, vy = 0;
                    if (W.isDown) vy = -1;
                    if (S.isDown) vy = 1;
                    if (A.isDown) vx = -1;
                    if (D.isDown) vx = 1;

                    if (vx !== 0 || vy !== 0) {
                        const length = Math.sqrt(vx * vx + vy * vy);
                        this.player.body.setVelocity(vx/length * speed, vy/length * speed);
                    } else {
                        this.player.body.setVelocity(0, 0);
                    }

                    // Aiming
                    const pointer = this.input.activePointer;
                    this.player.updateAim(pointer.worldX, pointer.worldY);
                }

                shoot(targetX, targetY) {
                    if (ammo <= 0) {
                        setStatus('OUT OF AMMO');
                        return;
                    }

                    // Calculate bullet direction
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
                    
                    // Muzzle Flash
                    const muzzleX = this.player.x + Math.cos(angle) * 30;
                    const muzzleY = this.player.y + Math.sin(angle) * 30;
                    this.flash.setPosition(muzzleX, muzzleY).setAlpha(1).setScale(1);
                    this.tweens.add({
                        targets: this.flash,
                        alpha: 0,
                        scale: 0.5,
                        duration: 80
                    });

                    // Create Bullet (Graphic based)
                    const bGfx = this.add.graphics();
                    bGfx.fillStyle(0xfacc15, 1);
                    bGfx.fillRect(-4, -1, 8, 2);
                    
                    const bullet = this.add.container(muzzleX, muzzleY, [bGfx]);
                    this.physics.add.existing(bullet);
                    bullet.body.setVelocity(Math.cos(angle) * 800, Math.sin(angle) * 800);
                    bullet.setRotation(angle);

                    // Environment Collision
                    this.physics.add.collider(bullet, this.env, () => {
                        bullet.destroy();
                        bGfx.destroy();
                    });

                    // Auto-destroy bullet after 1s
                    this.time.delayedCall(1000, () => {
                        if (bullet.active) {
                            bullet.destroy();
                            bGfx.destroy();
                        }
                    });

                    // Update State
                    setAmmo(prev => Math.max(0, prev - 1));
                    if (ammo < 5) setStatus('AMMO LOW');
                }
            }

            // --- INITIALIZE PHASER ---
            const config = {
                type: Phaser.AUTO,
                parent: gameContainerRef.current,
                width: 1000,
                height: 600,
                backgroundColor: '#0a0f0a',
                physics: {
                    default: 'arcade',
                    arcade: { debug: false }
                },
                scene: [GameScene]
            };

            game = new Phaser.Game(config);
        });

        return () => {
            if (game) game.destroy(true);
        };
    }, [ammo]);

    // --- UI OVERLAYS (HEALTH MONITOR) ---
    return (
        <div style={{ position: 'relative', width: '1000px', height: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
            {/* Phaser Canvas */}
            <div ref={gameContainerRef} />

            {/* Health Monitor Top-Left */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.7)', borderLeft: '4px solid #22c55e', color: '#fff' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px', letterSpacing: '2px' }}>OPERATIVE_07</div>
                <div style={{ display: 'flex', gap: '3px' }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{ 
                            width: '12px', 
                            height: '18px', 
                            backgroundColor: i < (health / 10) ? '#22c55e' : '#1e293b',
                            boxShadow: i < (health / 10) ? '0 0 8px #22c55e' : 'none'
                        }} />
                    ))}
                </div>
                <div style={{ fontSize: '10px', marginTop: '10px', color: '#4ade80' }}>VIT: {health}%</div>
            </div>

            {/* Current Objectives Panel Top-Left (below Health) */}
            <div style={{ position: 'absolute', top: '130px', left: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.5)', borderLeft: '2px solid #334155', color: '#94a3b8', width: '200px' }}>
                <div style={{ fontSize: '11px', color: '#22c55e', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '1px' }}>CURRENT OBJECTIVES</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px' }}>
                    <li style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>◽ Terminal Alpha</span> <span style={{ color: '#facc15' }}>2/4</span>
                    </li>
                    <li style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>◽ Terminal Beta</span> <span style={{ color: '#facc15' }}>1/4</span>
                    </li>
                    <li style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>◽ Terminal Gamma</span> <span style={{ color: '#facc15' }}>1/4</span>
                    </li>
                </ul>
            </div>

            {/* Ammo Counter Bottom-Center */}
            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '10px 30px', borderRadius: '5px', border: '1px solid #334155' }}>
                <div>
                   <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{ammo}</span>
                   <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '5px' }}>/ 90</span>
                </div>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#334155' }} />
                <div style={{ fontSize: '12px', color: status.includes('OUT') ? '#ef4444' : '#f59e0b', letterSpacing: '1px' }}>{status}</div>
            </div>

            {/* Control Hints Bottom-Right */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                {['W', 'A', 'S', 'D'].map(k => (
                    <div key={k} style={{ width: '30px', height: '30px', border: '1px solid #475569', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', borderRadius: '4px' }}>{k}</div>
                ))}
            </div>
        </div>
    );
};

export default TopDownShooter;
