"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const MODEL_PATH = "/models/house.glb";
const WALK_MIN = new THREE.Vector3(-4.4, 1.42, -1.75);
const WALK_MAX = new THREE.Vector3(4.4, 1.42, 1.9);
const EYE_HEIGHT = 1.42;
const START_CAMERA_POSITION = new THREE.Vector3(0, 1.65, 5.2);
const START_CAMERA_TARGET = new THREE.Vector3(0, 1.05, 0.45);
const DINING_CAMERA_POSITION = new THREE.Vector3(1.65, EYE_HEIGHT, 1.72);
const DINING_CAMERA_TARGET = new THREE.Vector3(-0.52, 0.8, 2.48);
const START_CHECKPOINT_INDEX = 0;
const DINING_CHECKPOINT_INDEX = 1;
const KITCHEN_CHECKPOINT_INDEX = 2;
const FRIDGE_CHECKPOINT_INDEX = 3;
const FULL_KITCHEN_CHECKPOINT_INDEX = 4;
const FRIDGE_SIDE_WALL_CHECKPOINT_INDEX = 5;
const TV_CHECKPOINT_INDEX = 6;
const BATHROOM_CHECKPOINT_INDEX = 7;
const TOILET_CHECKPOINT_INDEX = 8;
const DOOR_CHECKPOINT_INDEX = 9;
const SHOWER_CHECKPOINT_INDEX = 10;
const CAMERA_TRANSITION_SECONDS = 1.15;
const DINING_LIGHTS = [
  {
    position: new THREE.Vector3(-1.05, 2.62, 1.38),
    target: new THREE.Vector3(-0.72, 0.78, 2.42)
  },
  {
    position: new THREE.Vector3(0.82, 2.62, 1.38),
    target: new THREE.Vector3(0.02, 0.78, 2.42)
  }
] as const;
const CAMERA_CHECKPOINTS = [
  {
    position: START_CAMERA_POSITION,
    target: START_CAMERA_TARGET
  },
  {
    position: DINING_CAMERA_POSITION,
    target: DINING_CAMERA_TARGET
  },
  {
    position: new THREE.Vector3(1.02, 1.34, -2.16),
    target: new THREE.Vector3(1.34, 0.78, -2.98)
  },
  {
    position: new THREE.Vector3(0.58, 1.24, -2.28),
    target: new THREE.Vector3(0.84, 1.05, -3.46)
  },
  {
    position: new THREE.Vector3(1.22, 1.5, -1.25),
    target: new THREE.Vector3(1.02, 0.92, -3.08)
  },
  {
    position: new THREE.Vector3(1.35, 1.42, -1.42),
    target: new THREE.Vector3(-1.15, 1.05, -2.35)
  },
  {
    position: new THREE.Vector3(-1.48, 1.22, -0.22),
    target: new THREE.Vector3(-1.48, 1.0, 1.45)
  },
  {
    position: new THREE.Vector3(-2.82, 1.3, 0.06),
    target: new THREE.Vector3(-1.72, 1.06, -0.72)
  },
  {
    position: new THREE.Vector3(-2.44, 1.06, -0.08),
    target: new THREE.Vector3(-2.9, 0.42, -0.56)
  },
  {
    position: new THREE.Vector3(-2.58, 1.17, -0.12),
    target: new THREE.Vector3(-3.05, 1.02, 0.08),
    fov: 76
  },
  {
    position: new THREE.Vector3(-2.34, 1.24, -0.28),
    target: new THREE.Vector3(-1.42, 1.08, -0.96),
    fov: 62
  }
];

function Model({ focusMode }: { focusMode: boolean }) {
  const gltf = useLoader(GLTFLoader, MODEL_PATH, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });

  const layout = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const scale = 8.8 / Math.max(size.x, size.z);

    return {
      modelPosition: [-center.x * scale, -box.min.y * scale, -center.z * scale] as [number, number, number],
      scale,
      basePosition: [0, -0.08, 0] as [number, number, number],
      slabSize: [Math.max(size.x * scale * 1.04, 1), 0.14, Math.max(size.z * scale * 1.04, 1)] as [
        number,
        number,
        number
      ],
      topSize: [Math.max(size.x * scale * 0.98, 1), 0.04, Math.max(size.z * scale * 0.98, 1)] as [
        number,
        number,
        number
      ]
    };
  }, [gltf]);

  useEffect(() => {
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!material?.name || !/(light|lamp|bulb|sconce|glow)/i.test(material.name)) return;
        if (!("emissive" in material)) return;

        material.emissive = new THREE.Color("#ffd48a");
        material.emissiveIntensity = focusMode ? 1.1 : 5.2;
        material.needsUpdate = true;
      });
    });
  }, [focusMode, gltf]);

  return (
    <group>
      <HouseBase position={layout.basePosition} slabSize={layout.slabSize} topSize={layout.topSize} />
      <group position={layout.modelPosition} scale={layout.scale}>
        <primitive object={gltf.scene} />
        <HouseGlow intensityScale={focusMode ? 0.16 : 1} />
      </group>
    </group>
  );
}

function HouseBase({
  position,
  slabSize,
  topSize
}: {
  position: [number, number, number];
  slabSize: [number, number, number];
  topSize: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh receiveShadow>
        <boxGeometry args={slabSize} />
        <meshStandardMaterial color="#d9cec0" roughness={0.58} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.075, 0]} receiveShadow>
        <boxGeometry args={topSize} />
        <meshStandardMaterial color="#eee5d8" roughness={0.42} metalness={0.04} />
      </mesh>
    </group>
  );
}

function HouseGlow({ intensityScale }: { intensityScale: number }) {
  const lights: Array<[number, number, number, number]> = [
    [-15.8, 2.25, 1.4, 6.4],
    [-12.7, 2.35, 2.7, 7.2],
    [-9.4, 2.2, 5.4, 6.2],
    [-13.7, 2.1, 7.1, 5.8],
    [-8.4, 1.8, 0.3, 4.6],
    [-16.8, 1.7, 5.6, 4.2],
    [-10.4, 1.75, 1.1, 4.4]
  ];

  return (
    <group>
      {lights.map(([x, y, z, intensity]) => (
        <group key={`${x}-${z}`} position={[x, y, z]}>
          <pointLight color="#ffd79a" distance={8.5} intensity={intensity * intensityScale} decay={1.25} />
        </group>
      ))}
    </group>
  );
}

function DownwardDiningLight({ position, targetPosition }: { position: THREE.Vector3; targetPosition: THREE.Vector3 }) {
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.copy(targetPosition);
    return object;
  }, [targetPosition]);

  const beam = useMemo(() => {
    const direction = targetPosition.clone().sub(position);
    const length = Math.min(direction.length(), 1.12);
    const normalizedDirection = direction.normalize();
    const center = position.clone().add(normalizedDirection.clone().multiplyScalar(length * 0.5));
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      normalizedDirection
    );

    return { center, length, quaternion };
  }, [position, targetPosition]);

  return (
    <group>
      <primitive object={target} />
      <mesh position={position} renderOrder={10}>
        <sphereGeometry args={[0.12, 24, 16]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#f0a332"
          depthWrite={false}
          opacity={0.42}
          transparent
        />
      </mesh>
      <mesh position={beam.center} quaternion={beam.quaternion} renderOrder={8}>
        <cylinderGeometry args={[0.22, 0.04, beam.length, 32, 1, true]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#f0a332"
          depthWrite={false}
          opacity={0.08}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <mesh position={[targetPosition.x, targetPosition.y + 0.03, targetPosition.z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={9}>
        <circleGeometry args={[0.36, 40]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#f4aa36"
          depthWrite={false}
          opacity={0.12}
          transparent
        />
      </mesh>
      <spotLight
        angle={0.28}
        color="#e49b28"
        decay={1.15}
        distance={5.8}
        intensity={12.5}
        penumbra={0.6}
        position={position}
        target={target}
      />
    </group>
  );
}

function DiningTableVLight() {
  return (
    <group>
      {DINING_LIGHTS.map((light, index) => (
        <DownwardDiningLight key={index} position={light.position} targetPosition={light.target} />
      ))}
    </group>
  );
}

function WarmFloorFocusLight({ active }: { active: boolean }) {
  const position = useMemo(() => new THREE.Vector3(-2.32, 2.25, -0.3), []);
  const targetPosition = useMemo(() => new THREE.Vector3(-1.82, 0.04, -0.72), []);
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.copy(targetPosition);
    return object;
  }, [targetPosition]);

  if (!active) return null;

  return (
    <group>
      <primitive object={target} />
      <spotLight
        angle={0.55}
        color="#f0a03a"
        decay={1.25}
        distance={4.2}
        intensity={9.5}
        penumbra={0.85}
        position={position}
        target={target}
      />
      <pointLight color="#ffbf69" distance={2.4} intensity={1.45} position={[-1.85, 0.28, -0.72]} />
      <mesh position={[-1.82, 0.035, -0.72]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={9}>
        <circleGeometry args={[0.72, 48]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#f29a2e"
          depthWrite={false}
          opacity={0.18}
          transparent
        />
      </mesh>
    </group>
  );
}

function FirstPersonWalkthrough({ onCheckpointChange }: { onCheckpointChange: (checkpointIndex: number) => void }) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isDragging = useRef(false);
  const checkpointIndex = useRef(START_CHECKPOINT_INDEX);
  const lookTarget = useRef(START_CAMERA_TARGET.clone());
  const wheelReady = useRef(true);
  const nextWheelAllowedAt = useRef(0);
  const transition = useRef({
    active: false,
    elapsed: 0,
    fromPosition: START_CAMERA_POSITION.clone(),
    fromTarget: START_CAMERA_TARGET.clone(),
    fromFov: 58,
    toPosition: START_CAMERA_POSITION.clone(),
    toTarget: START_CAMERA_TARGET.clone(),
    toFov: 58
  });

  useEffect(() => {
    checkpointIndex.current = START_CHECKPOINT_INDEX;
    onCheckpointChange(START_CHECKPOINT_INDEX);
    camera.position.copy(START_CAMERA_POSITION);
    camera.lookAt(START_CAMERA_TARGET);
    camera.rotation.order = "YXZ";
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = CAMERA_CHECKPOINTS[START_CHECKPOINT_INDEX].fov ?? 58;
      camera.updateProjectionMatrix();
    }
    lookTarget.current.copy(START_CAMERA_TARGET);
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;

    const canvas = gl.domElement;

    const startCheckpointTransition = (nextIndex: number) => {
      const nextCheckpoint = CAMERA_CHECKPOINTS[nextIndex];

      checkpointIndex.current = nextIndex;
      isDragging.current = false;
      keys.current = {};

      transition.current.active = true;
      transition.current.elapsed = 0;
      transition.current.fromPosition.copy(camera.position);
      transition.current.fromTarget.copy(lookTarget.current);
      transition.current.fromFov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 58;
      transition.current.toPosition.copy(nextCheckpoint.position);
      transition.current.toTarget.copy(nextCheckpoint.target);
      transition.current.toFov = nextCheckpoint.fov ?? 58;
    };

    const updateLook = (movementX: number, movementY: number) => {
      yaw.current -= movementX * 0.0022;
      pitch.current -= movementY * 0.0022;
      pitch.current = THREE.MathUtils.clamp(pitch.current, -0.72, 0.72);
      camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      lookTarget.current.copy(camera.position).add(forward);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };

    const handlePointerDown = () => {
      isDragging.current = true;
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === canvas || isDragging.current) {
        updateLook(event.movementX, event.movementY);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const now = performance.now();

      if (now < nextWheelAllowedAt.current || !wheelReady.current || transition.current.active) return;
      if (Math.abs(event.deltaY) < 12) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = THREE.MathUtils.clamp(
        checkpointIndex.current + direction,
        0,
        CAMERA_CHECKPOINTS.length - 1
      );

      if (nextIndex === checkpointIndex.current) return;

      nextWheelAllowedAt.current = now + 900;
      wheelReady.current = false;
      startCheckpointTransition(nextIndex);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handlePointerDown);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handlePointerDown);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    if (transition.current.active) {
      transition.current.elapsed += delta;

      const progress = THREE.MathUtils.clamp(transition.current.elapsed / CAMERA_TRANSITION_SECONDS, 0, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(
        transition.current.fromPosition,
        transition.current.toPosition,
        easedProgress
      );
      lookTarget.current.lerpVectors(transition.current.fromTarget, transition.current.toTarget, easedProgress);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(transition.current.fromFov, transition.current.toFov, easedProgress);
        camera.updateProjectionMatrix();
      }
      camera.lookAt(lookTarget.current);
      camera.rotation.order = "YXZ";
      yaw.current = camera.rotation.y;
      pitch.current = camera.rotation.x;

      if (progress >= 1) {
        transition.current.active = false;
        wheelReady.current = true;
        onCheckpointChange(checkpointIndex.current);
      }

      return;
    }

    const move = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current) * -1);
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, Math.sin(yaw.current));

    if (keys.current.KeyW || keys.current.ArrowUp) move.add(forward);
    if (keys.current.KeyS || keys.current.ArrowDown) move.sub(forward);
    if (keys.current.KeyD || keys.current.ArrowRight) move.add(right);
    if (keys.current.KeyA || keys.current.ArrowLeft) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(delta * 1.55);
      camera.position.add(move);
      camera.position.clamp(WALK_MIN, WALK_MAX);
      camera.position.y = EYE_HEIGHT;
      lookTarget.current.copy(camera.position).add(forward);
    }
  });

  return null;
}

export function MinimalModelViewer() {
  const [activeCheckpoint, setActiveCheckpoint] = useState(START_CHECKPOINT_INDEX);
  const focusMode =
    activeCheckpoint === DINING_CHECKPOINT_INDEX ||
    activeCheckpoint === KITCHEN_CHECKPOINT_INDEX ||
    activeCheckpoint === FRIDGE_CHECKPOINT_INDEX ||
    activeCheckpoint === FULL_KITCHEN_CHECKPOINT_INDEX ||
    activeCheckpoint === FRIDGE_SIDE_WALL_CHECKPOINT_INDEX ||
    activeCheckpoint === TV_CHECKPOINT_INDEX ||
    activeCheckpoint === BATHROOM_CHECKPOINT_INDEX ||
    activeCheckpoint === TOILET_CHECKPOINT_INDEX ||
    activeCheckpoint === DOOR_CHECKPOINT_INDEX ||
    activeCheckpoint === SHOWER_CHECKPOINT_INDEX;

  return (
    <main className="clean-house-shell">
      <div className="clean-house-stage">
        <Canvas
          camera={{ position: START_CAMERA_POSITION.toArray(), fov: 58, near: 0.03, far: 1000 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={focusMode ? 0.46 : 1.25} />
          <directionalLight intensity={focusMode ? 0.5 : 2.8} position={[5, 8, 6]} />
          <pointLight color="#ffd49a" distance={18} intensity={focusMode ? 0.3 : 2.4} position={[0, 4, 4]} />
          <DiningTableVLight />
          <WarmFloorFocusLight active={activeCheckpoint === SHOWER_CHECKPOINT_INDEX} />
          <Suspense fallback={null}>
            <Model focusMode={focusMode} />
          </Suspense>
          <FirstPersonWalkthrough onCheckpointChange={setActiveCheckpoint} />
        </Canvas>
      </div>
    </main>
  );
}
