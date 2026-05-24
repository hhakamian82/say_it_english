import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";

interface WatermarkPosition {
  x: number; // percentage
  y: number; // percentage
}

interface DynamicWatermarkProps {
  /** How often the watermark moves (ms). Default: 4000 */
  interval?: number;
  /** Opacity 0-1. Default: 0.18 */
  opacity?: number;
  /** Whether watermark is enabled. Default: true */
  enabled?: boolean;
}

/**
 * DynamicWatermark
 * ─────────────────
 * Renders the current user's phone/username as a slowly-drifting,
 * semi-transparent overlay on top of any video player.
 * Positioning is randomised on mount and changes every `interval` ms.
 * The element is pointer-events:none so it never blocks video controls.
 */
export function DynamicWatermark({
  interval = 4000,
  opacity = 0.18,
  enabled = true,
}: DynamicWatermarkProps) {
  const { user } = useAuth();
  const [position, setPosition] = useState<WatermarkPosition>({ x: 10, y: 10 });
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate a random position within safe bounds (10%-80% to avoid edges)
  const randomPosition = (): WatermarkPosition => ({
    x: Math.floor(Math.random() * 70) + 10,
    y: Math.floor(Math.random() * 70) + 10,
  });

  useEffect(() => {
    if (!enabled || !user) return;

    // Set initial random position
    setPosition(randomPosition());

    timerRef.current = setInterval(() => {
      // Fade out → move → fade in
      setVisible(false);
      setTimeout(() => {
        setPosition(randomPosition());
        setVisible(true);
      }, 400);
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, interval, user]);

  if (!enabled || !user) return null;

  // Display phone number masked, or username
  const displayText = user.phone
    ? `${user.phone.slice(0, 4)}***${user.phone.slice(-3)}`
    : user.username;

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          left: `${position.x}%`,
          top: `${position.y}%`,
          opacity: visible ? opacity : 0,
          transition: "opacity 0.4s ease",
          transform: "translateX(-50%) translateY(-50%)",
          whiteSpace: "nowrap",
        }}
      >
        {/* Main text watermark */}
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(11px, 1.4vw, 14px)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.95)",
            letterSpacing: "0.08em",
            textShadow:
              "0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
          }}
        >
          {displayText}
        </span>
      </div>

      {/* Second subtle watermark at a fixed corner for extra protection */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          right: "5%",
          opacity: opacity * 0.6,
          transform: "rotate(-15deg)",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(9px, 1.1vw, 11px)",
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.12em",
            textShadow: "0 1px 2px rgba(0,0,0,0.9)",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          SayItEnglish • {displayText}
        </span>
      </div>
    </div>
  );
}
