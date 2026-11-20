import React from 'react';
import { ArrowRight, Clock, X } from 'lucide-react';
import {
  FOOD_ROUTES,
  TIME_PERIOD_META,
  TOWN_MAP,
  TownId,
} from '../data/yilanData';

interface RouteSummaryBannerProps {
  activeRouteId: string | null;
  selectedTownId: TownId | null;
  onSelectStop: (townId: TownId) => void;
  onClearRoute: () => void;
  isNight: boolean;
}

export const RouteSummaryBanner: React.FC<RouteSummaryBannerProps> = ({
  activeRouteId,
  selectedTownId,
  onSelectStop,
  onClearRoute,
  isNight,
}) => {
  if (!activeRouteId) return null;
  const route = FOOD_ROUTES.find((r) => r.id === activeRouteId);
  if (!route) return null;

  const surfaceCls = isNight
    ? 'bg-[#111D30]/95 border-[#2B3F5E] text-[#F1F5F9]'
    : 'bg-[#FCFBF8]/95 border-[#D2DFE3] text-[#16262E]';

  const subtleTextCls = isNight ? 'text-[#9CB0C9]' : 'text-[#526973]';

  return (
    <div
      className={`fixed left-4 top-18 z-20 w-[min(360px,calc(100vw-2rem))] rounded-xl border px-4 py-3 shadow-lg transition-colors duration-300 ${surfaceCls}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`flex items-center gap-2 text-[11px] ${subtleTextCls}`}>
            <span
              className="h-2 w-2 rounded-xs shrink-0"
              style={{ backgroundColor: route.color }}
            />
            <span>吃貨串聯路線</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {route.duration}
            </span>
            <span aria-hidden="true">·</span>
            <span>建議{TIME_PERIOD_META[route.recommendedTime].shortLabel}</span>
          </div>
          <h3 className="mt-1 text-sm font-bold leading-snug">{route.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClearRoute}
          aria-label="關閉路線總覽"
          className={`rounded-md p-1 transition-colors ${subtleTextCls} hover:text-current`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className={`mt-1.5 text-xs leading-relaxed ${subtleTextCls}`}>
        {route.description}
      </p>

      {/* Interactive Stop-by-Stop Navigation */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1">
        {route.townIds.map((tid, idx) => {
          const isCurrent = selectedTownId === tid;
          return (
            <React.Fragment key={tid}>
              <button
                type="button"
                onClick={() => onSelectStop(tid)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-[#2E7D52] text-white'
                    : isNight
                      ? 'bg-[#1A2B45] text-[#DCE6F2] hover:bg-[#243B5E]'
                      : 'bg-[#EBF2F4] text-[#16262E] hover:bg-[#DCE7EA]'
                }`}
              >
                {TOWN_MAP[tid].name}
              </button>
              {idx < route.townIds.length - 1 && (
                <ArrowRight className={`h-3 w-3 shrink-0 ${subtleTextCls}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
