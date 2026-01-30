import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { DataSet } from '../types/SolarTypes';

interface SolarPanel3DProps {
  dataSets: DataSet[];
  selectedDate: string | null;
}

export const SolarPanel3D: React.FC<SolarPanel3DProps> = ({ dataSets, selectedDate }) => {
  const visibleSets = dataSets.filter(ds => ds.visible);
  
  // Get current angles from latest readings
  const currentReadings = useMemo(() => {
    const initial = visibleSets.find(ds => ds.type === 'initial');
    const optimized = visibleSets.find(ds => ds.type === 'optimized');
    
    const getLatestReading = (ds: DataSet | undefined) => {
      if (!ds || ds.data.length === 0) return null;
      const filtered = selectedDate 
        ? ds.data.filter(r => r.date === selectedDate)
        : ds.data;
      
      // Get reading at noon or closest to it
      const noonReadings = filtered.filter(r => r.hour >= 11 && r.hour <= 13);
      return noonReadings.length > 0 ? noonReadings[0] : filtered[0];
    };

    return {
      initial: getLatestReading(initial),
      optimized: getLatestReading(optimized)
    };
  }, [visibleSets, selectedDate]);

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        3D Panel Visualization
      </h3>
      
      <div className="h-[400px] rounded-lg overflow-hidden bg-slate-900">
        <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={0.3} color="#ffaa00" />
          
          {/* Ground Grid */}
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#1e40af"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#3b82f6"
            fadeDistance={25}
            fadeStrength={1}
            followCamera={false}
          />

          {/* Sun indicator */}
          <mesh position={[5, 8, -3]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>

          {/* Initial Panel (Orange) */}
          {currentReadings.initial && (
            <SolarPanelModel
              position={[-2.5, 0, 0]}
              tiltAngle={currentReadings.initial.tilt_angle}
              azimuthAngle={currentReadings.initial.azimuth_angle}
              power={currentReadings.initial.power_watts}
              color="#f97316"
              label="Before"
            />
          )}

          {/* Optimized Panel (Green) */}
          {currentReadings.optimized && (
            <SolarPanelModel
              position={[2.5, 0, 0]}
              tiltAngle={currentReadings.optimized.tilt_angle}
              azimuthAngle={currentReadings.optimized.azimuth_angle}
              power={currentReadings.optimized.power_watts}
              color="#22c55e"
              label="After"
            />
          )}

          {/* If no data, show default panels */}
          {!currentReadings.initial && !currentReadings.optimized && (
            <>
              <SolarPanelModel
                position={[-2.5, 0, 0]}
                tiltAngle={15}
                azimuthAngle={180}
                power={0}
                color="#64748b"
                label="Initial"
              />
              <SolarPanelModel
                position={[2.5, 0, 0]}
                tiltAngle={25}
                azimuthAngle={180}
                power={0}
                color="#64748b"
                label="Optimized"
              />
            </>
          )}

          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={20}
          />
          
          <Environment preset="sunset" />
        </Canvas>
      </div>

      {/* Legend */}
      <div className="mt-3 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-slate-300">Before Optimization</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-slate-300">After Optimization</span>
        </div>
      </div>

      {/* Angle Display */}
      {(currentReadings.initial || currentReadings.optimized) && (
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          {currentReadings.initial && (
            <div className="p-2 bg-orange-900/20 rounded border border-orange-500/30">
              <div className="text-orange-400 font-medium">Before</div>
              <div className="text-slate-300">Tilt: {currentReadings.initial.tilt_angle.toFixed(1)}°</div>
              <div className="text-slate-300">Azimuth: {currentReadings.initial.azimuth_angle.toFixed(1)}°</div>
              <div className="text-slate-300">Power: {currentReadings.initial.power_watts.toFixed(0)} W</div>
            </div>
          )}
          {currentReadings.optimized && (
            <div className="p-2 bg-green-900/20 rounded border border-green-500/30">
              <div className="text-green-400 font-medium">After</div>
              <div className="text-slate-300">Tilt: {currentReadings.optimized.tilt_angle.toFixed(1)}°</div>
              <div className="text-slate-300">Azimuth: {currentReadings.optimized.azimuth_angle.toFixed(1)}°</div>
              <div className="text-slate-300">Power: {currentReadings.optimized.power_watts.toFixed(0)} W</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SolarPanelModelProps {
  position: [number, number, number];
  tiltAngle: number;
  azimuthAngle: number;
  power: number;
  color: string;
  label: string;
}

const SolarPanelModel: React.FC<SolarPanelModelProps> = ({
  position,
  tiltAngle,
  azimuthAngle,
  power,
  color,
  label
}) => {
  const panelRef = useRef<THREE.Group>(null);
  
  // Subtle animation for power indication
  useFrame((state) => {
    if (panelRef.current && power > 0) {
      // Subtle glow animation based on power
      const intensity = 0.02 * Math.sin(state.clock.elapsedTime * 2);
      panelRef.current.position.y = position[1] + intensity;
    }
  });

  // Convert angles to radians
  const tiltRad = THREE.MathUtils.degToRad(tiltAngle);
  const azimuthRad = THREE.MathUtils.degToRad(azimuthAngle - 180); // Adjust for south-facing

  return (
    <group position={position} ref={panelRef}>
      {/* Base/Stand */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Panel Mount */}
      <group position={[0, 1, 0]} rotation={[0, azimuthRad, 0]}>
        <group rotation={[-tiltRad, 0, 0]}>
          {/* Solar Panel */}
          <mesh>
            <boxGeometry args={[2, 0.05, 1.5]} />
            <meshStandardMaterial 
              color={color} 
              metalness={0.3} 
              roughness={0.5}
              emissive={color}
              emissiveIntensity={power > 0 ? 0.2 : 0}
            />
          </mesh>

          {/* Panel Glass */}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[1.9, 0.01, 1.4]} />
            <meshStandardMaterial 
              color="#1e3a5f"
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Grid lines on panel */}
          {[...Array(6)].map((_, i) => (
            <mesh key={`h-${i}`} position={[0, 0.035, -0.6 + i * 0.24]}>
              <boxGeometry args={[1.85, 0.005, 0.01]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
          ))}
          {[...Array(8)].map((_, i) => (
            <mesh key={`v-${i}`} position={[-0.85 + i * 0.24, 0.035, 0]}>
              <boxGeometry args={[0.01, 0.005, 1.35]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
          ))}
        </group>
      </group>

      {/* Label */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {/* Power indicator */}
      {power > 0 && (
        <Text
          position={[0, 2.1, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${power.toFixed(0)} W`}
        </Text>
      )}
    </group>
  );
};
