// Balderas Pedrero calculations (P, B, Z, Q, S/V)
export interface DotacionInput {
  I?: number;
  C: number;
  J: number;
  nivel: 'segundo' | 'tercero';
  isCritical?: boolean;
  ratio?: '1:2' | '1:1';
  // Soporte para áreas por ratio (Tablas D, E y F)
  tipoCalculo?: 'indice' | 'ratio';
  unidades?: number;
  ratioMin?: string;
  ratioMax?: string;
  ratioElegido?: 'min' | 'max';
}

export interface DotacionOutput {
  P: number;
  B: number;
  Z: number;
  Z_ceil: number;
  Q1: number; // Mañana (35%)
  Q2: number; // Tarde (25%)
  Q3: number; // Noche (20%)
  Qf: number; // Francos (20%)
  profesionales: number;
  auxiliares: number;
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function parseRatioStringToStaff(ratioStr: string, unidades: number): { profesionales: number; auxiliares: number } {
  let profesionales = 0;
  let auxiliares = 0;

  const normalized = ratioStr.toLowerCase().trim();
  const parts = normalized.split('+');

  for (const part of parts) {
    const trimmedPart = part.trim();
    const aeMatch = trimmedPart.match(/(\d+(?:\.\d+)?)\s*ae/);
    const egMatch = trimmedPart.match(/(\d+(?:\.\d+)?)\s*eg/);
    const eeMatch = trimmedPart.match(/(\d+(?:\.\d+)?)\s*ee/);

    const numberMatch = trimmedPart.match(/\/(\d+)/);
    const divisor = numberMatch ? parseFloat(numberMatch[1]) : 1;

    const aeCount = aeMatch ? parseFloat(aeMatch[1]) : 0;
    const egCount = egMatch ? parseFloat(egMatch[1]) : 0;
    const eeCount = eeMatch ? parseFloat(eeMatch[1]) : 0;

    const factor = unidades / divisor;

    auxiliares += aeCount * factor;
    profesionales += (egCount + eeCount) * factor;
  }

  // Cobertura para los 3 turnos diarios de 24hs
  return {
    profesionales: profesionales * 3,
    auxiliares: auxiliares * 3
  };
}

export function calcularDotacion(input: DotacionInput): DotacionOutput {
  const { I, C, J, nivel, isCritical, ratio, tipoCalculo, unidades, ratioMin, ratioMax, ratioElegido } = input;

  let P = 0;
  let computedProfesionales: number | null = null;
  let computedAuxiliares: number | null = null;

  if (tipoCalculo === 'ratio' && unidades !== undefined) {
    const activeRatioStr = ratioElegido === 'max' ? ratioMax : ratioMin;
    if (activeRatioStr) {
      const staff = parseRatioStringToStaff(activeRatioStr, unidades);
      computedProfesionales = staff.profesionales;
      computedAuxiliares = staff.auxiliares;
      P = staff.profesionales + staff.auxiliares;
    } else {
      P = unidades * 3; // fallback
    }
  } else if (isCritical && ratio) {
    if (ratio === '1:2') {
      P = (C / 2) * 3; // 1 enfermero cada 2 camas por turno (3 turnos en 24h)
    } else if (ratio === '1:1') {
      P = C * 3; // 1 enfermero por cama por turno (3 turnos en 24h)
    } else {
      throw new Error("Ratio crítico no soportado. Use '1:2' o '1:1'.");
    }
  } else if (I !== undefined) {
    P = (I * C) / J;
  } else {
    throw new Error("Debe proporcionar un índice de cuidado (I) o configurar un ratio crítico (UCI).");
  }

  const B = P * 0.41; // Ausentismo previsible (41%)
  const Z = P + B;
  const Z_ceil = Math.ceil(Z);

  // Paso 4: distribución teórica
  const Q1 = Math.ceil(Z * 0.35); // Mañana
  const Q2 = Math.ceil(Z * 0.25); // Tarde
  const Q3 = Math.ceil(Z * 0.20); // Noche
  let Qf = Math.ceil(Z * 0.20);  // Francos

  // Validación de consistencia
  const sumQ = Q1 + Q2 + Q3 + Qf;
  const diff = Z_ceil - sumQ;

  // Ajuste fino por errores de redondeo decimal (±1 o ±2)
  if (Math.abs(diff) <= 2) {
    Qf += diff;
  } else {
    const errorPct = (Math.abs(diff) / Z) * 100;
    if (errorPct > 1.0) {
      throw new Error(`Discrepancia en distribución por turnos (${errorPct.toFixed(2)}%) supera el límite permitido del 1%.`);
    } else {
      Qf += diff;
    }
  }

  // Paso 5: composición profesional
  let profesionales = 0;
  let auxiliares = 0;

  if (computedProfesionales !== null && computedAuxiliares !== null) {
    // Si provienen de ratios específicos por tipo de personal, mantenemos esa proporción calculada más colchón B
    profesionales = Math.ceil(computedProfesionales * 1.41);
    auxiliares = Math.ceil(computedAuxiliares * 1.41);
  } else {
    const ratioComplejidad = nivel === 'tercero' ? 0.80 : 0.70;
    profesionales = Math.ceil(Z_ceil * ratioComplejidad);
    auxiliares = Math.ceil(Z_ceil * (1 - ratioComplejidad));
  }

  return {
    P: roundToTwo(P),
    B: roundToTwo(B),
    Z: roundToTwo(Z),
    Z_ceil,
    Q1,
    Q2,
    Q3,
    Qf,
    profesionales,
    auxiliares
  };
}

