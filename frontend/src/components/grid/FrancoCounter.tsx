import React, { useMemo } from 'react';
import { useGridStore } from '../../store/gridStore';
import { useConfigStore } from '../../store/configStore';
import { calcularDenominador } from '../../utils/planilla.engine';

function calcEstadoSemaforo(asignados: number, disponibles: number): 'verde' | 'amarillo' | 'rojo' {
  if (asignados === disponibles) return 'verde';
  if (asignados < disponibles) return 'amarillo';
  return 'rojo';
}

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

  // ── [C3] DENOMINADOR: fijo al inicio del mes ────────────────────────────────
  // = francos_base (8 ó 9) + cantidad de feriados del mes
  // Los compensatorios ganados se suman al NUMERADOR_DISPONIBLE, NO al denominador.
  const denominador = useMemo(() => {
    if (planillaActual) {
      return planillaActual.francos_totales;
    }
    return calcularDenominador(diasMes, feriados);
  }, [planillaActual, diasMes, feriados]);

  // ── [C3] COMPENSATORIOS GANADOS este mes ─────────────────────────────────────
  // Regla C2: N_noche_anterior_feriado + M_feriado + T_feriado
  // Se almacenan en planilla.compensatorios[personalId] calculados por el motor.
  const compEsteMes = useMemo(() => {
    if (planillaActual) {
      return planillaActual.compensatorios[personalId] ?? 0;
    }
    return 0; // sin planilla generada no se puede calcular la regla C2
  }, [planillaActual, personalId]);

  // ── [C3] NUMERADOR ASIGNADO: celdas F realmente asignadas ───────────────────
  const francosAsignados = useMemo(() => {
    if (!turnos) return 0;
    return Object.values(turnos).filter((tipo) => tipo === 'F').length;
  }, [turnos]);

  // ── [C3] NUMERADOR DISPONIBLE = DENOMINADOR + compensatorios ganados ─────────
  const numeradorDisponible = denominador + compEsteMes;

  // ── [C3] Semáforo ────────────────────────────────────────────────────────────
  // verde: asignados == disponibles
  // amarillo: asignados < disponibles (tiene compensatorios sin usar)
  // rojo: asignados > disponibles (error crítico)
  const estadoSemaforo = calcEstadoSemaforo(francosAsignados, numeradorDisponible);
  const isMetaCumplida = estadoSemaforo === 'verde';
  const isExcedido = estadoSemaforo === 'rojo';


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
      {/* [C3] Contador principal: asignados / disponibles */}
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
          title={`Denominador base: ${denominador}${compEsteMes > 0 ? ` + ${compEsteMes} compensatorio(s)` : ''}`}
        >
          {francosAsignados}/{numeradorDisponible}
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
