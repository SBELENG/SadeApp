import { create } from 'zustand';
import { calcularDotacion } from '../utils/dotacion.calc';
import type { DotacionOutput } from '../utils/dotacion.calc';
import { ESPECIALIDADES_INDICES } from '../utils/constants/indices';

export interface ConfigState {
  currentPage: 'config' | 'dashboard' | 'grid';
  serviceKey: string;
  beds: number;
  indexI: number;
  nivel: 'segundo' | 'tercero';
  year: number;
  month: number; // 1-12
  feriados: number[]; // Días feriados, ej: [25]
  isCritical: boolean;
  ratio: '1:2' | '1:1';
  dotacion: DotacionOutput | null;
  logoBase64: string | null;
  
  // Actions
  setCurrentPage: (page: 'config' | 'dashboard' | 'grid') => void;
  setServiceKey: (key: string) => void;
  setBeds: (beds: number) => void;
  setIndexI: (i: number) => void;
  setNivel: (nivel: 'segundo' | 'tercero') => void;
  setYearAndMonth: (year: number, month: number) => void;
  toggleFeriado: (day: number) => void;
  setFeriados: (feriados: number[]) => void;
  setRatio: (ratio: '1:2' | '1:1') => void;
  setLogoBase64: (logo: string | null) => void;
  ejecutarCalculo: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  currentPage: 'config',
  serviceKey: 'medicina_interna',
  beds: 15,
  indexI: 4.2,
  nivel: 'segundo',
  year: 2026,
  month: 6, // Junio 2026
  feriados: [20, 25], // Feriados nacionales por defecto en Junio
  isCritical: false,
  ratio: '1:2',
  dotacion: null,
  logoBase64: typeof window !== 'undefined' ? localStorage.getItem('sade_institucion_logo') : null,

  setCurrentPage: (page) => set({ currentPage: page }),

  setServiceKey: (key) => {
    const isCritical = key === 'uci_adultos';
    let indexI = 4.2;
    let nivel: 'segundo' | 'tercero' = 'segundo';
    
    if (isCritical) {
      nivel = 'tercero'; // Terapia es típicamente 3er nivel
    } else {
      const spec = ESPECIALIDADES_INDICES[key];
      if (spec) {
        indexI = parseFloat(((spec.minI + spec.maxI) / 2).toFixed(1));
        if (spec.perfilRequerido === 'Enfermero Especialista') {
          nivel = 'tercero';
        }
      }
    }

    set({ 
      serviceKey: key, 
      isCritical, 
      indexI, 
      nivel,
      dotacion: null // resetear cálculo al cambiar especialidad
    });
  },

  setBeds: (beds) => set({ beds, dotacion: null }),
  setIndexI: (indexI) => set({ indexI, dotacion: null }),
  setNivel: (nivel) => set({ nivel, dotacion: null }),
  
  setYearAndMonth: (year, month) => {
    // Cuando cambia mes/año, podríamos autocompletar feriados nacionales por defecto si se desea
    set({ year, month, dotacion: null });
  },

  toggleFeriado: (day) => {
    const { feriados } = get();
    if (feriados.includes(day)) {
      set({ feriados: feriados.filter((d) => d !== day), dotacion: null });
    } else {
      set({ feriados: [...feriados, day].sort((a, b) => a - b), dotacion: null });
    }
  },

  setFeriados: (feriados) => set({ feriados, dotacion: null }),
  setRatio: (ratio) => set({ ratio, dotacion: null }),

  setLogoBase64: (logo) => {
    if (logo) {
      localStorage.setItem('sade_institucion_logo', logo);
    } else {
      localStorage.removeItem('sade_institucion_logo');
    }
    set({ logoBase64: logo });
  },

  ejecutarCalculo: () => {
    const { indexI, beds, nivel, isCritical, ratio } = get();
    const res = calcularDotacion({
      I: isCritical ? undefined : indexI,
      C: beds,
      J: 8,
      nivel,
      isCritical,
      ratio: isCritical ? ratio : undefined
    });
    set({ dotacion: res, currentPage: 'dashboard' });
  }
}));
