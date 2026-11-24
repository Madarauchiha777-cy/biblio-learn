/**
 * ============================================================================
 * BIBLIOLEARN — BIBI DIGITAL LIBRARIAN 3D CHARACTER ENGINE
 * Université ESMA Marrakech • Flagship Signature Experience
 * 
 * Features:
 * - High-detail stylized procedural humanoid librarian character.
 * - Anatomical skeleton hierarchy with articulated neck, head, eyes, eyelids,
 *   glasses, shoulders, elbows, wrists, hands, hips, knees, ankles, shoes.
 * - Dynamic mouse cursor gaze tracking (head + eye pupils with smooth damping).
 * - Real-time breathing and idle micro-motion animation engine.
 * - Periodic natural eye blinking system.
 * - Inverse-pendulum kinematics walking cycle with arm opposition.
 * - Smooth pathfinding navigation across the library floor.
 * - Book fetching, carrying, and shelf replacement choreography.
 * ============================================================================
 */

class BibiCharacter {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = Object.assign({
            initialPosition: new THREE.Vector3(0, 0, 4),
            scale: 1.0,
            primaryColor: 0x111827,    // Midnight Ink
            accentColor: 0xB78B55,     // Muted Bronze
            shirtColor: 0xF5F2EB,      // Warm Ivory
            skinColor: 0xE0AC69,       // Warm Moroccan Sand tone
            trousersColor: 0x1C283E,   // Deep Charcoal Slate
            tieColor: 0x315C9B,        // Academic Blue
        }, options);

        this.group = new THREE.Group();
        this.group.name = "Bibi_Librarian";
        this.group.position.copy(this.options.initialPosition);

        // State Machine
        this.state = "idle"; // "idle", "walking", "reaching", "holding", "returning"
        this.heldBook = null;
        this.targetPosition = null;
        this.onWalkComplete = null;
        this.walkSpeed = 3.6; // units per second
        this.walkCycle = 0;

        // Kinematic Body Parts Map
        this.parts = {};

        // Mouse Gaze Tracking Targets
        this.mouseNormalized = new THREE.Vector2(0, 0);
        this.targetHeadYaw = 0;
        this.targetHeadPitch = 0;
        this.currentHeadYaw = 0;
        this.currentHeadPitch = 0;

        // Blinking system
        this.blinkProgress = 0;
        this.isBlinking = false;
        this.nextBlinkTime = 2.0;

        // Time tracking
        this.clock = new THREE.Clock();
        this.elapsed = 0;

        // Speech & dialogue callback
        this.onSpeech = null;

        // Build procedural character
        this.buildModel();
        this.scene.add(this.group);
    }

    /**
     * Builds the complete high-fidelity stylized 3D librarian mesh hierarchy.
     */
    buildModel() {
        const c = this.options;

        // Shared Materials with tuned PBR reflections
        const skinMat = new THREE.MeshStandardMaterial({
            color: c.skinColor,
            roughness: 0.6,
            metalness: 0.05
        });

        const vestMat = new THREE.MeshStandardMaterial({
            color: c.primaryColor,
            roughness: 0.7,
            metalness: 0.1
        });

        const shirtMat = new THREE.MeshStandardMaterial({
            color: c.shirtColor,
            roughness: 0.55,
            metalness: 0.0
        });

        const trousersMat = new THREE.MeshStandardMaterial({
            color: c.trousersColor,
            roughness: 0.75,
            metalness: 0.05
        });

        const tieMat = new THREE.MeshStandardMaterial({
            color: c.tieColor,
            roughness: 0.5,
            metalness: 0.1
        });

        const bronzeMat = new THREE.MeshStandardMaterial({
            color: c.accentColor,
            roughness: 0.35,
            metalness: 0.8
        });

        const shoeMat = new THREE.MeshStandardMaterial({
            color: 0x1A1412,
            roughness: 0.3,
            metalness: 0.2
        });

        const eyeWhiteMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.1,
            metalness: 0.0
        });

        const eyePupilMat = new THREE.MeshStandardMaterial({
            color: 0x1E3A5F,
            roughness: 0.2,
            metalness: 0.1
        });

        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x2A1D17,
            roughness: 0.8,
            metalness: 0.05
        });

        // 1. Root Pivot (Floor level: y = 0)
        this.parts.root = new THREE.Group();
        this.group.add(this.parts.root);

        // 2. Pelvis / Hips (y = 0.95m)
        this.parts.pelvis = new THREE.Group();
        this.parts.pelvis.position.y = 0.95;
        this.parts.root.add(this.parts.pelvis);

        const pelvisMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.16, 0.16, 16),
            trousersMat
        );
        pelvisMesh.castShadow = true;
        this.parts.pelvis.add(pelvisMesh);

        // 3. Spine & Torso (Scholar Vest + Shirt)
        this.parts.torso = new THREE.Group();
        this.parts.torso.position.y = 0.12;
        this.parts.pelvis.add(this.parts.torso);

        // Main chest block with subtle tapering
        const chestMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.19, 0.46, 16),
            shirtMat
        );
        chestMesh.position.y = 0.23;
        chestMesh.castShadow = true;
        this.parts.torso.add(chestMesh);

        // Scholar Vest overlay
        const vestMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.20, 0.44, 16, 1, false, Math.PI * 0.15, Math.PI * 1.7),
            vestMat
        );
        vestMesh.position.y = 0.23;
        vestMesh.castShadow = true;
        this.parts.torso.add(vestMesh);

        // Gold/Bronze Vest Buttons (3 vertical buttons)
        for (let i = 0; i < 3; i++) {
            const button = new THREE.Mesh(
                new THREE.CylinderGeometry(0.018, 0.018, 0.01, 12),
                bronzeMat
            );
            button.rotation.x = Math.PI / 2;
            button.position.set(0, 0.12 + i * 0.1, 0.23);
            this.parts.torso.add(button);
        }

        // Academic Bowtie / Tie
        const tieKnot = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 12, 12),
            tieMat
        );
        tieKnot.position.set(0, 0.42, 0.22);
        this.parts.torso.add(tieKnot);

        const tieWingL = new THREE.Mesh(
            new THREE.ConeGeometry(0.045, 0.08, 8),
            tieMat
        );
        tieWingL.rotation.z = Math.PI / 2;
        tieWingL.position.set(-0.045, 0.42, 0.22);
        this.parts.torso.add(tieWingL);

        const tieWingR = new THREE.Mesh(
            new THREE.ConeGeometry(0.045, 0.08, 8),
            tieMat
        );
        tieWingR.rotation.z = -Math.PI / 2;
        tieWingR.position.set(0.045, 0.42, 0.22);
        this.parts.torso.add(tieWingR);

        // Librarian Name Badge on left chest: "BIBI - ESMA"
        const badgeMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.04, 0.01),
            bronzeMat
        );
        badgeMesh.position.set(0.12, 0.32, 0.24);
        badgeMesh.rotation.y = 0.15;
        this.parts.torso.add(badgeMesh);

        // 4. Neck & Head
        this.parts.neck = new THREE.Group();
        this.parts.neck.position.y = 0.47;
        this.parts.torso.add(this.parts.neck);

        const neckMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.08, 0.1, 16),
            skinMat
        );
        neckMesh.position.y = 0.05;
        this.parts.neck.add(neckMesh);

        // Head Pivot
        this.parts.head = new THREE.Group();
        this.parts.head.position.y = 0.12;
        this.parts.neck.add(this.parts.head);

        // Head Cranium (Stylized smooth geometric shape)
        const headGeo = new THREE.SphereGeometry(0.19, 24, 24);
        headGeo.scale(1.0, 1.15, 1.05);
        const headMesh = new THREE.Mesh(headGeo, skinMat);
        headMesh.position.y = 0.14;
        headMesh.castShadow = true;
        this.parts.head.add(headMesh);

        // Stylish Hair (Scholarly swept side-part)
        const hairGeo = new THREE.SphereGeometry(0.205, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
        hairGeo.scale(1.02, 1.12, 1.05);
        const hairMesh = new THREE.Mesh(hairGeo, hairMat);
        hairMesh.position.set(0, 0.18, -0.02);
        this.parts.head.add(hairMesh);

        // Forehead quiff / bangs
        const quiff = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.18, 0.08, 12),
            hairMat
        );
        quiff.rotation.z = Math.PI / 3;
        quiff.position.set(0.05, 0.30, 0.16);
        this.parts.head.add(quiff);

        // Ears
        const earL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), skinMat);
        earL.scale.set(0.5, 1.0, 0.8);
        earL.position.set(0.20, 0.14, 0.0);
        this.parts.head.add(earL);

        const earR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), skinMat);
        earR.scale.set(0.5, 1.0, 0.8);
        earR.position.set(-0.20, 0.14, 0.0);
        this.parts.head.add(earR);

        // Eyes (Left & Right) with movable pupils
        this.parts.eyeGroupL = new THREE.Group();
        this.parts.eyeGroupL.position.set(0.075, 0.15, 0.17);
        this.parts.head.add(this.parts.eyeGroupL);

        const scleraL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), eyeWhiteMat);
        this.parts.eyeGroupL.add(scleraL);

        this.parts.pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), eyePupilMat);
        this.parts.pupilL.position.set(0, 0, 0.025);
        this.parts.eyeGroupL.add(this.parts.pupilL);

        // Eyelid for Blinking (Top hemisphere that scales down)
        this.parts.eyelidL = new THREE.Mesh(
            new THREE.SphereGeometry(0.041, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
            skinMat
        );
        this.parts.eyelidL.rotation.x = -Math.PI / 2;
        this.parts.eyelidL.scale.set(1, 1, 0.001); // Opened by default
        this.parts.eyeGroupL.add(this.parts.eyelidL);

        // Right Eye
        this.parts.eyeGroupR = new THREE.Group();
        this.parts.eyeGroupR.position.set(-0.075, 0.15, 0.17);
        this.parts.head.add(this.parts.eyeGroupR);

        const scleraR = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), eyeWhiteMat);
        this.parts.eyeGroupR.add(scleraR);

        this.parts.pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), eyePupilMat);
        this.parts.pupilR.position.set(0, 0, 0.025);
        this.parts.eyeGroupR.add(this.parts.pupilR);

        this.parts.eyelidR = new THREE.Mesh(
            new THREE.SphereGeometry(0.041, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
            skinMat
        );
        this.parts.eyelidR.rotation.x = -Math.PI / 2;
        this.parts.eyelidR.scale.set(1, 1, 0.001);
        this.parts.eyeGroupR.add(this.parts.eyelidR);

        // Brass Scholar Eyeglasses (Torus frames + Bridge)
        const glassTorusGeo = new THREE.TorusGeometry(0.048, 0.006, 12, 24);
        const glassL = new THREE.Mesh(glassTorusGeo, bronzeMat);
        glassL.position.set(0.075, 0.15, 0.20);
        this.parts.head.add(glassL);

        const glassR = new THREE.Mesh(glassTorusGeo, bronzeMat);
        glassR.position.set(-0.075, 0.15, 0.20);
        this.parts.head.add(glassR);

        // Glasses Bridge
        const glassBridge = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.05, 8),
            bronzeMat
        );
        glassBridge.rotation.z = Math.PI / 2;
        glassBridge.position.set(0, 0.155, 0.205);
        this.parts.head.add(glassBridge);

        // Friendly Smile / Nose
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), skinMat);
        nose.scale.set(0.8, 1.2, 1.0);
        nose.position.set(0, 0.11, 0.19);
        this.parts.head.add(nose);

        const smileGeo = new THREE.TorusGeometry(0.04, 0.006, 8, 16, Math.PI * 0.6);
        const smile = new THREE.Mesh(smileGeo, bronzeMat);
        smile.rotation.z = Math.PI * 1.2;
        smile.position.set(0, 0.065, 0.18);
        this.parts.head.add(smile);

        // 5. Left Arm (Shoulder -> Bicep -> Elbow -> Forearm -> Hand)
        this.parts.shoulderL = new THREE.Group();
        this.parts.shoulderL.position.set(0.27, 0.40, 0);
        this.parts.torso.add(this.parts.shoulderL);

        const bicepMeshL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.055, 0.26, 12),
            vestMat
        );
        bicepMeshL.position.y = -0.13;
        bicepMeshL.castShadow = true;
        this.parts.shoulderL.add(bicepMeshL);

        this.parts.elbowL = new THREE.Group();
        this.parts.elbowL.position.set(0, -0.26, 0);
        this.parts.shoulderL.add(this.parts.elbowL);

        const forearmMeshL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.048, 0.26, 12),
            shirtMat
        );
        forearmMeshL.position.y = -0.13;
        forearmMeshL.castShadow = true;
        this.parts.elbowL.add(forearmMeshL);

        this.parts.handL = new THREE.Group();
        this.parts.handL.position.set(0, -0.27, 0);
        this.parts.elbowL.add(this.parts.handL);

        const handMeshL = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.035),
            skinMat
        );
        handMeshL.position.y = -0.04;
        this.parts.handL.add(handMeshL);

        // 6. Right Arm (Active retrieval arm)
        this.parts.shoulderR = new THREE.Group();
        this.parts.shoulderR.position.set(-0.27, 0.40, 0);
        this.parts.torso.add(this.parts.shoulderR);

        const bicepMeshR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.055, 0.26, 12),
            vestMat
        );
        bicepMeshR.position.y = -0.13;
        bicepMeshR.castShadow = true;
        this.parts.shoulderR.add(bicepMeshR);

        this.parts.elbowR = new THREE.Group();
        this.parts.elbowR.position.set(0, -0.26, 0);
        this.parts.shoulderR.add(this.parts.elbowR);

        const forearmMeshR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.048, 0.26, 12),
            shirtMat
        );
        forearmMeshR.position.y = -0.13;
        forearmMeshR.castShadow = true;
        this.parts.elbowR.add(forearmMeshR);

        this.parts.handR = new THREE.Group();
        this.parts.handR.position.set(0, -0.27, 0);
        this.parts.elbowR.add(this.parts.handR);

        const handMeshR = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.035),
            skinMat
        );
        handMeshR.position.y = -0.04;
        this.parts.handR.add(handMeshR);

        // Presentation Book Attachment Point (in front of chest between hands)
        this.parts.bookAttachPoint = new THREE.Group();
        this.parts.bookAttachPoint.position.set(0, 0.28, 0.35);
        this.parts.torso.add(this.parts.bookAttachPoint);

        // 7. Left Leg (Hip -> Thigh -> Knee -> Calf -> Ankle -> Shoe)
        this.parts.hipL = new THREE.Group();
        this.parts.hipL.position.set(0.11, -0.05, 0);
        this.parts.pelvis.add(this.parts.hipL);

        const thighMeshL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.065, 0.42, 12),
            trousersMat
        );
        thighMeshL.position.y = -0.21;
        thighMeshL.castShadow = true;
        this.parts.hipL.add(thighMeshL);

        this.parts.kneeL = new THREE.Group();
        this.parts.kneeL.position.set(0, -0.42, 0);
        this.parts.hipL.add(this.parts.kneeL);

        const calfMeshL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.065, 0.055, 0.40, 12),
            trousersMat
        );
        calfMeshL.position.y = -0.20;
        calfMeshL.castShadow = true;
        this.parts.kneeL.add(calfMeshL);

        const shoeMeshL = new THREE.Mesh(
            new THREE.BoxGeometry(0.10, 0.08, 0.22),
            shoeMat
        );
        shoeMeshL.position.set(0, -0.44, 0.04);
        shoeMeshL.castShadow = true;
        this.parts.kneeL.add(shoeMeshL);

        // 8. Right Leg
        this.parts.hipR = new THREE.Group();
        this.parts.hipR.position.set(-0.11, -0.05, 0);
        this.parts.pelvis.add(this.parts.hipR);

        const thighMeshR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.065, 0.42, 12),
            trousersMat
        );
        thighMeshR.position.y = -0.21;
        thighMeshR.castShadow = true;
        this.parts.hipR.add(thighMeshR);

        this.parts.kneeR = new THREE.Group();
        this.parts.kneeR.position.set(0, -0.42, 0);
        this.parts.hipR.add(this.parts.kneeR);

        const calfMeshR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.065, 0.055, 0.40, 12),
            trousersMat
        );
        calfMeshR.position.y = -0.20;
        calfMeshR.castShadow = true;
        this.parts.kneeR.add(calfMeshR);

        const shoeMeshR = new THREE.Mesh(
            new THREE.BoxGeometry(0.10, 0.08, 0.22),
            shoeMat
        );
        shoeMeshR.position.set(0, -0.44, 0.04);
        shoeMeshR.castShadow = true;
        this.parts.kneeR.add(shoeMeshR);

        // Overall scale
        this.group.scale.setScalar(this.options.scale);
    }

    /**
     * Mouse gaze tracker: updates the target yaw and pitch angles for head/eyes.
     * Normalized mouse coordinates: x from -1 to 1, y from -1 to 1.
     */
    updateMouseGaze(normX, normY) {
        this.mouseNormalized.set(normX, normY);

        // Clamp head rotation for natural anatomical limits
        // Yaw: -50 deg to +50 deg
        this.targetHeadYaw = -normX * 0.85; 
        // Pitch: -25 deg to +25 deg
        this.targetHeadPitch = normY * 0.45;
    }

    /**
     * Main animation tick update loop. Call every requestAnimationFrame with delta time.
     */
    update(delta) {
        this.elapsed += delta;

        // 1. Gaze & Head Orientation Interpolation
        this.currentHeadYaw = THREE.MathUtils.lerp(this.currentHeadYaw, this.targetHeadYaw, 0.08);
        this.currentHeadPitch = THREE.MathUtils.lerp(this.currentHeadPitch, this.targetHeadPitch, 0.08);

        this.parts.head.rotation.y = this.currentHeadYaw;
        this.parts.head.rotation.x = this.currentHeadPitch;

        // Eye pupils offset slightly more than head for lively saccadic tracking
        const pupilOffsetX = THREE.MathUtils.clamp(-this.mouseNormalized.x * 0.012, -0.012, 0.012);
        const pupilOffsetY = THREE.MathUtils.clamp(this.mouseNormalized.y * 0.010, -0.010, 0.010);
        this.parts.pupilL.position.x = pupilOffsetX;
        this.parts.pupilL.position.y = pupilOffsetY;
        this.parts.pupilR.position.x = pupilOffsetX;
        this.parts.pupilR.position.y = pupilOffsetY;

        // 2. Natural Blinking Loop
        this.updateBlinking(delta);

        // 3. State Machine Execution
        switch (this.state) {
            case "idle":
                this.updateIdleAnimation(delta);
                break;
            case "walking":
                this.updateWalking(delta);
                break;
            case "reaching":
                // Hand reaching out towards shelf
                break;
            case "holding":
                this.updateHoldingAnimation(delta);
                break;
            case "returning":
                // Book return cycle
                break;
        }
    }

    /**
     * Periodic involuntary eyelid blink system.
     */
    updateBlinking(delta) {
        this.nextBlinkTime -= delta;
        if (this.nextBlinkTime <= 0) {
            this.isBlinking = true;
            this.blinkProgress = 0;
            this.nextBlinkTime = 3.0 + Math.random() * 4.0; // Blink every 3-7 seconds
        }

        if (this.isBlinking) {
            this.blinkProgress += delta * 12.0; // Fast blink: ~0.15s
            let scaleY = 1.0;
            if (this.blinkProgress < 1.0) {
                // Closing
                scaleY = this.blinkProgress;
            } else if (this.blinkProgress < 2.0) {
                // Opening
                scaleY = 2.0 - this.blinkProgress;
            } else {
                this.isBlinking = false;
                scaleY = 0.001;
            }
            this.parts.eyelidL.scale.set(1, Math.max(scaleY, 0.001), 1);
            this.parts.eyelidR.scale.set(1, Math.max(scaleY, 0.001), 1);
        }
    }

    /**
     * Idle breathing and scholar posture sway.
     */
    updateIdleAnimation(delta) {
        const t = this.elapsed;

        // Subtle breathing (chest expansion)
        const breath = Math.sin(t * 1.8) * 0.02;
        this.parts.torso.position.y = 0.12 + breath;
        this.parts.torso.rotation.x = Math.sin(t * 0.9) * 0.015;

        // Subtle weight shift
        this.parts.pelvis.rotation.z = Math.sin(t * 0.8) * 0.015;
        this.parts.pelvis.position.y = 0.95 + Math.cos(t * 1.6) * 0.006;

        // Relaxed arms at sides with scholarly poise
        this.parts.shoulderL.rotation.x = Math.sin(t * 1.2) * 0.04;
        this.parts.shoulderL.rotation.z = 0.08 + Math.cos(t * 1.0) * 0.02;
        this.parts.elbowL.rotation.x = -0.15;

        this.parts.shoulderR.rotation.x = -Math.sin(t * 1.2) * 0.04;
        this.parts.shoulderR.rotation.z = -0.08 - Math.cos(t * 1.0) * 0.02;
        this.parts.elbowR.rotation.x = -0.15;

        // Legs static in idle
        this.parts.hipL.rotation.x = 0;
        this.parts.kneeL.rotation.x = 0;
        this.parts.hipR.rotation.x = 0;
        this.parts.kneeR.rotation.x = 0;
    }

    /**
     * Holding a monograph proudly in two hands at chest level for user inspection.
     */
    updateHoldingAnimation(delta) {
        const t = this.elapsed;

        // Breathing with book
        this.parts.torso.position.y = 0.12 + Math.sin(t * 1.8) * 0.02;

        // Arms curved forward cradling the book
        this.parts.shoulderL.rotation.x = -0.75 + Math.sin(t * 1.5) * 0.02;
        this.parts.shoulderL.rotation.z = -0.25;
        this.parts.elbowL.rotation.x = -0.95;
        this.parts.handL.rotation.y = 0.35;

        this.parts.shoulderR.rotation.x = -0.75 + Math.sin(t * 1.5) * 0.02;
        this.parts.shoulderR.rotation.z = 0.25;
        this.parts.elbowR.rotation.x = -0.95;
        this.parts.handR.rotation.y = -0.35;

        // Gentle proud posture
        this.parts.head.rotation.z = Math.sin(t * 1.2) * 0.03;
    }

    /**
     * Smoothly navigates the character to a target floor coordinate (X, Z).
     */
    walkTo(targetX, targetZ, onArrival = null) {
        this.targetPosition = new THREE.Vector3(targetX, 0, targetZ);
        this.onWalkComplete = onArrival;
        this.state = "walking";
    }

    /**
     * Walking kinematics: leg swing, knee flex, foot lift, arm opposition, torso bob.
     */
    updateWalking(delta) {
        if (!this.targetPosition) return;

        const currentPos = this.group.position;
        const diffX = this.targetPosition.x - currentPos.x;
        const diffZ = this.targetPosition.z - currentPos.z;
        const distance = Math.hypot(diffX, diffZ);

        if (distance < 0.1) {
            // Arrived at destination
            this.group.position.x = this.targetPosition.x;
            this.group.position.z = this.targetPosition.z;
            this.state = "idle";
            const callback = this.onWalkComplete;
            this.targetPosition = null;
            this.onWalkComplete = null;
            if (callback) callback();
            return;
        }

        // 1. Rotate body towards target direction smoothly
        const targetAngle = Math.atan2(diffX, diffZ);
        let angleDiff = targetAngle - this.group.rotation.y;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.group.rotation.y += angleDiff * 0.12;

        // 2. Move towards target
        const stepDist = Math.min(this.walkSpeed * delta, distance);
        this.group.position.x += Math.sin(this.group.rotation.y) * stepDist;
        this.group.position.z += Math.cos(this.group.rotation.y) * stepDist;

        // 3. Kinematic Walk Cycle
        this.walkCycle += delta * 8.5; // Walk frequency
        const sinCycle = Math.sin(this.walkCycle);
        const cosCycle = Math.cos(this.walkCycle);

        // Hip swing (forward/backward)
        this.parts.hipL.rotation.x = sinCycle * 0.55;
        this.parts.hipR.rotation.x = -sinCycle * 0.55;

        // Knee bend (bends only backward when leg swings forward)
        this.parts.kneeL.rotation.x = Math.max(0, -sinCycle * 0.85);
        this.parts.kneeR.rotation.x = Math.max(0, sinCycle * 0.85);

        // Arms swing in opposition to legs (unless holding a book)
        if (!this.heldBook) {
            this.parts.shoulderL.rotation.x = -sinCycle * 0.45;
            this.parts.shoulderL.rotation.z = 0.08;
            this.parts.elbowL.rotation.x = -0.2 - Math.abs(cosCycle) * 0.2;

            this.parts.shoulderR.rotation.x = sinCycle * 0.45;
            this.parts.shoulderR.rotation.z = -0.08;
            this.parts.elbowR.rotation.x = -0.2 - Math.abs(cosCycle) * 0.2;
        }

        // Torso & Pelvis vertical bounce (twice per full leg cycle)
        this.parts.pelvis.position.y = 0.95 + Math.abs(cosCycle) * 0.04;
        this.parts.torso.rotation.y = -sinCycle * 0.08;
    }

    /**
     * Complete choreographic sequence for fetching a book from a shelf.
     * 1. Say dialogue prompt.
     * 2. Walk to the bookshelf in front of the book.
     * 3. Reach out arm toward the shelf.
     * 4. Detach book from shelf and parent to Bibi's hands.
     * 5. Turn to camera/visitor and present the book.
     */
    fetchBookChoreography(book3D, onPresented) {
        if (!book3D) return;

        this.say(`"Right away! Let me fetch '${book3D.userData.titre}' from the ${book3D.userData.categorie} stacks for you..."`);

        // Calculate stand position in front of shelf
        const shelfPos = book3D.userData.shelfWorldPos || book3D.position;
        const targetX = shelfPos.x + (book3D.userData.shelfNormalX || 0) * 1.4;
        const targetZ = shelfPos.z + (book3D.userData.shelfNormalZ || 1) * 1.4;

        this.walkTo(targetX, targetZ, () => {
            // Face the shelf
            const angleToShelf = Math.atan2(shelfPos.x - this.group.position.x, shelfPos.z - this.group.position.z);
            if (typeof TWEEN !== "undefined") {
                new TWEEN.Tween(this.group.rotation)
                    .to({ y: angleToShelf }, 400)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .start();
            } else {
                this.group.rotation.y = angleToShelf;
            }

            // Arm Reach Animation
            this.state = "reaching";
            if (typeof TWEEN !== "undefined") {
                // Raise arm to book height
                new TWEEN.Tween(this.parts.shoulderR.rotation)
                    .to({ x: -1.2, z: 0.1 }, 500)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onComplete(() => {
                        // Grab book
                        this.heldBook = book3D;
                        book3D.userData.originalParent = book3D.parent;
                        book3D.userData.originalLocalPos = book3D.position.clone();
                        book3D.userData.originalLocalRot = book3D.rotation.clone();

                        // Slide book off shelf
                        new TWEEN.Tween(book3D.position)
                            .to({ z: book3D.position.z + 0.35 }, 400)
                            .easing(TWEEN.Easing.Cubic.Out)
                            .onComplete(() => {
                                // Attach to Bibi presentation point
                                this.parts.bookAttachPoint.add(book3D);
                                book3D.position.set(0, 0, 0);
                                book3D.rotation.set(0, 0, 0);
                                book3D.scale.set(1.4, 1.4, 1.4); // Highlight scale

                                // Turn Bibi toward camera/reading room
                                const roomCenterAngle = Math.atan2(-this.group.position.x, -this.group.position.z + 4);
                                new TWEEN.Tween(this.group.rotation)
                                    .to({ y: roomCenterAngle }, 600)
                                    .easing(TWEEN.Easing.Cubic.InOut)
                                    .start();

                                this.state = "holding";
                                this.say(`"Here is '${book3D.userData.titre}' by ${book3D.userData.auteur}. Please inspect its catalog folio."`);

                                if (onPresented) onPresented(book3D);
                            })
                            .start();
                    })
                    .start();
            } else {
                // Fallback without Tween
                this.state = "holding";
                this.heldBook = book3D;
                this.parts.bookAttachPoint.add(book3D);
                book3D.position.set(0, 0, 0);
                if (onPresented) onPresented(book3D);
            }
        });
    }

    /**
     * Returns the currently held book to its original shelf slot.
     */
    returnBookChoreography(onReturned) {
        if (!this.heldBook) {
            if (onReturned) onReturned();
            return;
        }

        const book = this.heldBook;
        this.say(`"Restocking '${book.userData.titre}' back into central shelf holdings..."`);

        const shelfPos = book.userData.shelfWorldPos || new THREE.Vector3(0, 1.5, 0);
        const targetX = shelfPos.x + (book.userData.shelfNormalX || 0) * 1.4;
        const targetZ = shelfPos.z + (book.userData.shelfNormalZ || 1) * 1.4;

        this.walkTo(targetX, targetZ, () => {
            const angleToShelf = Math.atan2(shelfPos.x - this.group.position.x, shelfPos.z - this.group.position.z);
            this.group.rotation.y = angleToShelf;

            if (typeof TWEEN !== "undefined") {
                new TWEEN.Tween(this.parts.shoulderR.rotation)
                    .to({ x: -1.1, z: 0.1 }, 400)
                    .onComplete(() => {
                        // Re-parent book back to shelf
                        if (book.userData.originalParent) {
                            book.userData.originalParent.add(book);
                            book.position.copy(book.userData.originalLocalPos);
                            book.rotation.copy(book.userData.originalLocalRot);
                            book.scale.set(1, 1, 1);
                        }
                        this.heldBook = null;
                        this.state = "idle";
                        this.say(`"Monograph safely restocked. Ready for your next research inquiry."`);
                        if (onReturned) onReturned();
                    })
                    .start();
            } else {
                if (book.userData.originalParent) {
                    book.userData.originalParent.add(book);
                    book.position.copy(book.userData.originalLocalPos);
                    book.rotation.copy(book.userData.originalLocalRot);
                    book.scale.set(1, 1, 1);
                }
                this.heldBook = null;
                this.state = "idle";
                if (onReturned) onReturned();
            }
        });
    }

    /**
     * Triggers character speech capsule in HUD.
     */
    say(text) {
        if (typeof this.onSpeech === "function") {
            this.onSpeech(text);
        }
    }
}

// Export for browser global scope
window.BibiCharacter = BibiCharacter;
