"use client";

import { useState, useCallback } from "react";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useSettingsStore } from "@/store/settings-store";
import { useGameStore } from "@/store/game-store";
import { DreamcastSpiral } from "@/components/common/dreamcast-spiral";

type AnimationPhase = "idle" | "opening" | "waiting" | "inserting" | "closing" | "done";

export function DreamcastConsole() {
  const { pickDirectory, scanDirectory, setItems, isSupported } = useFileSystem();
  const { t } = useSettingsStore();
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const loadingProgress = useGameStore((s) => s.loadingProgress);
  const isLoading = useGameStore((s) => s.isLoading);

  const handleClick = useCallback(async () => {
    if (phase !== "idle" || !isSupported) return;

    // 1. Open the round lid
    setPhase("opening");
    await sleep(800);

    // 2. Show file picker
    setPhase("waiting");
    const handle = await pickDirectory();

    if (!handle) {
      setPhase("closing");
      await sleep(800);
      setPhase("idle");
      return;
    }

    try {
      // 3. Scan the directory (progress dialog shows automatically via isLoading)
      const scannedItems = await scanDirectory(handle);

      // 4. After scanning completes, animate the SD card insertion
      setPhase("inserting");
      await sleep(2000);

      // 5. Close the lid
      setPhase("closing");
      await sleep(800);

      // 6. Only now commit items to store (triggers game list render)
      setItems(scannedItems);
      setPhase("done");
    } catch {
      setPhase("closing");
      await sleep(800);
      setPhase("idle");
    }
  }, [phase, isSupported, pickDirectory, scanDirectory, setItems]);

  const isLidOpen = phase === "opening" || phase === "waiting" || phase === "inserting";
  const showCard = phase === "inserting" || phase === "closing" || phase === "done";

  // Circle dimensions
  const consoleW = 360;
  const consoleTopH = 280;
  const circleR = 115;
  const circleCx = consoleW / 2;
  const circleCy = consoleTopH / 2;

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        id="btn-console"
        className="relative cursor-pointer group select-none"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={t("drive.selectFolder")}
      >
        {/* Shadow under console */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[340px] h-[30px] rounded-[50%] bg-black/12 dark:bg-black/40 blur-xl" />

        <div className="relative w-[360px] h-[340px]" style={{ perspective: "900px" }}>

          {/* ===== CONSOLE BODY (always visible) ===== */}
          <div className="absolute top-0 left-0 right-0 bottom-[60px] rounded-[4px] bg-gradient-to-b from-[#f0ede8] to-[#e6e2dc] dark:from-[#3e3b36] dark:to-[#333028] border border-[#d5d0c8] dark:border-[#504b44] shadow-lg">

            {/* Inner recessed area - visible through the circular opening */}
            <div className="absolute top-[8px] left-[8px] right-[8px] bottom-[8px] rounded-[3px] bg-gradient-to-b from-[#ddd9d3] to-[#d5d0c8] dark:from-[#2e2c28] dark:to-[#262420] border border-[#ccc7c0] dark:border-[#3a3835]">

              {/* GD-ROM Drive Interior (revealed when round lid opens) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[210px] h-[210px] rounded-full bg-gradient-to-br from-[#e8e4df] to-[#d8d4ce] dark:from-[#3a3733] dark:to-[#302e2a] border border-[#d0cbc4] dark:border-[#4a4740] shadow-inner overflow-hidden">

                {/* Circular track/groove around the disc area */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[190px] h-[190px] rounded-full border border-[#ccc7c0] dark:border-[#3a3835]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[170px] h-[170px] rounded-full border border-[#d5d0c8]/50 dark:border-[#3a3835]/50" />

                {/* Center spindle motor hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#e0dcd6] to-[#d0cbc4] dark:from-[#353230] dark:to-[#2a2826] border border-[#c5c0b8] dark:border-[#4a4740] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
                  {/* Inner hub ring */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36px] h-[36px] rounded-full bg-gradient-to-b from-[#d5d0c8] to-[#ccc7c0] dark:from-[#302e2a] dark:to-[#282624] border border-[#bbb6ae] dark:border-[#444]">
                    {/* Center hole */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#aaa5a0] dark:bg-[#252320] border border-[#999] dark:border-[#333] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
                    {/* Spindle clips */}
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="absolute w-[4px] h-[8px] rounded-[1px] bg-[#bbb6ae] dark:bg-[#3a3835]"
                        style={{
                          top: "50%",
                          left: "50%",
                          transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateY(-12px)`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Laser rail guide (horizontal bar) */}
                <div className="absolute top-1/2 left-[18px] right-[50px] h-[3px] -translate-y-1/2 bg-gradient-to-r from-[#bbb6ae] via-[#c5c0b8] to-[#bbb6ae] dark:from-[#3a3835] dark:via-[#444] dark:to-[#3a3835] rounded-full shadow-sm" />

                {/* Laser head on rail */}
                <div className="absolute top-1/2 left-[30px] -translate-y-1/2 w-[24px] h-[18px] rounded-[2px] bg-gradient-to-b from-[#d0cbc4] to-[#c5c0b8] dark:from-[#333] dark:to-[#2a2826] border border-[#bbb6ae] dark:border-[#444] shadow-sm">
                  {/* Laser lens */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-[#222] dark:bg-[#111] border border-[#444] dark:border-[#333]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-[2px] rounded-full bg-[#4466aa]/60" />
                  </div>
                </div>

                {/* Second rail (thinner) */}
                <div className="absolute left-[20px] right-[55px] h-[1.5px] bg-[#c5c0b8] dark:bg-[#3a3835] rounded-full" style={{ top: "58%" }} />

                {/* Ribbon cable (curved, bottom area) */}
                <svg className="absolute bottom-[20px] left-[30px] w-[80px] h-[30px]" viewBox="0 0 80 30" fill="none">
                  <path d="M5 25 Q20 5, 40 10 Q60 15, 75 5" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-[#c5c0b8] dark:text-[#3a3835]" />
                  <path d="M5 25 Q20 5, 40 10 Q60 15, 75 5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-[#d0cbc4] dark:text-[#444]" />
                </svg>

                {/* GD-ROM label */}
                <div className="absolute top-[15px] left-[20px] text-[5px] font-mono font-bold text-[#a09b94] dark:text-[#5a554e] tracking-wider">
                  GD-ROM
                </div>

                {/* Small screw near top right */}
                <div className="absolute top-[20px] right-[25px] w-[8px] h-[8px] rounded-full bg-gradient-to-br from-[#d5d0c8] to-[#c5c0b8] dark:from-[#3a3835] dark:to-[#302e2a] border border-[#bbb6ae] dark:border-[#4a4740] shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.3)]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-[0.5px] bg-[#999] dark:bg-[#555]" />
                </div>

                {/* Small screw bottom right */}
                <div className="absolute bottom-[25px] right-[30px] w-[8px] h-[8px] rounded-full bg-gradient-to-br from-[#d5d0c8] to-[#c5c0b8] dark:from-[#3a3835] dark:to-[#302e2a] border border-[#bbb6ae] dark:border-[#4a4740] shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.3)]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-[0.5px] bg-[#999] dark:bg-[#555]" />
                </div>

                {/* Ventilation slots (bottom left) */}
                <div className="absolute bottom-[40px] left-[25px] flex flex-col gap-[4px]">
                  <div className="w-[14px] h-[2px] rounded-full bg-[#aaa5a0] dark:bg-[#333]" />
                  <div className="w-[14px] h-[2px] rounded-full bg-[#aaa5a0] dark:bg-[#333]" />
                  <div className="w-[14px] h-[2px] rounded-full bg-[#aaa5a0] dark:bg-[#333]" />
                </div>

                {/* SD CARD SLOT (GDEMU mod) */}
                <div className="absolute bottom-[15px] left-1/2 -translate-x-1/2 w-[52px] h-[28px]">
                  <div className="w-full h-full rounded-[2px] bg-[#bbb6ae] dark:bg-[#444] border border-[#aaa5a0] dark:border-[#3a3835] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] relative overflow-hidden">
                    <div className="absolute top-[2px] left-[3px] right-[3px] bottom-[2px] rounded-[1px] bg-[#555] dark:bg-[#1a1a1a] border border-[#444] dark:border-[#222]">
                      <div className="absolute bottom-[2px] left-[3px] right-[3px] flex gap-[1px]">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div key={i} className="flex-1 h-[2.5px] bg-[#aa8822] rounded-t-[0.5px]" />
                        ))}
                      </div>
                      <div className="absolute top-[1px] left-[3px] text-[3px] font-mono text-[#777] dark:text-[#444]">SD</div>
                    </div>
                  </div>
                </div>

                {/* SD CARD (animated - slides down into slot) */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-[46px] h-[34px] rounded-[2px] transition-all ease-out z-20
                    ${showCard
                      ? "bottom-[17px] opacity-100 duration-[1500ms]"
                      : "bottom-[90px] opacity-0 duration-300"
                    }`}
                >
                  <div className="w-full h-full rounded-[2px] bg-gradient-to-b from-[#2a5a9e] to-[#1e4480] shadow-lg border border-[#1a3a6a] relative overflow-hidden">
                    <div className="absolute top-[3px] left-[5px] text-[5px] font-bold text-white/90 tracking-wider">SD</div>
                    <div className="absolute top-[10px] left-[5px] text-[3.5px] font-mono text-white/50">128GB</div>
                    <div className="absolute bottom-0 left-[5px] right-[5px] h-[7px] flex gap-[1px]">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex-1 bg-[#c4a435] rounded-t-[1px]" />
                      ))}
                    </div>
                    <div className="absolute top-0 right-0 w-[8px] h-[8px] bg-[#1a3a6a] rounded-bl-[4px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== TOP SURFACE with circular cutout (stays fixed, never moves) ===== */}
          <div className="absolute top-0 left-0 right-0 bottom-[60px] rounded-[4px] pointer-events-none z-20">
            <svg className="w-full h-full" viewBox={`0 0 ${consoleW} ${consoleTopH}`}>
              <defs>
                {/* Mask: white = visible, black = hidden */}
                <mask id="console-top-mask">
                  <rect width={consoleW} height={consoleTopH} fill="white" />
                  <circle cx={circleCx} cy={circleCy} r={circleR} fill="black" />
                </mask>
              </defs>
              {/* Console top surface with circular hole */}
              <rect
                width={consoleW}
                height={consoleTopH}
                rx="4"
                fill="url(#top-surface-gradient)"
                mask="url(#console-top-mask)"
                className="stroke-[#ddd8d0] dark:stroke-[#5a554e]"
                strokeWidth="1"
              />
              {/* Gradients for light/dark - we use a solid fill and rely on the underlying div for gradient */}
            </svg>
            {/* Overlay the top surface using a div with clip-path for proper gradient + dark mode */}
          </div>

          {/* Top surface using clip-path (proper CSS gradients + dark mode support) */}
          <div
            className="absolute top-0 left-0 right-0 bottom-[60px] rounded-[4px] bg-gradient-to-b from-[#f5f2ed] to-[#eae6e0] dark:from-[#4a4740] dark:to-[#403d38] border border-[#ddd8d0] dark:border-[#5a554e] pointer-events-none z-20 overflow-hidden"
            style={{
              clipPath: `path('M 0 0 L ${consoleW} 0 L ${consoleW} ${consoleTopH} L 0 ${consoleTopH} Z M ${circleCx + circleR} ${circleCy} A ${circleR} ${circleR} 0 1 0 ${circleCx - circleR} ${circleCy} A ${circleR} ${circleR} 0 1 0 ${circleCx + circleR} ${circleCy} Z')`,
            }}
          >
            {/* Diagonal panel lines from corners */}
            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${consoleW} ${consoleTopH}`} preserveAspectRatio="none">
              <line x1="0" y1="0" x2={circleCx - circleR * 0.7} y2={circleCy - circleR * 0.7} stroke="currentColor" strokeWidth="1" className="text-[#ddd8d0] dark:text-[#4e4b45]" />
              <line x1={consoleW} y1="0" x2={circleCx + circleR * 0.7} y2={circleCy - circleR * 0.7} stroke="currentColor" strokeWidth="1" className="text-[#ddd8d0] dark:text-[#4e4b45]" />
              <line x1="0" y1={consoleTopH} x2={circleCx - circleR * 0.7} y2={circleCy + circleR * 0.7} stroke="currentColor" strokeWidth="1" className="text-[#ddd8d0] dark:text-[#4e4b45]" />
              <line x1={consoleW} y1={consoleTopH} x2={circleCx + circleR * 0.7} y2={circleCy + circleR * 0.7} stroke="currentColor" strokeWidth="1" className="text-[#ddd8d0] dark:text-[#4e4b45]" />
            </svg>

            {/* Screw dots on sides */}
            <div className="absolute top-[38%] right-[6px] flex flex-col gap-[30px]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-[4px] h-[4px] rounded-full bg-[#d0cbc4] dark:bg-[#4a4744] shadow-inner" />
              ))}
            </div>
            <div className="absolute top-[38%] left-[6px] flex flex-col gap-[30px]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-[4px] h-[4px] rounded-full bg-[#d0cbc4] dark:bg-[#4a4744] shadow-inner" />
              ))}
            </div>
          </div>

          {/* ===== ROUND LID (only this rotates open) ===== */}
          <div
            className="absolute z-30"
            style={{
              top: circleCy - circleR,
              left: circleCx - circleR,
              width: circleR * 2,
              height: circleR * 2,
              perspective: "600px",
            }}
          >
            <div
              className="w-full h-full origin-top transition-transform duration-700 ease-in-out"
              style={{
                transformStyle: "preserve-3d",
                transform: isLidOpen ? "rotateX(75deg)" : "rotateX(0deg)",
              }}
            >
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-b from-[#f5f2ed] to-[#eae6e0] dark:from-[#4a4740] dark:to-[#403d38] border-[2px] border-[#ddd8d0] dark:border-[#555048] shadow-md overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
              >
                {/* Inner ridge */}
                <div className="absolute top-[4px] left-[4px] right-[4px] bottom-[4px] rounded-full border border-[#e5e0d8] dark:border-[#4e4b45]" />

                {/* Swirl + Dreamcast text */}
                <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                  <DreamcastSpiral
                    size={50}
                    color="#e86117"
                    className="transition-all duration-500 drop-shadow-[0_0_8px_rgba(232,97,23,0.3)]"
                  />
                  <span className="text-[8px] font-semibold tracking-[0.08em] text-[#555] dark:text-[#666]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    Dreamcast
                  </span>
                </div>

                {/* Dark triangular arrow at bottom */}
                <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2">
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: "12px solid transparent",
                      borderRight: "12px solid transparent",
                      borderTop: "16px solid #e86117",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== FRONT FACE ===== */}
          <div className="absolute bottom-0 left-0 right-0 h-[64px] rounded-b-[4px] overflow-hidden z-10"
            style={{ background: "linear-gradient(to bottom, #eae6e0, #e0dcd5)" }}
          >
            <div className="absolute inset-0 rounded-b-[4px] dark:bg-gradient-to-b dark:from-[#3a3733] dark:to-[#302e2a]" />

            <div className="relative z-10 h-full">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d0cbc4] dark:bg-[#44413b]" />
              <div className="absolute top-[2px] left-0 right-0 h-[1px] bg-white/30 dark:bg-white/5" />

              {/* POWER button */}
              <div className="absolute top-[10px] left-[20px] flex flex-col items-center gap-[3px]">
                <div className={`w-[32px] h-[32px] rounded-full transition-all duration-300 flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]
                  bg-gradient-to-b from-[#eee9e3] to-[#e0dbd4] dark:from-[#44413b] dark:to-[#3a3733]
                  border border-[#ccc7c0] dark:border-[#555048]
                  ${phase !== "idle" ? "shadow-[inset_0_1px_3px_rgba(0,0,0,0.15),0_0_8px_rgba(232,97,23,0.3)]" : ""}`}
                >
                  <div className={`w-[7px] h-[7px] rounded-full transition-all duration-300 ${
                    phase !== "idle"
                      ? "bg-[#ff6a20] shadow-[0_0_10px_#ff6a20]"
                      : "bg-[#aaa] dark:bg-[#555]"
                  }`} />
                </div>
                <span className="text-[5.5px] font-bold tracking-[0.15em] text-[#a09b94] dark:text-[#5a554e] uppercase">Power</span>
              </div>

              {/* 4 Controller ports */}
              <div className="absolute top-[12px] left-1/2 -translate-x-1/2 flex gap-[8px]">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-[26px] h-[18px] rounded-[2px] bg-[#4a4a4a] dark:bg-[#1a1917] border border-[#3a3a3a] dark:border-[#2a2825] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] relative">
                    <div className="absolute inset-[2px] rounded-[1px] flex flex-col justify-center gap-[1px] px-[2px]">
                      <div className="h-[1px] bg-[#5a5a5a] dark:bg-[#252320]" />
                      <div className="h-[1px] bg-[#5a5a5a] dark:bg-[#252320]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* OPEN button */}
              <div className="absolute top-[10px] right-[20px] flex flex-col items-center gap-[3px]">
                <div className={`w-[32px] h-[32px] rounded-full transition-all duration-300 flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]
                  bg-gradient-to-b from-[#eee9e3] to-[#e0dbd4] dark:from-[#44413b] dark:to-[#3a3733]
                  border border-[#ccc7c0] dark:border-[#555048]
                  ${phase !== "idle"
                    ? "border-[#e86117]/60"
                    : "group-hover:border-[#e86117]/40"
                  }`}
                >
                  <span className={`text-[5.5px] font-bold transition-colors duration-300 uppercase
                    ${phase !== "idle"
                      ? "text-[#e86117]"
                      : "text-[#aaa] dark:text-[#555] group-hover:text-[#e86117]/60"
                    }`}>
                    Open
                  </span>
                </div>
                <span className="text-[5.5px] font-bold tracking-[0.15em] text-[#a09b94] dark:text-[#5a554e] uppercase">Open</span>
              </div>

              {/* SEGA text */}
              <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2">
                <span className="text-[9px] font-black tracking-[0.3em] text-[#888] dark:text-[#555] uppercase">Sega</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          {phase === "idle" && (
            <span className="text-xs text-muted-foreground/60 group-hover:text-dc-orange/70 transition-colors">
              {t("drive.selectFolder")}
            </span>
          )}
          {phase === "opening" && (
            <span className="text-xs text-dc-orange animate-pulse font-medium">Opening...</span>
          )}
          {phase === "waiting" && (
            <span className="text-xs text-dc-orange font-medium">{t("drive.selectFolder")}...</span>
          )}
          {phase === "inserting" && (
            <span className="text-xs text-dc-orange font-medium">
              <span className="animate-pulse">Loading...</span>
              {isLoading && loadingProgress > 0 && (
                <span className="ml-2 text-dc-orange/70">{Math.round(loadingProgress)}%</span>
              )}
            </span>
          )}
          {phase === "closing" && (
            <span className="text-xs text-dc-orange font-medium">Ready!</span>
          )}
        </div>
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
