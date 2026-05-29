import { describe, it, expect } from 'vitest';
import { validarTurnoCelda } from './useShiftValidation';
import type { PersonalMock, TurnosMapa } from '../store/gridStore';

describe('useShiftValidation — Reglas de Validación Legal (REQ-003 a REQ-007)', () => {
  
  // Datos comunes de prueba (Mock)
  const mockPersonal: PersonalMock[] = [
    {
      id: 'enfermero-1',
      nombre: 'María',
      apellido: 'García',
      dni: '11',
      matricula: 'EP-1',
      nivel_formacion: 'ENFERMERO_PROFESIONAL',
      jornada_horas: 8,
      turno_fijo: 'M',
      antiguedad_anos: 5,
      compensatorio_pendiente: 0
    },
    {
      id: 'auxiliar-1',
      nombre: 'Ricardo',
      apellido: 'Pérez',
      dni: '22',
      matricula: 'AE-1',
      nivel_formacion: 'AUXILIAR',
      jornada_horas: 8,
      turno_fijo: 'M',
      antiguedad_anos: 2,
      compensatorio_pendiente: 0
    }
  ];

  it('REQ-003: debe advertir con alerta amarilla (YELLOW) al trabajar en día feriado', () => {
    const feriados = [25]; // 25 de Mayo es feriado
    const turnosMapa: TurnosMapa = {
      'enfermero-1': {}
    };

    const res = validarTurnoCelda('enfermero-1', 25, 'M', mockPersonal, turnosMapa, feriados);
    
    expect(res).not.toBeNull();
    expect(res?.level).toBe('YELLOW');
    expect(res?.message).toContain('Feriado Nacional');
    expect(res?.basis).toBe('REQ-003 — Ley 24.004 / Ley 10.780');
  });

  it('REQ-004: debe bloquear con alerta roja (RED) al superar 3 noches consecutivas', () => {
    const feriados: number[] = [];
    const personalNoche = mockPersonal.map(p => p.id === 'enfermero-1' ? { ...p, turno_fijo: 'N' as const } : p);
    const turnosMapa: TurnosMapa = {
      'enfermero-1': {
        1: 'N',
        2: 'N',
        3: 'N'
      }
    };

    // Intentar asignar el 4° turno N consecutivo en el día 4
    const res = validarTurnoCelda('enfermero-1', 4, 'N', personalNoche, turnosMapa, feriados);

    expect(res).not.toBeNull();
    expect(res?.level).toBe('RED');
    expect(res?.message).toContain('3 turnos nocturnos consecutivos');
    expect(res?.basis).toBe('REQ-004 — Fatiga Circadiana (Ley 24.004)');
  });

  it('REQ-005: debe bloquear con alerta roja (RED) al superar 5 días laborados sin franco', () => {
    const feriados: number[] = [];
    const turnosMapa: TurnosMapa = {
      'enfermero-1': {
        1: 'M',
        2: 'M',
        3: 'M',
        4: 'M',
        5: 'M'
      }
    };

    // Intentar asignar el 6° día laboral consecutivo sin haber tenido un 'F' o celda vacía
    const res = validarTurnoCelda('enfermero-1', 6, 'M', mockPersonal, turnosMapa, feriados);

    expect(res).not.toBeNull();
    expect(res?.level).toBe('RED');
    expect(res?.message).toContain('5 días consecutivos de trabajo sin franco');
    expect(res?.basis).toBe('REQ-005 — Continuidad Laboral (Ley 24.004)');
  });

  it('REQ-006: debe advertir con alerta naranja (ORANGE) si hay menos de 16hs de descanso (T -> M)', () => {
    const feriados: number[] = [];

    // Para validar REQ-006 sin chocar con Paso 1, permitimos simular el descanso usando un personal con turno_fijo: 'M' pero que tuviera 'T' asignado previamente (simulando un cambio manual histórico aprobado)
    const resDescanso = validarTurnoCelda('enfermero-1', 2, 'M', mockPersonal, {
      'enfermero-1': { 1: 'T' }
    }, feriados);

    expect(resDescanso).not.toBeNull();
    expect(resDescanso?.level).toBe('ORANGE');
    expect(resDescanso?.message).toContain('Menos de 16 horas de descanso');
  });

  it('REQ-007: debe bloquear con alerta roja (RED) si un Auxiliar queda en turno sin supervisión profesional', () => {
    const feriados: number[] = [];
    const turnosMapa: TurnosMapa = {
      'auxiliar-1': {},
      'enfermero-1': {} // Ningún profesional asignado
    };

    // Intentar programar al Auxiliar en turno M en día 1
    const res = validarTurnoCelda('auxiliar-1', 1, 'M', mockPersonal, turnosMapa, feriados);

    expect(res).not.toBeNull();
    expect(res?.level).toBe('RED');
    expect(res?.message).toContain('El turno no tiene supervisión profesional');
    expect(res?.basis).toBe('REQ-007 — Supervisión Profesional (Ley 24.004)');
  });

  it('REQ-007: no debe alertar si el Auxiliar es asignado pero hay un Profesional en el mismo turno', () => {
    const feriados: number[] = [];
    const turnosMapa: TurnosMapa = {
      'auxiliar-1': {
        1: 'M'
      },
      'enfermero-1': {
        1: 'M' // Profesional María asignada en el mismo turno
      }
    };

    // El Auxiliar ya no debería tener alerta roja porque cuenta con supervisión profesional en ese turno
    const res = validarTurnoCelda('auxiliar-1', 1, 'M', mockPersonal, turnosMapa, feriados);
    expect(res).toBeNull();
  });

  it('REQ-010: debe bloquear con alerta roja (RED) si el enfermero no tiene turno fijo definido', () => {
    const feriados: number[] = [];
    const turnosMapa: TurnosMapa = {
      'enfermero-1': {}
    };
    
    // Clonar y poner turno_fijo: null
    const personalSinTurnoFijo = mockPersonal.map(p => p.id === 'enfermero-1' ? { ...p, turno_fijo: null } : p);
    
    const res = validarTurnoCelda('enfermero-1', 1, 'M', personalSinTurnoFijo as any, turnosMapa, feriados);
    expect(res).not.toBeNull();
    expect(res?.level).toBe('RED');
    expect(res?.message).toContain('sin turno fijo definido');
    expect(res?.basis).toBe('REQ-010 — Asignación de Turno Fijo Requerida');
  });
});
