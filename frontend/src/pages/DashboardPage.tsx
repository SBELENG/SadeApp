import React, { useMemo } from 'react';
import { useConfigStore } from '../store/configStore';
import { ESPECIALIDADES_INDICES } from '../utils/constants/indices';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export const DashboardPage: React.FC = () => {
  const {
    dotacion,
    serviceKey,
    beds,
    indexI,
    nivel,
    year,
    month,
    isCritical,
    ratio,
    setCurrentPage
  } = useConfigStore();

  const currentSpecialty = useMemo(() => ESPECIALIDADES_INDICES[serviceKey], [serviceKey]);

  // Si no hay cálculo hecho
  if (!dotacion) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <div className="card-premium" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
          <span style={{ fontSize: '48px', marginBottom: '20px', display: 'block' }}>📊</span>
          <h2 style={{ marginBottom: '12px' }}>Sin Datos de Dotación</h2>
          <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
            No se ha ejecutado el motor de cálculo de Balderas Pedrero para el mes seleccionado aún. Por favor configure los parámetros iniciales.
          </p>
          <button className="btn-premium" onClick={() => setCurrentPage('config')}>
            Ir a Configurar
          </button>
        </div>
      </div>
    );
  }

  // Datos para el gráfico de turnos (Mañana, Tarde, Noche, Francos)
  const turnosData = [
    { name: 'Mañana (Q1)', value: dotacion.Q1, color: '#38bdf8' },
    { name: 'Tarde (Q2)', value: dotacion.Q2, color: '#818cf8' },
    { name: 'Noche (Q3)', value: dotacion.Q3, color: '#fb923c' },
    { name: 'Francos (Qf)', value: dotacion.Qf, color: '#34d399' }
  ];

  // Datos para el gráfico de composición profesional (Licenciados/Especialistas vs Enfermeros)
  const composicionData = [
    { name: 'Licenciados/Especialistas (S)', value: dotacion.profesionales, color: '#0ea5e9' },
    { name: 'Enfermeros (V)', value: dotacion.auxiliares, color: '#f87171' }
  ];

  return (
    <div className="main-content" style={{ maxWidth: '1100px' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div style={{ textAlign: 'left' }}>
          <span className="badge-tech badge-green" style={{ marginBottom: '12px' }}>Metodología Balderas Pedrero</span>
          <h1 style={{ marginBottom: '8px' }}>Dashboard de Dotación</h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
            Resultados analíticos para <strong style={{ color: 'var(--accent)' }}>{currentSpecialty?.especialidad}</strong> · Camas: {beds} · {nivel === 'segundo' ? '2do Nivel (70/30)' : '3er Nivel (80/20)'} · Período: {month}/{year}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary-tech" onClick={() => setCurrentPage('config')}>
            ⚙️ Reconfigurar
          </button>
          <button className="btn-premium" onClick={() => setCurrentPage('grid')}>
            <span>Planilla de Turnos</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* FILA 1: Métricas Clave (Cards Asimétricas) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Card P */}
        <div className="card-premium" style={{ borderLeft: '4px solid var(--accent)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Personal Base (P)
            </span>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px', fontWeight: '500' }}>Dotación Ideal</h3>
          </div>
          <div style={{ margin: '16px 0' }}>
            <span style={{ fontSize: '44px', fontFamily: 'var(--display)', fontWeight: '800', color: 'var(--accent)', lineHeight: 1 }}>
              {dotacion.P.toFixed(1)}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text3)', marginLeft: '6px' }}>enfermeros</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {isCritical ? `Fórmula UCI con ratio ${ratio}` : `Ecuación: (I × C) / J = (${indexI} × ${beds}) / 8`}
          </p>
        </div>

        {/* Card B */}
        <div className="card-premium" style={{ borderLeft: '4px solid var(--accent4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Colchón de Ausentismo (B)
            </span>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px', fontWeight: '500' }}>Faltas e Incidencias</h3>
          </div>
          <div style={{ margin: '16px 0' }}>
            <span style={{ fontSize: '44px', fontFamily: 'var(--display)', fontWeight: '800', color: 'var(--accent4)', lineHeight: 1 }}>
              {dotacion.B.toFixed(1)}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text3)', marginLeft: '6px' }}>enfermeros</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
            Calculado con coeficiente constante del 41% de P.
          </p>
        </div>

        {/* Card Z */}
        <div className="card-premium" style={{ 
          borderLeft: '4px solid var(--accent3)', 
          background: 'linear-gradient(135deg, var(--surface) 0%, rgba(52, 211, 153, 0.03) 100%)',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          boxShadow: '0 15px 35px -5px rgba(52, 211, 153, 0.05)'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--accent3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              Dotación Total (Z)
            </span>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px', fontWeight: '500' }}>Requerido Total del Mes</h3>
          </div>
          <div style={{ margin: '12px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '54px', fontFamily: 'var(--display)', fontWeight: '800', color: 'var(--heading)', lineHeight: 1 }}>
              {dotacion.Z_ceil}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text2)', fontWeight: '500' }}>
              (Teórico: {dotacion.Z.toFixed(1)})
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text2)' }}>
            Total de personal activo requerido para cubrir el servicio.
          </p>
        </div>

      </div>

      {/* FILA 2: Distribución por turnos */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⏱️ Cobertura Mínima por Turno</span>
          <span style={{ height: '1px', flex: 1, background: 'var(--border)' }}></span>
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {turnosData.map((t, idx) => (
            <div key={idx} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <span className="mono-data" style={{ color: t.color, fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                {t.name}
              </span>
              <span style={{ fontSize: '28px', fontFamily: 'var(--display)', fontWeight: 'bold', color: 'var(--heading)' }}>
                {t.value}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginLeft: '4px' }}>
                enfermeros
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FILA 3: Visualización Gráfica (Recharts) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
        
        {/* Dona 1: Cobertura */}
        <div className="card-premium" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px', color: 'var(--accent)' }}>
            📊 Distribución Horaria Requerida
          </h3>
          <div style={{ flex: 1, minHeight: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={turnosData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {turnosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text2)', fontSize: '12px' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dona 2: Calificación Profesional */}
        <div className="card-premium" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px', color: 'var(--accent3)' }}>
            🎓 Composición del Equipo
          </h3>
          <div style={{ flex: 1, minHeight: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={composicionData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {composicionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text2)', fontSize: '12px' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
