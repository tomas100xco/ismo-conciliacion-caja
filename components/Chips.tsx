import React from "react";
import { Marca } from "./Iconos";
import { EstadoDia, EstadoFolio } from "@/lib/tipos";
import { ETIQUETA_DIA, ETIQUETA_FOLIO, Tono, TONO_DIA, TONO_FOLIO } from "@/lib/reglas";

const FORMA_FOLIO: Record<EstadoFolio, Parameters<typeof Marca>[0]["forma"]> = {
  abierto: "aro",
  parcial: "triangulo",
  "falta-tirilla": "triangulo",
  descuadre: "octagono",
  cuadrado: "circulo",
  conciliado: "cuadrado",
  validado: "doble",
};

const FORMA_DIA: Record<EstadoDia, Parameters<typeof Marca>[0]["forma"]> = {
  "sin-movimiento": "aro",
  "sin-cerrar": "triangulo",
  "cerrado-con-diferencia": "octagono",
  conciliado: "cuadrado",
  validado: "doble",
};

export function Chip({
  tono,
  forma,
  children,
  fb,
  fbNombre,
  style,
}: {
  tono: Tono;
  forma?: Parameters<typeof Marca>[0]["forma"];
  children: React.ReactNode;
  fb?: string;
  fbNombre?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`chip chip-${tono}`}
      data-fb={fb}
      data-fb-nombre={fbNombre}
      style={style}
    >
      {forma && <Marca forma={forma} />}
      {children}
    </span>
  );
}

export function ChipFolio({
  estado,
  extra,
  fb,
}: {
  estado: EstadoFolio;
  extra?: string;
  fb?: string;
}) {
  return (
    <Chip
      tono={TONO_FOLIO[estado]}
      forma={FORMA_FOLIO[estado]}
      fb={fb}
      fbNombre={`Estado del folio: ${ETIQUETA_FOLIO[estado]}`}
    >
      {ETIQUETA_FOLIO[estado]}
      {extra ? ` ${extra}` : ""}
    </Chip>
  );
}

export function ChipDia({ estado, fb }: { estado: EstadoDia; fb?: string }) {
  return (
    <Chip
      tono={TONO_DIA[estado]}
      forma={FORMA_DIA[estado]}
      fb={fb}
      fbNombre={`Estado del día: ${ETIQUETA_DIA[estado]}`}
    >
      {ETIQUETA_DIA[estado]}
    </Chip>
  );
}

export { FORMA_DIA, FORMA_FOLIO };
