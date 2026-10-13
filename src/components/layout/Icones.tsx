// Ícones de traço fino do redesign (1,5 px, sem preenchimento).

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  "aria-hidden": true,
} as const;

export function IconeConta() {
  return (
    <svg {...base}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export function IconeSacola() {
  return (
    <svg {...base}>
      <path d="M5 8h14l-1 13H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function IconeMenu() {
  return (
    <svg {...base} width={22} height={22}>
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}

export function IconeFechar() {
  return (
    <svg {...base} width={22} height={22}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
