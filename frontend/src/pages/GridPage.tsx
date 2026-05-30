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
    personal,
    agregarEnfermero,
    eliminarEnfermero,
    editarEnfermero,
    errorGeneracion
  } = useGridStore();

  const { exportToPdf } = usePdf();

  const [showRosterModal, setShowRosterModal] = React.useState(false);
  const [formName, setFormName] = React.useState('');
  const [formApellido, setFormApellido] = React.useState('');
  const [formDni, setFormDni] = React.useState('');
  const [formMatricula, setFormMatricula] = React.useState('');
  const [formNivel, setFormNivel] = React.useState<'LICENCIADO' | 'ENFERMERO_PROFESIONAL' | 'ENFERMERO_ESPECIALISTA' | 'AUXILIAR'>('ENFERMERO_PROFESIONAL');
  const [formTurnoFijo, setFormTurnoFijo] = React.useState<'M' | 'T' | 'N' | 'ROTATIVO'>('ROTATIVO');
  const [formAntiguedad, setFormAntiguedad] = React.useState(0);
  const [formCompensatorio, setFormCompensatorio] = React.useState(0);

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

  // Paso 4 — Bloqueo si personal !== Z
  if (personalCount !== dotacion.Z_ceil) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', maxWidth: '1280px', padding: '40px 24px' }}>
        <div className="card-premium" style={{ maxWidth: '550px', width: '100%', padding: '40px', border: '1px solid rgba(56, 189, 248, 0.4)', background: 'var(--surface)' }}>
          <span style={{ fontSize: '48px', marginBottom: '20px', display: 'block' }}>👥</span>
          <h2 style={{ marginBottom: '16px', color: 'var(--accent)', fontFamily: 'var(--display)' }}>Paso final: Asignar al Personal</h2>
          <p style={{ color: 'var(--text2)', marginBottom: '28px', fontSize: '15px', lineHeight: '1.6' }}>
            Para que el motor de SADE pueda armar la planilla, necesitas tener exactamente a los enfermeros que calculaste.
            <br/><br/>
            Actualmente tenés <strong style={{ color: '#f87171' }}>{personalCount}</strong> cargados en la lista, pero SADE determinó que necesitás <strong style={{ color: 'var(--accent3)' }}>{dotacion.Z_ceil}</strong>.
            ¡Hacé click en "Ajustar Nómina" para agregar o quitar los que hagan falta!
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn-premium" onClick={() => setShowRosterModal(true)}>
              👥 Ajustar Nómina ({personalCount}/{dotacion.Z_ceil})
            </button>
            <button className="btn-secondary-tech" onClick={() => setCurrentPage('config')}>
              ⚙️ Volver a Configuración
            </button>
          </div>
        </div>

        {/* Modal de Nómina incorporado para permitir el ajuste inmediato del personal desde esta misma vista de bloqueo */}
        {showRosterModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 16, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="card-premium" style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(10, 15, 30, 0.7)'
              }}>
                <div>
                  <span className="badge-tech badge-blue" style={{ marginBottom: '4px' }}>Gestión de Personal</span>
                  <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: '18px', fontWeight: 'bold' }}>Nómina del Servicio</h3>
                </div>
                <button 
                  onClick={() => setShowRosterModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text3)',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '24px',
                padding: '24px',
                overflowY: 'auto',
                flex: 1
              }}>
                {/* Listado de Personal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--heading)', fontSize: '14px', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                    Enfermeros Activos ({personal.length})
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '50vh', paddingRight: '8px' }}>
                    {personal.map((enfermero) => {
                      const formatLabel = enfermero.nivel_formacion === 'LICENCIADO' 
                        ? 'Licenciado/Esp.' 
                        : enfermero.nivel_formacion === 'ENFERMERO_PROFESIONAL' 
                        ? 'Enf. Profesional' 
                        : enfermero.nivel_formacion === 'ENFERMERO_ESPECIALISTA'
                        ? 'Especialista'
                        : 'Enfermero';
                      
                      return (
                        <div 
                          key={enfermero.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            background: 'rgba(56, 189, 248, 0.02)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ textAlign: 'left' }}>
                            <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--text)' }}>
                              {enfermero.apellido}, {enfermero.nombre}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                              M. {enfermero.matricula} · {formatLabel}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                              value={enfermero.turno_fijo || 'ROTATIVO'}
                              onChange={(e) => {
                                const val = e.target.value;
                                editarEnfermero({
                                  ...enfermero,
                                  turno_fijo: val === 'ROTATIVO' ? null : val as any
                                });
                                setTimeout(() => inicializarPlanilla(month, year, feriados), 50);
                              }}
                              style={{
                                padding: '4px 6px',
                                background: 'var(--surface2)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'var(--text)',
                                fontSize: '11px',
                                outline: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="ROTATIVO">ROTATIVO / SIN FIJO</option>
                              <option value="M">MAÑANA (M)</option>
                              <option value="T">TARDE (T)</option>
                              <option value="N">NOCHE (N)</option>
                            </select>

                            <button
                              onClick={() => {
                                if (window.confirm(`¿Desea quitar a ${enfermero.nombre} ${enfermero.apellido} de la nómina?`)) {
                                  eliminarEnfermero(enfermero.id);
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#f87171',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {personal.length === 0 && (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                        No hay personal registrado en este servicio.
                      </div>
                    )}
                  </div>
                </div>

                {/* Agregar Personal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--heading)', fontSize: '14px', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                    Ingresar Nuevo Integrante
                  </h4>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!formName || !formApellido || !formMatricula) {
                        alert('Por favor complete Nombre, Apellido y Matrícula.');
                        return;
                      }

                      const newEnfermero = {
                        id: `staff-${Date.now()}`,
                        nombre: formName,
                        apellido: formApellido,
                        dni: formDni || `${Math.floor(20 + Math.random() * 20)}.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}`,
                        matricula: formMatricula,
                        nivel_formacion: formNivel,
                        jornada_horas: 8,
                        turno_fijo: formTurnoFijo === 'ROTATIVO' ? null : formTurnoFijo,
                        antiguedad_anos: formAntiguedad,
                        compensatorio_pendiente: formCompensatorio
                      };

                      agregarEnfermero(newEnfermero as any);

                      // Reset form
                      setFormName('');
                      setFormApellido('');
                      setFormDni('');
                      setFormMatricula('');
                      setFormNivel('ENFERMERO_PROFESIONAL');
                      setFormTurnoFijo('ROTATIVO');
                      setFormAntiguedad(0);
                      setFormCompensatorio(0);
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Nombre *</label>
                        <input 
                          type="text" 
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ej: María"
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Apellido *</label>
                        <input 
                          type="text" 
                          value={formApellido}
                          onChange={(e) => setFormApellido(e.target.value)}
                          placeholder="Ej: García"
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text3)' }}>DNI</label>
                        <input 
                          type="text" 
                          value={formDni}
                          onChange={(e) => setFormDni(e.target.value)}
                          placeholder="Ej: 30.123.456"
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Matrícula *</label>
                        <input 
                          type="text" 
                          value={formMatricula}
                          onChange={(e) => setFormMatricula(e.target.value)}
                          placeholder="Ej: EP-101"
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Nivel de Formación</label>
                      <select
                        value={formNivel}
                        onChange={(e) => setFormNivel(e.target.value as any)}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                      >
                        <option value="LICENCIADO">Licenciado / Especialista</option>
                        <option value="ENFERMERO_PROFESIONAL">Enfermero Profesional</option>
                        <option value="AUXILIAR">Enfermero Auxiliar</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Turno Fijo</label>
                        <select
                          value={formTurnoFijo}
                          onChange={(e) => setFormTurnoFijo(e.target.value as any)}
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                        >
                          <option value="ROTATIVO">Rotativo (Sin Fijo)</option>
                          <option value="M">Mañana (M)</option>
                          <option value="T">Tarde (T)</option>
                          <option value="N">Noche (N)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Antigüedad (Años)</label>
                        <input 
                          type="number" 
                          value={formAntiguedad}
                          onChange={(e) => setFormAntiguedad(parseInt(e.target.value) || 0)}
                          placeholder="Ej: 5"
                          min="0"
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Compensatorios Trasladados (Opcional)</label>
                      <input 
                        type="number" 
                        value={formCompensatorio}
                        onChange={(e) => setFormCompensatorio(parseInt(e.target.value) || 0)}
                        placeholder="Francos compensatorios pendientes a saldar"
                        min="0"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                      />
                    </div>

                    <button 
                      type="submit"
                      className="btn-premium" 
                      style={{ marginTop: '14px', width: '100%', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--display)', fontSize: '13.5px', fontWeight: 'bold' }}
                    >
                      ＋ Agregar a la Nómina
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <button className="btn-secondary-tech" onClick={() => setShowRosterModal(true)}>
            👥 Nómina
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

      {errorGeneracion && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', color: '#f87171', marginBottom: '24px', fontFamily: 'var(--mono)', fontSize: '13px' }}>
          <strong>Error de Generación:</strong> {errorGeneracion}
        </div>
      )}

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

      {/* MODAL DE NÓMINA - PREMIUM TECH GLASS */}
      {showRosterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card-premium" style={{
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(10, 15, 30, 0.7)'
            }}>
              <div>
                <span className="badge-tech badge-blue" style={{ marginBottom: '4px' }}>Gestión de Personal</span>
                <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: '18px', fontWeight: 'bold' }}>Nómina del Servicio</h3>
              </div>
              <button 
                onClick={() => setShowRosterModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text3)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '24px',
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Listado de Personal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--heading)', fontSize: '14px', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                  Enfermeros Activos ({personal.length})
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '50vh', paddingRight: '8px' }}>
                  {personal.map((enfermero) => {
                    const formatLabel = enfermero.nivel_formacion === 'LICENCIADO' 
                      ? 'Licenciado/Esp.' 
                      : enfermero.nivel_formacion === 'ENFERMERO_PROFESIONAL' 
                      ? 'Enf. Profesional' 
                      : enfermero.nivel_formacion === 'ENFERMERO_ESPECIALISTA'
                      ? 'Especialista'
                      : 'Enfermero';
                    
                    return (
                      <div 
                        key={enfermero.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: 'rgba(56, 189, 248, 0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--text)' }}>
                            {enfermero.apellido}, {enfermero.nombre}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            M. {enfermero.matricula} · {formatLabel}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            value={enfermero.turno_fijo || 'ROTATIVO'}
                            onChange={(e) => {
                              const val = e.target.value;
                              editarEnfermero({
                                ...enfermero,
                                turno_fijo: val === 'ROTATIVO' ? null : val as any
                              });
                              setTimeout(() => inicializarPlanilla(month, year, feriados), 50);
                            }}
                            style={{
                              padding: '4px 6px',
                              background: 'var(--surface2)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              color: 'var(--text)',
                              fontSize: '11px',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="ROTATIVO">ROTATIVO / SIN FIJO</option>
                            <option value="M">MAÑANA (M)</option>
                            <option value="T">TARDE (T)</option>
                            <option value="N">NOCHE (N)</option>
                          </select>

                          <button
                            onClick={() => {
                              if (window.confirm(`¿Desea quitar a ${enfermero.nombre} ${enfermero.apellido} de la nómina?`)) {
                                eliminarEnfermero(enfermero.id);
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#f87171',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {personal.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                      No hay personal registrado en este servicio.
                    </div>
                  )}
                </div>
              </div>

              {/* Agregar Personal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--heading)', fontSize: '14px', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                  Ingresar Nuevo Integrante
                </h4>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!formName || !formApellido || !formMatricula) {
                      alert('Por favor complete Nombre, Apellido y Matrícula.');
                      return;
                    }

                    const newEnfermero = {
                      id: `staff-${Date.now()}`,
                      nombre: formName,
                      apellido: formApellido,
                      dni: formDni || `${Math.floor(20 + Math.random() * 20)}.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}`,
                      matricula: formMatricula,
                      nivel_formacion: formNivel,
                      jornada_horas: 8,
                      turno_fijo: formTurnoFijo === 'ROTATIVO' ? null : formTurnoFijo,
                      antiguedad_anos: formAntiguedad,
                      compensatorio_pendiente: formCompensatorio
                    };

                    agregarEnfermero(newEnfermero as any);

                    // Reset form
                    setFormName('');
                    setFormApellido('');
                    setFormDni('');
                    setFormMatricula('');
                    setFormNivel('ENFERMERO_PROFESIONAL');
                    setFormTurnoFijo('ROTATIVO');
                    setFormAntiguedad(0);
                    setFormCompensatorio(0);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Nombre *</label>
                      <input 
                        type="text" 
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ej: María"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Apellido *</label>
                      <input 
                        type="text" 
                        value={formApellido}
                        onChange={(e) => setFormApellido(e.target.value)}
                        placeholder="Ej: García"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text3)' }}>DNI</label>
                      <input 
                        type="text" 
                        value={formDni}
                        onChange={(e) => setFormDni(e.target.value)}
                        placeholder="Ej: 30.123.456"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Matrícula *</label>
                      <input 
                        type="text" 
                        value={formMatricula}
                        onChange={(e) => setFormMatricula(e.target.value)}
                        placeholder="Ej: EP-101"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Nivel de Formación</label>
                    <select
                      value={formNivel}
                      onChange={(e) => setFormNivel(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                    >
                      <option value="LICENCIADO">Licenciado / Especialista</option>
                      <option value="ENFERMERO_PROFESIONAL">Enfermero Profesional</option>
                      <option value="AUXILIAR">Enfermero Auxiliar</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Turno Fijo</label>
                      <select
                        value={formTurnoFijo}
                        onChange={(e) => setFormTurnoFijo(e.target.value as any)}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                      >
                        <option value="ROTATIVO">Rotativo (Sin Fijo)</option>
                        <option value="M">Mañana (M)</option>
                        <option value="T">Tarde (T)</option>
                        <option value="N">Noche (N)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Antigüedad (Años)</label>
                      <input 
                        type="number" 
                        value={formAntiguedad}
                        onChange={(e) => setFormAntiguedad(parseInt(e.target.value) || 0)}
                        placeholder="Ej: 5"
                        min="0"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Compensatorios Trasladados (Opcional)</label>
                    <input 
                      type="number" 
                      value={formCompensatorio}
                      onChange={(e) => setFormCompensatorio(parseInt(e.target.value) || 0)}
                      placeholder="Francos compensatorios pendientes a saldar"
                      min="0"
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="btn-premium" 
                    style={{ marginTop: '14px', width: '100%', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--display)', fontSize: '13.5px', fontWeight: 'bold' }}
                  >
                    ＋ Agregar a la Nómina
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GridPage;
