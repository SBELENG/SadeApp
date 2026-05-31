import React, { useMemo } from 'react';
import { useGridStore } from '../../store/gridStore';
import { useConfigStore } from '../../store/configStore';
import DayHeader from './DayHeader';
import ShiftCell from './ShiftCell';
import FrancoCounter from './FrancoCounter';
import { SwapContext } from './SwapContext';
import type { SwapSelection } from './SwapContext';

// ─── Badge visual por grupo ───────────────────────────────────────────────────
const GROUP_CONFIG = {
  M: { label: 'GRUPO MAÑANA', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.07)', border: 'rgba(245, 158, 11, 0.25)' },
  T: { label: 'GRUPO TARDE',  color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.07)', border: 'rgba(56, 189, 248, 0.25)' },
  N: { label: 'GRUPO NOCHE',  color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.07)', border: 'rgba(167, 139, 250, 0.25)' },
};

export const ShiftGrid: React.FC = () => {
  const { personal, turnos, diasMes, mes, anio, planillaActual } = useGridStore();
  const feriados = useConfigStore((state) => state.feriados);

  // Estado de swap compartido entre celdas
  const [swapSelected, setSwapSelected] = React.useState<SwapSelection | null>(null);
  const intercambiarCeldas = useGridStore((state) => state.intercambiarCeldas);

  // Crear array con los días del mes
  const daysArray = useMemo(() => {
    return Array.from({ length: diasMes }, (_, i) => i + 1);
  }, [diasMes]);

  // Agrupar el personal por grupo si hay planilla activa
  const { grupoM, grupoT, grupoN } = useMemo(() => {
    if (planillaActual && planillaActual.grupos) {
      const grupoM = personal.filter((p) => Array.isArray(planillaActual.grupos.mañana) && planillaActual.grupos.mañana.includes(p.id));
      const grupoT = personal.filter((p) => Array.isArray(planillaActual.grupos.tarde) && planillaActual.grupos.tarde.includes(p.id));
      const grupoN = personal.filter((p) => Array.isArray(planillaActual.grupos.noche) && planillaActual.grupos.noche.includes(p.id));
      return { grupoM, grupoT, grupoN };
    }
    // Fallback: usar turno_fijo del personal
    const grupoM = personal.filter((p) => p.turno_fijo === 'M');
    const grupoT = personal.filter((p) => p.turno_fijo === 'T');
    const grupoN = personal.filter((p) => p.turno_fijo === 'N');
    const sinGrupo = personal.filter((p) => !p.turno_fijo);
    return { grupoM: [...grupoM, ...sinGrupo], grupoT, grupoN };
  }, [personal, planillaActual]);

  // Handler de swap: se llama desde ShiftCell cuando el usuario hace click en una segunda celda
  const handleCellClick = (personalId: string, dia: number) => {
    if (!swapSelected) {
      setSwapSelected({ personalId, dia });
      return;
    }

    // Si hace click en la misma celda, cancelar selección
    if (swapSelected.personalId === personalId && swapSelected.dia === dia) {
      setSwapSelected(null);
      return;
    }

    // Intentar swap
    const exito = intercambiarCeldas(
      swapSelected.personalId,
      swapSelected.dia,
      personalId,
      dia
    );

    if (!exito) {
      // Feedback visual: la validación rechazó el swap
      window.alert(
        '⛔ Intercambio bloqueado\n\nEl intercambio viola una regla:\n' +
        '• Solo se pueden intercambiar celdas del mismo grupo de turno.\n' +
        '• El resultado no puede dejar un día sin cobertura.\n' +
        '• La fila fija de turno debe respetarse.'
      );
    }

    setSwapSelected(null);
  };

  // Calcular la suma de profesionales en un día y turno específico
  const calcTotalDia = (dia: number, turnoStr: string) => {
    let count = 0;
    personal.forEach((p) => {
      const t = turnos[p.id]?.[dia];
      if (t && typeof t.tipo === 'string' && t.tipo.includes(turnoStr)) {
        count++;
      } else if (typeof t === 'string' && t.includes(turnoStr)) {
        count++; // Fallback por si t es string de código viejo
      }
    });
    return count;
  };

  // Renderiza el encabezado de grupo (separador entre grupos)
  const renderGroupHeader = (turno: 'M' | 'T' | 'N', count: number, colSpan: number) => {
    const cfg = GROUP_CONFIG[turno];
    return (
      <tr key={`sep-${turno}`}>
        <td
          colSpan={colSpan + 2}
          style={{
            padding: '8px 20px',
            background: cfg.bg,
            borderTop: `1px solid ${cfg.border}`,
            borderBottom: `1px solid ${cfg.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                fontWeight: 'bold',
                color: cfg.color,
                letterSpacing: '1.5px',
              }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                color: 'var(--text3)',
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 8px',
                borderRadius: '999px',
                border: `1px solid ${cfg.border}`,
              }}
            >
              {count} {count === 1 ? 'persona' : 'personas'}
            </span>
            {swapSelected && (
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  color: '#fbbf24',
                  marginLeft: 'auto',
                  padding: '2px 8px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '999px',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                🔄 Modo Intercambio — Seleccioná la segunda celda (ESC para cancelar)
              </span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Renderiza todas las filas de un grupo
  const renderGroupRows = (
    grupoPersonal: typeof personal,
    turno: 'M' | 'T' | 'N'
  ) => {
    return grupoPersonal.map((enfermero) => {
      const matches = turnos[enfermero.id] || {};
      const badgeType = enfermero.nivel_formacion === 'AUXILIAR' ? 'badge-orange' : 'badge-blue';
      const badgeText =
        enfermero.nivel_formacion === 'LICENCIADO'
          ? 'LIC'
          : enfermero.nivel_formacion === 'ENFERMERO_ESPECIALISTA'
          ? 'ESP'
          : enfermero.nivel_formacion === 'ENFERMERO_PROFESIONAL'
          ? 'PRO'
          : 'AUX';

      const cfg = GROUP_CONFIG[turno];
      const isSwapSource =
        swapSelected?.personalId === enfermero.id ? true : false;

      return (
        <tr
          key={enfermero.id}
          style={{
            borderBottom: '1px solid var(--border)',
            background: isSwapSource ? 'rgba(251, 191, 36, 0.04)' : undefined,
            transition: 'background 0.2s ease',
          }}
        >
          {/* Celda fija de nombre */}
          <td
            style={{
              position: 'sticky',
              left: 0,
              zIndex: 10,
              background: isSwapSource ? 'rgba(40, 35, 15, 0.98)' : '#111827',
              padding: '10px 20px',
              borderRight: `1px solid ${isSwapSource ? 'rgba(251, 191, 36, 0.4)' : 'var(--border)'}`,
              fontWeight: '500',
              color: 'var(--text)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', color: 'var(--heading)' }}>
                {enfermero.apellido}, {enfermero.nombre}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  className={`badge-tech ${badgeType}`}
                  style={{ fontSize: '8px', padding: '2px 4px', fontWeight: 'bold' }}
                >
                  {badgeText}
                </span>
                {/* Badge de grupo */}
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '8px',
                    color: cfg.color,
                    padding: '1px 4px',
                    border: `1px solid ${cfg.border}`,
                    borderRadius: '4px',
                    background: cfg.bg,
                    fontWeight: 'bold',
                  }}
                >
                  {turno}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {enfermero.matricula}
                </span>
              </div>
            </div>
          </td>

          {/* Celdas de turnos */}
          {daysArray.map((day) => {
            const date = new Date(anio, mes - 1, day);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSwapTarget =
              swapSelected !== null &&
              swapSelected.personalId !== enfermero.id &&
              enfermero.turno_fijo === personal.find((p) => p.id === swapSelected.personalId)?.turno_fijo;

            // BUG-B FIX: esCompensatorio se evalúa en tiempo real combinando:
            // 1) si el día es feriado (fuente: configStore.feriados, reactivo)
            // 2) si el turno asignado es laboral (M, T o N)
            // No depende solo de planillaActual.celdas para actualizarse ante cambios de feriados.
            const turnoDelDia = matches[day] || '';
            const esDiaFeriado = Array.isArray(feriados) && feriados.includes(day);
            const esTurnoLaboral = turnoDelDia === 'M' || turnoDelDia === 'T' || turnoDelDia === 'N';
            const esCompensatorio = esDiaFeriado && esTurnoLaboral;


            return (
              <ShiftCell
                key={day}
                personalId={enfermero.id}
                dia={day}
                mes={mes}
                año={anio}
                value={matches[day] || ''}
                isWeekend={isWeekend}
                isFeriado={Array.isArray(feriados) && feriados.indexOf(day) !== -1}
                esCompensatorio={esCompensatorio}
                isSwapSource={swapSelected?.personalId === enfermero.id && swapSelected?.dia === day}
                isSwapTarget={isSwapTarget}
                onSwapClick={handleCellClick}
              />
            );
          })}

          {/* Contador de francos */}
          <FrancoCounter
            personalId={enfermero.id}
            compensatoriosTrasladados={enfermero.compensatorio_pendiente}
          />
        </tr>
      );
    });
  };

  const colSpan = daysArray.length;

  return (
    <SwapContext.Provider value={{ selected: swapSelected, setSelected: setSwapSelected }}>
      {/* Barra de modo swap cuando está activa */}
      {swapSelected && (
        <div
          style={{
            padding: '10px 20px',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: '#fbbf24' }}>
            🔄 Modo Intercambio activo — Seleccioná la segunda celda del mismo grupo para intercambiar
          </span>
          <button
            onClick={() => setSwapSelected(null)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              padding: '4px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
            }}
          >
            ESC / Cancelar
          </button>
        </div>
      )}

      <div
        className="card-premium"
        style={{
          padding: '0',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 15px 40px -10px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              minWidth: '1200px',
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(26, 34, 53, 0.5)' }}>
                {/* Encabezado Personal */}
                <th
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 20,
                    background: '#111827',
                    borderBottom: '1px solid var(--border2)',
                    padding: '14px 20px',
                    textAlign: 'left',
                    width: '195px',
                    minWidth: '195px',
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: 'var(--text3)',
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
                    isFeriado={Array.isArray(feriados) && feriados.includes(day)}
                  />
                ))}

                {/* Encabezado Francos */}
                <th
                  style={{
                    borderBottom: '1px solid var(--border2)',
                    borderLeft: '1px solid var(--border)',
                    padding: '14px 16px',
                    textAlign: 'center',
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: 'var(--accent3)',
                    width: '90px',
                    minWidth: '90px',
                  }}
                >
                  Francos
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Grupo Mañana */}
              {grupoM.length > 0 && (
                <>
                  {renderGroupHeader('M', grupoM.length, colSpan)}
                  {renderGroupRows(grupoM, 'M')}
                </>
              )}

              {/* Grupo Tarde */}
              {grupoT.length > 0 && (
                <>
                  {renderGroupHeader('T', grupoT.length, colSpan)}
                  {renderGroupRows(grupoT, 'T')}
                </>
              )}

              {/* Grupo Noche */}
              {grupoN.length > 0 && (
                <>
                  {renderGroupHeader('N', grupoN.length, colSpan)}
                  {renderGroupRows(grupoN, 'N')}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SwapContext.Provider>
  );
};

export default ShiftGrid;
