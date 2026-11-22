import React from 'react';
import { Check, MapPin } from 'lucide-react';
import { LITERARY_STATIONS } from '../data/literaryMap';
import { PeriodName } from '../types/game';

interface LiteraryMapProps {
  activePeriod?: PeriodName | null;
  visitedPeriods?: PeriodName[];
  selectedPeriods?: PeriodName[];
  compact?: boolean;
}

export const LiteraryMap: React.FC<LiteraryMapProps> = ({
  activePeriod = null,
  visitedPeriods = [],
  selectedPeriods,
  compact = false,
}) => {
  return (
    <section
      aria-label="Ədəbi xəritə"
      className={`bg-white border border-[#E2DDD3] rounded-xl ${
        compact ? 'p-3 md:p-4' : 'p-5 md:p-6'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#0F5C4D]" aria-hidden="true" />
          <h2 className="font-literary font-bold text-base md:text-lg text-[#181A1F]">
            Ədəbi xəritə
          </h2>
        </div>
        <span className="text-xs text-[#5B5E66]">
          Şifahi xalq ədəbiyyatından maarifçi realizmə doğru yol
        </span>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {LITERARY_STATIONS.map((station, index) => {
            const isActive = activePeriod === station.period;
            const isVisited = visitedPeriods.includes(station.period);
            const isIncluded =
              !selectedPeriods || selectedPeriods.includes(station.period);

            return (
              <div
                key={station.id}
                className={`relative rounded-lg border p-3 transition-colors ${
                  isActive
                    ? 'bg-[#EDF6F3] border-[#0F5C4D] text-[#181A1F]'
                    : isVisited
                    ? 'bg-[#F8FAF9] border-[#84B8AC] text-[#181A1F]'
                    : isIncluded
                    ? 'bg-[#FAF8F4] border-[#E2DDD3] text-[#181A1F]'
                    : 'bg-[#F5F3EE] border-[#E8E4DC] text-[#8A8D94] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold tabular-nums shrink-0 ${
                      isActive
                        ? 'bg-[#0F5C4D] text-white'
                        : isVisited
                        ? 'bg-[#15803D] text-white'
                        : 'bg-[#E6E1D6] text-[#3B3E45]'
                    }`}
                  >
                    {isVisited && !isActive ? (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="text-[11px] font-medium text-[#5B5E66] truncate">
                    {isActive
                      ? 'Cari stansiya'
                      : isVisited
                      ? 'Keçilib'
                      : station.eraLabel}
                  </span>
                </div>

                <h3 className="font-bold text-sm leading-snug mb-1">
                  {station.shortTitle}
                </h3>

                <p className="text-xs text-[#4A4D54] leading-relaxed">
                  {station.writers.join(' · ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
