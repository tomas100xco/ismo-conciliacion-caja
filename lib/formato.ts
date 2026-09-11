export const USUARIO = "Tomás M.";
export const INICIALES = "TM";
export const CAJA = "Caja 2";
export const SUCURSAL = "Satélite";

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(n: number): string {
  return fmtMoneda.format(Math.abs(n) < 0.005 ? 0 : n);
}

export function moneySigno(n: number): string {
  if (Math.abs(n) < 0.005) return "0.00";
  return (n < 0 ? "−" : "+") + fmtMoneda.format(Math.abs(n));
}

export function pct(parte: number, total: number): number {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const INICIAL_DIA = ["D", "L", "M", "M", "J", "V", "S"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
export const MESES_CORTO = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Fechas ISO yyyy-mm-dd tratadas siempre como fecha local, nunca UTC. */
export function aFecha(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function aISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

export function hoyISO(): string {
  return aISO(new Date());
}

export function sumaDias(iso: string, n: number): string {
  const d = aFecha(iso);
  d.setDate(d.getDate() + n);
  return aISO(d);
}

/** V 11/09/26 */
export function fechaCortaISMO(iso: string): string {
  const d = aFecha(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aa = String(d.getFullYear()).slice(2);
  return `${INICIAL_DIA[d.getDay()]} ${dd}/${mm}/${aa}`;
}

export function fechaLarga(iso: string): string {
  const d = aFecha(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}

export function fechaDDMMAAAA(iso: string): string {
  const d = aFecha(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function nombreMes(mes: number): string {
  return MESES[mes];
}

/** 7:45AM · 1:34PM */
export function hora12(ts: number | string): string {
  let h: number;
  let m: number;
  if (typeof ts === "string") {
    const [hh, mm] = ts.split(":").map(Number);
    h = hh;
    m = mm;
  } else {
    const d = new Date(ts);
    h = d.getHours();
    m = d.getMinutes();
  }
  const suf = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}${suf}`;
}

/** Actu. 7:34 a.m */
export function selloActualizado(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const suf = h >= 12 ? "p.m" : "a.m";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `Actu. ${h12}:${String(d.getMinutes()).padStart(2, "0")} ${suf}`;
}

export function id(prefijo: string): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`;
}
