"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { fechaLarga, horaCorta, money, moneySigno, USUARIO } from "@/lib/formato";
import {
  estadoDia,
  estadoFolio,
  estaSinCerrar,
  faltante,
  porMedioEnFolios,
  sumaMedios,
  TOLERANCIA,
} from "@/lib/reglas";
import { MEDIOS, NOMBRE_MEDIO } from "@/lib/tipos";
import { ChipDia, Chip } from "@/components/Chips";
import { BotonesCaptura } from "@/components/Captura";
import { Panel } from "@/components/Panel";
import {
  Alerta,
  Atras,
  Candado,
  Documento,
  Equis,
  Imagen,
  Info,
  Palomita,
  Subir,
} from "@/components/Iconos";

export default function PaginaCierre() {
  const router = useRouter();
  const app = useApp();
  const { estado } = app;
  const dia = estado.diaSeleccionado;
  const registro = estado.dias[dia];
  const entrada = useRef<HTMLInputElement>(null);
  const [verDetalle, setVerDetalle] = useState(false);

  const folios = useMemo(() => estado.folios.filter((f) => f.dia === dia), [estado.folios, dia]);
  const enFolios = porMedioEnFolios(folios);
  const cierre = registro?.cierre ?? null;
  const firmado = !!cierre?.firmadoEn;

  const diferencia = cierre ? sumaMedios(enFolios) - sumaMedios(cierre.sistema) : 0;
  const cuadra = Math.abs(diferencia) <= TOLERANCIA;
  const estDia = estadoDia(dia, estado.folios, registro);

  const sinCerrar = folios.filter((f) => estaSinCerrar(estadoFolio(f, registro)));
  const huerfanos = (registro?.huerfanos ?? []).filter((h) => !h.asignadoA);

  const explicacionLista = (cierre?.explicacion ?? "").trim().length >= 12;
  const evidenciaLista = (cierre?.evidencias.length ?? 0) > 0;
  const puedeCerrar = !!cierre && (cuadra || (explicacionLista && evidenciaLista));

  const candidatos = folios.filter((f) => faltante(f) > TOLERANCIA);

  return (
    <div className="app">
      {/* ================= BARRA ================= */}
      <div className="barra" style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
          <button
            className="btn-icono"
            aria-label="Volver"
            data-fb="CIERRE.VOLVER"
            data-fb-nombre="Flecha de volver"
            onClick={() => router.push("/")}
          >
            <Atras s={24} />
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }} data-fb="CIERRE.TITULO" data-fb-nombre="Título del cierre">
              Cierre de caja
            </div>
            <div className="caption" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {fechaLarga(dia)} · Caja 2 · {USUARIO}
            </div>
          </div>
          {firmado ? (
            <ChipDia estado={estDia} fb="CIERRE.ESTADO" />
          ) : cierre ? (
            <Chip tono={cuadra ? "exito" : "error"} forma={cuadra ? "circulo" : "octagono"} fb="CIERRE.ESTADO" fbNombre="Estado del cruce">
              {cuadra ? "Cuadra" : "No cuadra"}
            </Chip>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 16px 24px", flexGrow: 1 }}>
        {/* ================= 1 · ARCHIVO ================= */}
        <div
          className="card"
          style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}
          data-fb="CIERRE.BLOQUE.ARCHIVO"
          data-fb-nombre="Bloque 1 · Archivo de cierre del sistema"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Paso n={1} />
            <div style={{ fontSize: 16, fontWeight: 600, flexGrow: 1 }}>Archivo de cierre del sistema</div>
          </div>

          {!cierre ? (
            <>
              <div style={{ fontSize: 13, color: "var(--texto-2)", textWrap: "pretty" }}>
                Sube el archivo que emite el DMS al cerrar el turno. Su columna queda congelada a
                esa hora; la de folios sigue viva.
              </div>
              <input
                ref={entrada}
                type="file"
                accept="application/pdf,.csv,.xlsx,image/*"
                hidden
                onChange={(e) => {
                  const n = e.target.files?.[0]?.name ?? `CIERRE_C2_${dia.replace(/-/g, "")}.pdf`;
                  app.leerArchivoCierre(dia, n);
                  e.target.value = "";
                }}
              />
              <button
                className="btn btn-grande btn-solido"
                data-fb="CIERRE.ARCHIVO.SUBIR"
                data-fb-nombre="Botón Subir archivo de cierre"
                onClick={() => entrada.current?.click()}
              >
                <Subir s={24} />
                Subir archivo del sistema
              </button>
            </>
          ) : (
            <div
              style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--lienzo)", borderRadius: "var(--r-m)" }}
              data-fb="CIERRE.ARCHIVO.LEIDO"
              data-fb-nombre="Archivo del sistema leído"
            >
              <div className="miniatura" style={{ width: 34, height: 34, background: "var(--paper)", border: "1px solid var(--borde-1)" }}>
                <Documento s={18} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minWidth: 0 }}>
                <div className="n" style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {cierre.archivo}
                </div>
                <div style={{ fontSize: 11, color: "var(--texto-3)" }}>
                  DMS · leído a las {cierre.leidoEn} · {cierre.recibosSistema} recibos del turno
                </div>
              </div>
              {!firmado && (
                <button
                  className="btn-icono"
                  aria-label="Quitar archivo"
                  data-fb="CIERRE.ARCHIVO.QUITAR"
                  data-fb-nombre="Quitar el archivo del sistema"
                  onClick={() => {
                    if (confirm("¿Volver a leer el archivo del sistema?")) app.reabrirDia(dia);
                  }}
                >
                  <Equis s={20} style={{ color: "var(--texto-3)" }} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ================= 2 · CRUCE ================= */}
        {cierre && (
          <div
            className="card entra"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}
            data-fb="CIERRE.BLOQUE.CRUCE"
            data-fb-nombre="Bloque 2 · Cruce por medio de pago"
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Paso n={2} />
              <div style={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {cuadra ? "El turno cuadra contra el sistema" : "Hay medios de pago que no cuadran"}
                </div>
                <div className="caption" style={{ textWrap: "pretty" }}>
                  MXN · {fechaLarga(dia)} · sistema DMS contra Σ recibos capturados en folios
                </div>
              </div>
            </div>

            <table className="cruce" data-fb="CIERRE.TABLA" data-fb-nombre="Tabla del cruce">
              <thead>
                <tr>
                  <th style={{ width: "34%" }}>Medio de pago</th>
                  <th style={{ width: "22%" }}>Sistema</th>
                  <th style={{ width: "22%" }}>Folios</th>
                  <th style={{ width: "22%" }}>Dif.</th>
                </tr>
              </thead>
              <tbody>
                {MEDIOS.map((m) => {
                  const d = enFolios[m] - cierre.sistema[m];
                  const mal = Math.abs(d) > TOLERANCIA;
                  return (
                    <tr key={m}>
                      <td>{NOMBRE_MEDIO[m]}</td>
                      <td className="n">{money(cierre.sistema[m])}</td>
                      <td className="n">{money(enFolios[m])}</td>
                      <td
                        className="n"
                        style={{
                          fontWeight: mal ? 700 : 400,
                          color: mal ? "var(--error-fg)" : "var(--texto-2)",
                          background: mal ? "var(--error-bg)" : undefined,
                        }}
                      >
                        {mal ? moneySigno(d) : "0.00"}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={{ fontWeight: 700, borderBottom: 0 }}>Total del turno</td>
                  <td className="n" style={{ fontWeight: 700, borderBottom: 0 }}>
                    {money(sumaMedios(cierre.sistema))}
                  </td>
                  <td className="n" style={{ fontWeight: 700, borderBottom: 0 }}>
                    {money(sumaMedios(enFolios))}
                  </td>
                  <td
                    className="n"
                    style={{
                      fontWeight: 700,
                      borderBottom: 0,
                      color: cuadra ? "var(--exito-fg)" : "var(--error-fg)",
                      background: cuadra ? "var(--exito-bg)" : "var(--error-bg)",
                    }}
                  >
                    {cuadra ? "0.00" : moneySigno(diferencia)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ================= 3 · QUÉ LO EXPLICA ================= */}
        {cierre && !cuadra && (
          <div
            className="card entra"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}
            data-fb="CIERRE.BLOQUE.CAUSAS"
            data-fb-nombre="Bloque 3 · Qué explica la diferencia"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Paso n={3} />
              <div style={{ fontSize: 16, fontWeight: 600, flexGrow: 1 }}>Qué explica la diferencia</div>
              <Chip tono="neutro" fb="CIERRE.CAUSAS.CONTADOR" fbNombre="Contador de causas">
                {huerfanos.length} causa{huerfanos.length === 1 ? "" : "s"}
              </Chip>
            </div>

            {huerfanos.map((h) => {
              const sugerido = candidatos.find((f) => Math.abs(faltante(f) - h.monto) < 0.01);
              return (
                <div
                  key={h.id}
                  style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12, background: "var(--error-bg)", borderRadius: "var(--r-m)" }}
                  data-fb="CIERRE.CAUSA.HUERFANO"
                  data-fb-nombre={`Recibo del sistema sin folio ${h.id}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--error-fg)" }}>
                        {h.id} · {NOMBRE_MEDIO[h.medio]} · <span className="n">{money(h.monto)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--error-fg)", textWrap: "pretty" }}>
                        Está en el archivo del sistema y no tiene folio
                        {sugerido ? ` · coincide con lo que le falta a ${sugerido.factura.numero}` : ""}.
                      </div>
                    </div>
                    {sugerido && !firmado && (
                      <button
                        className="btn"
                        style={{ border: "1px solid var(--error-fg)", color: "var(--error-fg)", background: "transparent" }}
                        data-fb="CIERRE.CAUSA.ASIGNAR"
                        data-fb-nombre="Botón Asignar el recibo a un folio"
                        onClick={() => app.asignarHuerfano(dia, h.id, sugerido.id)}
                      >
                        Asignar a {sugerido.factura.numero}
                      </button>
                    )}
                    {!sugerido && !firmado && candidatos.length > 0 && (
                      <select
                        className="campo"
                        style={{ maxWidth: 220 }}
                        defaultValue=""
                        data-fb="CIERRE.CAUSA.ELEGIR"
                        data-fb-nombre="Elegir folio destino del recibo"
                        onChange={(e) => {
                          if (e.target.value) app.asignarHuerfano(dia, h.id, e.target.value);
                        }}
                      >
                        <option value="">Asignar a un folio…</option>
                        {candidatos.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.factura.numero} · faltan {money(faltante(f))}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}

            {sinCerrar.length > 0 && (
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--alerta-bg)", borderRadius: "var(--r-m)" }}
                data-fb="CIERRE.CAUSA.PENDIENTES"
                data-fb-nombre="Aviso de folios sin cerrar"
              >
                <Alerta s={20} style={{ color: "var(--alerta-fg)" }} />
                <div style={{ fontSize: 12, color: "var(--alerta-fg)", flexGrow: 1, textWrap: "pretty" }}>
                  {sinCerrar.length} folio{sinCerrar.length === 1 ? "" : "s"} sin cerrar. No bloquean
                  el cierre del día: se quedan abiertos.
                </div>
                <button
                  className="btn"
                  style={{ border: "1px solid var(--alerta-fg)", color: "var(--alerta-fg)", background: "transparent" }}
                  onClick={() => router.push("/")}
                >
                  Verlos
                </button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--lienzo)", borderRadius: "var(--r-m)" }}>
              <Info s={20} style={{ color: "var(--texto-3)" }} />
              <div style={{ fontSize: 12, color: "var(--texto-2)", textWrap: "pretty" }}>
                El cierre no es un reporte: es la lista de cosas por arreglar, con el botón que las
                arregla al lado de cada una.
              </div>
            </div>
          </div>
        )}

        {/* ================= 4 · EXPLICACIÓN ================= */}
        {cierre && !cuadra && (
          <div
            className="card entra"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}
            data-fb="CIERRE.BLOQUE.EXPLICACION"
            data-fb-nombre="Bloque 4 · Explicación de la diferencia"
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Paso n={4} />
              <div style={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Por qué hay una diferencia</div>
                <div className="caption">Sólo aparece cuando la diferencia no es 0.00</div>
              </div>
              <Chip tono="error" forma="octagono" fb="CIERRE.EXPLICACION.OBLIGATORIA" fbNombre="Marca de obligatoria">
                Obligatoria
              </Chip>
            </div>

            {firmado ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ padding: 12, background: "var(--lienzo)", borderRadius: "var(--r-m)", fontSize: 14, lineHeight: 1.55 }}>
                  {cierre.explicacion}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--texto-3)" }}>
                  <Candado s={16} />
                  Firmada por {cierre.firmadoPor} a las {horaCorta(cierre.firmadoEn)} · ya no se edita
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label className="etiqueta" htmlFor="exp">
                  Explicación
                </label>
                <textarea
                  id="exp"
                  className="campo"
                  rows={3}
                  data-fb="CIERRE.EXPLICACION.TEXTO"
                  data-fb-nombre="Campo de explicación de la diferencia"
                  placeholder="Qué pasó, con nombres y montos. Esto lo lee quien valida el día."
                  value={cierre.explicacion}
                  onChange={(e) => app.setExplicacion(dia, e.target.value)}
                />
                {!explicacionLista && cierre.explicacion.length > 0 && (
                  <div style={{ fontSize: 11, color: "var(--alerta-fg)" }}>
                    Escribe un poco más: esto es el soporte de un faltante de caja.
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="etiqueta">Evidencia</div>
              {cierre.evidencias.map((ev) => (
                <div
                  key={ev.id}
                  className="entra"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--lienzo)", borderRadius: "var(--r-m)" }}
                  data-fb="CIERRE.EVIDENCIA.ITEM"
                  data-fb-nombre="Archivo de evidencia adjunto"
                >
                  <div className="miniatura" style={{ width: 34, height: 34, background: "var(--paper)", border: "1px solid var(--borde-1)" }}>
                    <Imagen s={18} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minWidth: 0 }}>
                    <div className="n" style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.nombre}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--texto-3)" }}>
                      {ev.hora} · {ev.tam}
                    </div>
                  </div>
                  {!firmado && (
                    <button className="btn-icono" aria-label="Quitar evidencia" onClick={() => app.quitarEvidencia(dia, ev.id)}>
                      <Equis s={20} style={{ color: "var(--error-fg)" }} />
                    </button>
                  )}
                </div>
              ))}

              {!firmado && (
                <BotonesCaptura
                  fbCamara="CIERRE.EVIDENCIA.CAMARA"
                  fbArchivo="CIERRE.EVIDENCIA.ARCHIVO"
                  grandes
                  onArchivo={(n) => app.agregarEvidencia(dia, n)}
                />
              )}

              {!firmado && !evidenciaLista && (
                <div style={{ fontSize: 11, color: "var(--alerta-fg)" }}>
                  Hace falta al menos una evidencia para poder cerrar con diferencia.
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--lienzo)", borderRadius: "var(--r-m)" }}>
              <Info s={20} style={{ color: "var(--texto-3)" }} />
              <div style={{ fontSize: 12, color: "var(--texto-2)", textWrap: "pretty" }}>
                La explicación queda firmada con tu usuario y la hora, y ya no se puede editar. El
                segundo usuario la lee al validar el día: si no la acepta, devuelve el día y el
                cierre se rehace.
              </div>
            </div>
          </div>
        )}

        {/* ================= CERRADO ================= */}
        {firmado && (
          <div
            className="card entra"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
            data-fb="CIERRE.RESULTADO"
            data-fb-nombre="Resultado del cierre firmado"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="miniatura" style={{ background: cuadra ? "var(--exito-bg)" : "var(--error-bg)", color: cuadra ? "var(--exito-fg)" : "var(--error-fg)" }}>
                {cuadra ? <Palomita s={20} /> : <Alerta s={20} />}
              </div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {cuadra ? "Día cerrado y cuadrado" : "Día cerrado con diferencia"}
                </div>
                <div className="caption">
                  Firmado por {cierre!.firmadoPor} a las {horaCorta(cierre!.firmadoEn)} ·{" "}
                  {registro?.validadoEn ? `validado por ${registro.validadoPor}` : "esperando validación de un segundo usuario"}
                </div>
              </div>
            </div>
            <button
              className="btn btn-linea"
              data-fb="CIERRE.REABRIR"
              data-fb-nombre="Botón Reabrir el cierre"
              onClick={() => {
                if (confirm("Reabrir el día deja los folios editables otra vez. ¿Seguir?"))
                  app.reabrirDia(dia);
              }}
            >
              Reabrir el día
            </button>
          </div>
        )}
      </div>

      {/* ================= PIE ================= */}
      {cierre && !firmado && (
        <div className="pie">
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: cuadra ? "var(--exito-fg)" : "var(--error-fg)" }}>
                {cuadra ? "El cruce quedó en cero" : `Vas a cerrar con ${moneySigno(diferencia)} de diferencia`}
              </div>
              <div className="caption" style={{ textWrap: "pretty" }}>
                {cuadra
                  ? "Al cerrar, los folios cuadrados pasan a Conciliado y el día espera validación."
                  : puedeCerrar
                    ? "Tu explicación y su evidencia viajan con el cierre."
                    : "Falta la explicación y al menos una evidencia."}
              </div>
            </div>
            <button
              className="btn btn-grande btn-solido"
              style={{ padding: "0 20px", flexShrink: 0 }}
              disabled={!puedeCerrar}
              data-fb="CIERRE.ACCION.CERRAR"
              data-fb-nombre="Botón Cerrar la caja del día"
              onClick={() => app.cerrarDia(dia, diferencia)}
            >
              {cuadra ? "Cerrar caja del día" : "Cerrar con diferencia"}
            </button>
          </div>
        </div>
      )}

      <Panel />
      {verDetalle && null}
    </div>
  );
}

function Paso({ n }: { n: number }) {
  return (
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
      {n}
    </div>
  );
}
