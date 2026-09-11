"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useFeedback } from "@/lib/feedback";
import { useApp } from "@/lib/store";
import { Ayuda as IconoAyuda, Copiar, Descargar, Diana, Equis, Basura, Info } from "./Iconos";

type Tab = "ayuda" | "feedback" | "demo";

const AYUDAS: Record<string, { titulo: string; pasos: { t: string; d: string }[]; nota: string }> = {
  dia: {
    titulo: "Cómo funciona el día",
    pasos: [
      {
        t: "Elige el día de trabajo arriba",
        d: "El recuadro con el número lleva el color del estado de esa jornada. Las flechas mueven un día; el nombre del mes abre el calendario completo.",
      },
      {
        t: "Cada renglón es un folio",
        d: "Un folio es una factura con sus recibos y sus tirillas. El estado no se elige: sale de lo que dicen los documentos.",
      },
      {
        t: "«Sin cerrar» te deja sólo lo pendiente",
        d: "Agrupa abiertos, parciales, los que esperan tirilla y los descuadrados. El conteo va dentro del propio filtro.",
      },
    ],
    nota: "Los totales de arriba se recalculan solos con cada documento que entra. No hay botón de guardar en ninguna parte de la app.",
  },
  folio: {
    titulo: "Cómo funciona el folio",
    pasos: [
      {
        t: "Toma la foto de la factura",
        d: "Se lee sola y crea el folio. Si algún dato quedó mal, tócalo y corrígelo: no hace falta volver a tomar la foto.",
      },
      {
        t: "Agrega cada recibo de caja",
        d: "El monto y el medio de pago se leen del documento; no los escribas. Puedes agregar todos los recibos que haga falta.",
      },
      {
        t: "Si pasó por terminal, captura su tirilla",
        d: "La casilla de la tirilla está al frente de su recibo. Con efectivo o transferencia queda vacía y nadie te la va a pedir.",
      },
    ],
    nota: "Puedes salir cuando quieras. El folio queda pendiente hasta que lo cobrado iguale la factura y cada tarjeta tenga su tirilla.",
  },
  cierre: {
    titulo: "Cómo funciona el cierre",
    pasos: [
      {
        t: "Sube el archivo que emite el sistema",
        d: "Se lee y su columna queda congelada: es la foto del DMS a esa hora. La columna de folios sigue viva.",
      },
      {
        t: "Revisa el cruce por medio de pago",
        d: "Sólo se resalta lo que no cuadra. Abajo aparece qué lo explica, con el botón que lo arregla al lado.",
      },
      {
        t: "Si cierras con diferencia, explícala",
        d: "El texto y al menos una evidencia son obligatorios. Quedan firmados con tu usuario y hora, y ya no se editan.",
      },
    ],
    nota: "Al cerrar, los folios cuadrados pasan a Conciliado y el día queda esperando la validación de un segundo usuario.",
  },
};

function ayudaDe(path: string) {
  if (path.startsWith("/folio")) return AYUDAS.folio;
  if (path.startsWith("/cierre")) return AYUDAS.cierre;
  return AYUDAS.dia;
}

export function Panel() {
  const path = usePathname() ?? "/";
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState<Tab>("ayuda");
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const fb = useFeedback();
  const app = useApp();
  const ayuda = ayudaDe(path);

  // Apuntar a un elemento abre el compositor sin más clics.
  useEffect(() => {
    if (fb.objetivo) {
      setTab("feedback");
      setAbierto(true);
    }
  }, [fb.objetivo]);

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    if (abierto) document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [abierto]);

  async function copiar() {
    const t = fb.comoTexto();
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2200);
  }

  function descargar() {
    const blob = new Blob([fb.comoTexto()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-conciliacion-caja-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {fb.modo && (
        <div className="cinta-fb" data-fb-ignorar>
          <Diana s={16} />
          <span style={{ flexGrow: 1 }}>
            Modo feedback: toca cualquier parte de la app para dejar una nota
          </span>
          <button
            className="btn btn-linea"
            style={{ height: 28, padding: "0 10px", fontSize: 12 }}
            onClick={() => fb.setModo(false)}
          >
            Salir
          </button>
        </div>
      )}

      <button
        className="burbuja"
        data-fb-ignorar
        aria-label="Ayuda y feedback"
        onClick={() => setAbierto(true)}
      >
        <IconoAyuda s={24} />
      </button>

      {fb.notas.length > 0 && !abierto && (
        <div
          data-fb-ignorar
          aria-hidden
          style={{
            position: "fixed",
            right: "max(10px, calc(50vw - 350px))",
            bottom: 148,
            zIndex: 21,
            minWidth: 22,
            height: 22,
            padding: "0 6px",
            borderRadius: 999,
            background: "var(--violeta)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--sombra-flota)",
          }}
        >
          {fb.notas.length}
        </div>
      )}

      {abierto && (
        <div className="velo" data-fb-ignorar onClick={() => setAbierto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 16px 12px",
              }}
            >
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Ayuda y feedback</div>
                <div className="caption">Conciliación de Caja · simulación sin backend</div>
              </div>
              <button className="btn-icono" aria-label="Cerrar" onClick={() => setAbierto(false)}>
                <Equis s={22} />
              </button>
            </div>

            <div style={{ padding: "0 16px 12px" }}>
              <div className="tabs">
                {(
                  [
                    ["ayuda", "Ayuda"],
                    ["feedback", `Feedback${fb.notas.length ? ` · ${fb.notas.length}` : ""}`],
                    ["demo", "Demo"],
                  ] as [Tab, string][]
                ).map(([k, t]) => (
                  <button
                    key={k}
                    className="tab"
                    data-activo={tab === k}
                    onClick={() => setTab(k)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* ---------------- AYUDA ---------------- */}
            {tab === "ayuda" && (
              <div
                className="aparece"
                style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px 16px" }}
              >
                <div style={{ fontSize: 15, fontWeight: 700 }}>{ayuda.titulo}</div>
                {ayuda.pasos.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: "var(--marca)",
                        color: "var(--sobre-marca)",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{p.t}</div>
                      <div style={{ fontSize: 13, color: "var(--texto-2)", textWrap: "pretty" }}>
                        {p.d}
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: 12,
                    background: "var(--lienzo)",
                    borderRadius: 8,
                  }}
                >
                  <Info s={20} style={{ color: "var(--texto-3)" }} />
                  <div style={{ fontSize: 12, color: "var(--texto-2)", textWrap: "pretty" }}>
                    {ayuda.nota}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- FEEDBACK ---------------- */}
            {tab === "feedback" && (
              <div
                className="aparece"
                style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px 16px" }}
              >
                {fb.objetivo ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="codigo">{fb.objetivo.codigo}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{fb.objetivo.nombre}</span>
                    </div>
                    <textarea
                      className="campo"
                      autoFocus
                      rows={3}
                      placeholder="¿Qué habría que cambiar aquí?"
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          fb.agregar(fb.objetivo!.codigo, fb.objetivo!.nombre, texto);
                          setTexto("");
                        }
                      }}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        className="btn btn-linea"
                        style={{ flexGrow: 1 }}
                        onClick={() => {
                          fb.cancelar();
                          setTexto("");
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn btn-solido"
                        style={{ flexGrow: 1 }}
                        disabled={!texto.trim()}
                        onClick={() => {
                          fb.agregar(fb.objetivo!.codigo, fb.objetivo!.nombre, texto);
                          setTexto("");
                        }}
                      >
                        Guardar nota
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-solido btn-grande"
                    onClick={() => {
                      fb.setModo(true);
                      setAbierto(false);
                    }}
                  >
                    <Diana s={24} />
                    Apuntar a algo en la app
                  </button>
                )}

                {fb.notas.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--texto-2)", textWrap: "pretty" }}>
                    Enciende el modo de apuntar y toca cualquier parte de la app: el botón, un
                    monto, un chip de estado, una fila. Cada pieza tiene su código y la nota queda
                    amarrada a él. Al final, copias todo de un jalón.
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn btn-linea" style={{ flexGrow: 1 }} onClick={copiar}>
                        <Copiar s={20} />
                        {copiado ? "Copiado" : "Copiar todo"}
                      </button>
                      <button className="btn btn-linea" style={{ flexGrow: 1 }} onClick={descargar}>
                        <Descargar s={20} />
                        Descargar
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {fb.notas.map((n) => (
                        <div key={n.id} className="nota-fila">
                          <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                            <span className="codigo" style={{ alignSelf: "flex-start" }}>
                              {n.codigo}
                            </span>
                            <div style={{ fontSize: 13, textWrap: "pretty" }}>{n.texto}</div>
                            <div className="caption">
                              {n.nombre} · {n.pantalla}
                            </div>
                          </div>
                          <button
                            className="btn-icono"
                            aria-label="Borrar nota"
                            onClick={() => fb.borrar(n.id)}
                          >
                            <Basura s={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-linea"
                      onClick={() => {
                        if (confirm("¿Borrar las " + fb.notas.length + " notas?")) fb.borrarTodo();
                      }}
                    >
                      Borrar todas
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ---------------- DEMO ---------------- */}
            {tab === "demo" && (
              <div
                className="aparece"
                style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px 16px" }}
              >
                <div style={{ fontSize: 13, color: "var(--texto-2)", textWrap: "pretty" }}>
                  Esto es una simulación: no hay backend ni base de datos. Los documentos no se
                  leen de verdad — se comportan como se comportarían. Todo vive en este navegador.
                </div>

                <label
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: 12,
                    background: "var(--lienzo)",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={app.estado.simularRechazo}
                    onChange={(e) => app.setSimularRechazo(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--marca)" }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      Rechazar el próximo documento
                    </div>
                    <div className="caption">
                      El siguiente recibo que subas será rechazado, para ver ese estado.
                    </div>
                  </div>
                </label>

                <a className="btn btn-linea" href="/auditoria">
                  Ver el registro de ediciones
                </a>

                <button
                  className="btn btn-linea"
                  onClick={() => {
                    if (confirm("Esto borra todo lo capturado y vuelve al día de ejemplo.")) {
                      app.reiniciar();
                      setAbierto(false);
                    }
                  }}
                >
                  Reiniciar la simulación
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
