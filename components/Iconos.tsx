import React from "react";

type P = { s?: number; className?: string; style?: React.CSSProperties };

function Svg({ s = 20, children, className, style }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Izq = (p: P) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);
export const Der = (p: P) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const Abajo = (p: P) => (
  <Svg {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </Svg>
);
export const Atras = (p: P) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const Camara = (p: P) => (
  <Svg {...p}>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a1.5 1.5 0 0 0 1.3-.75l.6-1A1.5 1.5 0 0 1 9.9 3.5h4.2a1.5 1.5 0 0 1 1.3.75l.6 1A1.5 1.5 0 0 0 17.3 6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    <circle cx="12" cy="12.5" r="3.2" />
  </Svg>
);
export const Subir = (p: P) => (
  <Svg {...p}>
    <path d="M12 16.5V5M7.5 9.5 12 5l4.5 4.5" />
    <path d="M4 15v2.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V15" />
  </Svg>
);
export const Documento = (p: P) => (
  <Svg {...p}>
    <path d="M13.5 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9.5z" />
    <path d="M13.5 3.5v6h6" />
  </Svg>
);
export const Calendario = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
  </Svg>
);
export const CalendarioOk = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    <path d="M8.5 14.5l2.5 2.5 4.5-4.5" />
  </Svg>
);
export const Alerta = (p: P) => (
  <Svg {...p}>
    <path d="M12 9v4.5M12 17h.01" />
    <path d="M10.3 4.3 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
  </Svg>
);
export const Info = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 16v-4.5M12 8.5h.01" />
  </Svg>
);
export const Palomita = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 12.5l5 5 10-10" />
  </Svg>
);
export const Equis = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M6 18 18 6" />
  </Svg>
);
export const Mas = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const Tarjeta = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="6.5" width="17" height="12" rx="2.5" />
    <path d="M3.5 10.5h17M7 15h4" />
  </Svg>
);
export const Imagen = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
    <path d="M3.5 15l4.5-4 4 3.5 3.5-3 5 4.5" />
    <circle cx="9" cy="9.5" r="1.4" />
  </Svg>
);
export const Ayuda = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 7.5A3 3 0 0 1 7.5 4.5h9a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H11l-4 3.5V16.5H7.5a3 3 0 0 1-3-3z" />
    <path d="M10.2 9.2a1.9 1.9 0 1 1 2.4 2c-.6.2-.9.7-.9 1.2v.3" />
    <path d="M11.7 14.6h.01" />
  </Svg>
);
export const Girando = (p: P) => (
  <Svg {...p} className="gira">
    <path d="M12 4.5a7.5 7.5 0 1 1-7.1 5.1" />
  </Svg>
);
export const Copiar = (p: P) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5v-2A2.5 2.5 0 0 0 13 4H7A2.5 2.5 0 0 0 4.5 6.5v6A2.5 2.5 0 0 0 7 15h2" />
  </Svg>
);
export const Descargar = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4.5 17v1.5A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5V17" />
  </Svg>
);
export const Diana = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2" />
  </Svg>
);
export const Basura = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M6.5 7l.8 11.6A2 2 0 0 0 9.3 20.5h5.4a2 2 0 0 0 2-1.9L17.5 7" />
  </Svg>
);
export const Candado = (p: P) => (
  <Svg {...p}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </Svg>
);

/* ---- marcas de forma: el color nunca es el único canal ---- */
export function Marca({ forma, s = 8 }: { forma: "circulo" | "triangulo" | "octagono" | "cuadrado" | "aro" | "doble"; s?: number }) {
  const común = { width: s, height: s, viewBox: "0 0 8 8", "aria-hidden": true as const };
  switch (forma) {
    case "circulo":
      return (
        <svg {...común}>
          <circle cx="4" cy="4" r="3.4" fill="currentColor" />
        </svg>
      );
    case "triangulo":
      return (
        <svg {...común}>
          <path d="M4 .7 7.6 7H.4z" fill="currentColor" />
        </svg>
      );
    case "octagono":
      return (
        <svg {...común}>
          <path d="M2.6.5h2.8l2.1 2.1v2.8L5.4 7.5H2.6L.5 5.4V2.6z" fill="currentColor" />
        </svg>
      );
    case "cuadrado":
      return (
        <svg {...común}>
          <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
        </svg>
      );
    case "doble":
      return (
        <svg {...común}>
          <circle cx="4" cy="4" r="3.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="4" cy="4" r="1.8" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg {...común}>
          <circle cx="4" cy="4" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}

/* ---- medios de pago ---- */
export const Efectivo = (p: P) => (
  <Svg {...p}>
    <rect x="2.5" y="6.5" width="19" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 10v4M18 10v4" />
  </Svg>
);
export const Transferencia = (p: P) => (
  <Svg {...p}>
    <path d="M4 8.5h13M13.5 5 17 8.5 13.5 12" />
    <path d="M20 15.5H7M10.5 12 7 15.5 10.5 19" />
  </Svg>
);
export const Nota = (p: P) => (
  <Svg {...p}>
    <path d="M5 4.5h14v12l-4 4H5z" />
    <path d="M19 16.5h-4v4" />
    <path d="M8.5 9h7M8.5 12.5h4" />
  </Svg>
);
export const Reloj = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);
