# Especificación Técnica — SADE (Sistema Automatizado de Dotación de Enfermería)

SADE es una aplicación web SPA de tipo **Desktop-First** diseñada para optimizar, calcular y gestionar el personal y los turnos de enfermería en establecimientos de salud. Está basada en la **Metodología de Balderas Pedrero** para el cálculo de la dotación y se rige por el marco legal de la **Ley 24.004 / Ley 10.780**.

---

## 01. Stack Tecnológico

La arquitectura de SADE se compone de una Single Page Application (SPA) en el frontend y un backend REST desacoplado.

### Capas de la Aplicación
1. **Frontend (Capa de Presentación):** React 18 + TypeScript + Vite.
2. **Backend (Lógica de Negocio):** Node.js + Express + TypeScript.
3. **Base de Datos:** PostgreSQL 15 + Prisma ORM.

### Tecnologías Clave por Capa
*   **Frontend:** React 18, TypeScript 5, Vite, Zustand (estado global), TanStack Query (fetching y cache), React Hook Form, Tailwind CSS, Recharts (gráficos), jsPDF.
*   **Backend:** Node.js 20 LTS, Express 4, TypeScript, Prisma ORM, Zod (validación de esquemas), JWT Auth, date-fns, Winston (logger).
*   **Infraestructura:** PostgreSQL 15, Docker Compose, Nginx (reverse proxy), GitHub Actions CI, Railway / Render (despliegue).

> [!NOTE]
> **Desktop-First:** Debido a la naturaleza densa de la grilla mensual (31 columnas), la interfaz está optimizada para pantallas con una resolución mínima de 1280px. En dispositivos móviles se ofrecerá una vista de solo lectura de tipo "Ficha Individual" por enfermero.

---

## 02. Arquitectura y Estructura del Sistema

### Estructura de Carpetas (Frontend)
```tree
src/
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx          ← Pantalla 2 (Métricas)
│   ├── ConfigPage.tsx             ← Pantalla 1 (Configuración)
│   └── GridPage.tsx               ← Pantalla 3 (Grilla principal)
│
├── components/
│   ├── layout/
│   │   ├── Topbar.tsx             ← Logo SADE + Logo Inst. + Nav + User
│   │   └── Sidebar.tsx
│   ├── grid/
│   │   ├── ShiftGrid.tsx          ← Grilla mensual principal
│   │   ├── ShiftCell.tsx          ← Celda individual + dropdown + alertas
│   │   ├── FrancoCounter.tsx      ← Contador dinámico por fila
│   │   └── DayHeader.tsx          ← Cabecera de día (feriado, fin de semana)
│   ├── dashboard/
│   │   ├── DotacionSummary.tsx    <-- Resultado del algoritmo
│   │   └── TurnoChart.tsx         <-- Distribución por turno (dona)
│   └── staff/
│       ├── StaffForm.tsx          ← ABM de personal
│       └── StaffTable.tsx
│
├── store/                         ← Estado global Zustand
│   ├── gridStore.ts               ← Estado de la planilla y turnos
│   ├── staffStore.ts              ← Estado del personal
│   └── configStore.ts             ← Estado de configuración e índices
│
├── services/                      ← Cliente de API y llamadas REST
│   ├── api.ts                     ← Cliente Axios + interceptores
│   ├── dotacion.service.ts
│   ├── staff.service.ts
│   └── grid.service.ts
│
├── hooks/
│   ├── useShiftValidation.ts      ← Validaciones de reglas REQ-001 a REQ-006
│   ├── useFrancos.ts              ← Cálculos de francos dinámicos
│   └── usePdf.ts                  ← Generador de planilla PDF imprimible
│
└── utils/
    ├── dotacion.calc.ts           ← Fórmulas P, B, Z, Q, S, V
    ├── francos.calc.ts
    └── constants/
        └── indices.ts             ← Base de datos de índices por especialidad
```

### Endpoints de la API REST
| Método | Endpoint | Descripción | Requiere Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Autenticación de usuario, retorna JWT | No |
| `GET` | `/api/staff` | Listar personal del servicio activo | Sí |
| `POST` | `/api/staff` | Crear ficha de personal de enfermería | Sí |
| `PUT` | `/api/staff/:id` | Actualizar datos del enfermero | Sí |
| `GET` | `/api/services` | Obtener servicios e índices disponibles | Sí |
| `POST` | `/api/dotacion/calculate` | Ejecutar motor de cálculo Balderas | Sí |
| `GET` | `/api/grid/:year/:month/:serviceId` | Obtener la grilla del mes y servicio | Sí |
| `PUT` | `/api/grid/cell` | Asignar o modificar tipo de turno en celda | Sí |
| `GET` | `/api/grid/validate/:id` | Ejecutar validaciones REQ sobre toda la grilla | Sí |
| `GET` | `/api/holidays/:year` | Consultar feriados nacionales del año | Sí |
| `GET` | `/api/institutions/:id` | Obtener configuración y logo de la institución | Sí |
| `PUT` | `/api/institutions/:id/logo` | Subir o actualizar logo de la institución | Sí (Admin) |

---

## 03. Modelo de Datos y Entidades (Prisma / PostgreSQL)

SADE se organiza en un esquema de 6 entidades principales:

```mermaid
erDiagram
    INSTITUCION ||--o{ SERVICIO : posee
    SERVICIO ||--o{ PERSONAL : asigna
    SERVICIO ||--o{ PLANILLA : planifica
    PLANILLA ||--o{ TURNO : contiene
    PLANILLA ||--|| DOTACION_CALCULADA : calcula
    PERSONAL ||--o{ TURNO : realiza
```

### 1. Institucion
*   `id`: `String` (UUID, PK)
*   `nombre`: `String`
*   `logo_url`: `String` (nullable, guarda la ruta del logo cargado)
*   `nivel_complejidad`: `Int` (2 o 3, define ratio de profesionalización)
*   `created_at`: `DateTime` (default `now()`)

### 2. Servicio
*   `id`: `String` (UUID, PK)
*   `institucion_id`: `String` (FK a `Institucion`)
*   `nombre`: `String` (ej. "Terapia Intensiva", "Clínica Médica")
*   `especialidad_key`: `String` (mapea con base de datos inmutable de índices)
*   `camas`: `Int`

### 3. Personal
*   `id`: `String` (UUID, PK)
*   `servicio_id`: `String` (FK a `Servicio`)
*   `nombre`: `String`
*   `apellido`: `String`
*   `dni`: `String` (Unique)
*   `matricula`: `String` (Unique)
*   `nivel_formacion`: `NivelFormacion` (Enum: `LICENCIADO`, `ENFERMERO_PROFESIONAL`, `ENFERMERO_ESPECIALISTA`, `AUXILIAR`)
*   `jornada_horas`: `Int` (estándar 6 o 8 horas)
*   `turno_fijo`: `TurnoTipo` (Enum nullable: `M`, `T`, `N`, null para rotativos)
*   `antiguedad_anos`: `Int`
*   `estado`: `PersonalEstado` (Enum: `ACTIVO`, `VACACIONES`, `LICENCIA_ENFERMEDAD`, `CAPACITACION`)
*   `compensatorio_pendiente`: `Int` (Francos compensatorios que se trasladan del mes anterior, default 0)
*   `created_at`: `DateTime` (default `now()`)

### 4. Planilla (Grid Header)
*   `id`: `String` (UUID, PK)
*   `servicio_id`: `String` (FK a `Servicio`)
*   `anio`: `Int`
*   `mes`: `Int` (1 al 12)
*   `dias_mes`: `Int` (28 al 31)
*   `feriados`: `Int[]` (Arreglo con los días feriados del mes, ej: `[20, 25]`)
*   `estado`: `PlanillaEstado` (Enum: `BORRADOR`, `CERRADA`)

### 5. Turno (Celda)
*   `id`: `String` (UUID, PK)
*   `planilla_id`: `String` (FK a `Planilla`)
*   `personal_id`: `String` (FK a `Personal`)
*   `dia`: `Int` (1 al 31)
*   `tipo`: `TurnoTipo` (Enum: `M` - Mañana, `T` - Tarde, `N` - Noche, `F` - Franco)
*   `es_compensatorio`: `Boolean` (Indica si el franco fue generado por feriado trabajado, default false)
*   `alerta_nivel`: `AlertaNivel` (Enum nullable: `YELLOW`, `ORANGE`, `RED`)
*   `updated_at`: `DateTime` (default `now()`)

### 6. DotacionCalculada
*   `id`: `String` (UUID, PK)
*   `planilla_id`: `String` (FK a `Planilla`, Unique)
*   `P`: `Decimal` (Personal base calculado)
*   `B`: `Decimal` (Personal para ausentismo)
*   `Z`: `Decimal` (Total requerido)
*   `Q_manana`: `Decimal` (Personal requerido para la Mañana)
*   `Q_tarde`: `Decimal` (Personal requerido para la Tarde)
*   `Q_noche`: `Decimal` (Personal requerido para la Noche)
*   `Q_franco`: `Decimal` (Personal estimado en franco)

---

## 04. Parámetros de Entrada

Configurados por el usuario en la **Pantalla 1** para inicializar el motor de cálculo:

1.  **Servicio / Área:** Select que carga la configuración del servicio. Autocompleta el rango permitido del índice `I`.
2.  **Índice de Cuidado (I):** Horas promedio de atención requeridas por paciente en 24 horas. Autocompletado, pero ajustable mediante un slider o control dentro del rango permitido.
3.  **Camas Ocupadas / Disponibles (C):** Entero mayor o igual a 1.
4.  **Jornada Laboral (J):** Horas diarias por profesional. Valor fijo estándar = 8 horas.
5.  **Mes y Año:** DatePicker que define los días del mes y carga automáticamente los feriados nacionales.
6.  **Nivel de Complejidad (NC):** Nivel de la institución (2do o 3er Nivel), que define los ratios de profesionalización (70/30 o 80/20).
7.  **Feriados del Mes:** Lista de días interactiva (cargada por API de feriados, editable haciendo click en un minicalendario).

---

## 05. Índices de Cuidado por Especialidad

Base de datos inmutable embebida en `constants/indices.ts`:

| Categoría | Especialidad | Rango del Índice I | Perfil Requerido |
| :--- | :--- | :--- | :--- |
| **Clínica** | Medicina Interna / Infectología | `4.0 – 4.8` | Enfermero Profesional |
| **Clínica** | Cardiología | `3.0 – 3.4` | Enfermero Profesional |
| **Clínica** | Perinatología | `8.0 – 12.0` | Enfermero Profesional |
| **Quirúrgica** | Cirugía General | `3.4 – 4.0` | Enfermero Profesional |
| **Quirúrgica** | Cirugía Cardiovascular / Traumatología | `4.0 – 4.8` | Enfermero Profesional |
| **Crítica** | Cuidados Intensivos (Adultos) | Ratios fijos: `1:2` a `1:1` | Enfermero Especialista |
| **Pediátrica** | UCI Pediátrica / Neonatología | `8.0 – 12.0` | Enfermero Especialista |
| **Pediátrica** | Prematuros | `5.0 – 8.0` | Enfermero Profesional |
| **Ambulatorio**| Admisión Hospitalaria | Fijo: `1` AE por turno | Auxiliar / Enfermero |
| **Recuperación**| Sala de Recuperación | Variable | EG según ratio |

> [!WARNING]
> **Área Crítica (UCI Adultos):** En lugar de aplicar la fórmula estándar basada en el índice `I`, para la UCI se utiliza un selector de ratio enfermero/cama (ej. 1:2 o 1:1). El sistema calculará la dotación directamente desde el número de camas, ignorando la ecuación tradicional $P = (I \times C) / J$.

---

## 06. Algoritmo de Cálculo (Metodología Balderas Pedrero)

El cálculo se ejecuta en `utils/dotacion.calc.ts`. Todos los resultados finales de dotación se redondean al entero superior (`Math.ceil`) para asegurar cobertura.

### Paso 1: Personal Base (P)
Determina el personal mínimo requerido para cubrir las 24 horas del servicio en condiciones ideales.
$$P = \frac{I \times C}{J}$$

### Paso 2: Colchón de Ausentismo Previsible (B)
Calcula el personal de reserva necesario para cubrir vacaciones, licencias y descansos ordinarios. Coeficiente estandarizado: **41%** (constante).
$$B = P \times 0.41$$

### Paso 3: Dotación Total Requerida (Z)
$$Z = P + B$$

### Paso 4: Distribución por Turnos (Q)
Segmentación de la dotación total para cubrir las 24 horas del día más los de franco.
*   **Mañana ($Q_1$):** $Z \times 0.35$ (35%)
*   **Tarde ($Q_2$):** $Z \times 0.25$ (25%)
*   **Noche ($Q_3$):** $Z \times 0.20$ (20%)
*   **Francos ($Q_f$):** $Z \times 0.20$ (20%)

> [!IMPORTANT]
> **Validación de Consistencia:** El sistema debe verificar que $Q_1 + Q_2 + Q_3 + Q_f = Z$ (redondeado). Si por errores de redondeo decimal la suma final difiere de `Math.ceil(Z)`, se ajusta el componente $Q_f$ en $\pm 1$ para balancear. Si la discrepancia supera el 1%, el sistema arroja una excepción.

### Paso 5: Composición Profesional (S / V)
Clasifica al personal requerido según su nivel formativo acorde a la complejidad del servicio:
*   **Establecimiento de 2° Nivel de Complejidad:**
    *   Profesionales ($S$): $70\%$ de la dotación total ($Z \times 0.70$)
    *   Auxiliares ($V$): $30\%$ de la dotación total ($Z \times 0.30$)
*   **Establecimiento de 3° Nivel de Complejidad:**
    *   Profesionales ($S$): $80\%$ de la dotación total ($Z \times 0.80$)
    *   Auxiliares ($V$): $20\%$ de la dotación total ($Z \times 0.20$)

---

## 07. Restricciones de Validación (REQ-001 a REQ-007)

Estas restricciones se validan en tiempo real en la grilla mensual mediante el hook `useShiftValidation.ts` y en el backend:

*   **REQ-001 — Base de Francos Ordinarios:**
    Si el mes planificado tiene 28, 29 o 30 días, la base de francos a asignar por enfermero es de **8 francos**. Si el mes tiene 31 días, la base es de **9 francos**.
*   **REQ-002 — Ajuste por Feriados del Mes:**
    Por cada feriado nacional marcado en el mes en curso, se adiciona un franco al total a gozar por el trabajador: $\text{Francos Totales} = \text{Base Francos} + \text{Feriados del Mes} + \text{Compensatorios Trasladados}$.
*   **REQ-003 — Franco Compensatorio por Feriado Trabajado:**
    Si a un enfermero se le asigna un turno de trabajo (`M` o `T`) en un día marcado como feriado, se le debe compensar. La celda se coloreará en amarillo, se sumará $+1$ al contador de francos del mes y se enviará una notificación visual.
    *   *Traslado por fin de mes:* Si el feriado trabajado es el último día del mes en curso, el franco compensatorio se traslada al mes siguiente sumando $+1$ al campo `compensatorio_pendiente` de la entidad `Personal`.
*   **REQ-004 — Límite de Fatiga Circadiana (BLOQUEANTE):**
    Queda terminantemente prohibido asignar más de **3 turnos N (Noche) consecutivos** a un enfermero. La asignación de un 4° turno `N` consecutivo está bloqueada. Lanza alerta visual **Roja** y bloquea la escritura.
*   **REQ-005 — Límite de Continuidad Laboral (BLOQUEANTE):**
    Un enfermero puede trabajar un máximo de **5 días consecutivos** (independientemente de si es `M`, `T` o `N`) sin gozar de un franco (`F`). Intentar colocar un 6° día de trabajo consecutivo activa una alerta **Roja** y bloquea la acción.
*   **REQ-006 — Descanso Mínimo Inter-jornada (PRECAUCIÓN):**
    Debe respetarse un descanso mínimo de **16 horas** entre turnos sucesivos.
    *   *Escenario Crítico:* Si un enfermero trabaja en turno `T` (Vespertino: finaliza 22:00 hs) y se le asigna el turno `M` (Matutino: inicia 06:00 hs) al día siguiente, el descanso es de solo 8 horas. Esto activa una alerta **Naranja**. El sistema *no bloquea* la acción, pero requiere confirmación explícita mediante un modal de advertencia.
*   **REQ-007 — Supervisión Profesional (Ley 24.004) (BLOQUEANTE):**
    En un turno determinado de un día, no puede haber únicamente personal `AUXILIAR` asignado. Debe haber al menos un `LICENCIADO`, `ENFERMERO_PROFESIONAL` o `ENFERMERO_ESPECIALISTA` para ejercer la supervisión reglamentaria. Si un turno queda atendido solo por auxiliares, se activa una alerta **Roja** en ese bloque de celdas.

---

## 08. Sistema de Alertas Semáforo Visual

Las celdas de la grilla principal reaccionan dinámicamente de acuerdo al nivel de gravedad de las infracciones. En caso de acumularse varias infracciones en una sola celda, prevalece la de mayor gravedad: **Rojo (Crítico) > Naranja (Precaución) > Amarillo (Aviso)**.

### 🔴 Alerta Roja — Restricción Crítica (Bloqueante)
*   **Causas:** Violación de REQ-004 (+3 noches), REQ-005 (+5 días trabajados), o REQ-007 (turno sin supervisión profesional).
*   **Acción:** La celda se pinta en rojo suave con bordes rojos definidos. Bloquea la acción. Muestra un tooltip con el detalle legal de la infracción.
*   **Override:** El supervisor puede desbloquear e introducir el turno mediante credenciales especiales (deja registro en log de auditoría).

### 🟠 Alerta Naranja — Precaución de Descanso
*   **Causas:** Violación de REQ-006 (turno T seguido de M, descanso < 16 horas).
*   **Acción:** La celda se pinta en color naranja. Al intentar guardarlo, se dispara un modal de confirmación interactiva.

### 🟡 Alerta Amarilla — Compensatorios / Feriados
*   **Causas:** Turno ordinario programado sobre día feriado (REQ-003) o proximidad de fin de mes sin franco de fin de semana asignado.
*   **Acción:** Celda de color amarillo suave. No requiere confirmación ni bloquea el guardado. Incrementa dinámicamente el total de francos requeridos en la grilla mensual.

### 🟢 Indicador Verde — Francos Cumplidos
*   **Causa:** El total de turnos de descanso `F` asignados a un enfermero iguala o supera la meta mensual ($\text{Francos Totales}$).
*   **Acción:** El contador de francos al final de la fila correspondiente cambia de color a verde brillante, indicando cumplimiento del plan de descanso.

---

## 09. Sistema de Diseño (Estética Dark Tech)

El diseño de SADE busca simular un panel de control médico digital avanzado y profesional.

### Paleta de Colores (Variables CSS)
```css
:root {
  --bg: #0a0e1a;         /* Fondo profundo */
  --surface: #111827;    /* Contenedores y cards principales */
  --surface2: #1a2235;   /* Tablas y elementos interactivos secundarios */
  --border: rgba(99, 179, 237, 0.12);
  --border2: rgba(99, 179, 237, 0.22);
  --accent: #38bdf8;     /* Cyan primario (tags, botones y acentos de datos) */
  --accent2: #818cf8;    /* Indigo secundario */
  --accent3: #34d399;    /* Verde para estados exitosos y francos cubiertos */
  --accent4: #fb923c;    /* Naranja para advertencias o perfiles Auxiliares */
  --accent5: #f87171;    /* Rojo para restricciones bloqueantes */
  --holiday-bg: #1e3a5f; /* Azul profundo para celdas feriadas */
  --text: #e2e8f0;       /* Texto de lectura principal */
  --text2: #94a3b8;      /* Descripciones y subtítulos */
  --text3: #64748b;      /* Silenciados y leyendas */
  --heading: #f1f5f9;    /* Títulos principales */
}
```

### Fuentes Tipográficas
*   **Headings y Display (Títulos):** `'Syne', sans-serif` (pesos 700, 800) para un estilo tecnológico y moderno.
*   **Cuerpo y Formularios:** `'Inter', sans-serif` (pesos 300, 400, 500) para una lectura descansada y ágil.
*   **Datos y Monitores:** `'DM Mono', monospace` (pesos 400, 500) para mostrar celdas, contadores, índices y fórmulas matemáticas.

### Identidades del Logo SADE (SVG oficiales)
El logo consiste en un rombo de precisión técnica que encierra una cruz médica, reflejando el carácter tecnológico y médico del software.
1.  **Versión Oscura (App & Login):** Fondo `#0a0e1a`, rombo cyan, texto SADE en fuente *Syne* y descriptor inferior en *DM Mono*.
2.  **Versión Icono:** Rombo cyan y cruz médica centrada para favicon y accesos rápidos (tamaños 90px, 60px, 40px).
3.  **Versión Clara (Impresión y PDF):** Fondo `#f8fafc`, trazo azul y gris, perfecto para impresiones de planilla física B&N o color.

---

## 10. Especificación y Flujo de Pantallas

La aplicación opera bajo un encabezado persistente (Pantalla 0) y tres secciones principales seleccionables desde la botonera superior:

```
[ PANTALLA 0: TOPBAR GLOBAL ]
  ├─> [ PANTALLA 1: CONFIGURACIÓN DEL MES ]
  ├─> [ PANTALLA 2: DASHBOARD DE DOTACIÓN ]
  └─> [ PANTALLA 3: LA GRILLA INTERACTIVA (VISTA PRINCIPAL) ]
```

### Pantalla 0 — Topbar Global (Persistente)
*   **Ubicación:** Superior fija.
*   **Elementos:**
    *   Izquierda: Logo de la Institución (cargado dinámicamente) y Logo de SADE.
    *   Centro: Nombre de la Institución - Servicio Activo.
    *   Derecha: Selector de Mes/Año de trabajo rápido, indicador de usuario y botón de cerrar sesión.
    *   Bajo el topbar: Botonera de navegación principal (Configuración, Dashboard, Planilla) y el botón flotante de **Exportar PDF** en el extremo derecho.

### Pantalla 1 — Configuración del Mes
*   **Propósito:** Parametrizar el cálculo mensual antes de abrir la planilla de turnos.
*   **UI/UX:**
    *   Select de Servicio que autocompleta el rango de horas de atención en un Slider interactivo para configurar el índice `I`.
    *   Input numérico para la cantidad de camas activas (`C`).
    *   Radio buttons para definir el Nivel de Complejidad (2do vs 3er Nivel).
    *   Mini-calendario interactivo para feriados del mes. Permite marcar/desmarcar feriados que no estén pre-cargados por API.
    *   Botón destacado con micro-animación: `"Calcular Dotación"`.

### Pantalla 2 — Dashboard de Dotación Calculada
*   **Propósito:** Visualizar los resultados analíticos del algoritmo de Balderas Pedrero.
*   **UI/UX:**
    *   Fila de tres cards de alto impacto con datos en fuente *Syne* gigante:
        *   `Personal Base (P)`
        *   `Ausentismo Previsible (B)`
        *   `Total Requerido (Z)` (Card destacada con acento cyan).
    *   Segunda fila con la distribución requerida por tramos: `Mañana (Q1)`, `Tarde (Q2)`, `Noche (Q3)` e indicador de `Francos (Qf)`.
    *   Gráficos circulares (Dona) creados con *Recharts* que ilustran la composición profesional (ej. 80% Profesionales vs 20% Auxiliares).

### Pantalla 3 — La Grilla Interactiva (Core)
*   **Propósito:** Distribución y edición de los turnos diarios del personal asignado.
*   **UI/UX y Comportamiento:**
    *   Solo lista al personal cuyo estado sea `ACTIVO`. Personal de licencia o vacaciones no figura para evitar errores.
    *   **Cabeceras:** Días del mes (1 al 28/31). Fines de semana sombreados en un gris azulado. Feriados destacados con fondo azul profundo (`--holiday-bg`) y una banderita.
    *   **Interacciones Celda (UX-01 a UX-03):**
        *   *Click en Celda:* Abre dropdown contextual con opciones (`M`, `T`, `N`, `F`) y una opción `"Limpiar"`.
        *   *Atajos de Teclado:* Al seleccionar una celda, presionar las teclas `M`, `T`, `N` o `F` asigna el valor directamente, acelerando la carga administrativa.
        *   *Hover en Alerta:* Despliega tooltip informativo del error y su base legal.
    *   **Contador por Fila (Zustand):** Columna final que muestra los francos asignados sobre la meta mensual (ej. `7/9`). Cambia a color **Verde (🟢)** al cumplir la meta, **Amarillo (🟡)** si faltan asignar días, y **Rojo (🔴)** si viola restricciones.

---

## 11. Especificación de Exportación PDF

El PDF es un requerimiento legal y administrativo imprescindible para las firmas de directores e impresión física.

*   **PDF-01 — Estilo del Encabezado:** A la izquierda se imprime el logo de la institución (campo `logo_url`), y a la derecha el nombre. Debajo, una línea punteada y la metadata: `Área/Servicio | Mes | Año`.
*   **PDF-02 — Layout Landscape:** Formato de grilla apaisada A4. Las celdas de alerta se sombrean con tramas o colores grises suaves para garantizar la legibilidad en impresiones blanco y negro.
*   **PDF-03 — Leyenda e Impresión:** Se imprime en la última columna el estado final de francos. Al pie de página se incluye la firma de conformidad del Jefe de Servicio, aclaración, y fecha de generación del sistema.
*   **PDF-04 — Multi-página Inteligente:** Si el servicio excede los 15 enfermeros activos, la grilla se segmenta automáticamente en páginas sucesivas, repitiendo el encabezado de la institución en cada hoja.

---

## 12. Plan de Fases de Desarrollo

Seguimos una metodología secuencial para garantizar la robustez matemática e infraestructural del sistema:

### Fase 1: Infraestructura y Datos (Actual)
*   Setup general del proyecto: Scaffolding Vite + React + TypeScript en frontend. Configuración de Node.js + Express en backend.
*   Configuración de la Base de Datos PostgreSQL usando Prisma. Modelado de las 6 entidades con sus relaciones y enums.
*   Setup de la estructura de carpetas exacta definida en la sección 02.
*   CRUD y ABM inicial de personal de enfermería en backend.

### Fase 2: Algoritmo de Cálculo y Vistas Analíticas
*   Implementación de `dotacion.calc.ts` y sus pruebas unitarias.
*   Desarrollo de las interfaces Pantalla 1 (Configuración) y Pantalla 2 (Dashboard).

### Fase 3: Grilla Interactiva (Core UX)
*   Construcción de la tabla de 31 columnas reactiva.
*   Atajos de teclado y dropdowns inline de celdas. Contadores básicos de francos.

### Fase 4: Sistema de Alertas y Restricciones REQ
*   Integración del hook `useShiftValidation.ts` evaluando restricciones REQ-001 a REQ-007.
*   Renderizado de semáforo visual (rojo, naranja, amarillo) y tooltips explicativos.
*   Mecanismo de supervisor override. Pruebas unitarias de las restricciones.

### Fase 5: PDF e Identidad Institucional
*   Desarrollo del servicio de exportación jsPDF.
*   Upload del logo e integración en el topbar y el reporte imprimible.
