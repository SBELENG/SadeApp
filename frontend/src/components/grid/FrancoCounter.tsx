import React, { useMemo } from 'react';
import { useGridStore } from '../../store/gridStore';
import { useConfigStore } from '../../store/configStore';
import { calcFrancosBase } from '../../utils/planilla.engine';

interface FrancoCounterProps {
  personalId: string;
  compensatoriosTrasladados: number;
}

export const FrancoCounter: React.FC<FrancoCounterProps> = ({
  personalId,
  compensatoriosTrasladados,
}) => {
  const planillaActual = useGridStore((state) => state.planillaActual);
  const turnos = useGridStore((state) => state.turnos[personalId]);
  const diasMes = useGridStore((state) => state.diasMes);
  const feriados = useConfigStore((state) => state.feriados);

  // ── DENOMINADOR: fijo al inicio del mes, NUNCA incluye compensatorios ───────
  // = francos_base (8 ó 9) + cantidad de feriados del mes
  // Los compensatorios por feriado trabajado se acreditan en el NUMERADOR, no aquí.
  const totalFrancosRequeridos = useMemo(() => {
    if (planillaActual) {
      // Usar el valor calculado por el motor: francos_base + francos_feriado
      return planillaActual.francos_totales;
    }
    // Fallback: solo base + feriados, SIN compensatoriosTrasladados
    const base = calcFrancosBase(diasMes);
    return base + feriados.length;
  }, [planillaActual, diasMes, feriados]);

  // ── NUMERADOR: francos 'F' asignados en la planilla ─────────────────────────
  const francosAsignados = useMemo(() => {
    if (!turnos) return 0;
    return Object.values(turnos).filter((tipo) => tipo === 'F').length;
  }, [turnos]);

  // ── COMPENSATORIOS generados este mes (feriados trabajados) ──────────────────
  // Cada feriado trabajado genera un compensatorio. Esto aparece en el display
  // como información adicional, pero NO modifica el denominador.
  const compEsteMes = useMemo(() => {
    if (planillaActual) {
      return planillaActual.compensatorios[personalId] ?? 0;
    }
    // Fallback: contar feriados trabajados
    if (!turnos) return 0;
    return feriados.filter((d) => {
      const t = turnos[d];
      return t === 'M' || t === 'T' || t === 'N';
    }).length;
  }, [planillaActual, personalId, turnos, feriados]);

  const francosRestantes = totalFrancosRequeridos - (francosAsignados + compEsteMes);
  const isMetaCumplida = francosRestantes <= 0;
  const isExcedido = francosRestantes < 0;


  return (
    <td
      style={{
        padding: '5px 10px',
        textAlign: 'center',
        verticalAlign: 'middle',
        borderLeft: '1px solid var(--border)',
        fontFamily: 'var(--mono)',
        fontSize: '11px',
        minWidth: '90px',
        background: isExcedido
          ? 'rgba(248, 113, 113, 0.03)'
          : isMetaCumplida
          ? 'rgba(52, 211, 153, 0.03)'
          : 'rgba(251, 146, 60, 0.01)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Contador principal: asignados / requeridos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '12px',
            color: isExcedido
              ? 'var(--accent5)'
              : isMetaCumplida
              ? 'var(--accent3)'
              : 'var(--accent4)',
          }}
        >
          {(francosAsignados + compEsteMes)}/{totalFrancosRequeridos}

        </span>
        <span style={{ fontSize: '9px' }}>
          {isExcedido ? '🔴' : isMetaCumplida ? '🟢' : '🟡'}
        </span>
      </div>

      {/* Compensatorios generados este mes por feriado trabajado */}
      {compEsteMes > 0 && (
        <div
          style={{
            fontSize: '9px',
            color: '#fbbf24',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
          title={`${compEsteMes} franco(s) compensatorio(s) por feriado trabajado (Ley 24.004)`}
        >
          🔔 +{compEsteMes} comp.
        </div>
      )}

      {/* Compensatorios trasladados del mes anterior (solo informativo) */}
      {compensatoriosTrasladados > 0 && (
        <div
          style={{
            fontSize: '9px',
            color: 'var(--text3)',
            marginTop: '1px',
          }}
          title={`${compensatoriosTrasladados} compensatorio(s) trasladados del mes anterior`}
        >
          ↩ prev +{compensatoriosTrasladados}
        </div>
      )}
    </td>
  );
};

export default FrancoCounter;
