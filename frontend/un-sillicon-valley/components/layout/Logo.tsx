type LogoProps = {
  showWordmark?: boolean;
  compactOnMobile?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: 32,
  md: 36,
  lg: 44,
} as const;

export function LogoIcon({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block shrink-0 flex-none ${className ?? ""}`}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" className="logo-mark" />
      <rect x="9" y="24" width="5.5" height="8" rx="1.5" className="logo-bar" opacity="0.45" />
      <rect x="17.25" y="19" width="5.5" height="13" rx="1.5" className="logo-bar" opacity="0.72" />
      <rect x="25.5" y="13" width="5.5" height="19" rx="1.5" className="logo-bar" />
    </svg>
  );
}

export function Logo({
  showWordmark = true,
  compactOnMobile = false,
  size = "md",
  className = "",
}: LogoProps) {
  const iconSize = sizeMap[size];

  return (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <LogoIcon size={iconSize} />
      {showWordmark ? (
        <span className={`min-w-0 flex flex-col ${compactOnMobile ? "hidden sm:flex" : ""}`}>
          <span
            className={`truncate font-semibold tracking-tight text-foreground ${
              size === "lg" ? "text-base" : "text-sm"
            }`}
          >
            UN Silicon Valley
          </span>
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            Comunidad UNAL
          </span>
        </span>
      ) : null}
    </span>
  );
}
