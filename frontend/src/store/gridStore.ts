import { create } from 'zustand';
import { useConfigStore } from './configStore';
import { generarPlanilla, planillaToTurnosMapa } from '../utils/planilla.engine';
import type { Planilla, TurnoTipo } from '../types/planilla.types';

// Re-exportar TurnoTipo para compatibilidad con imports existentes
export type { TurnoTipo };

export interface PersonalMock {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  matricula: string;
  nivel_formacion: 'LICENCIADO' | 'ENFERMERO_PROFESIONAL' | 'ENFERMERO_ESPECIALISTA' | 'AUXILIAR';
  jornada_horas: number;
  turno_fijo: 'M' | 'T' | 'N' | null;
  antiguedad_anos: number;
  compensatorio_pendiente: number;
}

export type TurnosMapa = Record<string, Record<number, TurnoTipo>>;

export interface GridState {
  personal: PersonalMock[];
  turnos: TurnosMapa;
  mes: number;
  anio: number;
  diasMes: number;
  feriados: number[];

  /** Planilla generada por el motor — fuente de verdad */
  planillaActual: Planilla | null;

  /** Errores del último intento de generación */
  errorGeneracion: string | null;

  // Actions
  inicializarPlanilla: (mes: number, anio: number, feriados: number[]) => void;
  asignarTurno: (personalId: string, dia: number, tipo: TurnoTipo) => void;
  intercambiarCeldas: (idA: string, diaA: number, idB: string, diaB: number) => boolean;
  limpiarPlanilla: () => void;
  agregarEnfermero: (enfermero: PersonalMock) => void;
  eliminarEnfermero: (id: string) => void;
  editarEnfermero: (enfermero: PersonalMock) => void;
}

// ─── Mock inicial de personal ─────────────────────────────────────────────────
// Se usa solo si localStorage está vacío (primer arranque)
const MOCK_STAFF: PersonalMock[] = [
  {
    id: 'staff-1',
    nombre: 'María',
    apellido: 'García',
    dni: '30.123.456',
    matricula: 'EP-101',
    nivel_formacion: 'ENFERMERO_PROFESIONAL',
    jornada_horas: 8,
    turno_fijo: null,
    antiguedad_anos: 8,
    compensatorio_pendiente: 0,
  },
  {
    id: 'staff-2',
    nombre: 'Alejandro',
    apellido: 'López',
    dni: '28.987.654',
    matricula: 'EE-202',
    nivel_formacion: 'ENFERMERO_ESPECIALISTA',
    jornada_horas: 8,
    turno_fijo: null,
    antiguedad_anos: 12,
    compensatorio_pendiente: 1,
  },
  {
    id: 'staff-3',
    nombre: 'Ricardo',
    apellido: 'Pérez',
    dni: '35.456.789',
    matricula: 'AE-303',
    nivel_formacion: 'AUXILIAR',
    jornada_horas: 8,
    turno_fijo: null,
    antiguedad_anos: 4,
    compensatorio_pendiente: 0,
  },
  {
    id: 'staff-4',
    nombre: 'Ana',
    apellido: 'Gómez',
    dni: '32.111.222',
    matricula: 'LIC-404',
    nivel_formacion: 'LICENCIADO',
    jornada_horas: 8,
    turno_fijo: null,
    antiguedad_anos: 15,
    compensatorio_pendiente: 0,
  },
  {
    id: 'staff-5',
    nombre: 'Sofía',
    apellido: 'Martínez',
    dni: '31.444.555',
    matricula: 'EP-505',
    nivel_formacion: 'ENFERMERO_PROFESIONAL',
    jornada_horas: 8,
    turno_fijo: null,
    antiguedad_anos: 6,
    compensatorio_pendiente: 0,
  },
  {
    id: 'staff-6',
    nombre: 'Juan',
    apellido: 'Rodríguez',
    dni: '34.777.888',
    matricula: 'AE-606',
    nivel_formacion: 'AUXILIAR',
    jornada_horas: 8,
    turno_fijo: null,
    antiguedad_anos: 3,
    compensatorio_pendiente: 0,
  },
  {
    id: 'staff-7',
    nombre: 'Carlos',
    apellido: 'Sánchez',
    dni: '29.888.999',
    matricula: 'EP-707',
    nivel_formacion: 'ENFERMERO_PROFESIONAL',
    jornada_horas: 8,
    turno_fijo: null,
    antiguedad_anos: 5,
    compensatorio_pendiente: 0,
  },
];

function cargarPersonalDesdeStorage(): PersonalMock[] {
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('sade_personal');
      if (cached) return JSON.parse(cached);
    }
  } catch {
    /* ignorar */
  }
  return [...MOCK_STAFF];
}

// ─── STORE ────────────────────────────────────────────────────────────────────

export const useGridStore = create<GridState>((set, get) => ({
  personal: cargarPersonalDesdeStorage(),
  turnos: {},
  mes: 6,
  anio: 2026,
  diasMes: 30,
  feriados: [],
  planillaActual: null,
  errorGeneracion: null,

  // ─── GENERAR PLANILLA ─────────────────────────────────────────────────────
  inicializarPlanilla: (mes, anio, feriados) => {
    const totalDays = new Date(anio, mes, 0).getDate();
    const config = useConfigStore.getState();
    const dotacion = config.dotacion;
    const currentStaff = [...get().personal];

    // Actualizar parámetros de mes/año/feriados siempre
    set({ mes, anio, diasMes: totalDays, feriados, errorGeneracion: null });

    // Si no hay dotación calculada aún, solo actualizar estado de fecha
    if (!dotacion) {
      set({ errorGeneracion: 'Configure la dotación antes de generar la planilla.' });
      return;
    }

    const Z_ceil = dotacion.Z_ceil;

    // Bloqueo si personal !== Z
    if (currentStaff.length !== Z_ceil) {
      set({
        errorGeneracion: `El personal activo (${currentStaff.length}) no coincide con la dotación Z=${Z_ceil}.`,
      });
      return;
    }

    try {
      const planilla = generarPlanilla({
        servicio_id: config.serviceKey,
        año: anio,
        mes,
        dias_mes: totalDays,
        feriados,
        Z: dotacion.Z,
        Z_ceil,
        Q1: dotacion.Q1,
        Q2: dotacion.Q2,
        Q3: dotacion.Q3,
        personal: currentStaff.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          nivel_formacion: p.nivel_formacion,
          antiguedad_anos: p.antiguedad_anos,
          compensatorio_pendiente: p.compensatorio_pendiente,
        })),
      });

      // Actualizar turno_fijo en el personal según la planilla generada
      const updatedPersonal = currentStaff.map((p) => {
        let turno_fijo: 'M' | 'T' | 'N' | null = p.turno_fijo;
        if (planilla.grupos.mañana.includes(p.id)) turno_fijo = 'M';
        else if (planilla.grupos.tarde.includes(p.id)) turno_fijo = 'T';
        else if (planilla.grupos.noche.includes(p.id)) turno_fijo = 'N';
        return { ...p, turno_fijo };
      });

      localStorage.setItem('sade_personal', JSON.stringify(updatedPersonal));

      const turnos = planillaToTurnosMapa(planilla);

      set({
        planillaActual: planilla,
        turnos,
        personal: updatedPersonal,
        errorGeneracion: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al generar la planilla.';
      set({ errorGeneracion: message });
    }
  },

  // ─── EDITAR CELDA INDIVIDUAL ─────────────────────────────────────────────
  asignarTurno: (personalId, dia, tipo) => {
    const { turnos, planillaActual } = get();
    const enfermeroTurnos = { ...turnos[personalId] };
    enfermeroTurnos[dia] = tipo;

    const newTurnos: TurnosMapa = {
      ...turnos,
      [personalId]: enfermeroTurnos,
    };

    // Actualizar también la planillaActual si existe
    let newPlanilla = planillaActual;
    if (newPlanilla) {
      const celdas = newPlanilla.celdas.map((c) => {
        if (c.personal_id === personalId && c.dia === dia) {
          const es_compensatorio =
            c.es_feriado && (tipo === 'M' || tipo === 'T' || tipo === 'N');
          return { ...c, tipo, es_compensatorio };
        }
        return c;
      });
      newPlanilla = { ...newPlanilla, celdas };
    }

    set({ turnos: newTurnos, planillaActual: newPlanilla });
  },

  // ─── INTERCAMBIAR DOS CELDAS (SWAP) ──────────────────────────────────────
  intercambiarCeldas: (idA, diaA, idB, diaB) => {
    const { turnos, planillaActual, personal } = get();

    // Validar que ambas personas existan
    const pA = personal.find((p) => p.id === idA);
    const pB = personal.find((p) => p.id === idB);
    if (!pA || !pB) return false;

    // Validar que sean del mismo grupo (turno_fijo igual)
    if (pA.turno_fijo !== pB.turno_fijo) return false;

    // Obtener valores actuales
    const valorA = turnos[idA]?.[diaA] ?? '';
    const valorB = turnos[idB]?.[diaB] ?? '';

    // Validar fila fija: no intercambiar si alguno resultaría con turno distinto
    const turnoFijo = pA.turno_fijo;
    const resultadoA = valorB; // A toma lo que tenía B
    const resultadoB = valorA; // B toma lo que tenía A
    if (
      resultadoA !== 'F' && resultadoA !== '' && resultadoA !== turnoFijo ||
      resultadoB !== 'F' && resultadoB !== '' && resultadoB !== turnoFijo
    ) {
      return false;
    }

    // Verificar cobertura mínima después del swap
    // Si diaA queda con todos en F, rechazar
    if (resultadoA === 'F' || resultadoA === '') {
      const grupoIds = planillaActual
        ? (turnoFijo === 'M'
          ? planillaActual.grupos.mañana
          : turnoFijo === 'T'
          ? planillaActual.grupos.tarde
          : planillaActual.grupos.noche)
        : [];
      const trabajandoDiaA = grupoIds.filter((pid) => {
        if (pid === idA) return false; // A ahora descansa
        return turnos[pid]?.[diaA] === turnoFijo;
      });
      if (trabajandoDiaA.length === 0) return false;
    }

    // Ejecutar swap
    const newTurnosA = { ...turnos[idA], [diaA]: valorB };
    const newTurnosB = { ...turnos[idB], [diaB]: valorA };
    const newTurnos: TurnosMapa = {
      ...turnos,
      [idA]: newTurnosA,
      [idB]: newTurnosB,
    };

    // Actualizar planillaActual
    let newPlanilla = planillaActual;
    if (newPlanilla) {
      const celdas = newPlanilla.celdas.map((c) => {
        if (c.personal_id === idA && c.dia === diaA) {
          const es_comp =
            c.es_feriado && (valorB === 'M' || valorB === 'T' || valorB === 'N');
          return { ...c, tipo: valorB, es_compensatorio: es_comp };
        }
        if (c.personal_id === idB && c.dia === diaB) {
          const es_comp =
            c.es_feriado && (valorA === 'M' || valorA === 'T' || valorA === 'N');
          return { ...c, tipo: valorA, es_compensatorio: es_comp };
        }
        return c;
      });
      newPlanilla = { ...newPlanilla, celdas };
    }

    set({ turnos: newTurnos, planillaActual: newPlanilla });
    return true;
  },

  // ─── REGENERAR ───────────────────────────────────────────────────────────
  limpiarPlanilla: () => {
    const { mes, anio, feriados } = get();
    get().inicializarPlanilla(mes, anio, feriados);
  },

  // ─── GESTIÓN DE PERSONAL ─────────────────────────────────────────────────
  agregarEnfermero: (enf) => {
    const { personal } = get();
    const updated = [...personal, enf];
    localStorage.setItem('sade_personal', JSON.stringify(updated));
    set({ personal: updated });
    // Reinicializar planilla con el nuevo personal
    const { mes, anio, feriados } = get();
    get().inicializarPlanilla(mes, anio, feriados);
  },

  eliminarEnfermero: (id) => {
    const { personal, turnos } = get();
    const updated = personal.filter((p) => p.id !== id);
    localStorage.setItem('sade_personal', JSON.stringify(updated));
    const newTurnos = { ...turnos };
    delete newTurnos[id];
    set({ personal: updated, turnos: newTurnos });
  },

  editarEnfermero: (enf) => {
    const { personal } = get();
    const updated = personal.map((p) => (p.id === enf.id ? enf : p));
    localStorage.setItem('sade_personal', JSON.stringify(updated));
    set({ personal: updated });
  },
}));
