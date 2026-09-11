"use client";

import React, { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { fechaDDMMAAAA, fechaLarga, money, pct } from "@/lib/formato";
import {
  cobrado,
  estadoFolio,
  faltante,
  recibosValidos,
  tirillasDescuadradas,
  tirillasPendientes,
} from "@/lib/reglas";
import { EXIGE_TIRILLA, MEDIOS, Medio, NOMBRE_MEDIO, Recibo } from "@/lib/tipos";
import { ChipFolio, Chip } from "@/components/Chips";
import { Editable } from "@/components/Editable";
import { BotonCaptura, BotonesCaptura } from "@/components/Captura";
import { Panel } from "@/components/Panel";
import {
  Alerta,
  Atras,
  Documento,
  Equis,
  Girando,
  Info,
  Palomita,
  Tarjeta,
} from "@/components/Iconos";

const TONO_MEDIO: Record<Medio, "neutro" | "alerta" | "info"> = {
  efectivo: "neutro",
  credito: "alerta",
  debito: "alerta",
  spei: "info",
};

function Avance({ etapa, progreso }: { etapa: string; progreso: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexGrow: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--neutro-fg)" }}>{etapa}</span>
        <span className="n" style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-2)" }}>
          {progreso} %
        </span>
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
      <div className="app" style={{ padding: 24 }}>
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Ese folio ya no existe</div>
          <div className="caption">Puede que se haya reiniciado la simulación.</div>
          <button className="btn btn-solido" onClick={() => router.push("/")}>
            Volver a la lista
          </button>
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
  const pendientes = tirillasPendientes(folio);
  const descuadradas = tirillasDescuadradas(folio);
  const leyendoFactura = folio.factura.estado === "subiendo" || folio.factura.estado === "leyendo";

  const fEd = (campo: keyof typeof folio.factura.original) =>
    String((folio.factura as any)[campo]) !== String((folio.factura.original as any)[campo]);

  function celdaTirilla(r: Recibo) {
    if (!EXIGE_TIRILLA[r.medio]) {
      return (
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--paper)" }}
          data-fb="FOLIO.TIRILLA.NOAPLICA"
          data-fb-nombre="Casilla de tirilla vacía · el medio no pasa por terminal"
        >
          <Equis s={20} style={{ color: "var(--borde-2)" }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--texto-3)" }}>Sin tirilla</div>
            <div style={{ fontSize: 11, color: "var(--texto-3)" }}>
              {r.medio === "efectivo" ? "el efectivo" : "la transferencia"} no pasa por terminal
            </div>
          </div>
        </div>
      );
    }

    if (!r.tirilla) {
      return (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "var(--alerta-bg)" }}
          data-fb="FOLIO.TIRILLA.PENDIENTE"
          data-fb-nombre="Casilla de tirilla requerida"
        >
          <div style={{ fontSize: 11, color: "var(--alerta-fg)", textWrap: "pretty" }}>
            Se comparará monto, últimos 4 dígitos, autorización y hora.
          </div>
          <BotonCaptura
            fb="FOLIO.TIRILLA.CAPTURAR"
            etiqueta="Capturar tirilla"
            onArchivo={(n) => app.agregarTirilla(folio!.id, r.id, n)}
          />
        </div>
      );
    }

    if (r.tirilla.estado === "subiendo" || r.tirilla.estado === "leyendo") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--lienzo)" }}>
          <Girando s={18} style={{ color: "var(--texto-3)" }} />
          <Avance etapa={r.tirilla.etapa} progreso={r.tirilla.progreso} />
        </div>
      );
    }

    const desc = Math.abs(r.tirilla.monto - r.monto) > 0.005;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: 12,
          background: desc ? "var(--error-bg)" : "var(--paper)",
        }}
        data-fb="FOLIO.TIRILLA.LEIDA"
        data-fb-nombre="Tirilla leída"
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 11, color: desc ? "var(--error-fg)" : "var(--texto-3)" }}>
            ····{" "}
            <Editable
              tipo="texto"
              fb="FOLIO.TIRILLA.ULTIMOS4"
              fbNombre="Últimos 4 dígitos de la tarjeta"
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
            style={{ fontSize: 15, fontWeight: 600, color: desc ? "var(--error-fg)" : undefined }}
            valor={r.tirilla.monto}
            original={money(r.tirilla.original.monto)}
            editado={r.tirilla.monto !== r.tirilla.original.monto}
            disabled={cerrado}
            onCommit={(v) => app.editar({ folioId: folio!.id, tipo: "tirilla", reciboId: r.id }, "monto", v)}
          />
        </div>
        {desc ? (
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--error-fg)", textWrap: "pretty" }}>
            No cuadra con su recibo ({money(r.monto)}). El folio queda en descuadre hasta que coincidan.
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "var(--texto-3)" }}>
            aut.{" "}
            <Editable
              tipo="texto"
              fb="FOLIO.TIRILLA.AUTORIZACION"
              fbNombre="Número de autorización"
              valor={r.tirilla.autorizacion}
              original={r.tirilla.original.autorizacion}
              editado={r.tirilla.autorizacion !== r.tirilla.original.autorizacion}
              disabled={cerrado}
              onCommit={(v) =>
                app.editar({ folioId: folio!.id, tipo: "tirilla", reciboId: r.id }, "autorizacion", v)
              }
            />{" "}
            · {r.tirilla.hora}
          </div>
        )}
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

      {/* ================= BARRA ================= */}
      <div className="barra" style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
          <button
            className="btn-icono"
            aria-label="Volver"
            data-fb="FOLIO.VOLVER"
            data-fb-nombre="Flecha de volver a la lista"
            onClick={() => router.push("/")}
          >
            <Atras s={24} />
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1, minWidth: 0 }}>
            <div
              style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              data-fb="FOLIO.TITULO"
              data-fb-nombre="Título del folio"
            >
              Folio {folio.factura.numero || "nuevo"}
            </div>
            <div className="caption" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {folio.factura.cliente || "leyendo la factura…"} · {fechaLarga(folio.dia)} · {folio.caja}
            </div>
          </div>
          <ChipFolio estado={est} fb="FOLIO.ESTADO" />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 16px 24px", flexGrow: 1 }}>
        {cerrado && (
          <div
            className="card entra"
            style={{ padding: 14, display: "flex", gap: 10, alignItems: "center", background: "var(--info-bg)" }}
            data-fb="FOLIO.AVISO.CERRADO"
            data-fb-nombre="Aviso de día cerrado"
          >
            <Info s={20} style={{ color: "var(--info-fg)" }} />
            <div style={{ fontSize: 12, color: "var(--info-fg)", textWrap: "pretty" }}>
              El día ya está cerrado: este folio queda en sólo lectura. Para corregirlo hay que
              reabrir el cierre.
            </div>
          </div>
        )}

        {/* ================= 1 · FACTURA ================= */}
        <div
          className="card"
          style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}
          data-fb="FOLIO.BLOQUE.FACTURA"
          data-fb-nombre="Bloque 1 · Factura de venta"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              }}
            >
              1
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, flexGrow: 1 }}>Factura de venta</div>
          </div>

          {leyendoFactura ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="miniatura pulso">
                <Girando s={20} />
              </div>
              <Avance etapa={folio.factura.etapa} progreso={folio.factura.progreso} />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 72,
                  height: 96,
                  borderRadius: "var(--r-m)",
                  background: "var(--hueco)",
                  border: "1px solid var(--borde-1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  flexShrink: 0,
                  color: "var(--texto-3)",
                }}
                data-fb="FOLIO.FACTURA.FOTO"
                data-fb-nombre="Miniatura de la foto de la factura"
                title={folio.factura.archivo}
              >
                <Documento s={24} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>foto</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px 16px", flexGrow: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--texto-3)" }}>Número</div>
                  <Editable
                    tipo="texto"
                    fb="FOLIO.FACTURA.NUMERO"
                    fbNombre="Número de la factura"
                    className="n"
                    style={{ fontSize: 16, fontWeight: 600 }}
                    valor={folio.factura.numero}
                    original={folio.factura.original.numero}
                    editado={fEd("numero")}
                    disabled={cerrado}
                    onCommit={(v) => app.editar({ folioId: folio.id, tipo: "factura" }, "numero", v)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--texto-3)" }}>Fecha</div>
                  <span className="n" style={{ fontSize: 16, fontWeight: 600 }} data-fb="FOLIO.FACTURA.FECHA" data-fb-nombre="Fecha de la factura">
                    {fechaDDMMAAAA(folio.factura.fecha)}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--texto-3)" }}>Cliente</div>
                  <Editable
                    tipo="texto"
                    fb="FOLIO.FACTURA.CLIENTE"
                    fbNombre="Cliente de la factura"
                    style={{ fontSize: 16, fontWeight: 600 }}
                    valor={folio.factura.cliente}
                    original={folio.factura.original.cliente}
                    editado={fEd("cliente")}
                    disabled={cerrado}
                    onCommit={(v) => app.editar({ folioId: folio.id, tipo: "factura" }, "cliente", v)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--texto-3)" }}>Total a pagar</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Editable
                      tipo="monto"
                      fb="FOLIO.FACTURA.TOTAL"
                      fbNombre="Total de la factura"
                      className="n"
                      style={{ fontSize: 20, fontWeight: 700 }}
                      valor={folio.factura.total}
                      original={money(folio.factura.original.total)}
                      editado={fEd("total")}
                      disabled={cerrado}
                      onCommit={(v) => app.editar({ folioId: folio.id, tipo: "factura" }, "total", v)}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-3)" }}>MXN</span>
                    <span
                      title={`Subtotal ${money(folio.factura.subtotal)} + IVA`}
                      data-fb="FOLIO.FACTURA.DESGLOSE"
                      data-fb-nombre="Desglose subtotal + IVA"
                      style={{ color: "var(--borde-2)", cursor: "help", display: "inline-flex" }}
                    >
                      <Info s={16} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!leyendoFactura && (
            <div
              style={{ fontSize: 12, color: "var(--texto-2)", borderTop: "1px solid var(--borde-1)", paddingTop: 12, textWrap: "pretty" }}
              data-fb="FOLIO.FACTURA.NOTA"
              data-fb-nombre="Nota sobre edición de campos"
            >
              Ningún campo está bloqueado: se toca el valor y se corrige. Lo que no se permite es
              teclear un documento que no se subió.
            </div>
          )}
        </div>

        {/* ================= 2 · RECIBOS Y TIRILLAS ================= */}
        {!leyendoFactura && (
          <div
            className="card entra"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}
            data-fb="FOLIO.BLOQUE.RECIBOS"
            data-fb-nombre="Bloque 2 · Recibos de caja y su tirilla"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
                }}
              >
                2
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, flexGrow: 1 }}>Recibos de caja y su tirilla</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {rechazadosLista.length > 0 && (
                  <Chip tono="error" forma="octagono" fb="FOLIO.CHIP.RECHAZADOS" fbNombre="Contador de rechazados">
                    {rechazadosLista.length} rechazado{rechazadosLista.length === 1 ? "" : "s"}
                  </Chip>
                )}
                {descuadradas.length > 0 && (
                  <Chip tono="error" forma="octagono" fb="FOLIO.CHIP.DESCUADRE" fbNombre="Contador de descuadres">
                    {descuadradas.length} descuadre{descuadradas.length === 1 ? "" : "s"}
                  </Chip>
                )}
                {pendientes.length > 0 && (
                  <Chip tono="alerta" forma="triangulo" fb="FOLIO.CHIP.TIRILLAS" fbNombre="Contador de tirillas pendientes">
                    {pendientes.length} tirilla{pendientes.length === 1 ? "" : "s"} pendiente
                    {pendientes.length === 1 ? "" : "s"}
                  </Chip>
                )}
              </div>
            </div>

            {(validos.length > 0 || enCurso.length > 0 || rechazadosLista.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, padding: "0 12px" }}>
                <div className="overline" style={{ fontSize: 11, letterSpacing: ".06em" }}>
                  Recibo de caja
                </div>
                <div className="overline" style={{ fontSize: 11, letterSpacing: ".06em" }}>
                  Tirilla de la terminal
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {validos.map((r) => {
                const desc = r.tirilla && Math.abs(r.tirilla.monto - r.monto) > 0.005;
                return (
                  <div
                    key={r.id}
                    className="entra"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 1,
                      background: desc
                        ? "var(--error)"
                        : EXIGE_TIRILLA[r.medio] && !r.tirilla
                          ? "var(--alerta)"
                          : "var(--borde-1)",
                      border: `1px solid ${desc ? "var(--error)" : EXIGE_TIRILLA[r.medio] && !r.tirilla ? "var(--alerta)" : "var(--borde-1)"}`,
                      borderRadius: "var(--r-m)",
                      overflow: "hidden",
                    }}
                    data-fb="FOLIO.RECIBO.PAREJA"
                    data-fb-nombre={`Pareja recibo–tirilla ${r.numero}`}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12, background: "var(--lienzo)" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                        <Editable
                          tipo="texto"
                          fb="FOLIO.RECIBO.NUMERO"
                          fbNombre="Número del recibo"
                          className="n"
                          style={{ fontSize: 14, fontWeight: 600 }}
                          valor={r.numero}
                          original={r.original.numero}
                          editado={r.numero !== r.original.numero}
                          disabled={cerrado}
                          onCommit={(v) => app.editar({ folioId: folio.id, tipo: "recibo", reciboId: r.id }, "numero", v)}
                        />
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
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className={`chip chip-${TONO_MEDIO[r.medio]}`}>
                          <Editable
                            tipo="opcion"
                            fb="FOLIO.RECIBO.MEDIO"
                            fbNombre="Medio de pago del recibo"
                            valor={r.medio}
                            opciones={MEDIOS.map((m) => ({ v: m, t: NOMBRE_MEDIO[m] }))}
                            original={NOMBRE_MEDIO[r.original.medio]}
                            editado={r.medio !== r.original.medio}
                            disabled={cerrado}
                            onCommit={(v) => app.editar({ folioId: folio.id, tipo: "recibo", reciboId: r.id }, "medio", v)}
                          />
                        </span>
                        <span style={{ fontSize: 11, color: "var(--texto-3)" }}>{r.hora}</span>
                        {!cerrado && (
                          <>
                            <span style={{ flexGrow: 1 }} />
                            <button
                              className="btn-icono"
                              style={{ width: 28, height: 28 }}
                              aria-label="Quitar recibo"
                              data-fb="FOLIO.RECIBO.QUITAR"
                              data-fb-nombre="Quitar recibo"
                              onClick={() => {
                                if (confirm(`¿Quitar el recibo ${r.numero} del folio?`))
                                  app.eliminarRecibo(folio.id, r.id);
                              }}
                            >
                              <Equis s={16} style={{ color: "var(--texto-3)" }} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {celdaTirilla(r)}
                  </div>
                );
              })}

              {enCurso.map((r) => (
                <div
                  key={r.id}
                  className="entra"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 64,
                    padding: 12,
                    background: "var(--lienzo)",
                    borderRadius: "var(--r-m)",
                    border: "1px dashed var(--borde-2)",
                  }}
                  data-fb="FOLIO.RECIBO.LEYENDO"
                  data-fb-nombre="Documento subiendo o leyéndose"
                >
                  <div className="miniatura pulso" style={{ width: 34, height: 34 }}>
                    <Girando s={18} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1, minWidth: 0 }}>
                    <Avance etapa={r.etapa} progreso={r.progreso} />
                    <div style={{ fontSize: 11, color: "var(--texto-3)" }}>
                      Su casilla de tirilla se decide al conocer el medio de pago.
                    </div>
                  </div>
                </div>
              ))}

              {rechazadosLista.map((r) => (
                <div
                  key={r.id}
                  className="entra"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: 12,
                    background: "var(--error-bg)",
                    borderRadius: "var(--r-m)",
                  }}
                  data-fb="FOLIO.RECIBO.RECHAZADO"
                  data-fb-nombre="Documento rechazado con su motivo"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44, flexWrap: "wrap" }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "var(--r-m)",
                        background: "var(--paper)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "var(--error-fg)",
                      }}
                    >
                      <Alerta s={18} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1, minWidth: 0 }}>
                      <span className="n" style={{ fontSize: 14, fontWeight: 600, color: "var(--error-fg)" }}>
                        {r.numero || r.archivo} · rechazado
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--error-fg)" }}>{r.motivo}</span>
                    </div>
                    {!cerrado && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn"
                          style={{ border: "1px solid var(--error-fg)", color: "var(--error-fg)", background: "transparent" }}
                          data-fb="FOLIO.RECHAZADO.REEMPLAZAR"
                          data-fb-nombre="Botón Reemplazar foto del rechazado"
                          onClick={() => {
                            setAReemplazar(r.id);
                            reemplazo.current?.click();
                          }}
                        >
                          Reemplazar foto
                        </button>
                        <button
                          className="btn-icono"
                          aria-label="Descartar"
                          onClick={() => app.eliminarRecibo(folio.id, r.id)}
                        >
                          <Equis s={18} style={{ color: "var(--error-fg)" }} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "10px 12px", background: "var(--paper)", borderRadius: "var(--r-m)" }}>
                    <div style={{ fontSize: 12, color: "var(--error-fg)", lineHeight: 1.55, textWrap: "pretty" }}>
                      {r.detalle}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!cerrado && (
              <BotonesCaptura
                fbCamara="FOLIO.CAPTURA.CAMARA"
                fbArchivo="FOLIO.CAPTURA.ARCHIVO"
                onArchivo={(n) => app.agregarRecibo(folio.id, n)}
              />
            )}

            <div
              style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--lienzo)", borderRadius: "var(--r-m)" }}
              data-fb="FOLIO.NOTA.TIRILLAS"
              data-fb-nombre="Nota sobre tirillas y estados de carga"
            >
              <Info s={20} style={{ color: "var(--texto-3)" }} />
              <div style={{ fontSize: 12, color: "var(--texto-2)", textWrap: "pretty" }}>
                Una casilla de tirilla por recibo, siempre al frente. Lo que se aprueba no se
                anuncia: sólo se muestra el avance mientras sube y lee, y el motivo si se rechaza,
                dentro del mismo recuadro.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= PIE ================= */}
      {!leyendoFactura && (
        <div className="pie">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 16px" }}>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}
              data-fb="FOLIO.TOTALES"
              data-fb-nombre="Totales del folio"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div className="overline" style={{ fontSize: 11 }}>Total factura</div>
                <span className="n" style={{ fontSize: 20, fontWeight: 700 }}>{money(folio.factura.total)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div className="overline" style={{ fontSize: 11 }}>Cobrado</div>
                <span className="n" style={{ fontSize: 20, fontWeight: 700 }}>{money(cob)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div className="overline" style={{ fontSize: 11, color: falta > 0.005 ? "var(--alerta-fg)" : undefined }}>
                  {falta > 0.005 ? "Falta" : falta < -0.005 ? "Sobra" : "Cubierto"}
                </div>
                <span
                  className="n"
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: falta > 0.005 ? "var(--alerta-fg)" : falta < -0.005 ? "var(--error-fg)" : "var(--exito-fg)",
                  }}
                >
                  {money(Math.abs(falta))}
                </span>
              </div>
            </div>

            <div className="riel">
              <i
                style={{
                  width: `${Math.min(100, pct(cob, folio.factura.total))}%`,
                  background:
                    est === "cuadrado" || est === "conciliado" || est === "validado"
                      ? "var(--exito)"
                      : est === "descuadre"
                        ? "var(--error)"
                        : "var(--alerta)",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 12, color: "var(--texto-2)", flexGrow: 1, textWrap: "pretty" }}>
                {est === "cuadrado"
                  ? "Completo y soportado. No hay nada más que hacer con este folio."
                  : est === "descuadre"
                    ? "Un documento contradice a otro. Corrige el monto o vuelve a capturar la tirilla."
                    : est === "falta-tirilla"
                      ? "Ya está cobrado: sólo falta la tirilla de la terminal."
                      : "Se puede salir así: no hay botón de guardar. El folio queda pendiente en la lista."}
              </div>
              <button
                className="btn btn-linea-fuerte"
                data-fb="FOLIO.VOLVER.PIE"
                data-fb-nombre="Botón Volver a la lista"
                onClick={() => router.push("/")}
              >
                Volver a la lista
              </button>
            </div>
          </div>
        </div>
      )}

      <Panel />
    </div>
  );
}
