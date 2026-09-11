"use client";

import React, { useState } from "react";
import { EstadoDia, EstadoFolio } from "@/lib/tipos";
import { ETIQUETA_DIA, ETIQUETA_FOLIO, Tono, TONO_DIA, TONO_FOLIO } from "@/lib/reglas";
import { Equis } from "./Iconos";

const COLOR: Record<Tono, { fg: string; bg: string }> = {
  neutro: { fg: "var(--texto-3)", bg: "var(--neutro-bg)" },
  alerta: { fg: "var(--alerta-fg)", bg: "var(--alerta-bg)" },
  error: { fg: "var(--error-fg)", bg: "var(--error-bg)" },
  exito: { fg: "var(--exito-fg)", bg: "var(--exito-bg)" },
  info: { fg: "var(--info-fg)", bg: "var(--info-bg)" },
  violeta: { fg: "var(--violeta-fg)", bg: "var(--violeta-bg)" },
};

/** Glifo corto dentro de la burbuja: el color nunca es el único canal. */
const GLIFO: Record<EstadoFolio, string> = {
  abierto: "—",
  parcial: "",
  "falta-tirilla": "T",
  descuadre: "!",
  cuadrado: "✓",
  conciliado: "✓",
  validado: "✓✓",
};

const EXPLICA: Record<EstadoFolio, string> = {
  abierto: "Sólo está la factura. Falta cargar el primer recibo de caja.",
  parcial: "Lo cobrado todavía no llega al total de la factura.",
  "falta-tirilla": "Ya está cobrado. Falta la tirilla de un recibo que pasó por terminal.",
  descuadre: "Un documento contradice a otro: la tirilla no cuadra con su recibo, o los recibos cobran de más.",
  cuadrado: "Completo y soportado. No hay nada más que hacer.",
  conciliado: "El día cerró y el cruce contra el sistema quedó en cero.",
  validado: "Revisado y aceptado por una persona distinta de quien capturó.",
};

const EXPLICA_DIA: Record<EstadoDia, string> = {
  "sin-movimiento": "Este día no tiene folios.",
  "sin-cerrar": "El día sigue abierto: hay folios pendientes o falta el cierre.",
  "cerrado-con-diferencia": "Cerró sin cuadrar, con explicación y evidencia adjuntas.",
  conciliado: "Cerró cuadrado contra el archivo del sistema.",
  validado: "Revisado y aceptado por un segundo usuario.",
};

function Anillo({
  avance,
  color,
  fondo,
  children,
}: {
  avance: number;
  color: string;
  fondo: string;
  children: React.ReactNode;
}) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, avance)));
  return (
    <>
      <svg width={38} height={38} viewBox="0 0 38 38" aria-hidden="true">
        <circle cx="19" cy="19" r={r + 3.5} fill={fondo} />
        <circle
          className="anillo-fondo"
          cx="19"
          cy="19"
          r={r}
          fill="none"
          strokeWidth="3"
        />
        <circle
          className="anillo-valor"
          cx="19"
          cy="19"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 19 19)"
        />
      </svg>
      <span className="valor" style={{ color }}>
        {children}
      </span>
    </>
  );
}

/**
 * Única pieza de la fila que lleva color. Muestra el avance del cobro como
 * anillo y el estado como glifo; al tocarla explica qué significa.
 */
export function BurbujaFolio({
  estado,
  avance,
  fb = "DIA.FOLIO.ESTADO",
}: {
  estado: EstadoFolio;
  avance: number;
  fb?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const tono = TONO_FOLIO[estado];
  const { fg, bg } = COLOR[tono];
  const pctTexto = Math.round(avance * 100);
  const dentro = estado === "parcial" ? String(pctTexto) : GLIFO[estado];

  return (
    <>
      <button
        className="burbuja-estado"
        data-fb={fb}
        data-fb-nombre={`Burbuja de estado: ${ETIQUETA_FOLIO[estado]}`}
        aria-label={`${ETIQUETA_FOLIO[estado]}. Ver explicación`}
        title={ETIQUETA_FOLIO[estado]}
        onClick={(e) => {
          e.stopPropagation();
          setAbierto(true);
        }}
      >
        <Anillo
          avance={estado === "abierto" ? 0 : estado === "parcial" ? avance : 1}
          color={fg}
          fondo={bg}
        >
          <span style={{ fontSize: estado === "validado" ? 10 : 12 }}>{dentro}</span>
        </Anillo>
      </button>

      {abierto && (
        <div
          className="velo"
          data-fb-ignorar
          onClick={(e) => {
            e.stopPropagation();
            setAbierto(false);
          }}
        >
          <div className="hoja" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabeza">
              <span className={`chip chip-${tono}`}>{ETIQUETA_FOLIO[estado]}</span>
              <div style={{ flexGrow: 1 }} />
              <button className="btn-icono" aria-label="Cerrar" onClick={() => setAbierto(false)}>
                <Equis s={20} />
              </button>
            </div>
            <div className="hoja-cuerpo">
              <div style={{ fontSize: 15, lineHeight: 1.55, textWrap: "pretty" }}>
                {EXPLICA[estado]}
              </div>
              {estado === "parcial" && (
                <div className="caption n">Cobrado {pctTexto} % del total</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function BurbujaDia({ estado, fb = "DIA.ESTADO" }: { estado: EstadoDia; fb?: string }) {
  const [abierto, setAbierto] = useState(false);
  const tono = TONO_DIA[estado];
  const { fg, bg } = COLOR[tono];
  const glifo =
    estado === "sin-movimiento" ? "—" : estado === "sin-cerrar" ? "·" : estado === "cerrado-con-diferencia" ? "!" : estado === "validado" ? "✓✓" : "✓";

  return (
    <>
      <button
        className="burbuja-estado"
        style={{ width: 36, height: 36 }}
        data-fb={fb}
        data-fb-nombre={`Burbuja de estado del día: ${ETIQUETA_DIA[estado]}`}
        aria-label={`Día ${ETIQUETA_DIA[estado]}. Ver explicación`}
        onClick={(e) => {
          e.stopPropagation();
          setAbierto(true);
        }}
      >
        <Anillo avance={estado === "sin-movimiento" ? 0 : 1} color={fg} fondo={bg}>
          <span style={{ fontSize: estado === "validado" ? 9 : 11 }}>{glifo}</span>
        </Anillo>
      </button>
      {abierto && (
        <div className="velo" data-fb-ignorar onClick={() => setAbierto(false)}>
          <div className="hoja" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabeza">
              <span className={`chip chip-${tono}`}>{ETIQUETA_DIA[estado]}</span>
              <div style={{ flexGrow: 1 }} />
              <button className="btn-icono" aria-label="Cerrar" onClick={() => setAbierto(false)}>
                <Equis s={20} />
              </button>
            </div>
            <div className="hoja-cuerpo">
              <div style={{ fontSize: 15, lineHeight: 1.55, textWrap: "pretty" }}>
                {EXPLICA_DIA[estado]}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { COLOR };
