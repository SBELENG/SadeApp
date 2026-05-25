// Lógica de cálculo de francos base mensuales y feriados (REQ-001 y REQ-002)

/**
 * Calcula el número total de francos requeridos en el mes para un enfermero.
 * 
 * REQ-001: Si el mes tiene 28, 29 o 30 días -> Base de 8 francos.
 *          Si el mes tiene 31 días -> Base de 9 francos.
 * 
 * REQ-002: Por cada feriado nacional en el mes, se adiciona un franco al total.
 *          También se suman los francos compensatorios pendientes trasladados de meses anteriores.
 * 
 * @param diasMes Cantidad de días del mes (28 a 31)
 * @param feriadosCount Cantidad de días feriados nacionales en el mes
 * @param compensatoriosTrasladados Francos compensatorios pendientes acumulados
 */
export const calcFrancosBase = (
  diasMes: number, 
  feriadosCount: number, 
  compensatoriosTrasladados: number = 0
): number => {
  if (diasMes < 28 || diasMes > 31) {
    throw new Error("Cantidad de días del mes inválida. Debe estar entre 28 y 31.");
  }
  
  // REQ-001
  const base = diasMes === 31 ? 9 : 8;
  
  // REQ-002
  return base + feriadosCount + compensatoriosTrasladados;
};

/**
 * Calcula los francos restantes por asignar a un enfermero.
 * 
 * @param totalFrancosRequeridos Meta de francos calculados para el mes
 * @param francosAsignados Cantidad de días asignados como 'F' en la planilla
 */
export const calcFrancosRestantes = (
  totalFrancosRequeridos: number, 
  francosAsignados: number
): number => {
  return totalFrancosRequeridos - francosAsignados;
};
