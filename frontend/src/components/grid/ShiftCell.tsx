import React, { useState, useRef, useEffect } from 'react';
import { useGridStore } from '../../store/gridStore';
import type { TurnoTipo } from '../../store/gridStore';
import { useConfigStore } from '../../store/configStore';
import { useShiftValidation, validarTurnoCelda } from '../../hooks/useShiftValidation';
import { colores } from './DayHeader';
import { clasificarDia } from '../../utils/planilla.engine';

interface ShiftCellProps {
  personalId: string;
  dia: number;
  mes: number;
  año: number;
  value: TurnoTipo;
  isWeekend: boolean;
  isFeriado: boolean;
  /** true si este día es feriado trabajado (genera compensatorio) */
  esCompensatorio?: boolean;
  /** true si esta celda es la primera seleccionada en modo swap */
  isSwapSource?: boolean;
  /** true si el cursor puede aterrizar en esta celda como destino de swap */
  isSwapTarget?: boolean;
  /** llamada cuando el usuario hace click en modo swap */
  onSwapClick?: (personalId: string, dia: number) => void;
}

export const ShiftCell: React.FC<ShiftCellProps> = ({
  personalId,
  dia,
  mes,
  año,
  value,
  isWeekend,
  isFeriado,
  esCompensatorio = false,
  isSwapSource = false,
  isSwapTarget = false,
  onSwapClick,
}) => {
  const asignarTurno = useGridStore((state) => state.asignarTurno);
  const { validarCelda } = useShiftValidation();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular alerta reactiva en tiempo real para esta celda
  const alerta = validarCelda(personalId, dia, value);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Validador preventivo e interactivo de asignaciones
  const handleAsignar = (nuevoTipo: TurnoTipo) => {
    if (nuevoTipo === '') {
      asignarTurno(personalId, dia, '');
      return;
    }

    const personal = useGridStore.getState().personal;
    const turnos = useGridStore.getState().turnos;
    const feriados = useConfigStore.getState().feriados;

    const alertaFutura = validarTurnoCelda(personalId, dia, nuevoTipo, personal, turnos, feriados);

    if (alertaFutura) {
      if (alertaFutura.level === 'RED') {
        alert(`🔴 RESTRICCIÓN CRÍTICA BLOQUEANTE:\n\n${alertaFutura.message}\n\nBase Legal: ${alertaFutura.basis}`);
        return;
      }
      if (alertaFutura.level === 'ORANGE') {
        const confirmar = window.confirm(
          `🟠 ADVERTENCIA DE DESCANSO:\n\n${alertaFutura.message}\n\n¿Desea confirmar la asignación del turno?\n\nBase Legal: ${alertaFutura.basis}`
        );
        if (!confirmar) return;
      }
    }

    asignarTurno(personalId, dia, nuevoTipo);
  };

  // Click handler: si hay modo swap activo, delegar al handler; si no, abrir dropdown
  const handleClick = () => {
    if (onSwapClick) {
      // Modo swap: delegar al handler del ShiftGrid
      onSwapClick(personalId, dia);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Manejar atajos de teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Escape cancela el modo swap si está activo
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (onSwapClick) return; // en modo swap no usamos atajos de teclado

    const key = e.key.toUpperCase();
    if (key === 'M') { handleAsignar('M'); setIsOpen(false); }
    else if (key === 'T') { handleAsignar('T'); setIsOpen(false); }
    else if (key === 'N') { handleAsignar('N'); setIsOpen(false); }
    else if (key === 'F') { handleAsignar('F'); setIsOpen(false); }
    else if (e.key === 'Backspace' || e.key === 'Delete' || key === 'C') {
      handleAsignar('');
      setIsOpen(false);
    }
  };

  // Calcular el estilo base de la celda interna
  const getCellStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '30px',
      height: '30px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontFamily: 'var(--mono)',
      fontSize: '12px',
      cursor: isSwapTarget ? 'crosshair' : 'pointer',
      userSelect: 'none',
      outline: 'none',
      transition: 'all 0.15s ease',
      border: '1px solid transparent',
      position: 'relative',
    };

    // Celda origen del swap: borde dorado
    if (isSwapSource) {
      return {
        ...baseStyle,
        background: 'rgba(251, 191, 36, 0.2)',
        border: '2px solid #fbbf24',
        color: '#fbbf24',
        boxShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
      };
    }

    // Celda destino del swap: borde punteado
    if (isSwapTarget) {
      return {
        ...baseStyle,
        background: 'rgba(251, 191, 36, 0.06)',
        border: '1px dashed rgba(251, 191, 36, 0.5)',
        color: value === 'F' ? 'var(--accent3)' : value === 'M' ? 'var(--accent)' : value === 'T' ? 'var(--accent2)' : value === 'N' ? 'var(--accent4)' : 'var(--text3)',
      };
    }

    // Alertas semáforo
    if (alerta) {
      if (alerta.level === 'RED') {
        return {
          ...baseStyle,
          background: 'rgba(248, 113, 113, 0.16)',
          border: '1px solid var(--accent5)',
          color: 'var(--accent5)',
          boxShadow: '0 0 4px rgba(248, 113, 113, 0.2)',
        };
      }
      if (alerta.level === 'ORANGE') {
        return {
          ...baseStyle,
          background: 'rgba(251, 146, 60, 0.16)',
          border: '1px solid var(--accent4)',
          color: 'var(--accent4)',
          boxShadow: '0 0 4px rgba(251, 146, 60, 0.2)',
        };
      }
      if (alerta.level === 'YELLOW') {
        return {
          ...baseStyle,
          background: 'rgba(254, 240, 138, 0.16)',
          border: '1px solid #fbbf24',
          color: '#f59e0b',
        };
      }
    }

    // Estilos normales por tipo de turno
    if (value === 'M') {
      return {
        ...baseStyle,
        background: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        color: 'var(--accent)',
      };
    }
    if (value === 'T') {
      return {
        ...baseStyle,
        background: 'rgba(129, 140, 248, 0.12)',
        border: '1px solid rgba(129, 140, 248, 0.3)',
        color: 'var(--accent2)',
      };
    }
    if (value === 'N') {
      return {
        ...baseStyle,
        background: 'rgba(167, 139, 250, 0.12)',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        color: '#a78bfa',
      };
    }
    if (value === 'F') {
      return {
        ...baseStyle,
        background: 'rgba(52, 211, 153, 0.12)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        color: 'var(--accent3)',
      };
    }

    // Celda vacía
    return {
      ...baseStyle,
      background: isFeriado
        ? 'rgba(251, 146, 60, 0.04)'
        : isWeekend
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(255, 255, 255, 0.01)',
      border: '1px dashed var(--border)',
      color: 'var(--text3)',
    };
  };

  return (
    <td
      className={colores[clasificarDia(dia, año, mes, isFeriado)]}
      style={{
        padding: '3px 0',
        textAlign: 'center',
        verticalAlign: 'middle',
        position: 'relative',
        borderLeft: '1px solid var(--border)',
        background: isSwapSource
          ? 'rgba(251, 191, 36, 0.06)'
          : isSwapTarget
          ? 'rgba(251, 191, 36, 0.02)'
          : undefined,
        transition: 'background 0.15s ease',
      }}
    >
      <div
        ref={containerRef}
        style={{ display: 'inline-block', position: 'relative' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          tabIndex={0}
          style={getCellStyle()}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {value || '·'}

          {/* Indicador de compensatorio: 🔔 en esquina superior derecha */}
          {esCompensatorio && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                fontSize: '8px',
                lineHeight: 1,
                zIndex: 5,
                filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.8))',
              }}
              title="Franco compensatorio generado por feriado trabajado"
            >
              🔔
            </span>
          )}
        </div>

        {/* DROPDOWN INLINE — Solo si NO está en modo swap */}
        {isOpen && !onSwapClick && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%) translateY(6px)',
              background: '#162035',
              border: '1px solid var(--border2)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8), 0 0 12px rgba(56, 189, 248, 0.15)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              gap: '6px',
              zIndex: 200,
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* M */}
            <button
              type="button"
              onClick={() => { handleAsignar('M'); setIsOpen(false); }}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 'bold', cursor: 'pointer' }}
              title="Mañana (M)"
            >M</button>
            {/* T */}
            <button
              type="button"
              onClick={() => { handleAsignar('T'); setIsOpen(false); }}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid rgba(129, 140, 248, 0.3)', background: 'rgba(129, 140, 248, 0.1)', color: 'var(--accent2)', fontFamily: 'var(--mono)', fontWeight: 'bold', cursor: 'pointer' }}
              title="Tarde (T)"
            >T</button>
            {/* N */}
            <button
              type="button"
              onClick={() => { handleAsignar('N'); setIsOpen(false); }}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid rgba(167, 139, 250, 0.3)', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', fontFamily: 'var(--mono)', fontWeight: 'bold', cursor: 'pointer' }}
              title="Noche (N)"
            >N</button>
            {/* F */}
            <button
              type="button"
              onClick={() => { handleAsignar('F'); setIsOpen(false); }}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.3)', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--accent3)', fontFamily: 'var(--mono)', fontWeight: 'bold', cursor: 'pointer' }}
              title="Franco (F)"
            >F</button>
            {/* Separador */}
            <div style={{ width: '1px', background: 'var(--border)' }}></div>
            {/* Limpiar */}
            <button
              type="button"
              onClick={() => { handleAsignar(''); setIsOpen(false); }}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid rgba(248, 113, 113, 0.3)', background: 'rgba(248, 113, 113, 0.1)', color: 'var(--accent5)', fontFamily: 'var(--mono)', fontWeight: 'bold', cursor: 'pointer' }}
              title="Limpiar"
            >×</button>
          </div>
        )}

        {/* TOOLTIP DE ALERTA */}
        {isHovered && alerta && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%) translateY(-8px)',
              background: '#162035',
              border: `1px solid ${alerta.level === 'RED' ? 'var(--accent5)' : alerta.level === 'ORANGE' ? 'var(--accent4)' : '#fbbf24'}`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--text)',
              width: '220px',
              textAlign: 'left',
              zIndex: 300,
              pointerEvents: 'none',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                color: alerta.level === 'RED' ? 'var(--accent5)' : alerta.level === 'ORANGE' ? 'var(--accent4)' : '#f59e0b',
                marginBottom: '4px',
                textTransform: 'uppercase',
                fontSize: '9px',
                fontFamily: 'var(--mono)',
                letterSpacing: '0.5px',
              }}
            >
              {alerta.level === 'RED' ? '🚫 ' : alerta.level === 'ORANGE' ? '⚠️ ' : 'ℹ️ '}
              {alerta.basis}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.4' }}>
              {alerta.message}
            </div>
          </div>
        )}

        {/* TOOLTIP DE COMPENSATORIO */}
        {isHovered && esCompensatorio && !alerta && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%) translateY(-8px)',
              background: '#162035',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#fbbf24',
              width: '180px',
              textAlign: 'left',
              zIndex: 300,
              pointerEvents: 'none',
            }}
          >
            🔔 Feriado trabajado — genera 1 franco compensatorio
          </div>
        )}
      </div>
    </td>
  );
};

export default ShiftCell;
