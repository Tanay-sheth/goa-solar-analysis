// Solar Panel Data Types

export interface SolarReading {
  datetime: string;
  date: string;
  hour: number;
  power_watts: number;
  voltage: number;
  current: number;
  panel_temp_c: number;
  ambient_temp_c: number;
  irradiance_wm2: number;
  tilt_angle: number;
  azimuth_angle: number;
  efficiency: number;
}

export interface DataSet {
  id: string;
  name: string;
  data: SolarReading[];
  color: string;
  visible: boolean;
  type: 'initial' | 'optimized';
  totalEnergy: number;  // kWh
  peakPower: number;    // W
  avgEfficiency: number;
}

export interface ComparisonStats {
  energyImprovement: number;      // percentage
  peakPowerImprovement: number;   // percentage
  efficiencyImprovement: number;  // percentage
  totalInitialEnergy: number;     // kWh
  totalOptimizedEnergy: number;   // kWh
}

export interface TimelineMarker {
  id: string;
  timestamp: string;
  label: string;
  color: string;
}

export interface ChartDataPoint {
  time: string;
  hour: number;
  initialPower: number | null;
  optimizedPower: number | null;
  [key: string]: number | string | null;
}

export interface DailyStats {
  date: string;
  initialEnergy: number;
  optimizedEnergy: number;
  improvement: number;
  peakInitial: number;
  peakOptimized: number;
}
