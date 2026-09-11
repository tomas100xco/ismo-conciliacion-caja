"use client";

import React, { useRef } from "react";
import { Camara, Subir } from "./Iconos";

/**
 * La cámara es el formulario. El archivo no se lee de verdad en esta
 * simulación: lo que importa es que el flujo sea el real —abrir cámara,
 * elegir archivo, ver el avance— y que el nombre del archivo quede.
 */
export function BotonesCaptura({
  onArchivo,
  etiquetaCamara = "Tomar foto",
  etiquetaArchivo = "Subir archivo",
  fbCamara,
  fbArchivo,
  grandes = true,
  disabled,
}: {
  onArchivo: (nombre: string) => void;
  etiquetaCamara?: string;
  etiquetaArchivo?: string;
  fbCamara: string;
  fbArchivo: string;
  grandes?: boolean;
  disabled?: boolean;
}) {
  const camara = useRef<HTMLInputElement>(null);
  const archivo = useRef<HTMLInputElement>(null);

  function tomar(e: React.ChangeEvent<HTMLInputElement>, porDefecto: string) {
    const f = e.target.files?.[0];
    onArchivo(f?.name ?? porDefecto);
    e.target.value = "";
  }

  const clase = `btn ${grandes ? "btn-grande" : ""}`;

  return (
    <div className="par">
      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => tomar(e, `foto_${Date.now()}.jpg`)}
      />
      <input
        ref={archivo}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={(e) => tomar(e, `documento_${Date.now()}.pdf`)}
      />
      <button
        className={`${clase} btn-solido`}
        data-fb={fbCamara}
        data-fb-nombre={etiquetaCamara}
        disabled={disabled}
        onClick={() => camara.current?.click()}
      >
        <Camara s={grandes ? 24 : 20} />
        {etiquetaCamara}
      </button>
      <button
        className={`${clase} btn-linea-fuerte`}
        data-fb={fbArchivo}
        data-fb-nombre={etiquetaArchivo}
        disabled={disabled}
        onClick={() => archivo.current?.click()}
      >
        <Subir s={grandes ? 24 : 20} />
        {etiquetaArchivo}
      </button>
    </div>
  );
}

/** Un solo botón de captura, para casillas chicas como la tirilla. */
export function BotonCaptura({
  onArchivo,
  etiqueta,
  fb,
  tono = "alerta",
}: {
  onArchivo: (nombre: string) => void;
  etiqueta: string;
  fb: string;
  tono?: "alerta" | "neutro";
}) {
  const camara = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          onArchivo(f?.name ?? `tirilla_${Date.now()}.jpg`);
          e.target.value = "";
        }}
      />
      <button
        className="btn"
        data-fb={fb}
        data-fb-nombre={etiqueta}
        style={
          tono === "alerta"
            ? { border: "1px solid var(--alerta-fg)", color: "var(--alerta-fg)", background: "transparent" }
            : { border: "1px solid var(--borde-2)", background: "var(--paper)" }
        }
        onClick={() => camara.current?.click()}
      >
        <Camara s={20} />
        {etiqueta}
      </button>
    </>
  );
}
