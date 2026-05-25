import React, { useMemo } from 'react';

interface DayHeaderProps {
  day: number;
  month: number;
  year: number;
  isFeriado: boolean;
}

const DIAS_SEMANA_ABR = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const DayHeader: React.FC<DayHeaderProps> = ({ day, month, year, isFeriado }) => {
  const { weekdayAbr, isWeekend } = useMemo(() => {
    const date = new Date(year, month - 1, day);
    const dayIndex = date.getDay();
    return {
      weekdayAbr: DIAS_SEMANA_ABR[dayIndex],
      isWeekend: dayIndex === 0 || dayIndex === 6
    };
  }, [day, month, year]);

  return (
    <th
      style={{
        width: '34px',
        minWidth: '34px',
        padding: '8px 0',
        textAlign: 'center',
        background: isFeriado
          ? 'rgba(251, 146, 60, 0.18)' // Acento durazno para feriados
          : isWeekend
          ? 'rgba(255, 255, 255, 0.04)' // Fin de semana
          : 'transparent',
        borderLeft: '1px solid var(--border)',
        borderBottom: isFeriado ? '2px solid var(--accent4)' : '1px solid var(--border2)',
        color: isFeriado ? 'var(--accent4)' : isWeekend ? 'var(--text3)' : 'var(--text)',
        fontFamily: 'var(--mono)',
        fontSize: '11px',
        fontWeight: 'bold',
        position: 'relative'
      }}
    >
      <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '2px' }}>
        {weekdayAbr}
      </div>
      <div>
        {day}
      </div>
      {isFeriado && (
        <span 
          title="Feriado Nacional" 
          style={{ 
            position: 'absolute', 
            top: '2px', 
            right: '2px', 
            fontSize: '7px' 
          }}
        >
          🏳️
        </span>
      )}
    </th>
  );
};

export default DayHeader;
