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
  unidades: number; // Cantidad de unidades (salas, etc.) para cálculo por ratio
  ratioElegido: 'min' | 'max'; // Opción elegida del ratio
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
  setUnidades: (unidades: number) => void;
  setRatioElegido: (ratio: 'min' | 'max') => void;
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
  unidades: 1,
  ratioElegido: 'min',
  dotacion: null,
  logoBase64: typeof window !== 'undefined' ? localStorage.getItem('sade_institucion_logo') : null,

  setCurrentPage: (page) => set({ currentPage: page }),

  setServiceKey: (key) => {
    const spec = ESPECIALIDADES_INDICES[key];
    if (!spec) {
      set({ serviceKey: '', dotacion: null });
      return;
    }

    const isCritical = spec.categoria === 'Áreas críticas por ratio';
    let indexI = 4.2;
    let nivel: 'segundo' | 'tercero' = spec.nivelMinimo === 3 ? 'tercero' : 'segundo';
    
    if (spec.tipoCalculo === 'indice' && spec.minI !== undefined && spec.maxI !== undefined) {
      indexI = parseFloat(((spec.minI + spec.maxI) / 2).toFixed(1));
    }

    set({ 
      serviceKey: key, 
      isCritical, 
      indexI, 
      nivel,
      unidades: 1,
      ratioElegido: 'min',
      dotacion: null // resetear cálculo al cambiar especialidad
    });
  },

  setBeds: (beds) => set({ beds, dotacion: null }),
  setIndexI: (indexI) => set({ indexI, dotacion: null }),
  
  setNivel: (nivel) => {
    const { serviceKey } = get();
    const spec = ESPECIALIDADES_INDICES[serviceKey];
    
    // Si cambiamos a un nivel de complejidad inferior y el servicio actual no está disponible, se limpia.
    if (spec && nivel === 'segundo' && spec.nivelMinimo === 3) {
      set({ 
        nivel, 
        serviceKey: '', 
        dotacion: null 
      });
    } else {
      set({ nivel, dotacion: null });
    }
  },
  
  setYearAndMonth: (year, month) => {
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
  setUnidades: (unidades) => set({ unidades, dotacion: null }),
  setRatioElegido: (ratioElegido) => set({ ratioElegido, dotacion: null }),

  setLogoBase64: (logo) => {
    if (logo) {
      localStorage.setItem('sade_institucion_logo', logo);
    } else {
      localStorage.removeItem('sade_institucion_logo');
    }
    set({ logoBase64: logo });
  },

  ejecutarCalculo: () => {
    const { indexI, beds, nivel, isCritical, ratio, serviceKey, unidades, ratioElegido } = get();
    const spec = ESPECIALIDADES_INDICES[serviceKey];

    const res = calcularDotacion({
      I: isCritical || (spec && spec.tipoCalculo === 'ratio') ? undefined : indexI,
      C: beds,
      J: 8,
      nivel,
      isCritical,
      ratio: isCritical ? ratio : undefined,
      tipoCalculo: spec ? spec.tipoCalculo : 'indice',
      unidades: spec && spec.tipoCalculo === 'ratio' ? unidades : undefined,
      ratioMin: spec ? spec.ratioMin : undefined,
      ratioMax: spec ? spec.ratioMax : undefined,
      ratioElegido: ratioElegido
    });
    set({ dotacion: res, currentPage: 'dashboard' });
  }
}));
