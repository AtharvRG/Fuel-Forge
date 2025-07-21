import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Atom = (props) => (
  <Sphere {...props}>
    <meshStandardMaterial color={props.color} roughness={0.1} metalness={0.1} />
  </Sphere>
);

const Bond = ({ start, end }) => {
  const vec = useMemo(() => new THREE.Vector3().subVectors(end, start), [start, end]);
  const half = useMemo(() => vec.clone().multiplyScalar(0.5).add(start), [vec, start]);
  const len = useMemo(() => vec.length(), [vec]);

  return (
    <mesh position={half} lookAt={end}>
      <cylinderGeometry args={[0.04, 0.04, len, 8]} />
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
};

export function Molecule(props) {
  const group = useRef();

  // Create a hexagonal ring with branches 
  const atoms = useMemo(() => {
    const points = [];
    const radius = 1.2; // The radius of the main ring
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      // Main ring atoms
      points.push({ 
        pos: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0), 
        color: '#0a9396' // Primary color for the ring
      });
      // Branch atoms
      points.push({
        pos: new THREE.Vector3(Math.cos(angle) * (radius + 0.8), Math.sin(angle) * (radius + 0.8), (i % 2 === 0 ? 0.4 : -0.4)),
        color: '#94d2bd' // Secondary color for branches
      });
    }
    return points;
  }, []);

  const bonds = useMemo(() => {
    const bondList = [];
    // Bonds within the ring
    for (let i = 0; i < 6; i++) {
      bondList.push([atoms[i * 2].pos, atoms[((i + 1) % 6) * 2].pos]);
    }
    // Bonds for the branches
    for (let i = 0; i < 6; i++) {
      bondList.push([atoms[i * 2].pos, atoms[i * 2 + 1].pos]);
    }
    return bondList;
  }, [atoms]);

  useFrame((state, delta) => {
    group.current.rotation.y += delta * 0.2;
    group.current.rotation.x += delta * 0.1;
    group.current.rotation.z += delta * 0.05;
  });

  return (
    <group ref={group} {...props}>
      {atoms.map((atom, i) => (
        <Atom key={i} position={atom.pos} args={[0.22]} color={atom.color} />
      ))}
      {bonds.map(([start, end], i) => (
        <Bond key={i} start={start} end={end} />
      ))}
    </group>
  );
}