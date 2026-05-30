import React, { useMemo } from 'react';

interface DayHeaderProps {
  day: number;
  month: number;
  year: number;
  isFeriado: boolean;
}

type TipoDia = 'habil' | 'sabado' | 'domingo' | 'feriado' | 'feriado_finde';

export function clasificarDia(dia: number, año: number, mes: number, isFeriado: boolean): TipoDia {
  const fecha = new Date(año, mes - 1, dia);
  const dow = fecha.getDay();
  if (isFeriado && (dow === 0 || dow === 6)) return 'feriado_finde';
  if (isFeriado) return 'feriado';
  if (dow === 6) return 'sabado';
  if (dow === 0) return 'domingo';
  return 'habil';
}

export const colores = {
  habil: '',
  sabado: 'bg-slate-100/50 dark:bg-slate-800/30',
  domingo: 'bg-slate-200/60 dark:bg-slate-700/40',
  feriado: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300/40',
  feriado_finde: 'bg-amber-100/70 dark:bg-amber-800/30 border-amber-400/50'
};

const DIAS_SEMANA_ABR = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const DayHeader: React.FC<DayHeaderProps> = ({ day, month, year, isFeriado }) => {
  const { weekdayAbr, tipoDia } = useMemo(() => {
    const date = new Date(year, month - 1, day);
    const dayIndex = date.getDay();
    const tipo = clasificarDia(day, year, month, isFeriado);
    return {
      weekdayAbr: DIAS_SEMANA_ABR[dayIndex],
      tipoDia: tipo
    };
  }, [day, month, year, isFeriado]);

  const baseStyle: React.CSSProperties = {
    width: '34px',
    minWidth: '34px',
    padding: '8px 0',
    textAlign: 'center',
    borderLeft: '1px solid var(--border)',
    borderBottom: isFeriado ? '2px solid var(--accent4)' : '1px solid var(--border2)',
    color: isFeriado ? 'var(--accent4)' : (tipoDia === 'sabado' || tipoDia === 'domingo') ? 'var(--text3)' : 'var(--text)',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    fontWeight: 'bold',
    position: 'relative'
  };

  const dayLabel = useMemo(() => {
    if (tipoDia === 'sabado') return `S·${day}`;
    if (tipoDia === 'domingo') return `D·${day}`;
    if (tipoDia === 'feriado_finde') return `🔔 ${weekdayAbr}·${day}`;
    if (tipoDia === 'feriado') return `🔔 ${day}`;
    return `${day}`;
  }, [tipoDia, day, weekdayAbr]);

  return (
    <th
      style={baseStyle}
      className={colores[tipoDia]}
    >
      <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '2px' }}>
        {weekdayAbr}
      </div>
      <div>
        {dayLabel}
      </div>
    </th>
  );
};

export default DayHeader;
