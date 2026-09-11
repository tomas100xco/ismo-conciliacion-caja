"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  CAJA,
  INICIALES,
  SUCURSAL,
  fechaCortaISMO,
  hora12,
  hoyISO,
  money,
  pct,
  selloActualizado,
  sumaDias,
} from "@/lib/formato";
import {
  cobrado,
  enProceso,
  estadoDia,
  estadoFolio,
  estaSinCerrar,
  rechazados,
  totalesDia,
} from "@/lib/reglas";
import { BurbujaDia, BurbujaFolio } from "@/components/Estado";
import { Numero } from "@/components/Numero";
import { Calendario } from "@/components/Calendario";
import { Flotantes } from "@/components/Flotantes";
import { Abajo, Camara, Der, Girando, Izq } from "@/components/Iconos";

type Filtro = "todos" | "sin-cerrar" | "cuadrados";

export default function PaginaDia() {
  const router = useRouter();
  const app = useApp();
  const { estado } = app;
  const [verCal, setVerCal] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const entrada = useRef<HTMLInputElement>(null);
  const ahora = Date.now();

  const dia = estado.diaSeleccionado;
  const registro = estado.dias[dia];
  const folios = useMemo(
    () => estado.folios.filter((f) => f.dia === dia).sort((a, b) => b.creadoEn - a.creadoEn),
    [estado.folios, dia]
  );

  const totales = totalesDia(folios);
  const estDia = estadoDia(dia, estado.folios, registro);
  const conEstado = folios.map((f) => ({ f, e: estadoFolio(f, registro) }));
  const nSinCerrar = conEstado.filter((x) => estaSinCerrar(x.e)).length;

  const visibles = conEstado.filter((x) => {
    if (filtro === "sin-cerrar") return estaSinCerrar(x.e);
    if (filtro === "cuadrados") return !estaSinCerrar(x.e);
    return true;
  });

  const esHoy = dia === hoyISO();

  function nuevoRegistro(nombre: string) {
    const id = app.crearFolio(nombre);
    router.push(`/folio/${id}`);
  }

  return (
    <div className="app">
      <div className="barra">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 12px 10px" }}>
          {/* ---- barra de fechas: lo único que va arriba ---- */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className="btn-icono"
              aria-label="Día anterior"
              data-fb="DIA.FECHA.ANTERIOR"
              data-fb-nombre="Flecha de día anterior"
              onClick={() => app.seleccionarDia(sumaDias(dia, -1))}
            >
              <Izq />
            </button>

            <div data-fb="DIA.ESTADO.BURBUJA" data-fb-nombre="Burbuja de estado del día">
              <BurbujaDia estado={estDia} />
            </div>

            <button
              className="btn"
              style={{ flexGrow: 1, minWidth: 0, justifyContent: "flex-start", gap: 6, paddingLeft: 4 }}
              data-fb="DIA.FECHA.SELECTOR"
              data-fb-nombre="Selector de fecha"
              onClick={() => setVerCal(true)}
            >
              <span className="n" style={{ fontSize: 17, fontWeight: 700 }}>
                {fechaCortaISMO(dia)}
              </span>
              <Abajo s={16} style={{ color: "var(--texto-3)" }} />
            </button>

            {!esHoy && (
              <button
                className="btn btn-linea"
                style={{ height: 34, padding: "0 10px", fontSize: 13 }}
                data-fb="DIA.FECHA.HOY"
                data-fb-nombre="Botón Hoy"
                onClick={() => app.seleccionarDia(hoyISO())}
              >
                Hoy
              </button>
            )}

            <button
              className="btn-icono"
              aria-label="Día siguiente"
              disabled={dia >= hoyISO()}
              data-fb="DIA.FECHA.SIGUIENTE"
              data-fb-nombre="Flecha de día siguiente"
              onClick={() => app.seleccionarDia(sumaDias(dia, 1))}
            >
              <Der />
            </button>

            <button
              className="btn-icono"
              aria-label={`Perfil de ${INICIALES}`}
              data-fb="DIA.PERFIL"
              data-fb-nombre="Botón de perfil del usuario"
              style={{
                background: "var(--hueco)",
                color: "var(--neutro-fg)",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 999,
                width: 34,
                height: 34,
              }}
            >
              {INICIALES}
            </button>
          </div>

          <div
            className="caption"
            style={{ fontSize: 11, marginTop: -4 }}
            data-fb="DIA.META"
            data-fb-nombre="Caja, sucursal y sello de actualización"
          >
            {CAJA} · {SUCURSAL} · {selloActualizado(ahora)}
          </div>

          {/* ---- consolidado ---- */}
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}
            data-fb="DIA.CONSOLIDADO"
            data-fb-nombre="Consolidado del día"
          >
            <div data-fb="DIA.KPI.FACTURADO" data-fb-nombre="Indicador Facturado">
              <div className="overline" style={{ fontSize: 10 }}>Facturado</div>
              <Numero valor={totales.facturado} style={{ fontSize: 19, fontWeight: 700 }} />
            </div>
            <div data-fb="DIA.KPI.COBRADO" data-fb-nombre="Indicador Cobrado">
              <div className="overline" style={{ fontSize: 10 }}>Cobrado</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                <Numero valor={totales.cobrado} style={{ fontSize: 19, fontWeight: 700 }} />
                <span className="n" style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-3)" }}>
                  {pct(totales.cobrado, totales.facturado)}%
                </span>
              </div>
            </div>
            <div data-fb="DIA.KPI.PORCOBRAR" data-fb-nombre="Indicador Por cobrar">
              <div className="overline" style={{ fontSize: 10 }}>Por cobrar</div>
              <Numero
                valor={totales.porCobrar}
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: totales.porCobrar > 0.005 ? "var(--alerta-fg)" : undefined,
                }}
              />
            </div>
          </div>

          {/* ---- filtro ---- */}
          <div className="segmentos" data-fb="DIA.FILTRO" data-fb-nombre="Filtro de folios">
            <button
              className="segmento"
              data-activo={filtro === "todos"}
              data-fb="DIA.FILTRO.TODOS"
              data-fb-nombre="Filtro Todos"
              onClick={() => setFiltro("todos")}
            >
              Todos <span className="n" style={{ color: "var(--texto-3)" }}>{conEstado.length}</span>
            </button>
            <button
              className="segmento"
              data-activo={filtro === "sin-cerrar"}
              data-fb="DIA.FILTRO.SINCERRAR"
              data-fb-nombre="Filtro Sin cerrar"
              style={{ color: nSinCerrar > 0 && filtro !== "sin-cerrar" ? "var(--alerta-fg)" : undefined }}
              onClick={() => setFiltro("sin-cerrar")}
            >
              Sin cerrar <span className="n">{nSinCerrar}</span>
            </button>
            <button
              className="segmento"
              data-activo={filtro === "cuadrados"}
              data-fb="DIA.FILTRO.CUADRADOS"
              data-fb-nombre="Filtro Cuadrados"
              onClick={() => setFiltro("cuadrados")}
            >
              Cuadrados{" "}
              <span className="n" style={{ color: "var(--texto-3)" }}>
                {conEstado.length - nSinCerrar}
              </span>
            </button>
          </div>

          {/* ---- primer botón, siempre visible ---- */}
          <input
            ref={entrada}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              nuevoRegistro(f?.name ?? `factura_${Date.now()}.jpg`);
              e.target.value = "";
            }}
          />
          <button
            className="btn btn-solido btn-alto btn-lleno"
            data-fb="DIA.ACCION.NUEVA"
            data-fb-nombre="Botón Nuevo registro"
            onClick={() => entrada.current?.click()}
          >
            <Camara s={22} />
            Nuevo registro
          </button>
        </div>
      </div>

      {/* ================= LISTA ================= */}
      <div
        className="cuerpo"
        style={{ gap: 6 }}
        data-fb="DIA.LISTA"
        data-fb-nombre="Lista de folios del día"
      >
        {visibles.length === 0 && (
          <div
            className="card entra"
            style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}
            data-fb="DIA.VACIO"
            data-fb-nombre="Estado vacío de la lista"
          >
            <img
              src="https://100x-design.vercel.app/02_MARCAS/ISU/FOTOS/ISU_ILUS_SIN_DATOS.webp"
              alt=""
              width={160}
              height={120}
              style={{ maxWidth: "55%", height: "auto", borderRadius: "var(--r-m)", opacity: 0.9 }}
            />
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {folios.length === 0 ? "Sin folios este día" : "Nada con ese filtro"}
            </div>
          </div>
        )}

        {visibles.map(({ f, e }, i) => {
          const proc = enProceso(f);
          const rech = rechazados(f).length;
          const nRec = f.recibos.filter((r) => r.estado === "leido").length;
          const avance = f.factura.total ? cobrado(f) / f.factura.total : 0;

          const meta: string[] = [hora12(f.creadoEn)];
          meta.push(nRec === 0 ? "sin recibos" : `${nRec} recibo${nRec === 1 ? "" : "s"}`);
          if (rech) meta.push(`${rech} rechazado${rech === 1 ? "" : "s"}`);

          return (
            <button
              key={f.id}
              className="fila entra"
              style={{ animationDelay: `${Math.min(i, 8) * 24}ms` }}
              data-fb="DIA.FOLIO.FILA"
              data-fb-nombre={`Fila de folio ${f.factura.numero}`}
              onClick={() => router.push(`/folio/${f.id}`)}
            >
              <div className="fila-texto">
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {f.factura.numero || "Leyendo…"}
                </span>
                <span className="caption" style={{ fontSize: 11 }}>
                  {meta.join(" · ")}
                </span>
              </div>

              <span
                className="n"
                style={{ fontSize: 16, fontWeight: 600, textAlign: "right", flexShrink: 0 }}
                data-fb="DIA.FOLIO.MONTO"
                data-fb-nombre="Monto de la factura en la fila"
              >
                {money(f.factura.total)}
              </span>

              {proc ? (
                <span
                  className="burbuja-estado"
                  style={{ color: "var(--texto-3)" }}
                  data-fb="DIA.FOLIO.LEYENDO"
                  data-fb-nombre="Folio con un documento leyéndose"
                >
                  <Girando s={20} />
                </span>
              ) : (
                <BurbujaFolio estado={e} avance={avance} />
              )}
            </button>
          );
        })}
      </div>

      {/* ================= CIERRE ================= */}
      <div className="pie">
        <button
          className="btn btn-linea btn-alto btn-lleno"
          data-fb="DIA.ACCION.CERRAR"
          data-fb-nombre="Botón Cerrar caja del día"
          onClick={() => router.push("/cierre")}
        >
          {registro?.cierre ? "Ver el cierre" : "Cerrar caja del día"}
        </button>
      </div>

      {verCal && <Calendario onCerrar={() => setVerCal(false)} />}
      <Flotantes />
    </div>
  );
}
