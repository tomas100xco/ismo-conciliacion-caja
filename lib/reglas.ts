import {
  Dia,
  EstadoDia,
  EstadoFolio,
  EXIGE_TIRILLA,
  Folio,
  Medio,
  MEDIOS,
  Recibo,
} from "./tipos";

export const TOLERANCIA = 0.005;

export function recibosValidos(f: Folio): Recibo[] {
  return f.recibos.filter((r) => r.estado === "leido");
}

export function cobrado(f: Folio): number {
  return recibosValidos(f).reduce((s, r) => s + r.monto, 0);
}

export function faltante(f: Folio): number {
  return f.factura.total - cobrado(f);
}

/** Tirillas que el folio exige y todavía no tiene. */
export function tirillasPendientes(f: Folio): Recibo[] {
  return recibosValidos(f).filter(
    (r) => EXIGE_TIRILLA[r.medio] && (!r.tirilla || r.tirilla.estado !== "leido")
  );
}

/** Un documento contradice a otro: la tirilla no cuadra con su recibo. */
export function tirillasDescuadradas(f: Folio): Recibo[] {
  return recibosValidos(f).filter(
    (r) =>
      r.tirilla &&
      r.tirilla.estado === "leido" &&
      Math.abs(r.tirilla.monto - r.monto) > TOLERANCIA
  );
}

export function enProceso(f: Folio): boolean {
  if (f.factura.estado === "subiendo" || f.factura.estado === "leyendo") return true;
  return f.recibos.some(
    (r) =>
      r.estado === "subiendo" ||
      r.estado === "leyendo" ||
      (r.tirilla && (r.tirilla.estado === "subiendo" || r.tirilla.estado === "leyendo"))
  );
}

export function rechazados(f: Folio): Recibo[] {
  return f.recibos.filter((r) => r.estado === "rechazado");
}

export function estadoFolio(f: Folio, dia: Dia | undefined): EstadoFolio {
  const base = estadoFolioBase(f);
  if (base !== "cuadrado") return base;
  if (dia?.validadoEn) return "validado";
  if (dia?.cierre) return "conciliado";
  return "cuadrado";
}

function estadoFolioBase(f: Folio): EstadoFolio {
  const validos = recibosValidos(f);
  const suma = validos.reduce((s, r) => s + r.monto, 0);

  if (tirillasDescuadradas(f).length > 0) return "descuadre";
  if (suma - f.factura.total > TOLERANCIA) return "descuadre";
  if (validos.length === 0) return "abierto";
  if (f.factura.total - suma > TOLERANCIA) return "parcial";
  if (tirillasPendientes(f).length > 0) return "falta-tirilla";
  return "cuadrado";
}

export const SIN_CERRAR: EstadoFolio[] = ["abierto", "parcial", "falta-tirilla", "descuadre"];

export function estaSinCerrar(e: EstadoFolio): boolean {
  return SIN_CERRAR.includes(e);
}

export const ETIQUETA_FOLIO: Record<EstadoFolio, string> = {
  abierto: "Abierto",
  parcial: "Parcial",
  "falta-tirilla": "Falta tirilla",
  descuadre: "Descuadre",
  cuadrado: "Cuadrado",
  conciliado: "Conciliado",
  validado: "Validado",
};

export type Tono = "neutro" | "alerta" | "error" | "exito" | "info" | "violeta";

export const TONO_FOLIO: Record<EstadoFolio, Tono> = {
  abierto: "neutro",
  parcial: "alerta",
  "falta-tirilla": "alerta",
  descuadre: "error",
  cuadrado: "exito",
  conciliado: "info",
  validado: "violeta",
};

export const ETIQUETA_DIA: Record<EstadoDia, string> = {
  "sin-movimiento": "Sin movimiento",
  "sin-cerrar": "Sin cerrar",
  "cerrado-con-diferencia": "Cerrado con diferencia",
  conciliado: "Conciliado",
  validado: "Validado",
};

export const TONO_DIA: Record<EstadoDia, Tono> = {
  "sin-movimiento": "neutro",
  "sin-cerrar": "alerta",
  "cerrado-con-diferencia": "error",
  conciliado: "info",
  validado: "violeta",
};

export function estadoDia(
  fecha: string,
  folios: Folio[],
  dia: Dia | undefined
): EstadoDia {
  const delDia = folios.filter((f) => f.dia === fecha);
  if (dia?.validadoEn) return "validado";
  if (dia?.cierre) {
    return Math.abs(dia.cierre.diferencia) > TOLERANCIA
      ? "cerrado-con-diferencia"
      : "conciliado";
  }
  if (delDia.length === 0) return "sin-movimiento";
  return "sin-cerrar";
}

/** Totales del encabezado del día. */
export function totalesDia(folios: Folio[]) {
  const facturado = folios.reduce((s, f) => s + f.factura.total, 0);
  const cob = folios.reduce((s, f) => s + cobrado(f), 0);
  return { facturado, cobrado: cob, porCobrar: facturado - cob };
}

/** Lo capturado en folios, partido por medio de pago. */
export function porMedioEnFolios(folios: Folio[]): Record<Medio, number> {
  const out = { efectivo: 0, credito: 0, debito: 0, spei: 0 } as Record<Medio, number>;
  for (const f of folios) {
    for (const r of recibosValidos(f)) out[r.medio] += r.monto;
  }
  return out;
}

export function sumaMedios(m: Record<Medio, number>): number {
  return MEDIOS.reduce((s, k) => s + m[k], 0);
}
