"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { CAJA, hoyISO, id as nuevoId, money, USUARIO } from "./formato";
import { semilla } from "./semilla";
import { extraerFactura, extraerRecibo, extraerTirilla, RECHAZOS } from "./simulacion";
import {
  Auditoria,
  Cierre,
  Estado,
  Evidencia,
  Folio,
  Medio,
  NOMBRE_MEDIO,
  Recibo,
  Tirilla,
} from "./tipos";
import { porMedioEnFolios, recibosValidos, sumaMedios, TOLERANCIA } from "./reglas";

const CLAVE = "ismo-conciliacion-caja-v1";

type Loc = { folioId: string; tipo: "factura" | "recibo" | "tirilla"; reciboId?: string };

type Accion =
  | { t: "cargar"; estado: Estado }
  | { t: "dia"; fecha: string }
  | { t: "folio.nuevo"; folio: Folio }
  | { t: "folio.eliminar"; folioId: string }
  | { t: "doc.progreso"; loc: Loc; estado: Recibo["estado"]; progreso: number; etapa: string }
  | { t: "factura.resuelta"; folioId: string; datos: Partial<Folio["factura"]> }
  | { t: "recibo.nuevo"; folioId: string; recibo: Recibo }
  | { t: "recibo.resuelto"; folioId: string; reciboId: string; datos: Partial<Recibo> }
  | { t: "recibo.rechazado"; folioId: string; reciboId: string; motivo: string; detalle: string }
  | { t: "recibo.eliminar"; folioId: string; reciboId: string }
  | { t: "tirilla.nueva"; folioId: string; reciboId: string; tirilla: Tirilla }
  | { t: "tirilla.resuelta"; folioId: string; reciboId: string; datos: Partial<Tirilla> }
  | { t: "tirilla.eliminar"; folioId: string; reciboId: string }
  | { t: "editar"; loc: Loc; campo: string; valor: string | number }
  | { t: "cierre.leer"; fecha: string; cierre: Cierre }
  | { t: "cierre.explicacion"; fecha: string; texto: string }
  | { t: "cierre.evidencia+"; fecha: string; ev: Evidencia }
  | { t: "cierre.evidencia-"; fecha: string; evId: string }
  | { t: "cierre.firmar"; fecha: string; diferencia: number }
  | { t: "cierre.reabrir"; fecha: string }
  | { t: "huerfano.asignar"; fecha: string; huerfanoId: string; folioId: string }
  | { t: "simularRechazo"; v: boolean }
  | { t: "reiniciar" };

function mapFolio(e: Estado, folioId: string, fn: (f: Folio) => Folio): Estado {
  return { ...e, folios: e.folios.map((f) => (f.id === folioId ? fn(f) : f)) };
}

function mapRecibo(f: Folio, reciboId: string, fn: (r: Recibo) => Recibo): Folio {
  return { ...f, recibos: f.recibos.map((r) => (r.id === reciboId ? fn(r) : r)) };
}

function asegurarDia(e: Estado, fecha: string) {
  return (
    e.dias[fecha] ?? {
      fecha,
      huerfanos: [],
      cierre: null,
      validadoPor: null,
      validadoEn: null,
    }
  );
}

const ETIQUETA_CAMPO: Record<string, string> = {
  numero: "Número",
  cliente: "Cliente",
  total: "Total de la factura",
  fecha: "Fecha",
  monto: "Monto",
  medio: "Medio de pago",
  hora: "Hora",
  ultimos4: "Últimos 4 dígitos",
  autorizacion: "Autorización",
};

function reducer(e: Estado, a: Accion): Estado {
  switch (a.t) {
    case "cargar":
      return a.estado;

    case "reiniciar":
      return semilla();

    case "dia":
      return { ...e, diaSeleccionado: a.fecha };

    case "simularRechazo":
      return { ...e, simularRechazo: a.v };

    case "folio.nuevo":
      return { ...e, folios: [...e.folios, a.folio] };

    case "folio.eliminar":
      return { ...e, folios: e.folios.filter((f) => f.id !== a.folioId) };

    case "doc.progreso":
      return mapFolio(e, a.loc.folioId, (f) => {
        if (a.loc.tipo === "factura") {
          return {
            ...f,
            factura: { ...f.factura, estado: a.estado, progreso: a.progreso, etapa: a.etapa },
          };
        }
        if (a.loc.tipo === "recibo") {
          return mapRecibo(f, a.loc.reciboId!, (r) => ({
            ...r,
            estado: a.estado,
            progreso: a.progreso,
            etapa: a.etapa,
          }));
        }
        return mapRecibo(f, a.loc.reciboId!, (r) =>
          r.tirilla
            ? { ...r, tirilla: { ...r.tirilla, estado: a.estado, progreso: a.progreso, etapa: a.etapa } }
            : r
        );
      });

    case "factura.resuelta":
      return mapFolio(e, a.folioId, (f) => {
        const fact = { ...f.factura, ...a.datos, estado: "leido" as const, progreso: 100, etapa: "" };
        return {
          ...f,
          factura: {
            ...fact,
            original: {
              numero: fact.numero,
              fecha: fact.fecha,
              cliente: fact.cliente,
              subtotal: fact.subtotal,
              total: fact.total,
            },
          },
        };
      });

    case "recibo.nuevo":
      return mapFolio(e, a.folioId, (f) => ({ ...f, recibos: [...f.recibos, a.recibo] }));

    case "recibo.resuelto":
      return mapFolio(e, a.folioId, (f) =>
        mapRecibo(f, a.reciboId, (r) => {
          const n = { ...r, ...a.datos, estado: "leido" as const, progreso: 100, etapa: "" };
          return {
            ...n,
            original: {
              numero: n.numero,
              fecha: n.fecha,
              monto: n.monto,
              medio: n.medio,
              hora: n.hora,
            },
          };
        })
      );

    case "recibo.rechazado":
      e = { ...e, avisoAyuda: e.avisoAyuda + 1 };
      return mapFolio(e, a.folioId, (f) =>
        mapRecibo(f, a.reciboId, (r) => ({
          ...r,
          estado: "rechazado",
          progreso: 100,
          etapa: "",
          motivo: a.motivo,
          detalle: a.detalle,
        }))
      );

    case "recibo.eliminar":
      return mapFolio(e, a.folioId, (f) => ({
        ...f,
        recibos: f.recibos.filter((r) => r.id !== a.reciboId),
      }));

    case "tirilla.nueva":
      return mapFolio(e, a.folioId, (f) =>
        mapRecibo(f, a.reciboId, (r) => ({ ...r, tirilla: a.tirilla }))
      );

    case "tirilla.resuelta":
      return mapFolio(e, a.folioId, (f) =>
        mapRecibo(f, a.reciboId, (r) => {
          if (!r.tirilla) return r;
          const n = { ...r.tirilla, ...a.datos, estado: "leido" as const, progreso: 100, etapa: "" };
          return {
            ...r,
            tirilla: {
              ...n,
              original: {
                monto: n.monto,
                ultimos4: n.ultimos4,
                autorizacion: n.autorizacion,
                hora: n.hora,
              },
            },
          };
        })
      );

    case "tirilla.eliminar":
      return mapFolio(e, a.folioId, (f) =>
        mapRecibo(f, a.reciboId, (r) => ({ ...r, tirilla: null }))
      );

    /* ---------------------------------------------------------------
       Edición manual. Todo campo leído es editable, y toda edición
       deja rastro: original, valor anterior, valor nuevo, quién y cuándo.
       --------------------------------------------------------------- */
    case "editar": {
      const folio = e.folios.find((f) => f.id === a.loc.folioId);
      if (!folio) return e;

      let anterior: string | number = "";
      let original: string | number = "";
      let entidad = "";
      let entidadId = "";

      if (a.loc.tipo === "factura") {
        entidad = "Factura";
        entidadId = folio.factura.numero;
        anterior = (folio.factura as any)[a.campo];
        original = (folio.factura.original as any)[a.campo];
      } else {
        const rec = folio.recibos.find((r) => r.id === a.loc.reciboId);
        if (!rec) return e;
        if (a.loc.tipo === "recibo") {
          entidad = "Recibo de caja";
          entidadId = rec.numero;
          anterior = (rec as any)[a.campo];
          original = (rec.original as any)[a.campo];
        } else {
          if (!rec.tirilla) return e;
          entidad = "Tirilla";
          entidadId = rec.tirilla.id;
          anterior = (rec.tirilla as any)[a.campo];
          original = (rec.tirilla.original as any)[a.campo];
        }
      }

      if (String(anterior) === String(a.valor)) return e;

      const legible = (v: string | number) => {
        if (typeof v === "number") return money(v);
        if (a.campo === "medio") return NOMBRE_MEDIO[v as Medio] ?? String(v);
        return String(v);
      };

      const entrada: Auditoria = {
        id: nuevoId("aud"),
        en: Date.now(),
        usuario: USUARIO,
        entidad,
        entidadId,
        folioId: folio.id,
        dia: folio.dia,
        campo: ETIQUETA_CAMPO[a.campo] ?? a.campo,
        original: legible(original),
        anterior: legible(anterior),
        nuevo: legible(a.valor),
      };

      const conValor = mapFolio(e, a.loc.folioId, (f) => {
        if (a.loc.tipo === "factura") {
          const fact = { ...f.factura, [a.campo]: a.valor } as Folio["factura"];
          if (a.campo === "total") {
            fact.subtotal = Math.round((Number(a.valor) / 1.16) * 100) / 100;
          }
          return { ...f, factura: fact };
        }
        if (a.loc.tipo === "recibo") {
          return mapRecibo(f, a.loc.reciboId!, (r) => ({ ...r, [a.campo]: a.valor } as Recibo));
        }
        return mapRecibo(f, a.loc.reciboId!, (r) =>
          r.tirilla ? { ...r, tirilla: { ...r.tirilla, [a.campo]: a.valor } as Tirilla } : r
        );
      });

      return { ...conValor, auditoria: [entrada, ...conValor.auditoria] };
    }

    case "cierre.leer": {
      const d = asegurarDia(e, a.fecha);
      return { ...e, dias: { ...e.dias, [a.fecha]: { ...d, cierre: a.cierre } } };
    }

    case "cierre.explicacion": {
      const d = asegurarDia(e, a.fecha);
      if (!d.cierre) return e;
      return {
        ...e,
        dias: { ...e.dias, [a.fecha]: { ...d, cierre: { ...d.cierre, explicacion: a.texto } } },
      };
    }

    case "cierre.evidencia+": {
      const d = asegurarDia(e, a.fecha);
      if (!d.cierre) return e;
      return {
        ...e,
        dias: {
          ...e.dias,
          [a.fecha]: {
            ...d,
            cierre: { ...d.cierre, evidencias: [...d.cierre.evidencias, a.ev] },
          },
        },
      };
    }

    case "cierre.evidencia-": {
      const d = asegurarDia(e, a.fecha);
      if (!d.cierre) return e;
      return {
        ...e,
        dias: {
          ...e.dias,
          [a.fecha]: {
            ...d,
            cierre: {
              ...d.cierre,
              evidencias: d.cierre.evidencias.filter((x) => x.id !== a.evId),
            },
          },
        },
      };
    }

    case "cierre.firmar": {
      const d = asegurarDia(e, a.fecha);
      if (!d.cierre) return e;
      return {
        ...e,
        dias: {
          ...e.dias,
          [a.fecha]: {
            ...d,
            cierre: { ...d.cierre, diferencia: a.diferencia, firmadoEn: Date.now(), firmadoPor: USUARIO },
          },
        },
      };
    }

    case "cierre.reabrir": {
      const d = asegurarDia(e, a.fecha);
      return {
        ...e,
        dias: { ...e.dias, [a.fecha]: { ...d, cierre: null, validadoEn: null, validadoPor: null } },
      };
    }

    case "huerfano.asignar": {
      const d = asegurarDia(e, a.fecha);
      return {
        ...e,
        dias: {
          ...e.dias,
          [a.fecha]: {
            ...d,
            huerfanos: d.huerfanos.map((h) =>
              h.id === a.huerfanoId ? { ...h, asignadoA: a.folioId } : h
            ),
          },
        },
      };
    }
  }
  return e;
}

/* ================================================================
   Contexto
   ================================================================ */
type Ctx = {
  estado: Estado;
  listo: boolean;
  seleccionarDia: (f: string) => void;
  crearFolio: (archivo: string) => string;
  agregarRecibo: (folioId: string, archivo: string) => void;
  agregarTirilla: (folioId: string, reciboId: string, archivo: string) => void;
  eliminarRecibo: (folioId: string, reciboId: string) => void;
  eliminarTirilla: (folioId: string, reciboId: string) => void;
  editar: (loc: Loc, campo: string, valor: string | number) => void;
  leerArchivoCierre: (fecha: string, nombre: string) => void;
  setExplicacion: (fecha: string, t: string) => void;
  agregarEvidencia: (fecha: string, nombre: string) => void;
  quitarEvidencia: (fecha: string, id: string) => void;
  cerrarDia: (fecha: string, diferencia: number) => void;
  reabrirDia: (fecha: string) => void;
  asignarHuerfano: (fecha: string, huerfanoId: string, folioId: string) => void;
  setSimularRechazo: (v: boolean) => void;
  reiniciar: () => void;
};

const C = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useApp fuera del proveedor");
  return c;
}

function sanear(e: Estado): Estado {
  // Un documento a medio leer no sobrevive a una recarga.
  const folios = e.folios
    .filter((f) => f.factura.estado === "leido")
    .map((f) => ({
      ...f,
      recibos: f.recibos
        .filter((r) => r.estado === "leido" || r.estado === "rechazado")
        .map((r) => ({
          ...r,
          tirilla: r.tirilla && r.tirilla.estado === "leido" ? r.tirilla : null,
        })),
    }));
  return { ...e, folios };
}

export function Proveedor({ children }: { children: React.ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, null as unknown as Estado);
  const listo = !!estado;
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let inicial: Estado | null = null;
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (crudo) {
        const p = JSON.parse(crudo) as Estado;
        if (p && p.folios && p.dias) inicial = sanear({ ...p, avisoAyuda: p.avisoAyuda ?? 0 });
      }
    } catch {
      inicial = null;
    }
    dispatch({ t: "cargar", estado: inicial ?? semilla() });
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (!estado) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      /* cuota llena: el demo sigue funcionando en memoria */
    }
  }, [estado]);

  const luego = useCallback((ms: number, fn: () => void) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  /** Sube y lee un documento en etapas visibles. */
  const correr = useCallback(
    (loc: Loc, alTerminar: () => void) => {
      const pasosSubida = [18, 46, 74, 100];
      pasosSubida.forEach((p, i) => {
        luego(120 + i * 170, () =>
          dispatch({
            t: "doc.progreso",
            loc,
            estado: "subiendo",
            progreso: p,
            etapa: `Subiendo la foto… ${p} %`,
          })
        );
      });

      const etapas = [
        { p: 28, txt: "Leyendo el documento… 1 de 3 · encuadre" },
        { p: 62, txt: "Leyendo el documento… 2 de 3 · montos" },
        { p: 92, txt: "Leyendo el documento… 3 de 3 · cruce con lo cargado" },
      ];
      etapas.forEach((s, i) => {
        luego(860 + i * 420, () =>
          dispatch({ t: "doc.progreso", loc, estado: "leyendo", progreso: s.p, etapa: s.txt })
        );
      });

      luego(2180, alTerminar);
    },
    [luego]
  );

  const seleccionarDia = useCallback((f: string) => dispatch({ t: "dia", fecha: f }), []);

  const crearFolio = useCallback(
    (archivo: string) => {
      const dia = estado.diaSeleccionado;
      const folioId = nuevoId("f");
      const usados = estado.folios.map((f) => f.factura.numero);
      const previo = extraerFactura(dia, usados);

      const folio: Folio = {
        id: folioId,
        dia,
        caja: CAJA,
        factura: {
          numero: "",
          fecha: dia,
          cliente: "",
          subtotal: 0,
          total: 0,
          archivo,
          estado: "subiendo",
          progreso: 0,
          etapa: "Subiendo la foto…",
          original: { numero: "", fecha: dia, cliente: "", subtotal: 0, total: 0 },
        },
        recibos: [],
        creadoEn: Date.now(),
      };

      dispatch({ t: "folio.nuevo", folio });
      correr({ folioId, tipo: "factura" }, () =>
        dispatch({ t: "factura.resuelta", folioId, datos: previo })
      );
      return folioId;
    },
    [estado, correr]
  );

  const agregarRecibo = useCallback(
    (folioId: string, archivo: string) => {
      const folio = estado.folios.find((f) => f.id === folioId);
      if (!folio) return;
      const reciboId = nuevoId("r");
      const rechazar = estado.simularRechazo;
      const previo = extraerRecibo(folio, estado.folios);

      const recibo: Recibo = {
        id: reciboId,
        numero: "",
        fecha: folio.dia,
        monto: 0,
        medio: "efectivo",
        hora: "",
        archivo,
        estado: "subiendo",
        progreso: 0,
        etapa: "Subiendo la foto…",
        tirilla: null,
        original: { numero: "", fecha: folio.dia, monto: 0, medio: "efectivo", hora: "" },
      };

      dispatch({ t: "recibo.nuevo", folioId, recibo });
      if (rechazar) dispatch({ t: "simularRechazo", v: false });

      correr({ folioId, tipo: "recibo", reciboId }, () => {
        if (rechazar) {
          const r = RECHAZOS(folio, previo);
          dispatch({
            t: "recibo.resuelto",
            folioId,
            reciboId,
            datos: { ...previo, numero: previo.numero },
          });
          dispatch({
            t: "recibo.rechazado",
            folioId,
            reciboId,
            motivo: r.motivo,
            detalle: r.detalle,
          });
        } else {
          dispatch({ t: "recibo.resuelto", folioId, reciboId, datos: previo });
        }
      });
    },
    [estado, correr]
  );

  const agregarTirilla = useCallback(
    (folioId: string, reciboId: string, archivo: string) => {
      const folio = estado.folios.find((f) => f.id === folioId);
      const recibo = folio?.recibos.find((r) => r.id === reciboId);
      if (!folio || !recibo) return;
      const previo = extraerTirilla(recibo);

      const tirilla: Tirilla = {
        id: nuevoId("T"),
        archivo,
        monto: 0,
        ultimos4: "",
        autorizacion: "",
        hora: "",
        estado: "subiendo",
        progreso: 0,
        etapa: "Subiendo la foto…",
        original: { monto: 0, ultimos4: "", autorizacion: "", hora: "" },
      };

      dispatch({ t: "tirilla.nueva", folioId, reciboId, tirilla });
      correr({ folioId, tipo: "tirilla", reciboId }, () =>
        dispatch({ t: "tirilla.resuelta", folioId, reciboId, datos: previo })
      );
    },
    [estado, correr]
  );

  const valor = useMemo<Ctx>(
    () => ({
      estado,
      listo,
      seleccionarDia,
      crearFolio,
      agregarRecibo,
      agregarTirilla,
      eliminarRecibo: (folioId, reciboId) => dispatch({ t: "recibo.eliminar", folioId, reciboId }),
      eliminarTirilla: (folioId, reciboId) => dispatch({ t: "tirilla.eliminar", folioId, reciboId }),
      editar: (loc, campo, v) => dispatch({ t: "editar", loc, campo, valor: v }),
      leerArchivoCierre: (fecha, nombre) => {
        const folios = estado.folios.filter((f) => f.dia === fecha);
        const enFolios = porMedioEnFolios(folios);
        const d = estado.dias[fecha];
        const sistema = { ...enFolios };
        let cuenta = folios.reduce((s, f) => s + recibosValidos(f).length, 0);
        for (const h of d?.huerfanos ?? []) {
          sistema[h.medio] += h.monto;
          cuenta++;
        }
        const cierre: Cierre = {
          archivo: nombre,
          leidoEn: new Date().toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          sistema,
          recibosSistema: cuenta,
          explicacion: "",
          evidencias: [],
          diferencia: sumaMedios(enFolios) - sumaMedios(sistema),
          firmadoPor: "",
          firmadoEn: 0,
        };
        dispatch({ t: "cierre.leer", fecha, cierre });
      },
      setExplicacion: (fecha, t) => dispatch({ t: "cierre.explicacion", fecha, texto: t }),
      agregarEvidencia: (fecha, nombre) =>
        dispatch({
          t: "cierre.evidencia+",
          fecha,
          ev: {
            id: nuevoId("ev"),
            nombre,
            tam: `${(0.6 + Math.random() * 2.4).toFixed(1)} MB`,
            hora: new Date().toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          },
        }),
      quitarEvidencia: (fecha, evId) => dispatch({ t: "cierre.evidencia-", fecha, evId }),
      cerrarDia: (fecha, diferencia) => dispatch({ t: "cierre.firmar", fecha, diferencia }),
      reabrirDia: (fecha) => dispatch({ t: "cierre.reabrir", fecha }),
      asignarHuerfano: (fecha, huerfanoId, folioId) => {
        const h = estado.dias[fecha]?.huerfanos.find((x) => x.id === huerfanoId);
        if (!h) return;
        // Asignar no es etiquetar: el recibo del sistema entra de verdad al folio.
        const recibo: Recibo = {
          id: nuevoId("r"),
          numero: h.id,
          fecha,
          monto: h.monto,
          medio: h.medio,
          hora: h.hora,
          archivo: `${h.id}_del_sistema`,
          estado: "leido",
          progreso: 100,
          etapa: "",
          tirilla: null,
          original: { numero: h.id, fecha, monto: h.monto, medio: h.medio, hora: h.hora },
        };
        dispatch({ t: "recibo.nuevo", folioId, recibo });
        dispatch({ t: "huerfano.asignar", fecha, huerfanoId, folioId });
      },
      setSimularRechazo: (v) => dispatch({ t: "simularRechazo", v }),
      reiniciar: () => {
        try {
          localStorage.removeItem(CLAVE);
        } catch {}
        dispatch({ t: "reiniciar" });
      },
    }),
    [estado, listo, seleccionarDia, crearFolio, agregarRecibo, agregarTirilla]
  );

  if (!listo) {
    return (
      <div className="app" style={{ padding: 20 }}>
        <div className="pulso caption" style={{ paddingTop: 40 }}>
          Cargando la caja…
        </div>
      </div>
    );
  }

  return <C.Provider value={valor}>{children}</C.Provider>;
}

export const HOY = hoyISO;
export type { Medio };
