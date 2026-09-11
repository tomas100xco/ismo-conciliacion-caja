# Conciliación de Caja · ISMO Motors

Interfaz funcional para consolidar los pagos que registran las cajeras en el
punto de venta. **No hay backend ni base de datos**: toda la información vive en
el navegador de quien la abre. Es una simulación completa del comportamiento,
pensada para afinar la interfaz antes de construir nada por detrás.

- **Producción:** https://ismo-conciliacion-caja.vercel.app
- **Diseño previo:** el lienzo aprobado en Claude Design
- **Sistema de diseño:** ISMO Suite

---

## El modelo, en una frase

Un **folio** es una factura con sus recibos de caja y, por cada recibo que pasó
por terminal, su tirilla. El día es la suma de los folios. El cierre cruza esa
suma contra el archivo que emite el DMS.

### Los ocho estados

Ninguno se elige a mano: son consecuencia de lo que dicen los documentos.

| Estado | Lo produce | Regla |
|---|---|---|
| Abierto | la captura | sólo hay factura |
| Parcial | la captura | Σ recibos < total de la factura |
| Falta tirilla | la captura | cobrado completo, un recibo con terminal sin soporte |
| Descuadre | la captura | la tirilla no cuadra con su recibo, o los recibos cobran de más |
| Cuadrado | la captura | completo y soportado |
| Conciliado | el cierre | el cruce contra el DMS quedó en cero |
| Cerrado con diferencia | el cierre | no cuadró, pero hay explicación y evidencia |
| Validado | otra persona | estado final; quien valida no puede ser quien capturó |

---

## Cómo está armado

```
app/
  page.tsx              Día · lista de folios, selector de fecha, filtros
  folio/[id]/page.tsx   Folio · captura con extracción en vivo
  cierre/page.tsx       Cierre · cruce, causas, explicación con evidencia
  auditoria/page.tsx    Registro de ediciones (no enlazado desde la app)
  globals.css           Tokens de ISMO Suite y todas las animaciones
components/
  Calendario  Captura  Chips  Editable  Iconos  Numero  Panel
lib/
  tipos  formato  reglas  semilla  simulacion  store  feedback
```

- **Estado:** `useReducer` en `lib/store.tsx`, persistido en `localStorage`.
- **Datos:** `lib/semilla.ts` genera 45 días de historia con un PRNG determinista
  y el día de hoy siguiendo el guion aprobado en diseño.
- **Extracción:** `lib/simulacion.ts` no lee documentos; produce lo que un lector
  real produciría. El avance por etapas vive en `store.correr()`.

---

## Registro silencioso de ediciones

Cualquier dato leído se puede corregir tocándolo. La app no lo impide y tampoco
lo celebra:

- En pantalla deja una **seña mínima**: un subrayado ámbar al 34 % de opacidad y
  un cambio muy leve del color del texto. El *tooltip* dice qué traía el documento.
- Por detrás guarda, en cada edición, el **valor original del documento**, el
  **valor anterior**, el **valor nuevo**, el usuario y la hora.
- Quien captura no ve ese registro. Está en `/auditoria`, que no se enlaza desde
  ninguna parte de la interfaz y se puede copiar o descargar.

---

## Modo feedback

Cada pieza de la interfaz lleva un atributo `data-fb` con un código estable
(`DIA.FILTRO.SINCERRAR`, `FOLIO.TIRILLA.CAPTURAR`, `CIERRE.TABLA`…).

1. Burbuja de ayuda → pestaña **Feedback** → **Apuntar a algo en la app**.
2. Toca cualquier elemento: se resalta y muestra su código.
3. Escribe la nota. Queda amarrada al código y a la pantalla.
4. **Copiar todo** o **Descargar** entrega un texto plano listo para pegar.

Las notas viven en `localStorage`, aparte del estado de la app.

---

## Correr en local

```bash
npm install
npm run dev
```

## Qué falta para que esto sea real

- Backend y almacenamiento de documentos.
- Extracción real (OCR / modelo de visión) en lugar de `lib/simulacion.ts`.
- Autenticación y el rol que valida: hoy hay un solo usuario simulado.
- La bandeja del validador, que todavía no se diseña.
