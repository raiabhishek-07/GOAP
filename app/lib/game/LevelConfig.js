// ============================================================
// LevelConfig.js — Full 9-stage game configuration
// 3 Levels × 3 Stages = 9 Missions
// ============================================================

import { TASK_TYPE } from './TaskSystem.js';

/**
 * World size constants
 */
export const WORLD_W = 4000;
export const WORLD_H = 3000;

/**
 * Agent type definitions
 */
export const AGENT_TYPE = {
    PATROL: 'patrol',       // Wanders a set path, low threat
    STALKER: 'stalker',      // Hunts the player, medium threat
    RACER: 'racer',        // Races to complete tasks, no combat
    DEFENDER: 'defender',     // Guards specific objectives
    AMBUSHER: 'ambusher',     // Waits at chokepoints
    STRATEGIST: 'strategist',   // Plans and coordinates
    MASTERMIND: 'mastermind',   // Boss — uses all strategies
    TRAINING_DUMMY: 'training_dummy', // Target for practice
};

/**
 * Level type definitions
 */
export const LEVEL_TYPE = {
    CAMPAIGN: 'campaign',
    TRAINING: 'training',
    OPEN_WORLD: 'open_world',
};

/**
 * Agent type metadata
 */
export const AGENT_META = {
    [AGENT_TYPE.PATROL]: { speed: 55, chaseRange: 80, attackRange: 30, color: 0x90a4ae, label: 'Patrol Guard', canDoTasks: false },
    [AGENT_TYPE.STALKER]: { speed: 75, chaseRange: 400, attackRange: 300, color: 0xef5350, label: 'Shadow Stalker', canDoTasks: false },
    [AGENT_TYPE.RACER]: { speed: 100, chaseRange: 0, attackRange: 0, color: 0x42a5f5, label: 'Task Racer', canDoTasks: true },
    [AGENT_TYPE.DEFENDER]: { speed: 40, chaseRange: 350, attackRange: 300, color: 0xff9800, label: 'Defender', canDoTasks: false },
    [AGENT_TYPE.AMBUSHER]: { speed: 65, chaseRange: 250, attackRange: 300, color: 0x7e57c2, label: 'Ambusher', canDoTasks: false },
    [AGENT_TYPE.STRATEGIST]: { speed: 70, chaseRange: 180, attackRange: 300, color: 0x26c6da, label: 'Strategist', canDoTasks: true },
    [AGENT_TYPE.MASTERMIND]: { speed: 85, chaseRange: 300, attackRange: 300, color: 0xffd740, label: 'Master Mind', canDoTasks: true },
    [AGENT_TYPE.TRAINING_DUMMY]: { speed: 0, chaseRange: 0, attackRange: 0, color: 0xffff00, label: 'Target Dummy', canDoTasks: false, isTraining: true },
};

/**
 * All 9 game stages
 */
export const MIND_ARENA_LEVELS = {

    // ════════════════════════════════════════════════════════
    // LEVEL 1: FOUNDATION — "Learn to Plan"
    // ════════════════════════════════════════════════════════
    1: {
        name: 'Foundation',
        subtitle: 'Learn to Plan',
        description: 'Master the basics of strategic thinking. Observe the AI, understand task priorities, and learn to plan your approach.',
        color: '#22c55e',
        unlocked: true,
        stages: {

            // ── Stage 1.1: First Steps (Tutorial) ──
            1: {
                name: 'First Steps',
                subtitle: 'Tutorial Mission',
                objective: 'Complete 3 terminals. Learn the basics.',
                description: 'Your first mission. Learn how to move, interact with tasks, and observe how the AI agent plans its actions.',
                timeLimit: 120,
                difficulty: 1,
                showTutorial: true,
                showAgentPlan: true, // Show what the AI is planning (educational)

                playerSpawn: { x: 200, y: 800 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 1200, y: 600 } },
                    { type: AGENT_TYPE.DEFENDER, spawn: { x: 1800, y: 800 }, guardTarget: 'terminal_c' },
                    { type: AGENT_TYPE.AMBUSHER, spawn: { x: 900, y: 700 }, ambushPoints: [{ x: 800, y: 600 }, { x: 1000, y: 800 }] },
                ],

                tasks: [
                    {
                        id: 'terminal_a', type: TASK_TYPE.TERMINAL, name: 'Terminal Alpha',
                        position: { x: 600, y: 500 }, basePoints: 200, priority: 2, channelTime: 8,
                    },
                    {
                        id: 'terminal_b', type: TASK_TYPE.TERMINAL, name: 'Terminal Beta',
                        position: { x: 1200, y: 400 }, basePoints: 300, priority: 3, channelTime: 8,
                    },
                    {
                        id: 'terminal_c', type: TASK_TYPE.TERMINAL, name: 'Terminal Gamma',
                        position: { x: 1800, y: 900 }, basePoints: 500, priority: 5, channelTime: 8,
                    },
                ],

                extraction: { x: 2100, y: 1300 },

                locations: {
                    playerSpawn: { x: 200, y: 800 },
                    agentSpawn: { x: 1200, y: 600 },
                    foodShack: { x: 400, y: 300 },
                    restArea: { x: 1600, y: 1200 },
                    doorOne: { x: 900, y: 700 },
                    doorTwo: { x: 1500, y: 500 },
                    home: { x: 1400, y: 1200 },
                    healthKits: [{ x: 300, y: 700 }, { x: 1000, y: 500 }, { x: 1500, y: 800 }]
                },

                tips: [
                    'Move with WASD. Walk near terminals and press E to interact.',
                    'Watch the AI agent — it plans actions automatically using GOAP.',
                    'Higher priority tasks give more points. Terminal Gamma is worth 500!',
                    'Complete all tasks, then reach the extraction point.',
                ],
            },

            // ── Stage 1.2: Priority Call ──
            2: {
                name: 'Priority Call',
                subtitle: 'Choose Wisely',
                objective: 'Complete 4 tasks. Order matters!',
                description: 'Tasks have different priority levels. The AI always picks the optimal order. Can you do better?',
                timeLimit: 90,
                difficulty: 2,
                showTutorial: false,
                showAgentPlan: false,

                playerSpawn: { x: 150, y: 800 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 1800, y: 400 } },
                ],

                tasks: [
                    {
                        id: 'term_alpha', type: TASK_TYPE.TERMINAL, name: 'Terminal Alpha',
                        position: { x: 500, y: 400 }, basePoints: 300, priority: 3,
                    },
                    {
                        id: 'term_beta', type: TASK_TYPE.TERMINAL, name: 'Terminal Beta',
                        position: { x: 1100, y: 300 }, basePoints: 500, priority: 4,
                    },
                    {
                        id: 'term_gamma', type: TASK_TYPE.TERMINAL, name: 'Terminal Gamma',
                        position: { x: 1700, y: 1100 }, basePoints: 200, priority: 1,
                    },
                    {
                        id: 'key_delta', type: TASK_TYPE.KEY_COLLECT, name: 'Access Key Delta',
                        position: { x: 800, y: 900 }, basePoints: 100, priority: 5,
                    },
                    {
                        id: 'door_delta', type: TASK_TYPE.DOOR_UNLOCK, name: 'Secure Door',
                        position: { x: 1400, y: 700 }, basePoints: 800, priority: 5,
                        requiredTasks: ['key_delta'], requiredKey: 'key_delta',
                    },
                ],

                extraction: { x: 2000, y: 1400 },

                locations: {
                    playerSpawn: { x: 150, y: 800 },
                    agentSpawn: { x: 1800, y: 400 },
                    foodShack: { x: 300, y: 200 },
                    restArea: { x: 2000, y: 1000 },
                    doorOne: { x: 700, y: 500 },
                    doorTwo: { x: 1500, y: 600 },
                },

                tips: [
                    'The key unlocks the Secure Door which is worth 800 pts!',
                    'Prioritize: grab the key first, then the 800pt door.',
                    'The AI is actively trying to beat you. Move fast!',
                ],
            },

            // ── Stage 1.3: Time Crunch ──
            3: {
                name: 'Time Crunch',
                subtitle: 'Against the Clock',
                objective: 'Complete 4 tasks under extreme time pressure.',
                description: 'Two enemies and a tight timer. One tries to fight you, the other races to steal your objectives.',
                timeLimit: 75,
                difficulty: 3,
                showTutorial: false,
                showAgentPlan: false,

                playerSpawn: { x: 200, y: 1200 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 1000, y: 300 } },
                    { type: AGENT_TYPE.RACER, spawn: { x: 2000, y: 1000 } },
                ],

                tasks: [
                    {
                        id: 'crunch_1', type: TASK_TYPE.TERMINAL, name: 'Control Terminal',
                        position: { x: 600, y: 400 }, basePoints: 400, priority: 4,
                    },
                    {
                        id: 'crunch_2', type: TASK_TYPE.ZONE_CAPTURE, name: 'Forward Base',
                        position: { x: 1200, y: 700 }, basePoints: 500, priority: 5,
                        captureRadius: 80,
                    },
                    {
                        id: 'crunch_3', type: TASK_TYPE.TERMINAL, name: 'Comm Relay',
                        position: { x: 1800, y: 500 }, basePoints: 300, priority: 3,
                    },
                    {
                        id: 'crunch_supply', type: TASK_TYPE.RESOURCE_CACHE, name: 'Ammo Cache',
                        position: { x: 900, y: 1100 }, basePoints: 150, priority: 2,
                        uses: 2,
                    },
                ],

                extraction: { x: 2200, y: 1400 },

                locations: {
                    playerSpawn: { x: 200, y: 1200 },
                    agentSpawn: { x: 1000, y: 300 },
                    foodShack: { x: 400, y: 600 },
                    restArea: { x: 1600, y: 1300 },
                    doorOne: { x: 800, y: 800 },
                    doorTwo: { x: 1400, y: 400 },
                },

                tips: [
                    'The Task Racer (blue) will steal your objectives!',
                    'Focus on the 500pt Forward Base zone — hold it for 5 seconds.',
                    'Use dash (SHIFT) to escape the Stalker and get to tasks faster.',
                ],
            },
        },
    },

    // ════════════════════════════════════════════════════════
    // LEVEL 2: STRATEGY — "Learn to Adapt"
    // ════════════════════════════════════════════════════════
    2: {
        name: 'Strategy',
        subtitle: 'Learn to Adapt',
        description: 'Zones, resource wars, and adaptive AI. You can no longer brute-force your way through.',
        color: '#f59e0b',
        unlocked: false,
        stages: {

            // ── Stage 2.1: Multi-Front ──
            1: {
                name: 'Multi-Front',
                subtitle: 'Control the Map',
                objective: 'Capture 3 zones and complete 5 objectives.',
                description: 'The arena is divided into zones. Control them for bonus points. AI agents also fight for control.',
                timeLimit: 120,
                difficulty: 4,
                showTutorial: false,
                showAgentPlan: false,

                playerSpawn: { x: 200, y: 800 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 1600, y: 300 } },
                    { type: AGENT_TYPE.RACER, spawn: { x: 2000, y: 1200 } },
                ],

                tasks: [
                    // Zone A (North)
                    {
                        id: 'zone_north', type: TASK_TYPE.ZONE_CAPTURE, name: 'North Outpost',
                        position: { x: 500, y: 300 }, basePoints: 400, priority: 3,
                        captureRadius: 90,
                    },
                    {
                        id: 'term_north', type: TASK_TYPE.TERMINAL, name: 'North Terminal',
                        position: { x: 700, y: 250 }, basePoints: 250, priority: 2,
                    },
                    // Zone B (Center)
                    {
                        id: 'zone_center', type: TASK_TYPE.ZONE_CAPTURE, name: 'Central Command',
                        position: { x: 1200, y: 750 }, basePoints: 600, priority: 5,
                        captureRadius: 100,
                    },
                    // Zone C (South)
                    {
                        id: 'zone_south', type: TASK_TYPE.ZONE_CAPTURE, name: 'South Lookout',
                        position: { x: 1800, y: 1200 }, basePoints: 350, priority: 3,
                        captureRadius: 80,
                    },
                    {
                        id: 'term_south', type: TASK_TYPE.TERMINAL, name: 'South Terminal',
                        position: { x: 1600, y: 1100 }, basePoints: 250, priority: 2,
                    },
                ],

                extraction: { x: 2200, y: 800 },

                locations: {
                    playerSpawn: { x: 200, y: 800 },
                    agentSpawn: { x: 1600, y: 300 },
                    foodShack: { x: 300, y: 500 },
                    restArea: { x: 1900, y: 900 },
                    doorOne: { x: 900, y: 600 },
                    doorTwo: { x: 1500, y: 900 },
                },

                tips: [
                    'Central Command is worth 600 pts — highest value target!',
                    'Zones require you to stand inside uninterrupted for 5 seconds.',
                    'The AI Racer will try to capture zones before you.',
                ],
            },

            // ── Stage 2.2: Resource War ──
            2: {
                name: 'Resource War',
                subtitle: 'Scarcity & Sacrifice',
                objective: 'Complete 5 tasks with limited resources.',
                description: 'Health packs and stamina stations have limited uses. AI agents compete for the same resources.',
                timeLimit: 100,
                difficulty: 5,
                showTutorial: false,
                showAgentPlan: false,

                playerSpawn: { x: 150, y: 1200 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 800, y: 300 } },
                    { type: AGENT_TYPE.RACER, spawn: { x: 2000, y: 600 } },
                    { type: AGENT_TYPE.DEFENDER, spawn: { x: 1200, y: 800 }, guardTarget: 'valuables' },
                ],

                tasks: [
                    {
                        id: 'war_key', type: TASK_TYPE.KEY_COLLECT, name: 'Master Key',
                        position: { x: 500, y: 500 }, basePoints: 100, priority: 4,
                    },
                    {
                        id: 'war_door', type: TASK_TYPE.DOOR_UNLOCK, name: 'Vault Door',
                        position: { x: 1200, y: 800 }, basePoints: 700, priority: 5,
                        requiredTasks: ['war_key'], requiredKey: 'war_key',
                    },
                    {
                        id: 'war_term1', type: TASK_TYPE.TERMINAL, name: 'Outpost Alpha',
                        position: { x: 800, y: 1100 }, basePoints: 300, priority: 3,
                    },
                    {
                        id: 'war_term2', type: TASK_TYPE.TERMINAL, name: 'Outpost Beta',
                        position: { x: 1600, y: 400 }, basePoints: 300, priority: 3,
                    },
                    {
                        id: 'war_supply', type: TASK_TYPE.RESOURCE_CACHE, name: 'Medic Station',
                        position: { x: 1000, y: 600 }, basePoints: 50, priority: 1,
                        uses: 1,
                    },
                    {
                        id: 'war_intel', type: TASK_TYPE.INTEL_GATHER, name: 'Classified Intel',
                        position: { x: 1900, y: 1000 }, basePoints: 400, priority: 4,
                        intelFragments: 5,
                    },
                ],

                extraction: { x: 2100, y: 1400 },

                locations: {
                    playerSpawn: { x: 150, y: 1200 },
                    agentSpawn: { x: 800, y: 300 },
                    foodShack: { x: 350, y: 800 },
                    restArea: { x: 1700, y: 1300 },
                    doorOne: { x: 700, y: 700 },
                    doorTwo: { x: 1400, y: 600 },
                },

                tips: [
                    'The Defender (orange) guards the Vault. Fight or distract it.',
                    'Medic Station has only 1 use — grab it before the AI!',
                    'Vault Door is worth 700 pts but requires the Master Key first.',
                ],
            },

            // ── Stage 2.3: Counter-Intel ──
            3: {
                name: 'Counter-Intel',
                subtitle: 'The AI Watches You',
                objective: 'Complete 6 tasks while the AI counter-plans.',
                description: 'Adaptive AI agents learn from your patterns. They reposition to block your most likely path.',
                timeLimit: 120,
                difficulty: 6,
                showTutorial: false,
                showAgentPlan: false,

                playerSpawn: { x: 200, y: 800 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 1400, y: 200 } },
                    { type: AGENT_TYPE.STRATEGIST, spawn: { x: 1800, y: 800 } },
                    {
                        type: AGENT_TYPE.AMBUSHER, spawn: { x: 1000, y: 500 },
                        ambushPoints: [{ x: 600, y: 400 }, { x: 1200, y: 700 }, { x: 1000, y: 1000 }]
                    },
                ],

                tasks: [
                    {
                        id: 'ci_1', type: TASK_TYPE.TERMINAL, name: 'Node Alpha',
                        position: { x: 500, y: 300 }, basePoints: 300, priority: 3,
                    },
                    {
                        id: 'ci_2', type: TASK_TYPE.TERMINAL, name: 'Node Beta',
                        position: { x: 1000, y: 500 }, basePoints: 300, priority: 3,
                    },
                    {
                        id: 'ci_3', type: TASK_TYPE.ZONE_CAPTURE, name: 'Relay Station',
                        position: { x: 1500, y: 400 }, basePoints: 500, priority: 4,
                        captureRadius: 80,
                    },
                    {
                        id: 'ci_chain_a', type: TASK_TYPE.SEQUENCE_CHAIN, name: 'Decrypt Part 1',
                        position: { x: 700, y: 1000 }, basePoints: 200, priority: 5,
                        sequenceGroup: 'decrypt', sequenceOrder: 1,
                    },
                    {
                        id: 'ci_chain_b', type: TASK_TYPE.SEQUENCE_CHAIN, name: 'Decrypt Part 2',
                        position: { x: 1200, y: 1100 }, basePoints: 200, priority: 5,
                        sequenceGroup: 'decrypt', sequenceOrder: 2,
                        requiredTasks: ['ci_chain_a'],
                    },
                    {
                        id: 'ci_chain_c', type: TASK_TYPE.SEQUENCE_CHAIN, name: 'Decrypt Part 3',
                        position: { x: 1800, y: 1200 }, basePoints: 600, priority: 5,
                        sequenceGroup: 'decrypt', sequenceOrder: 3,
                        requiredTasks: ['ci_chain_b'],
                    },
                ],

                extraction: { x: 2200, y: 800 },

                locations: {
                    playerSpawn: { x: 200, y: 800 },
                    agentSpawn: { x: 1400, y: 200 },
                    foodShack: { x: 400, y: 1200 },
                    restArea: { x: 2000, y: 400 },
                    doorOne: { x: 800, y: 600 },
                    doorTwo: { x: 1600, y: 700 },
                },

                tips: [
                    'The Ambusher (purple) sets up traps at chokepoints!',
                    'The Strategist (cyan) coordinates with other agents.',
                    'Decrypt chain: Part 1→2→3 in order for 1000 total points.',
                    'Vary your approach — the AI learns your patterns.',
                ],
            },
        },
    },

    // ════════════════════════════════════════════════════════
    // LEVEL 3: MASTERY — "Become the Strategist"
    // ════════════════════════════════════════════════════════
    3: {
        name: 'Mastery',
        subtitle: 'Become the Strategist',
        description: 'The ultimate challenge. Fog of war, coordinated AI, and the Master Mind boss. Only true strategists will prevail.',
        color: '#ef4444',
        unlocked: false,
        stages: {

            // ── Stage 3.1: Full Arena ──
            1: {
                name: 'Full Arena',
                subtitle: 'Eyes Wide Open',
                objective: 'Complete 7 tasks with fog of war.',
                description: 'The map is shrouded. Areas you haven\'t visited recently go dark. Scout, plan, execute.',
                timeLimit: 150,
                difficulty: 7,
                showTutorial: false,
                showAgentPlan: false,
                fogOfWar: true,

                playerSpawn: { x: 200, y: 800 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 1200, y: 300 } },
                    { type: AGENT_TYPE.STALKER, spawn: { x: 1800, y: 1200 } },
                    { type: AGENT_TYPE.RACER, spawn: { x: 2000, y: 500 } },
                    { type: AGENT_TYPE.DEFENDER, spawn: { x: 1500, y: 800 }, guardTarget: 'chain_end' },
                ],

                tasks: [
                    {
                        id: 'fa_1', type: TASK_TYPE.TERMINAL, name: 'Recon Alpha',
                        position: { x: 500, y: 400 }, basePoints: 250, priority: 2,
                    },
                    {
                        id: 'fa_2', type: TASK_TYPE.TERMINAL, name: 'Recon Beta',
                        position: { x: 900, y: 600 }, basePoints: 250, priority: 2,
                    },
                    {
                        id: 'fa_zone', type: TASK_TYPE.ZONE_CAPTURE, name: 'Command Post',
                        position: { x: 1200, y: 500 }, basePoints: 500, priority: 4,
                        captureRadius: 90,
                    },
                    {
                        id: 'fa_key', type: TASK_TYPE.KEY_COLLECT, name: 'Cipher Key',
                        position: { x: 600, y: 1100 }, basePoints: 100, priority: 3,
                    },
                    {
                        id: 'fa_door', type: TASK_TYPE.DOOR_UNLOCK, name: 'Armory Gate',
                        position: { x: 1500, y: 800 }, basePoints: 600, priority: 5,
                        requiredTasks: ['fa_key'], requiredKey: 'fa_key',
                    },
                    {
                        id: 'fa_defense', type: TASK_TYPE.DEFENSE_HOLD, name: 'Hold the Line',
                        position: { x: 1800, y: 600 }, basePoints: 500, priority: 4,
                    },
                    {
                        id: 'fa_intel', type: TASK_TYPE.INTEL_GATHER, name: 'Gather Intel',
                        position: { x: 1100, y: 1200 }, basePoints: 350, priority: 3,
                        intelFragments: 4,
                    },
                ],

                extraction: { x: 2200, y: 1400 },

                locations: {
                    playerSpawn: { x: 200, y: 800 },
                    agentSpawn: { x: 1200, y: 300 },
                    foodShack: { x: 300, y: 400 },
                    restArea: { x: 1900, y: 1100 },
                    doorOne: { x: 700, y: 700 },
                    doorTwo: { x: 1600, y: 600 },
                },

                tips: [
                    'Fog of war! Areas you haven\'t visited fade to darkness.',
                    'The Armory Gate (600pts) requires the Cipher Key from the south.',
                    'Hold the Line: survive 10 seconds in the defense zone.',
                ],
            },

            // ── Stage 3.2: Elite Ops ──
            2: {
                name: 'Elite Ops',
                subtitle: 'Against the Best',
                objective: 'Complete 8 tasks against elite coordinated AI.',
                description: 'Five specialized agents work together. Each has a unique role. You must outthink ALL of them.',
                timeLimit: 130,
                difficulty: 8,
                showTutorial: false,
                showAgentPlan: false,
                fogOfWar: true,

                playerSpawn: { x: 200, y: 800 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 800, y: 300 } },
                    { type: AGENT_TYPE.RACER, spawn: { x: 2000, y: 400 } },
                    { type: AGENT_TYPE.DEFENDER, spawn: { x: 1400, y: 900 }, guardTarget: 'elite_vault' },
                    {
                        type: AGENT_TYPE.AMBUSHER, spawn: { x: 1000, y: 700 },
                        ambushPoints: [{ x: 700, y: 500 }, { x: 1300, y: 600 }]
                    },
                    { type: AGENT_TYPE.STRATEGIST, spawn: { x: 1800, y: 1100 } },
                ],

                tasks: [
                    {
                        id: 'eo_1', type: TASK_TYPE.TERMINAL, name: 'Access Point A',
                        position: { x: 500, y: 400 }, basePoints: 200, priority: 2,
                    },
                    {
                        id: 'eo_2', type: TASK_TYPE.TERMINAL, name: 'Access Point B',
                        position: { x: 1100, y: 300 }, basePoints: 200, priority: 2,
                    },
                    {
                        id: 'eo_zone1', type: TASK_TYPE.ZONE_CAPTURE, name: 'Radar Station',
                        position: { x: 800, y: 700 }, basePoints: 400, priority: 3,
                        captureRadius: 80,
                    },
                    {
                        id: 'eo_zone2', type: TASK_TYPE.ZONE_CAPTURE, name: 'Comm Tower',
                        position: { x: 1800, y: 500 }, basePoints: 450, priority: 4,
                        captureRadius: 80,
                    },
                    {
                        id: 'eo_key', type: TASK_TYPE.KEY_COLLECT, name: 'Vault Key',
                        position: { x: 600, y: 1100 }, basePoints: 100, priority: 5,
                    },
                    {
                        id: 'eo_vault', type: TASK_TYPE.DOOR_UNLOCK, name: 'Elite Vault',
                        position: { x: 1400, y: 900 }, basePoints: 800, priority: 5,
                        requiredTasks: ['eo_key'], requiredKey: 'eo_key',
                    },
                    {
                        id: 'eo_defense', type: TASK_TYPE.DEFENSE_HOLD, name: 'Bunker Hold',
                        position: { x: 1600, y: 1200 }, basePoints: 400, priority: 3,
                    },
                    {
                        id: 'eo_chain', type: TASK_TYPE.SEQUENCE_CHAIN, name: 'Signal Decode',
                        position: { x: 1000, y: 1000 }, basePoints: 500, priority: 4,
                        sequenceGroup: 'signal', sequenceOrder: 1,
                    },
                ],

                extraction: { x: 2200, y: 800 },

                locations: {
                    playerSpawn: { x: 200, y: 800 },
                    agentSpawn: { x: 800, y: 300 },
                    foodShack: { x: 350, y: 600 },
                    restArea: { x: 2100, y: 1200 },
                    doorOne: { x: 900, y: 500 },
                    doorTwo: { x: 1500, y: 700 },
                },

                tips: [
                    'The Defender patrols near the Elite Vault (800pts).',
                    'The Ambusher hides at chokepoints — watch for ambushes!',
                    'The Strategist coordinates other agents toward your position.',
                ],
            },

            // ── Stage 3.3: Final Mind (Boss Level) ──
            3: {
                name: 'Final Mind',
                subtitle: 'The Ultimate Test',
                objective: 'Complete ALL 10 objectives. Defeat the Master Mind.',
                description: 'The Master Mind uses every GOAP strategy. Six agents, ten tasks, zero margin for error. This is the culmination of everything you\'ve learned.',
                timeLimit: 180,
                difficulty: 10,
                showTutorial: false,
                showAgentPlan: false,
                fogOfWar: true,
                isBossLevel: true,

                playerSpawn: { x: 200, y: 800 },

                agents: [
                    { type: AGENT_TYPE.STALKER, spawn: { x: 600, y: 200 } },
                    { type: AGENT_TYPE.STALKER, spawn: { x: 2000, y: 1200 } },
                    { type: AGENT_TYPE.RACER, spawn: { x: 1800, y: 300 } },
                    { type: AGENT_TYPE.DEFENDER, spawn: { x: 1200, y: 600 }, guardTarget: 'fm_master_gate' },
                    {
                        type: AGENT_TYPE.AMBUSHER, spawn: { x: 1000, y: 1000 },
                        ambushPoints: [{ x: 500, y: 500 }, { x: 1500, y: 800 }, { x: 800, y: 1200 }]
                    },
                    { type: AGENT_TYPE.MASTERMIND, spawn: { x: 1200, y: 400 } },
                ],

                tasks: [
                    // Scatter of varied tasks
                    {
                        id: 'fm_1', type: TASK_TYPE.TERMINAL, name: 'Firewall 1',
                        position: { x: 400, y: 400 }, basePoints: 200, priority: 2,
                    },
                    {
                        id: 'fm_2', type: TASK_TYPE.TERMINAL, name: 'Firewall 2',
                        position: { x: 900, y: 300 }, basePoints: 200, priority: 2,
                    },
                    {
                        id: 'fm_3', type: TASK_TYPE.TERMINAL, name: 'Firewall 3',
                        position: { x: 1800, y: 800 }, basePoints: 200, priority: 2,
                    },
                    {
                        id: 'fm_zone', type: TASK_TYPE.ZONE_CAPTURE, name: 'Central Nexus',
                        position: { x: 1200, y: 750 }, basePoints: 600, priority: 5,
                        captureRadius: 100,
                    },
                    {
                        id: 'fm_key1', type: TASK_TYPE.KEY_COLLECT, name: 'Core Key Alpha',
                        position: { x: 500, y: 1100 }, basePoints: 100, priority: 4,
                    },
                    {
                        id: 'fm_key2', type: TASK_TYPE.KEY_COLLECT, name: 'Core Key Beta',
                        position: { x: 1600, y: 1200 }, basePoints: 100, priority: 4,
                    },
                    {
                        id: 'fm_master_gate', type: TASK_TYPE.DOOR_UNLOCK, name: 'Master Gate',
                        position: { x: 1200, y: 600 }, basePoints: 1000, priority: 5,
                        requiredTasks: ['fm_key1', 'fm_key2'], requiredKey: 'fm_key1',
                    },
                    {
                        id: 'fm_defense', type: TASK_TYPE.DEFENSE_HOLD, name: 'Last Stand',
                        position: { x: 700, y: 800 }, basePoints: 500, priority: 4,
                    },
                    {
                        id: 'fm_chain_a', type: TASK_TYPE.SEQUENCE_CHAIN, name: 'Override Part 1',
                        position: { x: 1500, y: 500 }, basePoints: 200, priority: 3,
                        sequenceGroup: 'override', sequenceOrder: 1,
                    },
                    {
                        id: 'fm_chain_b', type: TASK_TYPE.SEQUENCE_CHAIN, name: 'Override Part 2',
                        position: { x: 2000, y: 600 }, basePoints: 400, priority: 3,
                        sequenceGroup: 'override', sequenceOrder: 2,
                        requiredTasks: ['fm_chain_a'],
                    },
                ],

                extraction: { x: 2200, y: 1400 },

                locations: {
                    playerSpawn: { x: 200, y: 800 },
                    agentSpawn: { x: 1200, y: 400 },
                    foodShack: { x: 300, y: 500 },
                    restArea: { x: 2100, y: 1000 },
                    doorOne: { x: 800, y: 600 },
                    doorTwo: { x: 1600, y: 700 },
                },

                tips: [
                    'The Master Mind (gold) uses ALL strategies and adapts rapidly.',
                    'Master Gate requires BOTH Core Keys. Plan your route carefully.',
                    'Central Nexus (600pts) is the most valuable zone on the map.',
                    'This is everything you\'ve learned. Think. Plan. Execute.',
                ],
            },
        },
    },

    // ════════════════════════════════════════════════════════
    // LEVEL 0: TRAINING — "The Training Ground"
    // ════════════════════════════════════════════════════════
    0: {
        name: 'Training Ground',
        subtitle: 'Tactical Orientation',
        description: 'A zero-risk simulation environment to master movement, weapons, and vehicles.',
        color: '#f97316',
        type: LEVEL_TYPE.TRAINING,
        unlocked: true,
        stages: {
            1: {
                name: 'Standard Drills',
                subtitle: 'Combat Orientation',
                objective: 'Collect all 3 Treasure Boxes while surviving hostile GOAP agents.',
                description: 'Welcome to the MindArena Training Ground. GOAP Agents are actively planning to eliminate you and steal the objectives. Adapt and survive.',
                timeLimit: 600,
                difficulty: 2,
                showTutorial: true,
                showAgentPlan: true, // Guided experience
                isTraining: true,
                playerSpawn: { x: 500, y: 500 },

                agents: [
                    // Hostile GOAP agents forming to kill the player
                    { type: AGENT_TYPE.STALKER, spawn: { x: 1200, y: 800 } },
                    { type: AGENT_TYPE.AMBUSHER, spawn: { x: 2500, y: 2200 }, ambushPoints: [{ x: 1500, y: 1500 }, { x: 2000, y: 800 }] },
                    { type: AGENT_TYPE.STRATEGIST, spawn: { x: 2200, y: 600 } },
                    { type: AGENT_TYPE.RACER, spawn: { x: 3000, y: 1500 } },
                ],

                tasks: [
                    {
                        id: 'treasure_1', type: TASK_TYPE.TREASURE_BOX, name: 'Treasure Box Alpha',
                        position: { x: 1500, y: 400 }, basePoints: 500, priority: 5,
                    },
                    {
                        id: 'treasure_2', type: TASK_TYPE.TREASURE_BOX, name: 'Treasure Box Beta',
                        position: { x: 2500, y: 2300 }, basePoints: 500, priority: 5,
                    },
                    {
                        id: 'treasure_3', type: TASK_TYPE.TREASURE_BOX, name: 'Treasure Box Gamma',
                        position: { x: 3500, y: 1500 }, basePoints: 500, priority: 5,
                    },
                ],

                extraction: { x: 3800, y: 2800 },

                locations: {
                    armory: { x: 400, y: 400 },
                    firingRange: { x: 1500, y: 400 },
                    killHouse: { x: 2500, y: 2300 },
                    vehicleBay: { x: 3500, y: 1500 },
                },

                tips: [
                    'The AI agents use GOAP to THINK and PLAN. They are actively hunting you!',
                    'Stalkers will chase you, Ambushers set traps, and Strategists coordinate.',
                    'Your only goal: Collect the 3 Treasure Boxes before they stop you.',
                    'Watch their plan overhead to anticipate their next move.',
                ],
            },
        },
    },
};

// ─── HELPER FUNCTIONS ───────────────────────────────────

/**
 * Get a specific stage config
 */
export function getStageConfig(level, stage) {
    return MIND_ARENA_LEVELS[level]?.stages?.[stage] || null;
}

/**
 * Get all tasks for a stage as TaskSystem-ready configs
 */
export function getStageTasks(level, stage) {
    const config = getStageConfig(level, stage);
    if (!config) return [];
    return config.tasks || [];
}

/**
 * Get total number of stages across all levels
 */
export function getTotalStages() {
    let count = 0;
    for (const [levelKey, level] of Object.entries(MIND_ARENA_LEVELS)) {
        if (levelKey === '0') continue; // Don't count training in campaign total
        count += Object.keys(level.stages).length;
    }
    return count;
}

/**
 * Check if a level is unlocked based on progress
 */
export function isLevelUnlocked(level, progress = {}) {
    if (level === 1 || level === 0) return true;
    // Level N requires all stages of level N-1 completed
    const prevLevel = MIND_ARENA_LEVELS[level - 1];
    if (!prevLevel) return false;
    const stageCount = Object.keys(prevLevel.stages).length;
    const completedCount = Object.keys(progress[level - 1] || {}).length;
    return completedCount >= stageCount;
}

/**
 * Check if a stage is unlocked based on progress
 */
export function isStageUnlocked(level, stage, progress = {}) {
    if (!isLevelUnlocked(level, progress)) return false;
    if (stage === 1) return true;
    // Stage N requires stage N-1 of same level completed
    return !!(progress[level]?.[stage - 1]);
}
