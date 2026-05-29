// ============================================================
// TEST DE INTEGRACIÓN — MOTOR DE PLANILLA SADE
// Caso de referencia: Cardiología Pediátrica / 8 camas / 3er Nivel / Diciembre 2026
// Verifica los 10 puntos del checklist de invariantes (Corrección C5)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  generarPlanilla,
  calcDenominador,
  calcNumeradorDisponible,
  calcEstadoSemaforo,
  calcularCompensatorios,
  validarInvariantesPlanilla,
  distribuirFrancosGrupo,
  calcFinesDeSemanaMes,
} from './planilla.engine';
import type { PlanillaInput, GruposPlanilla } from '../types/planilla.types';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Genera el input estándar para Cardiología Pediátrica / Diciembre 2026.
 * - Diciembre 2026: 31 días
 * - Feriados: 8 (Inmaculada Concepción) y 25 (Navidad)
 * - 8 camas, 3er Nivel, I≈4.5 → Z≈6.35 → Z_ceil=7
 * - Distribución Q: Q1=3M, Q2=2T, Q3=2N (con ajuste de suma)
 */
function buildInputCardio(zCeil = 7, q1 = 3, q2 = 2, q3 = 2): PlanillaInput {
  const personal = Array.from({ length: zCeil }, (_, i) => ({
    id: `enf-${String(i + 1).padStart(2, '0')}`,
    nombre: `Enfermero`,
    apellido: `${i + 1}`,
    nivel_formacion: 'LICENCIADO' as const,
    antiguedad_anos: 10 - i, // decreciente para testear orden
    compensatorio_pendiente: 0,
  }));

  return {
    servicio_id: 'cardio-ped',
    año: 2026,
    mes: 12,        // Diciembre
    dias_mes: 31,
    feriados: [8, 25], // Inmaculada Concepción y Navidad
    Z: 6.35,
    Z_ceil: zCeil,
    Q1: q1,
    Q2: q2,
    Q3: q3,
    personal,
  };
}

// ─── [C3] CORRECCIÓN 3: Contador de francos ───────────────────────────────────

describe('[C3] Cálculo del contador de francos', () => {
  it('DENOMINADOR: diciembre (31 días) + 2 feriados = 11', () => {
    expect(calcDenominador(31, 2)).toBe(11);
  });

  it('DENOMINADOR: mes de 30 días + 0 feriados = 8', () => {
    expect(calcDenominador(30, 0)).toBe(8);
  });

  it('DENOMINADOR: mes de 28 días + 3 feriados = 11', () => {
    expect(calcDenominador(28, 3)).toBe(11);
  });

  it('numerador_disponible = DENOMINADOR + compensatorios ganados', () => {
    // Diciembre + 2 feriados = DENOMINADOR 11. Trabajó M del 8 y M del 25 → +2 compensatorios
    expect(calcNumeradorDisponible(11, 2)).toBe(13);
    // Sin compensatorios
    expect(calcNumeradorDisponible(11, 0)).toBe(11);
  });

  describe('semáforo', () => {
    it('verde cuando asignados == disponibles', () => {
      expect(calcEstadoSemaforo(11, 11)).toBe('verde');
    });
    it('amarillo cuando asignados < disponibles (compensatorios sin usar)', () => {
      expect(calcEstadoSemaforo(11, 13)).toBe('amarillo');
    });
    it('rojo cuando asignados > disponibles (error crítico)', () => {
      expect(calcEstadoSemaforo(14, 13)).toBe('rojo');
    });
  });
});

// ─── [C2] CORRECCIÓN 2: Regla de compensatorios ──────────────────────────────

describe('[C2] calcularCompensatorios — regla institucional exacta', () => {
  it('M del día feriado genera compensatorio', () => {
    const grupos: GruposPlanilla = {
      mañana: ['enf-01', 'enf-02'],
      tarde: ['enf-03'],
      noche: ['enf-04'],
    };
    // Día 8 (feriado):
    //   enf-01: M → compensatorio ✅
    //   enf-02: F → no
    //   enf-03: T → compensatorio ✅
    //   enf-04: N del día 8 (feriado) → NO compensatorio ❌
    //   La noche anterior (día 7) de enf-04 es F → no hay N anterior
    const turnosMap: Record<string, Record<number, 'M' | 'T' | 'N' | 'F' | ''>> = {
      'enf-01': { 8: 'M', 7: 'M' },
      'enf-02': { 8: 'F', 7: 'M' },
      'enf-03': { 8: 'T', 7: 'T' },
      'enf-04': { 8: 'N', 7: 'F' },  // F en día 7 (anterior) → no N anterior al feriado
    };
    const comp = calcularCompensatorios([8], grupos, turnosMap, 31);
    expect(comp.get('enf-01')).toBe(1);        // M del feriado → sí
    expect(comp.get('enf-02')).toBeUndefined(); // Franco → no
    expect(comp.get('enf-03')).toBe(1);        // T del feriado → sí
    expect(comp.get('enf-04')).toBeUndefined(); // N del feriado (día anterior = F) → no
  });


  it('N de la noche ANTERIOR al feriado genera compensatorio', () => {
    const grupos: GruposPlanilla = {
      mañana: ['enf-01'],
      tarde: ['enf-02'],
      noche: ['enf-03', 'enf-04'],
    };
    // Feriado día 8. Noche del día 7 (noche anterior) → compensatorio
    // Noche del día 8 → NO compensatorio
    const turnosMap: Record<string, Record<number, 'M' | 'T' | 'N' | 'F' | ''>> = {
      'enf-01': { 8: 'M' },
      'enf-02': { 8: 'T' },
      'enf-03': { 7: 'N', 8: 'F' },  // trabajó noche del 7 → compensatorio
      'enf-04': { 7: 'F', 8: 'N' },  // trabajó noche del 8 → NO compensatorio
    };
    const comp = calcularCompensatorios([8], grupos, turnosMap, 31);
    expect(comp.get('enf-03')).toBe(1); // N anterior al feriado → sí
    expect(comp.get('enf-04')).toBeUndefined(); // N del feriado → no
  });

  it('feriado en día 1: no hay noche anterior, no crash', () => {
    const grupos: GruposPlanilla = {
      mañana: ['enf-01'],
      tarde: ['enf-02'],
      noche: ['enf-03'],
    };
    const turnosMap: Record<string, Record<number, 'M' | 'T' | 'N' | 'F' | ''>> = {
      'enf-01': { 1: 'M' },
      'enf-02': { 1: 'T' },
      'enf-03': { 1: 'N' },
    };
    // No debe crashear y N del día 1 no genera compensatorio
    expect(() => calcularCompensatorios([1], grupos, turnosMap, 31)).not.toThrow();
    const comp = calcularCompensatorios([1], grupos, turnosMap, 31);
    expect(comp.get('enf-03')).toBeUndefined();
  });

  it('caso Diciembre 2026: feriados 8 y 25 — regla correcta para todos los grupos', () => {
    const grupos: GruposPlanilla = {
      mañana: ['enf-01', 'enf-02', 'enf-03'],
      tarde: ['enf-04', 'enf-05'],
      noche: ['enf-06', 'enf-07'],
    };
    const turnosMap: Record<string, Record<number, 'M' | 'T' | 'N' | 'F' | ''>> = {
      'enf-01': { 8: 'M', 25: 'M', 7: 'M', 24: 'M' },
      'enf-02': { 8: 'F', 25: 'M', 7: 'M', 24: 'M' },
      'enf-03': { 8: 'M', 25: 'F', 7: 'M', 24: 'M' },
      'enf-04': { 8: 'T', 25: 'T', 7: 'T', 24: 'T' },
      'enf-05': { 8: 'F', 25: 'F', 7: 'T', 24: 'T' },
      'enf-06': { 7: 'N', 8: 'F', 24: 'N', 25: 'F' }, // noche anterior a feriado → comp
      'enf-07': { 7: 'F', 8: 'N', 24: 'F', 25: 'N' }, // noche del feriado → NO comp
    };
    const comp = calcularCompensatorios([8, 25], grupos, turnosMap, 31);
    expect(comp.get('enf-01')).toBe(2); // M en ambos feriados
    expect(comp.get('enf-02')).toBe(1); // M solo en el 25
    expect(comp.get('enf-03')).toBe(1); // M solo en el 8
    expect(comp.get('enf-04')).toBe(2); // T en ambos feriados
    expect(comp.get('enf-05')).toBeUndefined(); // Franco en ambos → 0
    expect(comp.get('enf-06')).toBe(2); // N noche anterior a ambos feriados
    expect(comp.get('enf-07')).toBeUndefined(); // N del feriado → 0
  });
});

// ─── [C1] CORRECCIÓN 1: Algoritmo de distribución de francos ─────────────────

describe('[C1] distribuirFrancosGrupo — algoritmo día a día', () => {
  const fds = calcFinesDeSemanaMes(2026, 12, 31);

  it('cada persona recibe exactamente DENOMINADOR francos', () => {
    const pids = ['p1', 'p2', 'p3'];
    const denominador = 11; // Dic 2026 + 2 feriados
    const { turnos } = distribuirFrancosGrupo(pids, 'M', 31, denominador, fds, [8, 25]);
    for (const pid of pids) {
      const totalF = Object.values(turnos[pid]).filter(t => t === 'F').length;
      expect(totalF).toBe(denominador);
    }
  });

  it('nunca hay más de 5 días laborales consecutivos (REQ-005)', () => {
    const pids = ['p1', 'p2', 'p3', 'p4'];
    const { turnos } = distribuirFrancosGrupo(pids, 'M', 31, 11, fds, [8, 25]);
    for (const pid of pids) {
      let consec = 0;
      for (let d = 1; d <= 31; d++) {
        const t = turnos[pid][d];
        if (t === 'M') {
          consec++;
          expect(consec).toBeLessThanOrEqual(5);
        } else {
          consec = 0;
        }
      }
    }
  });

  it('nunca hay más de 3 noches consecutivas para grupo N (REQ-004)', () => {
    const pids = ['p1', 'p2'];
    const { turnos } = distribuirFrancosGrupo(pids, 'N', 31, 11, fds, [8, 25]);
    for (const pid of pids) {
      let consec = 0;
      for (let d = 1; d <= 31; d++) {
        const t = turnos[pid][d];
        if (t === 'N') {
          consec++;
          expect(consec).toBeLessThanOrEqual(3);
        } else {
          consec = 0;
        }
      }
    }
  });

  it('siempre hay al menos 1 persona trabajando por día (cobertura mínima)', () => {
    const pids = ['p1', 'p2', 'p3'];
    const { turnos } = distribuirFrancosGrupo(pids, 'T', 31, 11, fds, [8, 25]);
    for (let d = 1; d <= 31; d++) {
      const trabajando = pids.filter(pid => turnos[pid][d] === 'T');
      expect(trabajando.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('funciona con grupos de 1 persona (mínimo viable)', () => {
    // Con 1 persona no puede tener F sin violar cobertura mínima.
    // Debe generar alertas pero sin crash.
    const pids = ['solo-enf'];
    const { turnos, alertas } = distribuirFrancosGrupo(pids, 'M', 31, 11, fds, [8, 25]);
    // La persona existe en el mapa
    expect(turnos['solo-enf']).toBeDefined();
    // Con 1 persona habrá alertas de cobertura
    expect(alertas.length).toBeGreaterThan(0);
  });
});

// ─── INTEGRACIÓN: Caso de referencia Cardiología Pediátrica / Dic 2026 ───────

describe('Integración — Cardiología Pediátrica / 8 camas / 3er Nivel / Diciembre 2026', () => {
  let planilla: ReturnType<typeof generarPlanilla>;

  it('genera la planilla sin lanzar excepciones', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    expect(() => {
      planilla = generarPlanilla(input);
    }).not.toThrow();
  });

  it('CHECK-01: la planilla tiene exactamente Z_ceil = 7 filas', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    const ids = new Set(planilla.celdas.map(c => c.personal_id));
    expect(ids.size).toBe(7);
  });

  it('CHECK-02: el DENOMINADOR del mes es 11 (9 base + 2 feriados)', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    expect(planilla.francos_totales).toBe(11);
  });

  it('CHECK-03: ninguna persona supera 5 días laborales consecutivos (REQ-005)', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    const errores = validarInvariantesPlanilla(planilla);
    const violaciones = errores.filter(e => e.includes('[CHECK-03'));
    expect(violaciones).toHaveLength(0);
  });

  it('CHECK-04: ningún enfermero de noche supera 3 noches consecutivas (REQ-004)', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    const errores = validarInvariantesPlanilla(planilla);
    const violaciones = errores.filter(e => e.includes('[CHECK-04'));
    expect(violaciones).toHaveLength(0);
  });

  it('CHECK-05: hay cobertura mínima (≥1 M, ≥1 T, ≥1 N) en cada uno de los 31 días', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    const errores = validarInvariantesPlanilla(planilla);
    const violaciones = errores.filter(e => e.includes('[CHECK-05'));
    expect(violaciones).toHaveLength(0);
  });

  it('CHECK-06: cada persona tiene al menos un fin de semana libre', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    const errores = validarInvariantesPlanilla(planilla);
    const violaciones = errores.filter(e => e.includes('[CHECK-06'));
    expect(violaciones).toHaveLength(0);
  });

  it('CHECK-07/08/09: no hay rotaciones inválidas (T→M, N→T, N→M)', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    const errores = validarInvariantesPlanilla(planilla);
    const violaciones = errores.filter(e =>
      e.includes('[CHECK-07') || e.includes('[CHECK-08') || e.includes('[CHECK-09')
    );
    expect(violaciones).toHaveLength(0);
  });

  it('CHECK-10: compensatorios calculados según REQ-003 (N_anterior + M_feriado + T_feriado)', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    const errores = validarInvariantesPlanilla(planilla);
    const violaciones = errores.filter(e => e.includes('[CHECK-10'));
    expect(violaciones).toHaveLength(0);
  });

  it('INTEGRACIÓN COMPLETA: pasa los 10 checks — planilla lista para producción', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    const errores = validarInvariantesPlanilla(planilla);
    // Solo se permiten CHECK-06 como advertencia si dotación es muy justa
    // Los críticos deben ser 0
    const criticos = errores.filter(e =>
      e.includes('[CHECK-01]') ||
      e.includes('[CHECK-02]') ||
      e.includes('[CHECK-03]') ||
      e.includes('[CHECK-04]') ||
      e.includes('[CHECK-05]') ||
      e.includes('[CHECK-07]') ||
      e.includes('[CHECK-08]') ||
      e.includes('[CHECK-09]') ||
      e.includes('[CHECK-10]')
    );
    expect(criticos).toHaveLength(0);
  });
});

// ─── ROBUSTEZ: Distintas combinaciones de parámetros ─────────────────────────

describe('Robustez — distintas combinaciones de parámetros', () => {
  const casos: Array<{ label: string; diasMes: number; feriados: number[]; z: number; q1: number; q2: number; q3: number; mes: number }> = [
    { label: 'Febrero 28 días, 0 feriados, Z=4',    diasMes: 28, feriados: [],      z: 4,  q1: 2, q2: 1, q3: 1, mes: 2  },
    { label: 'Abril 30 días, 1 feriado, Z=6',       diasMes: 30, feriados: [2],     z: 6,  q1: 3, q2: 2, q3: 1, mes: 4  },
    { label: 'Julio 31 días, 1 feriado, Z=10',      diasMes: 31, feriados: [9],     z: 10, q1: 4, q2: 3, q3: 3, mes: 7  },
    { label: 'Octubre 31 días, 3 feriados, Z=15',   diasMes: 31, feriados: [12,17,20], z: 15, q1: 6, q2: 5, q3: 4, mes: 10 },
    { label: 'Diciembre 31 días, 5 feriados, Z=20', diasMes: 31, feriados: [8,17,20,24,25], z: 20, q1: 8, q2: 6, q3: 6, mes: 12 },
  ];

  for (const caso of casos) {
    it(`${caso.label}`, () => {
      const personal = Array.from({ length: caso.z }, (_, i) => ({
        id: `e-${i + 1}`,
        nombre: 'E',
        apellido: `${i + 1}`,
        nivel_formacion: 'LICENCIADO' as const,
        antiguedad_anos: caso.z - i,
        compensatorio_pendiente: 0,
      }));
      const input: PlanillaInput = {
        servicio_id: 'test',
        año: 2026,
        mes: caso.mes,
        dias_mes: caso.diasMes,
        feriados: caso.feriados,
        Z: caso.z,
        Z_ceil: caso.z,
        Q1: caso.q1,
        Q2: caso.q2,
        Q3: caso.q3,
        personal,
      };

      // No debe lanzar excepción
      expect(() => generarPlanilla(input)).not.toThrow();

      const p = generarPlanilla(input);
      const errores = validarInvariantesPlanilla(p);
      const criticos = errores.filter(e =>
        e.includes('[CHECK-03]') ||
        e.includes('[CHECK-04]') ||
        e.includes('[CHECK-05]') ||
        e.includes('[CHECK-07]') ||
        e.includes('[CHECK-08]') ||
        e.includes('[CHECK-09]') ||
        e.includes('[CHECK-10]')
      );
      expect(criticos).toHaveLength(0);
    });
  }
});
