"use client";
import React, { useEffect, useRef, useState } from "react";
import * as pc from "playcanvas";
import { GoapAgent, PlayerEntity, WORLD_LOCATIONS } from "../../lib/goap/agent";
import DebugPanel from "./DebugPanel";
import styles from "./SimulationCanvas.module.css";

export default function SimulationPlayCanvas() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const appRef = useRef(null);
    const [debugState, setDebugState] = useState(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize GOAP
        const agentLogic = new GoapAgent();
        const playerLogic = new PlayerEntity();
        agentLogic.setPlayerTarget(playerLogic);

        // --- PLAYCANVAS ENGINE SETUP ---
        const app = new pc.Application(canvasRef.current, {
            mouse: new pc.Mouse(canvasRef.current),
            touch: new pc.TouchDevice(canvasRef.current),
            keyboard: new pc.Keyboard(window),
            graphicsDeviceOptions: { alpha: false }
        });

        // Efficiently disable audio to prevent "Cannot suspend a closed AudioContext"
        if (app.systems.sound) {
            app.systems.sound.enabled = false;
        }
        if (app.soundManager) {
            app.soundManager.suspend();
        }

        app.setCanvasFillMode(pc.FILLMODE_NONE);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);
        app.start();
        appRef.current = app;

        // --- WORLD GENERATION ---
        const to3D = (pos) => ({
            x: (pos.x - 400) / 10,
            y: 0,
            z: (pos.y - 300) / 10
        });

        // 💡 Lighting & Atmospherics
        try {
            app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.3);

            // In PlayCanvas 2.x, some properties might be getter-only or renamed
            if (Object.getOwnPropertyDescriptor(pc.Scene.prototype, 'fog')) {
                app.scene.fog = pc.FOG_EXP2;
            } else {
                // Fallback for different API versions
                app.scene.fogType = pc.FOG_EXP2;
            }

            app.scene.fogDensity = 0.01;
            app.scene.fogColor = new pc.Color(0.05, 0.05, 0.1);
        } catch (e) {
            console.warn("Scene lighting config partially failed (API mismatch):", e);
        }

        const light = new pc.Entity("Sun");
        light.addComponent("light", {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: new pc.Color(1, 1, 0.9),
            castShadows: true,
            shadowBias: 0.2,
            shadowDistance: 100,
            normalOffsetBias: 0.05,
            intensity: 1.5
        });
        light.setEulerAngles(45, 135, 0);
        app.root.addChild(light);

        // 🎥 Camera
        const camera = new pc.Entity("Camera");
        camera.addComponent("camera", { clearColor: new pc.Color(0.05, 0.05, 0.1) });
        camera.setPosition(0, 30, 45);
        camera.setEulerAngles(-35, 0, 0);
        app.root.addChild(camera);

        // 🌳 Environment (The Forest Floor)
        const ground = new pc.Entity("Ground");
        const groundMat = new pc.StandardMaterial();
        groundMat.diffuse = new pc.Color(0.1, 0.2, 0.05);
        groundMat.useMetalness = true;
        groundMat.metalness = 0.3;
        groundMat.update();

        ground.addComponent("model", { type: "box" });
        ground.setLocalScale(150, 0.1, 150);
        ground.model.meshInstances[0].material = groundMat;
        app.root.addChild(ground);

        // --- PREFAB BUILDERS ---

        const createProBuilding = (loc, color, label, icon) => {
            const p = to3D(loc);
            const building = new pc.Entity(label);
            building.setPosition(p.x, 2, p.z);

            // Base
            const box = new pc.Entity();
            box.addComponent("model", { type: "box" });
            box.setLocalScale(6, 4, 6);
            const mat = new pc.StandardMaterial();
            mat.diffuse = color;
            mat.emissive = color;
            mat.emissiveIntensity = 0.1;
            mat.update();
            box.model.meshInstances[0].material = mat;
            building.addChild(box);

            // Roof
            const roof = new pc.Entity();
            roof.addComponent("model", { type: "cone" });
            roof.setPosition(0, 3, 0);
            roof.setLocalScale(6, 3, 6);
            const rMat = new pc.StandardMaterial();
            rMat.diffuse = new pc.Color(0.2, 0.1, 0.05);
            rMat.update();
            roof.model.meshInstances[0].material = rMat;
            building.addChild(roof);

            app.root.addChild(building);
        };

        createProBuilding(WORLD_LOCATIONS.foodShack, new pc.Color(0.9, 0.6, 0.1), "FOOD_FACTORY", "🥩");
        createProBuilding(WORLD_LOCATIONS.restArea, new pc.Color(0.5, 0.3, 0.9), "SLEEP_CABIN", "💤");

        // --- CHARACTERS ---

        const createChibiAgent = (isAgent) => {
            const entity = new pc.Entity(isAgent ? "Agent" : "Player");

            // Body
            const body = new pc.Entity();
            body.addComponent("model", { type: "capsule" });
            body.setLocalScale(1, 1, 1);
            const bMat = new pc.StandardMaterial();
            bMat.diffuse = isAgent ? new pc.Color(0.3, 0.4, 0.5) : new pc.Color(0.8, 0.1, 0.1);
            bMat.update();
            body.model.meshInstances[0].material = bMat;
            entity.addChild(body);

            // Head
            const head = new pc.Entity();
            head.addComponent("model", { type: "sphere" });
            head.setLocalPosition(0, 1.2, 0);
            head.setLocalScale(1.2, 1.2, 1.2);
            const hMat = new pc.StandardMaterial();
            hMat.diffuse = new pc.Color(1, 0.9, 0.8);
            hMat.update();
            head.model.meshInstances[0].material = hMat;
            entity.addChild(head);

            if (isAgent) {
                // 🎀 The Ribbon
                const ribbon = new pc.Entity();
                ribbon.addComponent("model", { type: "sphere" });
                ribbon.setLocalPosition(0, 1.8, -0.2);
                ribbon.setLocalScale(0.5, 0.3, 0.3);
                const rMat = new pc.StandardMaterial();
                rMat.diffuse = new pc.Color(1, 0, 0);
                rMat.emissive = new pc.Color(1, 0, 0);
                rMat.update();
                ribbon.model.meshInstances[0].material = rMat;
                entity.addChild(ribbon);
            }

            app.root.addChild(entity);
            return entity;
        };

        const agentEntity = createChibiAgent(true);
        const playerEntity = createChibiAgent(false);

        // Nature (Procedural Forest)
        for (let i = 0; i < 30; i++) {
            const tree = new pc.Entity("Tree");
            tree.addComponent("model", { type: "cone" });
            const tx = (Math.random() - 0.5) * 100;
            const tz = (Math.random() - 0.5) * 100;
            if (Math.hypot(tx, tz) < 15) continue;

            tree.setPosition(tx, 2, tz);
            tree.setLocalScale(3, 4, 3);
            const tMat = new pc.StandardMaterial();
            tMat.diffuse = new pc.Color(0.05, Math.random() * 0.2 + 0.1, 0.05);
            tMat.update();
            tree.model.meshInstances[0].material = tMat;
            app.root.addChild(tree);
        }

        // --- UPDATE LOOP ---
        let timer = 0;
        app.on("update", (dt) => {
            timer += dt;
            agentLogic.update(dt);

            // Sync Agent
            const ap = to3D(agentLogic.position);
            agentEntity.setPosition(ap.x, 0.8 + Math.sin(timer * 4) * 0.2, ap.z);

            if (agentLogic.isMoving && agentLogic.moveTarget) {
                const target = to3D(agentLogic.moveTarget);
                agentEntity.lookAt(target.x, 0.8, target.z);
                agentEntity.rotateLocal(0, 180, 0);
            }

            // Sync Player (WASD + Arrows)
            const speed = 15;
            let moved = false;
            const pos = playerEntity.getPosition();

            if (app.keyboard.isPressed(pc.KEY_W) || app.keyboard.isPressed(pc.KEY_UP)) { pos.z -= speed * dt; moved = true; }
            if (app.keyboard.isPressed(pc.KEY_S) || app.keyboard.isPressed(pc.KEY_DOWN)) { pos.z += speed * dt; moved = true; }
            if (app.keyboard.isPressed(pc.KEY_A) || app.keyboard.isPressed(pc.KEY_LEFT)) { pos.x -= speed * dt; moved = true; }
            if (app.keyboard.isPressed(pc.KEY_D) || app.keyboard.isPressed(pc.KEY_RIGHT)) { pos.x += speed * dt; moved = true; }

            if (moved) {
                playerEntity.setPosition(pos.x, 0.8, pos.z);
                playerLogic.position = { x: pos.x * 10 + 400, y: pos.z * 10 + 300 };
            }

            setDebugState(agentLogic.getDebugState());
        });

        const handleResize = () => app.resizeCanvas();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (app) {
                app.destroy();
            }
        };
    }, []);

    return (
        <div className={styles.simulationWrapper}>
            <div className={styles.canvasSection}>
                <div className={styles.canvasHeader}>
                    <h3>⚙️ PlayCanvas 3D Production Engine</h3>
                    <div className={styles.engineBadge} style={{ background: 'linear-gradient(90deg, #f59e0b, #ea580c)' }}>PLAYCANVAS</div>
                </div>
                <div className={styles.canvasContainer} style={{ height: '600px' }}>
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                    <div className={styles.instructions}>
                        <div className={styles.instructionItem}><span className={styles.key}>WASD</span> to Drive Player</div>
                        <div style={{ marginTop: '8px', fontSize: '10px', color: '#f59e0b' }}>🔥 High-Performance Hardware Accelerated</div>
                    </div>
                </div>
            </div>
            <DebugPanel debugState={debugState} />
        </div>
    );
}
