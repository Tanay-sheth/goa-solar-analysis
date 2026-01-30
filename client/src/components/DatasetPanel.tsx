import React, { useCallback } from 'react';
import { Upload, X, Eye, EyeOff, Sun, Zap } from 'lucide-react';
import { DataSet } from '../types/SolarTypes';
import { formatEnergy, formatPower } from '../utils/csvUtils';

interface DatasetPanelProps {
  dataSets: DataSet[];
  onAddDataSet: (file: File, type: 'initial' | 'optimized') => void;
  onRemoveDataSet: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onClearAll: () => void;
  isLoading: boolean;
  error: string | null;
}

export const DatasetPanel: React.FC<DatasetPanelProps> = ({
  dataSets,
  onAddDataSet,
  onRemoveDataSet,
  onToggleVisibility,
  onClearAll,
  isLoading,
  error
}) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'initial' | 'optimized') => {
    const file = e.target.files?.[0];
    if (file) {
      onAddDataSet(file, type);
      e.target.value = ''; // Reset input
    }
  }, [onAddDataSet]);

  const initialSets = dataSets.filter(ds => ds.type === 'initial');
  const optimizedSets = dataSets.filter(ds => ds.type === 'optimized');

  return (
    <div className="bg-slate-800 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-400" />
          Data Sets
        </h2>
        {dataSets.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 p-3 bg-blue-900/50 border border-blue-500 rounded text-blue-200 text-sm flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
          Loading data...
        </div>
      )}

      {/* Upload Sections */}
      <div className="space-y-4 flex-1 overflow-auto">
        {/* Initial Data Upload */}
        <div className="border border-orange-500/30 rounded-lg p-3 bg-orange-900/10">
          <h3 className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            Before Optimization
          </h3>
          
          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-orange-500/30 rounded cursor-pointer hover:border-orange-500/50 hover:bg-orange-900/20 transition-all">
            <Upload className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-300">Upload Initial CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e, 'initial')}
              className="hidden"
            />
          </label>

          {/* Initial datasets list */}
          <div className="mt-2 space-y-2">
            {initialSets.map(ds => (
              <DataSetItem
                key={ds.id}
                dataSet={ds}
                onRemove={onRemoveDataSet}
                onToggle={onToggleVisibility}
              />
            ))}
          </div>
        </div>

        {/* Optimized Data Upload */}
        <div className="border border-green-500/30 rounded-lg p-3 bg-green-900/10">
          <h3 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            After Optimization
          </h3>
          
          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-green-500/30 rounded cursor-pointer hover:border-green-500/50 hover:bg-green-900/20 transition-all">
            <Upload className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-300">Upload Optimized CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e, 'optimized')}
              className="hidden"
            />
          </label>

          {/* Optimized datasets list */}
          <div className="mt-2 space-y-2">
            {optimizedSets.map(ds => (
              <DataSetItem
                key={ds.id}
                dataSet={ds}
                onRemove={onRemoveDataSet}
                onToggle={onToggleVisibility}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-4 p-3 bg-slate-700/50 rounded text-xs text-slate-400">
        <p className="font-medium text-slate-300 mb-1">Expected CSV format:</p>
        <code className="text-xs break-all">
          datetime, power_watts, voltage, current, panel_temp_c, tilt_angle, azimuth_angle, efficiency
        </code>
      </div>
    </div>
  );
};

interface DataSetItemProps {
  dataSet: DataSet;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}

const DataSetItem: React.FC<DataSetItemProps> = ({ dataSet, onRemove, onToggle }) => {
  const isInitial = dataSet.type === 'initial';
  const colorClass = isInitial ? 'orange' : 'green';

  return (
    <div className={`p-2 rounded bg-${colorClass}-900/20 border border-${colorClass}-500/20`}
         style={{ backgroundColor: isInitial ? 'rgba(234, 88, 12, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${isInitial ? 'text-orange-300' : 'text-green-300'} truncate flex-1`}>
          {dataSet.name}
        </span>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onToggle(dataSet.id)}
            className="p-1 hover:bg-slate-600 rounded transition-colors"
            title={dataSet.visible ? 'Hide' : 'Show'}
          >
            {dataSet.visible 
              ? <Eye className="w-4 h-4 text-slate-400" />
              : <EyeOff className="w-4 h-4 text-slate-500" />
            }
          </button>
          <button
            onClick={() => onRemove(dataSet.id)}
            className="p-1 hover:bg-red-600/50 rounded transition-colors"
            title="Remove"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
      <div className="mt-1 text-xs text-slate-500 grid grid-cols-2 gap-1">
        <span>Points: {dataSet.data.length}</span>
        <span>Peak: {formatPower(dataSet.peakPower)}</span>
        <span>Energy: {formatEnergy(dataSet.totalEnergy)}</span>
        <span>Avg Eff: {dataSet.avgEfficiency.toFixed(1)}%</span>
      </div>
    </div>
  );
};
