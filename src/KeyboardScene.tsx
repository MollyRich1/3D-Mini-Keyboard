import { useEffect, useMemo, useRef } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  createKeyGeometry,
  createLegend,
  createCaseGeometry,
} from "./geometry";
import { layout, type KeyDefinition } from "./layout";

type SceneProps = {
  pressed: Set<string>;
  press: (source: string, id: string) => void;
  release: (source: string) => void;
  reset: number;
};
function Keycap({
  definition,
  down,
  press,
  release,
}: {
  definition: KeyDefinition;
  down: boolean;
  press: SceneProps["press"];
  release: SceneProps["release"];
}) {
  const group = useRef<THREE.Group>(null!);
  const velocity = useRef(0);
  const hover = useRef(false);
  const geometry = useMemo(() => createKeyGeometry(definition), [definition]);
  const texture = useMemo(() => createLegend(definition), [definition]);
  const material = useRef<THREE.MeshStandardMaterial>(null!);
  useEffect(
    () => () => {
      geometry.dispose();
      texture.dispose();
    },
    [geometry, texture],
  );
  useFrame((_, delta) => {
    // Semi-implicit spring, substepped for stable motion even after a slow frame.
    const dt = Math.min(delta, 0.05) / 5,
      target = down ? -0.22 : 0;
    for (let i = 0; i < 5; i++) {
      velocity.current +=
        ((target - group.current.position.y) * (down ? 1050 : 650) -
          velocity.current * (down ? 48 : 25)) *
        dt;
      group.current.position.y += velocity.current * dt;
    }
    material.current.emissiveIntensity = THREE.MathUtils.damp(
      material.current.emissiveIntensity,
      hover.current ? 0.055 : 0,
      12,
      delta,
    );
  });
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    // R3F's raycast handler runs before OrbitControls receives this native event.
    e.nativeEvent.stopImmediatePropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    press(`pointer:${e.pointerId}`, definition.id);
  };
  return (
    <group position={[definition.x - 3.05, 0.45, definition.z]}>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.27, 0.24, 0.27]} />
        <meshStandardMaterial color="#705f4a" />
      </mesh>
      <group ref={group}>
        <mesh
          geometry={geometry}
          castShadow
          receiveShadow
          onPointerDown={onDown}
          onPointerUp={(e) => {
            e.stopPropagation();
            release(`pointer:${e.pointerId}`);
            (e.target as Element).releasePointerCapture(e.pointerId);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            hover.current = true;
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            hover.current = false;
            document.body.style.cursor = "";
          }}
        >
          <meshStandardMaterial
            attach="material-0"
            color={definition.color}
            roughness={0.38}
          />
          <meshStandardMaterial
            ref={material}
            attach="material-1"
            map={texture}
            roughness={0.48}
            emissive="#fff7df"
            emissiveIntensity={0}
          />
        </mesh>
      </group>
    </group>
  );
}
function CaseSlab({
  width,
  depth,
  height,
  radius,
  y,
  color,
}: {
  width: number;
  depth: number;
  height: number;
  radius: number;
  y: number;
  color: string;
}) {
  const geometry = useMemo(
    () => createCaseGeometry(width, depth, height, radius),
    [width, depth, height, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, y, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.45} />
    </mesh>
  );
}
function KeyboardCase() {
  return (
    <group>
      <CaseSlab
        width={6.65}
        depth={3.85}
        height={0.24}
        radius={0.27}
        y={0.02}
        color="#d4d3bd"
      />
      <CaseSlab
        width={6.64}
        depth={3.84}
        height={0.035}
        radius={0.27}
        y={0.146}
        color="#92957d"
      />
      <CaseSlab
        width={6.7}
        depth={3.9}
        height={0.26}
        radius={0.28}
        y={0.28}
        color="#e6e3cd"
      />
      <CaseSlab
        width={6.35}
        depth={3.56}
        height={0.07}
        radius={0.2}
        y={0.428}
        color="#292e28"
      />
      <mesh position={[2.82, 0.03, 1.944]}>
        <boxGeometry args={[0.23, 0.035, 0.008]} />
        <meshStandardMaterial color="#9eaa92" />
      </mesh>
      {[-2.6, 2.6].map((x) =>
        [-1.35, 1.35].map((z) => (
          <RoundedBox
            key={`${x}:${z}`}
            args={[0.6, 0.12, 0.4]}
            radius={0.06}
            position={[x, -0.12, z]}
          >
            <meshStandardMaterial color="#5c6457" roughness={0.95} />
          </RoundedBox>
        )),
      )}
    </group>
  );
}
function Camera({ reset }: { reset: number }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const resetting = useRef(false);
  const home = useMemo(() => new THREE.Vector3(7.2, 9.4, 11), []);
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = size.width < 650 ? 37 : 32;
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);
  useEffect(() => {
    if (reset) resetting.current = true;
  }, [reset]);
  useFrame((_, dt) => {
    if (!resetting.current || !controls.current) return;
    camera.position.lerp(home, 1 - Math.exp(-dt * 7));
    controls.current.target.lerp(
      new THREE.Vector3(0, 0.25, 0),
      1 - Math.exp(-dt * 7),
    );
    if (camera.position.distanceTo(home) < 0.015) {
      camera.position.copy(home);
      resetting.current = false;
    }
    controls.current.update();
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 0.25, 0]}
      enablePan={false}
      minDistance={9}
      maxDistance={24}
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI / 2.2}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.65}
      zoomSpeed={0.65}
      onStart={() => {
        resetting.current = false;
      }}
    />
  );
}
export function KeyboardScene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [7.2, 9.4, 11], fov: 32, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.95,
      }}
    >
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#fff8e8", "#969d87", 1.15]} />
      <directionalLight
        position={[-3, 9, 4]}
        intensity={2.4}
        color="#fff5dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-normalBias={0.025}
        shadow-bias={-0.0001}
        shadow-radius={4}
      />
      <directionalLight
        position={[4, 5, -6]}
        intensity={1.35}
        color="#f5f8ed"
      />
      <KeyboardCase />
      {layout.map((key) => (
        <Keycap
          key={key.id}
          definition={key}
          down={props.pressed.has(key.id)}
          press={props.press}
          release={props.release}
        />
      ))}
      <ContactShadows
        position={[0, -0.185, 0]}
        opacity={0.45}
        scale={17}
        blur={2.8}
        far={5}
        resolution={512}
        color="#585e45"
        frames={1}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.19, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.14} />
      </mesh>
      <Camera reset={props.reset} />
    </Canvas>
  );
}
