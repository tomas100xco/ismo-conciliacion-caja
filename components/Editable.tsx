"use client";

import React, { useEffect, useRef, useState } from "react";
import { money } from "@/lib/formato";

type Base = {
  /** Código apuntable para el modo feedback. */
  fb: string;
  fbNombre: string;
  editado: boolean;
  original: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

type PropsTexto = Base & {
  tipo: "texto";
  valor: string;
  onCommit: (v: string) => void;
};

type PropsMonto = Base & {
  tipo: "monto";
  valor: number;
  onCommit: (v: number) => void;
};

type PropsOpcion = Base & {
  tipo: "opcion";
  valor: string;
  opciones: { v: string; t: string }[];
  onCommit: (v: string) => void;
};

export type EditableProps = PropsTexto | PropsMonto | PropsOpcion;

/**
 * Todo dato leído se puede corregir a mano. La app no lo impide y no lo
 * celebra: deja una seña mínima —un subrayado ámbar muy tenue— y guarda
 * en silencio el valor original contra el valor actual.
 */
export function Editable(p: EditableProps) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");
  const ref = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const textoVisible =
    p.tipo === "monto"
      ? money(p.valor)
      : p.tipo === "opcion"
        ? (p.opciones.find((o) => o.v === p.valor)?.t ?? p.valor)
        : p.valor;

  useEffect(() => {
    if (editando && ref.current) {
      ref.current.focus();
      if (ref.current instanceof HTMLInputElement) ref.current.select();
    }
  }, [editando]);

  function abrir() {
    if (p.disabled) return;
    setBorrador(p.tipo === "monto" ? String(p.valor) : String(p.valor));
    setEditando(true);
  }

  function confirmar() {
    setEditando(false);
    if (p.tipo === "monto") {
      const n = Number(String(borrador).replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(n)) return;
      if (Math.abs(n - p.valor) < 0.005) return;
      p.onCommit(Math.round(n * 100) / 100);
    } else {
      const v = borrador.trim();
      if (!v || v === p.valor) return;
      p.onCommit(v);
    }
  }

  const titulo = p.editado
    ? `Editado a mano. El documento decía: ${p.original}`
    : "Toca para corregir";

  if (editando && p.tipo === "opcion") {
    return (
      <select
        ref={ref as React.RefObject<HTMLSelectElement>}
        className="editable-input"
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmar();
          if (e.key === "Escape") setEditando(false);
        }}
        style={{ maxWidth: 200 }}
      >
        {p.opciones.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    );
  }

  if (editando) {
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        className={`editable-input ${p.className ?? ""}`}
        style={p.style}
        value={borrador}
        inputMode={p.tipo === "monto" ? "decimal" : "text"}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmar();
          if (e.key === "Escape") setEditando(false);
        }}
      />
    );
  }

  return (
    <span
      data-fb={p.fb}
      data-fb-nombre={p.fbNombre}
      role={p.disabled ? undefined : "button"}
      tabIndex={p.disabled ? -1 : 0}
      title={titulo}
      className={`editable ${p.editado ? "editado" : ""} ${p.className ?? ""}`}
      style={p.style}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir();
        }
      }}
    >
      {textoVisible}
    </span>
  );
}
