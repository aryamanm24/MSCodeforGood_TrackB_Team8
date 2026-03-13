"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import ModeToggle from "@/components/ModeToggle";
import OperatorPanel from "@/components/OperatorPanel";
import DonorPanel from "@/components/DonorPanel";
import GovernmentPanel from "@/components/GovernmentPanel";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  const [mode, setMode] = useState("operator");
  const [selectedResource, setSelectedResource] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const mapInvalidateRef = useRef(null);

  // Tell leaflet to recalculate its size after CSS transition ends
  const invalidateMap = useCallback(() => {
    setTimeout(() => {
      if (mapInvalidateRef.current) mapInvalidateRef.current();
    }, 520);
  }, []);

  const handleModeChange = useCallback(
    (newMode) => {
      setPanelOpen(false);
      setSelectedResource(null);
      setMode(newMode);
      setPanelKey((k) => k + 1);
      invalidateMap();
    },
    [invalidateMap]
  );

  const handleResourceSelect = useCallback(
    (resource) => {
      setSelectedResource(resource);
      setPanelOpen(true);
      setPanelKey((k) => k + 1);
      invalidateMap();
    },
    [invalidateMap]
  );

  const handleOpenPanel = useCallback(() => {
    setPanelOpen(true);
    setPanelKey((k) => k + 1);
    invalidateMap();
  }, [invalidateMap]);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    invalidateMap();
  }, [invalidateMap]);

  const showPanel =
    panelOpen &&
    ((mode === "operator" && selectedResource) ||
      mode === "donor" ||
      mode === "government");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#eae6da]">
      <div className="flex h-full w-full">
        {/* ---- Map (transitions from 100% to 55%) ---- */}
        <div
          className="relative h-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: showPanel ? "55%" : "100%" }}
        >
          <MapView
            mode={mode}
            panelOpen={showPanel}
            onResourceSelect={handleResourceSelect}
            onInvalidateRef={(fn) => {
              mapInvalidateRef.current = fn;
            }}
          />

          <ModeToggle activeMode={mode} onModeChange={handleModeChange} />

          {/* CTA button — visible when panel is closed */}
          {!showPanel && (
            <button
              onClick={
                mode === "operator"
                  ? undefined // operator opens via pin click
                  : handleOpenPanel
              }
              className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]
                px-6 py-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-sand-200
                text-sm font-medium shadow-sm
                hover:bg-white hover:shadow-md transition-all cursor-pointer
                ${mode === "operator" ? "text-sand-400 pointer-events-none" : "text-leaf-700"}
              `}
            >
              {mode === "operator"
                ? "Click a pin to view insights"
                : mode === "donor"
                ? "View impact report →"
                : "View gap analysis →"}
            </button>
          )}

          <div className="absolute bottom-4 left-4 z-[800] bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-sand-500 border border-sand-200">
            <span className="font-semibold text-leaf-600">Lemontree</span>{" "}
            Insights
          </div>
        </div>

        {/* ---- Data panel (transitions from 0% to 45%) ---- */}
        <div
          className="relative h-full bg-white border-l border-sand-200 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: showPanel ? "45%" : "0%",
            opacity: showPanel ? 1 : 0,
          }}
        >
          {showPanel && (
            <div className="h-full overflow-y-auto" key={panelKey}>
              <button
                onClick={handleClosePanel}
                className="sticky top-0 right-0 float-right m-4 z-10 w-8 h-8 flex items-center justify-center
                  rounded-full bg-sand-100 text-sand-500 hover:bg-sand-200 hover:text-sand-800
                  transition-colors cursor-pointer text-sm"
                aria-label="Close panel"
              >
                ✕
              </button>

              {mode === "operator" && selectedResource && (
                <OperatorPanel resource={selectedResource} />
              )}
              {mode === "donor" && <DonorPanel />}
              {mode === "government" && <GovernmentPanel />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
