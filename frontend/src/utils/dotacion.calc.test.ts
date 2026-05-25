import { describe, it, expect } from 'vitest';
import { calcularDotacion } from './dotacion.calc';

describe('Algoritmo de Cálculo — Metodología Balderas Pedrero', () => {
  
  it('debe calcular correctamente la dotación estándar para Clínica Médica', () => {
    // Escenario: Camas = 20, Índice I = 4.2 hs (rango Medicina Interna), J = 8hs, Complejidad = 2do nivel (70/30)
    const input = {
      I: 4.2,
      C: 20,
      J: 8,
      nivel: 'segundo' as const
    };

    const res = calcularDotacion(input);

    // P = (4.2 * 20) / 8 = 10.5
    expect(res.P).toBe(10.50);
    // B = 10.5 * 0.41 = 4.305 -> 4.31 (con toFixed(2))
    expect(res.B).toBe(4.31);
    // Z = 10.5 + 4.305 = 14.805 -> 14.81 (con toFixed(2))
    expect(res.Z).toBe(14.81);
    // Z_ceil = Math.ceil(14.805) = 15
    expect(res.Z_ceil).toBe(15);
    
    // Suma de turnos debe ser exactamente Z_ceil = 15
    const sumQ = res.Q1 + res.Q2 + res.Q3 + res.Qf;
    expect(sumQ).toBe(15);

    // Composición profesional (70% profesionales, 30% auxiliares de Z_ceil = 15)
    // Profesionales = Math.ceil(15 * 0.70) = Math.ceil(10.5) = 11
    // Auxiliares = Math.ceil(15 * 0.30) = Math.ceil(4.5) = 5
    expect(res.profesionales).toBe(11);
    expect(res.auxiliares).toBe(5);
  });

  it('debe aplicar la composición profesional de 80/20 para establecimientos de 3er Nivel', () => {
    const input = {
      I: 4.0,
      C: 15,
      J: 8,
      nivel: 'tercero' as const
    };

    const res = calcularDotacion(input);
    // P = (4.0 * 15) / 8 = 7.5
    // B = 7.5 * 0.41 = 3.075 -> 3.08
    // Z = 7.5 + 3.075 = 10.575 -> 10.58
    // Z_ceil = 11
    expect(res.Z_ceil).toBe(11);

    // Profesionales = Math.ceil(11 * 0.80) = Math.ceil(8.8) = 9
    // Auxiliares = Math.ceil(11 * 0.20) = Math.ceil(2.2) = 3
    expect(res.profesionales).toBe(9);
    expect(res.auxiliares).toBe(3);
  });

  it('debe calcular correctamente la dotación para Terapia Intensiva (UCI) con ratio 1:2', () => {
    // Escenario: Camas = 12, ratio = 1:2 (1 enfermero cada 2 camas), J = 8hs, Complejidad = 3er nivel (80/20)
    const input = {
      C: 12,
      J: 8,
      nivel: 'tercero' as const,
      isCritical: true,
      ratio: '1:2' as const
    };

    const res = calcularDotacion(input);

    // Para 1:2, P = (C / 2) * 3 = (12 / 2) * 3 = 18
    expect(res.P).toBe(18.00);
    // B = 18 * 0.41 = 7.38
    expect(res.B).toBe(7.38);
    // Z = 18 + 7.38 = 25.38
    expect(res.Z).toBe(25.38);
    // Z_ceil = Math.ceil(25.38) = 26
    expect(res.Z_ceil).toBe(26);

    // Suma de turnos debe ser exactamente 26
    const sumQ = res.Q1 + res.Q2 + res.Q3 + res.Qf;
    expect(sumQ).toBe(26);
  });

  it('debe calcular correctamente la dotación para Terapia Intensiva (UCI) con ratio 1:1', () => {
    // Escenario: Camas = 8, ratio = 1:1 (1 enfermero por cama), J = 8hs, Complejidad = 3er nivel
    const input = {
      C: 8,
      J: 8,
      nivel: 'tercero' as const,
      isCritical: true,
      ratio: '1:1' as const
    };

    const res = calcularDotacion(input);

    // Para 1:1, P = C * 3 = 8 * 3 = 24
    expect(res.P).toBe(24.00);
    // B = 24 * 0.41 = 9.84
    expect(res.B).toBe(9.84);
    // Z = 24 + 9.84 = 33.84
    expect(res.Z).toBe(33.84);
    // Z_ceil = Math.ceil(33.84) = 34
    expect(res.Z_ceil).toBe(34);

    // Suma de turnos debe ser exactamente 34
    const sumQ = res.Q1 + res.Q2 + res.Q3 + res.Qf;
    expect(sumQ).toBe(34);
  });

  it('debe arrojar una excepción si no se provee I ni ratio crítico', () => {
    const input = {
      C: 10,
      J: 8,
      nivel: 'segundo' as const
    };

    expect(() => calcularDotacion(input)).toThrow("Debe proporcionar un índice de cuidado (I) o configurar un ratio crítico (UCI).");
  });
});
