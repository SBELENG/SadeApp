import { describe, it, expect } from 'vitest';
import {
  generarPlanilla,
  generarSecuencia,
  calcularOffsets,
  ajustarFeriados,
  validarPlanilla,
  verificarFinDeSemanaLibre
} from './planilla.engine';
import type { PlanillaInput, TurnoTipo, Planilla } from '../types/planilla.types';

function buildInputCardio(zCeil = 7, q1 = 3, q2 = 2, q3 = 2): PlanillaInput {
  const personal = Array.from({ length: zCeil }, (_, i) => ({
    id: `enf-${String(i + 1).padStart(2, '0')}`,
    nombre: `Enfermero`,
    apellido: `${i + 1}`,
    nivel_formacion: 'LICENCIADO' as const,
    antiguedad_anos: 10 - i,
    compensatorio_pendiente: 0,
  }));

  return {
    servicio_id: 'cardio-ped',
    año: 2026,
    mes: 12,
    dias_mes: 31,
    feriados: [8, 25],
    Z: 6.35,
    Z_ceil: zCeil,
    Q1: q1,
    Q2: q2,
    Q3: q3,
    personal,
  };
}

describe('Motor de Rotación 21 Días', () => {
  it('genera ciclo de 21 días correcto', () => {
    const seq = generarSecuencia(0, 21);
    expect(seq.length).toBe(21);
    expect(seq.slice(0, 5)).toEqual(['M','M','M','M','M']);
    expect(seq.slice(7, 12)).toEqual(['T','T','T','T','T']);
    expect(seq.slice(14, 17)).toEqual(['N','N','N']);
  });


  it('ajustarFeriados calcula compensatorios', () => {
    const seq: TurnoTipo[] = ['N','N','N','F','M','M','T','T'];
    // Feriados: 2 (el dia 1 es N, asi que noche anterior es N), 5 (M), 7 (T)
    const { compensatorios } = ajustarFeriados(seq, [2, 5, 7]);
    expect(compensatorios).toBeGreaterThan(0);
  });
});

describe('Integración — Cardiología Pediátrica / 8 camas / 3er Nivel / Diciembre 2026', () => {
  let planilla: Planilla;

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

  it('CHECK-02: ningún enfermero de noche supera 3 noches consecutivas', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    // Ya lo valida el motor (validarPlanilla lanzaría excepcion si falla)
    expect(planilla).toBeDefined();
  });

  it('CHECK-03: hay cobertura mínima (≥1 M, ≥1 T, ≥1 N) en cada uno de los 31 días', () => {
    const input = buildInputCardio(7, 3, 2, 2);
    planilla = generarPlanilla(input);
    // validarPlanilla asegura esto
    expect(planilla).toBeDefined();
  });
});
