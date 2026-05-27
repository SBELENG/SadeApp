import React, { useEffect, useMemo } from 'react';
import { useConfigStore } from '../store/configStore';
import { useGridStore } from '../store/gridStore';
import { ESPECIALIDADES_INDICES } from '../utils/constants/indices';
import ShiftGrid from '../components/grid/ShiftGrid';
import { usePdf } from '../hooks/usePdf';

export const GridPage: React.FC = () => {
  const {
    serviceKey,
    month,
    year,
    feriados,
    dotacion,
    setCurrentPage
  } = useConfigStore();

  const {
    inicializarPlanilla,
    limpiarPlanilla,
    personal
  } = useGridStore();

  const { exportToPdf } = usePdf();

  const currentSpecialty = useMemo(() => ESPECIALIDADES_INDICES[serviceKey], [serviceKey]);

  // Inicializar planilla reactivamente al montar el componente
  useEffect(() => {
    inicializarPlanilla(month, year, feriados);
  }, [month, year, feriados, inicializarPlanilla]);

  // Si no hay cálculo hecho, forzar a pasar por Pantalla 1
  if (!dotacion) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <div className="card-premium" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
          <span style={{ fontSize: '48px', marginBottom: '20px', display: 'block' }}>📋</span>
          <h2 style={{ marginBottom: '12px' }}>Cálculo Requerido</h2>
          <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
            Debe ejecutar el cálculo de dotación en la pantalla de configuración antes de planificar los turnos.
          </p>
          <button className="btn-premium" onClick={() => setCurrentPage('config')}>
            Ir a Configuración
          </button>
        </div>
      </div>
    );
  }

  // Contar cuántos enfermeros activos totales tenemos en la planilla
  const personalCount = personal.length;

  const totalDays = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const totalFrancos = useMemo(() => (totalDays === 31 ? 9 : 8) + feriados.length, [totalDays, feriados]);

  return (
    <div className="main-content" style={{ maxWidth: '1280px', padding: '40px 24px' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div style={{ textAlign: 'left' }}>
          <span className="badge-tech badge-blue" style={{ marginBottom: '12px' }}>Planificación Operativa SADE</span>
          <h1 style={{ marginBottom: '6px' }}>Planilla de Turnos</h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
            Servicio: <strong style={{ color: 'var(--accent)' }}>{currentSpecialty?.especialidad}</strong> · Camas: {dotacion.profesionales + dotacion.auxiliares} planificables · Período: {month.toString().padStart(2, '0')}/{year}
          </p>
        </div>
        
        {/* Botonera de control */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary-tech" 
            onClick={() => {
              if (window.confirm('¿Está seguro de reiniciar la planilla? Se perderán todos los turnos asignados.')) {
                limpiarPlanilla();
              }
            }}
            style={{ borderColor: 'var(--accent5)', color: 'var(--accent5)' }}
          >
            ⚠️ Reiniciar
          </button>
          <button className="btn-secondary-tech" onClick={() => setCurrentPage('dashboard')}>
            📊 Métricas
          </button>
          <button 
            className="btn-premium" 
            onClick={exportToPdf}
            style={{ padding: '0 16px', height: '42px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--display)', fontSize: '13.5px', fontWeight: 'bold' }}
          >
            🖨️ Exportar PDF
          </button>
        </div>
      </div>

      {/* Barra de Metadatos y Objetivos de Cobertura */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '16px', 
          marginBottom: '24px', 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          padding: '16px', 
          borderRadius: '8px' 
        }}
      >
        <div style={{ borderRight: '1px solid var(--border)', paddingRight: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'var(--mono)', display: 'block' }}>
            Dotación Requerida (Z)
          </span>
          <strong style={{ fontSize: '20px', color: 'var(--accent)', fontFamily: 'var(--display)' }}>
            {dotacion.Z_ceil} enfermeros
          </strong>
        </div>

        <div style={{ borderRight: '1px solid var(--border)', paddingRight: '12px', paddingLeft: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'var(--mono)', display: 'block' }}>
            Personal Planificable
          </span>
          <strong style={{ fontSize: '20px', color: 'var(--heading)', fontFamily: 'var(--display)' }}>
            {personalCount} activos
          </strong>
        </div>

        <div style={{ borderRight: '1px solid var(--border)', paddingRight: '12px', paddingLeft: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'var(--mono)', display: 'block' }}>
            Cobertura por Turno (Req)
          </span>
          <span style={{ fontSize: '13.5px', fontFamily: 'var(--mono)', color: 'var(--text2)', display: 'block', marginTop: '4px' }}>
            M: <strong style={{ color: 'var(--accent)' }}>{dotacion.Q1}</strong> · 
            T: <strong style={{ color: 'var(--accent2)' }}>{dotacion.Q2}</strong> · 
            N: <strong style={{ color: 'var(--accent4)' }}>{dotacion.Q3}</strong>
          </span>
        </div>

        <div style={{ paddingLeft: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'var(--mono)', display: 'block' }}>
            Meta Francos Mensual
          </span>
          <strong style={{ fontSize: '20px', color: 'var(--accent3)', fontFamily: 'var(--display)' }}>
            {totalFrancos} francos
          </strong>
        </div>
      </div>

      {/* LA GRILLA PRINCIPAL */}
      <ShiftGrid />

      {/* LEYENDA Y CONTROL DE TIPOS */}
      <div 
        style={{ 
          marginTop: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px', 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          padding: '16px 20px', 
          borderRadius: '8px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 'bold' }}>
            Referencias:
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
            <span className="mono-data" style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>M</span>
            Mañana
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
            <span className="mono-data" style={{ background: 'rgba(129, 140, 248, 0.12)', border: '1px solid rgba(129, 140, 248, 0.3)', color: 'var(--accent2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>T</span>
            Tarde
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
            <span className="mono-data" style={{ background: 'rgba(251, 146, 60, 0.12)', border: '1px solid rgba(251, 146, 60, 0.3)', color: 'var(--accent4)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>N</span>
            Noche
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
            <span className="mono-data" style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', color: 'var(--accent3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>F</span>
            Franco
          </span>
        </div>
        
        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
          Atajos de teclado: Haga click sobre una celda y presione <kbd style={{ padding: '2px 4px', background: 'var(--surface2)', borderRadius: '4px', color: 'var(--text2)', border: '1px solid var(--border)' }}>M</kbd>, <kbd style={{ padding: '2px 4px', background: 'var(--surface2)', borderRadius: '4px', color: 'var(--text2)', border: '1px solid var(--border)' }}>T</kbd>, <kbd style={{ padding: '2px 4px', background: 'var(--surface2)', borderRadius: '4px', color: 'var(--text2)', border: '1px solid var(--border)' }}>N</kbd>, <kbd style={{ padding: '2px 4px', background: 'var(--surface2)', borderRadius: '4px', color: 'var(--text2)', border: '1px solid var(--border)' }}>F</kbd> o <kbd style={{ padding: '2px 4px', background: 'var(--surface2)', borderRadius: '4px', color: 'var(--text2)', border: '1px solid var(--border)' }}>Backspace</kbd>.
        </div>
      </div>

    </div>
  );
};

export default GridPage;
