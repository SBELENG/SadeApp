import React, { useMemo } from 'react';
import { useConfigStore } from '../store/configStore';
import { ESPECIALIDADES_INDICES } from '../utils/constants/indices';
import type { EspecialidadIndex } from '../utils/constants/indices';

export const ConfigPage: React.FC = () => {
  const {
    serviceKey,
    beds,
    indexI,
    nivel,
    year,
    month,
    feriados,
    isCritical,
    ratio,
    unidades,
    ratioElegido,
    setServiceKey,
    setBeds,
    setIndexI,
    setNivel,
    setYearAndMonth,
    toggleFeriado,
    setUnidades,
    ejecutarCalculo
  } = useConfigStore();

  // Obtener especialidad actual
  const currentSpecialty = useMemo(() => ESPECIALIDADES_INDICES[serviceKey], [serviceKey]);

  // Días del mes (1-indexed month, passing 0 as day of next month gives last day of current)
  const totalDays = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // Lista de días del mes
  const daysArray = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [totalDays]);

  // Francos base (REQ-001)
  const francosBase = useMemo(() => {
    return totalDays === 31 ? 9 : 8;
  }, [totalDays]);

  // Total de francos requeridos en el mes (REQ-002)
  const totalFrancosRequeridos = useMemo(() => {
    return francosBase + feriados.length;
  }, [francosBase, feriados]);

  // Obtener rango del slider
  const sliderBounds = useMemo(() => {
    if (currentSpecialty && currentSpecialty.minI !== undefined && currentSpecialty.maxI !== undefined) {
      return { min: currentSpecialty.minI, max: currentSpecialty.maxI };
    }
    return { min: 1.0, max: 15.0 };
  }, [currentSpecialty]);

  // Filtrado reactivo de especialidades agrupadas por categoría
  const groupedSpecialties = useMemo(() => {
    const maxLevel = nivel === 'segundo' ? 2 : 3;
    const groups: Record<string, [string, EspecialidadIndex][]> = {
      'Clínicas': [],
      'Quirúrgicas': [],
      'Pediátricas': [],
      'Áreas quirúrgicas por ratio': [],
      'Áreas críticas por ratio': [],
      'Consulta externa por ratio': []
    };

    Object.entries(ESPECIALIDADES_INDICES).forEach(([key, item]) => {
      if (item.nivelMinimo <= maxLevel) {
        groups[item.categoria].push([key, item]);
      }
    });

    // Filtrar grupos vacíos
    return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => items.length > 0)
    );
  }, [nivel]);

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServiceKey(e.target.value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearAndMonth(year, parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearAndMonth(parseInt(e.target.value), month);
  };

  return (
    <div className="main-content" style={{ maxWidth: '1100px' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '40px', textAlign: 'left' }}>
        <span className="badge-tech badge-blue" style={{ marginBottom: '12px' }}>Fase 2 — Motor de Cálculo</span>
        <h1 style={{ marginBottom: '8px' }}>Configuración del Mes</h1>
        <p style={{ color: 'var(--text2)', fontSize: '16px', maxWidth: '700px' }}>
          Parametrice las variables de internación y configure los feriados para calcular automáticamente la dotación de personal requerida.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        
        {/* COLUMNA 1: Parámetros */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', color: 'var(--accent)' }}>
            ⚙️ Variables del Servicio
          </h2>

          {/* Servicio */}
          <div>
            <label className="label-tech">Servicio / Especialidad</label>
            <select 
              className="input-tech select-tech" 
              value={serviceKey} 
              onChange={handleServiceChange}
              style={{
                borderColor: !serviceKey ? 'var(--accent5)' : 'var(--border)'
              }}
            >
              <option value="">-- Seleccione una Especialidad --</option>
              {Object.entries(groupedSpecialties).map(([groupName, items]) => (
                <optgroup key={groupName} label={groupName}>
                  {items.map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.especialidad}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Alerta de inconsistencia si cambia la complejidad */}
            {!serviceKey && (
              <span style={{ fontSize: '12.5px', color: 'var(--accent5)', marginTop: '8px', display: 'block', fontWeight: 'bold' }}>
                ⚠️ La especialidad seleccionada no está disponible para este nivel de complejidad.
              </span>
            )}

            {currentSpecialty && currentSpecialty.tipoCalculo === 'indice' && currentSpecialty.perfilRequerido && (
              <span style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', display: 'block' }}>
                Perfil requerido: <strong style={{ color: 'var(--accent)' }}>{currentSpecialty.perfilRequerido}</strong>
              </span>
            )}
            {currentSpecialty && currentSpecialty.tipoCalculo === 'ratio' && (
              <span style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', display: 'block' }}>
                Tipo de Cálculo: <strong style={{ color: 'var(--accent4)' }}>Estándar por Ratio Fijo (Anexo 1 UNRC)</strong>
              </span>
            )}
          </div>

          {/* Renglón Camas y Complejidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Nivel de Complejidad */}
            <div>
              <label className="label-tech">Nivel de Complejidad</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text)' }}>
                  <input 
                    type="radio" 
                    name="nivel"
                    checked={nivel === 'segundo'}
                    onChange={() => setNivel('segundo')}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  2do Nivel
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="nivel"
                    checked={nivel === 'tercero'}
                    onChange={() => setNivel('tercero')}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  3er Nivel
                </label>
              </div>
            </div>

            {/* Camas / Unidades */}
            {currentSpecialty && currentSpecialty.tipoCalculo === 'ratio' ? (
              <div>
                <label className="label-tech">Cantidad de Unidades</label>
                <input 
                  type="number" 
                  className="input-tech" 
                  min="1" 
                  value={unidades} 
                  onChange={(e) => setUnidades(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="salas, máquinas, consultorios..."
                />
              </div>
            ) : (
              <div>
                <label className="label-tech">Camas Ocupadas / Disponibles</label>
                <input 
                  type="number" 
                  className="input-tech" 
                  min="1" 
                  value={beds} 
                  onChange={(e) => setBeds(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            )}
          </div>

          {/* Índice I o Ratios de Personal */}
          {currentSpecialty && currentSpecialty.tipoCalculo === 'ratio' ? (
            <div style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div>
                <label className="label-tech" style={{ color: 'var(--accent4)' }}>Estándar de Ratios de Personal</label>
                <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
                  Este servicio no utiliza índice horario sino ratios de personal. Seleccione la cobertura del ratio a aplicar:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '4px' }}>RATIO MÍNIMO (De):</span>
                    <input type="text" className="input-tech" value={currentSpecialty.ratioMin || ''} readOnly style={{ opacity: 0.8 }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '4px' }}>RATIO MÁXIMO (A):</span>
                    <input type="text" className="input-tech" value={currentSpecialty.ratioMax || ''} readOnly style={{ opacity: 0.8 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    type="button"
                    className={`btn-secondary-tech ${ratioElegido === 'min' ? 'active' : ''}`}
                    style={{ flex: 1, borderColor: ratioElegido === 'min' ? 'var(--accent)' : 'var(--border)', color: ratioElegido === 'min' ? 'var(--accent)' : 'var(--text)' }}
                    onClick={() => useConfigStore.setState({ ratioElegido: 'min' })}
                  >
                    Estándar Mínimo (De)
                  </button>
                  <button 
                    type="button"
                    className={`btn-secondary-tech ${ratioElegido === 'max' ? 'active' : ''}`}
                    style={{ flex: 1, borderColor: ratioElegido === 'max' ? 'var(--accent)' : 'var(--border)', color: ratioElegido === 'max' ? 'var(--accent)' : 'var(--text)' }}
                    onClick={() => useConfigStore.setState({ ratioElegido: 'max' })}
                  >
                    Estándar Máximo (A)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {isCritical ? (
                <div>
                  <label className="label-tech" style={{ color: 'var(--accent4)' }}>Ratio Cama/Enfermero (UCI)</label>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
                    Las áreas críticas se calculan directamente en base al ratio de pacientes por enfermero por turno (Ley 24.004).
                  </p>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                      type="button"
                      className={`btn-secondary-tech ${ratio === '1:2' ? 'active' : ''}`}
                      style={{ flex: 1, borderColor: ratio === '1:2' ? 'var(--accent)' : 'var(--border)', color: ratio === '1:2' ? 'var(--accent)' : 'var(--text)' }}
                      onClick={() => useConfigStore.setState({ ratio: '1:2' })}
                    >
                      Ratio 1:2 (Medio)
                    </button>
                    <button 
                      type="button"
                      className={`btn-secondary-tech ${ratio === '1:1' ? 'active' : ''}`}
                      style={{ flex: 1, borderColor: ratio === '1:1' ? 'var(--accent)' : 'var(--border)', color: ratio === '1:1' ? 'var(--accent)' : 'var(--text)' }}
                      onClick={() => useConfigStore.setState({ ratio: '1:1' })}
                    >
                      Ratio 1:1 (Severo)
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="label-tech">Horas de Cuidado Directo (I)</label>
                    <span className="mono-data" style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px' }}>
                      {indexI.toFixed(1)} hs / paciente
                    </span>
                  </div>
                  <input 
                    type="range" 
                    className="slider-tech"
                    min={sliderBounds.min}
                    max={sliderBounds.max}
                    step="0.1"
                    value={indexI}
                    disabled={!serviceKey}
                    onChange={(e) => setIndexI(parseFloat(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
                    <span>Min: {sliderBounds.min.toFixed(1)} hs</span>
                    <span>Rango Especialidad</span>
                    <span>Max: {sliderBounds.max.toFixed(1)} hs</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Renglón Mes y Año */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div>
              <label className="label-tech">Mes Planificado</label>
              <select className="input-tech select-tech" value={month} onChange={handleMonthChange}>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>
            <div>
              <label className="label-tech">Año</label>
              <select className="input-tech select-tech" value={year} onChange={handleYearChange}>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
          </div>

        </div>

        {/* COLUMNA 2: Feriados */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', color: 'var(--accent4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📅 Feriados y Descansos</span>
              <span className="badge-tech badge-orange">{feriados.length} Feriados</span>
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '12px' }}>
              Haga click sobre los días en el calendario para marcarlos o desmarcarlos como feriados nacionales. Esto afecta dinámicamente el derecho a descansos adicionales (REQ-002).
            </p>
          </div>

          {/* Calendario de días */}
          <div style={{ background: '#080c16', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: '11px', fontFamily: 'var(--mono)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
              <span>SELECCIONE LOS DÍAS DEL MES</span>
              <span>TOTAL DÍAS: {totalDays}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {daysArray.map((day) => {
                const isFeriado = feriados.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleFeriado(day)}
                    style={{
                      height: '38px',
                      borderRadius: '6px',
                      border: isFeriado ? '1px solid var(--accent4)' : '1px solid var(--border)',
                      background: isFeriado ? 'rgba(251, 146, 60, 0.15)' : 'var(--surface)',
                      color: isFeriado ? 'var(--accent4)' : 'var(--text)',
                      fontFamily: 'var(--mono)',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isFeriado) e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isFeriado) e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estadísticas de Francos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
              <span style={{ color: 'var(--text2)' }}>Base de Francos (REQ-001):</span>
              <strong className="mono-data">{francosBase} francos</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
              <span style={{ color: 'var(--text2)' }}>Feriados marcados (REQ-002):</span>
              <strong className="mono-data" style={{ color: 'var(--accent4)' }}>+{feriados.length} francos</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
              <span style={{ color: 'var(--heading)', fontWeight: '600' }}>Meta Mensual de Francos:</span>
              <strong className="mono-data" style={{ color: 'var(--accent3)', fontSize: '16px' }}>{totalFrancosRequeridos} francos</strong>
            </div>
          </div>

        </div>

      </div>

      {/* Botón de envío */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
        <button 
          type="button" 
          className="btn-premium" 
          onClick={ejecutarCalculo}
          disabled={!serviceKey}
          style={{ width: '280px', height: '52px', opacity: !serviceKey ? 0.6 : 1, cursor: !serviceKey ? 'not-allowed' : 'pointer' }}
        >
          <span>Calcular Dotación</span>
          <span style={{ fontSize: '16px' }}>→</span>
        </button>
      </div>

    </div>
  );
};

export default ConfigPage;
