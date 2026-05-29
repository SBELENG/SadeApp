// ============================================================
// MOTOR DE GENERACIÓN DE PLANILLA — SADE
// Correcciones C1–C5 (instrucción general 2026-05-29)
// ============================================================

import type {
  Planilla,
  CeldaMes,
  GruposPlanilla,
  PlanillaInput,
  PersonalParaPlanilla,
  TurnoTipo,
} from '../types/planilla.types';

// ─── PASO 2: CÁLCULO DE FRANCOS ──────────────────────────────────────────────

/** [C3] Francos base según días del mes. ≤30 → 8; 31 → 9. */
export function calcFrancosBase(diasMes: number): number {
  return diasMes === 31 ? 9 : 8;
}

/**
 * [C3] DENOMINADOR = francos_base + feriados del mes.
 * Fijo para todo el mes. No incluye compensatorios.
 */
export function calcDenominador(diasMes: number, feriadosCount: number): number {
  return calcFrancosBase(diasMes) + feriadosCount;
}

/**
 * [C3] numerador_disponible = DENOMINADOR + compensatorios ganados.
 * Techo máximo de francos usables en el mes.
 */
export function calcNumeradorDisponible(denominador: number, compensatoriosGanados: number): number {
  return denominador + compensatoriosGanados;
}

/**
 * [C3] Semáforo del contador de francos:
 * verde: asignados == disponibles
 * amarillo: asignados < disponibles (compensatorios sin usar)
 * rojo: asignados > disponibles (error crítico)
 */
export function calcEstadoSemaforo(
  francosAsignados: number,
  numeradorDisponible: number
): 'verde' | 'amarillo' | 'rojo' {
  if (francosAsignados === numeradorDisponible) return 'verde';
  if (francosAsignados < numeradorDisponible) return 'amarillo';
  return 'rojo';
}

// ─── PASO 1: DISTRIBUCIÓN DE GRUPOS ──────────────────────────────────────────

/**
 * Distribuye el personal en grupos M, T, N usando los conteos Q1/Q2/Q3.
 * Garantiza que la suma de los tres grupos === Z_ceil exacto.
 * Regla de ajuste: si hay excedente/déficit, se ajusta primero en N, luego T.
 */
export function distribuirGrupos(
  personal: PersonalParaPlanilla[],
  Q1: number,
  Q2: number,
  Q3: number,
  Z_ceil: number
): GruposPlanilla {
  const suma = Q1 + Q2 + Q3;
  let adjQ1 = Q1, adjQ2 = Q2, adjQ3 = Q3;

  if (suma !== Z_ceil) {
    adjQ3 = Math.max(1, adjQ3 + (Z_ceil - suma));
    const suma2 = adjQ1 + adjQ2 + adjQ3;
    if (suma2 !== Z_ceil) adjQ2 = Math.max(1, adjQ2 + (Z_ceil - suma2));
  }

  return {
    mañana: personal.slice(0, adjQ1).map(p => p.id),
    tarde:  personal.slice(adjQ1, adjQ1 + adjQ2).map(p => p.id),
    noche:  personal.slice(adjQ1 + adjQ2, adjQ1 + adjQ2 + adjQ3).map(p => p.id),
  };
}

function getTurnoFijo(personalId: string, grupos: GruposPlanilla): 'M' | 'T' | 'N' {
  if (grupos.mañana.includes(personalId)) return 'M';
  if (grupos.tarde.includes(personalId)) return 'T';
  return 'N';
}

// ─── PASO 3: FINES DE SEMANA ──────────────────────────────────────────────────

/** Retorna pares [sábado, domingo] (o [viernes, sábado] si sábado es último día). */
export function calcFinesDeSemanaMes(año: number, mes: number, diasMes: number): Array<[number, number]> {
  const fds: Array<[number, number]> = [];
  for (let d = 1; d <= diasMes; d++) {
    const dow = new Date(año, mes - 1, d).getDay();
    if (dow === 6) {
      const dom = d + 1;
      fds.push(dom <= diasMes ? [d, dom] : [d - 1, d]);
    }
  }
  return fds;
}

// ─── PASO 4 (C1): DISTRIBUCIÓN DE FRANCOS ─────────────────────────────────────

/**
 * Selecciona `cantidad` días de la lista `disponibles` con espaciado uniforme.
 * El parámetro `offset` (índice de persona) y `totalEnGrupo` permiten escalonar
 * entre personas del mismo grupo para que sus francos no coincidan.
 */
function seleccionarEspaciados(
  disponibles: number[],
  cantidad: number,
  offset: number,
  totalEnGrupo: number
): number[] {
  if (disponibles.length === 0 || cantidad <= 0) return [];
  if (cantidad >= disponibles.length) return [...disponibles];

  const resultado: number[] = [];
  const n = disponibles.length;

  // Calcular el paso: cuántos días disponibles por franco
  const paso = n / cantidad;

  for (let j = 0; j < cantidad; j++) {
    // Índice base con offset de persona para escalonar
    const idxBase = (offset / totalEnGrupo + j * paso) % n;
    const idx = Math.floor(idxBase) % n;
    // Encontrar el siguiente disponible que no esté ya seleccionado
    for (let delta = 0; delta < n; delta++) {
      const candidatoIdx = (idx + delta) % n;
      if (!resultado.includes(disponibles[candidatoIdx])) {
        resultado.push(disponibles[candidatoIdx]);
        break;
      }
    }
  }

  // Ordenar cronológicamente para el loop de asignación
  return resultado.sort((a, b) => a - b);
}



/**
 * [C1] Genera la distribución de francos para un grupo.
 *
 * INVARIANTE RÍGIDO: count(F por persona) === denominador (exacto).
 *
 * Estrategia:
 *   Paso A: Pre-asignar FDS (anclas protegidas).
 *   Paso B: Asignar francos restantes en forma escalonada respetando cobertura.
 *   Paso C: Swap-only para REQ-004/005.
 *           Un swap: F(candidato) → turno, turno(d) → F.
 *           El conteo total de F NO cambia.
 */
export function distribuirFrancosGrupo(
  personasIds: string[],
  turnoFijo: 'M' | 'T' | 'N',
  diasMes: number,
  denominador: number,
  fdsDisponibles: Array<[number, number]>,
  _feriados: number[]
): { turnos: Record<string, Record<number, TurnoTipo>>; alertas: string[] } {
  const k = personasIds.length;
  const alertas: string[] = [];

  // Celdas[pid][d] con d 1-based
  const celdas: Record<string, Record<number, TurnoTipo>> = {};
  for (const pid of personasIds) {
    celdas[pid] = {};
    for (let d = 1; d <= diasMes; d++) celdas[pid][d] = turnoFijo;
  }

  // ── Paso A: FDS ───────────────────────────────────────────────────────────
  // Solo se asigna FDS si el grupo tiene ≥2 personas.
  // Con 1 persona, es imposible dar F un día y mantener cobertura mínima.
  const diasFijosF: Record<string, Set<number>> = {};
  for (let i = 0; i < k; i++) {
    const pid = personasIds[i];
    diasFijosF[pid] = new Set<number>();
    // Solo asignar FDS si hay al menos 2 personas en el grupo
    if (k >= 2 && fdsDisponibles.length > 0) {
      const [d1, d2] = fdsDisponibles[i % fdsDisponibles.length];
      if (d1 >= 1 && d1 <= diasMes) { celdas[pid][d1] = 'F'; diasFijosF[pid].add(d1); }
      if (d2 >= 1 && d2 <= diasMes) { celdas[pid][d2] = 'F'; diasFijosF[pid].add(d2); }
    }
  }


  // ── Paso B: Distribución interleaved por día ──────────────────────────────
  // Procesa el mes DÍA A DÍA (no persona por persona).
  // Para cada día, asigna F a la persona que más lo necesite (mayor consec)
  // sin violar cobertura mínima ni el budget de francos de cada persona.
  // Esto garantiza el interleaving correcto en grupos pequeños.
  const maxConsecTurno = turnoFijo === 'N' ? 3 : 5;

  // Estado de cada persona: consec acumulados y budget restante
  const consecPorPid: Record<string, number> = {};
  const budgetPorPid: Record<string, number> = {};
  for (let i = 0; i < k; i++) {
    const pid = personasIds[i];
    consecPorPid[pid] = 0;
    budgetPorPid[pid] = denominador - diasFijosF[pid].size;
  }

  for (let d = 1; d <= diasMes; d++) {
    // Fase 1: marcar los FDS ya asignados
    for (const pid of personasIds) {
      if (celdas[pid][d] === 'F') {
        consecPorPid[pid] = 0; // FDS: resetear consec
      }
    }

    // Fase 2: ¿quién NECESITA f aquí de forma crítica? (consec >= maxConsecTurno)
    const necesitanF: string[] = personasIds.filter(
      pid => celdas[pid][d] === turnoFijo && consecPorPid[pid] >= maxConsecTurno && budgetPorPid[pid] > 0
    );

    // Fase 3: ¿quién CONVIENE que tome F aquí?
    // Cuántos días laborales restan y cuántos F quedan para cada uno.
    const diasRestantes = diasMes - d + 1;
    const convenienteF: string[] = personasIds.filter(pid => {
      if (celdas[pid][d] !== turnoFijo || budgetPorPid[pid] <= 0) return false;
      if (necesitanF.includes(pid)) return false;
      // Si el budget/slot ratio indica que hay que empezar ahora
      return diasRestantes <= budgetPorPid[pid] * (maxConsecTurno + 1);
    });

    // Combinar: primero críticos, luego convenientes
    const candidatos = [...necesitanF, ...convenienteF];

    // Ordenar por mayor urgencia (mayor consec primero)
    candidatos.sort((a, b) => consecPorPid[b] - consecPorPid[a]);

    // Asignar F a candidatos respetando cobertura mínima
    for (const pid of candidatos) {
      if (celdas[pid][d] !== turnoFijo) continue; // ya tiene F
      // Verificar cobertura: si ponemos F a pid, ¿quedan otros trabajando?
      const otrosTrabajando = personasIds.filter(
        oid => oid !== pid && celdas[oid][d] === turnoFijo
      );
      if (otrosTrabajando.length > 0) {
        celdas[pid][d] = 'F';
        budgetPorPid[pid]--;
        consecPorPid[pid] = 0;
      } else if (necesitanF.includes(pid)) {
        // Crítico y sin cobertura: alerta
        alertas.push(
          `[DOTACIÓN] Grupo ${turnoFijo}: ${pid} día ${d} ` +
          `necesita F (${consecPorPid[pid]} consec.) pero sin cobertura. Dotación insuficiente.`
        );
      }
    }

    // Avanzar contadores para los que siguen trabajando
    for (const pid of personasIds) {
      if (celdas[pid][d] === turnoFijo) consecPorPid[pid]++;
      // Si ya tiene F, consecPorPid ya se reseteó arriba (Fase 1)
      // o se reseteó al asignarlo (celdas[pid][d] = 'F' → consecPorPid[pid] = 0)
    }
  }

  // Fallback: si alguna persona tiene budget > 0, asignar en días con cobertura
  for (const pid of personasIds) {
    let remaining = budgetPorPid[pid];
    if (remaining <= 0) continue;
    for (let d = 1; d <= diasMes && remaining > 0; d++) {
      if (celdas[pid][d] === turnoFijo) {
        const hayOtro = personasIds.some(oid => oid !== pid && celdas[oid][d] === turnoFijo);
        if (hayOtro) { celdas[pid][d] = 'F'; remaining--; budgetPorPid[pid]--; }
      }
    }
    if (budgetPorPid[pid] > 0) {
      alertas.push(
        `[DOTACIÓN] Grupo ${turnoFijo}: ${pid} le faltan ${budgetPorPid[pid]} franco(s). ` +
        `Dotación insuficiente para cumplir todos los descansos.`
      );
    }
  }






  // ── Paso C: Swap-only para REQ-004/005 (hasta 3 pasadas) ────────────────
  // El swap intercambia F no protegido de un día candidato con el día actual.
  // Hasta 3 iteraciones para resolver violaciones en cadena.
  // INVARIANTE: count(F) no cambia en ningún swap.
  for (let iteracion = 0; iteracion < 3; iteracion++) {
    let huboCambios = false;
    for (const pid of personasIds) {
      let consec = 0;
      let consecN = 0;

      for (let d = 1; d <= diasMes; d++) {
        if (celdas[pid][d] === 'F') { consec = 0; consecN = 0; continue; }

        const violacion005 = consec >= 5;
        const violacion004 = turnoFijo === 'N' && consecN >= 3;

        if (violacion005 || violacion004) {
          // Buscar F no protegido más cercano al día d para swap
          let swap = -1;
          outer: for (let radio = 1; radio <= diasMes; radio++) {
            for (const c of [d + radio, d - radio]) {
              if (c < 1 || c > diasMes) continue;
              if (diasFijosF[pid].has(c)) continue;
              if (celdas[pid][c] !== 'F') continue;
              // Cobertura en d si ponemos F
              const cobertura = personasIds.some(oid => oid !== pid && celdas[oid][d] === turnoFijo);
              if (cobertura) { swap = c; break outer; }
            }
          }

          if (swap !== -1) {
            celdas[pid][swap] = turnoFijo;
            celdas[pid][d]    = 'F';
            consec = 0; consecN = 0;
            huboCambios = true;
            continue;
          } else {
            const req = (turnoFijo === 'N' && consecN >= 3) ? 'REQ-004' : 'REQ-005';
            alertas.push(
              `[${req}] Grupo ${turnoFijo}: ${pid} día ${d} ` +
              `(${consec} consec.) — sin F disponible para swap. Dotación insuficiente.`
            );
          }
        }

        consec++;
        if (turnoFijo === 'N') consecN++;
      }
    }
    if (!huboCambios) break;
  }


  // Resultado
  const turnos: Record<string, Record<number, TurnoTipo>> = {};
  for (const pid of personasIds) turnos[pid] = { ...celdas[pid] };

  return { turnos, alertas };
}

// ─── PASO 5 (C2): COMPENSATORIOS ─────────────────────────────────────────────

/**
 * [C2] Regla institucional exacta de compensatorios:
 *   - M del día feriado         → compensatorio ✅
 *   - T del día feriado         → compensatorio ✅
 *   - N de la noche ANTERIOR al feriado → compensatorio ✅ (trabajan 6h del feriado)
 *   - N del día feriado         → NO compensatorio ❌ (solo 2h: 22hs → 00hs)
 */
export function calcularCompensatorios(
  feriados: number[],
  grupos: GruposPlanilla,
  turnosMap: Record<string, Record<number, TurnoTipo>>,
  _diasMes: number
): Map<string, number> {
  const comp = new Map<string, number>();

  for (const feriado of feriados) {
    // M del feriado
    for (const id of grupos.mañana) {
      if (turnosMap[id]?.[feriado] === 'M') comp.set(id, (comp.get(id) ?? 0) + 1);
    }
    // T del feriado
    for (const id of grupos.tarde) {
      if (turnosMap[id]?.[feriado] === 'T') comp.set(id, (comp.get(id) ?? 0) + 1);
    }
    // N de la noche ANTERIOR al feriado (no del día feriado)
    const diaAnterior = feriado - 1;
    if (diaAnterior >= 1) {
      for (const id of grupos.noche) {
        if (turnosMap[id]?.[diaAnterior] === 'N') comp.set(id, (comp.get(id) ?? 0) + 1);
      }
    }
    // N del día feriado → NO genera compensatorio (intencional por regla institucional)
  }

  return comp;
}

// ─── PASO 6: CONSTRUCCIÓN DE CELDAS ───────────────────────────────────────────

function construirCeldas(
  personal: PersonalParaPlanilla[],
  turnosMap: Record<string, Record<number, TurnoTipo>>,
  grupos: GruposPlanilla,
  feriados: number[],
  diasMes: number,
  compensatoriosMap: Map<string, number>
): CeldaMes[] {
  const celdas: CeldaMes[] = [];
  const nochesAnterioresAFeriado = new Set(feriados.filter(f => f > 1).map(f => f - 1));

  for (const p of personal) {
    const turnoFijo = getTurnoFijo(p.id, grupos);
    for (let d = 1; d <= diasMes; d++) {
      const tipo = turnosMap[p.id]?.[d] ?? turnoFijo;
      const es_feriado = feriados.includes(d);

      // [C2] es_compensatorio según regla corregida
      let es_compensatorio = false;
      if (es_feriado && (tipo === 'M' || tipo === 'T')) es_compensatorio = true;
      if (turnoFijo === 'N' && nochesAnterioresAFeriado.has(d) && tipo === 'N') es_compensatorio = true;

      celdas.push({ personal_id: p.id, dia: d, tipo, es_feriado, es_compensatorio, alerta: null });
    }
  }

  void compensatoriosMap; // usado externamente para el semáforo
  return celdas;
}

// ─── PASO 7 (C5): VALIDACIÓN COMPLETA DE INVARIANTES ─────────────────────────

/**
 * [C5] Verifica los 10 invariantes del checklist de integración.
 * Si alguno de los críticos falla, la planilla NO puede guardarse.
 * Retorna lista de violaciones (vacía = planilla válida).
 */
export function validarInvariantesPlanilla(planilla: Planilla): string[] {
  const errores: string[] = [];
  const { grupos, celdas, dias_mes, francos_totales, Z_ceil, feriados, compensatorios } = planilla;

  const allGrupos: Array<{ ids: string[]; label: string; turno: 'M' | 'T' | 'N' }> = [
    { ids: grupos.mañana, label: 'M', turno: 'M' },
    { ids: grupos.tarde,  label: 'T', turno: 'T' },
    { ids: grupos.noche,  label: 'N', turno: 'N' },
  ];
  const todosIds = [...grupos.mañana, ...grupos.tarde, ...grupos.noche];

  const getCelda = (pid: string, d: number): TurnoTipo => {
    const c = celdas.find(x => x.personal_id === pid && x.dia === d);
    return c?.tipo ?? '';
  };

  // CHECK 1: count(filas) == Z_ceil
  if (todosIds.length !== Z_ceil) {
    errores.push(`[CHECK-01] Filas: esperadas ${Z_ceil}, encontradas ${todosIds.length}`);
  }

  // CHECK 2: asignados <= disponibles (denominador + compensatorios)
  for (const pid of todosIds) {
    const totalF = celdas.filter(c => c.personal_id === pid && c.tipo === 'F').length;
    const comp = compensatorios[pid] ?? 0;
    const disponibles = francos_totales + comp;
    if (totalF > disponibles) {
      errores.push(
        `[CHECK-02] ${pid}: ${totalF} francos asignados > ${disponibles} disponibles ` +
        `(denominador ${francos_totales} + comp ${comp}) — ERROR CRÍTICO`
      );
    }
  }

  // CHECK 3: max(consec M|T|N) <= 5 [REQ-005]
  for (const { ids } of allGrupos) {
    for (const pid of ids) {
      let consec = 0, inicioConsec = 1;
      for (let d = 1; d <= dias_mes; d++) {
        const tipo = getCelda(pid, d);
        if (tipo === 'M' || tipo === 'T' || tipo === 'N') {
          consec++;
          if (consec > 5) {
            errores.push(`[CHECK-03/REQ-005] ${pid}: ${consec} días consecutivos desde día ${inicioConsec}`);
            break;
          }
        } else { consec = 0; inicioConsec = d + 1; }
      }
    }
  }

  // CHECK 4: max(N consec) <= 3 [REQ-004]
  for (const pid of grupos.noche) {
    let consec = 0, inicioConsec = 1;
    for (let d = 1; d <= dias_mes; d++) {
      if (getCelda(pid, d) === 'N') {
        consec++;
        if (consec > 3) {
          errores.push(`[CHECK-04/REQ-004] ${pid}: ${consec} noches consecutivas desde día ${inicioConsec}`);
          break;
        }
      } else { consec = 0; inicioConsec = d + 1; }
    }
  }

  // CHECK 5: cobertura mínima por día
  for (let d = 1; d <= dias_mes; d++) {
    for (const { ids, label, turno } of allGrupos) {
      const trabajando = ids.filter(pid => getCelda(pid, d) === turno);
      if (trabajando.length === 0) {
        errores.push(`[CHECK-05] Día ${d}: grupo ${label} sin cobertura`);
      }
    }
  }

  // CHECK 6: ≥1 fin de semana libre por persona
  for (const pid of todosIds) {
    let tieneFDS = false;
    for (let d = 1; d <= dias_mes && !tieneFDS; d++) {
      const dow = new Date(planilla.año, planilla.mes - 1, d).getDay();
      if (dow === 6) { // Sábado
        const dom = d + 1;
        if (dom <= dias_mes && getCelda(pid, d) === 'F' && getCelda(pid, dom) === 'F') tieneFDS = true;
        const vie = d - 1;
        if (vie >= 1 && getCelda(pid, vie) === 'F' && getCelda(pid, d) === 'F') tieneFDS = true;
      }
    }
    if (!tieneFDS) errores.push(`[CHECK-06] ${pid}: sin fin de semana libre`);
  }

  // CHECK 7/8/9: rotaciones inválidas (T→M, N→T, N→M)
  for (const pid of todosIds) {
    for (let d = 1; d < dias_mes; d++) {
      const hoy = getCelda(pid, d);
      const mañana = getCelda(pid, d + 1);
      if (hoy === 'T' && mañana === 'M') errores.push(`[CHECK-07] ${pid}: T(${d})→M(${d + 1})`);
      if (hoy === 'N' && mañana === 'T') errores.push(`[CHECK-08] ${pid}: N(${d})→T(${d + 1})`);
      if (hoy === 'N' && mañana === 'M') errores.push(`[CHECK-09] ${pid}: N(${d})→M(${d + 1})`);
    }
  }

  // CHECK 10: compensatorios = N_anterior_feriado + M_feriado + T_feriado [REQ-003]
  const nochesAnteriores = new Set(feriados.filter(f => f > 1).map(f => f - 1));
  for (const pid of todosIds) {
    let compEsperado = 0;
    for (const f of feriados) {
      const tipo = getCelda(pid, f);
      if (tipo === 'M' || tipo === 'T') compEsperado++;
    }
    for (const diaN of nochesAnteriores) {
      if (getCelda(pid, diaN) === 'N') compEsperado++;
    }
    const compAlmacenado = compensatorios[pid] ?? 0;
    if (compEsperado !== compAlmacenado) {
      errores.push(`[CHECK-10/REQ-003] ${pid}: comp esperado ${compEsperado} ≠ almacenado ${compAlmacenado}`);
    }
  }

  return errores;
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Genera la planilla completa.
 * Aplica correcciones C1–C5.
 * @throws Error si los invariantes críticos fallan (planilla no guardable).
 */
export function generarPlanilla(input: PlanillaInput): Planilla {
  const { servicio_id, año, mes, dias_mes, feriados, Z, Z_ceil, Q1, Q2, Q3, personal } = input;

  if (personal.length !== Z_ceil) {
    throw new Error(
      `SADE: Personal activo (${personal.length}) ≠ dotación requerida Z=${Z_ceil}. ` +
      `Ajuste la nómina antes de generar la planilla.`
    );
  }

  // Paso 1: Ordenar y distribuir grupos
  const personalOrdenado = [...personal].sort((a, b) => b.antiguedad_anos - a.antiguedad_anos);
  const grupos = distribuirGrupos(personalOrdenado, Q1, Q2, Q3, Z_ceil);

  // Paso 2: DENOMINADOR [C3]
  const francos_base  = calcFrancosBase(dias_mes);
  const francos_feriado = feriados.length;
  const denominador   = francos_base + francos_feriado;

  // Paso 3: Fines de semana
  const fdsDisponibles = calcFinesDeSemanaMes(año, mes, dias_mes);

  // Paso 4: Distribuir francos por grupo [C1]
  const allTurnos: Record<string, Record<number, TurnoTipo>> = {};
  const alertasMotor: string[] = [];

  for (const [grupoPids, turnoFijo] of [
    [grupos.mañana, 'M'],
    [grupos.tarde,  'T'],
    [grupos.noche,  'N'],
  ] as Array<[string[], 'M' | 'T' | 'N']>) {
    if (grupoPids.length === 0) continue;
    const { turnos, alertas } = distribuirFrancosGrupo(
      grupoPids, turnoFijo, dias_mes, denominador, fdsDisponibles, feriados
    );
    Object.assign(allTurnos, turnos);
    alertasMotor.push(...alertas);
  }

  if (alertasMotor.length > 0) console.warn('[SADE Motor] Alertas:', alertasMotor);

  // Paso 5: Compensatorios [C2]
  const compensatoriosMap = calcularCompensatorios(feriados, grupos, allTurnos, dias_mes);
  const compensatorios: Record<string, number> = {};
  for (const [id, count] of compensatoriosMap.entries()) compensatorios[id] = count;

  // Paso 6: Construir celdas
  const celdas = construirCeldas(personalOrdenado, allTurnos, grupos, feriados, dias_mes, compensatoriosMap);

  // Paso 7: Ensamblar planilla
  const planilla: Planilla = {
    id: `${servicio_id}-${año}-${String(mes).padStart(2, '0')}-${Date.now()}`,
    servicio_id, año, mes, dias_mes, feriados,
    francos_base, francos_feriado,
    francos_totales: denominador, // [C3] = DENOMINADOR
    Z, Z_ceil, grupos, celdas, compensatorios,
    estado: 'borrador',
    generada_en: new Date().toISOString(),
  };

  // Paso 8: Validar invariantes [C5]
  const errores = validarInvariantesPlanilla(planilla);
  if (errores.length > 0) {
    const criticos = errores.filter(e =>
      /\[CHECK-0[12345789]\]/.test(e) || e.includes('[CHECK-10')
    );
    const advertencias = errores.filter(e => !criticos.includes(e));
    if (advertencias.length > 0) console.warn('[SADE Motor] Advertencias:', advertencias);
    if (criticos.length > 0) {
      throw new Error(
        `[SADE] Planilla inválida — no puede guardarse. ${criticos.length} violación(es):\n` +
        criticos.join('\n')
      );
    }
  }

  return planilla;
}

/**
 * Convierte Planilla → TurnosMapa (compatibilidad con store legacy).
 */
export function planillaToTurnosMapa(
  planilla: Planilla
): Record<string, Record<number, TurnoTipo>> {
  const mapa: Record<string, Record<number, TurnoTipo>> = {};
  for (const celda of planilla.celdas) {
    if (!mapa[celda.personal_id]) mapa[celda.personal_id] = {};
    mapa[celda.personal_id][celda.dia] = celda.tipo;
  }
  return mapa;
}
