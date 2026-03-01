// ============================================================
// ModularPlayer.js — Phaser Container with independent limb animation
// Structure: Container → [ Legs (2), Body, Left Arm, Right Arm, Gun ]
// Procedural animation: walk cycle (sine), arm swing, recoil, breathing
// ============================================================

/**
 * Creates the modular player container and wires animation state.
 * Call updateAnimation(state) each frame from the scene.
 *
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} playerName
 * @returns {Phaser.GameObjects.Container} container with physics, playerData, visuals, animState, updateAnimation()
 */
export function createModularPlayer(scene, x, y, playerName = 'OPERATIVE_07') {
    const container = scene.add.container(x, y);
    container.setDepth(25);
    scene.physics.add.existing(container, false);

    const body = container.body;
    body.setSize(16, 18);
    body.setOffset(-8, -9);
    body.setCollideWorldBounds(true);
    body.setDrag(800, 800);
    body.setBounce(0);

    const limScale = 1.4; // much smaller scale for better proportions

    // ─── Visual parts (order = draw order: back → front) ───
    const leftLeg = scene.add.image(-4, 0, 'player_leg')
        .setOrigin(0.5, 0)
        .setScale(limScale);
    const rightLeg = scene.add.image(4, 0, 'player_leg')
        .setOrigin(0.5, 0)
        .setScale(limScale)
        .setFlipX(true);

    const bodySprite = scene.add.image(0, -6, 'player_body')
        .setOrigin(0.5, 0.5)
        .setScale(limScale * 1.2); // body slightly larger

    const leftArm = scene.add.image(-7, -4, 'player_arm')
        .setOrigin(0.5, 0)
        .setScale(limScale * 0.9) // arms smaller
        .setFlipX(true);
    const rightArm = scene.add.image(7, -4, 'player_arm')
        .setOrigin(0.5, 0)
        .setScale(limScale * 0.9) // arms smaller
        .setFlipX(false);

    // Gun: origin at grip (bottom-center) so it extends forward; held in front of body
    const gunSprite = scene.add.image(0, -8, 'loot_pistol')
        .setOrigin(0.5, 1)
        .setVisible(false)
        .setScale(limScale * 0.6); // gun smaller

    container.add([leftLeg, rightLeg, bodySprite, leftArm, rightArm, gunSprite]);

    container.playerData = {
        name: playerName,
        health: 100,
        maxHealth: 100,
        armor: 0,
        speed: 180,
        sprintSpeed: 300,
        stamina: 100,
        maxStamina: 100,
        weapons: [null, null, null],
        activeWeapon: -1,
        vehicle: null,
        inVehicle: false,
    };

    container.visuals = {
        leftLeg,
        rightLeg,
        body: bodySprite,
        leftArm,
        rightArm,
        gun: gunSprite,
    };

    container.animState = {
        walkCycle: 0,
        recoilOffset: 0,
        breathPhase: 0,
        armSwing: 0,
        legSpread: 0,
        bodyBob: 0,
        isShooting: false,
        shootTimer: 0,
    };

    /**
     * Call every frame after movement. Updates leg/arm/gun/body animation.
     * @param {Object} state
     * @param {number} state.vx
     * @param {number} state.vy
     * @param {number} state.bodyAngle - container rotation (scene sets it)
     * @param {boolean} state.isMoving
     * @param {boolean} state.isSprinting
     * @param {boolean} state.isAiming - has weapon out
     * @param {Object|null} state.weaponDef - current weapon or null
     * @param {boolean} [state.triggerRecoil] - set true once when shot fired
     * @param {number} [state.delta=16]
     */
    container.updateAnimation = function (state) {
        const delta = state.delta ?? 16;
        const { vx, vy, isMoving, isSprinting, isAiming, weaponDef, triggerRecoil } = state;
        const vis = container.visuals;
        const anim = container.animState;

        const velMag = Math.sqrt(vx * vx + vy * vy);

        // ─── Enhanced Walk Cycle ───
        if (isMoving) {
            const walkSpeedMult = isSprinting ? 0.048 : 0.032;
            anim.walkCycle += velMag * walkSpeedMult;
            anim.bodyBob = Math.sin(anim.walkCycle * 2) * 1.5;
        } else {
            anim.walkCycle = Phaser.Math.Linear(anim.walkCycle, 0, 0.18);
            anim.bodyBob = Phaser.Math.Linear(anim.bodyBob, 0, 0.15);
            if (anim.walkCycle < 0.04) anim.walkCycle = 0;
        }

        const t = anim.walkCycle;
        
        // ─── Enhanced Leg Animation ───
        const legSwingY = 12;   // reduced stride for better proportions
        const legStepX = 3;    // reduced step width
        const legRotateAmt = 0.25; // less rotation
        const legLift = Math.abs(Math.sin(t)) * 2; // less foot lift

        // Legs: stride Y + step X + rotation + lift (clear alternating walk)
        const stride = Math.sin(t) * legSwingY;
        const step = Math.cos(t) * legStepX;
        vis.leftLeg.y = stride - legLift;
        vis.rightLeg.y = -stride - legLift;
        vis.leftLeg.x = -4 + step;
        vis.rightLeg.x = 4 - step;
        vis.leftLeg.rotation = Math.sin(t) * legRotateAmt;
        vis.rightLeg.rotation = -Math.sin(t) * legRotateAmt;

        // ─── Enhanced Body Animation ───
        anim.breathPhase += delta * 0.003;
        const baseScale = limScale * 1.2;
        if (!isMoving) {
            const breathScale = 1 + Math.sin(anim.breathPhase) * 0.02;
            vis.body.setScale(baseScale * breathScale);
            vis.body.y = -6;
        } else {
            vis.body.setScale(baseScale);
            vis.body.y = -6 + anim.bodyBob; // walk bob
        }

        // ─── Enhanced Arm Animation ───
        if (triggerRecoil) {
            anim.isShooting = true;
            anim.shootTimer = 150; // recoil duration in ms
            anim.recoilOffset = 12 + Math.random() * 6;
        }

        // Handle shooting timer
        if (anim.isShooting) {
            anim.shootTimer -= delta;
            if (anim.shootTimer <= 0) {
                anim.isShooting = false;
            }
        }

        // Recoil decay
        anim.recoilOffset = Phaser.Math.Linear(anim.recoilOffset, 0, 0.08);

        const recoilY = anim.recoilOffset;
        const recoilRot = anim.recoilOffset * 0.015;
        const weaponSway = isMoving ? Math.sin(t * 2) * 3 : 0;
        const gunBob = isMoving ? Math.sin(t * 1.5) * 2.5 : 0;

        if (isAiming && weaponDef) {
            // Gun aiming stance - both hands on weapon
            vis.gun.setVisible(true);
            vis.gun.setTexture(`loot_${weaponDef.id}`);

            // Gun positioning with recoil
            const gunY = -8 + recoilY - weaponSway - gunBob;
            vis.gun.setPosition(0, gunY);
            vis.gun.rotation = recoilRot;

            // Arms hold gun properly - right hand at grip, left hand on barrel
            const gripY = gunY + 1; // right hand slightly below grip
            const foreY = gunY - 6; // left hand forward on barrel
            
            vis.rightArm.setPosition(7, gripY);
            vis.rightArm.rotation = recoilRot * 0.6;
            vis.rightArm.setVisible(true);
            
            vis.leftArm.setPosition(-7, foreY);
            vis.leftArm.rotation = recoilRot * 0.4;
            vis.leftArm.setVisible(true);
        } else {
            // Natural arm swing when not aiming
            vis.gun.setVisible(false);
            vis.leftArm.setVisible(true);
            vis.rightArm.setVisible(true);

            const handSwing = Math.cos(t) * 10; // reduced swing for better proportions
            const armRot = Math.sin(t) * 0.12; // less rotation
                
            // Add slight vertical movement to arms
            const armLift = Math.abs(Math.sin(t)) * 1;
            
            vis.leftArm.setPosition(-7, -4 + handSwing - armLift);
            vis.leftArm.rotation = armRot;
            vis.rightArm.setPosition(7, -4 - handSwing - armLift);
            vis.rightArm.rotation = -armRot;
        }
    };

    return container;
}
