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

    const limScale = 1.8; // match body scale so limbs are proportional

    // ─── Visual parts (order = draw order: back → front) ───
    const leftLeg = scene.add.image(-5, 0, 'player_leg')
        .setOrigin(0.5, 0)
        .setScale(limScale);
    const rightLeg = scene.add.image(5, 0, 'player_leg')
        .setOrigin(0.5, 0)
        .setScale(limScale)
        .setFlipX(true);

    const bodySprite = scene.add.image(0, 0, 'player_body')
        .setOrigin(0.5, 0.5)
        .setScale(limScale);

    const leftArm = scene.add.image(-9, -5, 'player_arm')
        .setOrigin(0.5, 0)
        .setScale(limScale)
        .setFlipX(true);
    const rightArm = scene.add.image(9, -5, 'player_arm')
        .setOrigin(0.5, 0)
        .setScale(limScale);

    // Gun: origin at grip (bottom-center) so it extends forward; held in front of body
    const gunSprite = scene.add.image(0, -10, 'loot_pistol')
        .setOrigin(0.5, 1)
        .setVisible(false);

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

        // ─── Walk cycle (faster = snappier motion, velocity-scaled) ───
        if (isMoving) {
            const walkSpeedMult = isSprinting ? 0.036 : 0.024;
            anim.walkCycle += velMag * walkSpeedMult;
        } else {
            anim.walkCycle = Phaser.Math.Linear(anim.walkCycle, 0, 0.18);
            if (anim.walkCycle < 0.04) anim.walkCycle = 0;
        }

        const t = anim.walkCycle;
        const legSwingY = 14;   // forward/back stride
        const legStepX = 4;    // left/right step width
        const legRotateAmt = 0.38;

        // ─── Legs: stride Y + step X + rotation (clear alternating walk) ───
        const stride = Math.sin(t) * legSwingY;
        const step = Math.cos(t) * legStepX;
        vis.leftLeg.y = stride;
        vis.rightLeg.y = -stride;
        vis.leftLeg.x = -5 + step;
        vis.rightLeg.x = 5 - step;
        vis.leftLeg.rotation = Math.sin(t) * legRotateAmt;
        vis.rightLeg.rotation = -Math.sin(t) * legRotateAmt;

        // ─── Body: idle breathing scale; when walking, subtle vertical bob ───
        anim.breathPhase += delta * 0.002;
        const baseScale = limScale;
        if (!isMoving) {
            const breathScale = 1 + Math.sin(anim.breathPhase) * 0.025;
            vis.body.setScale(baseScale * breathScale);
            vis.body.y = 0;
        } else {
            vis.body.setScale(baseScale);
            vis.body.y = Math.sin(t * 2) * 2; // walk bob
        }

        // ─── Recoil: position + slight rotation kick ───
        if (triggerRecoil) {
            anim.recoilOffset = 10 + Math.random() * 5;
        }
        anim.recoilOffset = Phaser.Math.Linear(anim.recoilOffset, 0, 0.1);

        const recoilY = anim.recoilOffset;
        const recoilRot = anim.recoilOffset * 0.012;
        const weaponSway = isMoving ? Math.sin(t * 2) * 2.5 : 0;
        const gunBob = isMoving ? Math.sin(t * 1.5) * 2 : 0;

        if (isAiming && weaponDef) {
            vis.gun.setVisible(true);
            vis.gun.setTexture(`loot_${weaponDef.id}`);

            // Gun in front of body (origin 0.5,1 = grip at bottom); recoil pushes back
            const gunY = -10 + recoilY - weaponSway - gunBob;
            vis.gun.setPosition(0, gunY);
            vis.gun.rotation = recoilRot; // slight kick back when firing

            // Arms hold gun: right at grip, left forward on barrel
            const gripY = gunY;
            const foreY = gunY - 8;
            vis.rightArm.setPosition(0, gripY);
            vis.rightArm.rotation = recoilRot * 0.5;
            vis.rightArm.setVisible(true);
            vis.leftArm.setPosition(0, foreY);
            vis.leftArm.rotation = recoilRot * 0.5;
            vis.leftArm.setVisible(true);
        } else {
            vis.gun.setVisible(false);
            vis.leftArm.setVisible(true);
            vis.rightArm.setVisible(true);

            const handSwing = Math.cos(t) * 14;
            const armRot = Math.sin(t) * 0.14;
            vis.leftArm.setPosition(-9, -5 + handSwing);
            vis.leftArm.rotation = armRot;
            vis.rightArm.setPosition(9, -5 - handSwing);
            vis.rightArm.rotation = -armRot;
        }
    };

    return container;
}
