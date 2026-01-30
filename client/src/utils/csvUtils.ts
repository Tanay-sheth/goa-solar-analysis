import * as Papa from 'papaparse';
import { SolarReading, DataSet } from '../types/SolarTypes';

const COLORS = {
  initial: ['#ef4444', '#f97316', '#f59e0b'],
  optimized: ['#22c55e', '#10b981', '#14b8a6']
};

let colorIndex = { initial: 0, optimized: 0 };

export const parseCSV = (file: File): Promise<SolarReading[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<SolarReading>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results: Papa.ParseResult<SolarReading>) => {
        const data = results.data;
        // Validate and clean data
        const cleanedData = data.filter((row: SolarReading) => 
          row.datetime && 
          typeof row.power_watts === 'number' &&
          !isNaN(row.power_watts)
        );
        resolve(cleanedData);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

export const parseCSVFromUrl = async (url: string): Promise<SolarReading[]> => {
  const response = await fetch(url);
  const text = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse<SolarReading>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results: Papa.ParseResult<SolarReading>) => {
        const data = results.data;
        const cleanedData = data.filter((row: SolarReading) => 
          row.datetime && 
          typeof row.power_watts === 'number' &&
          !isNaN(row.power_watts)
        );
        resolve(cleanedData);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

export const calculateDataSetStats = (data: SolarReading[]): { totalEnergy: number; peakPower: number; avgEfficiency: number } => {
  if (data.length === 0) {
    return { totalEnergy: 0, peakPower: 0, avgEfficiency: 0 };
  }

  // Total energy in kWh (assuming hourly readings)
  const totalEnergy = data.reduce((sum, r) => sum + r.power_watts, 0) / 1000;
  
  // Peak power
  const peakPower = Math.max(...data.map(r => r.power_watts));
  
  // Average efficiency (only during daylight)
  const daylightReadings = data.filter(r => r.power_watts > 0);
  const avgEfficiency = daylightReadings.length > 0
    ? daylightReadings.reduce((sum, r) => sum + r.efficiency, 0) / daylightReadings.length
    : 0;

  return { totalEnergy, peakPower, avgEfficiency };
};

export const createDataSet = (
  data: SolarReading[],
  name: string,
  type: 'initial' | 'optimized'
): DataSet => {
  const stats = calculateDataSetStats(data);
  const colorArray = COLORS[type];
  const color = colorArray[colorIndex[type] % colorArray.length];
  colorIndex[type]++;

  return {
    id: `${type}-${Date.now()}`,
    name,
    data,
    color,
    visible: true,
    type,
    ...stats
  };
};

export const resetColorIndex = () => {
  colorIndex = { initial: 0, optimized: 0 };
};

export const formatPower = (watts: number): string => {
  if (watts >= 1000000) {
    return `${(watts / 1000000).toFixed(2)} MW`;
  } else if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`;
  }
  return `${watts.toFixed(0)} W`;
};

export const formatEnergy = (kwh: number): string => {
  if (kwh >= 1000) {
    return `${(kwh / 1000).toFixed(2)} MWh`;
  }
  return `${kwh.toFixed(2)} kWh`;
};

export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};
