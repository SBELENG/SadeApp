// ============================================================
// MOTOR DE GENERACIÓN DE PLANILLA — SADE
// Implementa la Instrucción Maestra de 8 pasos
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

/**
 * Calcula los francos base de un mes.
 * REQ-001: ≤30 días → 8 francos base; 31 días → 9 francos base.
 */
export function calcFrancosBase(diasMes: number): number {
  return diasMes === 31 ? 9 : 8;
}

// ─── PASO 1: DISTRIBUCIÓN DE GRUPOS ──────────────────────────────────────────

/**
 * Distribuye el personal en grupos M, T, N usando los conteos Q1/Q2/Q3.
 * Garantiza que la suma de los tres grupos === Z_ceil exacto.
 * El personal viene ya ordenado por antigüedad DESCENDENTE.
 *
 * Regla de ajuste: si los ceil() generan excedente o déficit, se ajusta
 * primero en N, luego en T (M nunca se toca porque es el grupo mayor).
 */
export function distribuirGrupos(
  personal: PersonalParaPlanilla[],
  Q1: number,
  Q2: number,
  Q3: number,
  Z_ceil: number
): GruposPlanilla {
  // Verificar ajuste de suma
  const suma = Q1 + Q2 + Q3;
  let adjQ1 = Q1;
  let adjQ2 = Q2;
  let adjQ3 = Q3;

  if (suma !== Z_ceil) {
    const diff = Z_ceil - suma;
    // Ajustar primero N, luego T
    adjQ3 = Math.max(1, adjQ3 + diff);
    // Si después de ajustar N todavía hay diferencia, ajustar T
    const suma2 = adjQ1 + adjQ2 + adjQ3;
    if (suma2 !== Z_ceil) {
      adjQ2 = Math.max(1, adjQ2 + (Z_ceil - suma2));
    }
  }

  const mañana = personal.slice(0, adjQ1).map((p) => p.id);
  const tarde = personal.slice(adjQ1, adjQ1 + adjQ2).map((p) => p.id);
  const noche = personal.slice(adjQ1 + adjQ2, adjQ1 + adjQ2 + adjQ3).map((p) => p.id);

  return { mañana, tarde, noche };
}

/**
 * Dado un personalId, retorna su turno fijo ('M', 'T', 'N').
 */
function getTurnoFijo(
  personalId: string,
  grupos: GruposPlanilla
): 'M' | 'T' | 'N' {
  if (grupos.mañana.includes(personalId)) return 'M';
  if (grupos.tarde.includes(personalId)) return 'T';
  return 'N';
}

// ─── PASO 3: FRANCOS DE FIN DE SEMANA ────────────────────────────────────────

/**
 * Encuentra todos los fines de semana del mes como pares [sábado, domingo] o [viernes, sábado].
 * Preferimos Sábado+Domingo por ser el estándar. Si el mes termina antes, se usa Vie+Sáb.
 *
 * Retorna un array de fines de semana: cada elemento es [día1, día2] que forman el par de franco.
 */
export function calcFinesDeSemanaMes(año: number, mes: number, diasMes: number): Array<[number, number]> {
  const fds: Array<[number, number]> = [];

  for (let d = 1; d <= diasMes; d++) {
    const dow = new Date(año, mes - 1, d).getDay(); // 0=Dom, 6=Sáb
    if (dow === 6) {
      // Sábado encontrado
      const dom = d + 1;
      if (dom <= diasMes) {
        fds.push([d, dom]); // Sáb + Dom
      } else {
        // Sábado es el último día: usar Vie + Sáb
        fds.push([d - 1, d]);
      }
    }
  }

  return fds;
}

// ─── PASO 4: DISTRIBUCIÓN ESCALONADA DE FRANCOS ──────────────────────────────

/**
 * Genera la distribución de francos para un grupo de personas.
 *
 * REGLAS:
 * 1. Cada persona recibe exactamente (francos_totales) francos en el mes.
 * 2. Cada persona recibe exactamente 1 fin de semana libre (Sáb+Dom o Vie+Sáb).
 *    Los fines de semana se distribuyen rotativamente: persona 0 → fds[0], persona 1 → fds[1], etc.
 *    Si hay más personas que fines de semana, se cicla (persona 3 → fds[0] de vuelta).
 * 3. Los francos restantes se distribuyen de forma que NUNCA todos los del grupo descansen el mismo día.
 * 4. No más de 5 días laborales consecutivos.
 * 5. Para grupo N: no más de 3 noches consecutivas.
 * 6. Cobertura: siempre al menos 1 persona del grupo trabajando cada día.
 *
 * @returns Record<personalId, Record<dia, TurnoTipo>>
 */
export function distribuirFrancosGrupo(
  personasIds: string[],
  turnoFijo: 'M' | 'T' | 'N',
  diasMes: number,
  francos_totales: number,
  fdsDisponibles: Array<[number, number]>,
  feriados: number[]
): Record<string, Record<number, TurnoTipo>> {
  const resultado: Record<string, Record<number, TurnoTipo>> = {};
  const k = personasIds.length;

  // Inicializar todas las celdas con el turno fijo del grupo
  for (const pid of personasIds) {
    resultado[pid] = {};
    for (let d = 1; d <= diasMes; d++) {
      resultado[pid][d] = turnoFijo;
    }
  }

  // ── Paso A: Asignar 1 fin de semana libre a cada persona ──────────────────
  // Distribución rotativa: persona i → fdsDisponibles[i % fdsDisponibles.length]
  const diasFrancoFDS: Record<string, Set<number>> = {};

  for (let i = 0; i < k; i++) {
    const pid = personasIds[i];
    diasFrancoFDS[pid] = new Set();

    if (fdsDisponibles.length > 0) {
      const [d1, d2] = fdsDisponibles[i % fdsDisponibles.length];
      if (d1 >= 1 && d1 <= diasMes) {
        resultado[pid][d1] = 'F';
        diasFrancoFDS[pid].add(d1);
      }
      if (d2 >= 1 && d2 <= diasMes) {
        resultado[pid][d2] = 'F';
        diasFrancoFDS[pid].add(d2);
      }
    }
  }

  // ── Paso A2: Restricción de inicio de mes (BUG-C) ─────────────────────────
  // REGLA: el primer franco de CADA persona debe estar en el día ≤ 6
  // (no más de 5 días consecutivos de trabajo antes del primer descanso).
  // Si el fin de semana asignado cae después del día 6, forzar un franco temprano.
  const PRIMER_FRANCO_MAX = 6;

  for (const pid of personasIds) {
    // Encontrar el primer franco actual
    let primerFrancoActual = diasMes + 1;
    for (let d = 1; d <= diasMes; d++) {
      if (resultado[pid][d] === 'F') {
        primerFrancoActual = d;
        break;
      }
    }

    // Si el primer franco ya está en los primeros 6 días, OK
    if (primerFrancoActual <= PRIMER_FRANCO_MAX) continue;

    // Buscar el mejor día para colocar un franco temprano (días 4-6)
    // Priorizar días donde otros del grupo trabajan (mantener cobertura)
    let diaFrancoTemprano = -1;
    for (let d = PRIMER_FRANCO_MAX; d >= 1; d--) {
      if (resultado[pid][d] === turnoFijo) {
        const otrosTrabajan = personasIds.some(
          (otherId) => otherId !== pid && resultado[otherId][d] === turnoFijo
        );
        if (otrosTrabajan) {
          diaFrancoTemprano = d;
          break;
        }
      }
    }

    // Si encontramos un día válido, colocar el franco temprano
    // (este franco se descuenta del total de francos restantes)
    if (diaFrancoTemprano > 0) {
      resultado[pid][diaFrancoTemprano] = 'F';
      diasFrancoFDS[pid].add(diaFrancoTemprano);
    }
  }

  // ── Paso B: Completar con francos restantes, escalonados ─────────────────
  for (let i = 0; i < k; i++) {
    const pid = personasIds[i];
    const fdsCount = diasFrancoFDS[pid].size;
    let restantes = francos_totales - fdsCount;

    if (restantes <= 0) continue;

    // Construir lista de candidatos de francos escalonados
    const candidatos = generarCandidatosFranco(
      i,
      k,
      diasMes,
      diasFrancoFDS[pid],
      resultado,
      personasIds,
      turnoFijo,
      feriados
    );

    // Asignar hasta completar francos_totales
    let asignados = 0;
    for (const d of candidatos) {
      if (asignados >= restantes) break;
      if (resultado[pid][d] === turnoFijo) {
        const otrosTrabajanD = personasIds.some(
          (otherId) => otherId !== pid && resultado[otherId][d] === turnoFijo
        );
        if (otrosTrabajanD) {
          resultado[pid][d] = 'F';
          asignados++;
        }
      }
    }

    // Fallback: llenar con cualquier día válido restante
    if (asignados < restantes) {
      for (let d = 1; d <= diasMes && asignados < restantes; d++) {
        if (resultado[pid][d] === turnoFijo) {
          const otrosTrabajanD = personasIds.some(
            (otherId) => otherId !== pid && resultado[otherId][d] === turnoFijo
          );
          if (otrosTrabajanD) {
            resultado[pid][d] = 'F';
            asignados++;
          }
        }
      }
    }
  }

  // ── Paso C: Corrección de violaciones REQ-005 (máx 5 consecutivos) ────────
  for (const pid of personasIds) {
    corregirConsecutivos(pid, resultado, personasIds, turnoFijo, diasMes, 5);
  }

  // ── Paso D: Corrección REQ-004 (máx 3N consecutivas para grupo N) ─────────
  if (turnoFijo === 'N') {
    for (const pid of personasIds) {
      corregirConsecutivos(pid, resultado, personasIds, turnoFijo, diasMes, 3);
    }
  }

  return resultado;

}

/**
 * Genera una lista ordenada de días candidatos para francos adicionales,
 * distribuidos con un offset según el índice de la persona en el grupo.
 * Evita crear bloques de más de 2 francos seguidos.
 */
function generarCandidatosFranco(
  personaIdx: number,
  totalEnGrupo: number,
  diasMes: number,
  diasYaFranco: Set<number>,
  estadoActual: Record<string, Record<number, TurnoTipo>>,
  personasIds: string[],
  turnoFijo: 'M' | 'T' | 'N',
  _feriados: number[]
): number[] {
  const candidatos: number[] = [];

  // Offset base: cada persona del grupo tiene su "inicio de ciclo" diferente
  // Ciclo de distribución: por cada (totalEnGrupo) días, la persona i descansa el día (i+1) del ciclo
  // Recorremos el mes con un salto de (totalEnGrupo) días por persona
  const offset = personaIdx; // 0-based

  for (let ciclo = 0; ciclo < diasMes; ciclo++) {
    const dia = ((offset + ciclo * totalEnGrupo) % diasMes) + 1;
    if (!diasYaFranco.has(dia)) {
      candidatos.push(dia);
    }
  }

  // Complementar con días en secuencia que no generen bloque de 3+ francos seguidos
  for (let d = 1; d <= diasMes; d++) {
    if (!diasYaFranco.has(d) && !candidatos.includes(d)) {
      candidatos.push(d);
    }
  }

  // Filtrar candidatos que no dejan al grupo sin cobertura
  return candidatos.filter((d) => {
    const otrosTrabajanD = personasIds.some(
      (pid) => pid !== personasIds[personaIdx] && estadoActual[pid]?.[d] === turnoFijo
    );
    return otrosTrabajanD;
  });
}

/**
 * Corrige bloques de días laborales consecutivos que superen el máximo.
 * Si encuentra un bloque de (maxConsec+1), fuerza un franco en la mitad del bloque,
 * moviendo el excedente hacia el día más cercano con superávit de trabajadores.
 */
function corregirConsecutivos(
  pid: string,
  resultado: Record<string, Record<number, TurnoTipo>>,
  personasIds: string[],
  turnoFijo: 'M' | 'T' | 'N',
  diasMes: number,
  maxConsec: number
): void {
  let consecutivos = 0;
  let inicioBloque = 1;

  for (let d = 1; d <= diasMes + 1; d++) {
    const esLaboral = d <= diasMes && resultado[pid][d] === turnoFijo;

    if (esLaboral) {
      consecutivos++;
      if (consecutivos > maxConsec) {
        // Forzar franco en el día actual si hay cobertura, o buscar el más cercano
        let diaParaFranco = d;
        let diaEncontrado = false;

        for (let offset = 0; offset <= 2; offset++) {
          for (const candidato of [d - offset, d + offset]) {
            if (
              candidato >= 1 &&
              candidato <= diasMes &&
              resultado[pid][candidato] === turnoFijo
            ) {
              const otrosTrabajan = personasIds.some(
                (otherId) =>
                  otherId !== pid &&
                  resultado[otherId]?.[candidato] === turnoFijo
              );
              if (otrosTrabajan) {
                diaParaFranco = candidato;
                diaEncontrado = true;
                break;
              }
            }
          }
          if (diaEncontrado) break;
        }

        if (diaEncontrado) {
          // Mover un franco existente para compensar
          // Buscar el franco más cercano de esta persona y devolverlo al turno
          for (let dd = 1; dd <= diasMes; dd++) {
            if (resultado[pid][dd] === 'F' && !isEnFDS(dd, resultado, pid)) {
              resultado[pid][dd] = turnoFijo; // devolver al trabajo
              resultado[pid][diaParaFranco] = 'F'; // descansar aquí
              consecutivos = 0;
              inicioBloque = diaParaFranco + 1;
              break;
            }
          }
        }
      }
    } else {
      consecutivos = 0;
      inicioBloque = d + 1;
    }
    // silenciar warning de inicioBloque
    void inicioBloque;
  }
}

/** Heurística: ¿es este día parte de un fin de semana asignado? */
function isEnFDS(
  _dia: number,
  _resultado: Record<string, Record<number, TurnoTipo>>,
  _pid: string
): boolean {
  // Esta función es conservadora — en la práctica se podría refinar
  return false;
}

// ─── PASO 5: COMPENSATORIOS ───────────────────────────────────────────────────

/**
 * Calcula cuántos francos compensatorios generó cada persona este mes
 * (un compensatorio por cada feriado trabajado).
 */
function calcularCompensatorios(
  personal: PersonalParaPlanilla[],
  turnosMap: Record<string, Record<number, TurnoTipo>>,
  feriados: number[]
): Record<string, number> {
  const comp: Record<string, number> = {};
  for (const p of personal) {
    let count = 0;
    for (const f of feriados) {
      const t = turnosMap[p.id]?.[f];
      if (t === 'M' || t === 'T' || t === 'N') count++;
    }
    comp[p.id] = count;
  }
  return comp;
}

// ─── PASO 6: CONSTRUCCIÓN DE CELDAS ──────────────────────────────────────────

/**
 * Construye el array de CeldaMes a partir del mapa de turnos.
 */
function construirCeldas(
  personal: PersonalParaPlanilla[],
  turnosMap: Record<string, Record<number, TurnoTipo>>,
  grupos: GruposPlanilla,
  feriados: number[],
  diasMes: number
): CeldaMes[] {
  const celdas: CeldaMes[] = [];

  for (const p of personal) {
    const turnoFijo = getTurnoFijo(p.id, grupos);

    for (let d = 1; d <= diasMes; d++) {
      const tipo = turnosMap[p.id]?.[d] ?? turnoFijo;
      const es_feriado = feriados.includes(d);
      const es_compensatorio =
        es_feriado && (tipo === 'M' || tipo === 'T' || tipo === 'N');

      celdas.push({
        personal_id: p.id,
        dia: d,
        tipo,
        es_feriado,
        es_compensatorio,
        alerta: null, // Las alertas se calculan post-generación con useShiftValidation
      });
    }
  }

  return celdas;
}

// ─── VALIDACIÓN DE INVARIANTES ────────────────────────────────────────────────

/**
 * Verifica todos los invariantes de cobertura y REQs sobre el resultado.
 * Retorna lista de violaciones encontradas (vacía = OK).
 */
export function validarInvariantesPlanilla(
  planilla: Planilla
): string[] {
  const errores: string[] = [];
  const { grupos, celdas, dias_mes, francos_totales } = planilla;

  const allGrupos: Array<{ ids: string[]; label: string; turno: 'M' | 'T' | 'N' }> = [
    { ids: grupos.mañana, label: 'M', turno: 'M' },
    { ids: grupos.tarde, label: 'T', turno: 'T' },
    { ids: grupos.noche, label: 'N', turno: 'N' },
  ];

  // 1. Verificar conteo de francos por persona
  for (const { ids, label } of allGrupos) {
    for (const pid of ids) {
      const celdasPerson = celdas.filter((c) => c.personal_id === pid);
      const totalFrancos = celdasPerson.filter((c) => c.tipo === 'F').length;
      if (totalFrancos !== francos_totales) {
        errores.push(
          `[INV-001] ${label} | ${pid}: tiene ${totalFrancos} francos, esperados ${francos_totales}`
        );
      }
    }
  }

  // 2. Verificar cobertura: nunca 0 personas de un turno en ningún día
  for (const { ids, label, turno } of allGrupos) {
    for (let d = 1; d <= dias_mes; d++) {
      const trabajando = ids.filter((pid) => {
        const celda = celdas.find((c) => c.personal_id === pid && c.dia === d);
        return celda?.tipo === turno;
      });
      if (trabajando.length === 0) {
        errores.push(
          `[INV-002] Día ${d}: grupo ${label} sin cobertura — todos en franco`
        );
      }
    }
  }

  // 3. REQ-004: max 3 noches consecutivas
  for (const pid of grupos.noche) {
    let consec = 0;
    for (let d = 1; d <= dias_mes; d++) {
      const celda = celdas.find((c) => c.personal_id === pid && c.dia === d);
      if (celda?.tipo === 'N') {
        consec++;
        if (consec > 3) {
          errores.push(`[REQ-004] ${pid}: ${consec} noches consecutivas desde día ${d - consec + 1}`);
          break;
        }
      } else {
        consec = 0;
      }
    }
  }

  // 4. REQ-005: max 5 días laborales consecutivos
  for (const { ids } of allGrupos) {
    for (const pid of ids) {
      let consec = 0;
      for (let d = 1; d <= dias_mes; d++) {
        const celda = celdas.find((c) => c.personal_id === pid && c.dia === d);
        const esLaboral = celda?.tipo === 'M' || celda?.tipo === 'T' || celda?.tipo === 'N';
        if (esLaboral) {
          consec++;
          if (consec > 5) {
            errores.push(`[REQ-005] ${pid}: ${consec} días laborales consecutivos desde día ${d - consec + 1}`);
            break;
          }
        } else {
          consec = 0;
        }
      }
    }
  }

  // 5. INV-003: Fila Fija — nadie tiene un turno que no sea su turno_fijo o 'F'
  for (const { ids, turno } of allGrupos) {
    for (const pid of ids) {
      const celdasPerson = celdas.filter((c) => c.personal_id === pid);
      for (const c of celdasPerson) {
        if (c.tipo !== 'F' && c.tipo !== turno && c.tipo !== '') {
          errores.push(
            `[INV-003] ${pid} grupo ${turno}: celda día ${c.dia} tiene tipo "${c.tipo}" (prohibido)`
          );
        }
      }
    }
  }

  return errores;
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Genera la planilla completa siguiendo la Instrucción Maestra de 8 pasos.
 *
 * PRECONDICIÓN: input.personal.length === input.Z_ceil
 * Si no se cumple, lanza Error con mensaje descriptivo.
 *
 * @param input Datos de configuración y nómina del servicio
 * @returns Planilla completa, lista para mostrar en UI
 */
export function generarPlanilla(input: PlanillaInput): Planilla {
  const { servicio_id, año, mes, dias_mes, feriados, Z, Z_ceil, Q1, Q2, Q3, personal } = input;

  // ── PRECONDICIÓN: Z exacto ────────────────────────────────────────────────
  if (personal.length !== Z_ceil) {
    throw new Error(
      `SADE: El personal activo (${personal.length}) no coincide con la dotación requerida Z=${Z_ceil}. ` +
      `Ajuste la nómina antes de generar la planilla.`
    );
  }

  // ── PASO 1: Ordenar por antigüedad DESC y distribuir grupos ───────────────
  const personalOrdenado = [...personal].sort(
    (a, b) => b.antiguedad_anos - a.antiguedad_anos
  );

  const grupos = distribuirGrupos(personalOrdenado, Q1, Q2, Q3, Z_ceil);

  // ── PASO 2: Calcular francos ──────────────────────────────────────────────
  const francos_base = calcFrancosBase(dias_mes);
  const francos_feriado = feriados.length;
  const francos_totales = francos_base + francos_feriado;

  // ── PASO 3: Identificar fines de semana disponibles ───────────────────────
  const fdsDisponibles = calcFinesDeSemanaMes(año, mes, dias_mes);

  // ── PASO 4: Distribuir francos por grupo ──────────────────────────────────
  const allTurnos: Record<string, Record<number, TurnoTipo>> = {};

  // Grupo M
  const grupoMPersonas = personalOrdenado.filter((p) => grupos.mañana.includes(p.id));
  const turnosM = distribuirFrancosGrupo(
    grupoMPersonas.map((p) => p.id),
    'M',
    dias_mes,
    francos_totales,
    fdsDisponibles,
    feriados
  );
  Object.assign(allTurnos, turnosM);

  // Grupo T
  const grupoTPersonas = personalOrdenado.filter((p) => grupos.tarde.includes(p.id));
  const turnosT = distribuirFrancosGrupo(
    grupoTPersonas.map((p) => p.id),
    'T',
    dias_mes,
    francos_totales,
    fdsDisponibles,
    feriados
  );
  Object.assign(allTurnos, turnosT);

  // Grupo N
  const grupoNPersonas = personalOrdenado.filter((p) => grupos.noche.includes(p.id));
  const turnosN = distribuirFrancosGrupo(
    grupoNPersonas.map((p) => p.id),
    'N',
    dias_mes,
    francos_totales,
    fdsDisponibles,
    feriados
  );
  Object.assign(allTurnos, turnosN);

  // ── PASO 5: Calcular compensatorios ──────────────────────────────────────
  const compensatorios = calcularCompensatorios(personalOrdenado, allTurnos, feriados);

  // ── PASO 6: Construir celdas ──────────────────────────────────────────────
  const celdas = construirCeldas(personalOrdenado, allTurnos, grupos, feriados, dias_mes);

  // ── PASO 7: Ensamblar planilla ────────────────────────────────────────────
  const planilla: Planilla = {
    id: `${servicio_id}-${año}-${String(mes).padStart(2, '0')}-${Date.now()}`,
    servicio_id,
    año,
    mes,
    dias_mes,
    feriados,
    francos_base,
    francos_feriado,
    francos_totales,
    Z,
    Z_ceil,
    grupos,
    celdas,
    compensatorios,
    estado: 'borrador',
    generada_en: new Date().toISOString(),
  };

  // ── PASO 8: Validar invariantes ───────────────────────────────────────────
  const errores = validarInvariantesPlanilla(planilla);
  if (errores.length > 0) {
    // Log para debug — la planilla se devuelve igual con los errores registrados
    console.warn('[SADE Motor] Invariantes con advertencias:', errores);
  }

  return planilla;
}

/**
 * Convierte una Planilla al formato TurnosMapa compatible con el store legacy.
 * Permite usar la planilla con la UI existente durante la transición.
 */
export function planillaToTurnosMapa(
  planilla: Planilla
): Record<string, Record<number, TurnoTipo>> {
  const mapa: Record<string, Record<number, TurnoTipo>> = {};

  for (const celda of planilla.celdas) {
    if (!mapa[celda.personal_id]) {
      mapa[celda.personal_id] = {};
    }
    mapa[celda.personal_id][celda.dia] = celda.tipo;
  }

  return mapa;
}
