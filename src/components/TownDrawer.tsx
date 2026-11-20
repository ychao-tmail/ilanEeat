import React from 'react';
import { Clock, MapPin, Route, Utensils, X } from 'lucide-react';
import {
  FOOD_ROUTES,
  FOOD_SPOTS,
  getTimePeriodFromHour,
  TIME_PERIOD_META,
  TOWN_MAP,
  TownId,
} from '../data/yilanData';

interface TownDrawerProps {
  townId: TownId | null;
  timeOfDay: number;
  activeRouteId: string | null;
  onClose: () => void;
  onSelectRoute: (routeId: string) => void;
  isNight: boolean;
}

export const TownDrawer: React.FC<TownDrawerProps> = ({
  townId,
  timeOfDay,
  activeRouteId,
  onClose,
  onSelectRoute,
  isNight,
}) => {
  if (!townId) return null;

  const town = TOWN_MAP[townId];
  const spots = FOOD_SPOTS.filter((s) => s.townId === townId);
  const connectedRoutes = FOOD_ROUTES.filter((r) => r.townIds.includes(townId));
  const currentPeriod = getTimePeriodFromHour(timeOfDay);

  const surfaceCls = isNight
    ? 'bg-[#101C2E]/96 border-[#2A3D5A] text-[#F1F5F9]'
    : 'bg-[#FCFBF8]/96 border-[#D1DFE3] text-[#16262E]';

  const subtleTextCls = isNight ? 'text-[#9CB0C9]' : 'text-[#526973]';
  const dividerCls = isNight ? 'border-[#22344F]' : 'border-[#E2EBED]';

  return (
    <aside
      aria-label={`${town.name} 美食詳情`}
      className={`fixed right-4 top-18 bottom-24 z-20 flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-300 ${surfaceCls}`}
    >
      {/* Header */}
      <div className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${dividerCls}`}>
        <div className="min-w-0">
          <div className={`flex items-center gap-1.5 text-xs ${subtleTextCls}`}>
            <span>{town.region}</span>
            <span aria-hidden="true">·</span>
            <span>{town.landmarkLabel}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2.5">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {town.name}
            </h2>
            <span className={`font-display text-xs font-medium ${subtleTextCls}`}>
              {town.enName}
            </span>
          </div>
          <p className={`mt-1 text-xs font-medium ${isNight ? 'text-[#F29A52]' : 'text-[#2E7D52]'}`}>
            {town.tagline}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="關閉鄉鎮面板"
          className={`rounded-lg p-1.5 transition-colors ${subtleTextCls} ${
            isNight ? 'hover:bg-[#1E304C] hover:text-white' : 'hover:bg-[#EBF2F4] hover:text-[#16262E]'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scroll">
        {/* Regional Description + Scallion Traveler Quote */}
        <section className="space-y-3">
          <p className={`text-sm leading-relaxed ${isNight ? 'text-[#CEDAE8]' : 'text-[#314650]'}`}>
            {town.description}
          </p>
          <div
            className={`rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${
              isNight
                ? 'border-[#28405D] bg-[#162740] text-[#D8E5F2]'
                : 'border-[#D7E6DC] bg-[#F1F8F3] text-[#224A34]'
            }`}
          >
            <span className="font-semibold">三星蔥小旅人筆記：</span>
            「{town.mascotQuote}」
          </div>
        </section>

        {/* Connected Food Routes */}
        {connectedRoutes.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                <Route className="h-3.5 w-3.5" />
                <span>行經此鄉鎮的吃貨串聯路線</span>
              </h3>
              <span className={`font-mono text-xs tabular-nums ${subtleTextCls}`}>
                {connectedRoutes.length} 條
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {connectedRoutes.map((route) => {
                const isActive = activeRouteId === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => onSelectRoute(route.id)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? isNight
                          ? 'border-white/50 bg-[#223859] text-white'
                          : 'border-[#16262E] bg-[#16262E] text-white'
                        : isNight
                          ? 'border-[#2D4261] bg-[#16253C] text-[#D1DDEC] hover:bg-[#1E3250]'
                          : 'border-[#D5E1E5] bg-white text-[#1E323D] hover:bg-[#EEF4F6]'
                    }`}
                  >
                    <span
                      className="h-2.5 w-1 rounded-xs"
                      style={{ backgroundColor: route.color }}
                    />
                    <span>{route.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Curated Food Spots List (Zero-Pill Clean Editorial Hierarchy) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
              <Utensils className="h-3.5 w-3.5" />
              <span>必吃精選名店</span>
            </h3>
            <span className={`font-mono text-xs tabular-nums ${subtleTextCls}`}>
              共 {spots.length} 間
            </span>
          </div>

          <div className={`divide-y ${dividerCls}`}>
            {spots.map((spot) => {
              const fitsCurrentTime = spot.bestTimes.includes(currentPeriod);
              return (
                <article key={spot.id} className="py-3.5 first:pt-1 last:pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-bold leading-snug">
                      {spot.name}
                    </h4>
                    <span className="font-mono text-xs font-medium tabular-nums shrink-0">
                      {spot.priceRange}
                    </span>
                  </div>

                  {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
                  <div className={`mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs ${subtleTextCls}`}>
                    <span>{spot.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="h-3 w-3" />
                      {spot.hoursLabel}
                    </span>
                    {fitsCurrentTime && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            isNight ? 'text-[#F29A52]' : 'text-[#2E7D52]'
                          }`}
                        >
                          {TIME_PERIOD_META[currentPeriod].shortLabel}正對味
                        </span>
                      </>
                    )}
                  </div>

                  <p className="mt-2 text-xs font-semibold leading-relaxed">
                    招牌必點：{spot.signatureDish}
                  </p>
                  <p className={`mt-1 text-xs leading-relaxed ${subtleTextCls}`}>
                    {spot.localTip}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* Quiet Footer Tip */}
      <div className={`flex items-center justify-between border-t px-5 py-2.5 text-[11px] ${dividerCls} ${subtleTextCls}`}>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>點擊其他六角地塊切換鄉鎮</span>
        </span>
        <span>ESC 關閉</span>
      </div>
    </aside>
  );
};
