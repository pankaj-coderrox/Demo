"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, ThreeEvent, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  AdaptiveDpr,
  ContactShadows,
  Environment,
  Float,
  OrbitControls,
  PerformanceMonitor,
  Preload,
  SoftShadows,
  Text
} from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

declare global {
  interface HTMLElement {
    vanillaTilt?: {
      destroy(): void;
    };
  }
}

type ViewKey = "arrival" | "lounge" | "gallery" | "terrace";

type ViewStation = {
  key: ViewKey;
  label: string;
  detail: string;
  tone: string;
  position: [number, number, number];
  target: [number, number, number];
  focal: number;
};

type LoadedModelProps = {
  url: string | null;
  visible: boolean;
};

const viewStations: ViewStation[] = [
  {
    key: "arrival",
    label: "Arrival",
    detail: "Framed entry",
    tone: "#d6b36a",
    position: [5.45, 2.75, 6.55],
    target: [0.35, 1.25, -1.18],
    focal: 38
  },
  {
    key: "lounge",
    label: "Lounge",
    detail: "Low marble hearth",
    tone: "#7f9078",
    position: [-4.2, 2.18, 3.55],
    target: [-1.25, 1.12, -1.5],
    focal: 34
  },
  {
    key: "gallery",
    label: "Gallery",
    detail: "Bronze art wall",
    tone: "#7a2c36",
    position: [3.25, 2.04, -4.75],
    target: [1.35, 1.18, -2.12],
    focal: 32
  },
  {
    key: "terrace",
    label: "Terrace",
    detail: "Evening glass line",
    tone: "#c0c7b9",
    position: [0.15, 2.42, -6.75],
    target: [-0.05, 1.24, -2.48],
    focal: 36
  }
];

const photoRooms = [
  {
    name: "Stone Salon",
    mood: "travertine, firelight, brushed brass",
    color: "#d6b36a",
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=88"
  },
  {
    name: "Garden Library",
    mood: "sage millwork, filtered daylight",
    color: "#7f9078",
    src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2400&q=88"
  },
  {
    name: "Night Gallery",
    mood: "wine lacquer, art-grade wall wash",
    color: "#7a2c36",
    src: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=2400&q=88"
  }
];

export function ArchitecturalExperience() {
  const [activeView, setActiveView] = useState<ViewKey>("arrival");
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [showImportedModel, setShowImportedModel] = useState(true);
  const [quality, setQuality] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState("bronze");
  const floorPlanRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let disposed = false;

    import("vanilla-tilt").then(({ default: VanillaTilt }) => {
      if (disposed) return;
      const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt-card]"));
      VanillaTilt.init(targets, {
        max: 7,
        speed: 520,
        glare: true,
        "max-glare": 0.18,
        perspective: 1300,
        scale: 1.015,
        gyroscope: false
      });
    });

    return () => {
      disposed = true;
      document.querySelectorAll<HTMLElement>("[data-tilt-card]").forEach((target) => {
        target.vanillaTilt?.destroy();
      });
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            const source = image.dataset.src;
            if (source) {
              image.src = source;
              image.removeAttribute("data-src");
            }
            observer.unobserve(image);
          }
        });
      },
      { rootMargin: "650px 0px" }
    );

    document.querySelectorAll<HTMLImageElement>("img[data-src]").forEach((image) => observer.observe(image));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = floorPlanRef.current;
    if (!svg) return;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        gsap.to(paths, {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: "power3.out",
          stagger: 0.08
        });
      },
      { threshold: 0.38 }
    );

    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  function handleModelUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (modelUrl) URL.revokeObjectURL(modelUrl);
    setModelUrl(URL.createObjectURL(file));
    setShowImportedModel(true);
  }

  return (
    <main className="experience">
      <section className="scene-section" aria-label="Interactive residence">
        <Canvas
          className="scene-canvas"
          dpr={[1, Math.min(1.75, quality)]}
          shadows="soft"
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false
          }}
          camera={{ position: [5.45, 2.75, 6.55], fov: 38, near: 0.1, far: 80 }}
        >
          <color attach="background" args={["#070807"]} />
          <fog attach="fog" args={["#070807", 16, 38]} />
          <SoftShadows size={18} samples={10} focus={0.72} />
          <PerformanceMonitor
            onDecline={() => setQuality(1)}
            onIncline={() => setQuality(1.55)}
          />
          <Suspense fallback={null}>
            <CinematicRig activeView={activeView} />
            <LightingRig />
            <InteriorScene
              selectedMaterial={selectedMaterial}
              setSelectedMaterial={setSelectedMaterial}
            />
            <LoadedModel url={modelUrl} visible={showImportedModel} />
            <Environment preset="city" resolution={128} />
            <Preload all />
          </Suspense>
          <AdaptiveDpr pixelated />
        </Canvas>

        <div className="interface">
          <header className="topbar">
            <div className="brand">
              <span className="brand-mark">AM</span>
              <span className="brand-copy">
                <strong>Atelier Marquee</strong>
                <span>Private residence preview</span>
              </span>
            </div>
            <button className="sound-toggle" type="button" onClick={() => setShowImportedModel((value) => !value)}>
              <span className="status-dot" />
              <span>{showImportedModel ? "GLB layer on" : "GLB layer off"}</span>
            </button>
          </header>

          <section className="tour-panel glass" aria-label="Residence introduction">
            <p className="eyebrow">Cinematic 3D interior</p>
            <h1>Villa Nocturne</h1>
            <p>
              Move through a restrained luxury interior with cinematic camera stations,
              material hotspots, realistic shadowing, and support for uploaded GLB or GLTF
              architectural models.
            </p>
            <div className="cta-row">
              <button className="primary-button" type="button" onClick={() => setActiveView("lounge")}>
                Begin tour
              </button>
              <button className="secondary-button" type="button" onClick={() => setActiveView("terrace")}>
                Evening view
              </button>
            </div>
          </section>

          <footer className="bottom-panel">
            <nav className="view-strip" aria-label="Camera views">
              {viewStations.map((view) => (
                <button
                  className={`view-button ${activeView === view.key ? "is-active" : ""}`}
                  key={view.key}
                  onClick={() => setActiveView(view.key)}
                  style={{ "--tone": view.tone } as React.CSSProperties}
                  type="button"
                >
                  <span className="view-swatch" />
                  <span className="view-meta">
                    <strong>{view.label}</strong>
                    <span>{view.detail}</span>
                  </span>
                </button>
              ))}
            </nav>
            <div className="metrics">
              <div className="metric">
                <strong>60 FPS</strong>
                <span>DPR adaptive</span>
              </div>
              <div className="metric">
                <strong>{selectedMaterial}</strong>
                <span>active finish</span>
              </div>
            </div>
          </footer>
        </div>

        <label className="model-drop">
          Import a GLB or GLTF massing model; it will appear on the central plinth.
          <input accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={handleModelUpload} type="file" />
        </label>
      </section>

      <section className="gallery-section" aria-label="Photography rooms">
        {photoRooms.map((room, index) => (
          <article className="photo-room" key={room.name}>
            <img
              alt={`${room.name} architectural interior`}
              className="room-photo"
              data-src={room.src}
              height="1600"
              src={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3Crect width='16' height='10' fill='%23070807'/%3E%3C/svg%3E`}
              width="2560"
            />
            <div className="room-copy" data-tilt-card style={{ "--room-tone": room.color } as React.CSSProperties}>
              <span>Room {String(index + 1).padStart(2, "0")}</span>
              <h2>{room.name}</h2>
              <p>{room.mood}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="plan-section" aria-label="Animated floor plan">
        <div className="plan-copy">
          <span>Scroll-drawn plan</span>
          <h2>Every transition anchors to the architecture.</h2>
          <p>
            The camera route follows the residence geometry: entry axis, lounge hearth,
            gallery wall, and terrace reveal. SVG path animation keeps the plan crisp
            without adding more WebGL load.
          </p>
        </div>
        <svg ref={floorPlanRef} className="floor-plan" viewBox="0 0 760 420" role="img" aria-label="Villa floor plan">
          <path d="M80 80H680V340H80Z" />
          <path d="M80 175H310V340" />
          <path d="M310 175H500V340" />
          <path d="M500 175H680" />
          <path d="M160 80V175" />
          <path d="M310 80V175" />
          <path d="M500 80V175" />
          <path d="M112 126H148" />
          <path d="M234 175C234 145 257 126 286 126" />
          <path d="M390 175C390 145 413 126 442 126" />
          <path d="M566 175C566 145 589 126 618 126" />
          <path d="M350 260H462V316H350Z" />
          <path d="M120 238H230V304H120Z" />
          <path d="M545 245H634V310H545Z" />
        </svg>
      </section>
    </main>
  );
}

function CinematicRig({ activeView }: { activeView: ViewKey }) {
  const { camera, pointer } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const targetRef = useRef(new THREE.Vector3(0, 1.15, -0.4));
  const station = useMemo(
    () => viewStations.find((view) => view.key === activeView) ?? viewStations[0],
    [activeView]
  );

  useEffect(() => {
    const target = new THREE.Vector3(...station.target);
    const timeline = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    timeline.to(camera.position, {
      x: station.position[0],
      y: station.position[1],
      z: station.position[2],
      duration: 1.85
    }, 0);

    timeline.to(camera, { fov: station.focal, duration: 1.85, onUpdate: () => camera.updateProjectionMatrix() }, 0);
    timeline.to(targetRef.current, { x: target.x, y: target.y, z: target.z, duration: 1.85 }, 0);

    return () => {
      timeline.kill();
    };
  }, [camera, station]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const breathingTarget = targetRef.current.clone();
    breathingTarget.x += pointer.x * 0.09;
    breathingTarget.y += pointer.y * 0.045;
    controls.target.lerp(breathingTarget, 1 - Math.exp(-delta * 4.5));
    controls.update();
    camera.position.x += Math.sin(state.clock.elapsedTime * 0.24) * 0.0008;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.055}
      enablePan={false}
      enableZoom
      minDistance={4.8}
      maxDistance={13}
      maxPolarAngle={Math.PI * 0.48}
      minPolarAngle={Math.PI * 0.19}
    />
  );
}

function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.24} />
      <directionalLight
        castShadow
        color="#fff4dc"
        intensity={1.2}
        position={[6, 8, 4]}
        shadow-bias={-0.00018}
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        castShadow
        angle={0.34}
        color="#ffd9a1"
        decay={1.9}
        distance={18}
        intensity={2.2}
        penumbra={0.8}
        position={[-3.5, 6.5, 3.8]}
      />
      <rectAreaLight color="#f1c987" height={3.3} intensity={3.4} position={[0, 3.8, -4.86]} rotation={[0, 0, 0]} width={7.2} />
      <rectAreaLight color="#8ba28e" height={2.5} intensity={1.5} position={[-5.86, 2.8, -0.6]} rotation={[0, Math.PI / 2, 0]} width={4.8} />
    </>
  );
}

function InteriorScene({
  selectedMaterial,
  setSelectedMaterial
}: {
  selectedMaterial: string;
  setSelectedMaterial: (material: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const materials = useMemo(() => createMaterials(), []);

  function hotspot(name: string) {
    return {
      onPointerOver: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(name);
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        setHovered(null);
        document.body.style.cursor = "default";
      },
      onClick: (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        setSelectedMaterial(name);
      }
    };
  }

  return (
    <group position={[1.05, -0.52, -0.85]} scale={1.14}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[13.6, 12]} />
        <meshStandardMaterial color="#8d8171" roughness={0.62} metalness={0.04} />
      </mesh>
      <MarbleSlabs />
      <ArchitecturalShell materials={materials} />
      <Furniture materials={materials} hotspot={hotspot} selectedMaterial={selectedMaterial} />
      <ArtWall hovered={hovered} />
      <Float speed={0.65} rotationIntensity={0.08} floatIntensity={0.08}>
        <Text
          color="#d6b36a"
          fontSize={0.16}
          letterSpacing={0.06}
          maxWidth={2.6}
          position={[-4.22, 1.55, -3.8]}
          rotation={[0, Math.PI / 2, 0]}
        >
          MATERIAL HOTSPOTS
        </Text>
      </Float>
      <ContactShadows
        color="#050505"
        far={8}
        frames={1}
        opacity={0.48}
        position={[0, 0.018, 0]}
        resolution={512}
        scale={10}
      />
    </group>
  );
}

function createMaterials() {
  return {
    plaster: new THREE.MeshStandardMaterial({ color: "#c9c1b1", roughness: 0.86, metalness: 0.02 }),
    darkStone: new THREE.MeshStandardMaterial({ color: "#1b1a18", roughness: 0.44, metalness: 0.08 }),
    bronze: new THREE.MeshStandardMaterial({ color: "#b08b55", roughness: 0.28, metalness: 0.72 }),
    sage: new THREE.MeshStandardMaterial({ color: "#6f806d", roughness: 0.62, metalness: 0.08 }),
    wine: new THREE.MeshStandardMaterial({ color: "#5c2029", roughness: 0.38, metalness: 0.18 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#c8d4d0",
      roughness: 0.05,
      metalness: 0,
      transmission: 0.35,
      thickness: 0.4,
      transparent: true,
      opacity: 0.34
    })
  };
}

function MarbleSlabs() {
  return (
    <group position={[0, 0.012, 0]}>
      {Array.from({ length: 9 }).map((_, index) => (
        <mesh key={index} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-5.2 + index * 1.3, 0, 0]}>
          <planeGeometry args={[1.18, 11.4]} />
          <meshStandardMaterial
            color={index % 2 ? "#9a8f80" : "#7f7568"}
            roughness={0.58}
            metalness={0.03}
          />
        </mesh>
      ))}
    </group>
  );
}

function ArchitecturalShell({ materials }: { materials: ReturnType<typeof createMaterials> }) {
  return (
    <group>
      <mesh receiveShadow material={materials.plaster} position={[0, 2.2, -5.45]}>
        <boxGeometry args={[13.6, 4.4, 0.22]} />
      </mesh>
      <mesh receiveShadow material={materials.plaster} position={[-6.72, 2.2, 0]}>
        <boxGeometry args={[0.22, 4.4, 11.2]} />
      </mesh>
      <mesh receiveShadow material={materials.glass} position={[6.72, 2.2, 0]}>
        <boxGeometry args={[0.22, 4.4, 11.2]} />
      </mesh>
      <mesh receiveShadow position={[0, 4.42, 0]}>
        <boxGeometry args={[13.6, 0.18, 11.2]} />
        <meshStandardMaterial color="#171613" roughness={0.72} />
      </mesh>
      <mesh castShadow receiveShadow material={materials.darkStone} position={[0, 2.18, -5.25]}>
        <boxGeometry args={[5.6, 2.7, 0.24]} />
      </mesh>
      <mesh castShadow position={[0, 1.18, -5.08]}>
        <boxGeometry args={[3.2, 1.1, 0.2]} />
        <meshStandardMaterial color="#080807" roughness={0.36} emissive="#211109" emissiveIntensity={0.35} />
      </mesh>
      {[-4.8, -3.2, 3.2, 4.8].map((x) => (
        <mesh castShadow key={x} material={materials.bronze} position={[x, 2.2, -5.18]}>
          <boxGeometry args={[0.1, 3.7, 0.32]} />
        </mesh>
      ))}
      <mesh receiveShadow material={materials.glass} position={[6.18, 1.72, -1.3]}>
        <boxGeometry args={[0.18, 2.9, 6.1]} />
      </mesh>
    </group>
  );
}

function Furniture({
  materials,
  hotspot,
  selectedMaterial
}: {
  materials: ReturnType<typeof createMaterials>;
  hotspot: (name: string) => Record<string, unknown>;
  selectedMaterial: string;
}) {
  const accent = selectedMaterial === "sage" ? materials.sage : selectedMaterial === "wine" ? materials.wine : materials.bronze;

  return (
    <group>
      <mesh castShadow receiveShadow material={materials.sage} position={[-1.6, 0.44, 0.5]} {...hotspot("sage")}>
        <boxGeometry args={[3.4, 0.62, 1.22]} />
      </mesh>
      <mesh castShadow receiveShadow material={materials.sage} position={[-1.6, 1.02, -0.07]}>
        <boxGeometry args={[3.4, 0.92, 0.18]} />
      </mesh>
      <mesh castShadow receiveShadow material={materials.bronze} position={[1.8, 0.32, 0.65]} {...hotspot("bronze")}>
        <cylinderGeometry args={[0.84, 0.98, 0.18, 48]} />
      </mesh>
      <mesh castShadow receiveShadow position={[1.8, 0.48, 0.65]}>
        <cylinderGeometry args={[0.58, 0.7, 0.12, 48]} />
        <meshStandardMaterial color="#24211d" roughness={0.34} metalness={0.08} />
      </mesh>
      <mesh castShadow receiveShadow material={materials.wine} position={[3.5, 0.78, -1.85]} {...hotspot("wine")}>
        <boxGeometry args={[1.34, 1.24, 1.34]} />
      </mesh>
      <mesh castShadow receiveShadow material={accent} position={[-4.9, 1.36, -2.2]}>
        <boxGeometry args={[0.18, 2.1, 2.8]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-4.35, 0.74, -2.2]}>
        <boxGeometry args={[0.92, 1.06, 2.24]} />
        <meshStandardMaterial color="#171613" roughness={0.52} metalness={0.06} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh key={index} castShadow position={[-4.9, 2.6, -3.1 + index * 0.9]}>
          <boxGeometry args={[0.28, 0.34, 0.58]} />
          <meshStandardMaterial color={index === 1 ? "#d6b36a" : "#f4efe5"} roughness={0.42} metalness={0.12} />
        </mesh>
      ))}
    </group>
  );
}

function ArtWall({ hovered }: { hovered: string | null }) {
  return (
    <group position={[2.4, 2.05, -5.02]}>
      {["#d6b36a", "#7f9078", "#7a2c36"].map((color, index) => (
        <mesh
          castShadow
          key={color}
          position={[-1.15 + index * 1.15, 0, 0]}
          scale={hovered ? [1.04, 1.04, 1] : [1, 1, 1]}
        >
          <boxGeometry args={[0.82, 1.34, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.36} metalness={0.18} emissive={color} emissiveIntensity={hovered ? 0.06 : 0.015} />
        </mesh>
      ))}
    </group>
  );
}

function LoadedModel({ url, visible }: LoadedModelProps) {
  if (!url || !visible) return null;
  return <ImportedModel url={url} />;
}

function ImportedModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);

  return (
    <group position={[0.6, 0.62, -1.1]} scale={1.15}>
      <primitive object={gltf.scene} />
    </group>
  );
}
