import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Footprints,
  Moon,
  Route,
  Sun,
  Sunrise,
  Sunset,
  X,
} from 'lucide-react';
import {
  FOOD_ROUTES,
  formatHour,
  getTimePeriodFromHour,
  TIME_PERIOD_META,
  TimePeriod,
} from '../data/yilanData';

interface BottomControlDockProps {
  timeOfDay: number;
  onChangeTimeOfDay: (hour: number) => void;
  activeRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
  followMascot: boolean;
  onToggleFollowMascot: () => void;
  mascotTownName: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isNight: boolean;
}

const PERIOD_ICONS: Record<TimePeriod, React.ReactNode> = {
  morning: <Sunrise className="h-3.5 w-3.5" />,
  lunch: <Sun className="h-3.5 w-3.5" />,
  afternoon: <Sunset className="h-3.5 w-3.5" />,
  night: <Moon className="h-3.5 w-3.5" />,
};

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  timeOfDay,
  onChangeTimeOfDay,
  activeRouteId,
  onSelectRoute,
  followMascot,
  onToggleFollowMascot,
  mascotTownName,
  collapsed,
  onToggleCollapsed,
  isNight,
}) => {
  const currentPeriod = getTimePeriodFromHour(timeOfDay);
  const currentPeriodMeta = TIME_PERIOD_META[currentPeriod];

  const surfaceCls = isNight
    ? 'bg-[#111D30]/95 border-[#2C3F5C] text-[#F1F5F9]'
    : 'bg-[#FCFBF8]/95 border-[#D2DFE3] text-[#16262E]';

  const subtleTextCls = isNight ? 'text-[#9CB0C9]' : 'text-[#526973]';

  const sliderTrackBg =
    'linear-gradient(90deg, #162447 0%, #F2A879 25%, #84C7DC 48%, #E6875C 73%, #14223D 100%)';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex flex-col items-center px-3">
      {/* Collapse / Expand Cinema-Zen Mode Handle */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        title="快捷鍵 H 切換純享全景模式"
        className={`pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-t-lg rounded-b-md border px-3 py-1 text-xs font-medium shadow-sm transition-colors ${surfaceCls}`}
      >
        {collapsed ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            <span>展開島嶼控制台</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            <span>收合控制列</span>
            <span className={`font-mono text-[11px] ${subtleTextCls}`}>(H)</span>
          </>
        )}
      </button>

      {/* Unified Collapsible Bottom Control Dock */}
      <div
        className={`pointer-events-auto w-full max-w-[940px] overflow-hidden rounded-2xl border shadow-xl transition-all duration-300 ${surfaceCls} ${
          collapsed
            ? 'max-h-0 translate-y-6 border-transparent opacity-0 pointer-events-none'
            : 'max-h-[260px] translate-y-0 opacity-100'
        }`}
      >
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-5">
          {/* Row 1: 24-Hour Lighting Slider + 4 Period Presets + Follow Scallion Mascot */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 min-w-[230px] items-center gap-3">
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-mono text-base font-semibold tabular-nums">
                  {formatHour(timeOfDay)}
                </span>
                <span className={`text-xs font-medium ${subtleTextCls}`}>
                  {currentPeriodMeta.label}
                </span>
              </div>

              <div className="relative flex flex-1 items-center">
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={0.1}
                  value={timeOfDay}
                  aria-label="24 小時日夜光影時間軸"
                  onChange={(e) => onChangeTimeOfDay(parseFloat(e.target.value))}
                  style={{ background: sliderTrackBg }}
                  className="time-slider h-1.5 w-full rounded-full"
                />
              </div>
            </div>

            {/* 4 Period Quick Presets */}
            <div
              className={`flex items-center gap-1 rounded-lg p-1 ${
                isNight ? 'bg-[#192942]' : 'bg-[#EAF0F2]'
              }`}
            >
              {(Object.keys(TIME_PERIOD_META) as TimePeriod[]).map((period) => {
                const meta = TIME_PERIOD_META[period];
                const active = currentPeriod === period;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => onChangeTimeOfDay(meta.hour)}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? isNight
                          ? 'bg-[#E0632C] text-white'
                          : 'bg-white text-[#16262E] shadow-xs'
                        : `${subtleTextCls} hover:text-current`
                    }`}
                  >
                    {PERIOD_ICONS[period]}
                    <span>{meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Follow Sanxing Scallion Mascot Button */}
            <button
              type="button"
              onClick={onToggleFollowMascot}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                followMascot
                  ? 'border-[#2E7D52] bg-[#2E7D52] text-white'
                  : isNight
                    ? 'border-[#334B6E] bg-[#182840] text-[#E2EBF5] hover:border-[#2E7D52]'
                    : 'border-[#C9D8DC] bg-white text-[#16262E] hover:border-[#2E7D52]'
              }`}
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>
                {followMascot ? `跟隨中 · ${mascotTownName}` : `跟隨蔥旅人 · ${mascotTownName}`}
              </span>
            </button>
          </div>

          {/* Hairline Divider */}
          <div
            className={`h-px w-full ${
              isNight ? 'bg-[#263854]' : 'bg-[#E1EAEB]'
            }`}
          />

          {/* Row 2: 6 Cross-Island Food Route Beams */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scroll">
            <div
              className={`flex items-center gap-1.5 pr-1 text-xs font-medium whitespace-nowrap shrink-0 ${subtleTextCls}`}
            >
              <Route className="h-3.5 w-3.5" />
              <span>吃貨路線</span>
            </div>

            {FOOD_ROUTES.map((route) => {
              const active = activeRouteId === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => onSelectRoute(active ? null : route.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? isNight
                        ? 'border-white/40 bg-[#203454] text-white'
                        : 'border-[#16262E] bg-[#16262E] text-white'
                      : isNight
                        ? 'border-[#2B3E5A] bg-[#16253C] text-[#CAD7E6] hover:bg-[#1E314E]'
                        : 'border-[#D5E1E5] bg-white text-[#233742] hover:bg-[#EDF4F6]'
                  }`}
                >
                  <span
                    className="h-2.5 w-1 rounded-xs shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  <span>{route.shortName}</span>
                </button>
              );
            })}

            {activeRouteId && (
              <button
                type="button"
                onClick={() => onSelectRoute(null)}
                aria-label="關閉吃貨路線光束"
                className={`ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs whitespace-nowrap shrink-0 transition-colors ${subtleTextCls} hover:text-current`}
              >
                <X className="h-3.5 w-3.5" />
                <span>清除</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
