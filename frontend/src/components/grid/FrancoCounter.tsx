import React, { useMemo } from 'react';
import { useGridStore } from '../../store/gridStore';
import { calcFrancosBase } from '../../utils/francos.calc';

interface FrancoCounterProps {
  personalId: string;
  compensatoriosTrasladados: number;
}

export const FrancoCounter: React.FC<FrancoCounterProps> = ({
  personalId,
  compensatoriosTrasladados
}) => {
  const turnos = useGridStore((state) => state.turnos[personalId]);
  const diasMes = useGridStore((state) => state.diasMes);
  const feriados = useGridStore((state) => state.feriados);

  // Calcular la meta de francos requeridos en el mes
  const totalFrancosRequeridos = useMemo(() => {
    return calcFrancosBase(diasMes, feriados.length, compensatoriosTrasladados);
  }, [diasMes, feriados, compensatoriosTrasladados]);

  // Contar los francos actualmente asignados a este enfermero
  const francosAsignados = useMemo(() => {
    if (!turnos) return 0;
    return Object.values(turnos).filter((tipo) => tipo === 'F').length;
  }, [turnos]);

  const francosRestantes = totalFrancosRequeridos - francosAsignados;
  const isMetaCumplida = francosRestantes <= 0;

  return (
    <td
      style={{
        padding: '8px 16px',
        textAlign: 'center',
        verticalAlign: 'middle',
        borderLeft: '1px solid var(--border)',
        fontFamily: 'var(--mono)',
        fontWeight: 'bold',
        fontSize: '12px',
        color: isMetaCumplida ? 'var(--accent3)' : 'var(--accent4)',
        background: isMetaCumplida ? 'rgba(52, 211, 153, 0.03)' : 'rgba(251, 146, 60, 0.01)',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span>{francosAsignados}/{totalFrancosRequeridos}</span>
        <span style={{ fontSize: '10px' }}>
          {isMetaCumplida ? '🟢' : '🟡'}
        </span>
      </div>
    </td>
  );
};

export default FrancoCounter;
