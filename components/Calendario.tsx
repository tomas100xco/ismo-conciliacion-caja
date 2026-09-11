"use client";

import React, { useMemo, useState } from "react";
import { aFecha, aISO, hoyISO, MESES_CORTO, nombreMes } from "@/lib/formato";
import { estadoDia, ETIQUETA_DIA, TONO_DIA } from "@/lib/reglas";
import { useApp } from "@/lib/store";
import { EstadoDia } from "@/lib/tipos";
import { Marca, Izq, Der, Abajo, Equis } from "./Iconos";
import { FORMA_DIA } from "./Chips";

const TONO_BG: Record<EstadoDia, string> = {
  "sin-movimiento": "transparent",
  "sin-cerrar": "var(--alerta-bg)",
  "cerrado-con-diferencia": "var(--error-bg)",
  conciliado: "var(--info-bg)",
  validado: "var(--violeta-bg)",
};
const TONO_FG: Record<EstadoDia, string> = {
  "sin-movimiento": "var(--texto-3)",
  "sin-cerrar": "var(--alerta-fg)",
  "cerrado-con-diferencia": "var(--error-fg)",
  conciliado: "var(--info-fg)",
  validado: "var(--violeta-fg)",
};

const ORDEN: EstadoDia[] = [
  "sin-cerrar",
  "cerrado-con-diferencia",
  "conciliado",
  "validado",
  "sin-movimiento",
];

export function Calendario({ onCerrar }: { onCerrar: () => void }) {
  const { estado, seleccionarDia } = useApp();
  const hoy = hoyISO();
  const sel = aFecha(estado.diaSeleccionado);
  const [ancla, setAncla] = useState({ a: sel.getFullYear(), m: sel.getMonth() });
  const [verMeses, setVerMeses] = useState(false);

  const estadoPorDia = useMemo(() => {
    const mapa: Record<string, EstadoDia> = {};
    const primero = new Date(ancla.a, ancla.m, 1);
    const ultimo = new Date(ancla.a, ancla.m + 1, 0);
    for (let d = 1; d <= ultimo.getDate(); d++) {
      const iso = aISO(new Date(ancla.a, ancla.m, d));
      mapa[iso] = estadoDia(iso, estado.folios, estado.dias[iso]);
    }
    void primero;
    return mapa;
  }, [ancla, estado.folios, estado.dias]);

  /** Meses del año con días sin cerrar: el pendiente viejo se ve sin entrar. */
  const mesesConPendiente = useMemo(() => {
    const s = new Set<number>();
    for (const iso of Object.keys(estado.dias)) {
      const d = aFecha(iso);
      if (d.getFullYear() !== ancla.a) continue;
      if (estadoDia(iso, estado.folios, estado.dias[iso]) === "sin-cerrar") s.add(d.getMonth());
    }
    return s;
  }, [estado.dias, estado.folios, ancla.a]);

  const primerDia = new Date(ancla.a, ancla.m, 1);
  const arranque = (primerDia.getDay() + 6) % 7; // lunes primero
  const diasDelMes = new Date(ancla.a, ancla.m + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array(arranque).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));

  function mueveMes(n: number) {
    const d = new Date(ancla.a, ancla.m + n, 1);
    setAncla({ a: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <div className="velo" data-fb-ignorar onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 16px 8px" }}>
          <div style={{ flexGrow: 1, fontSize: 16, fontWeight: 700 }}>Elegir día de trabajo</div>
          <button className="btn-icono" aria-label="Cerrar" onClick={onCerrar}>
            <Equis s={22} />
          </button>
        </div>

        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-linea"
              style={{ width: 44, padding: 0 }}
              aria-label="Mes anterior"
              data-fb="CAL.MES.ANTERIOR"
              data-fb-nombre="Flecha de mes anterior"
              onClick={() => mueveMes(-1)}
            >
              <Izq />
            </button>
            <button
              className="btn"
              style={{ flexGrow: 1, background: "transparent", fontSize: 16, fontWeight: 700 }}
              data-fb="CAL.MES.SELECTOR"
              data-fb-nombre="Nombre del mes · abre la rejilla de 12 meses"
              onClick={() => setVerMeses((v) => !v)}
            >
              {nombreMes(ancla.m)} {ancla.a}
              <Abajo s={18} style={{ color: "var(--texto-2)" }} />
            </button>
            <button
              className="btn btn-linea"
              style={{ width: 44, padding: 0 }}
              aria-label="Mes siguiente"
              data-fb="CAL.MES.SIGUIENTE"
              data-fb-nombre="Flecha de mes siguiente"
              onClick={() => mueveMes(1)}
            >
              <Der />
            </button>
          </div>

          {verMeses ? (
            <div className="aparece" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  className="btn btn-linea"
                  style={{ width: 44, padding: 0 }}
                  aria-label="Año anterior"
                  onClick={() => setAncla((x) => ({ ...x, a: x.a - 1 }))}
                >
                  <Izq />
                </button>
                <div className="n" style={{ flexGrow: 1, textAlign: "center", fontSize: 16, fontWeight: 700 }}>
                  {ancla.a}
                </div>
                <button
                  className="btn btn-linea"
                  style={{ width: 44, padding: 0 }}
                  aria-label="Año siguiente"
                  onClick={() => setAncla((x) => ({ ...x, a: x.a + 1 }))}
                >
                  <Der />
                </button>
              </div>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}
                data-fb="CAL.MESES.REJILLA"
                data-fb-nombre="Rejilla de 12 meses"
              >
                {MESES_CORTO.map((m, i) => {
                  const activo = i === ancla.m;
                  const futuro = new Date(ancla.a, i, 1) > new Date();
                  return (
                    <button
                      key={m}
                      className="btn"
                      style={{
                        height: 48,
                        background: activo ? "var(--marca)" : "var(--lienzo)",
                        color: activo ? "var(--sobre-marca)" : futuro ? "var(--borde-2)" : "var(--neutro-fg)",
                        fontWeight: activo ? 700 : 600,
                      }}
                      onClick={() => {
                        setAncla((x) => ({ ...x, m: i }));
                        setVerMeses(false);
                      }}
                    >
                      {m}
                      {mesesConPendiente.has(i) && (
                        <span style={{ color: "var(--alerta)" }}>
                          <Marca forma="triangulo" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="caption">
                El triángulo ámbar marca los meses con días sin cerrar.
              </div>
            </div>
          ) : (
            <div className="aparece" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="semana">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: ".06em",
                      color: "var(--texto-3)",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
                data-fb="CAL.DIAS"
                data-fb-nombre="Rejilla de días con color por estado"
              >
                {semanas.map((sem, i) => (
                  <div className="semana" key={i}>
                    {sem.map((d, j) => {
                      if (d === null) return <div key={j} />;
                      const iso = aISO(new Date(ancla.a, ancla.m, d));
                      const est = estadoPorDia[iso] ?? "sin-movimiento";
                      const futuro = iso > hoy;
                      const esSel = iso === estado.diaSeleccionado;
                      return (
                        <button
                          key={j}
                          className="dia-celda n"
                          data-sel={esSel}
                          disabled={futuro}
                          title={`${d} · ${ETIQUETA_DIA[est]}`}
                          style={{
                            background: futuro ? "transparent" : TONO_BG[est],
                            color: futuro ? "var(--borde-2)" : TONO_FG[est],
                          }}
                          onClick={() => {
                            seleccionarDia(iso);
                            onCerrar();
                          }}
                        >
                          <span style={{ fontSize: 16, fontWeight: esSel ? 700 : 600 }}>{d}</span>
                          {!futuro && est !== "sin-movimiento" && <Marca forma={FORMA_DIA[est]} />}
                          {!futuro && est === "sin-movimiento" && (
                            <span style={{ color: "var(--borde-2)" }}>
                              <Marca forma="aro" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 12, borderTop: "1px solid var(--borde-1)" }}
                data-fb="CAL.LEYENDA"
                data-fb-nombre="Leyenda de estados del día"
              >
                {ORDEN.map((e) => (
                  <span key={e} className={`chip chip-${TONO_DIA[e]}`}>
                    <Marca forma={FORMA_DIA[e]} />
                    {ETIQUETA_DIA[e]}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 4 }}>
                <div className="caption" style={{ flexGrow: 1, textWrap: "pretty" }}>
                  El color es el estado del día completo, no el de un folio suelto.
                </div>
                <button
                  className="btn btn-linea-fuerte"
                  data-fb="CAL.HOY"
                  data-fb-nombre="Botón Hoy"
                  onClick={() => {
                    seleccionarDia(hoy);
                    onCerrar();
                  }}
                >
                  Hoy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
