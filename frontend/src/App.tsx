import React from 'react';
import { useConfigStore } from './store/configStore';
import { ConfigPage } from './pages/ConfigPage';
import { DashboardPage } from './pages/DashboardPage';
import { GridPage } from './pages/GridPage';


const App: React.FC = () => {
  const { 
    currentPage, 
    setCurrentPage, 
    month, 
    year, 
    dotacion, 
    logoBase64, 
    setLogoBase64, 
    nombreInstitucion, 
    setNombreInstitucion,
    nombreDepartamento,
    setNombreDepartamento,
    nombreSupervisor,
    setNombreSupervisor
  } = useConfigStore();


  
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

  const getInitials = (name: string) => {
    if (!name) return '👤';
    const cleanName = name.replace(/^(LIC\.|DR\.|DRA\.|ENF\.)\s+/i, '');
    const parts = cleanName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '👤';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
          
          {/* LOGO SADE (Variante Vectorial Premium - Comercial) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setCurrentPage('config')}>
            <svg width="340" height="50" viewBox="0 0 340 50" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'crisp-edges' }}>
              <g transform="translate(22,25)">
                <polygon points="0,-18 18,0 0,18 -18,0" fill="none" stroke="#38bdf8" strokeWidth="1.6" opacity="0.95"/>
                <rect x="-3.5" y="-12" width="7" height="24" rx="1.5" fill="#38bdf8"/>
                <rect x="-12" y="-3.5" width="24" height="7" rx="1.5" fill="#38bdf8"/>
                <circle cx="0" cy="0" r="4.2" fill="#0a0e1a"/>
                <circle cx="0" cy="0" r="2.2" fill="#38bdf8"/>
              </g>
              <text x="52" y="24" fontFamily="Syne, sans-serif" fontSize="25" fontWeight="800" fill="#f1f5f9" letterSpacing="-0.5">SADE</text>
              <text x="53" y="38" fontFamily="Inter, sans-serif" fontSize="7.8" fontWeight="700" fill="#38bdf8" letterSpacing="0.4">SISTEMA AUTOMATIZADO DE DOTACIÓN DE ENFERMERÍA</text>
            </svg>

            {/* Separador */}
            <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
            
            {/* Logo de la Institución / Nombre interactivo configurable */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                position: 'relative',
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
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              
              <div 
                onClick={handleLogoAreaClick}
                style={{ cursor: 'pointer' }}
                title="Click para subir o cambiar el logo de la institución (max 2MB)"
              >
                {logoBase64 ? (
                  <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                    <img 
                      src={logoBase64} 
                      alt="Logo Hospital" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        border: '1.5px solid var(--accent)',
                        padding: '2px'
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
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 0 2px var(--bg-color)'
                      }}
                      title="Eliminar logo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <img 
                      src="/logo.svg" 
                      alt="SADE Logo" 
                      style={{ width: '100%', height: '100%' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      borderRadius: '6px',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                    >
                      Editar
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <input
                  type="text"
                  value={nombreInstitucion}
                  onChange={(e) => setNombreInstitucion(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed rgba(56, 189, 248, 0.3)',
                    color: 'var(--text)',
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    width: '240px',
                    padding: '2px 0',
                    outline: 'none',
                    fontFamily: 'var(--body)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                  }}
                  title="Haga click e ingrese el nombre de la institución para configurar el encabezado"
                  placeholder="INGRESE EL NOMBRE DE LA INSTITUCIÓN"
                />
                <input
                  type="text"
                  value={nombreDepartamento}
                  onChange={(e) => setNombreDepartamento(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed rgba(56, 189, 248, 0.4)',
                    color: 'var(--accent)',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    width: '240px',
                    outline: 'none',
                    padding: '2px 0',
                    marginTop: '2px',
                    fontFamily: 'var(--mono)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  }}
                  title="Haga click para sobrescribir el departamento/servicio"
                  placeholder="DEPARTAMENTO / SERVICIO"
                />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>Jefe:</span>
                <input
                  type="text"
                  value={nombreSupervisor}
                  onChange={(e) => setNombreSupervisor(e.target.value.toUpperCase())}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed rgba(241, 245, 249, 0.2)',
                    color: 'var(--text2)',
                    fontSize: '11px',
                    fontWeight: '500',
                    width: '130px',
                    textAlign: 'right',
                    outline: 'none',
                    padding: '1px 0',
                    fontFamily: 'var(--body)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(241, 245, 249, 0.2)';
                  }}
                  title="Haga click para editar el Jefe de Servicio"
                  placeholder="JEFE DE SERVICIO"
                />
              </div>
            </div>
            
            <div 
              title={nombreSupervisor || 'Supervisor'}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
                color: '#0a0e1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '13px',
                fontFamily: 'var(--display)',
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.2)'
              }}
            >
              {getInitials(nombreSupervisor)}
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
          <span>Escuela de Enfermería - UNRC | Desarrollo: Ideas Digitales</span>
          <span>Regulado por Ley 24.004 / Ley 10.780</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
