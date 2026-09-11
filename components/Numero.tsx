"use client";

import React, { useEffect, useRef, useState } from "react";
import { money } from "@/lib/formato";

/**
 * Cuenta hasta el valor nuevo en 640 ms. Sin rebote ni resorte:
 * el sistema de diseño lo prohíbe sobre cifras.
 */
export function Numero({
  valor,
  className,
  style,
  prefijo = "",
}: {
  valor: number;
  className?: string;
  style?: React.CSSProperties;
  prefijo?: string;
}) {
  const [visible, setVisible] = useState(valor);
  const desde = useRef(valor);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || Math.abs(valor - desde.current) < 0.005) {
      desde.current = valor;
      setVisible(valor);
      return;
    }
    const inicio = performance.now();
    const a = desde.current;
    const b = valor;
    const dur = 640;
    function paso(t: number) {
      const k = Math.min(1, (t - inicio) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setVisible(a + (b - a) * e);
      if (k < 1) raf.current = requestAnimationFrame(paso);
      else desde.current = b;
    }
    raf.current = requestAnimationFrame(paso);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [valor]);

  return (
    <span className={`n ${className ?? ""}`} style={style}>
      {prefijo}
      {money(visible)}
    </span>
  );
}
