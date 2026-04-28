interface Props {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

const SIZES: Record<NonNullable<Props["size"]>, { w: string; h: string; gap: string }> = {
  xs: { w: "w-[2px]", h: "h-3", gap: "gap-[2px]" },
  sm: { w: "w-[3px]", h: "h-4", gap: "gap-[3px]" },
  md: { w: "w-1", h: "h-6", gap: "gap-1" },
  lg: { w: "w-1.5", h: "h-10", gap: "gap-1.5" },
  xl: { w: "w-2", h: "h-16", gap: "gap-2" },
};

/**
 * Four-bar audio equalizer animation. The single ambient visual the app uses
 * across landing, splash, sidebar, and "thinking" indicators. Replaces the
 * old random scattered music icons.
 */
export default function EqualizerBars({ size = "md", color = "bg-sp-green", className = "" }: Props) {
  const s = SIZES[size];
  const bar = `${s.w} ${s.h} ${color} rounded-[1px] origin-bottom`;
  return (
    <div className={`inline-flex items-end ${s.gap} ${className}`} aria-hidden="true">
      <span className={`${bar} animate-eq-1`} />
      <span className={`${bar} animate-eq-2`} />
      <span className={`${bar} animate-eq-3`} />
      <span className={`${bar} animate-eq-4`} />
    </div>
  );
}
