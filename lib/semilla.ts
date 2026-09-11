import { aFecha, aISO, hoyISO, sumaDias, CAJA, USUARIO } from "./formato";
import { Dia, Estado, Factura, Folio, Medio, Recibo, Tirilla } from "./tipos";

/** PRNG determinista: el demo se ve igual en cada carga. */
function rng(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
];

function factura(
  numero: string,
  fecha: string,
  cliente: string,
  total: number
): Factura {
  const subtotal = Math.round((total / 1.16) * 100) / 100;
  return {
    numero,
    fecha,
    cliente,
    subtotal,
    total,
    archivo: `${numero.replace(/\W/g, "_")}.jpg`,
    estado: "leido",
    progreso: 100,
    etapa: "",
    original: { numero, fecha, cliente, subtotal, total },
  };
}

function tirilla(monto: number, hora: string, r: () => number, montoLeido?: number): Tirilla {
  const m = montoLeido ?? monto;
  const t = {
    id: `T-${Math.floor(r() * 900000 + 100000)}`,
    archivo: `tirilla_${Math.floor(r() * 9000 + 1000)}.jpg`,
    monto: m,
    ultimos4: String(Math.floor(r() * 9000 + 1000)),
    autorizacion: String(Math.floor(r() * 900000 + 100000)),
    hora,
    estado: "leido" as const,
    progreso: 100,
    etapa: "",
  };
  return { ...t, original: { monto: m, ultimos4: t.ultimos4, autorizacion: t.autorizacion, hora } };
}

function recibo(
  numero: string,
  fecha: string,
  monto: number,
  medio: Medio,
  hora: string,
  r: () => number,
  opciones?: { tirilla?: Tirilla | null; rechazado?: { motivo: string; detalle: string } }
): Recibo {
  const base = {
    id: `r-${numero}-${Math.floor(r() * 1e6)}`,
    numero,
    fecha,
    monto,
    medio,
    hora,
    archivo: `${numero}.jpg`,
    progreso: 100,
    etapa: "",
    tirilla: opciones?.tirilla ?? null,
    original: { numero, fecha, monto, medio, hora },
  };
  if (opciones?.rechazado) {
    return {
      ...base,
      estado: "rechazado",
      motivo: opciones.rechazado.motivo,
      detalle: opciones.rechazado.detalle,
    };
  }
  return { ...base, estado: "leido" };
}

function dia(fecha: string): Dia {
  return { fecha, huerfanos: [], cierre: null, validadoPor: null, validadoEn: null };
}

function cierreLimpio(fecha: string, sistema: Record<Medio, number>, recibos: number) {
  return {
    archivo: `CIERRE_C2_${fecha.replace(/-/g, "")}.pdf`,
    leidoEn: "19:04",
    sistema,
    recibosSistema: recibos,
    explicacion: "",
    evidencias: [],
    diferencia: 0,
    firmadoPor: USUARIO,
    firmadoEn: aFecha(fecha).getTime() + 19 * 3600e3,
  };
}

/** El día de hoy es el guion aprobado en el lienzo de diseño. */
function foliosDeHoy(hoy: string, r: () => number): Folio[] {
  // Horas de piso reales, no "ahora menos N": a las 8am nadie capturó a la 1am.
  const h = (horas: number) => aFecha(hoy).getTime() + horas * 3600e3;

  const fs9048: Folio = {
    id: "f-hoy-9048",
    dia: hoy,
    caja: CAJA,
    factura: factura("FS-9048", hoy, "Rocío Márquez Alcántara", 8420),
    recibos: [],
    creadoEn: h(18.83),
  };

  const a14875: Folio = {
    id: "f-hoy-14875",
    dia: hoy,
    caja: CAJA,
    factura: factura("A-14875", hoy, "Comercial Vega SA", 38900),
    recibos: [
      recibo("R-2205", hoy, 12000, "efectivo", "17:41", r),
      recibo("R-2208", hoy, 8000, "spei", "18:12", r),
      recibo("R-2209", hoy, 3729, "debito", "18:26", r),
      recibo("R-2210", hoy, 4500, "efectivo", "17:58", r, {
        rechazado: {
          motivo: "Es de otra factura",
          detalle:
            "El recibo referencia la factura A-14871, no A-14875. Se leyó: 4,500.00 en efectivo, 17:58, Caja 2. Súbelo dentro del folio A-14871 o vuelve a tomar la foto si el documento correcto es otro.",
        },
      }),
    ],
    creadoEn: h(17.68),
  };

  const fs9044: Folio = {
    id: "f-hoy-9044",
    dia: hoy,
    caja: CAJA,
    factura: factura("FS-9044", hoy, "Refacciones Zaragoza", 5750),
    recibos: [
      recibo("R-2206", hoy, 5750, "credito", "16:02", r, {
        tirilla: tirilla(5750, "16:03", r, 5570),
      }),
    ],
    creadoEn: h(16.03),
  };

  const fs9031: Folio = {
    id: "f-hoy-9031",
    dia: hoy,
    caja: CAJA,
    factura: factura("FS-9031", hoy, "Ana Sofía Bermúdez", 3180),
    recibos: [recibo("R-2207", hoy, 3180, "credito", "16:48", r)],
    creadoEn: h(16.8),
  };

  const a14872: Folio = {
    id: "f-hoy-14872",
    dia: hoy,
    caja: CAJA,
    factura: factura("A-14872", hoy, "Transportes del Bajío", 48600),
    recibos: [
      recibo("R-2201", hoy, 20000, "efectivo", "12:14", r),
      recibo("R-2202", hoy, 18600, "credito", "12:19", r, { tirilla: tirilla(18600, "12:20", r) }),
      recibo("R-2203", hoy, 10000, "debito", "12:24", r, { tirilla: tirilla(10000, "12:25", r) }),
    ],
    creadoEn: h(12.23),
  };

  return [fs9048, a14875, fs9044, fs9031, a14872];
}

function foliosDePasado(fecha: string, n: number, r: () => number, sinCerrar: boolean): Folio[] {
  const out: Folio[] = [];
  for (let i = 0; i < n; i++) {
    const esServicio = r() > 0.45;
    const numero = esServicio
      ? `FS-${Math.floor(8000 + r() * 900)}`
      : `A-${Math.floor(14000 + r() * 700)}`;
    const total = Math.round((1500 + r() * 52000) * 100) / 100;
    const cliente = CLIENTES[Math.floor(r() * CLIENTES.length)];
    const hora = `${String(10 + Math.floor(r() * 8)).padStart(2, "0")}:${String(
      Math.floor(r() * 60)
    ).padStart(2, "0")}`;

    // Un folio del día olvidado queda a medias a propósito.
    const aMedias = sinCerrar && i === 0;
    const recibos: Recibo[] = [];

    if (aMedias) {
      recibos.push(
        recibo(`R-${Math.floor(2000 + r() * 200)}`, fecha, Math.round(total * 0.4 * 100) / 100, "efectivo", hora, r)
      );
    } else {
      const medio: Medio = (["efectivo", "credito", "debito", "spei"] as Medio[])[
        Math.floor(r() * 4)
      ];
      const partido = r() > 0.7;
      if (partido) {
        const a = Math.round(total * 0.6 * 100) / 100;
        const b = Math.round((total - a) * 100) / 100;
        recibos.push(
          recibo(`R-${Math.floor(2000 + r() * 200)}`, fecha, a, "efectivo", hora, r),
          recibo(`R-${Math.floor(2000 + r() * 200)}`, fecha, b, medio, hora, r, {
            tirilla:
              medio === "credito" || medio === "debito" ? tirilla(b, hora, r) : null,
          })
        );
      } else {
        recibos.push(
          recibo(`R-${Math.floor(2000 + r() * 200)}`, fecha, total, medio, hora, r, {
            tirilla:
              medio === "credito" || medio === "debito" ? tirilla(total, hora, r) : null,
          })
        );
      }
    }

    out.push({
      id: `f-${fecha}-${i}`,
      dia: fecha,
      caja: CAJA,
      factura: factura(numero, fecha, cliente, total),
      recibos,
      creadoEn: aFecha(fecha).getTime() + (9 + i) * 3600e3,
    });
  }
  return out;
}

export function semilla(): Estado {
  const r = rng(20260911);
  const hoy = hoyISO();
  const folios: Folio[] = [];
  const dias: Record<string, Dia> = {};

  // ---- historia: 45 días hacia atrás ----
  for (let k = 45; k >= 1; k--) {
    const fecha = sumaDias(hoy, -k);
    const d = aFecha(fecha);
    const finDeSemana = d.getDay() === 0 || d.getDay() === 6;

    if (finDeSemana && r() > 0.35) {
      dias[fecha] = dia(fecha);
      continue;
    }

    const olvidado = k === 4;
    const conDiferencia = k === 6;
    const sinValidar = k <= 3;

    const n = 2 + Math.floor(r() * 3);
    const delDia = foliosDePasado(fecha, n, r, olvidado);
    folios.push(...delDia);

    const reg = dia(fecha);

    if (olvidado) {
      // Se quedó abierto: el calendario lo muestra en ámbar.
      dias[fecha] = reg;
      continue;
    }

    const sistema = { efectivo: 0, credito: 0, debito: 0, spei: 0 } as Record<Medio, number>;
    let cuenta = 0;
    for (const f of delDia) {
      for (const rec of f.recibos) {
        if (rec.estado !== "leido") continue;
        sistema[rec.medio] += rec.monto;
        cuenta++;
      }
    }

    if (conDiferencia) {
      const huerfano = {
        id: `R-${Math.floor(2000 + r() * 200)}`,
        medio: "efectivo" as Medio,
        monto: Math.round((900 + r() * 4000) * 100) / 100,
        hora: "18:37",
        asignadoA: null,
      };
      reg.huerfanos = [huerfano];
      sistema.efectivo += huerfano.monto;
      cuenta++;
      reg.cierre = {
        ...cierreLimpio(fecha, sistema, cuenta),
        diferencia: -huerfano.monto,
        explicacion:
          "El cliente pagó en efectivo y se llevó el recibo sin que se emitiera la factura; quedó para el día siguiente con el gerente de piso.",
        evidencias: [
          {
            id: "ev-1",
            nombre: "recibo_sin_factura.jpg",
            tam: "1.4 MB",
            hora: "19:12",
          },
        ],
      };
      reg.validadoPor = "Norma Escobedo";
      reg.validadoEn = aFecha(fecha).getTime() + 20 * 3600e3;
      dias[fecha] = reg;
      continue;
    }

    reg.cierre = cierreLimpio(fecha, sistema, cuenta);
    if (!sinValidar) {
      reg.validadoPor = "Norma Escobedo";
      reg.validadoEn = aFecha(fecha).getTime() + 20 * 3600e3;
    }
    dias[fecha] = reg;
  }

  // ---- hoy ----
  folios.push(...foliosDeHoy(hoy, r));
  const regHoy = dia(hoy);
  regHoy.huerfanos = [
    { id: "R-2211", medio: "efectivo", monto: 8420, hora: "18:44", asignadoA: null },
  ];
  dias[hoy] = regHoy;

  return {
    dias,
    folios,
    auditoria: [],
    diaSeleccionado: hoy,
    simularRechazo: false,
    avisoAyuda: 0,
  };
}

export { aISO };
