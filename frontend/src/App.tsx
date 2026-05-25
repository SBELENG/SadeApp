import React from 'react';
import { useConfigStore } from './store/configStore';
import { ConfigPage } from './pages/ConfigPage';
import { DashboardPage } from './pages/DashboardPage';
import { GridPage } from './pages/GridPage';
import { ESPECIALIDADES_INDICES } from './utils/constants/indices';

const App: React.FC = () => {
  const { currentPage, setCurrentPage, serviceKey, month, year, dotacion, logoBase64, setLogoBase64 } = useConfigStore();

  const currentSpecialty = ESPECIALIDADES_INDICES[serviceKey];
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Por favor elija una imagen menor a 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div className="app-container">
      {/* PANTALLA 0: TOPBAR GLOBAL PERSISTENTE */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          
          {/* LOGO SADE (Variante 1 - Adaptado Compacto) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setCurrentPage('config')}>
            <svg width="180" height="42" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(20,25)">
                <polygon points="0,-18 18,0 0,18 -18,0" fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.6"/>
                <rect x="-2.5" y="-12" width="5" height="24" rx="1" fill="#38bdf8"/>
                <rect x="-12" y="-2.5" width="24" height="5" rx="1" fill="#38bdf8"/>
                <circle cx="0" cy="0" r="3" fill="#0a0e1a"/>
                <circle cx="0" cy="0" r="1.8" fill="#38bdf8"/>
              </g>
              <text x="48" y="27" fontFamily="Syne, sans-serif" fontSize="24" fontWeight="800" fill="#f1f5f9" letterSpacing="-1">SADE</text>
              <text x="49" y="38" fontFamily="DM Mono, monospace" fontSize="5.2" fill="#38bdf8" letterSpacing="0.8">SISTEMA DE DOTACIÓN</text>
            </svg>

            {/* Separador */}
            <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
            
            {/* Logo de la Institución / Nombre interactivo */}
            <div 
              onClick={handleLogoAreaClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                position: 'relative',
                cursor: 'pointer',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border2)';
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Click para subir o cambiar el logo de la institución"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              
              {logoBase64 ? (
                <div style={{ position: 'relative', width: '34px', height: '34px', flexShrink: 0 }}>
                  <img 
                    src={logoBase64} 
                    alt="Logo Hospital" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1.5px solid var(--accent)'
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('¿Desea quitar el logo institucional?')) {
                        setLogoBase64(null);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'var(--accent5)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '14px',
                      height: '14px',
                      fontSize: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      lineHeight: '1'
                    }}
                    title="Eliminar logo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1.5px dashed var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  🏥
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: '600', letterSpacing: '0.5px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  HOSPITAL REGIONAL DE ALTA COMPLEJIDAD
                </span>
                <span style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 'bold' }}>
                  {currentSpecialty ? currentSpecialty.especialidad.toUpperCase() : 'SERVICIO ACTIVO'}
                </span>
              </div>
            </div>
          </div>

          {/* NAVEGACIÓN SPA REACTIVA */}
          <nav style={{ display: 'flex', gap: '4px', background: '#080c16', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setCurrentPage('config')}
              style={{
                fontFamily: 'var(--display)',
                fontWeight: '600',
                fontSize: '13px',
                border: 'none',
                background: currentPage === 'config' ? 'var(--surface2)' : 'transparent',
                color: currentPage === 'config' ? 'var(--accent)' : 'var(--text2)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={() => setCurrentPage('dashboard')}
              style={{
                fontFamily: 'var(--display)',
                fontWeight: '600',
                fontSize: '13px',
                border: 'none',
                background: currentPage === 'dashboard' ? 'var(--surface2)' : 'transparent',
                color: currentPage === 'dashboard' ? 'var(--accent)' : 'var(--text2)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📊 Analíticas Z
            </button>
            <button
              onClick={() => {
                if (!dotacion) {
                  alert('Debe ejecutar el cálculo de dotación en la pantalla de Configuración primero.');
                } else {
                  setCurrentPage('grid');
                }
              }}
              disabled={!dotacion}
              style={{
                fontFamily: 'var(--display)',
                fontWeight: '600',
                fontSize: '13px',
                border: 'none',
                background: currentPage === 'grid' ? 'var(--surface2)' : 'transparent',
                color: currentPage === 'grid' ? 'var(--accent)' : !dotacion ? 'var(--text3)' : 'var(--text2)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: !dotacion ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📋 Planilla de Turnos
            </button>
          </nav>

          {/* PERFIL DE USUARIO Y METADATA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right', display: 'none', sm: 'block' } as any}>
              <span className="mono-data" style={{ fontSize: '11px', color: 'var(--text3)', display: 'block' }}>
                PERÍODO: {month.toString().padStart(2, '0')}/{year}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '500' }}>
                Jefe: Lic. Lionel Messi
              </span>
            </div>
            
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
              color: '#0a0e1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              fontFamily: 'var(--display)'
            }}>
              LM
            </div>
          </div>

        </div>
      </header>

      {/* RENDERIZADO REACTIVO DE PANTALLAS */}
      <main style={{ flex: 1 }}>
        {currentPage === 'config' && <ConfigPage />}
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'grid' && <GridPage />}
      </main>

      {/* FOOTER */}
      <footer style={{
        background: '#040710',
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text3)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span>SADE v1.0.0 — Sistema Automatizado de Dotación de Enfermería</span>
          <span>Regulado por Ley 24.004 / Ley 10.780</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
