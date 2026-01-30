import React from 'react';
import { TrendingUp, TrendingDown, Zap, Battery, Gauge, Sun } from 'lucide-react';
import { ComparisonStats, DataSet } from '../types/SolarTypes';
import { formatEnergy, formatPower } from '../utils/csvUtils';

interface StatsPanelProps {
  comparisonStats: ComparisonStats | null;
  dataSets: DataSet[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ comparisonStats, dataSets }) => {
  const visibleSets = dataSets.filter(ds => ds.visible);
  const initialSets = visibleSets.filter(ds => ds.type === 'initial');
  const optimizedSets = visibleSets.filter(ds => ds.type === 'optimized');

  // Calculate totals
  const totalInitialEnergy = initialSets.reduce((sum, ds) => sum + ds.totalEnergy, 0);
  const totalOptimizedEnergy = optimizedSets.reduce((sum, ds) => sum + ds.totalEnergy, 0);
  const peakInitial = initialSets.length > 0 ? Math.max(...initialSets.map(ds => ds.peakPower)) : 0;
  const peakOptimized = optimizedSets.length > 0 ? Math.max(...optimizedSets.map(ds => ds.peakPower)) : 0;

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Gauge className="w-5 h-5 text-blue-400" />
        Performance Comparison
      </h2>

      {dataSets.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Sun className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Upload data sets to see comparison</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Energy - Initial */}
          <StatCard
            label="Initial Energy"
            value={formatEnergy(totalInitialEnergy)}
            icon={<Battery className="w-5 h-5" />}
            color="orange"
          />

          {/* Total Energy - Optimized */}
          <StatCard
            label="Optimized Energy"
            value={formatEnergy(totalOptimizedEnergy)}
            icon={<Battery className="w-5 h-5" />}
            color="green"
          />

          {/* Peak Power - Initial */}
          <StatCard
            label="Peak (Initial)"
            value={formatPower(peakInitial)}
            icon={<Zap className="w-5 h-5" />}
            color="orange"
          />

          {/* Peak Power - Optimized */}
          <StatCard
            label="Peak (Optimized)"
            value={formatPower(peakOptimized)}
            icon={<Zap className="w-5 h-5" />}
            color="green"
          />
        </div>
      )}

      {/* Improvement Stats */}
      {comparisonStats && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Improvement Analysis</h3>
          <div className="grid grid-cols-3 gap-4">
            <ImprovementCard
              label="Energy Output"
              value={comparisonStats.energyImprovement}
            />
            <ImprovementCard
              label="Peak Power"
              value={comparisonStats.peakPowerImprovement}
            />
            <ImprovementCard
              label="Efficiency"
              value={comparisonStats.efficiencyImprovement}
            />
          </div>
        </div>
      )}

      {/* Quick Summary */}
      {comparisonStats && comparisonStats.energyImprovement > 0 && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
          <p className="text-green-300 text-sm">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Optimization increased total energy output by{' '}
            <span className="font-bold">{comparisonStats.energyImprovement.toFixed(1)}%</span>
            {' '}({formatEnergy(comparisonStats.totalOptimizedEnergy - comparisonStats.totalInitialEnergy)} gained)
          </p>
        </div>
      )}

      {comparisonStats && comparisonStats.energyImprovement < 0 && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">
            <TrendingDown className="w-4 h-4 inline mr-1" />
            Energy output decreased by{' '}
            <span className="font-bold">{Math.abs(comparisonStats.energyImprovement).toFixed(1)}%</span>
            {' '}(Check panel orientation)
          </p>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'orange' | 'green' | 'blue';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorStyles = {
    orange: 'bg-orange-900/20 border-orange-500/30 text-orange-400',
    green: 'bg-green-900/20 border-green-500/30 text-green-400',
    blue: 'bg-blue-900/20 border-blue-500/30 text-blue-400'
  };

  const iconColors = {
    orange: 'text-orange-400',
    green: 'text-green-400',
    blue: 'text-blue-400'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorStyles[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
};

interface ImprovementCardProps {
  label: string;
  value: number;
}

const ImprovementCard: React.FC<ImprovementCardProps> = ({ label, value }) => {
  const isPositive = value >= 0;
  
  return (
    <div className={`p-3 rounded-lg text-center ${
      isPositive ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'
    }`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {isPositive 
          ? <TrendingUp className="w-4 h-4 text-green-400" />
          : <TrendingDown className="w-4 h-4 text-red-400" />
        }
        <span className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
};
