import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineSelectorProps {
  availableDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export const TimelineSelector: React.FC<TimelineSelectorProps> = ({
  availableDates,
  selectedDate,
  onSelectDate
}) => {
  if (availableDates.length === 0) {
    return null;
  }

  const currentIndex = selectedDate ? availableDates.indexOf(selectedDate) : -1;

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectDate(availableDates[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < availableDates.length - 1) {
      onSelectDate(availableDates[currentIndex + 1]);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Date Filter
        </h3>
        {selectedDate && (
          <button
            onClick={() => onSelectDate(null)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Show All Dates
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex <= 0 && selectedDate !== null}
          className="p-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        <div className="flex-1 text-center">
          <span className="text-white font-medium">
            {selectedDate || 'All Dates'}
          </span>
          <span className="text-slate-400 text-xs block">
            {availableDates.length} days available
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex >= availableDates.length - 1 || selectedDate === null}
          className="p-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Date Pills */}
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        <button
          onClick={() => onSelectDate(null)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedDate === null
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          All
        </button>
        {availableDates.map(date => (
          <button
            key={date}
            onClick={() => onSelectDate(date)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              selectedDate === date
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {formatShortDate(date)}
          </button>
        ))}
      </div>
    </div>
  );
};

function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
