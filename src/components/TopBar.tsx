import React, { useMemo, useRef, useState } from 'react';
import { Compass, List, Map, RotateCcw, Search, X } from 'lucide-react';
import {
  FOOD_SPOTS,
  FoodSpot,
  TOWN_MAP,
  TOWN_TILES,
  TownId,
} from '../data/yilanData';

interface TopBarProps {
  viewMode: '3d' | 'list';
  onChangeViewMode: (mode: '3d' | 'list') => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onSelectTownFromSearch: (townId: TownId) => void;
  onResetView: () => void;
  isNight: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  onChangeViewMode,
  searchQuery,
  onChangeSearchQuery,
  onSelectTownFromSearch,
  onResetView,
  isNight,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || viewMode === 'list') return { towns: [], spots: [] as FoodSpot[] };

    const towns = TOWN_TILES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.enName.toLowerCase().includes(q) ||
        t.landmarkLabel.toLowerCase().includes(q)
    ).slice(0, 3);

    const spots = FOOD_SPOTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.signatureDish.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q)) ||
        TOWN_MAP[s.townId].name.toLowerCase().includes(q)
    ).slice(0, 5);

    return { towns, spots };
  }, [searchQuery, viewMode]);

  const hasQuickResults =
    quickResults.towns.length > 0 || quickResults.spots.length > 0;

  const surfaceCls = isNight
    ? 'bg-[#111D30]/95 border-[#2A3B55] text-[#F1F5F9]'
    : 'bg-[#FCFBF8]/95 border-[#D6E2E6] text-[#16262E]';

  const subtleTextCls = isNight ? 'text-[#9FB2C8]' : 'text-[#526973]';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 border-b transition-colors duration-300 ${surfaceCls}`}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => {
            onChangeViewMode('3d');
            onResetView();
          }}
          className="flex items-center gap-2 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E7D52] rounded"
        >
          <Compass
            className={`h-5 w-5 shrink-0 ${
              isNight ? 'text-[#F29A52]' : 'text-[#2E7D52]'
            }`}
          />
          <span className="font-display text-lg font-bold tracking-tight">
            宜蘭美食島
          </span>
        </button>

        {/* Zone 2: Clean Navigation Links + Live Search */}
        <div className="flex flex-1 items-center justify-center gap-4 sm:gap-6 min-w-0">
          <nav
            aria-label="檢視模式"
            className="flex items-center gap-5 text-sm font-medium shrink-0"
          >
            <button
              type="button"
              onClick={() => onChangeViewMode('3d')}
              className={`relative flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                viewMode === '3d'
                  ? isNight
                    ? 'text-[#F29A52]'
                    : 'text-[#2E7D52]'
                  : `${subtleTextCls} hover:text-current`
              }`}
            >
              <Map className="h-4 w-4" />
              <span>3D 島嶼</span>
              {viewMode === '3d' && (
                <span
                  className={`absolute -bottom-[15px] left-0 right-0 h-0.5 ${
                    isNight ? 'bg-[#F29A52]' : 'bg-[#2E7D52]'
                  }`}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeViewMode('list')}
              className={`relative flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                viewMode === 'list'
                  ? isNight
                    ? 'text-[#F29A52]'
                    : 'text-[#2E7D52]'
                  : `${subtleTextCls} hover:text-current`
              }`}
            >
              <List className="h-4 w-4" />
              <span>美食清單</span>
              {viewMode === 'list' && (
                <span
                  className={`absolute -bottom-[15px] left-0 right-0 h-0.5 ${
                    isNight ? 'bg-[#F29A52]' : 'bg-[#2E7D52]'
                  }`}
                />
              )}
            </button>
          </nav>

          {/* Compact Search Input */}
          <div className="relative w-full max-w-[260px] sm:max-w-[320px]">
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${subtleTextCls}`}
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="搜尋蔥油餅、肉羹、羅東、海鮮..."
              aria-label="搜尋宜蘭美食或鄉鎮"
              className={`h-9 w-full rounded-lg border pl-8 pr-8 text-xs sm:text-sm outline-none transition-colors ${
                isNight
                  ? 'bg-[#192840] border-[#2F4361] text-[#F1F5F9] placeholder-[#7B92AE] focus:border-[#F29A52]'
                  : 'bg-[#F1F5F6] border-[#D4DFE3] text-[#16262E] placeholder-[#6B828C] focus:border-[#2E7D52] focus:bg-white'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="清除搜尋"
                onClick={() => {
                  onChangeSearchQuery('');
                  inputRef.current?.focus();
                }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${subtleTextCls} hover:text-current`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* 3D Mode Instant Fly-To Search Dropdown */}
            {viewMode === '3d' && searchFocused && searchQuery.trim().length > 0 && (
              <div
                className={`absolute left-0 right-0 top-11 z-40 max-h-80 overflow-y-auto rounded-xl border shadow-lg custom-scroll ${
                  isNight
                    ? 'bg-[#122036] border-[#2E4260] text-[#F1F5F9]'
                    : 'bg-[#FCFBF8] border-[#D3DFE3] text-[#16262E]'
                }`}
              >
                {!hasQuickResults ? (
                  <div className={`px-4 py-4 text-xs ${subtleTextCls}`}>
                    找不到符合「{searchQuery}」的宜蘭鄉鎮或名店
                  </div>
                ) : (
                  <div className="divide-y divide-slate-400/15">
                    {quickResults.towns.length > 0 && (
                      <div className="p-2">
                        <div className={`px-2 py-1 text-[11px] font-medium ${subtleTextCls}`}>
                          鄉鎮地塊
                        </div>
                        {quickResults.towns.map((town) => (
                          <button
                            key={town.id}
                            type="button"
                            onMouseDown={() => {
                              onSelectTownFromSearch(town.id);
                              setSearchFocused(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                              isNight ? 'hover:bg-[#1E3252]' : 'hover:bg-[#EBF2F4]'
                            }`}
                          >
                            <span className="font-medium">{town.name}</span>
                            <span className={subtleTextCls}>{town.landmarkLabel}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {quickResults.spots.length > 0 && (
                      <div className="p-2">
                        <div className={`px-2 py-1 text-[11px] font-medium ${subtleTextCls}`}>
                          精選名店（點擊飛往 3D 地塊）
                        </div>
                        {quickResults.spots.map((spot) => (
                          <button
                            key={spot.id}
                            type="button"
                            onMouseDown={() => {
                              onSelectTownFromSearch(spot.townId);
                              setSearchFocused(false);
                            }}
                            className={`flex w-full flex-col rounded-lg px-2.5 py-2 text-left transition-colors ${
                              isNight ? 'hover:bg-[#1E3252]' : 'hover:bg-[#EBF2F4]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold truncate">
                                {spot.name}
                              </span>
                              <span
                                className={`text-[11px] shrink-0 ${
                                  isNight ? 'text-[#F29A52]' : 'text-[#2E7D52]'
                                }`}
                              >
                                {TOWN_MAP[spot.townId].name}
                              </span>
                            </div>
                            <span className={`text-[11px] truncate ${subtleTextCls}`}>
                              {spot.signatureDish}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {
              if (viewMode === 'list') {
                onChangeViewMode('3d');
              }
              onResetView();
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              isNight
                ? 'bg-[#E0632C] text-white hover:bg-[#EA733E]'
                : 'bg-[#16262E] text-white hover:bg-[#243B47]'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>重置全景</span>
          </button>
        </div>
      </div>
    </header>
  );
};
