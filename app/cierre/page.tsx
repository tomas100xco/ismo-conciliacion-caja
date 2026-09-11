"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { fechaCortaISMO, hora12, money, moneySigno, USUARIO } from "@/lib/formato";
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
import { BurbujaDia } from "@/components/Estado";
import { BotonesCaptura } from "@/components/Captura";
import { Flotantes } from "@/components/Flotantes";
import { Atras, Documento, Equis, Imagen, Subir } from "@/components/Iconos";

export default function PaginaCierre() {
  const router = useRouter();
  const app = useApp();
  const { estado } = app;
  const dia = estado.diaSeleccionado;
  const registro = estado.dias[dia];
  const entrada = useRef<HTMLInputElement>(null);
  const [pidiendo, setPidiendo] = useState(false);

  const folios = useMemo(() => estado.folios.filter((f) => f.dia === dia), [estado.folios, dia]);
  const enFolios = porMedioEnFolios(folios);
  const cierre = registro?.cierre ?? null;
  const firmado = !!cierre?.firmadoEn;

  const diferencia = cierre ? sumaMedios(enFolios) - sumaMedios(cierre.sistema) : 0;
  const cuadra = Math.abs(diferencia) <= TOLERANCIA;
  const estDia = estadoDia(dia, estado.folios, registro);

  const sinCerrar = folios.filter((f) => estaSinCerrar(estadoFolio(f, registro)));
  const huerfanos = (registro?.huerfanos ?? []).filter((h) => !h.asignadoA);
  const candidatos = folios.filter((f) => faltante(f) > TOLERANCIA);

  const explicacionLista = (cierre?.explicacion ?? "").trim().length >= 12;
  const evidenciaLista = (cierre?.evidencias.length ?? 0) > 0;
  const puedeFirmar = cuadra || (explicacionLista && evidenciaLista);

  function intentarCerrar() {
    if (!cierre) return;
    if (cuadra) app.cerrarDia(dia, 0);
    else setPidiendo(true);
  }

  return (
    <div className="app">
      <div className="barra">
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
          <button
            className="btn-icono"
            aria-label="Volver"
            data-fb="CIERRE.VOLVER"
            data-fb-nombre="Flecha de volver"
            onClick={() => router.push("/")}
          >
            <Atras s={22} />
          </button>
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }} data-fb="CIERRE.TITULO" data-fb-nombre="Título del cierre">
              Cierre de caja
            </span>
            <span className="caption" style={{ fontSize: 11 }}>
              {fechaCortaISMO(dia)} · Caja 2 · {USUARIO}
            </span>
          </div>
          <BurbujaDia estado={estDia} fb="CIERRE.ESTADO" />
        </div>
      </div>

      <div className="cuerpo">
        {/* ---------------- ARCHIVO ---------------- */}
        <div
          className="card"
          style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
          data-fb="CIERRE.BLOQUE.ARCHIVO"
          data-fb-nombre="Bloque del archivo del sistema"
        >
          <div className="overline" style={{ fontSize: 10 }}>Archivo del sistema</div>

          {!cierre ? (
            <>
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
                className="btn btn-solido btn-alto btn-lleno"
                data-fb="CIERRE.ARCHIVO.SUBIR"
                data-fb-nombre="Botón Subir archivo del sistema"
                onClick={() => entrada.current?.click()}
              >
                <Subir s={22} />
                Subir archivo
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }} data-fb="CIERRE.ARCHIVO.LEIDO" data-fb-nombre="Archivo leído">
              <Documento s={20} style={{ color: "var(--texto-3)" }} />
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                <span className="n" style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {cierre.archivo}
                </span>
                <span className="caption" style={{ fontSize: 11 }}>
                  {hora12(cierre.leidoEn)} · {cierre.recibosSistema} recibos
                </span>
              </div>
              {!firmado && (
                <button
                  className="btn-icono"
                  aria-label="Quitar archivo"
                  data-fb="CIERRE.ARCHIVO.QUITAR"
                  data-fb-nombre="Quitar el archivo del sistema"
                  onClick={() => {
                    if (confirm("¿Volver a leer el archivo?")) app.reabrirDia(dia);
                  }}
                >
                  <Equis s={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---------------- CRUCE ---------------- */}
        {cierre && (
          <div
            className="card entra"
            style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
            data-fb="CIERRE.BLOQUE.CRUCE"
            data-fb-nombre="Bloque del cruce por medio de pago"
          >
            <div className="overline" style={{ fontSize: 10 }}>Cruce por medio de pago · MXN</div>
            <table className="cruce" data-fb="CIERRE.TABLA" data-fb-nombre="Tabla del cruce">
              <thead>
                <tr>
                  <th style={{ width: "34%" }}>Medio</th>
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
                      <td className="n" style={{ fontWeight: mal ? 700 : 400, color: mal ? "var(--error-fg)" : "var(--texto-3)" }}>
                        {mal ? moneySigno(d) : "0.00"}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={{ fontWeight: 700, borderBottom: 0 }}>Total</td>
                  <td className="n" style={{ fontWeight: 700, borderBottom: 0 }}>{money(sumaMedios(cierre.sistema))}</td>
                  <td className="n" style={{ fontWeight: 700, borderBottom: 0 }}>{money(sumaMedios(enFolios))}</td>
                  <td className="n" style={{ fontWeight: 700, borderBottom: 0, color: cuadra ? "var(--exito-fg)" : "var(--error-fg)" }}>
                    {cuadra ? "0.00" : moneySigno(diferencia)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------- CAUSAS ---------------- */}
        {cierre && !cuadra && (huerfanos.length > 0 || sinCerrar.length > 0) && (
          <div
            className="card entra"
            style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
            data-fb="CIERRE.BLOQUE.CAUSAS"
            data-fb-nombre="Bloque de causas de la diferencia"
          >
            <div className="overline" style={{ fontSize: 10 }}>Qué lo explica</div>

            {huerfanos.map((h) => {
              const sugerido = candidatos.find((f) => Math.abs(faltante(f) - h.monto) < 0.01);
              return (
                <div
                  key={h.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                  data-fb="CIERRE.CAUSA.HUERFANO"
                  data-fb-nombre={`Recibo del sistema sin folio ${h.id}`}
                >
                  <span className="chip chip-error">Sin folio</span>
                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {h.id} · <span className="n">{money(h.monto)}</span>
                    </span>
                    <span className="caption" style={{ fontSize: 11 }}>
                      {NOMBRE_MEDIO[h.medio]} · {hora12(h.hora)}
                    </span>
                  </div>
                  {!firmado && sugerido && (
                    <button
                      className="btn btn-linea"
                      style={{ height: 36, padding: "0 12px", fontSize: 13 }}
                      data-fb="CIERRE.CAUSA.ASIGNAR"
                      data-fb-nombre="Botón Asignar el recibo a un folio"
                      onClick={() => app.asignarHuerfano(dia, h.id, sugerido.id)}
                    >
                      Asignar a {sugerido.factura.numero}
                    </button>
                  )}
                  {!firmado && !sugerido && candidatos.length > 0 && (
                    <select
                      className="campo"
                      style={{ maxWidth: 200, height: 36, minHeight: 36, padding: "0 8px" }}
                      defaultValue=""
                      data-fb="CIERRE.CAUSA.ELEGIR"
                      data-fb-nombre="Elegir folio destino"
                      onChange={(e) => e.target.value && app.asignarHuerfano(dia, h.id, e.target.value)}
                    >
                      <option value="">Asignar a…</option>
                      {candidatos.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.factura.numero} · {money(faltante(f))}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}

            {sinCerrar.length > 0 && (
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
                data-fb="CIERRE.CAUSA.PENDIENTES"
                data-fb-nombre="Folios sin cerrar"
              >
                <span className="chip chip-alerta">{sinCerrar.length} sin cerrar</span>
                <div style={{ flexGrow: 1 }} />
                <button
                  className="btn btn-linea"
                  style={{ height: 36, padding: "0 12px", fontSize: 13 }}
                  onClick={() => router.push("/")}
                >
                  Verlos
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- FIRMADO ---------------- */}
        {firmado && cierre && (
          <div
            className="card entra"
            style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
            data-fb="CIERRE.RESULTADO"
            data-fb-nombre="Resultado del cierre firmado"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`chip chip-${cuadra ? "exito" : "error"}`}>
                {cuadra ? "Cerrado y cuadrado" : "Cerrado con diferencia"}
              </span>
              <div style={{ flexGrow: 1 }} />
              <span className="caption" style={{ fontSize: 11 }}>
                {cierre.firmadoPor} · {hora12(cierre.firmadoEn)}
              </span>
            </div>

            {cierre.explicacion && (
              <div
                style={{ fontSize: 13, lineHeight: 1.5, textWrap: "pretty" }}
                data-fb="CIERRE.EXPLICACION.FIRMADA"
                data-fb-nombre="Explicación firmada"
              >
                {cierre.explicacion}
              </div>
            )}
            {cierre.evidencias.map((ev) => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Imagen s={16} style={{ color: "var(--texto-3)" }} />
                <span className="n" style={{ fontSize: 12 }}>{ev.nombre}</span>
              </div>
            ))}

            <button
              className="btn btn-linea"
              data-fb="CIERRE.REABRIR"
              data-fb-nombre="Botón Reabrir el día"
              onClick={() => {
                if (confirm("Reabrir deja los folios editables otra vez. ¿Seguir?")) app.reabrirDia(dia);
              }}
            >
              Reabrir el día
            </button>
          </div>
        )}
      </div>

      {/* ---------------- PIE ---------------- */}
      {cierre && !firmado && (
        <div className="pie" data-fb="CIERRE.PIE" data-fb-nombre="Banner inferior del cierre">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }} data-fb="CIERRE.PIE.AJUSTE" data-fb-nombre="Ajuste total">
              <span className="overline" style={{ fontSize: 10 }}>Ajuste total</span>
              <span
                className="n"
                style={{ fontSize: 20, fontWeight: 700, color: cuadra ? "var(--exito-fg)" : "var(--error-fg)" }}
              >
                {cuadra ? money(0) : moneySigno(diferencia)}
              </span>
            </div>
            <button
              className="btn btn-solido btn-alto"
              style={{ padding: "0 24px", flexShrink: 0 }}
              data-fb="CIERRE.PIE.CERRAR"
              data-fb-nombre="Botón Cerrar"
              onClick={intentarCerrar}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ---------------- DIFERENCIA ---------------- */}
      {pidiendo && cierre && (
        <div className="velo" data-fb-ignorar onClick={() => setPidiendo(false)}>
          <div className="hoja" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabeza">
              <span className="chip chip-error">{moneySigno(diferencia)}</span>
              <div style={{ fontSize: 16, fontWeight: 700, flexGrow: 1 }}>Cierre con diferencia</div>
              <button className="btn-icono" aria-label="Cerrar" onClick={() => setPidiendo(false)}>
                <Equis s={20} />
              </button>
            </div>
            <div className="hoja-cuerpo">
              <label className="etiqueta" htmlFor="exp">Explicación</label>
              <textarea
                id="exp"
                className="campo"
                rows={3}
                autoFocus
                data-fb="CIERRE.DIF.EXPLICACION"
                data-fb-nombre="Campo de explicación de la diferencia"
                placeholder="Qué pasó, con nombres y montos."
                value={cierre.explicacion}
                onChange={(e) => app.setExplicacion(dia, e.target.value)}
              />

              <div className="etiqueta">Evidencia</div>
              {cierre.evidencias.map((ev) => (
                <div
                  key={ev.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--lienzo)", borderRadius: "var(--r-m)" }}
                  data-fb="CIERRE.DIF.EVIDENCIA"
                  data-fb-nombre="Evidencia adjunta"
                >
                  <Imagen s={18} style={{ color: "var(--texto-3)" }} />
                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                    <span className="n" style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.nombre}
                    </span>
                    <span className="caption" style={{ fontSize: 11 }}>{ev.tam}</span>
                  </div>
                  <button className="btn-icono" aria-label="Quitar" onClick={() => app.quitarEvidencia(dia, ev.id)}>
                    <Equis s={18} />
                  </button>
                </div>
              ))}

              <BotonesCaptura
                fbCamara="CIERRE.DIF.CAMARA"
                fbArchivo="CIERRE.DIF.ARCHIVO"
                etiquetaCamara="Tomar foto"
                etiquetaArchivo="Subir archivo"
                grandes={false}
                onArchivo={(n) => app.agregarEvidencia(dia, n)}
              />

              <button
                className="btn btn-solido btn-alto btn-lleno"
                disabled={!puedeFirmar}
                data-fb="CIERRE.DIF.CONFIRMAR"
                data-fb-nombre="Botón Cerrar con diferencia"
                onClick={() => {
                  app.cerrarDia(dia, diferencia);
                  setPidiendo(false);
                }}
              >
                Cerrar con diferencia
              </button>
            </div>
          </div>
        </div>
      )}

      <Flotantes />
    </div>
  );
}
