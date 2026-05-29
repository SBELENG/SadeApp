// ============================================================
// TIPOS OFICIALES DEL SISTEMA SADE
// Interfaces que definen la estructura de datos de la planilla
// ============================================================

/** Tipo de turno válido en una celda de planilla */
export type TurnoTipo = 'M' | 'T' | 'N' | 'F' | '';

/** Nivel de alerta visual en la celda */
export type AlertaNivel = 'rojo' | 'naranja' | 'amarillo' | null;

/**
 * Representa una celda individual en la planilla (persona × día).
 * La combinación (personal_id, dia) es la clave única.
 */
export interface CeldaMes {
  personal_id: string;
  dia: number;           // 1 a 31
  tipo: TurnoTipo;
  es_feriado: boolean;
  es_compensatorio: boolean; // true si trabajó un feriado → genera franco compensatorio
  alerta: AlertaNivel;
}

/**
 * Representa el grupo de turnos al que pertenece cada persona.
 * Una persona solo puede tener su turno_fijo o 'F' en toda su fila.
 */
export interface GruposPlanilla {
  mañana: string[];   // IDs del personal grupo M
  tarde: string[];    // IDs del personal grupo T
  noche: string[];    // IDs del personal grupo N
}

/**
 * Objeto Planilla completo — unidad de persistencia y trabajo.
 */
export interface Planilla {
  id: string;
  servicio_id: string;
  año: number;
  mes: number;             // 1-12
  dias_mes: number;        // 28,29,30,31
  feriados: number[];      // días que son feriados nacionales
  francos_base: number;    // francos base (8 o 9 según días del mes)
  francos_feriado: number; // francos adicionales por feriados
  francos_totales: number; // francos_base + francos_feriado
  Z: number;               // dotación total (exacto)
  Z_ceil: number;          // dotación total (ceil)
  grupos: GruposPlanilla;
  celdas: CeldaMes[];
  compensatorios: Record<string, number>; // personalId → cantidad de compensatorios acumulados este mes
  estado: 'borrador' | 'cerrada';
  generada_en: string;     // ISO timestamp
}

/**
 * Input necesario para que el motor genere la planilla.
 */
export interface PlanillaInput {
  servicio_id: string;
  año: number;
  mes: number;             // 1-12
  dias_mes: number;
  feriados: number[];
  Z: number;
  Z_ceil: number;
  Q1: number;              // cantidad grupo Mañana
  Q2: number;              // cantidad grupo Tarde
  Q3: number;              // cantidad grupo Noche
  /** Personal ya ordenado por antigüedad descendente */
  personal: PersonalParaPlanilla[];
}

/**
 * Datos del personal que el motor necesita para generar la planilla.
 * Son los únicos campos que el motor lee — no importa la interfaz completa.
 */
export interface PersonalParaPlanilla {
  id: string;
  nombre: string;
  apellido: string;
  nivel_formacion: 'LICENCIADO' | 'ENFERMERO_PROFESIONAL' | 'ENFERMERO_ESPECIALISTA' | 'AUXILIAR';
  antiguedad_anos: number;
  compensatorio_pendiente: number;
}
