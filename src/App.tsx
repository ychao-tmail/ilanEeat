import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomControlDock } from './components/BottomControlDock';
import { FoodDirectoryView } from './components/FoodDirectoryView';
import { RouteSummaryBanner } from './components/RouteSummaryBanner';
import { TopBar } from './components/TopBar';
import { TownDrawer } from './components/TownDrawer';
import {
  FOOD_SPOTS,
  TOWN_MAP,
  TownId,
} from './data/yilanData';
import {
  MascotStateUpdate,
  ProjectedPoint,
  YilanIslandScene,
} from './three/YilanIslandScene';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<YilanIslandScene | null>(null);

  // Direct DOM refs for 60fps 3D-to-2D projected overlays (zero React re-renders per frame)
  const hoverLabelRef = useRef<HTMLDivElement>(null);
  const mascotBubbleRef = useRef<HTMLDivElement>(null);

  // Core App State
  const [viewMode, setViewMode] = useState<'3d' | 'list'>('3d');
  const [selectedTownId, setSelectedTownId] = useState<TownId | null>(null);
  const [hoveredTownId, setHoveredTownId] = useState<TownId | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<number>(10.5);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [followMascot, setFollowMascot] = useState<boolean>(false);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [webglLost, setWebglLost] = useState<boolean>(false);

  const [mascotState, setMascotState] = useState<MascotStateUpdate>({
    townId: 'sanxing',
    townName: '三星鄉',
    quote: TOWN_MAP.sanxing.mascotQuote,
    isWaving: true,
  });

  // Night UI posture matches dusk/night lighting smoothly
  const isNight = timeOfDay >= 18.0 || timeOfDay < 5.5;

  // Keep latest callbacks accessible to stable WebGL mount effect
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const hudCollapsedRef = useRef(hudCollapsed);
  hudCollapsedRef.current = hudCollapsed;

  // Mount Three.js WebGL scene exactly once inside isolated ref container
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const islandScene = new YilanIslandScene(mountEl, {
      onSelectTown: (townId) => {
        setSelectedTownId(townId);
      },
      onHoverTown: (townId, screenPos) => {
        setHoveredTownId((prev) => (prev === townId ? prev : townId));
        const el = hoverLabelRef.current;
        if (!el) return;
        if (townId && screenPos && screenPos.visible && viewModeRef.current === '3d') {
          el.style.opacity = '1';
          el.style.transform = `translate3d(${screenPos.x}px, ${screenPos.y}px, 0) translate(-50%, -115%)`;
        } else {
          el.style.opacity = '0';
        }
      },
      onMascotUpdate: (update) => {
        setMascotState(update);
      },
      onMascotScreenPos: (pos: ProjectedPoint) => {
        const el = mascotBubbleRef.current;
        if (!el) return;
        const shouldShow =
          pos.visible &&
          viewModeRef.current === '3d' &&
          !hudCollapsedRef.current;
        if (shouldShow) {
          el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -108%)`;
          el.style.visibility = 'visible';
        } else {
          el.style.visibility = 'hidden';
        }
      },
      onMascotClick: (townId) => {
        setSelectedTownId(townId);
        islandScene.focusTown(townId);
      },
      onUserOrbitStart: () => {
        setFollowMascot(false);
      },
      onWebGLContextLost: () => {
        setWebglLost(true);
      },
    });

    sceneRef.current = islandScene;

    return () => {
      islandScene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Sync reactive controls into Three.js engine without tearing down canvas
  useEffect(() => {
    sceneRef.current?.setTimeOfDay(timeOfDay);
  }, [timeOfDay]);

  useEffect(() => {
    sceneRef.current?.setSelectedTown(selectedTownId);
  }, [selectedTownId]);

  useEffect(() => {
    sceneRef.current?.setActiveRoute(activeRouteId);
  }, [activeRouteId]);

  useEffect(() => {
    sceneRef.current?.setFollowMascot(followMascot);
  }, [followMascot]);

  useEffect(() => {
    sceneRef.current?.setPaused(viewMode === 'list');
  }, [viewMode]);

  // Keyboard shortcuts: H to collapse/expand dock, Escape to close drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'h' || e.key === 'H') {
        if (viewModeRef.current === '3d') {
          setHudCollapsed((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        setSelectedTownId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleResetView = useCallback(() => {
    setSelectedTownId(null);
    setFollowMascot(false);
    sceneRef.current?.resetView();
  }, []);

  const handleSelectTownFromSearchOrList = useCallback((townId: TownId) => {
    setViewMode('3d');
    setFollowMascot(false);
    setSelectedTownId(townId);
    sceneRef.current?.focusTown(townId);
  }, []);

  const handleSelectRoute = useCallback((routeId: string | null) => {
    setActiveRouteId(routeId);
    if (routeId) {
      setFollowMascot(false);
    }
  }, []);

  const hoveredTown = hoveredTownId ? TOWN_MAP[hoveredTownId] : null;
  const hoveredSpotCount = hoveredTownId
    ? FOOD_SPOTS.filter((s) => s.townId === hoveredTownId).length
    : 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none">
      {/* Isolated WebGL Canvas Mount Container (never unmounted on UI updates) */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 z-0 h-full w-full"
        aria-label="宜蘭美食島 3D 互動六角格地圖"
      />

      {/* Graceful WebGL Fallback Notice */}
      {webglLost && viewMode === '3d' && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#111D30] p-6 text-center text-white">
          <div className="max-w-md space-y-4">
            <h2 className="font-display text-xl font-bold">
              3D 顯示環境暫時中斷
            </h2>
            <p className="text-sm text-[#A9BCD3]">
              您的瀏覽器暫時釋放了 WebGL 資源，您可以立即切換至完整文字美食清單繼續探索宜蘭 13 鄉鎮名店。
            </p>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="rounded-lg bg-[#2E7D52] px-4 py-2 text-sm font-medium text-white hover:bg-[#389463]"
            >
              切換至美食清單模式
            </button>
          </div>
        </div>
      )}

      {/* 3D-to-2D Projected Hover Township Label */}
      <div
        ref={hoverLabelRef}
        style={{ opacity: 0 }}
        className={`pointer-events-none fixed left-0 top-0 z-10 rounded-lg border px-3 py-1.5 shadow-md transition-opacity duration-150 ${
          isNight
            ? 'bg-[#101C2E]/95 border-[#314766] text-white'
            : 'bg-[#FCFBF8]/95 border-[#CBD9DE] text-[#16262E]'
        }`}
      >
        {hoveredTown && (
          <div className="flex items-center gap-2 whitespace-nowrap text-xs">
            <span className="font-bold">{hoveredTown.name}</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span className="opacity-75">{hoveredTown.landmarkLabel}</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span
              className={`font-mono tabular-nums font-semibold ${
                isNight ? 'text-[#F29A52]' : 'text-[#2E7D52]'
              }`}
            >
              {hoveredSpotCount} 間
            </span>
          </div>
        )}
      </div>

      {/* 3D-to-2D Projected Sanxing Scallion Traveler Speech Bubble (shown when waving at a soapbox!) */}
      <div
        ref={mascotBubbleRef}
        style={{ visibility: 'hidden' }}
        className={`pointer-events-none fixed left-0 top-0 z-10 max-w-[230px] rounded-xl border px-3 py-2 shadow-lg transition-opacity duration-300 ${
          mascotState.isWaving ? 'opacity-100' : 'opacity-0'
        } ${
          isNight
            ? 'bg-[#122238]/96 border-[#385278] text-[#F1F5F9]'
            : 'bg-[#FCFBF8]/96 border-[#C6DEC9] text-[#16262E]'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 text-[11px] font-semibold ${
            isNight ? 'text-[#7BE0A3]' : 'text-[#246E45]'
          }`}
        >
          <span>三星蔥小旅人</span>
          <span aria-hidden="true">·</span>
          <span>{mascotState.townName}</span>
        </div>
        <p className="mt-0.5 text-xs leading-snug">{mascotState.quote}</p>
      </div>

      {/* Top Navigation Bar (Strict 3-Zone Single Row) */}
      <TopBar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        onSelectTownFromSearch={handleSelectTownFromSearchOrList}
        onResetView={handleResetView}
        isNight={isNight}
      />

      {/* 3D Mode Overlays (Zero Center Viewport Occlusion) */}
      {viewMode === '3d' && (
        <>
          {/* Active Food Route Stop-by-Stop Banner (Only visible when a route is selected) */}
          {!hudCollapsed && (
            <RouteSummaryBanner
              activeRouteId={activeRouteId}
              selectedTownId={selectedTownId}
              onSelectStop={(tid) => setSelectedTownId(tid)}
              onClearRoute={() => handleSelectRoute(null)}
              isNight={isNight}
            />
          )}

          {/* On-Demand Right Township Culinary Drawer (Only visible when a hex is clicked) */}
          <TownDrawer
            townId={selectedTownId}
            timeOfDay={timeOfDay}
            activeRouteId={activeRouteId}
            onClose={() => setSelectedTownId(null)}
            onSelectRoute={(rid) => handleSelectRoute(rid)}
            isNight={isNight}
          />

          {/* Subtle First-Visit Hint when idle & no route/drawer open */}
          {!selectedTownId && !activeRouteId && !hudCollapsed && (
            <div
              className={`pointer-events-none fixed left-5 top-18 z-10 hidden sm:block rounded-lg border px-3 py-1.5 text-xs ${
                isNight
                  ? 'bg-[#111D30]/88 border-[#2A3D5A] text-[#B7C8DC]'
                  : 'bg-[#FCFBF8]/88 border-[#D4E0E4] text-[#445C66]'
              }`}
            >
              拖曳旋轉 360° · 點擊六角鄉鎮探索名店 · 點擊三星蔥小旅人觸發彩蛋
            </div>
          )}

          {/* Unified Collapsible Bottom Control Dock */}
          <BottomControlDock
            timeOfDay={timeOfDay}
            onChangeTimeOfDay={setTimeOfDay}
            activeRouteId={activeRouteId}
            onSelectRoute={handleSelectRoute}
            followMascot={followMascot}
            onToggleFollowMascot={() => setFollowMascot((prev) => !prev)}
            mascotTownName={mascotState.townName}
            collapsed={hudCollapsed}
            onToggleCollapsed={() => setHudCollapsed((prev) => !prev)}
            isNight={isNight}
          />
        </>
      )}

      {/* Full-Screen Readable Directory / List Mode */}
      {viewMode === 'list' && (
        <FoodDirectoryView
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          activeRouteId={activeRouteId}
          onSelectRoute={handleSelectRoute}
          onFlyToTownIn3D={handleSelectTownFromSearchOrList}
          isNight={isNight}
        />
      )}
    </div>
  );
}
