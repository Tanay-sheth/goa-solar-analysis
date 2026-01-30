import { useSolarData } from './hooks/useSolarData';
import { DatasetPanel } from './components/DatasetPanel';
import { StatsPanel } from './components/StatsPanel';
import { PowerChart, EnergyBarChart, EfficiencyChart } from './components/Charts';
import { TimelineSelector } from './components/TimelineSelector';
import { SolarPanel3D } from './components/SolarPanel3D';
import { Sun, MapPin, Download, Github, ExternalLink } from 'lucide-react';
import './index.css';

function App() {
  const {
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
  } = useSolarData();

  const handleExportReport = () => {
    if (!comparisonStats) return;

    const report = {
      generatedAt: new Date().toISOString(),
      location: 'BITS Pilani Goa Campus (15.3909°N, 73.8778°E)',
      summary: {
        energyImprovement: `${comparisonStats.energyImprovement.toFixed(2)}%`,
        peakPowerImprovement: `${comparisonStats.peakPowerImprovement.toFixed(2)}%`,
        efficiencyImprovement: `${comparisonStats.efficiencyImprovement.toFixed(2)}%`,
        totalInitialEnergy: `${comparisonStats.totalInitialEnergy.toFixed(2)} Wh`,
        totalOptimizedEnergy: `${comparisonStats.totalOptimizedEnergy.toFixed(2)} Wh`,
        energyGained: `${(comparisonStats.totalOptimizedEnergy - comparisonStats.totalInitialEnergy).toFixed(2)} Wh`
      },
      dailyStats: dailyStats.map(d => ({
        date: d.date,
        initialEnergy: `${d.initialEnergy.toFixed(2)} kWh`,
        optimizedEnergy: `${d.optimizedEnergy.toFixed(2)} kWh`,
        improvement: `${d.improvement.toFixed(2)}%`
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solar-optimization-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleData = async () => {
    try {
      // Load sample initial data
      const initialResponse = await fetch('/sample_initial_readings.csv');
      const initialBlob = await initialResponse.blob();
      const initialFile = new File([initialBlob], 'sample_initial_readings.csv', { type: 'text/csv' });
      await addDataSet(initialFile, 'initial');

      // Load sample optimized data
      const optimizedResponse = await fetch('/sample_optimized_readings.csv');
      const optimizedBlob = await optimizedResponse.blob();
      const optimizedFile = new File([optimizedBlob], 'sample_optimized_readings.csv', { type: 'text/csv' });
      await addDataSet(optimizedFile, 'optimized');
    } catch (err) {
      console.error('Failed to load sample data:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Sun className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Solar Panel Digital Twin</h1>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                BITS Pilani Goa Campus (15.3909°N, 73.8778°E)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dataSets.length === 0 && (
              <button
                onClick={handleLoadSampleData}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Load Sample Data
              </button>
            )}
            {comparisonStats && (
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            )}
            <a
              href="https://github.com/bits-goa"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Dataset Controls */}
          <div className="col-span-12 lg:col-span-3">
            <DatasetPanel
              dataSets={dataSets}
              onAddDataSet={addDataSet}
              onRemoveDataSet={removeDataSet}
              onToggleVisibility={toggleVisibility}
              onClearAll={clearAll}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Stats Panel */}
            <StatsPanel 
              comparisonStats={comparisonStats} 
              dataSets={dataSets} 
            />

            {/* Timeline Selector */}
            {availableDates.length > 0 && (
              <TimelineSelector
                availableDates={availableDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Power Chart */}
              <div className="xl:col-span-2">
                <PowerChart
                  dataSets={filteredDataSets}
                  selectedDate={selectedDate}
                />
              </div>

              {/* 3D Visualization */}
              <SolarPanel3D
                dataSets={filteredDataSets}
                selectedDate={selectedDate}
              />

              {/* Daily Energy Bar Chart */}
              <EnergyBarChart dailyStats={dailyStats} />
            </div>

            {/* Efficiency Chart */}
            <EfficiencyChart
              dataSets={filteredDataSets}
              selectedDate={selectedDate}
            />
          </div>
        </div>

        {/* Instructions */}
        {dataSets.length === 0 && (
          <div className="mt-8 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-400">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold">1</div>
                <h3 className="text-white font-medium">Upload Initial Data</h3>
                <p>Upload your CSV file containing solar panel readings <strong className="text-orange-400">before</strong> angle optimization.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">2</div>
                <h3 className="text-white font-medium">Upload Optimized Data</h3>
                <p>Upload the CSV file with readings <strong className="text-green-400">after</strong> applying our optimal angle recommendations.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">3</div>
                <h3 className="text-white font-medium">Analyze & Compare</h3>
                <p>View charts, 3D visualization, and detailed statistics showing your energy gains.</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-slate-700/50 rounded">
              <h3 className="text-white font-medium mb-2">CSV Format Required:</h3>
              <code className="text-xs text-green-400 break-all block">
                datetime,date,hour,power_watts,voltage,current,panel_temp_c,ambient_temp_c,irradiance_wm2,tilt_angle,azimuth_angle,efficiency
              </code>
              <p className="text-xs text-slate-500 mt-2">
                Or click &quot;Load Sample Data&quot; in the header to see a demo with pre-loaded data.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-slate-500">
          <p>Solar Panel Digital Twin | BITS Pilani Goa Campus</p>
          <p className="mt-1">Optimal angles calculated using PVLIB (NASA-grade solar position algorithm)</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
