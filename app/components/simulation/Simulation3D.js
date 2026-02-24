"use client";
import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    OrbitControls,
    PerspectiveCamera,
    Sky,
    ContactShadows,
    Html,
    Environment,
    Float,
    KeyboardControls,
    useKeyboardControls,
    RoundedBox
} from "@react-three/drei";
import { Physics, RigidBody, ColliderDesc, CapsuleCollider } from "@react-three/rapier";
import * as THREE from "three";
import { GoapAgent, PlayerEntity, WORLD_LOCATIONS } from "../../lib/goap/agent";
import DebugPanel from "./DebugPanel";
import styles from "./Simulation3D.module.css";

const to3D = (pos) => ({
    x: (pos.x - 400) / 10,
    z: (pos.y - 300) / 10,
    y: 0
});

// --- Procedural Components ---

const GameBuilding = ({ pos, label, emoji, color, height = 5 }) => {
    const p = to3D(pos);
    return (
        <RigidBody type="fixed" colliders="cuboid" position={[p.x, 0, p.z]}>
            {/* Main Structure */}
            <RoundedBox args={[6, height, 5]} radius={0.5} smoothness={4}>
                <meshStandardMaterial color={color} roughness={0.6} />
            </RoundedBox>
            {/* Roof */}
            <mesh position={[0, height / 2 + 0.8, 0]}>
                <cylinderGeometry args={[0, 4.5, 2, 4]} />
                <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} />
            </mesh>
            {/* Label */}
            <Html position={[0, height / 2 + 2, 0]} center distanceFactor={15}>
                <div style={{
                    background: 'rgba(0,0,0,0.85)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    borderLeft: `4px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backdropFilter: 'blur(4px)'
                }}>
                    <span style={{ fontSize: '14px' }}>{emoji}</span> {label.toUpperCase()}
                </div>
            </Html>
        </RigidBody>
    );
};

const ProceduralCharacter = ({ color, isAgent, debug, bodyRef }) => {
    const isAttacking = debug?.currentAction === 'Attack Player';
    const characterColor = isAttacking ? "#ef4444" : color;

    return (
        <group>
            {/* Body */}
            <mesh position={[0, 0.9, 0]} castShadow>
                <capsuleGeometry args={[0.4, 1]} />
                <meshStandardMaterial color={characterColor} roughness={0.5} />
            </mesh>

            {/* Head */}
            <mesh position={[0, 1.8, 0]} castShadow>
                <sphereGeometry args={[0.45]} />
                <meshStandardMaterial color={isAgent ? "#fef3c7" : "#fee2e2"} roughness={0.3} />
            </mesh>

            {/* 🎀 The Bow (For Agent) */}
            {isAgent && (
                <group position={[0, 2.1, -0.2]}>
                    <mesh position={[-0.2, 0, 0]}>
                        <sphereGeometry args={[0.15]} />
                        <meshStandardMaterial color="#ef4444" />
                    </mesh>
                    <mesh position={[0.2, 0, 0]}>
                        <sphereGeometry args={[0.15]} />
                        <meshStandardMaterial color="#ef4444" />
                    </mesh>
                    <mesh>
                        <sphereGeometry args={[0.08]} />
                        <meshStandardMaterial color="#ef4444" />
                    </mesh>
                </group>
            )}

            {/* Eyes */}
            <group position={[0, 1.85, 0.35]}>
                <mesh position={[-0.15, 0, 0]}>
                    <sphereGeometry args={[0.05]} />
                    <meshStandardMaterial color="#2563eb" />
                </mesh>
                <mesh position={[0.15, 0, 0]}>
                    <sphereGeometry args={[0.05]} />
                    <meshStandardMaterial color="#2563eb" />
                </mesh>
            </group>
        </group>
    );
};

const AIAgentCharacter = ({ agent, debug }) => {
    const rigidBody = useRef();

    useFrame((state) => {
        if (!agent || !rigidBody.current) return;
        const p = to3D(agent.position);
        rigidBody.current.setNextKinematicTranslation({ x: p.x, y: 0, z: p.z });

        if (agent.isMoving && agent.moveTarget) {
            const target = to3D(agent.moveTarget);
            const angle = Math.atan2(target.x - p.x, target.z - p.z);
            rigidBody.current.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, 0)));
        }
    });

    return (
        <RigidBody ref={rigidBody} type="kinematicPosition" colliders={false}>
            <CapsuleCollider args={[0.8, 0.45]} position={[0, 0.9, 0]} />
            <ProceduralCharacter color="#475569" isAgent debug={debug} />
            <Html position={[0, 3, 0]} center>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: '40px', height: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${debug?.health || 0}%`, height: '100%', background: '#22c55e' }} />
                    </div>
                    <div style={{ color: '#fff', fontSize: '9px', fontWeight: 'bold', textShadow: '0 1px 2px #000', marginTop: '2px' }}>AI AGENT</div>
                </div>
            </Html>
        </RigidBody>
    );
};

const ControlledPlayer = ({ player }) => {
    const rigidBody = useRef();
    const [, getKeys] = useKeyboardControls();
    const speed = 15;

    useFrame((state, delta) => {
        if (!rigidBody.current) return;
        const { forward, backward, left, right } = getKeys();
        const movement = new THREE.Vector3(0, 0, 0);
        if (forward) movement.z -= 1;
        if (backward) movement.z += 1;
        if (left) movement.x -= 1;
        if (right) movement.x += 1;

        if (movement.length() > 0) {
            movement.normalize().multiplyScalar(speed * delta);
            const currentPos = rigidBody.current.translation();
            const newX = (currentPos.x + movement.x) * 10 + 400;
            const newZ = (currentPos.z + movement.z) * 10 + 300;
            player.position = { x: newX, y: newZ };
            rigidBody.current.setNextKinematicTranslation({
                x: currentPos.x + movement.x,
                y: 0,
                z: currentPos.z + movement.z
            });
            const angle = Math.atan2(movement.x, movement.z);
            rigidBody.current.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, 0)));
        }
    });

    return (
        <RigidBody ref={rigidBody} type="kinematicPosition" colliders={false} position={[0, 0, 0]}>
            <CapsuleCollider args={[0.8, 0.45]} position={[0, 0.9, 0]} />
            <ProceduralCharacter color="#ef4444" isAgent={false} />
            <Html position={[0, 2.5, 0]} center>
                <div style={{ color: '#ef4444', fontSize: '9px', fontWeight: 'bold', textShadow: '0 1px 2px #000' }}>YOU (WASD)</div>
            </Html>
        </RigidBody>
    );
};

const Tree = ({ position }) => (
    <group position={position}>
        <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 2]} />
            <meshStandardMaterial color="#5a3825" />
        </mesh>
        {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 2 + i * 1, 0]} castShadow>
                <coneGeometry args={[1.5 - i * 0.3, 2, 8]} />
                <meshStandardMaterial color="#2d5a27" />
            </mesh>
        ))}
    </group>
);

const Scene = ({ agent, player, debugState }) => (
    <>
        <PerspectiveCamera makeDefault position={[0, 30, 40]} fov={50} />
        <OrbitControls maxPolarAngle={Math.PI / 2.1} minDistance={10} maxDistance={80} enableDamping />

        <color attach="background" args={["#0a0a0f"]} />
        <fog attach="fog" args={["#0a0a0f", 30, 90]} />

        <ambientLight intensity={0.8} />
        <pointLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <directionalLight
            position={[-20, 40, -20]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
        />

        <Physics debug={false} gravity={[0, -9.81, 0]}>
            <RigidBody type="fixed" receiveShadow colliders="cuboid">
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                    <planeGeometry args={[150, 150]} />
                    <meshStandardMaterial color="#1a2e05" roughness={1} />
                </mesh>
            </RigidBody>

            <GameBuilding pos={WORLD_LOCATIONS.foodShack} color="#f59e0b" label="Food Factory" emoji="🌭" />
            <GameBuilding pos={WORLD_LOCATIONS.restArea} color="#8b5cf6" label="Rest Cabin" emoji="🏠" />

            <AIAgentCharacter agent={agent} debug={debugState} />
            <ControlledPlayer player={player} />

            {useMemo(() => {
                const trees = [];
                for (let i = 0; i < 24; i++) {
                    const x = (Math.sin(i * 137) * 50);
                    const z = (Math.cos(i * 137) * 50);
                    if (Math.hypot(x, z) > 12) trees.push(<Tree key={i} position={[x, 0, z]} />);
                }
                return trees;
            }, [])}
        </Physics>

        <ContactShadows position={[0, 0.01, 0]} resolution={512} scale={120} blur={2.5} opacity={0.5} far={10} />
    </>
);

export default function Simulation3D() {
    const agentRef = useRef(null);
    const playerRef = useRef(null);
    const [debugState, setDebugState] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [simSpeed, setSimSpeed] = useState(1);
    const isPausedRef = useRef(false);
    const simSpeedRef = useRef(1);

    useEffect(() => {
        const agent = new GoapAgent();
        const player = new PlayerEntity();
        agent.setPlayerTarget(player);
        agentRef.current = agent;
        playerRef.current = player;
        let lastTime = performance.now();
        const gameLoop = (timestamp) => {
            const deltaTime = (timestamp - lastTime) / 1000;
            lastTime = timestamp;
            if (!isPausedRef.current) {
                const dt = Math.min(deltaTime, 0.1) * simSpeedRef.current;
                agent.update(dt);
                player.update(dt);
            }
            setDebugState(agent.getDebugState());
            requestAnimationFrame(gameLoop);
        };
        const animId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animId);
    }, []);

    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { simSpeedRef.current = simSpeed; }, [simSpeed]);

    const keyboardMap = [
        { name: "forward", keys: ["ArrowUp", "KeyW"] },
        { name: "backward", keys: ["ArrowDown", "KeyS"] },
        { name: "left", keys: ["ArrowLeft", "KeyA"] },
        { name: "right", keys: ["ArrowRight", "KeyD"] },
    ];

    return (
        <KeyboardControls map={keyboardMap}>
            <div className={styles.simulationWrapper}>
                <div className={styles.canvasSection}>
                    <div className={styles.canvasHeader}>
                        <h3>🧊 3D Engine (Offline)</h3>
                        <div className={styles.controls}>
                            <button className={`${styles.controlBtn} ${isPaused ? styles.active : ""}`} onClick={() => setIsPaused(!isPaused)}>
                                {isPaused ? "▶ Play" : "⏸ Pause"}
                            </button>
                            <select value={simSpeed} onChange={(e) => setSimSpeed(Number(e.target.value))} className={styles.controlBtn}>
                                <option value={0.5}>0.5x</option>
                                <option value={1}>1x</option>
                                <option value={2}>2x</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.canvasContainer}>
                        <Canvas shadows className={styles.scene}>
                            <Scene agent={agentRef.current} player={playerRef.current} debugState={debugState} />
                        </Canvas>
                        <div className={styles.instructions}>
                            <div className={styles.instructionItem}><span className={styles.key}>WASD / Arrows</span> to Move Yourself</div>
                            <div className={styles.instructionItem}><span className={styles.key}>Mouse Drag</span> to Look Around</div>
                        </div>
                    </div>
                </div>
                <DebugPanel debugState={debugState} />
            </div>
        </KeyboardControls>
    );
}
