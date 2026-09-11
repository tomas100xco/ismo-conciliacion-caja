export type Medio = "efectivo" | "credito" | "debito" | "spei";

export const MEDIOS: Medio[] = ["efectivo", "credito", "debito", "spei"];

export const NOMBRE_MEDIO: Record<Medio, string> = {
  efectivo: "Efectivo",
  credito: "Tarjeta de crédito",
  debito: "Tarjeta de débito",
  spei: "Transferencia SPEI",
};

/** Sólo los medios que pasan por la terminal bancaria exigen tirilla. */
export const EXIGE_TIRILLA: Record<Medio, boolean> = {
  efectivo: false,
  credito: true,
  debito: true,
  spei: false,
};

export type EstadoDocumento = "subiendo" | "leyendo" | "leido" | "rechazado";

export type Tirilla = {
  id: string;
  archivo: string;
  monto: number;
  ultimos4: string;
  autorizacion: string;
  hora: string;
  estado: EstadoDocumento;
  progreso: number;
  etapa: string;
  motivo?: string;
  detalle?: string;
  original: { monto: number; ultimos4: string; autorizacion: string; hora: string };
};

export type Recibo = {
  id: string;
  numero: string;
  fecha: string;
  monto: number;
  medio: Medio;
  hora: string;
  archivo: string;
  estado: EstadoDocumento;
  progreso: number;
  etapa: string;
  motivo?: string;
  detalle?: string;
  tirilla: Tirilla | null;
  original: { numero: string; fecha: string; monto: number; medio: Medio; hora: string };
};

export type Factura = {
  numero: string;
  fecha: string;
  cliente: string;
  subtotal: number;
  total: number;
  archivo: string;
  estado: EstadoDocumento;
  progreso: number;
  etapa: string;
  motivo?: string;
  detalle?: string;
  original: { numero: string; fecha: string; cliente: string; subtotal: number; total: number };
};

export type Folio = {
  id: string;
  dia: string;
  caja: string;
  factura: Factura;
  recibos: Recibo[];
  creadoEn: number;
};

export type Evidencia = { id: string; nombre: string; tam: string; hora: string };

export type Huerfano = {
  id: string;
  medio: Medio;
  monto: number;
  hora: string;
  asignadoA: string | null;
};

export type Cierre = {
  archivo: string;
  leidoEn: string;
  /** Instantánea del archivo del DMS: se congela al leerlo y ya no se mueve. */
  sistema: Record<Medio, number>;
  recibosSistema: number;
  explicacion: string;
  evidencias: Evidencia[];
  diferencia: number;
  firmadoPor: string;
  firmadoEn: number;
};

export type Dia = {
  fecha: string;
  /** Recibos que el DMS sí tiene y ningún folio reclama. */
  huerfanos: Huerfano[];
  cierre: Cierre | null;
  validadoPor: string | null;
  validadoEn: number | null;
};

export type EstadoFolio =
  | "abierto"
  | "parcial"
  | "falta-tirilla"
  | "descuadre"
  | "cuadrado"
  | "conciliado"
  | "validado";

export type EstadoDia =
  | "sin-movimiento"
  | "sin-cerrar"
  | "cerrado-con-diferencia"
  | "conciliado"
  | "validado";

export type Auditoria = {
  id: string;
  en: number;
  usuario: string;
  entidad: string;
  entidadId: string;
  folioId: string;
  dia: string;
  campo: string;
  original: string;
  anterior: string;
  nuevo: string;
};

export type Estado = {
  dias: Record<string, Dia>;
  folios: Folio[];
  auditoria: Auditoria[];
  diaSeleccionado: string;
  simularRechazo: boolean;
};
