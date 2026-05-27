import React, { useMemo } from 'react';
import { useGridStore } from '../../store/gridStore';
import { useConfigStore } from '../../store/configStore';
import DayHeader from './DayHeader';
import ShiftCell from './ShiftCell';
import FrancoCounter from './FrancoCounter';

export const ShiftGrid: React.FC = () => {
  const { personal, turnos, diasMes, mes, anio } = useGridStore();
  const feriados = useConfigStore((state) => state.feriados);

  // Crear array con los días del mes
  const daysArray = useMemo(() => {
    return Array.from({ length: diasMes }, (_, i) => i + 1);
  }, [diasMes]);

  return (
    <div 
      className="card-premium"
      style={{
        padding: '0',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: '0 15px 40px -10px rgba(0, 0, 0, 0.8)'
      }}
    >
      {/* Scroll horizontal suave */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table 
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            minWidth: '1200px'
          }}
        >
          <thead>
            <tr style={{ background: 'rgba(26, 34, 53, 0.5)' }}>
              {/* Encabezado fijo Personal */}
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 20,
                  background: '#111827',
                  borderBottom: '1px solid var(--border2)',
                  padding: '16px 20px',
                  textAlign: 'left',
                  width: '180px',
                  minWidth: '180px',
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'var(--text3)'
                }}
              >
                Personal
              </th>
              
              {/* Encabezados de días */}
              {daysArray.map((day) => (
                <DayHeader
                  key={day}
                  day={day}
                  month={mes}
                  year={anio}
                  isFeriado={feriados.includes(day)}
                />
              ))}

              {/* Encabezado fijo Francos */}
              <th
                style={{
                  borderBottom: '1px solid var(--border2)',
                  borderLeft: '1px solid var(--border)',
                  padding: '16px',
                  textAlign: 'center',
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'var(--accent3)',
                  width: '100px',
                  minWidth: '100px'
                }}
              >
                Francos
              </th>
            </tr>
          </thead>
          
          <tbody>
            {personal.map((enfermero) => {
              const matches = turnos[enfermero.id] || {};
              const badgeType = enfermero.nivel_formacion === 'AUXILIAR' ? 'badge-orange' : 'badge-blue';
              const badgeText = enfermero.nivel_formacion === 'LICENCIADO' 
                ? 'LIC' 
                : enfermero.nivel_formacion === 'ENFERMERO_ESPECIALISTA'
                ? 'ESP'
                : enfermero.nivel_formacion === 'ENFERMERO_PROFESIONAL'
                ? 'PRO'
                : 'AUX';

              return (
                <tr key={enfermero.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Celda fija de nombre del personal */}
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      background: '#111827',
                      padding: '12px 20px',
                      borderRight: '1px solid var(--border)',
                      fontWeight: '500',
                      color: 'var(--text)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13.5px', color: 'var(--heading)' }}>
                        {enfermero.apellido}, {enfermero.nombre}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge-tech ${badgeType}`} style={{ fontSize: '8.5px', padding: '2px 5px', fontWeight: 'bold' }}>
                          {badgeText}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                          M. {enfermero.matricula}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Celdas de turnos de la fila */}
                  {daysArray.map((day) => {
                    // Verificar si es fin de semana
                    const date = new Date(anio, mes - 1, day);
                    const dayOfWeek = date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    return (
                      <ShiftCell
                        key={day}
                        personalId={enfermero.id}
                        dia={day}
                        value={matches[day] || ''}
                        isWeekend={isWeekend}
                        isFeriado={feriados.includes(day)}
                      />
                    );
                  })}

                  {/* Contador de francos al final de la fila */}
                  <FrancoCounter
                    personalId={enfermero.id}
                    compensatoriosTrasladados={enfermero.compensatorio_pendiente}
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftGrid;
