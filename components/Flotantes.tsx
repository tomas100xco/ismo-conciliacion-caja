"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFeedback } from "@/lib/feedback";
import { useApp } from "@/lib/store";
import { Ayuda, Basura, Copiar, Descargar, Diana, Equis } from "./Iconos";

type Hoja = null | "ayuda" | "nota" | "notas";

const PASOS: Record<string, string[]> = {
  dia: [
    "La barra de arriba elige el día. El número lleva el color del estado de esa jornada.",
    "Cada renglón es un folio: una factura con sus recibos y sus tirillas.",
    "La burbuja de la derecha es el estado. Tócala y te dice qué significa.",
  ],
  folio: [
    "Agrega un recibo con la cámara o subiendo el archivo. El monto y el medio se leen solos.",
    "Si el recibo pasó por terminal, al frente aparece su casilla de tirilla. Con efectivo no aparece.",
    "Cualquier dato leído se corrige tocándolo. En la tirilla se comparan monto, últimos 4 dígitos, autorización y hora.",
  ],
  cierre: [
    "Sube el archivo que emite el sistema. Su columna queda congelada a esa hora.",
    "El cruce sólo resalta lo que no cuadra, con el botón que lo arregla al lado.",
    "Si cierras con diferencia, hace falta una explicación y al menos una evidencia.",
  ],
};

function pasosDe(path: string) {
  if (path.startsWith("/folio")) return PASOS.folio;
  if (path.startsWith("/cierre")) return PASOS.cierre;
  return PASOS.dia;
}

export function Flotantes() {
  const path = usePathname() ?? "/";
  const fb = useFeedback();
  const app = useApp();
  const [hoja, setHoja] = useState<Hoja>(null);
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [llama, setLlama] = useState(false);
  const avisoPrevio = useRef(app.estado.avisoAyuda);

  // Un documento rechazado hace parpadear la ayuda en lugar de explicarse en pantalla.
  useEffect(() => {
    if (app.estado.avisoAyuda > avisoPrevio.current) {
      avisoPrevio.current = app.estado.avisoAyuda;
      setLlama(true);
      const t = window.setTimeout(() => setLlama(false), 3200);
      return () => window.clearTimeout(t);
    }
  }, [app.estado.avisoAyuda]);

  useEffect(() => {
    if (fb.objetivo) setHoja("nota");
  }, [fb.objetivo]);

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setHoja(null);
        fb.cancelar();
      }
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [fb]);

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
    window.setTimeout(() => setCopiado(false), 2000);
  }

  function descargar() {
    const blob = new Blob([fb.comoTexto()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-caja-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function cerrarHoja() {
    setHoja(null);
    fb.cancelar();
    setTexto("");
  }

  return (
    <>
      {fb.modo && (
        <div className="cinta" data-fb-ignorar>
          <Diana s={16} />
          <span style={{ flexGrow: 1 }}>Toca cualquier parte</span>
          <button className="btn" onClick={() => setHoja("notas")}>
            {fb.notas.length} nota{fb.notas.length === 1 ? "" : "s"}
          </button>
          <button className="btn" onClick={() => fb.setModo(false)}>
            Salir
          </button>
        </div>
      )}

      <div className="flotantes" data-fb-ignorar>
        <button
          className={`fab fab-chico ${llama ? "llama" : ""}`}
          aria-label="Ayuda"
          onClick={() => setHoja("ayuda")}
        >
          <Ayuda s={20} />
        </button>
        <button
          className="fab fab-grande"
          data-activo={fb.modo}
          aria-label={fb.modo ? "Salir del modo feedback" : "Dejar feedback"}
          onClick={() => (fb.modo ? fb.setModo(false) : fb.setModo(true))}
        >
          <Diana s={24} />
          {fb.notas.length > 0 && <span className="insignia">{fb.notas.length}</span>}
        </button>
      </div>

      {/* ---------------- AYUDA ---------------- */}
      {hoja === "ayuda" && (
        <div className="velo" data-fb-ignorar onClick={cerrarHoja}>
          <div className="hoja" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabeza">
              <div style={{ fontSize: 16, fontWeight: 700, flexGrow: 1 }}>Ayuda</div>
              <button className="btn-icono" aria-label="Cerrar" onClick={cerrarHoja}>
                <Equis s={20} />
              </button>
            </div>
            <div className="hoja-cuerpo">
              {pasosDe(path).map((p, i) => (
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
                  <div style={{ fontSize: 14, lineHeight: 1.5, textWrap: "pretty" }}>{p}</div>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingTop: 12,
                  borderTop: "1px solid var(--borde-1)",
                }}
              >
                <div className="overline">Demo</div>
                <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={app.estado.simularRechazo}
                    onChange={(e) => app.setSimularRechazo(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--marca)" }}
                  />
                  <span style={{ fontSize: 14 }}>Rechazar el próximo documento</span>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <a className="btn btn-linea" style={{ flexGrow: 1 }} href="/auditoria">
                    Ediciones
                  </a>
                  <button
                    className="btn btn-linea"
                    style={{ flexGrow: 1 }}
                    onClick={() => {
                      if (confirm("Borra todo lo capturado y vuelve al día de ejemplo.")) {
                        app.reiniciar();
                        cerrarHoja();
                      }
                    }}
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- NOTA NUEVA ---------------- */}
      {hoja === "nota" && fb.objetivo && (
        <div className="velo" data-fb-ignorar onClick={cerrarHoja}>
          <div className="hoja" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabeza">
              <span className="codigo">{fb.objetivo.codigo}</span>
              <div style={{ flexGrow: 1 }} />
              <button className="btn-icono" aria-label="Cerrar" onClick={cerrarHoja}>
                <Equis s={20} />
              </button>
            </div>
            <div className="hoja-cuerpo">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{fb.objetivo.nombre}</div>
              <textarea
                className="campo"
                autoFocus
                rows={4}
                placeholder="¿Qué cambiarías aquí?"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && texto.trim()) {
                    fb.agregar(fb.objetivo!.codigo, fb.objetivo!.nombre, texto);
                    setTexto("");
                    setHoja(null);
                  }
                }}
              />
              <button
                className="btn btn-solido btn-alto btn-lleno"
                disabled={!texto.trim()}
                onClick={() => {
                  fb.agregar(fb.objetivo!.codigo, fb.objetivo!.nombre, texto);
                  setTexto("");
                  setHoja(null);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- LISTA DE NOTAS ---------------- */}
      {hoja === "notas" && (
        <div className="velo" data-fb-ignorar onClick={cerrarHoja}>
          <div className="hoja" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabeza">
              <div style={{ fontSize: 16, fontWeight: 700, flexGrow: 1 }}>
                {fb.notas.length} nota{fb.notas.length === 1 ? "" : "s"}
              </div>
              <button className="btn-icono" aria-label="Cerrar" onClick={cerrarHoja}>
                <Equis s={20} />
              </button>
            </div>
            <div className="hoja-cuerpo">
              {fb.notas.length === 0 ? (
                <div style={{ fontSize: 14, color: "var(--texto-2)" }}>
                  Todavía no hay notas.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-solido" style={{ flexGrow: 1 }} onClick={copiar}>
                      <Copiar s={20} />
                      {copiado ? "Copiado" : "Copiar todo"}
                    </button>
                    <button className="btn btn-linea" onClick={descargar} aria-label="Descargar">
                      <Descargar s={20} />
                    </button>
                    <button
                      className="btn btn-linea"
                      aria-label="Borrar todas"
                      onClick={() => {
                        if (confirm(`¿Borrar las ${fb.notas.length} notas?`)) fb.borrarTodo();
                      }}
                    >
                      <Basura s={20} />
                    </button>
                  </div>

                  {fb.notas.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: 10,
                        background: "var(--lienzo)",
                        borderRadius: "var(--r-m)",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                        <span className="codigo" style={{ alignSelf: "flex-start" }}>
                          {n.codigo}
                        </span>
                        <div style={{ fontSize: 13, textWrap: "pretty" }}>{n.texto}</div>
                      </div>
                      <button className="btn-icono" aria-label="Borrar" onClick={() => fb.borrar(n.id)}>
                        <Basura s={18} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
