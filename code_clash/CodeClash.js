'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * CODE CLASH - PREMIUM TACTICAL EDITION
 * UI IDENTICAL TO game/play/1/1
 * 
 * Includes: 
 * - Multi-Zone HUD Overlay (Health, Objectives, Radar, Compass, Arsenal)
 * - Tactical World Rendering (Procedural Grass, Buildings, Rocks)
 * - Educational "Hunt-to-Learn" Logic Loop
 */

const CodeClash = () => {
    const gameRef = useRef(null);
    const [points, setPoints] = useState(0);
    const [health, setHealth] = useState(100);
    const [ammo, setAmmo] = useState(29);
    const [currentConcept, setCurrentConcept] = useState(null);

    const logicTreasures = [
        { title: "Variables", concept: "Variables store data. Like 'let score = 0;'.", code: "let score = 0;", tip: "Think of them as boxes." },
        { title: "Conditional Logic", concept: "Computers use 'If' to make choices.", code: "if(health < 10) { heal(); }", tip: "Binary choices like Yes/No." },
        { title: "Loops", concept: "Loops repeat code efficiently.", code: "while(running) { move(); }", tip: "Saves you from typing same code 100 times." }
    ];

    useEffect(() => {
        let game;
        const initPhaser = async () => {
            const Phaser = await import('phaser');

            // --- TACTICAL ENVIRONMENT ---
            class Building extends Phaser.GameObjects.Container {
                constructor(scene, x, y, w, h, baseCol, roofCol) {
                    super(scene, x, y);
                    const g = scene.add.graphics();
                    g.fillStyle(baseCol, 1).fillRect(-w/2, -h/2, w, h);
                    g.lineStyle(2, 0x000000, 0.4).strokeRect(-w/2, -h/2, w, h);
                    g.fillStyle(0xccf1ff, 0.6); // Windows
                    const s = 8;
                    for (let r = -h/2 + 10; r < h/2 - 10; r += 25) {
                        for (let c = -w/2 + 10; c < w/2 - 10; c += 25) {
                            g.fillRect(c, r, s, s);
                        }
                    }
                    g.fillStyle(roofCol, 1).fillRect(-w/2 - 2, -h/2 - 2, w + 4, 12);
                    this.add(g);
                    scene.add.existing(this);
                    scene.physics.add.existing(this, true);
                }
            }

            class Rock extends Phaser.GameObjects.Container {
                constructor(scene, x, y, size) {
                    super(scene, x, y);
                    const g = scene.add.graphics();
                    g.fillStyle(0x334155, 1);
                    const points = [];
                    for (let i = 0; i < 6; i++) {
                        const a = (i / 6) * Math.PI * 2;
                        const r = size * (0.8 + Math.random() * 0.4);
                        points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
                    }
                    g.fillPoints(points, true);
                    this.add(g);
                    scene.add.existing(this);
                    scene.physics.add.existing(this, true);
                }
            }

            // --- ENTITIES ---
            class Hero extends Phaser.GameObjects.Container {
                constructor(scene, x, y) {
                    super(scene, x, y);
                    const g = scene.add.graphics();
                    g.fillStyle(0xef4444, 1).fillCircle(0, 0, 15); // Red body
                    g.fillStyle(0xf8fafc, 1).fillRect(-15, -2, 30, 4); // White center stripe
                    g.fillStyle(0x000000, 0.3).fillCircle(0, 0, 8); // Head
                    this.add(g);
                    scene.add.existing(this);
                    scene.physics.add.existing(this);
                    this.body.setCollideWorldBounds(true).setCircle(15).setOffset(-15, -15);
                }
            }

            class Bug extends Phaser.GameObjects.Container {
                constructor(scene, x, y) {
                    super(scene, x, y);
                    const g = scene.add.graphics();
                    g.fillStyle(0x111827, 1).fillCircle(0, 0, 12);
                    g.fillStyle(0xef4444, 1).fillCircle(0, 0, 4); // Glitch core
                    this.add(g);
                    scene.add.existing(this);
                    scene.physics.add.existing(this);
                    this.body.setCircle(12).setOffset(-12, -12);
                    this.health = 2;
                }
            }

            class ClashScene extends Phaser.Scene {
                constructor() { super('ClashScene'); }

                create() {
                    const { width: vw, height: vh } = this.scale;
                    
                    // Grass Environment
                    this.add.rectangle(vw/2, vh/2, vw, vh, 0x3d5a35).setDepth(-20);
                    this.add.grid(vw/2, vh/2, vw, vh, 40, 40, 0x000000, 0.05).setDepth(-19);

                    // Static Objects
                    this.env = this.physics.add.staticGroup();
                    new Building(this, vw*0.7, vh*0.8, 140, 90, 0x78350f, 0x451a03); 
                    new Building(this, vw*0.8, vh*0.85, 100, 100, 0x134e4a, 0x064e3b);
                    for(let i=0; i<10; i++) new Rock(this, Phaser.Math.Between(50, vw-50), Phaser.Math.Between(50, vh-50), 10 + Math.random()*15);

                    // Actors
                    this.player = new Hero(this, vw/2, vh/2);
                    this.enemies = this.physics.add.group();
                    this.bullets = this.physics.add.group();

                    this.spawnEnemy();

                    // Collisions
                    this.physics.add.collider(this.player, this.env);
                    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
                        b.destroy(); e.health--;
                        if(e.health <= 0) {
                            this.points += 100;
                            setPoints(p => p + 100);
                            this.dropTreasure(e.x, e.y);
                            e.destroy();
                        }
                    });

                    // Controls
                    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
                    this.input.on('pointerdown', p => this.fire(p.x, p.y));
                }

                update() {
                    let vx=0, vy=0;
                    if(this.wasd.W.isDown) vy=-1; if(this.wasd.S.isDown) vy=1;
                    if(this.wasd.A.isDown) vx=-1; if(this.wasd.D.isDown) vx=1;
                    const spd = 200;
                    if(vx!==0 || vy!==0) {
                        const l = Math.sqrt(vx*vx+vy*vy);
                        this.player.body.setVelocity(vx/l*spd, vy/l*spd);
                    } else this.player.body.setVelocity(0,0);

                    this.enemies.getChildren().forEach(e => this.physics.moveToObject(e, this.player, 60));
                }

                spawnEnemy() {
                    this.enemies.add(new Bug(this, Phaser.Math.Between(100, 900), Phaser.Math.Between(100, 500)));
                }

                fire(tx, ty) {
                    const b = this.add.circle(this.player.x, this.player.y, 4, 0xfacc15);
                    this.bullets.add(b);
                    const a = Phaser.Math.Angle.Between(this.player.x, this.player.y, tx, ty);
                    b.body.setVelocity(Math.cos(a)*600, Math.sin(a)*600);
                    this.time.delayedCall(1000, () => b.destroy());
                }

                dropTreasure(x, y) {
                    const chest = this.add.rectangle(x, y, 30, 20, 0xfacc15);
                    this.physics.add.existing(chest, true);
                    this.physics.add.overlap(this.player, chest, () => {
                        chest.destroy();
                        setCurrentConcept(logicTreasures[Math.floor(Math.random()*logicTreasures.length)]);
                        this.scene.pause();
                    });
                }
            }

            const config = {
                type: Phaser.AUTO, parent: gameRef.current, width: 1000, height: 600,
                physics: { default: 'arcade', arcade: { debug: false } },
                scene: [ClashScene]
            };
            game = new Phaser.Game(config);
        };
        initPhaser();
        return () => { if(game) game.destroy(true); };
    }, []);

    const HUD_BAR_STYLE = { height: '8px', marginBottom: '4px', display: 'flex', gap: '2px' };

    return (
        <div style={{ position: 'relative', width: '1000px', height: '600px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid #1e293b', fontFamily: '"Courier New", monospace' }}>
            {/* Phaser Engine Container */}
            <div ref={gameRef} />

            {/* --- TOP-LEFT: STATUS HUD --- */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', display: 'flex', flexDirection: 'column', color: '#fff' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: '#86efac', marginBottom: '8px' }}>CODER_07</div>
                <div style={{ width: '140px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '2px' }}>
                    <div style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '4px' }}>VIT</div>
                    <div style={HUD_BAR_STYLE}>
                        {Array.from({length: 12}).map((_,i) => <div key={i} style={{ width: '8px', height: '100%', backgroundColor: i < 8 ? '#22c55e' : '#1e293b' }} />)}
                    </div>
                    <div style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '4px', marginTop: '6px' }}>XP</div>
                    <div style={HUD_BAR_STYLE}>
                        {Array.from({length: 12}).map((_,i) => <div key={i} style={{ width: '8px', height: '6px', backgroundColor: i < 5 ? '#3b82f6' : '#1e1b4b' }} />)}
                    </div>
                </div>
            </div>

            {/* --- TOP-LEFT 2: OBJECTIVES --- */}
            <div style={{ position: 'absolute', top: '120px', left: '15px', padding: '10px 15px', backgroundColor: 'rgba(0,0,0,0.5)', borderLeft: '3px solid #166534', color: '#fff' }}>
                <div style={{ fontSize: '10px', color: '#86efac', fontWeight: 'bold', marginBottom: '8px' }}>CURRENT OBJECTIVES</div>
                <div style={{ fontSize: '9px', color: '#cbd5e1' }}>
                    <div style={{ marginBottom: '4px' }}>◽ Terminal Alpha <span style={{ float: 'right', color: '#facc15' }}>2*</span></div>
                    <div style={{ marginBottom: '4px' }}>◽ Terminal Beta <span style={{ float: 'right', color: '#fbbf24' }}>1*</span></div>
                    <div>◽ Terminal Gamma <span style={{ float: 'right', color: '#f59e0b' }}>1*</span></div>
                </div>
            </div>

            {/* --- TOP-CENTER: COMPASS --- */}
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '35px', backgroundColor: 'rgba(15, 23, 42, 0.85)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ position: 'relative', width: '280px', height: '20px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '10px', display: 'flex', justifyContent: 'space-around' }}>
                        <span>330</span> <span>345</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>N</span> <span>15</span> <span>30</span> <span style={{ color: '#94a3b8' }}>NE</span>
                    </div>
                    <div style={{ position: 'absolute', top: '-5px', left: '50%', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #facc15' }} />
                </div>
                <div style={{ position: 'absolute', top: '-15px', color: '#facc15', fontSize: '10px', letterSpacing: '2px' }}>FIRST STEPS</div>
            </div>

            {/* --- TOP-RIGHT: SCORE --- */}
            <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '15px' }}>
                <div style={{ padding: '5px 15px', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '2px' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#facc15' }}>{points.toString().padStart(4, '0')}</div>
                   <div style={{ fontSize: '7px', color: '#94a3b8', textAlign: 'right' }}>★ 0</div>
                </div>
                <div style={{ padding: '8px 15px', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                    ABORT_MISSION
                </div>
            </div>

            {/* --- BOTTOM-CENTER: WEAPON --- */}
            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '240px', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #1e293b', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '60px', height: '35px', backgroundColor: '#020617', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '7px', color: '#3b82f6' }}>LVL 2 S</div>
                </div>
                <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>29</span>
                        <span style={{ fontSize: '9px', color: '#475569' }}>/ 90</span>
                     </div>
                     <div style={{ fontSize: '8px', color: '#facc15', letterSpacing: '1px', marginTop: '2px' }}>LVL 2 WAND</div>
                </div>
            </div>

            {/* --- BOTTOM-RIGHT: KITS --- */}
            <div style={{ position: 'absolute', bottom: '20px', right: '15px', display: 'flex', gap: '8px' }}>
                {['SPACE', 'SHIFT', 'E', 'M'].map(key => (
                    <div key={key} style={{ minWidth: '35px', padding: '5px', backgroundColor: '#020617', border: '1px solid #334155', textAlign: 'center', borderRadius: '2px' }}>
                        <div style={{ fontSize: '9px', color: '#fff', fontWeight: 'bold' }}>{key}</div>
                        <div style={{ fontSize: '5px', color: '#475569', marginTop: '2px' }}>{key==='SPACE'?'ATTACK':key==='SHIFT'?'DASH':key==='E'?'INTERACT':'MAP'}</div>
                    </div>
                ))}
            </div>

            {/* --- BOTTOM-LEFT: RADAR --- */}
            <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '90px', height: '90px', backgroundColor: 'rgba(0,20,0,0.5)', borderRadius: '50%', border: '1px solid #14532d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle, transparent 40%, rgba(34,197,94,0.1) 100%)' }} />
                <div style={{ position: 'absolute', width: '1px', height: '100%', backgroundColor: 'rgba(34,197,94,0.2)' }} />
                <div style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(34,197,94,0.2)' }} />
                <div style={{ position: 'absolute', width: '4px', height: '4px', backgroundColor: '#fff', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: '20px', left: '60px', width: '3px', height: '3px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
            </div>

            {/* --- LOGIC TREASURE MODAL --- */}
            {currentConcept && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                   <div style={{ width: '500px', backgroundColor: '#0f172a', border: '1px solid #22c55e', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#f8fafc', boxShadow: '0 0 50px rgba(34,197,94,0.2)' }}>
                        <div style={{ fontSize: '10px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '15px' }}>Terminal Sync Complete</div>
                        <h2 style={{ fontSize: '28px', color: '#facc15', margin: '0 0 10px 0' }}>{currentConcept.title} Decoded</h2>
                        <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '25px' }}>{currentConcept.concept}</p>
                        <div style={{ backgroundColor: '#020617', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6', textAlign: 'left', marginBottom: '25px' }}>
                            <code style={{ fontSize: '14px', color: '#60a5fa' }}>{currentConcept.code}</code>
                        </div>
                        <button 
                            onClick={() => { setCurrentConcept(null); if(gameRef.current.gameInstance) gameRef.current.gameInstance.scene.scenes[0].scene.resume(); }}
                            style={{ backgroundColor: '#22c55e', color: '#052e16', padding: '12px 40px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                            RESUME MISSION
                        </button>
                   </div>
                </div>
            )}
        </div>
    );
};

export default CodeClash;
