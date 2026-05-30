import { describe, it, expect } from 'vitest';
import {
  calcularOffsetDelMes,
  generarSecuencia
} from './planilla.engine';

describe('Motor SADE - Test de Verificación Obligatorio', () => {
  it('Verifica secuencias exactas para Z=7, mes=12, dias=31', () => {
    // Offset base 0
    const offsetDic0 = calcularOffsetDelMes(0, 12);
    expect(offsetDic0).toBe(14);
    
    const seq0 = generarSecuencia(0, 12, 31);
    const expectedSeq0 = [
      'N','N','N','F','N','N','F','M','M','M','M','M','F','F','T','T','T','T','T','F','F','N','N','N','F','N','N','F','M','M','M'
    ];
    expect(seq0).toEqual(expectedSeq0);

    // Offset base 3
    const offsetDic3 = calcularOffsetDelMes(3, 12);
    expect(offsetDic3).toBe(17);
    
    const seq3 = generarSecuencia(3, 12, 31);
    const expectedSeq3 = [
      'F','N','N','F','M','M','M','M','M','F','F','T','T','T','T','T','F','F','N','N','N','F','N','N','F','M','M','M','M','M','F'
    ];
    expect(seq3).toEqual(expectedSeq3);

    // Offset base 7
    const offsetDic7 = calcularOffsetDelMes(7, 12);
    expect(offsetDic7).toBe(0);
    
    const seq7 = generarSecuencia(7, 12, 31);
    const expectedSeq7 = [
      'M','M','M','M','M','F','F','T','T','T','T','T','F','F','N','N','N','F','N','N','F','M','M','M','M','M','F','F','T','T','T'
    ];
    expect(seq7).toEqual(expectedSeq7);
  });
});
