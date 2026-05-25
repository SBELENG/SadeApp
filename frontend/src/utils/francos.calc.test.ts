import { describe, it, expect } from 'vitest';
import { calcFrancosBase, calcFrancosRestantes } from './francos.calc';

describe('Cálculo de Francos (REQ-001 y REQ-002)', () => {
  
  describe('calcFrancosBase', () => {
    it('debe asignar una base de 8 francos para meses de 28, 29 y 30 días (REQ-001)', () => {
      // 28 días (Febrero normal)
      expect(calcFrancosBase(28, 0)).toBe(8);
      // 29 días (Febrero bisiesto)
      expect(calcFrancosBase(29, 0)).toBe(8);
      // 30 días (Noviembre, Junio, etc.)
      expect(calcFrancosBase(30, 0)).toBe(8);
    });

    it('debe asignar una base de 9 francos para meses de 31 días (REQ-001)', () => {
      // 31 días (Enero, Julio, etc.)
      expect(calcFrancosBase(31, 0)).toBe(9);
    });

    it('debe adicionar +1 franco por cada feriado nacional en el mes (REQ-002)', () => {
      // Mes de 30 días con 2 feriados
      expect(calcFrancosBase(30, 2)).toBe(10); // 8 + 2
      // Mes de 31 días con 1 feriado
      expect(calcFrancosBase(31, 1)).toBe(10); // 9 + 1
      // Mes de 28 días con 3 feriados
      expect(calcFrancosBase(28, 3)).toBe(11); // 8 + 3
    });

    it('debe adicionar francos compensatorios pendientes trasladados del mes anterior (REQ-003)', () => {
      // Mes de 31 días con 1 feriado y 1 franco compensatorio pendiente trasladado
      expect(calcFrancosBase(31, 1, 1)).toBe(11); // 9 (base) + 1 (feriado) + 1 (trasladado)
    });

    it('debe arrojar un error si la cantidad de días del mes es inválida', () => {
      expect(() => calcFrancosBase(27, 0)).toThrow();
      expect(() => calcFrancosBase(32, 0)).toThrow();
    });
  });

  describe('calcFrancosRestantes', () => {
    it('debe calcular correctamente la cantidad de francos que restan por asignar', () => {
      // Requeridos: 10, Asignados: 4 -> Restan 6
      expect(calcFrancosRestantes(10, 4)).toBe(6);
      
      // Requeridos: 9, Asignados: 9 -> Restan 0 (meta cumplida, se pintará de verde)
      expect(calcFrancosRestantes(9, 9)).toBe(0);
    });
  });
});
