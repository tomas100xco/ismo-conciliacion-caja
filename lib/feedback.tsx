"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { id as nuevoId } from "./formato";

export type Nota = {
  id: string;
  en: number;
  codigo: string;
  nombre: string;
  pantalla: string;
  texto: string;
};

const CLAVE = "ismo-conciliacion-feedback-v1";

type Ctx = {
  notas: Nota[];
  modo: boolean;
  setModo: (v: boolean) => void;
  objetivo: { codigo: string; nombre: string } | null;
  apuntar: (codigo: string, nombre: string) => void;
  cancelar: () => void;
  agregar: (codigo: string, nombre: string, texto: string) => void;
  borrar: (id: string) => void;
  borrarTodo: () => void;
  comoTexto: () => string;
};

const C = createContext<Ctx | null>(null);

export function useFeedback(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useFeedback fuera del proveedor");
  return c;
}

function pantallaActual(): string {
  if (typeof window === "undefined") return "";
  const p = window.location.pathname;
  if (p === "/") return "Día · lista de folios";
  if (p.startsWith("/folio")) return "Folio · captura";
  if (p.startsWith("/cierre")) return "Cierre del día";
  if (p.startsWith("/auditoria")) return "Registro de ediciones";
  return p;
}

export function ProveedorFeedback({ children }: { children: React.ReactNode }) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [modo, setModoRaw] = useState(false);
  const [objetivo, setObjetivo] = useState<{ codigo: string; nombre: string } | null>(null);

  useEffect(() => {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (crudo) setNotas(JSON.parse(crudo));
    } catch {
      /* sin notas guardadas */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(notas));
    } catch {}
  }, [notas]);

  const setModo = useCallback((v: boolean) => {
    setModoRaw(v);
    if (!v) setObjetivo(null);
    if (typeof document !== "undefined") {
      document.body.dataset.fbModo = v ? "1" : "";
    }
  }, []);

  /* Con el modo encendido, cualquier elemento etiquetado se vuelve apuntable. */
  useEffect(() => {
    if (!modo) return;
    function alClic(ev: MouseEvent) {
      const el = (ev.target as HTMLElement | null)?.closest("[data-fb]") as HTMLElement | null;
      if (!el) return;
      if (el.closest("[data-fb-ignorar]")) return;
      ev.preventDefault();
      ev.stopPropagation();
      setObjetivo({
        codigo: el.dataset.fb ?? "",
        nombre: el.dataset.fbNombre ?? el.dataset.fb ?? "",
      });
    }
    document.addEventListener("click", alClic, true);
    return () => document.removeEventListener("click", alClic, true);
  }, [modo]);

  const agregar = useCallback((codigo: string, nombre: string, texto: string) => {
    const t = texto.trim();
    if (!t) return;
    setNotas((xs) => [
      { id: nuevoId("nota"), en: Date.now(), codigo, nombre, pantalla: pantallaActual(), texto: t },
      ...xs,
    ]);
    setObjetivo(null);
  }, []);

  const comoTexto = useCallback(() => {
    if (notas.length === 0) return "Sin notas de feedback.";
    const f = new Date();
    const sello = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(
      f.getDate()
    ).padStart(2, "0")} ${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
    const cuerpo = [...notas]
      .sort((a, b) => a.en - b.en)
      .map(
        (n, i) =>
          `${i + 1}. [${n.codigo}] ${n.nombre}\n   Pantalla: ${n.pantalla}\n   ${n.texto.replace(/\n/g, "\n   ")}`
      )
      .join("\n\n");
    return `FEEDBACK · Conciliación de Caja · ISMO Motors\nGenerado ${sello} · ${notas.length} nota${
      notas.length === 1 ? "" : "s"
    }\n\n${cuerpo}\n`;
  }, [notas]);

  const valor = useMemo<Ctx>(
    () => ({
      notas,
      modo,
      setModo,
      objetivo,
      apuntar: (codigo, nombre) => setObjetivo({ codigo, nombre }),
      cancelar: () => setObjetivo(null),
      agregar,
      borrar: (id) => setNotas((xs) => xs.filter((n) => n.id !== id)),
      borrarTodo: () => setNotas([]),
      comoTexto,
    }),
    [notas, modo, objetivo, setModo, agregar, comoTexto]
  );

  return <C.Provider value={valor}>{children}</C.Provider>;
}
