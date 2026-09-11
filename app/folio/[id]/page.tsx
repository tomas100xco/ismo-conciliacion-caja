"use client";

import React, { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { fechaCortaISMO, fechaDDMMAAAA, hora12, money, pct } from "@/lib/formato";
import { cobrado, estadoFolio, faltante, recibosValidos } from "@/lib/reglas";
import { EXIGE_TIRILLA, MEDIOS, Medio, NOMBRE_MEDIO, Recibo } from "@/lib/tipos";
import { BurbujaFolio } from "@/components/Estado";
import { Editable } from "@/components/Editable";
import { BotonesCaptura } from "@/components/Captura";
import { Flotantes } from "@/components/Flotantes";
import {
  Atras,
  Camara,
  Documento,
  Efectivo,
  Equis,
  Girando,
  Tarjeta,
  Transferencia,
} from "@/components/Iconos";

const ICONO_MEDIO: Record<Medio, React.ComponentType<{ s?: number; style?: React.CSSProperties }>> = {
  efectivo: Efectivo,
  credito: Tarjeta,
  debito: Tarjeta,
  spei: Transferencia,
};

const CORTO_MEDIO: Record<Medio, string> = {
  efectivo: "Efectivo",
  credito: "Crédito",
  debito: "Débito",
  spei: "SPEI",
};

function Avance({ etapa, progreso }: { etapa: string; progreso: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-2)" }}>{etapa}</span>
        <span className="n" style={{ fontSize: 11, color: "var(--texto-3)" }}>{progreso}%</span>
      </div>
      <div className="riel">
        <i style={{ width: `${progreso}%` }} />
      </div>
    </div>
  );
}

export default function PaginaFolio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const app = useApp();
  const { estado } = app;
  const folio = estado.folios.find((f) => f.id === id);
  const reemplazo = useRef<HTMLInputElement>(null);
  const [aReemplazar, setAReemplazar] = useState<string | null>(null);

  if (!folio) {
    return (
      <div className="app">
        <div className="cuerpo">
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Ese folio ya no existe</div>
            <button className="btn btn-solido" onClick={() => router.push("/")}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const registro = estado.dias[folio.dia];
  const est = estadoFolio(folio, registro);
  const cerrado = !!registro?.cierre;
  const validos = recibosValidos(folio);
  const rechazadosLista = folio.recibos.filter((r) => r.estado === "rechazado");
  const enCurso = folio.recibos.filter((r) => r.estado === "subiendo" || r.estado === "leyendo");
  const cob = cobrado(folio);
  const falta = faltante(folio);
  const leyendoFactura = folio.factura.estado === "subiendo" || folio.factura.estado === "leyendo";
  const loc = { folioId: folio.id, tipo: "factura" as const };
  const fEd = (c: string) =>
    String((folio.factura as any)[c]) !== String((folio.factura.original as any)[c]);

  function celdaTirilla(r: Recibo) {
    if (!r.tirilla) {
      return (
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", minWidth: 0 }}
          data-fb="FOLIO.TIRILLA.PENDIENTE"
          data-fb-nombre="Casilla de tirilla requerida"
        >
          <span className="chip chip-alerta">Falta tirilla</span>
          <div style={{ flexGrow: 1 }} />
          <button
            className="btn btn-linea"
            style={{ height: 36, padding: "0 12px", fontSize: 13 }}
            data-fb="FOLIO.TIRILLA.CAPTURAR"
            data-fb-nombre="Botón Capturar tirilla"
            onClick={() => document.getElementById(`tir-${r.id}`)?.click()}
          >
            <Camara s={18} />
            Capturar
          </button>
          <input
            id={`tir-${r.id}`}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              app.agregarTirilla(folio!.id, r.id, e.target.files?.[0]?.name ?? `tirilla_${Date.now()}.jpg`);
              e.target.value = "";
            }}
          />
        </div>
      );
    }

    if (r.tirilla.estado === "subiendo" || r.tirilla.estado === "leyendo") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
          <Girando s={16} style={{ color: "var(--texto-3)" }} />
          <Avance etapa={r.tirilla.etapa} progreso={r.tirilla.progreso} />
        </div>
      );
    }

    const desc = Math.abs(r.tirilla.monto - r.monto) > 0.005;
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 3, padding: "10px 12px", minWidth: 0 }}
        data-fb="FOLIO.TIRILLA.LEIDA"
        data-fb-nombre="Tirilla leída"
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span className="caption" style={{ fontSize: 11 }}>
            ····
            <Editable
              tipo="texto"
              fb="FOLIO.TIRILLA.ULTIMOS4"
              fbNombre="Últimos 4 dígitos"
              valor={r.tirilla.ultimos4}
              original={r.tirilla.original.ultimos4}
              editado={r.tirilla.ultimos4 !== r.tirilla.original.ultimos4}
              disabled={cerrado}
              onCommit={(v) => app.editar({ folioId: folio!.id, tipo: "tirilla", reciboId: r.id }, "ultimos4", v)}
            />
          </span>
          <Editable
            tipo="monto"
            fb="FOLIO.TIRILLA.MONTO"
            fbNombre="Monto de la tirilla"
            className="n"
            style={{ fontSize: 14, fontWeight: 600, color: desc ? "var(--error-fg)" : undefined }}
            valor={r.tirilla.monto}
            original={money(r.tirilla.original.monto)}
            editado={r.tirilla.monto !== r.tirilla.original.monto}
            disabled={cerrado}
            onCommit={(v) => app.editar({ folioId: folio!.id, tipo: "tirilla", reciboId: r.id }, "monto", v)}
          />
        </div>
        {desc && <span className="chip chip-error" style={{ alignSelf: "flex-start" }}>No cuadra con su recibo</span>}
      </div>
    );
  }

  return (
    <div className="app">
      <input
        ref={reemplazo}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const nombre = e.target.files?.[0]?.name ?? `foto_${Date.now()}.jpg`;
          if (aReemplazar) {
            app.eliminarRecibo(folio.id, aReemplazar);
            app.agregarRecibo(folio.id, nombre);
            setAReemplazar(null);
          }
          e.target.value = "";
        }}
      />

      <div className="barra">
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 12px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className="btn-icono"
              aria-label="Volver"
              data-fb="FOLIO.VOLVER"
              data-fb-nombre="Flecha de volver"
              onClick={() => router.push("/")}
            >
              <Atras s={22} />
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, flexGrow: 1, minWidth: 0 }}>
              <span
                style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                data-fb="FOLIO.TITULO"
                data-fb-nombre="Título del folio"
              >
                {folio.factura.numero || "Folio nuevo"}
              </span>
              <span className="caption" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {folio.factura.cliente || "leyendo…"} · {fechaCortaISMO(folio.dia)} · {folio.caja}
              </span>
            </div>
            <BurbujaFolio
              estado={est}
              avance={folio.factura.total ? cob / folio.factura.total : 0}
              fb="FOLIO.ESTADO"
            />
          </div>

          {!leyendoFactura && !cerrado && (
            <BotonesCaptura
              fbCamara="FOLIO.CAPTURA.CAMARA"
              fbArchivo="FOLIO.CAPTURA.ARCHIVO"
              etiquetaCamara="Agregar recibo"
              etiquetaArchivo="Subir archivo"
              onArchivo={(n) => app.agregarRecibo(folio.id, n)}
            />
          )}
        </div>
      </div>

      <div className="cuerpo">
        {cerrado && (
          <span className="chip chip-info" data-fb="FOLIO.CERRADO" data-fb-nombre="Marca de día cerrado">
            Día cerrado · sólo lectura
          </span>
        )}

        {/* ---------------- FACTURA ---------------- */}
        <div
          className="card"
          style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
          data-fb="FOLIO.BLOQUE.FACTURA"
          data-fb-nombre="Bloque de la factura"
        >
          {leyendoFactura ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Girando s={20} style={{ color: "var(--texto-3)" }} />
              <Avance etapa={folio.factura.etapa} progreso={folio.factura.progreso} />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="overline" style={{ fontSize: 10 }}>Factura</span>
                <div style={{ flexGrow: 1 }} />
                <span
                  className="caption"
                  style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}
                  data-fb="FOLIO.FACTURA.FOTO"
                  data-fb-nombre="Archivo de la factura"
                  title={folio.factura.archivo}
                >
                  <Documento s={14} />
                  foto
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px 12px" }}>
                <Campo etiqueta="Número">
                  <Editable
                    tipo="texto"
                    fb="FOLIO.FACTURA.NUMERO"
                    fbNombre="Número de la factura"
                    className="n"
                    style={{ fontSize: 15, fontWeight: 600 }}
                    valor={folio.factura.numero}
                    original={folio.factura.original.numero}
                    editado={fEd("numero")}
                    disabled={cerrado}
                    onCommit={(v) => app.editar(loc, "numero", v)}
                  />
                </Campo>
                <Campo etiqueta="Fecha">
                  <span className="n" style={{ fontSize: 15, fontWeight: 600 }} data-fb="FOLIO.FACTURA.FECHA" data-fb-nombre="Fecha de la factura">
                    {fechaDDMMAAAA(folio.factura.fecha)}
                  </span>
                </Campo>
                <Campo etiqueta="Cliente">
                  <Editable
                    tipo="texto"
                    fb="FOLIO.FACTURA.CLIENTE"
                    fbNombre="Cliente de la factura"
                    style={{ fontSize: 15, fontWeight: 600 }}
                    valor={folio.factura.cliente}
                    original={folio.factura.original.cliente}
                    editado={fEd("cliente")}
                    disabled={cerrado}
                    onCommit={(v) => app.editar(loc, "cliente", v)}
                  />
                </Campo>
                <Campo etiqueta="Total">
                  <Editable
                    tipo="monto"
                    fb="FOLIO.FACTURA.TOTAL"
                    fbNombre="Total de la factura"
                    className="n"
                    style={{ fontSize: 18, fontWeight: 700 }}
                    valor={folio.factura.total}
                    original={money(folio.factura.original.total)}
                    editado={fEd("total")}
                    disabled={cerrado}
                    onCommit={(v) => app.editar(loc, "total", v)}
                  />
                </Campo>
              </div>
            </>
          )}
        </div>

        {/* ---------------- RECIBOS ---------------- */}
        {!leyendoFactura && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
            data-fb="FOLIO.LISTA.RECIBOS"
            data-fb-nombre="Lista de recibos del folio"
          >
            {validos.map((r) => {
              const Icono = ICONO_MEDIO[r.medio];
              const exige = EXIGE_TIRILLA[r.medio];
              return (
                <div
                  key={r.id}
                  className="card entra"
                  style={{ overflow: "hidden" }}
                  data-fb="FOLIO.RECIBO"
                  data-fb-nombre={`Recibo ${r.numero}`}
                >
                  <div className="pareja" data-doble={exige}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", minWidth: 0 }}>
                      <span
                        data-fb="FOLIO.RECIBO.MEDIO"
                        data-fb-nombre="Medio de pago del recibo"
                        title={NOMBRE_MEDIO[r.medio]}
                        style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2, color: "var(--texto-2)", flexShrink: 0, width: 44 }}
                      >
                        <Icono s={20} />
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".02em" }}>
                          {CORTO_MEDIO[r.medio]}
                        </span>
                      </span>

                      <div style={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
                        <Editable
                          tipo="texto"
                          fb="FOLIO.RECIBO.NUMERO"
                          fbNombre="Número del recibo"
                          className="n"
                          style={{ fontSize: 13, fontWeight: 600 }}
                          valor={r.numero}
                          original={r.original.numero}
                          editado={r.numero !== r.original.numero}
                          disabled={cerrado}
                          onCommit={(v) => app.editar({ folioId: folio.id, tipo: "recibo", reciboId: r.id }, "numero", v)}
                        />
                        <span className="caption" style={{ fontSize: 11 }}>{hora12(r.hora)}</span>
                      </div>

                      <Editable
                        tipo="monto"
                        fb="FOLIO.RECIBO.MONTO"
                        fbNombre="Monto del recibo"
                        className="n"
                        style={{ fontSize: 16, fontWeight: 600 }}
                        valor={r.monto}
                        original={money(r.original.monto)}
                        editado={r.monto !== r.original.monto}
                        disabled={cerrado}
                        onCommit={(v) => app.editar({ folioId: folio.id, tipo: "recibo", reciboId: r.id }, "monto", v)}
                      />

                      {!cerrado && (
                        <button
                          className="btn-icono"
                          style={{ width: 30, height: 30 }}
                          aria-label="Quitar recibo"
                          data-fb="FOLIO.RECIBO.QUITAR"
                          data-fb-nombre="Quitar recibo"
                          onClick={() => {
                            if (confirm(`¿Quitar ${r.numero}?`)) app.eliminarRecibo(folio.id, r.id);
                          }}
                        >
                          <Equis s={16} />
                        </button>
                      )}
                    </div>

                    {exige && <div>{celdaTirilla(r)}</div>}
                  </div>
                </div>
              );
            })}

            {enCurso.map((r) => (
              <div key={r.id} className="card entra" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }} data-fb="FOLIO.RECIBO.LEYENDO" data-fb-nombre="Documento leyéndose">
                <Girando s={18} style={{ color: "var(--texto-3)" }} />
                <Avance etapa={r.etapa} progreso={r.progreso} />
              </div>
            ))}

            {rechazadosLista.map((r) => (
              <div
                key={r.id}
                className="card entra"
                style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}
                data-fb="FOLIO.RECIBO.RECHAZADO"
                data-fb-nombre="Documento rechazado"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="chip chip-error">Rechazado</span>
                  <span style={{ fontSize: 13, fontWeight: 600, flexGrow: 1, minWidth: 0 }}>{r.motivo}</span>
                  {!cerrado && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <button
                        className="btn btn-linea"
                        style={{ height: 36, padding: "0 12px", fontSize: 13 }}
                        data-fb="FOLIO.RECHAZADO.REEMPLAZAR"
                        data-fb-nombre="Botón Reemplazar foto"
                        onClick={() => {
                          setAReemplazar(r.id);
                          reemplazo.current?.click();
                        }}
                      >
                        Reemplazar
                      </button>
                      <button className="btn-icono" style={{ width: 32, height: 32 }} aria-label="Descartar" onClick={() => app.eliminarRecibo(folio.id, r.id)}>
                        <Equis s={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--texto-2)", lineHeight: 1.5, textWrap: "pretty" }}>
                  {r.detalle}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- PIE ---------------- */}
      {!leyendoFactura && (
        <div className="pie">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, flexGrow: 1, minWidth: 0 }}
              data-fb="FOLIO.TOTALES"
              data-fb-nombre="Totales del folio"
            >
              <Tot etiqueta="Facturado" valor={money(folio.factura.total)} />
              <Tot etiqueta="Cobrado" valor={money(cob)} />
              <Tot
                etiqueta="Faltante"
                valor={money(Math.abs(falta))}
                color={falta > 0.005 ? "var(--alerta-fg)" : falta < -0.005 ? "var(--error-fg)" : "var(--exito-fg)"}
              />
            </div>
            <button
              className="btn btn-linea"
              style={{ flexShrink: 0 }}
              data-fb="FOLIO.VOLVER.PIE"
              data-fb-nombre="Botón Volver"
              onClick={() => router.push("/")}
            >
              Volver
            </button>
          </div>
        </div>
      )}

      <Flotantes />
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 500, color: "var(--texto-3)" }}>{etiqueta}</span>
      {children}
    </div>
  );
}

function Tot({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
      <span className="overline" style={{ fontSize: 9 }}>{etiqueta}</span>
      <span className="n" style={{ fontSize: 15, fontWeight: 700, color }}>{valor}</span>
    </div>
  );
}
