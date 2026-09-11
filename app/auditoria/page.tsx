"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { fechaCortaISMO, hora12 } from "@/lib/formato";
import { Flotantes } from "@/components/Flotantes";
import { Atras, Copiar, Descargar, Candado } from "@/components/Iconos";

/**
 * Pantalla deliberadamente no enlazada desde la app. El registro es
 * silencioso para quien captura; esto es la ventana del que audita.
 */
export default function PaginaAuditoria() {
  const router = useRouter();
  const { estado } = useApp();
  const [copiado, setCopiado] = useState(false);
  const [soloReales, setSoloReales] = useState(true);

  const filas = useMemo(() => {
    const xs = estado.auditoria;
    return soloReales ? xs.filter((a) => a.nuevo !== a.original) : xs;
  }, [estado.auditoria, soloReales]);

  const texto = useMemo(
    () =>
      [
        "REGISTRO DE EDICIONES · Conciliación de Caja · ISMO Motors",
        `${filas.length} edición(es) que se apartan del documento original`,
        "",
        ...filas.map(
          (a) =>
            `${new Date(a.en).toISOString()} · ${a.usuario} · ${a.dia}\n  ${a.entidad} ${a.entidadId} · ${a.campo}\n  documento: ${a.original}\n  anterior:  ${a.anterior}\n  ahora:     ${a.nuevo}`
        ),
      ].join("\n"),
    [filas]
  );

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {}
  }

  function descargar() {
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ediciones-caja-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <div className="barra" style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
          <button className="btn-icono" aria-label="Volver" onClick={() => router.push("/")}>
            <Atras s={24} />
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Registro de ediciones</div>
            <div className="caption">No se enlaza desde la app · sólo para quien audita</div>
          </div>
          <Candado s={20} style={{ color: "var(--texto-3)" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 16px 24px", flexGrow: 1 }}>
        <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, color: "var(--texto-2)", textWrap: "pretty" }}>
            La app deja corregir cualquier dato leído, y lo marca en pantalla con un subrayado
            ámbar casi invisible. Por detrás guarda el valor que traía el documento, el valor
            anterior y el nuevo, con usuario y hora. Quien captura no ve esta pantalla.
          </div>
          <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={soloReales}
              onChange={(e) => setSoloReales(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--marca)" }}
            />
            <span style={{ fontSize: 13 }}>Ocultar los campos que volvieron a su valor original</span>
          </label>
          {filas.length > 0 && (
            <div className="par">
              <button className="btn btn-linea" onClick={copiar}>
                <Copiar s={20} />
                {copiado ? "Copiado" : "Copiar"}
              </button>
              <button className="btn btn-linea" onClick={descargar}>
                <Descargar s={20} />
                Descargar
              </button>
            </div>
          )}
        </div>

        {filas.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Todavía nadie ha corregido nada</div>
            <div className="caption" style={{ marginTop: 6 }}>
              Edita cualquier dato de un folio y aparecerá aquí.
            </div>
          </div>
        ) : (
          filas.map((a) => (
            <div key={a.id} className="card entra" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {a.entidad} {a.entidadId}
                </span>
                <span className="caption">· {a.campo}</span>
                <span style={{ flexGrow: 1 }} />
                <span className="caption n">
                  {a.usuario} · {hora12(a.en)}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                <Celda t="Documento" v={a.original} tono="var(--texto-2)" />
                <Celda t="Anterior" v={a.anterior} tono="var(--texto-3)" />
                <Celda t="Ahora" v={a.nuevo} tono="var(--alerta-fg)" fuerte />
              </div>
              <div className="caption">
                {fechaCortaISMO(a.dia)} · folio {a.folioId.slice(0, 10)}
              </div>
            </div>
          ))
        )}
      </div>

      <Flotantes />
    </div>
  );
}

function Celda({ t, v, tono, fuerte }: { t: string; v: string; tono: string; fuerte?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--texto-3)" }}>{t}</div>
      <div
        className="n"
        style={{
          fontSize: 14,
          fontWeight: fuerte ? 700 : 500,
          color: tono,
          overflowWrap: "anywhere",
        }}
      >
        {v}
      </div>
    </div>
  );
}
