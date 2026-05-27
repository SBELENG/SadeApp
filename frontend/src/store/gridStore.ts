import { create } from 'zustand';

export type TurnoTipo = 'M' | 'T' | 'N' | 'F' | '';

export interface PersonalMock {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  matricula: string;
  nivel_formacion: 'LICENCIADO' | 'ENFERMERO_PROFESIONAL' | 'ENFERMERO_ESPECIALISTA' | 'AUXILIAR';
  jornada_horas: number;
  turno_fijo: 'M' | 'T' | 'N' | null;
  antiguedad_anos: number;
  compensatorio_pendiente: number;
}

export type TurnosMapa = Record<string, Record<number, TurnoTipo>>; // personalId -> dia -> M/T/N/F/""

export interface GridState {
  personal: PersonalMock[];
  turnos: TurnosMapa;
  mes: number;
  anio: number;
  diasMes: number;
  feriados: number[];
  
  // Actions
  inicializarPlanilla: (mes: number, anio: number, feriados: number[]) => void;
  asignarTurno: (personalId: string, dia: number, tipo: TurnoTipo) => void;
  limpiarPlanilla: () => void;
  agregarEnfermero: (enfermero: PersonalMock) => void;
  eliminarEnfermero: (id: string) => void;
  editarEnfermero: (enfermero: PersonalMock) => void;
}

// Datos simulados (Mock Staff) de enfermeros activos asignados a este servicio
const MOCK_STAFF: PersonalMock[] = [
  {
    id: 'staff-1',
    nombre: 'María',
    apellido: 'García',
    dni: '30.123.456',
    matricula: 'EP-101',
    nivel_formacion: 'ENFERMERO_PROFESIONAL',
    jornada_horas: 8,
    turno_fijo: 'M',
    antiguedad_anos: 8,
    compensatorio_pendiente: 0
  },
  {
    id: 'staff-2',
    nombre: 'Alejandro',
    apellido: 'López',
    dni: '28.987.654',
    matricula: 'EE-202',
    nivel_formacion: 'ENFERMERO_ESPECIALISTA',
    jornada_horas: 8,
    turno_fijo: 'N',
    antiguedad_anos: 12,
    compensatorio_pendiente: 1 // Traslada +1 compensatorio pendiente
  },
  {
    id: 'staff-3',
    nombre: 'Ricardo',
    apellido: 'Pérez',
    dni: '35.456.789',
    matricula: 'AE-303',
    nivel_formacion: 'AUXILIAR',
    jornada_horas: 8,
    turno_fijo: 'M',
    antiguedad_anos: 4,
    compensatorio_pendiente: 0
  },
  {
    id: 'staff-4',
    nombre: 'Ana',
    apellido: 'Gómez',
    dni: '32.111.222',
    matricula: 'LIC-404',
    nivel_formacion: 'LICENCIADO',
    jornada_horas: 8,
    turno_fijo: 'T',
    antiguedad_anos: 15,
    compensatorio_pendiente: 0
  },
  {
    id: 'staff-5',
    nombre: 'Sofía',
    apellido: 'Martínez',
    dni: '31.444.555',
    matricula: 'EP-505',
    nivel_formacion: 'ENFERMERO_PROFESIONAL',
    jornada_horas: 8,
    turno_fijo: 'M',
    antiguedad_anos: 6,
    compensatorio_pendiente: 0
  },
  {
    id: 'staff-6',
    nombre: 'Juan',
    apellido: 'Rodríguez',
    dni: '34.777.888',
    matricula: 'AE-606',
    nivel_formacion: 'AUXILIAR',
    jornada_horas: 8,
    turno_fijo: 'T',
    antiguedad_anos: 3,
    compensatorio_pendiente: 0
  },
  {
    id: 'staff-7',
    nombre: 'Carlos',
    apellido: 'Sánchez',
    dni: '29.888.999',
    matricula: 'EP-707',
    nivel_formacion: 'ENFERMERO_PROFESIONAL',
    jornada_horas: 8,
    turno_fijo: 'N',
    antiguedad_anos: 5,
    compensatorio_pendiente: 0
  }
];

export const useGridStore = create<GridState>((set, get) => ({
  personal: typeof window !== 'undefined' ? (() => {
    const cached = localStorage.getItem('sade_personal');
    if (!cached || JSON.parse(cached).length === 6) {
      localStorage.setItem('sade_personal', JSON.stringify(MOCK_STAFF));
      return MOCK_STAFF;
    }
    return JSON.parse(cached);
  })() : MOCK_STAFF,
  turnos: {},
  mes: 6,
  anio: 2026,
  diasMes: 30,
  feriados: [],

  inicializarPlanilla: (mes, anio, feriados) => {
    const totalDays = new Date(anio, mes, 0).getDate();
    const turnos: TurnosMapa = {};
    const currentStaff = get().personal;

    // 1. Inicializar todas las celdas de todos los enfermeros en vacío ''
    currentStaff.forEach((enf) => {
      turnos[enf.id] = {};
      for (let day = 1; day <= totalDays; day++) {
        turnos[enf.id][day] = '';
      }
    });

    // 2. Correr el motor de distribución escalonada por cada grupo de turno fijo M, T, N
    ['M', 'T', 'N'].forEach((turno) => {
      const staffDeTurno = currentStaff.filter((p) => p.turno_fijo === turno);
      const k = staffDeTurno.length;
      if (k === 0) return;

      // Inicialización base: fines de semana y feriados son 'F', días de semana son turno_fijo
      staffDeTurno.forEach((enf) => {
        for (let day = 1; day <= totalDays; day++) {
          const date = new Date(anio, mes - 1, day);
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isFeriado = feriados.includes(day);

          if (isWeekend || isFeriado) {
            turnos[enf.id][day] = 'F';
          } else {
            turnos[enf.id][day] = turno as TurnoTipo;
          }
        }
      });

      // Si k > 0, queremos que haya cobertura de al menos 1 enfermero en fines de semana y feriados.
      // Para cada fin de semana/feriado, elegimos un enfermero de forma rotativa para trabajar.
      // Ese enfermero recupera su franco en el día de semana más cercano disponible.
      let weekendHolidayIndex = 0;
      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(anio, mes - 1, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isFeriado = feriados.includes(day);

        if (isWeekend || isFeriado) {
          // Elegimos quién trabaja (guardia)
          const workNurseIdx = weekendHolidayIndex % k;
          const workNurse = staffDeTurno[workNurseIdx];
          
          // Cambiamos su franco 'F' por el turno de trabajo
          turnos[workNurse.id][day] = turno as TurnoTipo;

          // Compensación: le damos un franco en un día de semana de la misma semana o posterior
          // Buscamos el primer día de semana disponible posterior que no sea feriado y donde esté trabajando
          let compensado = false;
          for (let d = day + 1; d <= totalDays; d++) {
            const dDate = new Date(anio, mes - 1, d);
            const dDayOfWeek = dDate.getDay();
            const dIsWeekend = dDayOfWeek === 0 || dDayOfWeek === 6;
            const dIsFeriado = feriados.includes(d);

            if (!dIsWeekend && !dIsFeriado && turnos[workNurse.id][d] === turno) {
              // Asegurar que si k > 1, no dejemos ese día de semana con cobertura cero
              const otrosTrabajandoHoy = staffDeTurno.filter(
                (p) => p.id !== workNurse.id && turnos[p.id][d] === turno
              ).length;

              if (k === 1 || otrosTrabajandoHoy > 0) {
                turnos[workNurse.id][d] = 'F';
                compensado = true;
                break;
              }
            }
          }

          // Si no se pudo compensar hacia adelante (ej. fin de mes), compensar hacia atrás
          if (!compensado) {
            for (let d = day - 1; d >= 1; d--) {
              const dDate = new Date(anio, mes - 1, d);
              const dDayOfWeek = dDate.getDay();
              const dIsWeekend = dDayOfWeek === 0 || dDayOfWeek === 6;
              const dIsFeriado = feriados.includes(d);

              if (!dIsWeekend && !dIsFeriado && turnos[workNurse.id][d] === turno) {
                const otrosTrabajandoHoy = staffDeTurno.filter(
                  (p) => p.id !== workNurse.id && turnos[p.id][d] === turno
                ).length;

                if (k === 1 || otrosTrabajandoHoy > 0) {
                  turnos[workNurse.id][d] = 'F';
                  break;
                }
              }
            }
          }

          weekendHolidayIndex++;
        }
      }
    });

    set({ mes, anio, diasMes: totalDays, feriados, turnos });
  },

  asignarTurno: (personalId, dia, tipo) => {
    const { turnos } = get();
    const enfermeroTurnos = { ...turnos[personalId] };
    enfermeroTurnos[dia] = tipo;

    set({
      turnos: {
        ...turnos,
        [personalId]: enfermeroTurnos
      }
    });
  },

  limpiarPlanilla: () => {
    const { mes, anio, feriados } = get();
    get().inicializarPlanilla(mes, anio, feriados);
  },

  agregarEnfermero: (enf) => {
    const { personal, turnos } = get();
    const updated = [...personal, enf];
    localStorage.setItem('sade_personal', JSON.stringify(updated));
    
    // Inicializar turnos para el nuevo enfermero
    const newTurnos = { ...turnos };
    newTurnos[enf.id] = {};
    const { mes, anio, feriados } = get();
    const totalDays = new Date(anio, mes, 0).getDate();
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(anio, mes - 1, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFeriado = feriados.includes(day);

      if (isFeriado || isWeekend) {
        newTurnos[enf.id][day] = 'F';
      } else if (enf.turno_fijo) {
        newTurnos[enf.id][day] = enf.turno_fijo;
      } else {
        newTurnos[enf.id][day] = '';
      }
    }
    
    set({ personal: updated, turnos: newTurnos });
  },

  eliminarEnfermero: (id) => {
    const { personal, turnos } = get();
    const updated = personal.filter((p) => p.id !== id);
    localStorage.setItem('sade_personal', JSON.stringify(updated));
    const newTurnos = { ...turnos };
    delete newTurnos[id];
    set({ personal: updated, turnos: newTurnos });
  },

  editarEnfermero: (enf) => {
    const { personal } = get();
    const updated = personal.map((p) => p.id === enf.id ? enf : p);
    localStorage.setItem('sade_personal', JSON.stringify(updated));
    set({ personal: updated });
  }
}));
