import { useState, useCallback, useMemo } from 'react';
import { DataSet, ComparisonStats, DailyStats, SolarReading } from '../types/SolarTypes';
import { parseCSV, createDataSet, calculateDataSetStats } from '../utils/csvUtils';

export const useSolarData = () => {
  const [dataSets, setDataSets] = useState<DataSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const addDataSet = useCallback(async (file: File, type: 'initial' | 'optimized') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await parseCSV(file);
      if (data.length === 0) {
        throw new Error('No valid data found in CSV file');
      }
      
      const name = file.name.replace('.csv', '');
      const newDataSet = createDataSet(data, name, type);
      
      setDataSets(prev => [...prev, newDataSet]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeDataSet = useCallback((id: string) => {
    setDataSets(prev => prev.filter(ds => ds.id !== id));
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setDataSets(prev => prev.map(ds => 
      ds.id === id ? { ...ds, visible: !ds.visible } : ds
    ));
  }, []);

  const clearAll = useCallback(() => {
    setDataSets([]);
    setError(null);
  }, []);

  // Get all unique dates
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    dataSets.forEach(ds => {
      ds.data.forEach(reading => {
        dates.add(reading.date);
      });
    });
    return Array.from(dates).sort();
  }, [dataSets]);

  // Filter data by selected date
  const filteredDataSets = useMemo(() => {
    if (!selectedDate) return dataSets;
    
    return dataSets.map(ds => ({
      ...ds,
      data: ds.data.filter(reading => reading.date === selectedDate)
    }));
  }, [dataSets, selectedDate]);

  // Calculate comparison stats
  const comparisonStats = useMemo((): ComparisonStats | null => {
    const initialSets = dataSets.filter(ds => ds.type === 'initial' && ds.visible);
    const optimizedSets = dataSets.filter(ds => ds.type === 'optimized' && ds.visible);

    if (initialSets.length === 0 || optimizedSets.length === 0) {
      return null;
    }

    const totalInitialEnergy = initialSets.reduce((sum, ds) => sum + ds.totalEnergy, 0);
    const totalOptimizedEnergy = optimizedSets.reduce((sum, ds) => sum + ds.totalEnergy, 0);

    const avgInitialEfficiency = initialSets.reduce((sum, ds) => sum + ds.avgEfficiency, 0) / initialSets.length;
    const avgOptimizedEfficiency = optimizedSets.reduce((sum, ds) => sum + ds.avgEfficiency, 0) / optimizedSets.length;

    const peakInitial = Math.max(...initialSets.map(ds => ds.peakPower));
    const peakOptimized = Math.max(...optimizedSets.map(ds => ds.peakPower));

    return {
      energyImprovement: totalInitialEnergy > 0 
        ? ((totalOptimizedEnergy - totalInitialEnergy) / totalInitialEnergy) * 100 
        : 0,
      peakPowerImprovement: peakInitial > 0 
        ? ((peakOptimized - peakInitial) / peakInitial) * 100 
        : 0,
      efficiencyImprovement: avgInitialEfficiency > 0 
        ? ((avgOptimizedEfficiency - avgInitialEfficiency) / avgInitialEfficiency) * 100 
        : 0,
      totalInitialEnergy,
      totalOptimizedEnergy
    };
  }, [dataSets]);

  // Daily statistics for bar chart
  const dailyStats = useMemo((): DailyStats[] => {
    const initialSets = dataSets.filter(ds => ds.type === 'initial' && ds.visible);
    const optimizedSets = dataSets.filter(ds => ds.type === 'optimized' && ds.visible);

    if (initialSets.length === 0 && optimizedSets.length === 0) {
      return [];
    }

    const dateMap = new Map<string, { initial: SolarReading[], optimized: SolarReading[] }>();

    initialSets.forEach(ds => {
      ds.data.forEach(reading => {
        if (!dateMap.has(reading.date)) {
          dateMap.set(reading.date, { initial: [], optimized: [] });
        }
        dateMap.get(reading.date)!.initial.push(reading);
      });
    });

    optimizedSets.forEach(ds => {
      ds.data.forEach(reading => {
        if (!dateMap.has(reading.date)) {
          dateMap.set(reading.date, { initial: [], optimized: [] });
        }
        dateMap.get(reading.date)!.optimized.push(reading);
      });
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, readings]) => {
        const initialEnergy = readings.initial.reduce((sum, r) => sum + r.power_watts, 0) / 1000;
        const optimizedEnergy = readings.optimized.reduce((sum, r) => sum + r.power_watts, 0) / 1000;
        const peakInitial = readings.initial.length > 0 
          ? Math.max(...readings.initial.map(r => r.power_watts))
          : 0;
        const peakOptimized = readings.optimized.length > 0
          ? Math.max(...readings.optimized.map(r => r.power_watts))
          : 0;

        return {
          date,
          initialEnergy,
          optimizedEnergy,
          improvement: initialEnergy > 0 
            ? ((optimizedEnergy - initialEnergy) / initialEnergy) * 100 
            : 0,
          peakInitial,
          peakOptimized
        };
      });
  }, [dataSets]);

  return {
    dataSets,
    filteredDataSets,
    isLoading,
    error,
    selectedDate,
    availableDates,
    comparisonStats,
    dailyStats,
    setSelectedDate,
    addDataSet,
    removeDataSet,
    toggleVisibility,
    clearAll
  };
};
