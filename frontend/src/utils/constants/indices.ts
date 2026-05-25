// Immutable care index and ratio database by specialty (Anexo 1 UNRC)
export interface EspecialidadIndex {
  categoria: 'Clínicas' | 'Quirúrgicas' | 'Pediátricas' | 'Áreas quirúrgicas por ratio' | 'Áreas críticas por ratio' | 'Consulta externa por ratio';
  especialidad: string;
  minI?: number;
  maxI?: number;
  perfilRequerido?: string;
  tipoCalculo: 'indice' | 'ratio';
  ratioMin?: string;
  ratioMax?: string;
  nivelMinimo: 2 | 3;
}

export const ESPECIALIDADES_INDICES: Record<string, EspecialidadIndex> = {
  // ==========================================
  // TABLA A - Especialidades Médicas (Índice, nivel_minimo = 2)
  // ==========================================
  alergologia_inmunologia: {
    categoria: 'Clínicas',
    especialidad: 'Alergología e Inmunología',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  cardiologia: {
    categoria: 'Clínicas',
    especialidad: 'Cardiología',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  dermatologia: {
    categoria: 'Clínicas',
    especialidad: 'Dermatología',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  endocrinologia: {
    categoria: 'Clínicas',
    especialidad: 'Endocrinología',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  hematologia: {
    categoria: 'Clínicas',
    especialidad: 'Hematología',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  infectologia: {
    categoria: 'Clínicas',
    especialidad: 'Infectología',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  medicina_interna: {
    categoria: 'Clínicas',
    especialidad: 'Medicina Interna',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  nefrologia: {
    categoria: 'Clínicas',
    especialidad: 'Nefrología',
    minI: 3.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  neumologia: {
    categoria: 'Clínicas',
    especialidad: 'Neumología',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  neurologia: {
    categoria: 'Clínicas',
    especialidad: 'Neurología',
    minI: 3.4,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  oncologia: {
    categoria: 'Clínicas',
    especialidad: 'Oncología',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  psiquiatria: {
    categoria: 'Clínicas',
    especialidad: 'Psiquiatría',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  reumatologia: {
    categoria: 'Clínicas',
    especialidad: 'Reumatología',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  ginecologia: {
    categoria: 'Clínicas',
    especialidad: 'Ginecología',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  obstetricia: {
    categoria: 'Clínicas',
    especialidad: 'Obstetricia',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  perinatologia: {
    categoria: 'Clínicas',
    especialidad: 'Perinatología',
    minI: 8.0,
    maxI: 12.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  alojamiento_conjunto: {
    categoria: 'Clínicas',
    especialidad: 'Alojamiento conjunto',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },

  // ==========================================
  // TABLA B - Especialidades Quirúrgicas (Índice, nivel_minimo = 2)
  // ==========================================
  cirugia_cabeza_cuello: {
    categoria: 'Quirúrgicas',
    especialidad: 'Cirugía de cabeza y cuello',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  cirugia_cardiovascular: {
    categoria: 'Quirúrgicas',
    especialidad: 'Cirugía cardiovascular',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  cirugia_general: {
    categoria: 'Quirúrgicas',
    especialidad: 'Cirugía general',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  cirugia_plastica_reconstructiva: {
    categoria: 'Quirúrgicas',
    especialidad: 'Cirugía plástica y reconstructiva',
    minI: 3.0,
    maxI: 3.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  gastrocirugia: {
    categoria: 'Quirúrgicas',
    especialidad: 'Gastrocirugía',
    minI: 3.4,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  neurocirugia: {
    categoria: 'Quirúrgicas',
    especialidad: 'Neurocirugía',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  oftalmologia: {
    categoria: 'Quirúrgicas',
    especialidad: 'Oftalmología',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  otorrinolaringologia: {
    categoria: 'Quirúrgicas',
    especialidad: 'Otorrinolaringología',
    minI: 3.0,
    maxI: 3.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  oncocirugia: {
    categoria: 'Quirúrgicas',
    especialidad: 'Oncocirugia',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  traumatologia_ortopedia: {
    categoria: 'Quirúrgicas',
    especialidad: 'Traumatología y ortopedia',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  proctologia: {
    categoria: 'Quirúrgicas',
    especialidad: 'Proctología',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  urologia: {
    categoria: 'Quirúrgicas',
    especialidad: 'Urología',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  vascular_periferico: {
    categoria: 'Quirúrgicas',
    especialidad: 'Vascular periférico (Angiología)',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  ginecologia_quirurgica: {
    categoria: 'Quirúrgicas',
    especialidad: 'Ginecología quirúrgica',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  obstetricia_quirurgica: {
    categoria: 'Quirúrgicas',
    especialidad: 'Obstetricia quirúrgica',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  perinatologia_quirurgica: {
    categoria: 'Quirúrgicas',
    especialidad: 'Perinatología quirúrgica',
    minI: 8.0,
    maxI: 12.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },

  // ==========================================
  // TABLA C - Especialidades Pediátricas (Índice, nivel_minimo = 2 o 3)
  // ==========================================
  cardiologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Cardiología pediátrica',
    minI: 4.5,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  cuidados_intensivos_pediatricos: {
    categoria: 'Pediátricas',
    especialidad: 'Cuidados intensivos pediátricos',
    minI: 8.0,
    maxI: 12.0,
    perfilRequerido: 'Enfermero Especialista',
    tipoCalculo: 'indice',
    nivelMinimo: 3
  },
  cunero_fisiologico: {
    categoria: 'Pediátricas',
    especialidad: 'Cunero fisiológico',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  gastroenterologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Gastroenterología pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  hematologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Hematología pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  infectologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Infectología pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  nefrologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Nefrología pediátrica',
    minI: 4.5,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  neonatologia: {
    categoria: 'Pediátricas',
    especialidad: 'Neonatología',
    minI: 8.0,
    maxI: 12.0,
    perfilRequerido: 'Enfermero Especialista',
    tipoCalculo: 'indice',
    nivelMinimo: 3
  },
  neumologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Neumología pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  neurologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Neurología pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  neurocirugia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Neurocirugía pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  oftalmologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Oftalmología pediátrica',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  oncologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Oncología pediátrica',
    minI: 4.5,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  otorrinolaringologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Otorrinolaringología pediátrica',
    minI: 3.4,
    maxI: 3.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  pediatria_general: {
    categoria: 'Pediátricas',
    especialidad: 'Pediatría general',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  prematuros: {
    categoria: 'Pediátricas',
    especialidad: 'Prematuros',
    minI: 5.0,
    maxI: 8.0,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  psiquiatria_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Psiquiatría pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  traumatologia_ortopedia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Traumatología y ortopedia pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },
  urologia_pediatrica: {
    categoria: 'Pediátricas',
    especialidad: 'Urología pediátrica',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional',
    tipoCalculo: 'indice',
    nivelMinimo: 2
  },

  // ==========================================
  // TABLA D - Áreas Quirúrgicas por Ratio (Ratio, nivel_minimo = 2 o 3)
  // ==========================================
  central_equipos_esterilizacion: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Central de equipos y esterilización',
    tipoCalculo: 'ratio',
    ratioMin: '1 AE/40 camas + 1 EG/100 camas',
    ratioMax: '1 AE/30 camas + 1 EG/80 camas',
    nivelMinimo: 3
  },
  cirugia_ambulatoria: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Cirugía ambulatoria',
    tipoCalculo: 'ratio',
    ratioMin: '1 AE/6 camas + 1 EG/15 camas',
    ratioMax: '1 AE/6 camas + 1 EG/10 camas',
    nivelMinimo: 3
  },
  hemodinamica: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Hemodinámica',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/sala',
    ratioMax: '2 EG/sala',
    nivelMinimo: 3
  },
  radiologia_intervencionista: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Radiología intervencionista',
    tipoCalculo: 'ratio',
    ratioMin: '1 AE/turno',
    ratioMax: '2 AE/turno',
    nivelMinimo: 3
  },
  recuperacion: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Recuperación',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/8 camillas + 1 EE/10 camillas',
    ratioMax: '1 EG/6 camillas + 1 EE/8 camillas',
    nivelMinimo: 2
  },
  sala_quirofano: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Sala de quirófano',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE + 1 EG/sala',
    ratioMax: '2 EE + 1 EG/sala',
    nivelMinimo: 2
  },
  tococirugia_admision: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Tococirugía — Admisión',
    tipoCalculo: 'ratio',
    ratioMin: '1 AE/consultorio',
    ratioMax: '1 EG/consultorio',
    nivelMinimo: 2
  },
  tococirugia_labor: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Tococirugía — Labor',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/6 camas + 1 EE/12 camas',
    ratioMax: '1 EG/6 camas + 1 EE/10 camas',
    nivelMinimo: 2
  },
  tococirugia_expulsion: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Tococirugía — Expulsión',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/sala',
    ratioMax: '1 EE/sala',
    nivelMinimo: 2
  },
  tococirugia_puerperio: {
    categoria: 'Áreas quirúrgicas por ratio',
    especialidad: 'Tococirugía — Puerperio bajo riesgo',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/10 camillas',
    ratioMax: '1 EG/6 camillas',
    nivelMinimo: 2
  },

  // ==========================================
  // TABLA E - Áreas Críticas por Ratio (Ratio, nivel_minimo = 3)
  // ==========================================
  cuidados_intensivos_adultos: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Cuidados intensivos adultos',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/2 camas',
    ratioMax: '1 EE/cama',
    nivelMinimo: 3
  },
  cuidados_intensivos_neonatologia: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Cuidados intensivos neonatología',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/2 camas',
    ratioMax: '1 EE/cama',
    nivelMinimo: 3
  },
  cuidados_intensivos_pediatria: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Cuidados intensivos pediatría',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/2 camas',
    ratioMax: '1 EE/cama',
    nivelMinimo: 3
  },
  terapia_intermedia_adultos: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Terapia intermedia adultos',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/3 camas',
    ratioMax: '1 EE/2 camas',
    nivelMinimo: 3
  },
  terapia_intermedia_pediatria: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Terapia intermedia pediatría',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/3 camas',
    ratioMax: '1 EE/2 camas',
    nivelMinimo: 3
  },
  unidad_choque_adultos: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Unidad de choque adultos',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/unidad',
    ratioMax: '2 EE/unidad',
    nivelMinimo: 3
  },
  unidad_choque_pediatria: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Unidad de choque pediatría',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/unidad',
    ratioMax: '2 EE/unidad',
    nivelMinimo: 3
  },
  unidad_choque_traumatologia: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Unidad de choque traumatología',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/unidad',
    ratioMax: '2 EE/unidad',
    nivelMinimo: 3
  },
  unidad_quemados_adultos: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Unidad de quemados adultos',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/unidad',
    ratioMax: '2 EE/unidad',
    nivelMinimo: 3
  },
  unidad_quemados_pediatria: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Unidad de quemados pediatría',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/unidad',
    ratioMax: '1 EE/unidad',
    nivelMinimo: 3
  },
  unidad_trasplantes: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Unidad de trasplantes',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/unidad',
    ratioMax: '2 EE/unidad',
    nivelMinimo: 3
  },
  urgencias_adultos: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Urgencias adultos',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/3 camas',
    ratioMax: '1 EE/3 camas',
    nivelMinimo: 3
  },
  urgencias_coronarias: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Urgencias coronarias',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/2 camas',
    ratioMax: '1 EE/cama',
    nivelMinimo: 3
  },
  urgencias_pediatricas: {
    categoria: 'Áreas críticas por ratio',
    especialidad: 'Urgencias pediátricas',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/3 camas',
    ratioMax: '1 EE/2 camas',
    nivelMinimo: 3
  },

  // ==========================================
  // TABLA F - Consulta Externa por Ratio (Ratio, nivel_minimo = 2)
  // ==========================================
  admision_hospitalaria: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Admisión hospitalaria',
    tipoCalculo: 'ratio',
    ratioMin: '1 AE/turno',
    ratioMax: '1 EG/turno',
    nivelMinimo: 2
  },
  curaciones: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Curaciones',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/cubículo',
    ratioMax: '1 EG + 1 AE/cubículo',
    nivelMinimo: 2
  },
  clinica_cateteres: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Clínica de catéteres',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/turno',
    ratioMax: '2 EG/turno',
    nivelMinimo: 2
  },
  clinica_dolor: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Clínica del dolor',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/turno',
    ratioMax: '2 EG/turno',
    nivelMinimo: 2
  },
  clinica_estomas: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Clínica de estomas',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/turno',
    ratioMax: '2 EG/turno',
    nivelMinimo: 2
  },
  consultorios_especialidades: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Consultorios de especialidades',
    tipoCalculo: 'ratio',
    ratioMin: '1 AE/2 consultorios',
    ratioMax: '1 AE/consultorio',
    nivelMinimo: 2
  },
  endoscopias: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Endoscopías',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/sala',
    ratioMax: '1 EE/sala',
    nivelMinimo: 2
  },
  hemodialisis_adulto: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Hemodiálisis adulto',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/2 máquinas',
    ratioMax: '1 EE/2 máquinas',
    nivelMinimo: 2
  },
  hemodialisis_pediatria: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Hemodiálisis pediatría',
    tipoCalculo: 'ratio',
    ratioMin: '1 EE/máquina',
    ratioMax: '2 EE/máquina',
    nivelMinimo: 2
  },
  quimioterapia: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Quimioterapia',
    tipoCalculo: 'ratio',
    ratioMin: '1 EG/8 tratamientos',
    ratioMax: '1 EE/8 tratamientos',
    nivelMinimo: 2
  },
  servicios_diagnostico: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Servicios de diagnóstico',
    tipoCalculo: 'ratio',
    ratioMin: '1 AE/turno',
    ratioMax: '1 AE/turno',
    nivelMinimo: 2
  },
  sala_altas: {
    categoria: 'Consulta externa por ratio',
    especialidad: 'Sala de altas',
    tipoCalculo: 'ratio',
    ratioMin: '1 AE/turno',
    ratioMax: '1 EG/turno',
    nivelMinimo: 2
  }
};
