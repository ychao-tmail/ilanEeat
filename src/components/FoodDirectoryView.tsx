import React, { useMemo, useState } from 'react';
import { Clock, MapPin, Navigation, Route } from 'lucide-react';
import {
  FOOD_CATEGORIES,
  FOOD_ROUTES,
  FOOD_SPOTS,
  FoodCategory,
  TIME_PERIOD_META,
  TimePeriod,
  TOWN_MAP,
  TOWN_TILES,
  TownId,
} from '../data/yilanData';

interface FoodDirectoryViewProps {
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  activeRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
  onFlyToTownIn3D: (townId: TownId) => void;
  isNight: boolean;
}

export const FoodDirectoryView: React.FC<FoodDirectoryViewProps> = ({
  searchQuery,
  onChangeSearchQuery,
  activeRouteId,
  onSelectRoute,
  onFlyToTownIn3D,
  isNight,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [selectedTime, setSelectedTime] = useState<TimePeriod | 'all'>('all');
  const [selectedTownFilter, setSelectedTownFilter] = useState<TownId | 'all'>('all');

  const activeRoute = useMemo(
    () => (activeRouteId ? FOOD_ROUTES.find((r) => r.id === activeRouteId) ?? null : null),
    [activeRouteId]
  );

  const filteredSpots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FOOD_SPOTS.filter((spot) => {
      if (selectedCategory !== 'all' && spot.category !== selectedCategory) return false;
      if (selectedTime !== 'all' && !spot.bestTimes.includes(selectedTime)) return false;
      if (selectedTownFilter !== 'all' && spot.townId !== selectedTownFilter) return false;
      if (activeRoute && !activeRoute.townIds.includes(spot.townId)) return false;

      if (q) {
        const townName = TOWN_MAP[spot.townId].name.toLowerCase();
        const match =
          spot.name.toLowerCase().includes(q) ||
          spot.signatureDish.toLowerCase().includes(q) ||
          spot.localTip.toLowerCase().includes(q) ||
          spot.category.toLowerCase().includes(q) ||
          townName.includes(q) ||
          spot.keywords.some((k) => k.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedTime, selectedTownFilter, activeRoute]);

  const bgCls = isNight ? 'bg-[#0C1626] text-[#F1F5F9]' : 'bg-[#F4F7F8] text-[#16262E]';
  const cardCls = isNight
    ? 'bg-[#132136] border-[#253752]'
    : 'bg-[#FCFBF8] border-[#D8E3E6]';
  const subtleCls = isNight ? 'text-[#9CB0C9]' : 'text-[#526973]';

  return (
    <main
      className={`fixed inset-0 top-14 z-20 overflow-y-auto custom-scroll transition-colors duration-300 ${bgCls}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-8">
        {/* Editorial Intro Header */}
        <section className="flex flex-col justify-between gap-4 border-b border-slate-400/20 pb-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className={`text-xs font-medium ${isNight ? 'text-[#F29A52]' : 'text-[#2E7D52]'}`}>
              宜蘭 12 鄉鎮與龜山島 · 精選在地美食目錄
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
              蘭陽味覺清單總覽
            </h1>
            <p className={`mt-2 text-sm leading-relaxed ${subtleCls}`}>
              完整收錄 {TOWN_TILES.length} 座主題地塊、{FOOD_SPOTS.length} 間在地人氣名店與{' '}
              {FOOD_ROUTES.length} 條主題吃貨路線。隨時篩選分類與用餐時段，並一鍵飛往 3D 島嶼查看地理位置。
            </p>
          </div>
          <div className={`font-mono text-sm tabular-nums ${subtleCls}`}>
            顯示 <strong className={isNight ? 'text-white' : 'text-[#16262E]'}>{filteredSpots.length}</strong> / {FOOD_SPOTS.length} 間名店
          </div>
        </section>

        {/* Filter Controls */}
        <section className="space-y-4">
          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#2E7D52] text-white'
                  : isNight
                    ? 'bg-[#172740] text-[#C8D6E8] hover:bg-[#1F3454]'
                    : 'bg-white text-[#344A54] border border-[#D8E3E6] hover:bg-[#EDF3F5]'
              }`}
            >
              全部料理類別
            </button>
            {FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#2E7D52] text-white'
                    : isNight
                      ? 'bg-[#172740] text-[#C8D6E8] hover:bg-[#1F3454]'
                      : 'bg-white text-[#344A54] border border-[#D8E3E6] hover:bg-[#EDF3F5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Time of Day + Township + Route Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Period Segmented Control */}
            <div
              className={`flex items-center gap-1 rounded-lg p-1 ${
                isNight ? 'bg-[#16253C]' : 'bg-[#E6EEF0]'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedTime('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedTime === 'all'
                    ? isNight
                      ? 'bg-[#E0632C] text-white'
                      : 'bg-white text-[#16262E] shadow-xs'
                    : subtleCls
                }`}
              >
                全時段
              </button>
              {(Object.keys(TIME_PERIOD_META) as TimePeriod[]).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setSelectedTime(tp)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedTime === tp
                      ? isNight
                        ? 'bg-[#E0632C] text-white'
                        : 'bg-white text-[#16262E] shadow-xs'
                      : subtleCls
                  }`}
                >
                  {TIME_PERIOD_META[tp].shortLabel}
                </button>
              ))}
            </div>

            {/* Township Dropdown */}
            <select
              aria-label="篩選鄉鎮"
              value={selectedTownFilter}
              onChange={(e) => setSelectedTownFilter(e.target.value as TownId | 'all')}
              className={`h-8 rounded-lg border px-2.5 text-xs font-medium outline-none ${
                isNight
                  ? 'bg-[#16253C] border-[#2C405F] text-[#F1F5F9]'
                  : 'bg-white border-[#D3DFE3] text-[#16262E]'
              }`}
            >
              <option value="all">全部 13 座鄉鎮與龜山島</option>
              {TOWN_TILES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.region}）
                </option>
              ))}
            </select>

            {/* Route Dropdown */}
            <select
              aria-label="篩選吃貨路線"
              value={activeRouteId ?? 'all'}
              onChange={(e) =>
                onSelectRoute(e.target.value === 'all' ? null : e.target.value)
              }
              className={`h-8 rounded-lg border px-2.5 text-xs font-medium outline-none ${
                isNight
                  ? 'bg-[#16253C] border-[#2C405F] text-[#F1F5F9]'
                  : 'bg-white border-[#D3DFE3] text-[#16262E]'
              }`}
            >
              <option value="all">全部吃貨串聯路線</option>
              {FOOD_ROUTES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {(selectedCategory !== 'all' ||
              selectedTime !== 'all' ||
              selectedTownFilter !== 'all' ||
              activeRouteId !== null ||
              searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTime('all');
                  setSelectedTownFilter('all');
                  onSelectRoute(null);
                  onChangeSearchQuery('');
                }}
                className={`text-xs font-medium underline underline-offset-4 ${
                  isNight ? 'text-[#F29A52]' : 'text-[#2E7D52]'
                }`}
              >
                清除全部條件
              </button>
            )}
          </div>
        </section>

        {/* Active Route Callout */}
        {activeRoute && (
          <section className={`rounded-xl border px-5 py-4 ${cardCls}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className={`flex items-center gap-2 text-xs ${subtleCls}`}>
                  <Route className="h-3.5 w-3.5" />
                  <span>目前篩選路線</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeRoute.duration}</span>
                </div>
                <h2 className="mt-1 text-base font-bold">{activeRoute.name}</h2>
                <p className={`mt-1 text-xs ${subtleCls}`}>{activeRoute.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {activeRoute.townIds.map((tid) => (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => onFlyToTownIn3D(tid)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      isNight
                        ? 'bg-[#1E314F] text-[#E6EFF9] hover:bg-[#2E7D52]'
                        : 'bg-[#EAF1F3] text-[#16262E] hover:bg-[#2E7D52] hover:text-white'
                    }`}
                  >
                    {TOWN_MAP[tid].name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Directory Results Grid */}
        {filteredSpots.length === 0 ? (
          <div className={`rounded-2xl border py-16 text-center ${cardCls}`}>
            <p className="text-base font-semibold">找不到符合條件的宜蘭美食</p>
            <p className={`mt-1 text-xs ${subtleCls}`}>
              試著放寬分類、時段篩選，或輸入其他關鍵字（如：蔥油餅、肉羹、海鮮、冰）
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpots.map((spot) => {
              const town = TOWN_MAP[spot.townId];
              const timeLabels = spot.bestTimes
                .map((t) => TIME_PERIOD_META[t].shortLabel)
                .join(' / ');

              return (
                <article
                  key={spot.id}
                  className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${cardCls}`}
                >
                  <div>
                    {/* Quiet Unboxed Metadata Line (Zero-Pill Rule) */}
                    <div className={`flex items-center justify-between gap-2 text-xs ${subtleCls}`}>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <MapPin className="h-3 w-3" />
                        {town.name}
                        <span aria-hidden="true">·</span>
                        {spot.category}
                      </span>
                      <span className="font-mono tabular-nums">{spot.priceRange}</span>
                    </div>

                    <h3 className="mt-2 text-base font-bold leading-snug">
                      {spot.name}
                    </h3>

                    <p className="mt-2 text-xs font-semibold leading-relaxed">
                      招牌必點：{spot.signatureDish}
                    </p>
                    <p className={`mt-1.5 text-xs leading-relaxed ${subtleCls}`}>
                      {spot.localTip}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-400/15 pt-3">
                    <div className={`flex items-center gap-1.5 text-[11px] font-mono tabular-nums ${subtleCls}`}>
                      <Clock className="h-3 w-3" />
                      <span>{spot.hoursLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">{timeLabels}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onFlyToTownIn3D(spot.townId)}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                        isNight
                          ? 'bg-[#1D314F] text-[#F29A52] hover:bg-[#E0632C] hover:text-white'
                          : 'bg-[#EAF3EE] text-[#246642] hover:bg-[#2E7D52] hover:text-white'
                      }`}
                    >
                      <Navigation className="h-3 w-3" />
                      <span>飛往 3D</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};
