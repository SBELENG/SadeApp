// Immutable care index database by specialty
export interface EspecialidadIndex {
  categoria: string;
  especialidad: string;
  minI: number;
  maxI: number;
  perfilRequerido: string;
}

export const ESPECIALIDADES_INDICES: Record<string, EspecialidadIndex> = {
  medicina_interna: {
    categoria: 'Clínica',
    especialidad: 'Medicina Interna / Infectología',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional'
  },
  cardiologia: {
    categoria: 'Clínica',
    especialidad: 'Cardiología',
    minI: 3.0,
    maxI: 3.4,
    perfilRequerido: 'Enfermero Profesional'
  },
  perinatologia: {
    categoria: 'Clínica',
    especialidad: 'Perinatología',
    minI: 8.0,
    maxI: 12.0,
    perfilRequerido: 'Enfermero Profesional'
  },
  cirugia_general: {
    categoria: 'Quirúrgica',
    especialidad: 'Cirugía General',
    minI: 3.4,
    maxI: 4.0,
    perfilRequerido: 'Enfermero Profesional'
  },
  cirugia_cardiovascular: {
    categoria: 'Quirúrgica',
    especialidad: 'Cirugía Cardiovascular / Traumatología',
    minI: 4.0,
    maxI: 4.8,
    perfilRequerido: 'Enfermero Profesional'
  },
  uci_pediatrica: {
    categoria: 'Pediátrica',
    especialidad: 'UCI Pediátrica / Neonatología',
    minI: 8.0,
    maxI: 12.0,
    perfilRequerido: 'Enfermero Especialista'
  },
  prematuros: {
    categoria: 'Pediátrica',
    especialidad: 'Prematuros',
    minI: 5.0,
    maxI: 8.0,
    perfilRequerido: 'Enfermero Profesional'
  },
  uci_adultos: {
    categoria: 'Crítica',
    especialidad: 'Cuidados Intensivos (adultos)',
    minI: 12.0,
    maxI: 24.0,
    perfilRequerido: 'Enfermero Especialista'
  },
  admision_hospitalaria: {
    categoria: 'Ambulatorio',
    especialidad: 'Admisión Hospitalaria',
    minI: 0,
    maxI: 0,
    perfilRequerido: 'Auxiliar / Enfermero'
  }
};
