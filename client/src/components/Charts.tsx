import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import { DataSet, ChartDataPoint } from '../types/SolarTypes';
import { BarChart3, LineChartIcon, Activity } from 'lucide-react';

interface PowerChartProps {
  dataSets: DataSet[];
  selectedDate: string | null;
}

export const PowerChart: React.FC<PowerChartProps> = ({ dataSets, selectedDate }) => {
  const visibleSets = dataSets.filter(ds => ds.visible);

  const chartData = useMemo(() => {
    if (visibleSets.length === 0) return [];

    // Merge all data points by hour
    const hourMap = new Map<number, ChartDataPoint>();

    for (let hour = 5; hour <= 19; hour++) {
      hourMap.set(hour, {
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        initialPower: null,
        optimizedPower: null
      });
    }

    visibleSets.forEach(ds => {
      const filteredData = selectedDate 
        ? ds.data.filter(r => r.date === selectedDate)
        : ds.data;

      // Group by hour and average
      const hourlyData = new Map<number, number[]>();
      
      filteredData.forEach(reading => {
        if (!hourlyData.has(reading.hour)) {
          hourlyData.set(reading.hour, []);
        }
        hourlyData.get(reading.hour)!.push(reading.power_watts);
      });

      hourlyData.forEach((powers, hour) => {
        const avgPower = powers.reduce((a, b) => a + b, 0) / powers.length;
        const point = hourMap.get(hour);
        if (point) {
          if (ds.type === 'initial') {
            point.initialPower = avgPower;
          } else {
            point.optimizedPower = avgPower;
          }
        }
      });
    });

    return Array.from(hourMap.values()).filter(
      p => p.initialPower !== null || p.optimizedPower !== null
    );
  }, [visibleSets, selectedDate]);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 h-80 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <LineChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No data to display</p>
          <p className="text-xs mt-1">Upload datasets to see the power chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-yellow-400" />
        Power Output Over Time
        {selectedDate && <span className="text-sm font-normal text-slate-400">({selectedDate})</span>}
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="initialGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="optimizedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ 
              value: 'Power (W)', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#9ca3af'
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #475569',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value) => value !== undefined ? [`${Number(value).toFixed(1)} W`, ''] : ['', '']}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
          />
          <Area
            type="monotone"
            dataKey="initialPower"
            name="Before Optimization"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#initialGradient)"
            dot={false}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="optimizedPower"
            name="After Optimization"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#optimizedGradient)"
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface EnergyBarChartProps {
  dailyStats: {
    date: string;
    initialEnergy: number;
    optimizedEnergy: number;
    improvement: number;
  }[];
}

export const EnergyBarChart: React.FC<EnergyBarChartProps> = ({ dailyStats }) => {
  if (dailyStats.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 h-80 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No daily data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        Daily Energy Comparison
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={dailyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ 
              value: 'Energy (kWh)', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#9ca3af'
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ 
              value: 'Improvement (%)', 
              angle: 90, 
              position: 'insideRight',
              fill: '#9ca3af'
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #475569',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="initialEnergy" 
            name="Initial (kWh)" 
            fill="#f97316"
            opacity={0.8}
          />
          <Bar 
            yAxisId="left"
            dataKey="optimizedEnergy" 
            name="Optimized (kWh)" 
            fill="#22c55e"
            opacity={0.8}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="improvement"
            name="Improvement (%)"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ fill: '#a855f7', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

interface EfficiencyChartProps {
  dataSets: DataSet[];
  selectedDate: string | null;
}

export const EfficiencyChart: React.FC<EfficiencyChartProps> = ({ dataSets, selectedDate }) => {
  const visibleSets = dataSets.filter(ds => ds.visible);

  const chartData = useMemo(() => {
    if (visibleSets.length === 0) return [];

    const hourMap = new Map<number, { hour: number; time: string; initialEff: number | null; optimizedEff: number | null }>();

    for (let hour = 5; hour <= 19; hour++) {
      hourMap.set(hour, {
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        initialEff: null,
        optimizedEff: null
      });
    }

    visibleSets.forEach(ds => {
      const filteredData = selectedDate 
        ? ds.data.filter(r => r.date === selectedDate)
        : ds.data;

      const hourlyData = new Map<number, number[]>();
      
      filteredData.forEach(reading => {
        if (reading.efficiency !== undefined) {
          if (!hourlyData.has(reading.hour)) {
            hourlyData.set(reading.hour, []);
          }
          hourlyData.get(reading.hour)!.push(reading.efficiency);
        }
      });

      hourlyData.forEach((effs, hour) => {
        const avgEff = effs.reduce((a, b) => a + b, 0) / effs.length;
        const point = hourMap.get(hour);
        if (point) {
          if (ds.type === 'initial') {
            point.initialEff = avgEff;
          } else {
            point.optimizedEff = avgEff;
          }
        }
      });
    });

    return Array.from(hourMap.values()).filter(
      p => p.initialEff !== null || p.optimizedEff !== null
    );
  }, [visibleSets, selectedDate]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Panel Efficiency Over Time
      </h3>
      
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            domain={[0, 30]}
            label={{ 
              value: 'Efficiency (%)', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#9ca3af'
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #475569',
              borderRadius: '8px'
            }}
            formatter={(value) => value !== undefined ? [`${Number(value).toFixed(1)}%`, ''] : ['', '']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="initialEff"
            name="Initial Efficiency"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316' }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="optimizedEff"
            name="Optimized Efficiency"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
