import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// URL of the GLB model to load, resolved relative to this module.
const MODEL_URL = new URL("./src/models/characters/trex.glb", import.meta.url).href;
// The model is uniformly scaled so its bounding-box height matches this value (in scene units).
const MODEL_TARGET_HEIGHT = 2.7;

// ---------------------------------------------------------------------------
// Skeleton configuration for the procedural animations.
// Bone names below must match the names baked into the GLB rig.
// ---------------------------------------------------------------------------

// Tail bones from base to tip, each with its own swing amplitude (more sway near the tip).
const TAIL_BONES = [
  { name: "Cola1_ArmatureRexy", amplitude: 0.15 },
  { name: "Cola2_ArmatureRexy", amplitude: 0.2 },
  { name: "Cola3_ArmatureRexy", amplitude: 0.3 },
  { name: "Cola4_ArmatureRexy", amplitude: 0.5 },
  { name: "Cola5_ArmatureRexy", amplitude: 0.7 },
  { name: "Cola6_ArmatureRexy", amplitude: 0.9 }
];
// Local axis the tail bones swing around.
const TAIL_SWING_AXIS = new THREE.Vector3(0, 0, 1);

// Jaw bone and the axis/angles used to open it during the roar animation.
const JAW_BONE_NAME = "Boca_ArmatureRexy";
const JAW_OPEN_AXIS = new THREE.Vector3(-1, 0, -0.022).normalize();
const JAW_OPEN_ANGLE_FIRST = THREE.MathUtils.degToRad(15); // Small initial opening (anticipation).
const JAW_OPEN_ANGLE = THREE.MathUtils.degToRad(30); // Full open angle.

// Timing constants (all in milliseconds) that drive the whole roar timeline.
const STEP_DURATION = 400; // Duration of the "anticipation" step before the jaw fully opens.
const JAW_SECOND_OPEN_DURATION = 150; // Time to go from partially open to fully open.
const JAW_OPEN_DURATION = STEP_DURATION + JAW_SECOND_OPEN_DURATION; // Total time to reach full jaw opening.
const JAW_CLOSE_DURATION = 450; // Time to close the jaw again.
const JAW_OPEN_PAUSE = 2000; // How long the jaw stays fully open (the "roar" hold).
const JAW_CYCLE_DURATION = JAW_OPEN_DURATION + JAW_OPEN_PAUSE + JAW_CLOSE_DURATION; // Full roar cycle length.

// Head/neck bones used to tilt the head back during the roar.
const HEAD_BONE_NAME = "Cabeza_ArmatureRexy";
const HEAD_IK_BONE_NAME = "CabezaIK_ArmatureRexy";
// Each bone contributes part of the overall neck curl, weighted by its own angle.
const HEAD_NECK_BONES = [
  { name: "Pecho001_ArmatureRexy", angle: THREE.MathUtils.degToRad(5) },
  { name: "Cuello_ArmatureRexy", angle: THREE.MathUtils.degToRad(10) },
  { name: "Cuello001_ArmatureRexy", angle: THREE.MathUtils.degToRad(2.5) },
  { name: "Atlas_ArmatureRexy", angle: THREE.MathUtils.degToRad(3.5) },
  { name: "Atlas001_ArmatureRexy", angle: THREE.MathUtils.degToRad(3) },
  { name: "Cabeza_ArmatureRexy", angle: THREE.MathUtils.degToRad(35) }
];
const HEAD_NECK_ROTATION_AXIS = new THREE.Vector3(1, 0, 0); // Pitch axis (nodding back).
const HEAD_TILT_AXIS = new THREE.Vector3(0, 1, 0); // Yaw axis for a slight head tilt.
const HEAD_TILT_ANGLE = THREE.MathUtils.degToRad(30);

// Root "body" bone, used both for the roar lean and for the walk cycle bobbing.
const BODY_BONE_NAME = "Mover_ArmatureRexy";
const BODY_ROTATION_AXIS = new THREE.Vector3(1, 0.0, -0.5).normalize();
const BODY_DOWN_ANGLE = THREE.MathUtils.degToRad(15); // How far the body leans down during the roar.
const BODY_STEP_FORWARD = 1.00; // Forward body displacement during the roar's stepping motion.
const BODY_STEP_DROP = 0.1; // Small vertical dip during the roar step.
// Subtle high-frequency shake applied to the body while the jaw is held open (adds weight to the roar).
const BODY_VIBRATION_AXIS = new THREE.Vector3(0.33, 0.33, 0.33).normalize();
const BODY_VIBRATION_ANGLE = THREE.MathUtils.degToRad(0.2);
const BODY_VIBRATION_PERIOD = 120;
const BODY_VIBRATION_FADE_DURATION = 150; // Fade-in/out time for the vibration envelope.

// Two-bone IK leg chains: thigh -> shin -> foot target, solved every frame to keep feet planted.
const LEG_CHAINS = [
  {
    upper: "MusloL_ArmatureRexy",
    lower: "PiernaL_ArmatureRexy",
    footTarget: "TalonL_ArmatureRexy"
  },
  {
    upper: "MusloR_ArmatureRexy",
    lower: "PiernaR_ArmatureRexy",
    footTarget: "TalonR_ArmatureRexy"
  }
];

// Arm bones rotated (each around its own axis) as part of the roar pose.
const ARM_BONES = [
  {
    name: "AntebrazoL_ArmatureRexy",
    axis: new THREE.Vector3(1, 0, 0),
    angle: THREE.MathUtils.degToRad(-25)
  },

  {
    name: "BrazoL_ArmatureRexy",
    axis: new THREE.Vector3(0, 0.2, 1).normalize(),
    angle: THREE.MathUtils.degToRad(-40)
  },

  {
    name: "AntebrazoR_ArmatureRexy",
    axis: new THREE.Vector3(1, 0, 0),
    angle: THREE.MathUtils.degToRad(-10)
  },

  {
    name: "BrazoR_ArmatureRexy",
    axis: new THREE.Vector3(0, 0.3, 1).normalize(),
    angle: THREE.MathUtils.degToRad(20)
  },
];

// Foot IK target used for the single "left step" taken right before the roar (weight shift).
const LEFT_STEP_ROOT_NAME = "PiernaIKL_ArmatureRexy";
const LEFT_STEP_LIFT = 0.80; // How high the foot lifts during the first phase.
const LEFT_STEP_SIDE = 0.0; // Sideways offset during the first phase (unused, kept at 0).

const LEFT_STEP_LIFT2 = 0.0; // Foot height once it lands.
const LEFT_STEP_FORWARD2 = 1.7; // Forward distance covered by the step.
const LEFT_STEP_SIDE2 = 0.0;
const LEFT_STEP_FIRST_DURATION = STEP_DURATION * 0.5; // First half of the step (lift).
const LEFT_STEP_SECOND_DURATION = LEFT_STEP_FIRST_DURATION; // Second half (landing).

// Parameters for the repeating walk cycle (used when walking to the atrium).
const WALK_STEP_LIFT = 0.80;
const WALK_STEP_FORWARD = 1.5;
const WALK_STEP_SIDE = 0.0;
const WALK_STEP_LIFT2 = 0.0;
const WALK_STEP_FORWARD2 = 3.0;
const WALK_STEP_SIDE2 = 0.0;
const WALK_BODY_FORWARD = 1.5; // Distance the body root advances per step.
const WALK_BODY_LIFT = 0.12; // Slight body rise mid-step.
const WALK_BODY_DROP = -0.12; // Slight body dip when the foot lands.
const WALK_STEP_DURATION = STEP_DURATION;

// Controls how/when the display platform (if present) descends to the floor while walking.
const PLATFORM_DESCENT_DELAY_STEPS = 3; // Number of walk steps to wait before starting the descent.
const PLATFORM_DESCENT_STEPS = 1; // Number of steps over which the descent completes.
const ATRIUM_WALK_STEP_COUNT = 23; // Total steps taken when walking to the atrium.

// ---------------------------------------------------------------------------
// Small math helpers used by the animation curves below.
// ---------------------------------------------------------------------------

// Smoothly eases a normalized progress value between 0 and 1 (cosine ease-in-out).
function cosineEase(progress) {
  const safeProgress = THREE.MathUtils.clamp(progress, 0, 1);
  return (1 - Math.cos(Math.PI * safeProgress)) * 0.5;
}

// Cubic Hermite interpolation between start/end values, taking into account
// the velocity (rate of change) at both ends. Used so the jaw-opening curve
// blends smoothly into the "hold" phase with continuous velocity.
function hermiteInterpolate(start, end, startVelocity, endVelocity, elapsed, duration) {
  const progress = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
  const progress2 = progress * progress;
  const progress3 = progress2 * progress;
  const startWeight = 2 * progress3 - 3 * progress2 + 1;
  const startVelocityWeight = progress3 - 2 * progress2 + progress;
  const endWeight = -2 * progress3 + 3 * progress2;
  const endVelocityWeight = progress3 - progress2;

  return startWeight * start
    + startVelocityWeight * startVelocity * duration
    + endWeight * end
    + endVelocityWeight * endVelocity * duration;
}

// Returns a -1..1 shake value for the body vibration effect.
// Vibrate only while the jaw remains fully open, with a fade-in/fade-out envelope
// so the shake doesn't start or stop abruptly.
function bodyVibrationAt(elapsed) {
  const pauseElapsed = elapsed - JAW_OPEN_DURATION;

  if (pauseElapsed < 0 || pauseElapsed > JAW_OPEN_PAUSE) {
    return 0;
  }

  const fadeIn = THREE.MathUtils.clamp(
    pauseElapsed / BODY_VIBRATION_FADE_DURATION,
    0,
    1
  );
  const fadeOut = THREE.MathUtils.clamp(
    (JAW_OPEN_PAUSE - pauseElapsed) / BODY_VIBRATION_FADE_DURATION,
    0,
    1
  );
  const envelope = Math.min(fadeIn, fadeOut);

  return Math.sin((pauseElapsed / BODY_VIBRATION_PERIOD) * Math.PI * 2) * envelope;
}

// Returns a 0..1 progress value describing how far the body has moved
// forward/down during the roar timeline: ramps up during the initial step,
// holds at 1 while the jaw is open, then eases back down as the jaw closes.
function bodyMovementProgressAt(elapsed) {
  const returnStart = JAW_OPEN_DURATION + JAW_OPEN_PAUSE;

  if (elapsed < STEP_DURATION) {
    return cosineEase(elapsed / STEP_DURATION);
  }

  if (elapsed < returnStart) {
    return 1;
  }

  return 1 - cosineEase((elapsed - returnStart) / JAW_CLOSE_DURATION);
}

// ---------------------------------------------------------------------------
// Main Dinosaur class: loads the GLB model and drives all procedural
// animations (tail sway, jaw/roar cycle, walking, leg IK, platform descent).
// ---------------------------------------------------------------------------
export class Dinosaur {
  constructor() {
    // `group` is the object added to the scene; `mobileRoot` is a child group
    // that can be moved independently (e.g. for the platform descent) without
    // affecting the outer group's fixed position/rotation.
    this.group = new THREE.Group();
    this.group.position.set(-16.5, 0.05, 0);
    this.group.rotation.y = Math.PI * 0.5;
    this.mobileRoot = new THREE.Group();
    this.group.add(this.mobileRoot);

    // --- Tail animation state ---
    this.tailBones = [];
    this.tailTween = null;
    this.tailLoopRequested = false;
    this.tailState = { phase: 0, strength: 0 };
    this.tailOffset = new THREE.Quaternion();

    // --- Jaw animation state ---
    this.jawBone = null;
    this.jawBaseQuaternion = new THREE.Quaternion();
    this.jawOffset = new THREE.Quaternion();
    this.jawState = { progress: 0 };
    this.jawTween = null;

    // --- Head/neck animation state ---
    this.headNeckBones = [];
    this.headNeckOffset = new THREE.Quaternion();
    this.headTiltOffset = new THREE.Quaternion();

    // --- Body (root) animation state ---
    this.bodyBone = null;
    this.bodyBaseQuaternion = new THREE.Quaternion();
    this.bodyBasePosition = new THREE.Vector3();
    this.bodyOffset = new THREE.Quaternion();
    this.bodyVibrationOffset = new THREE.Quaternion();

    this.model = null;

    // --- Leg IK state ---
    this.legChains = [];

    // --- Arm animation state ---
    this.armBones = [];
    this.armOffset = new THREE.Quaternion();

    // --- Pre-roar left-foot step state ---
    this.leftStepRoot = null;
    this.leftStepBasePosition = new THREE.Vector3();

    // --- Walking state ---
    this.walkFeet = [];
    this.walkingTween = null;
    this.walkingRequested = false;
    this.roarLoopRequested = false;
    this.walkingStepsRemaining = null;
    this.walkingCompleteCallback = null;

    // --- Platform descent state (for models that ship with a display base) ---
    this.platformDropDistance = 0;
    this.platformDescentActive = false;
    this.platformDescentDone = false;
    this.platformDescentStep = 0;
    this.platformDescentDelayStep = 0;
    this.platformDescentStartY = 0;
    this.platformDescentTargetY = 0;

    this.nextWalkingFoot = 0;
    this.lastWalkingLandingY = null;
    this.walkingStanceInitialized = false;
    this.walkingBodyBaseZ = null;

    // Dedicated tween group so this instance's tweens don't interfere with
    // any other TWEEN.js users elsewhere in the app.
    this.tweenGroup = new TWEEN.Group();

    this.createClickHitbox();
    this.loadModel();
  }

  createClickHitbox() {
    // Invisible mesh used by the interaction raycaster so the whole dinosaur
    // (not just visible mesh triangles) can be clicked to trigger the roar.
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 3.4, 2.2),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    hitbox.name = "T-Rex Click Hitbox";
    hitbox.position.y = 1.7;
    this.mobileRoot.add(hitbox);
  }

  loadModel() {
    const loader = new GLTFLoader();

    loader.load(
      MODEL_URL,
      gltf => {
        const model = gltf.scene;
        this.model = model;
        model.rotation.x = 0;
        model.updateMatrixWorld(true);

        // Uniformly scale the model so its height matches MODEL_TARGET_HEIGHT.
        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const scale = MODEL_TARGET_HEIGHT / initialSize.y;
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);

        // Center the model horizontally and place it on the ground plane (y = 0).
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y, -center.z);

        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.isSkinnedMesh) {
              // Skinned meshes can have bounds that don't match their static
              // geometry once animated, so disable frustum culling to avoid
              // them popping out of view incorrectly.
              child.frustumCulled = false;
            }
          }
        });

        this.mobileRoot.add(model);
        this.keepPlatformOnDisplayBase(model);
        this.setupTailAnimation(model);
        this.setupJawAnimation(model);
        this.setupHeadNeckAnimation(model);
        this.setupBodyAnimation(model);
        this.setupLegCompensation(model);
        this.setupArmAnimation(model);
        this.setupLeftStep(model);
        this.setupWalking(model);
      },
      undefined,
      error => {
        console.error("Failed to load the T-Rex model:", error);
      }
    );
  }

  keepPlatformOnDisplayBase(model) {
    // If the model includes a "platform" mesh (a static display base), detach
    // it from the animated rig so it stays fixed on the ground while the rest
    // of the model animates/walks above it.
    const platform = model.getObjectByName("platform");

    if (!platform) {
      return;
    }

    model.updateMatrixWorld(true);
    this.group.updateMatrixWorld(true);
    // Detach the platform from the animated model while preserving its transform.
    this.group.attach(platform);
    this.updatePlatformDropDistance(platform);
  }

  updatePlatformDropDistance(platform) {
    // Compute how far the mobile root needs to drop for the model's feet to
    // reach the floor once it walks off of the platform.
    this.group.updateMatrixWorld(true);
    platform.updateMatrixWorld(true);

    const platformBox = new THREE.Box3().setFromObject(platform);
    const groupWorldY = this.group.getWorldPosition(new THREE.Vector3()).y;
    this.platformDropDistance = Math.max(0, platformBox.max.y - groupWorldY);
  }

  setupTailAnimation(model) {
    // Cache each tail bone along with its bind-pose rotation, per-bone
    // amplitude, and a phase offset so the sway ripples down the tail
    // (each successive bone lags slightly behind the previous one).
    this.tailBones = TAIL_BONES.map((config, index) => {
      const bone = model.getObjectByName(config.name);

      if (!bone) {
        return null;
      }

      return {
        bone,
        baseQuaternion: bone.quaternion.clone(),
        amplitude: config.amplitude,
        phaseOffset: index * 0.22
      };
    }).filter(Boolean);
  }

  startTailAnimation(loop = false) {
    if (loop) {
      this.tailLoopRequested = true;
    }

    // Avoid starting a second tail tween if one is already running, or if
    // no tail bones were found on the rig.
    if (this.tailTween || this.tailBones.length === 0) {
      return;
    }

    this.tailState.phase = 0;
    // When looping (roar mode) start at full strength; otherwise ease in below.
    this.tailState.strength = this.tailLoopRequested ? 1 : 0;
    this.tailTween = new TWEEN.Tween(this.tailState, this.tweenGroup)
      .to({ phase: Math.PI * 2 }, 2600)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(() => {
        // Apply a sine wave to each bone, offset by its phase and scaled by
        // its amplitude and the current overall "strength" envelope.
        this.tailBones.forEach(tailBone => {
          const angle =
            Math.sin(this.tailState.phase - tailBone.phaseOffset) *
            tailBone.amplitude *
            this.tailState.strength;
          this.tailOffset.setFromAxisAngle(TAIL_SWING_AXIS, angle);
          tailBone.bone.quaternion.copy(tailBone.baseQuaternion).multiply(this.tailOffset);
        });
      })
      .onComplete(() => {
        this.tailTween = null;
        if (this.tailLoopRequested) {
          // Keep looping the sway for as long as the roar loop is active.
          this.startTailAnimation(true);
          return;
        }

        // One-shot animation finished: reset bones back to bind pose.
        this.tailBones.forEach(tailBone => {
          tailBone.bone.quaternion.copy(tailBone.baseQuaternion);
        });
      })
      .start();

    // For a single (non-looping) idle sway, fade the strength in smoothly
    // rather than snapping straight to full amplitude.
    if (!this.tailLoopRequested) {
      new TWEEN.Tween(this.tailState, this.tweenGroup)
        .to({ strength: 1 }, 700)
        .easing(TWEEN.Easing.Sinusoidal.Out)
        .start();
    }
  }

  setupJawAnimation(model) {
    this.jawBone = model.getObjectByName(JAW_BONE_NAME);

    if (!this.jawBone) {
      return;
    }

    this.jawBaseQuaternion.copy(this.jawBone.quaternion);
  }

  setupHeadNeckAnimation(model) {
    // Cache the bind-pose rotation and per-bone angle contribution for each
    // bone along the neck chain, used to curl the head back during a roar.
    this.headNeckBones = HEAD_NECK_BONES.map(config => {
      const bone = model.getObjectByName(config.name);

      if (!bone) {
        return null;
      }

      return {
        bone,
        baseQuaternion: bone.quaternion.clone(),
        angle: config.angle
      };
    }).filter(Boolean);

    const headBone = model.getObjectByName(HEAD_BONE_NAME);
    const headIkBone = model.getObjectByName(HEAD_IK_BONE_NAME);

    if (!headBone || !headIkBone) {
      return;
    }

    // Re-parent the head IK target under the head bone (preserving its world
    // transform) so it follows the head as it rotates during the roar.
    model.updateMatrixWorld(true);
    headBone.attach(headIkBone);
  }

  setupBodyAnimation(model) {
    this.bodyBone = model.getObjectByName(BODY_BONE_NAME);

    if (!this.bodyBone) {
      return;
    }

    this.bodyBaseQuaternion.copy(this.bodyBone.quaternion);
    this.bodyBasePosition.copy(this.bodyBone.position);
  }

  setupLegCompensation(model) {
    // Precompute the rest-pose segment lengths (thigh/shin) and the ankle
    // offset for each leg, used later by the two-bone IK solver to keep the
    // feet planted on their IK targets no matter how the body/root moves.
    model.updateWorldMatrix(true, true);

    this.legChains = LEG_CHAINS.map(config => {
      const upperBone = model.getObjectByName(config.upper);
      const lowerBone = model.getObjectByName(config.lower);
      const footTargetBone = model.getObjectByName(config.footTarget);

      if (!upperBone || !lowerBone || !footTargetBone) {
        return null;
      }

      const hipPosition = upperBone.getWorldPosition(new THREE.Vector3());
      const kneePosition = lowerBone.getWorldPosition(new THREE.Vector3());
      const targetPosition = footTargetBone.getWorldPosition(new THREE.Vector3());

      // Cache segment lengths for the two-bone IK solver.
      return {
        upperBone,
        lowerBone,
        footTargetBone,
        upperBaseQuaternion: upperBone.quaternion.clone(),
        lowerBaseQuaternion: lowerBone.quaternion.clone(),
        upperLength: hipPosition.distanceTo(kneePosition),
        lowerLength: kneePosition.distanceTo(targetPosition),
        // Ankle point expressed in the lower bone's local space, so we can
        // recompute its current world position after rotating the lower bone.
        anklePoint: lowerBone.worldToLocal(targetPosition.clone())
      };
    }).filter(Boolean);
  }

  setupArmAnimation(model) {
    this.armBones = ARM_BONES.map(config => {
      const bone = model.getObjectByName(config.name);

      if (!bone) {
        return null;
      }

      return {
        bone,
        baseQuaternion: bone.quaternion.clone(),
        axis: config.axis,
        angle: config.angle
      };
    }).filter(Boolean);
  }

  setupLeftStep(model) {
    this.leftStepRoot = model.getObjectByName(LEFT_STEP_ROOT_NAME);

    if (!this.leftStepRoot) {
      return;
    }

    this.leftStepBasePosition.copy(this.leftStepRoot.position);

  }

  setupWalking(model) {
    // Cache both foot IK targets and their bind-pose positions.
    this.walkFeet = ["PiernaIKL_ArmatureRexy", "PiernaIKR_ArmatureRexy"]
      .map(name => {
        const bone = model.getObjectByName(name);

        if (!bone) {
          return null;
        }

        return {
          bone,
          basePosition: bone.position.clone()
        };
      })
      .filter(Boolean);

    // If walking was requested before the model finished loading, start it now.
    if (this.walkingRequested) {
      this.startWalkingStep();
    }
  }

  applyWalkingStep(foot, bodyStart, landingForward, progress) {
    // Split each step into a lift phase (0 -> 0.5) and a landing phase (0.5 -> 1),
    // each independently eased for a natural foot-fall motion.
    const firstHalf = progress < 0.5;
    const phaseProgress = cosineEase(firstHalf ? progress * 2 : (progress - 0.5) * 2);
    const lift = firstHalf
      ? THREE.MathUtils.lerp(0, WALK_STEP_LIFT, phaseProgress)
      : THREE.MathUtils.lerp(WALK_STEP_LIFT, WALK_STEP_LIFT2, phaseProgress);
    const forward = firstHalf
      ? THREE.MathUtils.lerp(0, WALK_STEP_FORWARD, phaseProgress)
      : THREE.MathUtils.lerp(WALK_STEP_FORWARD, landingForward, phaseProgress);
    const side = firstHalf
      ? THREE.MathUtils.lerp(0, WALK_STEP_SIDE, phaseProgress)
      : THREE.MathUtils.lerp(WALK_STEP_SIDE, WALK_STEP_SIDE2, phaseProgress);

    // Move the stepping foot's IK target: side offset, vertical lift (z), and
    // forward travel (y, since the rig's "forward" axis is y here).
    foot.bone.position.copy(foot.basePosition);
    foot.bone.position.x += side;
    foot.bone.position.z += lift;
    foot.bone.position.y -= forward;

    // Advance the body root forward continuously over the whole step, and
    // bob it up during the lift phase / down during the landing phase.
    this.bodyBone.position.copy(bodyStart);
    this.bodyBone.position.y -= WALK_BODY_FORWARD * cosineEase(progress);
    this.bodyBone.position.z = firstHalf
      ? THREE.MathUtils.lerp(
        bodyStart.z,
        this.walkingBodyBaseZ + WALK_BODY_LIFT,
        phaseProgress
      )
      : THREE.MathUtils.lerp(
        this.walkingBodyBaseZ + WALK_BODY_LIFT,
        this.walkingBodyBaseZ + WALK_BODY_DROP,
        phaseProgress
      );
    this.solveLegCompensation();
  }

  startPlatformDescentIfNeeded() {
    // Only start the descent once, after enough walking steps have elapsed,
    // and only if there's actually a platform to descend from.
    if (this.platformDescentDone || this.platformDescentActive || this.platformDropDistance <= 0) {
      return;
    }

    if (this.platformDescentDelayStep < PLATFORM_DESCENT_DELAY_STEPS) {
      return;
    }

    this.platformDescentActive = true;
    this.platformDescentStep = 0;
    this.platformDescentStartY = this.mobileRoot.position.y;
    this.platformDescentTargetY = -this.platformDropDistance;
  }

  applyPlatformDescent(stepProgress) {
    if (!this.platformDescentActive) {
      return;
    }

    // Lower the mobile root smoothly over PLATFORM_DESCENT_STEPS walking steps.
    const progress = THREE.MathUtils.clamp(stepProgress / PLATFORM_DESCENT_STEPS, 0, 1);
    const easedProgress = cosineEase(progress);
    this.mobileRoot.position.y = THREE.MathUtils.lerp(
      this.platformDescentStartY,
      this.platformDescentTargetY,
      easedProgress
    );

    if (progress >= 1) {
      this.platformDescentActive = false;
      this.platformDescentDone = true;
      this.mobileRoot.position.y = this.platformDescentTargetY;
    }
  }

  startWalkingStep() {
    // Don't start a new step while one is already running, while the roar
    // jaw animation is playing, or if the rig has no feet set up.
    if (this.walkingTween || this.jawTween || !this.bodyBone || this.walkFeet.length < 2) {
      return;
    }

    if (!this.walkingStanceInitialized) {
      // Offset the feet once to establish an alternating walking stance
      // (right foot starts one full stride behind the left).
      const rightFoot = this.walkFeet[1];
      rightFoot.basePosition.y -= WALK_BODY_FORWARD;
      rightFoot.bone.position.copy(rightFoot.basePosition);
      this.walkingBodyBaseZ = this.bodyBone.position.z;
      this.walkingStanceInitialized = true;
      this.solveLegCompensation();
    }

    this.startPlatformDescentIfNeeded();

    // Alternate between the two feet for each successive step.
    const foot = this.walkFeet[this.nextWalkingFoot];
    const bodyStart = this.bodyBone.position.clone();
    // Determine how far this foot needs to travel to land ahead of its
    // current position, based on the last landing spot (or the initial pose).
    const landingY = this.lastWalkingLandingY === null
      ? foot.basePosition.y - WALK_STEP_FORWARD2
      : this.lastWalkingLandingY - WALK_BODY_FORWARD;
    const landingForward = foot.basePosition.y - landingY;
    const state = { progress: 0 };

    this.walkingTween = new TWEEN.Tween(state, this.tweenGroup)
      .to({ progress: 1 }, WALK_STEP_DURATION)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(() => {
        this.applyWalkingStep(foot, bodyStart, landingForward, state.progress);
        this.applyPlatformDescent(this.platformDescentStep + state.progress);
      })
      .onComplete(() => {
        // Commit the foot's new resting position and bookkeeping for the next step.
        foot.basePosition.copy(foot.bone.position);
        this.lastWalkingLandingY = foot.basePosition.y;
        this.bodyBasePosition.copy(this.bodyBone.position);
        this.nextWalkingFoot = (this.nextWalkingFoot + 1) % this.walkFeet.length;

        if (this.platformDescentActive) {
          this.platformDescentStep += 1;
          this.applyPlatformDescent(this.platformDescentStep);
        } else if (!this.platformDescentDone) {
          this.platformDescentDelayStep += 1;
        }
        this.walkingTween = null;

        // If a specific step count was requested, count down and fire the
        // completion callback (e.g. to trigger the roar) once done.
        if (this.walkingStepsRemaining !== null) {
          this.walkingStepsRemaining -= 1;

          if (this.walkingStepsRemaining <= 0) {
            const walkingCompleteCallback = this.walkingCompleteCallback;
            this.walkingRequested = false;
            this.walkingStepsRemaining = null;
            this.walkingCompleteCallback = null;

            if (walkingCompleteCallback) {
              walkingCompleteCallback();
            }
            return;
          }
        }

        // Otherwise keep walking indefinitely as long as it's still requested.
        if (this.walkingRequested) {
          this.startWalkingStep();
        }
      })
      .start();
  }

  startWalking(stepCount = null, onComplete = null) {
    // Starts (or resumes) walking. `stepCount` of null means walk indefinitely;
    // `onComplete` fires once the requested number of steps has been taken.
    this.roarLoopRequested = false;
    this.walkingRequested = true;
    this.walkingStepsRemaining = stepCount;
    this.walkingCompleteCallback = onComplete;
    this.startWalkingStep();
  }

  stopWalking() {
    this.walkingRequested = false;
    this.walkingStepsRemaining = null;
    this.walkingCompleteCallback = null;

    if (this.walkingTween) {
      this.walkingTween.stop();
      this.walkingTween = null;
    }
  }

  walkToAtriumAndRoar() {
    // Public entry point: walk a fixed number of steps, then transition into
    // the looping roar animation once the walk finishes.
    if (this.walkingStepsRemaining !== null || this.roarLoopRequested) {
      return;
    }

    this.roarLoopRequested = false;
    this.startWalking(ATRIUM_WALK_STEP_COUNT, () => this.startRoarLoop());
  }

  prepareRoarFromWalkingPose() {
    // Re-baseline all the walking-related bones/positions to wherever the
    // model ended up after walking, so the roar animation starts from the
    // dinosaur's current pose instead of snapping back to the bind pose.
    if (this.bodyBone) {
      this.bodyBasePosition.copy(this.bodyBone.position);
      this.walkingBodyBaseZ = this.bodyBone.position.z;
    }

    if (this.leftStepRoot) {
      this.leftStepBasePosition.copy(this.leftStepRoot.position);
    }

    this.walkFeet.forEach(foot => {
      foot.basePosition.copy(foot.bone.position);
    });

    this.solveLegCompensation();
  }

  applyLeftStep(elapsed) {
    // Drives the single left-foot weight-shift step that precedes the roar's
    // jaw opening, then holds during the roar, then returns to rest as the
    // jaw closes. This runs on the same timeline as the jaw/roar cycle.
    if (!this.leftStepRoot) {
      return;
    }

    const firstStepEnd = LEFT_STEP_FIRST_DURATION;
    const secondStepEnd = firstStepEnd + LEFT_STEP_SECOND_DURATION;
    const returnStart = JAW_OPEN_DURATION + JAW_OPEN_PAUSE;
    let lift;
    let forward;
    let side;

    if (elapsed < secondStepEnd) {
      // Stepping phase: lift then land.
      const progress = THREE.MathUtils.clamp(elapsed / secondStepEnd, 0, 1);

      forward = LEFT_STEP_FORWARD2 * cosineEase(progress);

      if (elapsed < firstStepEnd) {
        const liftProgress = cosineEase(elapsed / firstStepEnd);
        lift = LEFT_STEP_LIFT * liftProgress;
        side = LEFT_STEP_SIDE * liftProgress;
      } else {
        const landingProgress = cosineEase(
          (elapsed - firstStepEnd) / LEFT_STEP_SECOND_DURATION
        );
        lift = THREE.MathUtils.lerp(LEFT_STEP_LIFT, LEFT_STEP_LIFT2, landingProgress);
        side = THREE.MathUtils.lerp(LEFT_STEP_SIDE, LEFT_STEP_SIDE2, landingProgress);
      }
    } else if (elapsed < returnStart) {
      // Hold phase: foot stays planted at its landed position during the roar.
      lift = LEFT_STEP_LIFT2;
      forward = LEFT_STEP_FORWARD2;
      side = LEFT_STEP_SIDE2;
    } else {
      // Return phase: ease back to the resting position as the jaw closes.
      const progress = cosineEase(
        (elapsed - returnStart) / JAW_CLOSE_DURATION
      );
      lift = THREE.MathUtils.lerp(LEFT_STEP_LIFT2, 0, progress);
      forward = THREE.MathUtils.lerp(LEFT_STEP_FORWARD2, 0, progress);
      side = THREE.MathUtils.lerp(LEFT_STEP_SIDE2, 0, progress);
    }

    this.leftStepRoot.position.copy(this.leftStepBasePosition);
    this.leftStepRoot.position.x += side;
    this.leftStepRoot.position.z += lift;
    this.leftStepRoot.position.y -= forward;
  }

  applyBodyStep(elapsed) {
    // Moves the body root forward/down during the roar using the shared
    // bodyMovementProgressAt() timeline (ramp up, hold, ease back).
    if (!this.bodyBone) {
      return;
    }

    const progress = bodyMovementProgressAt(elapsed);

    this.bodyBone.position.copy(this.bodyBasePosition);
    this.bodyBone.position.y -= BODY_STEP_FORWARD * progress;
    this.bodyBone.position.z -= BODY_STEP_DROP * Math.sin(Math.PI * progress);
  }

  rotateBoneToward(bone, currentDirection, targetDirection) {
    // Rotates `bone` (in its local space) by the minimal rotation that takes
    // `currentDirection` to `targetDirection` in world space. Used by the IK
    // solver to aim the thigh at the knee and the shin at the foot target.
    const delta = new THREE.Quaternion().setFromUnitVectors(
      currentDirection.clone().normalize(),
      targetDirection.clone().normalize()
    );
    const worldQuaternion = bone.getWorldQuaternion(new THREE.Quaternion());
    const parentQuaternion = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    const targetWorldQuaternion = delta.multiply(worldQuaternion);

    bone.quaternion.copy(parentQuaternion.invert().multiply(targetWorldQuaternion));
  }

  solveLegCompensation() {
    // Two-bone (thigh/shin) analytic IK solver, run every frame so the feet
    // stay locked to their IK targets regardless of how the root/body moves.
    if (!this.model || this.legChains.length === 0) {
      return;
    }

    this.legChains.forEach(chain => {
      // Restore the bind pose before solving the current target positions,
      // so each solve starts from a known, consistent reference pose.
      chain.upperBone.quaternion.copy(chain.upperBaseQuaternion);
      chain.lowerBone.quaternion.copy(chain.lowerBaseQuaternion);
    });
    this.model.updateWorldMatrix(true, true);

    this.legChains.forEach(chain => {
      const hip = chain.upperBone.getWorldPosition(new THREE.Vector3());
      const currentKnee = chain.lowerBone.getWorldPosition(new THREE.Vector3());
      const target = chain.footTargetBone.getWorldPosition(new THREE.Vector3());
      const hipToTarget = target.clone().sub(hip);
      const targetDirection = hipToTarget.clone().normalize();
      // Clamp the hip-to-target distance to what the two bones can physically
      // reach, to avoid NaNs when the target is too close or too far.
      const minimumReach = Math.abs(chain.upperLength - chain.lowerLength) + 0.0001;
      const maximumReach = chain.upperLength + chain.lowerLength - 0.0001;
      const distance = THREE.MathUtils.clamp(
        hipToTarget.length(),
        minimumReach,
        maximumReach
      );
      // Law of cosines: find how far along the hip->target line the knee
      // projects, then how far it sits off that line (the "height").
      const along =
        (chain.upperLength ** 2 + distance ** 2 - chain.lowerLength ** 2) /
        (2 * distance);
      const height = Math.sqrt(Math.max(0, chain.upperLength ** 2 - along ** 2));
      const currentHipToKnee = currentKnee.clone().sub(hip);
      // Preserve the current bend direction (front/back) of the knee rather
      // than flipping to an arbitrary side.
      const bendDirection = currentHipToKnee
        .clone()
        .addScaledVector(targetDirection, -currentHipToKnee.dot(targetDirection))
        .normalize();
      const desiredKnee = hip
        .clone()
        .addScaledVector(targetDirection, along)
        .addScaledVector(bendDirection, height);

      // Aim the thigh at the computed knee, then aim the shin at the foot target.
      this.rotateBoneToward(
        chain.upperBone,
        currentHipToKnee,
        desiredKnee.clone().sub(hip)
      );
      this.model.updateWorldMatrix(true, true);

      const knee = chain.lowerBone.getWorldPosition(new THREE.Vector3());
      const currentAnkle = chain.lowerBone.localToWorld(chain.anklePoint.clone());
      this.rotateBoneToward(
        chain.lowerBone,
        currentAnkle.sub(knee),
        target.clone().sub(knee)
      );
      this.model.updateWorldMatrix(true, true);
    });
  }

  startJawAnimation() {
    if (this.jawTween || !this.jawBone) {
      return;
    }

    this.jawState.progress = 0;
    this.jawTween = new TWEEN.Tween(this.jawState, this.tweenGroup)
      .to({ progress: 1 }, JAW_CYCLE_DURATION)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(() => {
        // One single timeline (0..JAW_CYCLE_DURATION ms) coordinates the jaw,
        // head, body, arms, and legs so everything stays in sync for the roar.
        const elapsed = this.jawState.progress * JAW_CYCLE_DURATION;
        let openness = 1; // 0 = jaw closed, 1 = jaw fully open.
        const transitionVelocity = 1 / JAW_OPEN_DURATION;

        if (elapsed < STEP_DURATION) {
          // Phase 1: small initial opening, timed with the anticipation step.
          openness = hermiteInterpolate(
            0,
            JAW_OPEN_ANGLE_FIRST / JAW_OPEN_ANGLE,
            0,
            transitionVelocity,
            elapsed,
            STEP_DURATION
          );
        } else if (elapsed < JAW_OPEN_DURATION) {
          // Phase 2: quickly finish opening to the full angle.
          openness = hermiteInterpolate(
            JAW_OPEN_ANGLE_FIRST / JAW_OPEN_ANGLE,
            1,
            transitionVelocity,
            0,
            elapsed - STEP_DURATION,
            JAW_SECOND_OPEN_DURATION
          );
        } else if (elapsed > JAW_OPEN_DURATION + JAW_OPEN_PAUSE) {
          // Phase 4: ease the jaw closed after the hold/pause phase.
          const progress = (
            elapsed - JAW_OPEN_DURATION - JAW_OPEN_PAUSE
          ) / JAW_CLOSE_DURATION;
          openness = 1 - cosineEase(progress);
        }
        // (Implicit phase 3, the hold/pause, keeps openness = 1.)

        this.jawOffset.setFromAxisAngle(JAW_OPEN_AXIS, JAW_OPEN_ANGLE * openness);
        this.jawBone.quaternion.copy(this.jawBaseQuaternion).multiply(this.jawOffset);

        // Curl the neck/head back in proportion to how open the jaw is.
        this.headNeckBones.forEach(headNeckBone => {
          this.headNeckOffset.setFromAxisAngle(
            HEAD_NECK_ROTATION_AXIS,
            headNeckBone.angle * openness
          );
          headNeckBone.bone.quaternion
            .copy(headNeckBone.baseQuaternion)
            .multiply(this.headNeckOffset);

          // The head bone additionally gets a slight sideways tilt.
          if (headNeckBone.bone.name === HEAD_BONE_NAME) {
            this.headTiltOffset.setFromAxisAngle(
              HEAD_TILT_AXIS,
              HEAD_TILT_ANGLE * openness
            );
            headNeckBone.bone.quaternion.multiply(this.headTiltOffset);
          }
        });

        if (this.bodyBone) {
          // Lean the body down/forward using the shared movement-progress curve,
          // then layer the small vibration shake on top while the jaw is held open.
          this.bodyOffset.setFromAxisAngle(
            BODY_ROTATION_AXIS,
            BODY_DOWN_ANGLE * bodyMovementProgressAt(elapsed)
          );
          this.bodyBone.quaternion
            .copy(this.bodyBaseQuaternion)
            .multiply(this.bodyOffset);
          this.bodyVibrationOffset.setFromAxisAngle(
            BODY_VIBRATION_AXIS,
            BODY_VIBRATION_ANGLE * bodyVibrationAt(elapsed)
          );
          this.bodyBone.quaternion.multiply(this.bodyVibrationOffset);
        }

        // Rotate the arms into their roar pose, scaled by jaw openness.
        this.armBones.forEach(armBone => {
          this.armOffset.setFromAxisAngle(
            armBone.axis,
            armBone.angle * openness
          );
          armBone.bone.quaternion
            .copy(armBone.baseQuaternion)
            .multiply(this.armOffset);
        });

        // Apply the remaining position-based parts of the timeline, then
        // re-solve the leg IK so the feet track any body movement above.
        this.applyLeftStep(elapsed);
        this.applyBodyStep(elapsed);
        this.solveLegCompensation();
      })
      .onComplete(() => {
        this.jawTween = null;
        if (this.roarLoopRequested) {
          // Keep repeating the roar cycle while the roar loop is active.
          this.startJawAnimation();
        } else if (this.walkingRequested) {
          // If walking was requested while the roar was playing, resume it now.
          this.startWalkingStep();
        }
      })
      .start();
  }

  startRoarLoop() {
    // Stop any in-progress walk, re-baseline bones to the current pose, and
    // start the looping tail sway + jaw/roar cycle.
    this.stopWalking();
    this.roarLoopRequested = true;
    this.prepareRoarFromWalkingPose();
    this.startTailAnimation(true);
    this.startJawAnimation();
  }

  awaken() {
    // Simple idle interaction: sway the tail once and, if not currently
    // walking, play a single roar cycle.
    this.startTailAnimation();
    if (!this.walkingRequested) {
      this.startJawAnimation();
    }
  }

  onClick() {
    this.awaken();
  }

  update(_deltaTime, elapsedTime) {
    // Drive all active tweens forward using the elapsed time (converted to ms).
    this.tweenGroup.update(elapsedTime * 1000);
  }
}
