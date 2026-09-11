"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  CAJA,
  SUCURSAL,
  aFecha,
  fechaLarga,
  haceRato,
  horaCorta,
  hoyISO,
  money,
  pct,
  sumaDias,
} from "@/lib/formato";
import {
  cobrado,
  enProceso,
  estadoDia,
  estadoFolio,
  estaSinCerrar,
  faltante,
  rechazados,
  tirillasPendientes,
  totalesDia,
} from "@/lib/reglas";
import { ChipDia, ChipFolio } from "@/components/Chips";
import { Numero } from "@/components/Numero";
import { Calendario } from "@/components/Calendario";
import { Panel } from "@/components/Panel";
import {
  Alerta,
  CalendarioOk,
  Camara,
  Der,
  Documento,
  Girando,
  Izq,
  Marca,
  Palomita,
  Tarjeta,
} from "@/components/Iconos";
import { EstadoFolio, NOMBRE_MEDIO } from "@/lib/tipos";

const TONO_BG: Record<string, string> = {
  "sin-movimiento": "var(--neutro-bg)",
  "sin-cerrar": "var(--alerta-bg)",
  "cerrado-con-diferencia": "var(--error-bg)",
  conciliado: "var(--info-bg)",
  validado: "var(--violeta-bg)",
};
const TONO_FG: Record<string, string> = {
  "sin-movimiento": "var(--neutro-fg)",
  "sin-cerrar": "var(--alerta-fg)",
  "cerrado-con-diferencia": "var(--error-fg)",
  conciliado: "var(--info-fg)",
  validado: "var(--violeta-fg)",
};

const FORMA: Record<string, Parameters<typeof Marca>[0]["forma"]> = {
  "sin-movimiento": "aro",
  "sin-cerrar": "triangulo",
  "cerrado-con-diferencia": "octagono",
  conciliado: "cuadrado",
  validado: "doble",
};

type Filtro = "todos" | "sin-cerrar" | "cuadrados";

export default function PaginaDia() {
  const router = useRouter();
  const app = useApp();
  const { estado } = app;
  const [verCal, setVerCal] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const entradaFactura = useRef<HTMLInputElement>(null);
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
  const nCuadrados = conEstado.length - nSinCerrar;

  const visibles = conEstado.filter((x) => {
    if (filtro === "sin-cerrar") return estaSinCerrar(x.e);
    if (filtro === "cuadrados") return !estaSinCerrar(x.e);
    return true;
  });

  const diaSel = aFecha(dia);
  const esHoy = dia === hoyISO();

  function nuevaFactura(nombre: string) {
    const id = app.crearFolio(nombre);
    router.push(`/folio/${id}`);
  }

  return (
    <div className="app">
      {/* ================= CABECERA ================= */}
      <div className="barra" style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "14px 20px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div
              className="overline"
              data-fb="DIA.CABECERA.TITULO"
              data-fb-nombre="Título de la app"
            >
              Conciliación de caja
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-2)" }}
                data-fb="DIA.CABECERA.CAJA"
                data-fb-nombre="Caja y sucursal"
              >
                {CAJA} · {SUCURSAL}
              </div>
              <div
                data-fb="DIA.CABECERA.USUARIO"
                data-fb-nombre="Usuario en sesión"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "var(--hueco)",
                  color: "var(--neutro-fg)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                TM
              </div>
            </div>
          </div>

          {/* ---- selector de día ---- */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-linea"
              style={{ width: 44, padding: 0 }}
              aria-label="Día anterior"
              data-fb="DIA.FECHA.ANTERIOR"
              data-fb-nombre="Flecha de día anterior"
              onClick={() => app.seleccionarDia(sumaDias(dia, -1))}
            >
              <Izq />
            </button>

            <button
              className="btn btn-linea"
              style={{ flexGrow: 1, minWidth: 0, fontWeight: 600, fontSize: 16, gap: 10 }}
              data-fb="DIA.FECHA.SELECTOR"
              data-fb-nombre="Selector de fecha · abre el calendario"
              onClick={() => setVerCal(true)}
            >
              <span
                className="chip"
                style={{
                  background: TONO_BG[estDia],
                  color: TONO_FG[estDia],
                  height: 30,
                  fontFamily: "var(--num)",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <Marca forma={FORMA[estDia]} />
                {diaSel.getDate()}
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fechaLarga(dia)}
              </span>
            </button>

            {!esHoy && (
              <button
                className="btn btn-linea-fuerte"
                data-fb="DIA.FECHA.HOY"
                data-fb-nombre="Botón Hoy"
                onClick={() => app.seleccionarDia(hoyISO())}
              >
                Hoy
              </button>
            )}

            <button
              className="btn btn-linea"
              style={{ width: 44, padding: 0 }}
              aria-label="Día siguiente"
              disabled={dia >= hoyISO()}
              data-fb="DIA.FECHA.SIGUIENTE"
              data-fb-nombre="Flecha de día siguiente"
              onClick={() => app.seleccionarDia(sumaDias(dia, 1))}
            >
              <Der />
            </button>
          </div>

          {/* ---- consolidado ---- */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "14px 16px",
              background: "var(--lienzo)",
              borderRadius: "var(--r-l)",
            }}
            data-fb="DIA.CONSOLIDADO"
            data-fb-nombre="Consolidado del día"
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
                data-fb="DIA.KPI.FACTURADO"
                data-fb-nombre="Indicador Facturado"
              >
                <div className="overline">Facturado</div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 5 }}>
                  <Numero valor={totales.facturado} style={{ fontSize: 24, fontWeight: 700 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-3)" }}>MXN</span>
                </div>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
                data-fb="DIA.KPI.COBRADO"
                data-fb-nombre="Indicador Cobrado"
              >
                <div className="overline">Cobrado</div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 5 }}>
                  <Numero valor={totales.cobrado} style={{ fontSize: 24, fontWeight: 700 }} />
                  <span className="n" style={{ fontSize: 14, fontWeight: 600, color: "var(--texto-2)" }}>
                    · {pct(totales.cobrado, totales.facturado)} %
                  </span>
                </div>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
                data-fb="DIA.KPI.PORCOBRAR"
                data-fb-nombre="Indicador Por cobrar"
              >
                <div className="overline">Por cobrar</div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 5 }}>
                  <Numero
                    valor={totales.porCobrar}
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: totales.porCobrar > 0.005 ? "var(--alerta-fg)" : "var(--texto-1)",
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-3)" }}>MXN</span>
                </div>
              </div>
            </div>

            <div className="riel" data-fb="DIA.KPI.BARRA" data-fb-nombre="Barra de avance del cobro">
              <i style={{ width: `${Math.min(100, pct(totales.cobrado, totales.facturado))}%` }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="caption" data-fb="DIA.KPI.ACTUALIZADO" data-fb-nombre="Sello de actualización">
                Actualizado {horaCorta(ahora)}
              </div>
              <div style={{ flexGrow: 1 }} />
              {registro?.cierre && <ChipDia estado={estDia} fb="DIA.ESTADO" />}
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
              Todos <span className="n" style={{ fontSize: 12, fontWeight: 700, color: "var(--texto-3)" }}>{conEstado.length}</span>
            </button>
            <button
              className="segmento"
              data-activo={filtro === "sin-cerrar"}
              data-fb="DIA.FILTRO.SINCERRAR"
              data-fb-nombre="Filtro Sin cerrar"
              style={{ color: nSinCerrar > 0 ? "var(--alerta-fg)" : undefined }}
              onClick={() => setFiltro("sin-cerrar")}
            >
              <Alerta s={16} />
              Sin cerrar <span className="n" style={{ fontSize: 12, fontWeight: 700 }}>{nSinCerrar}</span>
            </button>
            <button
              className="segmento"
              data-activo={filtro === "cuadrados"}
              data-fb="DIA.FILTRO.CUADRADOS"
              data-fb-nombre="Filtro Cuadrados"
              onClick={() => setFiltro("cuadrados")}
            >
              Cuadrados <span className="n" style={{ fontSize: 12, fontWeight: 700, color: "var(--texto-3)" }}>{nCuadrados}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= LISTA ================= */}
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 20px 24px", flexGrow: 1 }}
        data-fb="DIA.LISTA"
        data-fb-nombre="Lista de folios del día"
      >
        {visibles.length === 0 && (
          <div
            className="card entra"
            style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}
            data-fb="DIA.VACIO"
            data-fb-nombre="Estado vacío de la lista"
          >
            <img
              src="https://100x-design.vercel.app/02_MARCAS/ISU/FOTOS/ISU_ILUS_SIN_DATOS.webp"
              alt=""
              width={180}
              height={135}
              style={{ maxWidth: "60%", height: "auto", borderRadius: "var(--r-m)", opacity: 0.9 }}
            />
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {folios.length === 0 ? "Este día no tiene folios" : "Nada con ese filtro"}
            </div>
            <div className="caption" style={{ maxWidth: 340, textWrap: "pretty" }}>
              {folios.length === 0
                ? "Toma la foto de una factura y el folio nace solo."
                : "Cambia el filtro para ver el resto de los folios del día."}
            </div>
          </div>
        )}

        {visibles.map(({ f, e }, i) => {
          const falta = faltante(f);
          const pendientes = tirillasPendientes(f).length;
          const rech = rechazados(f).length;
          const proc = enProceso(f);
          const porcentaje = pct(cobrado(f), f.factura.total);

          const meta: string[] = [];
          const nRec = f.recibos.filter((r) => r.estado === "leido").length;
          meta.push(nRec === 0 ? "sin recibos" : `${nRec} recibo${nRec === 1 ? "" : "s"}`);
          if (rech) meta.push(`${rech} rechazado${rech === 1 ? "" : "s"}`);
          if (e === "descuadre") meta.push("un documento contradice a otro");
          else if (falta > 0.005) meta.push(`faltan ${money(falta)}`);
          else if (pendientes) meta.push(`${pendientes} tirilla${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}`);
          else meta.push(haceRato(f.creadoEn, ahora));

          const icono =
            e === "descuadre" ? (
              <Alerta s={20} />
            ) : e === "falta-tirilla" ? (
              <Tarjeta s={20} />
            ) : e === "cuadrado" || e === "conciliado" || e === "validado" ? (
              <Palomita s={20} />
            ) : (
              <Documento s={20} />
            );

          const fondoIcono: Record<EstadoFolio, string> = {
            abierto: "var(--hueco)",
            parcial: "var(--hueco)",
            "falta-tirilla": "var(--hueco)",
            descuadre: "var(--error-bg)",
            cuadrado: "var(--exito-bg)",
            conciliado: "var(--info-bg)",
            validado: "var(--violeta-bg)",
          };
          const colorIcono: Record<EstadoFolio, string> = {
            abierto: "var(--texto-3)",
            parcial: "var(--texto-3)",
            "falta-tirilla": "var(--texto-3)",
            descuadre: "var(--error-fg)",
            cuadrado: "var(--exito-fg)",
            conciliado: "var(--info-fg)",
            validado: "var(--violeta-fg)",
          };

          return (
            <button
              key={f.id}
              className="fila entra"
              style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
              data-fb="DIA.FOLIO.FILA"
              data-fb-nombre={`Fila de folio ${f.factura.numero}`}
              onClick={() => router.push(`/folio/${f.id}`)}
            >
              <div className="miniatura" style={{ background: fondoIcono[e], color: colorIcono[e] }}>
                {proc ? <Girando s={20} /> : icono}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{f.factura.numero || "Leyendo…"}</span>
                  <span className="n" style={{ fontSize: 16, fontWeight: 600 }} data-fb="DIA.FOLIO.MONTO" data-fb-nombre="Monto de la factura en la fila">
                    {money(f.factura.total)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--texto-2)" }}>{meta.join(" · ")}</div>
                {e === "parcial" && (
                  <div className="riel" style={{ height: 4, marginTop: 2 }}>
                    <i style={{ width: `${porcentaje}%`, background: "var(--alerta)" }} />
                  </div>
                )}
              </div>

              <ChipFolio
                estado={e}
                extra={e === "parcial" ? `${porcentaje} %` : undefined}
                fb="DIA.FOLIO.ESTADO"
              />
              <Der s={20} style={{ color: "var(--borde-2)" }} />
            </button>
          );
        })}

        {visibles.length > 0 && (
          <div className="caption" style={{ padding: "4px 2px" }}>
            Fin de la lista · {visibles.length} de {conEstado.length} folios
          </div>
        )}
      </div>

      {/* ================= ACCIONES ================= */}
      <div className="pie">
        <div className="par" style={{ padding: "16px 20px" }}>
          <input
            ref={entradaFactura}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              nuevaFactura(f?.name ?? `factura_${Date.now()}.jpg`);
              e.target.value = "";
            }}
          />
          <button
            className="btn btn-grande btn-solido"
            data-fb="DIA.ACCION.NUEVA"
            data-fb-nombre="Botón Nueva factura"
            onClick={() => entradaFactura.current?.click()}
          >
            <Camara s={24} />
            Nueva factura
          </button>
          <button
            className="btn btn-grande btn-linea-fuerte"
            data-fb="DIA.ACCION.CERRAR"
            data-fb-nombre="Botón Cerrar caja del día"
            onClick={() => router.push("/cierre")}
          >
            <CalendarioOk s={24} />
            {registro?.cierre ? "Ver el cierre" : "Cerrar caja del día"}
          </button>
        </div>
      </div>

      {verCal && <Calendario onCerrar={() => setVerCal(false)} />}
      <Panel />
    </div>
  );
}
