import { useGridStore } from '../store/gridStore';
import type { TurnoTipo, TurnosMapa, PersonalMock } from '../store/gridStore';
import { useConfigStore } from '../store/configStore';

export interface AlertaResultado {
  level: 'YELLOW' | 'ORANGE' | 'RED';
  message: string;
  basis: string;
}

/**
 * Valida de forma individual si un cambio de turno en un día determinado viola alguna restricción.
 * 
 * @param personalId ID del enfermero
 * @param dia Día a validar (1-31)
 * @param tipo Tipo de turno propuesto
 * @param personal Lista de todo el personal (para conocer nivel formativo)
 * @param turnosMapa Mapa completo de turnos (para analizar bloques de días y turnos de otros enfermeros)
 * @param feriados Lista de días feriados del mes
 * @returns AlertaResultado o null si no hay violaciones
 */
export function validarTurnoCelda(
  personalId: string,
  dia: number,
  tipo: TurnoTipo,
  personal: PersonalMock[],
  turnosMapa: TurnosMapa,
  feriados: number[]
): AlertaResultado | null {
  const enfermero = personal.find((p) => p.id === personalId);
  if (!enfermero) return null;

  // REQ-010 — Asignación de Turno Fijo Requerida (Rojo 🔴 - BLOQUEANTE)
  if (enfermero.turno_fijo === null) {
    return {
      level: 'RED',
      message: 'Enfermero activo sin turno fijo definido. Ingrese a la Nómina para asignar su turno.',
      basis: 'REQ-010 — Asignación de Turno Fijo Requerida'
    };
  }

  if (!tipo) return null;

  const susTurnos = turnosMapa[personalId] || {};

  // Auxiliar para evaluar si un turno es laboral
  const esLaboral = (t: TurnoTipo) => t === 'M' || t === 'T' || t === 'N';

  // 1. REQ-003 — Franco Compensatorio por Feriado Trabajado (Amarillo 🟡)
  if (feriados.includes(dia) && esLaboral(tipo)) {
    return {
      level: 'YELLOW',
      message: 'Turno laborado en día Feriado Nacional. Genera franco compensatorio.',
      basis: 'REQ-003 — Ley 24.004 / Ley 10.780'
    };
  }

  // 2. REQ-004 — Límite de Fatiga Circadiana (Rojo 🔴 - BLOQUEANTE)
  if (tipo === 'N') {
    // Contar noches consecutivas hacia atrás
    let nochesAntes = 0;
    let d = dia - 1;
    while (susTurnos[d] === 'N') {
      nochesAntes++;
      d--;
    }

    // Contar noches consecutivas hacia adelante
    let nochesDespues = 0;
    d = dia + 1;
    while (susTurnos[d] === 'N') {
      nochesDespues++;
      d++;
    }

    const totalNoches = 1 + nochesAntes + nochesDespues;
    if (totalNoches > 3) {
      return {
        level: 'RED',
        message: 'Límite de 3 turnos nocturnos consecutivos alcanzado.',
        basis: 'REQ-004 — Fatiga Circadiana (Ley 24.004)'
      };
    }
  }

  // 3. REQ-005 — Límite de Continuidad Laboral (Rojo 🔴 - BLOQUEANTE)
  if (esLaboral(tipo)) {
    // Contar días laborados consecutivos hacia atrás
    let diasAntes = 0;
    let d = dia - 1;
    while (esLaboral(susTurnos[d])) {
      diasAntes++;
      d--;
    }

    // Contar días laborados consecutivos hacia adelante
    let diasDespues = 0;
    d = dia + 1;
    while (esLaboral(susTurnos[d])) {
      diasDespues++;
      d++;
    }

    const totalLaborados = 1 + diasAntes + diasDespues;
    if (totalLaborados > 5) {
      return {
        level: 'RED',
        message: 'Máximo de 5 días consecutivos de trabajo sin franco superado.',
        basis: 'REQ-005 — Continuidad Laboral (Ley 24.004)'
      };
    }
  }

  // 4. REQ-006 — Descanso Mínimo Inter-Jornada (Naranja 🟠 - PRECAUCIÓN)
  if (tipo === 'M') {
    // Si hoy entra M (06:00) y ayer fue T (salió 22:00) -> 8 horas de descanso
    const turnoAyer = susTurnos[dia - 1];
    if (turnoAyer === 'T') {
      return {
        level: 'ORANGE',
        message: 'Menos de 16 horas de descanso entre turnos (Vespertino T -> Matutino M).',
        basis: 'REQ-006 — Descanso Inter-Jornada (Ley 24.004)'
      };
    }
  }
  if (tipo === 'T') {
    // Si hoy es T (sale 22:00) y mañana es M (entra 06:00) -> 8 horas de descanso
    const turnoManana = susTurnos[dia + 1];
    if (turnoManana === 'M') {
      return {
        level: 'ORANGE',
        message: 'Menos de 16 horas de descanso entre turnos (Vespertino T -> Matutino M).',
        basis: 'REQ-006 — Descanso Inter-Jornada (Ley 24.004)'
      };
    }
  }

  // 5. REQ-007 — Supervisión Profesional (Rojo 🔴 - BLOQUEANTE en UI)
  if (enfermero.nivel_formacion === 'AUXILIAR' && esLaboral(tipo)) {
    // Analizar el resto del personal en ese día y turno
    const personalAsignadoMismoTurno = personal.filter((p) => {
      if (p.id === personalId) return false; // Excluirse a sí mismo
      const pTurnos = turnosMapa[p.id] || {};
      return pTurnos[dia] === tipo;
    });

    // Si no hay nadie más en el mismo turno, o TODOS los demás asignados son Auxiliares
    const todosAuxiliares = personalAsignadoMismoTurno.every((p) => p.nivel_formacion === 'AUXILIAR');
    if (personalAsignadoMismoTurno.length === 0 || todosAuxiliares) {
      return {
        level: 'RED',
        message: 'El turno no tiene supervisión profesional. El nivel auxiliar requiere supervisión de un Enfermero Profesional.',
        basis: 'REQ-007 — Supervisión Profesional (Ley 24.004)'
      };
    }
  }

  return null;
}

/**
 * Custom hook reactivo para validar celdas individuales en tiempo real dentro del flujo de React.
 */
export const useShiftValidation = () => {
  const personal = useGridStore((state) => state.personal);
  const turnos = useGridStore((state) => state.turnos);
  const feriados = useConfigStore((state) => state.feriados);

  const validarCelda = (personalId: string, dia: number, tipo: TurnoTipo): AlertaResultado | null => {
    return validarTurnoCelda(personalId, dia, tipo, personal, turnos, feriados);
  };

  return { validarCelda };
};
