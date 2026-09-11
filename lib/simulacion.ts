import { fechaDDMMAAAA, money } from "./formato";
import { faltante, recibosValidos } from "./reglas";
import { Folio, Medio, Recibo } from "./tipos";

/* ================================================================
   Extracción simulada. No hay OCR: hay un guion que se comporta
   como se comportaría un lector real sobre estos documentos.
   ================================================================ */

const CLIENTES = [
  "Comercial Vega SA",
  "Transportes del Bajío",
  "Rocío Márquez Alcántara",
  "Grupo Ferretero Núñez",
  "Ana Sofía Bermúdez",
  "Distribuidora El Roble",
  "Refacciones Zaragoza",
  "Ignacio Treviño Salas",
  "Constructora Arteaga",
  "Laura Pineda Ruvalcaba",
  "Autotransportes Quiroz",
  "Mariana Estrada Cid",
  "Servicios Integrales Ocaranza",
  "Verónica Lizárraga Peña",
];

function elige<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

function horaAhora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function siguienteNumero(usados: string[], prefijo: string, base: number): string {
  const propios = usados
    .filter((u) => u.startsWith(prefijo))
    .map((u) => parseInt(u.slice(prefijo.length), 10))
    .filter((n) => !Number.isNaN(n));
  const max = propios.length ? Math.max(...propios) : base;
  return `${prefijo}${max + 1}`;
}

export function extraerFactura(dia: string, numerosUsados: string[]) {
  const esServicio = Math.random() > 0.45;
  const numero = esServicio
    ? siguienteNumero(numerosUsados, "FS-", 9048)
    : siguienteNumero(numerosUsados, "A-", 14875);

  // Montos de piso: refacciones y servicio abajo, unidades arriba.
  const total = esServicio
    ? Math.round((900 + Math.random() * 14000) * 100) / 100
    : Math.round((18000 + Math.random() * 240000) * 100) / 100;

  return {
    numero,
    fecha: dia,
    cliente: elige(CLIENTES),
    subtotal: Math.round((total / 1.16) * 100) / 100,
    total,
  };
}

const PESOS: { medio: Medio; peso: number }[] = [
  { medio: "efectivo", peso: 34 },
  { medio: "credito", peso: 27 },
  { medio: "debito", peso: 24 },
  { medio: "spei", peso: 15 },
];

function medioAlAzar(): Medio {
  const total = PESOS.reduce((s, p) => s + p.peso, 0);
  let x = Math.random() * total;
  for (const p of PESOS) {
    x -= p.peso;
    if (x <= 0) return p.medio;
  }
  return "efectivo";
}

export function extraerRecibo(folio: Folio, todos: Folio[]) {
  const usados = todos.flatMap((f) => f.recibos.map((r) => r.numero));
  const numero = siguienteNumero(usados, "R-", 2210);
  const falta = faltante(folio);

  let monto: number;
  if (falta > 0.005) {
    // A veces el cliente liquida, a veces abona una parte.
    monto = Math.random() > 0.42 ? falta : Math.round(falta * (0.3 + Math.random() * 0.4) * 100) / 100;
  } else {
    // Ya estaba cubierta: esto va a producir un descuadre, como en la vida real.
    monto = Math.round((200 + Math.random() * 1800) * 100) / 100;
  }

  return {
    numero,
    fecha: folio.dia,
    monto,
    medio: medioAlAzar(),
    hora: horaAhora(),
  };
}

export function extraerTirilla(recibo: Recibo) {
  return {
    monto: recibo.monto,
    ultimos4: String(Math.floor(Math.random() * 9000 + 1000)),
    autorizacion: String(Math.floor(Math.random() * 900000 + 100000)),
    hora: recibo.hora || horaAhora(),
  };
}

/* ================================================================
   Motivos de rechazo. Pocas palabras arriba, el detalle adentro.
   ================================================================ */
export function RECHAZOS(folio: Folio, previo: { numero: string; monto: number; medio: Medio }) {
  const n = recibosValidos(folio).length;
  const opciones = [
    {
      motivo: "Es de otra factura",
      detalle: `El recibo referencia la factura A-14871, no ${folio.factura.numero}. Se leyó: ${money(
        previo.monto
      )} en efectivo, ${horaAhora()}, Caja 2. Súbelo dentro del folio correcto o vuelve a tomar la foto si el documento no era éste.`,
    },
    {
      motivo: "Ya está en otro folio",
      detalle: `El recibo ${previo.numero} ya fue cargado hoy en otro folio de esta misma caja. Un recibo no puede soportar dos facturas: revisa cuál de los dos folios se quedó con el documento equivocado.`,
    },
    {
      motivo: "La fecha no es la del día",
      detalle: `El documento dice ${fechaDDMMAAAA(
        folio.dia
      )} en el encabezado pero la fecha de operación impresa es de otro día. Un recibo de otra jornada no puede entrar en este cierre: cámbialo de día o corrige la fecha si la lectura se equivocó.`,
    },
  ];
  return opciones[n % opciones.length];
}
