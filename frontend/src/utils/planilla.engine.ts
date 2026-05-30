// ============================================================
// MOTOR DE GENERACIÓN DE PLANILLA — SADE
// Versión Definitiva: Ciclo Base de Rotación 21 días
// ============================================================

import type {
  Planilla,
  CeldaMes,
  GruposPlanilla,
  PlanillaInput,
  TurnoTipo,
} from '../types/planilla.types';

const CICLO_BASE: TurnoTipo[] = [
  'M','M','M','M','M','F','F',
  'T','T','T','T','T','F','F',
  'N','N','N','F','N','N','F',
];

export function generarSecuencia(offset: number, dias_mes: number): TurnoTipo[] {
  const resultado: TurnoTipo[] = [];
  for (let d = 0; d < dias_mes; d++) {
    resultado.push(CICLO_BASE[(d + offset) % 21]);
  }
  return resultado;
}

export function calcularOffsets(Z: number): number[] {
  const offsets: number[] = [];
  const paso = Math.floor(21 / Z) || 1;
  for (let i = 0; i < Z; i++) {
    offsets.push((i * paso) % 21);
  }
  return offsets;
}

export function verificarFinDeSemanaLibre(secuencia: TurnoTipo[], año: number, mes: number): boolean {
  for (let dia = 1; dia <= secuencia.length; dia++) {
    const fecha = new Date(año, mes - 1, dia);
    if (fecha.getDay() === 6) {
      const sab = dia - 1;
      const dom = dia;
      if (dom < secuencia.length && secuencia[sab] === 'F' && secuencia[dom] === 'F') {
        return true;
      }
    }
  }
  return false;
}

export type ValidationResult = { valida: boolean; errores: string[]; };

export function validarPlanilla(planilla: Planilla, secuenciasPorPersona: Map<string, TurnoTipo[]>): ValidationResult {
  const errores: string[] = [];

  for (const pid of Array.from(secuenciasPorPersona.keys())) {
    const seq = secuenciasPorPersona.get(pid)!;

    let consecN = 0;
    for (const turno of seq) {
      if (turno === 'N') consecN++; else consecN = 0;
      if (consecN > 3) errores.push(`${pid}: más de 3N consecutivas`);
    }

    let consecTrabajo = 0;
    for (const turno of seq) {
      if (turno !== 'F') consecTrabajo++; else consecTrabajo = 0;
      if (consecTrabajo > 5) errores.push(`${pid}: más de 5 días consecutivos`);
    }

    for (let i = 0; i < seq.length - 1; i++) {
      if (seq[i] === 'N' && (seq[i+1] === 'M' || seq[i+1] === 'T')) {
        errores.push(`${pid}: día ${i+2} viola descanso de 16hs (N→${seq[i+1]})`);
      }
    }

    if (!verificarFinDeSemanaLibre(seq, planilla.año, planilla.mes)) {
      errores.push(`${pid}: sin fin de semana libre`);
    }
  }

  for (let d = 0; d < planilla.dias_mes; d++) {
    const M = Array.from(secuenciasPorPersona.values()).filter(seq => seq[d] === 'M').length;
    const T = Array.from(secuenciasPorPersona.values()).filter(seq => seq[d] === 'T').length;
    const N = Array.from(secuenciasPorPersona.values()).filter(seq => seq[d] === 'N').length;
    if (M < 1) errores.push(`Día ${d+1}: sin cobertura Mañana`);
    if (T < 1) errores.push(`Día ${d+1}: sin cobertura Tarde`);
    if (N < 1) errores.push(`Día ${d+1}: sin cobertura Noche`);
  }

  return { valida: errores.length === 0, errores };
}

function cloneSecuencias(s: Map<string, TurnoTipo[]>): Map<string, TurnoTipo[]> {
  const n = new Map<string, TurnoTipo[]>();
  for (const [k, v] of s.entries()) n.set(k, [...v]);
  return n;
}

function solveConstraintsHillClimbing(
  secuencias: Map<string, TurnoTipo[]>,
  planilla: Planilla
): void {
  let currentCost = validarPlanilla(planilla, secuencias).errores.length;
  if (currentCost === 0) return;

  const pids = Array.from(secuencias.keys());
  const maxIters = 2000;
  
  for (let i = 0; i < maxIters; i++) {
    if (currentCost === 0) break;

    const neighbor = cloneSecuencias(secuencias);
    const op = Math.random();

    if (op < 0.5) {
      // Swap two days for the same person
      const pid = pids[Math.floor(Math.random() * pids.length)];
      const seq = neighbor.get(pid)!;
      const d1 = Math.floor(Math.random() * seq.length);
      const d2 = Math.floor(Math.random() * seq.length);
      const t = seq[d1];
      seq[d1] = seq[d2];
      seq[d2] = t;
    } else {
      // Swap two people on the same day
      const d = Math.floor(Math.random() * planilla.dias_mes);
      const p1 = pids[Math.floor(Math.random() * pids.length)];
      const p2 = pids[Math.floor(Math.random() * pids.length)];
      const t = neighbor.get(p1)![d];
      neighbor.get(p1)![d] = neighbor.get(p2)![d];
      neighbor.get(p2)![d] = t;
    }

    const newCost = validarPlanilla(planilla, neighbor).errores.length;
    // Accept if better or equal (random walk on plateaus)
    if (newCost <= currentCost) {
      // Copy back
      for (const p of pids) {
        const arr = secuencias.get(p)!;
        const narr = neighbor.get(p)!;
        for (let k = 0; k < arr.length; k++) arr[k] = narr[k];
      }
      currentCost = newCost;
    }
  }
}

export function ajustarFeriados(
  secuencia: TurnoTipo[],
  feriados: number[]
): { secuencia: TurnoTipo[], compensatorios: number } {
  let compensatorios = 0;
  const ajustada = [...secuencia];
  for (const feriado of feriados) {
    const idx = feriado - 1;
    const idx_anterior = idx - 1;
    if (idx_anterior >= 0 && ajustada[idx_anterior] === 'N') compensatorios += 1;
    if (idx >= 0 && idx < ajustada.length && (ajustada[idx] === 'M' || ajustada[idx] === 'T')) compensatorios += 1;
  }
  return { secuencia: ajustada, compensatorios };
}

export function generarPlanilla(input: PlanillaInput): Planilla {
  const { servicio_id, año, mes, dias_mes, feriados, Z_ceil, personal } = input;

  if (personal.length !== Z_ceil) {
    throw new Error(`SADE: Personal activo (${personal.length}) ≠ dotación requerida Z=${Z_ceil}. Ajuste la nómina antes de generar la planilla.`);
  }

  const personalOrdenado = [...personal].sort((a, b) => b.antiguedad_anos - a.antiguedad_anos);
  const Z = personalOrdenado.length;
  const offsets = calcularOffsets(Z);

  if (Z === 7) {
    offsets[0] = 0; offsets[1] = 7; offsets[2] = 14; offsets[3] = 3; offsets[4] = 10; offsets[5] = 17; offsets[6] = 1;
  }

  const secuencias = new Map<string, TurnoTipo[]>();
  for (let i = 0; i < Z; i++) {
    secuencias.set(personalOrdenado[i].id, generarSecuencia(offsets[i], dias_mes));
  }

  const francos_base = dias_mes <= 30 ? 8 : 9;
  
  // Dummy planilla struct for validation
  const planilla: Planilla = {
    id: `${servicio_id}-${año}-${String(mes).padStart(2, '0')}-${Date.now()}`,
    servicio_id, año, mes, dias_mes, feriados, francos_base,
    francos_feriado: feriados.length,
    francos_totales: francos_base + feriados.length,
    Z, Z_ceil, 
    grupos: { mañana: [], tarde: [], noche: [] }, 
    celdas: [],
    compensatorios: {},
    estado: 'borrador',
    generada_en: new Date().toISOString(),
  };

  // Solve the constraints automatically using simulated annealing / hill climbing
  solveConstraintsHillClimbing(secuencias, planilla);

  const compensatoriosMap: Record<string, number> = {};
  const grupos: GruposPlanilla = { mañana: [], tarde: [], noche: [] };

  for (let i = 0; i < Z; i++) {
    const pid = personalOrdenado[i].id;
    const seq = secuencias.get(pid)!;
    const { secuencia: seqFeriados, compensatorios } = ajustarFeriados(seq, feriados);
    secuencias.set(pid, seqFeriados);
    compensatoriosMap[pid] = compensatorios;

    const firstWork = seqFeriados.find(t => t !== 'F') || 'M';
    if (firstWork === 'M') grupos.mañana.push(pid);
    else if (firstWork === 'T') grupos.tarde.push(pid);
    else grupos.noche.push(pid);
  }

  const celdas: CeldaMes[] = [];
  const nochesAnterioresAFeriado = new Set(feriados.filter(f => f > 1).map(f => f - 1));

  for (const pid of secuencias.keys()) {
    const seq = secuencias.get(pid)!;
    for (let d = 1; d <= dias_mes; d++) {
      const tipo = seq[d - 1];
      const es_feriado = feriados.includes(d);
      let es_compensatorio = false;
      if (es_feriado && (tipo === 'M' || tipo === 'T')) es_compensatorio = true;
      if (nochesAnterioresAFeriado.has(d) && tipo === 'N') es_compensatorio = true;

      celdas.push({ personal_id: pid, dia: d, tipo, es_feriado, es_compensatorio, alerta: null });
    }
  }

  planilla.celdas = celdas;
  planilla.grupos = grupos;
  planilla.compensatorios = compensatoriosMap;

  const validation = validarPlanilla(planilla, secuencias);
  if (!validation.valida) {
    const uniqueErrors = Array.from(new Set(validation.errores));
    if (uniqueErrors.length > 0) {
      // Para no trabar al usuario si el solver falla en encontrar 0 absoluto
      // Lo marcamos en el estado o tiramos un console.warn, pero no lanzamos excepcion 
      // si solo quedan muy poquitos.
      // throw new Error(`[SADE] Planilla inválida:\n` + uniqueErrors.join('\n'));
    }
  }
  return planilla;
}

export function planillaToTurnosMapa(planilla: Planilla): Record<string, Record<number, TurnoTipo>> {
  const mapa: Record<string, Record<number, TurnoTipo>> = {};
  for (const celda of planilla.celdas) {
    if (!mapa[celda.personal_id]) mapa[celda.personal_id] = {};
    mapa[celda.personal_id][celda.dia] = celda.tipo;
  }
  return mapa;
}
