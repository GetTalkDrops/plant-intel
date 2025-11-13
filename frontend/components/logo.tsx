export function Logo({
  variant = "default",
}: {
  variant?: "default" | "icon";
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Icon */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Center large circle */}
          <circle cx="50" cy="50" r="18" fill="#3B82F6" />

          {/* Top circles */}
          <circle cx="35" cy="25" r="8" fill="#60A5FA" />
          <circle cx="55" cy="20" r="6" fill="#93C5FD" />

          {/* Left circles */}
          <circle cx="20" cy="45" r="7" fill="#60A5FA" />
          <circle cx="28" cy="60" r="5" fill="#93C5FD" />

          {/* Right circles */}
          <circle cx="75" cy="40" r="9" fill="#60A5FA" />
          <circle cx="80" cy="58" r="6" fill="#93C5FD" />
          <circle cx="68" cy="70" r="7" fill="#60A5FA" />

          {/* Bottom circles */}
          <circle cx="45" cy="78" r="8" fill="#60A5FA" />
          <circle cx="58" cy="85" r="5" fill="#93C5FD" />

          {/* Small accent circles */}
          <circle cx="65" cy="30" r="4" fill="#BFDBFE" />
          <circle cx="38" cy="38" r="4" fill="#BFDBFE" />
          <circle cx="62" cy="62" r="4" fill="#BFDBFE" />
        </svg>
      </div>

      {/* Text */}
      {variant === "default" && (
        <span className="text-slate-800 tracking-tight uppercase text-lg font-bold">
          plant intel
        </span>
      )}
    </div>
  );
}
