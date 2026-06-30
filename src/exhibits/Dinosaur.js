import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = new URL("../characters/trex.glb", import.meta.url).href;
const TAIL_BONES = [
  { name: "Cola1_ArmatureRexy", amplitude: 0.15 },
  { name: "Cola2_ArmatureRexy", amplitude: 0.2 },
  { name: "Cola3_ArmatureRexy", amplitude: 0.3 },
  { name: "Cola4_ArmatureRexy", amplitude: 0.5 },
  { name: "Cola5_ArmatureRexy", amplitude: 0.4 },
  { name: "Cola6_ArmatureRexy", amplitude: 0.3 }
];
const TAIL_SWING_AXIS = new THREE.Vector3(0, 0, 1);
const JAW_BONE_NAME = "Boca_ArmatureRexy";
const JAW_OPEN_AXIS = new THREE.Vector3(-1, 0, -0.022).normalize();
const JAW_OPEN_ANGLE = THREE.MathUtils.degToRad(30);
const JAW_MOVEMENT_DURATION = 450;
const JAW_OPEN_PAUSE = 1200;
const JAW_CYCLE_DURATION = JAW_MOVEMENT_DURATION * 2 + JAW_OPEN_PAUSE;
const JAW_CLOSED_PAUSE = 4000;
const HEAD_BONE_NAME = "Cabeza_ArmatureRexy";
const HEAD_IK_BONE_NAME = "CabezaIK_ArmatureRexy";
const HEAD_NECK_BONES = [
  { name: "Pecho001_ArmatureRexy", angle: THREE.MathUtils.degToRad(5) },
  { name: "Cuello_ArmatureRexy", angle: THREE.MathUtils.degToRad(10) },
  { name: "Cuello001_ArmatureRexy", angle: THREE.MathUtils.degToRad(2.5) },
  { name: "Atlas_ArmatureRexy", angle: THREE.MathUtils.degToRad(3.5) },
  { name: "Atlas001_ArmatureRexy", angle: THREE.MathUtils.degToRad(3) },
  { name: "Cabeza_ArmatureRexy", angle: THREE.MathUtils.degToRad(35) }
];
const HEAD_NECK_ROTATION_AXIS = new THREE.Vector3(1, 0, 0);
const HEAD_TILT_AXIS = new THREE.Vector3(0, 1, 0);
const HEAD_TILT_ANGLE = THREE.MathUtils.degToRad(30);
const BODY_BONE_NAME = "Mover_ArmatureRexy";
const BODY_ROTATION_AXIS = new THREE.Vector3(1, 0.0, -0.5).normalize();
const BODY_DOWN_ANGLE = THREE.MathUtils.degToRad(15);
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
const LEFT_STEP_ROOT_NAME = "PiernaIKL_ArmatureRexy";
const LEFT_STEP_LIFT = 0.0;
const LEFT_STEP_FORWARD = 0.0;
const LEFT_STEP_SIDE = 0.0;

const LEFT_STEP_LIFT2 = 0.0;
const LEFT_STEP_FORWARD2 = 0;
const LEFT_STEP_SIDE2 = 0.0;
const LEFT_STEP_SECOND_DURATION = 200;

function cosineEase(progress) {
  const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  return (1 - Math.cos(Math.PI * clampedProgress)) * 0.5;
}

export class Dinosaur {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(-16.5, 0.05, 0);
    this.group.rotation.y = Math.PI * 0.5;
    this.tailBones = [];
    this.tailTween = null;
    this.tailState = { phase: 0, strength: 0 };
    this.tailOffset = new THREE.Quaternion();
    this.jawBone = null;
    this.jawBaseQuaternion = new THREE.Quaternion();
    this.jawOffset = new THREE.Quaternion();
    this.jawState = { progress: 0 };
    this.jawTween = null;
    this.headNeckBones = [];
    this.headNeckOffset = new THREE.Quaternion();
    this.headTiltOffset = new THREE.Quaternion();
    this.bodyBone = null;
    this.bodyBaseQuaternion = new THREE.Quaternion();
    this.bodyOffset = new THREE.Quaternion();
    this.model = null;
    this.legChains = [];
    this.armBones = [];
    this.armOffset = new THREE.Quaternion();
    this.leftStepRoot = null;
    this.leftStepBasePosition = new THREE.Vector3();
    this.tweenGroup = new TWEEN.Group();
    this.loadModel();
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

        // Porta il modello alle dimensioni della sala e appoggialo al pavimento.
        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const scale = 3.2 / initialSize.y;
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y, -center.z);

        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.group.add(model);
        this.setupTailAnimation(model);
        this.setupJawAnimation(model);
        this.setupHeadNeckAnimation(model);
        this.setupBodyAnimation(model);
        this.setupLegCompensation(model);
        this.setupArmAnimation(model);
        this.setupLeftStep(model);
        this.startTailAnimation();
        this.startJawAnimation();
      },
      undefined,
      error => {
        console.error("Impossibile caricare il modello del T-Rex:", error);
      }
    );
  }

  setupTailAnimation(model) {
    this.tailBones = TAIL_BONES.map((config, index) => {
      const bone = model.getObjectByName(config.name);

      if (!bone) {
        console.warn(`Osso della coda non trovato: ${config.name}`);
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

  startTailAnimation() {
    if (this.tailTween || this.tailBones.length === 0) {
      return;
    }

    this.tailState.phase = 0;
    this.tailState.strength = 0;
    this.tailTween = new TWEEN.Tween(this.tailState, this.tweenGroup)
      .to({ phase: Math.PI * 2 }, 2600)
      .easing(TWEEN.Easing.Linear.None)
      .repeat(Infinity)
      .onUpdate(() => {
        this.tailBones.forEach(tailBone => {
          const angle =
            Math.sin(this.tailState.phase - tailBone.phaseOffset) *
            tailBone.amplitude *
            this.tailState.strength;
          this.tailOffset.setFromAxisAngle(TAIL_SWING_AXIS, angle);
          tailBone.bone.quaternion.copy(tailBone.baseQuaternion).multiply(this.tailOffset);
        });
      })
      .start();

    new TWEEN.Tween(this.tailState, this.tweenGroup)
      .to({ strength: 1 }, 700)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .start();
  }

  setupJawAnimation(model) {
    this.jawBone = model.getObjectByName(JAW_BONE_NAME);

    if (!this.jawBone) {
      console.warn(`Osso della bocca non trovato: ${JAW_BONE_NAME}`);
      return;
    }

    this.jawBaseQuaternion.copy(this.jawBone.quaternion);
  }

  setupHeadNeckAnimation(model) {
    this.headNeckBones = HEAD_NECK_BONES.map(config => {
      const bone = model.getObjectByName(config.name);

      if (!bone) {
        console.warn(`Osso del collo o della testa non trovato: ${config.name}`);
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
      console.warn(`Impossibile collegare ${HEAD_IK_BONE_NAME} al cranio`);
      return;
    }

    // Il GLB esporta questo joint come ramo separato, nonostante deformi una
    // vertebra alla base del cranio. Manteniamo la posa e ripariamo la gerarchia.
    model.updateMatrixWorld(true);
    headBone.attach(headIkBone);
  }

  setupBodyAnimation(model) {
    this.bodyBone = model.getObjectByName(BODY_BONE_NAME);

    if (!this.bodyBone) {
      console.warn(`Controllo del corpo non trovato: ${BODY_BONE_NAME}`);
      return;
    }

    this.bodyBaseQuaternion.copy(this.bodyBone.quaternion);
  }

  setupLegCompensation(model) {
    model.updateWorldMatrix(true, true);

    this.legChains = LEG_CHAINS.map(config => {
      const upperBone = model.getObjectByName(config.upper);
      const lowerBone = model.getObjectByName(config.lower);
      const footTargetBone = model.getObjectByName(config.footTarget);

      if (!upperBone || !lowerBone || !footTargetBone) {
        console.warn(`Catena della zampa incompleta: ${config.upper}`);
        return null;
      }

      const hipPosition = upperBone.getWorldPosition(new THREE.Vector3());
      const kneePosition = lowerBone.getWorldPosition(new THREE.Vector3());
      const targetPosition = footTargetBone.getWorldPosition(new THREE.Vector3());

      return {
        upperBone,
        lowerBone,
        footTargetBone,
        upperBaseQuaternion: upperBone.quaternion.clone(),
        lowerBaseQuaternion: lowerBone.quaternion.clone(),
        upperLength: hipPosition.distanceTo(kneePosition),
        lowerLength: kneePosition.distanceTo(targetPosition),
        anklePoint: lowerBone.worldToLocal(targetPosition.clone())
      };
    }).filter(Boolean);
  }

  setupArmAnimation(model) {
    this.armBones = ARM_BONES.map(config => {
      const bone = model.getObjectByName(config.name);

      if (!bone) {
        console.warn(`Osso del braccio non trovato: ${config.name}`);
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
      console.warn(`Controllo della zampa sinistra non trovato: ${LEFT_STEP_ROOT_NAME}`);
      return;
    }

    this.leftStepBasePosition.copy(this.leftStepRoot.position);
  }

  applyLeftStep(elapsed) {
    if (!this.leftStepRoot) {
      return;
    }

    const firstStepEnd = JAW_MOVEMENT_DURATION;
    const secondStepEnd = firstStepEnd + LEFT_STEP_SECOND_DURATION;
    const returnStart = JAW_MOVEMENT_DURATION + JAW_OPEN_PAUSE;
    let lift;
    let forward;
    let side;

    if (elapsed < firstStepEnd) {
      const progress = cosineEase(elapsed / firstStepEnd);
      lift = LEFT_STEP_LIFT * progress;
      forward = LEFT_STEP_FORWARD * progress;
      side = LEFT_STEP_SIDE * progress;
    } else if (elapsed < secondStepEnd) {
      const progress = cosineEase(
        (elapsed - firstStepEnd) / LEFT_STEP_SECOND_DURATION
      );
      lift = THREE.MathUtils.lerp(LEFT_STEP_LIFT, LEFT_STEP_LIFT2, progress);
      forward = THREE.MathUtils.lerp(LEFT_STEP_FORWARD, LEFT_STEP_FORWARD2, progress);
      side = THREE.MathUtils.lerp(LEFT_STEP_SIDE, LEFT_STEP_SIDE2, progress);
    } else if (elapsed < returnStart) {
      lift = LEFT_STEP_LIFT2;
      forward = LEFT_STEP_FORWARD2;
      side = LEFT_STEP_SIDE2;
    } else {
      const progress = cosineEase(
        (elapsed - returnStart) / JAW_MOVEMENT_DURATION
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

  rotateBoneToward(bone, currentDirection, targetDirection) {
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
    if (!this.model || this.legChains.length === 0) {
      return;
    }

    this.legChains.forEach(chain => {
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
      const minimumReach = Math.abs(chain.upperLength - chain.lowerLength) + 0.0001;
      const maximumReach = chain.upperLength + chain.lowerLength - 0.0001;
      const distance = THREE.MathUtils.clamp(
        hipToTarget.length(),
        minimumReach,
        maximumReach
      );
      const along =
        (chain.upperLength ** 2 + distance ** 2 - chain.lowerLength ** 2) /
        (2 * distance);
      const height = Math.sqrt(Math.max(0, chain.upperLength ** 2 - along ** 2));
      const currentHipToKnee = currentKnee.clone().sub(hip);
      const bendDirection = currentHipToKnee
        .clone()
        .addScaledVector(targetDirection, -currentHipToKnee.dot(targetDirection))
        .normalize();
      const desiredKnee = hip
        .clone()
        .addScaledVector(targetDirection, along)
        .addScaledVector(bendDirection, height);

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
      .repeat(Infinity)
      .repeatDelay(JAW_CLOSED_PAUSE)
      .onUpdate(() => {
        const elapsed = this.jawState.progress * JAW_CYCLE_DURATION;
        let openness = 1;

        if (elapsed < JAW_MOVEMENT_DURATION) {
          const progress = elapsed / JAW_MOVEMENT_DURATION;
          openness = (1 - Math.cos(Math.PI * progress)) * 0.5;
        } else if (elapsed > JAW_MOVEMENT_DURATION + JAW_OPEN_PAUSE) {
          const progress = (elapsed - JAW_MOVEMENT_DURATION - JAW_OPEN_PAUSE) / JAW_MOVEMENT_DURATION;
          openness = (1 + Math.cos(Math.PI * progress)) * 0.5;
        }

        this.jawOffset.setFromAxisAngle(JAW_OPEN_AXIS, JAW_OPEN_ANGLE * openness);
        this.jawBone.quaternion.copy(this.jawBaseQuaternion).multiply(this.jawOffset);

        this.headNeckBones.forEach(headNeckBone => {
          this.headNeckOffset.setFromAxisAngle(
            HEAD_NECK_ROTATION_AXIS,
            headNeckBone.angle * openness
          );
          headNeckBone.bone.quaternion
            .copy(headNeckBone.baseQuaternion)
            .multiply(this.headNeckOffset);

          if (headNeckBone.bone.name === HEAD_BONE_NAME) {
            this.headTiltOffset.setFromAxisAngle(
              HEAD_TILT_AXIS,
              HEAD_TILT_ANGLE * openness
            );
            headNeckBone.bone.quaternion.multiply(this.headTiltOffset);
          }
        });

        if (this.bodyBone) {
          this.bodyOffset.setFromAxisAngle(
            BODY_ROTATION_AXIS,
            BODY_DOWN_ANGLE * openness
          );
          this.bodyBone.quaternion
            .copy(this.bodyBaseQuaternion)
            .multiply(this.bodyOffset);
        }

        this.armBones.forEach(armBone => {
          this.armOffset.setFromAxisAngle(
            armBone.axis,
            armBone.angle * openness
          );
          armBone.bone.quaternion
            .copy(armBone.baseQuaternion)
            .multiply(this.armOffset);
        });

        this.applyLeftStep(elapsed);
        this.solveLegCompensation();
      })
      .start();
  }

  awaken() {
    this.startTailAnimation();
    this.startJawAnimation();
  }

  update(_deltaTime, elapsedTime) {
    this.tweenGroup.update(elapsedTime * 1000);
  }
}
