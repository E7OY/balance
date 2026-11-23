import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Image as ImageIcon, RotateCcw, Upload, X } from 'lucide-react';
import {
  compressImageToDataUrl,
  getSavedHomeBackground,
  HOME_BACKGROUNDS,
  resolveBackgroundCss,
  saveHomeBackground,
} from '../utils/homeBackgrounds';
import { triggerHaptic } from '../utils/haptics';

const THEME_MODAL_CSS = `
  .nx-theme-overlay {
    position: fixed;
    inset: 0;
    z-index: 120;
    background-color: #111215;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 0 calc(22px + env(safe-area-inset-bottom, 0px));
    animation: nx-fade 0.18s ease-out;
  }
  .nx-theme-inner {
    width: 100%;
    max-width: 460px;
    margin: 0 auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .nx-theme-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px 14px;
  }
  .nx-theme-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 0;
    background: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  /* VISTA 1: CARRUSEL DE MAQUETAS DE MÓVIL */
  .nx-mockup-track {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding: 4px 56px 12px;
    scrollbar-width: none;
  }
  .nx-mockup-track::-webkit-scrollbar {
    display: none;
  }
  .nx-phone-preview {
    scroll-snap-align: center;
    flex-shrink: 0;
    width: 236px;
    height: 416px;
    border-radius: 30px;
    background-color: #090A0D;
    border: 2px solid rgba(255, 255, 255, 0.14);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.55);
    cursor: pointer;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .nx-phone-preview.selected {
    border-color: #FFFFFF;
    transform: scale(1.02);
  }
  .nx-phone-preview-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 290px;
  }
  .nx-phone-preview-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.08) 48%,
      rgba(9, 10, 13, 0.85) 84%,
      #090A0D 100%
    );
  }

  /* TIRA DE MINIATURAS CIRCULARES */
  .nx-circle-strip {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    overflow-x: auto;
    padding: 8px 20px 18px;
    scrollbar-width: none;
  }
  .nx-circle-strip::-webkit-scrollbar {
    display: none;
  }
  .nx-circle-swatch {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 0;
    color: rgba(255, 255, 255, 0.72);
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    flex-shrink: 0;
  }
  .nx-circle-swatch.active {
    color: #FFFFFF;
    font-weight: 600;
  }
  .nx-circle-disc {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, border-color 0.15s ease;
  }
  .nx-circle-swatch.active .nx-circle-disc {
    border-color: #FFFFFF;
    transform: scale(1.06);
  }

  /* VISTA 2: GALERÍA DE FONDOS 3 COLUMNAS */
  .nx-bg-tabs {
    display: flex;
    gap: 6px;
    padding: 0 18px 14px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .nx-bg-tabs::-webkit-scrollbar {
    display: none;
  }
  .nx-bg-tab {
    height: 34px;
    padding: 0 16px;
    border-radius: 999px;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.65);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .nx-bg-tab.active {
    background: rgba(255, 255, 255, 0.16);
    color: #FFFFFF;
  }
  .nx-bg-grid {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 4px 18px 20px;
    align-content: start;
  }
  .nx-bg-tile {
    aspect-ratio: 3 / 4.2;
    border-radius: 16px;
    border: 2px solid transparent;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    padding: 0;
    transition: transform 0.14s ease, border-color 0.15s ease;
  }
  .nx-bg-tile.selected {
    border-color: #FFFFFF;
    box-shadow: 0 0 0 2px #494fdf;
  }
  .nx-bg-tile:active {
    transform: scale(0.96);
  }
`;

const HomeThemeModal = ({
  open,
  onClose,
  accountLabel = 'Personal',
  balanceDisplay = '0,00 €',
  onApplied,
}) => {
  const [view, setView] = useState('preview'); // 'preview' | 'gallery'
  const [draft, setDraft] = useState(() => getSavedHomeBackground());
  const [activeFilter, setActiveFilter] = useState('Todo');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  if (!open) return null;

  const isSelected = (item) => !draft.customImage && draft.id === item.id;

  const handleSelectPreset = (presetId) => {
    triggerHaptic();
    setUploadError('');
    setDraft({ id: presetId, customImage: null });
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await compressImageToDataUrl(file);
      triggerHaptic();
      setDraft({ id: 'custom', customImage: dataUrl });
      setView('preview');
    } catch (err) {
      setUploadError(err.message);
    }
  };

  const handleApply = () => {
    try {
      saveHomeBackground(draft);
      triggerHaptic();
      onApplied?.(draft);
      onClose();
    } catch (err) {
      setUploadError(err.message);
    }
  };

  const filteredPresets = activeFilter === 'Todo'
    ? HOME_BACKGROUNDS
    : HOME_BACKGROUNDS.filter((b) => b.category === activeFilter);

  const previewItems = draft.customImage
    ? [{ id: 'custom', name: 'Tu foto', shortName: 'Foto', css: `url('${draft.customImage}') center top / cover no-repeat`, thumbCss: `url('${draft.customImage}') center / cover no-repeat` }, ...HOME_BACKGROUNDS]
    : HOME_BACKGROUNDS;

  return createPortal(
    <div className="nx-theme-overlay" role="dialog" aria-modal="true" aria-label="Personalizar fondo de inicio">
      <style>{THEME_MODAL_CSS}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUploadFile}
      />

      <div className="nx-theme-inner">
        {/* HEADER */}
        <div className="nx-theme-header">
          <button
            type="button"
            className="nx-theme-icon-btn"
            onClick={() => (view === 'gallery' ? setView('preview') : onClose())}
            aria-label={view === 'gallery' ? 'Volver' : 'Cerrar'}
          >
            {view === 'gallery' ? <ArrowLeft size={17} /> : <X size={17} />}
          </button>

          <strong style={{ fontSize: '15px', fontWeight: 600 }}>
            {view === 'gallery' ? 'Fondo' : 'Tema'}
          </strong>

          {view === 'preview' ? (
            <button
              type="button"
              onClick={() => setView('gallery')}
              style={{
                background: 'transparent',
                border: 0,
                color: '#6E8BFF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              Galería
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'transparent',
                border: 0,
                color: '#6E8BFF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              Subir
            </button>
          )}
        </div>

        {uploadError && (
          <p style={{ color: '#F43F5E', fontSize: '12px', textAlign: 'center', margin: '0 18px 10px' }}>
            {uploadError}
          </p>
        )}

        {/* VISTA 1: PREVIEW TIPO REVOLUT CON MINIATURA DE LA HOME */}
        {view === 'preview' && (
          <>
            <div className="nx-mockup-track">
              {previewItems.slice(0, 6).map((item) => {
                const active = item.id === 'custom' ? Boolean(draft.customImage) : isSelected(item);
                return (
                  <div
                    key={item.id}
                    className={`nx-phone-preview ${active ? 'selected' : ''}`}
                    onClick={() => {
                      if (!active) {
                        if (item.id === 'custom') return;
                        handleSelectPreset(item.id);
                      } else {
                        setView('gallery');
                      }
                    }}
                  >
                    <div className="nx-phone-preview-bg" style={{ background: item.css }}>
                      <div className="nx-phone-preview-fade" />
                    </div>

                    {/* CONTENIDO SIMULADO DEL TELÉFONO */}
                    <div style={{ position: 'relative', zIndex: 2, padding: '16px 14px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '26px' }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.28)' }} />
                        <span style={{ flex: 1, height: '18px', borderRadius: '999px', background: 'rgba(255,255,255,0.2)' }} />
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '10px', opacity: 0.85 }}>{accountLabel}</span>
                        <strong style={{ display: 'block', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', margin: '2px 0 8px' }}>
                          {balanceDisplay}
                        </strong>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 12px',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.22)',
                          fontSize: '9px',
                          fontWeight: 600,
                        }}>
                          Cuentas
                        </span>
                      </div>

                      {/* ICONO CENTRAL DE GALERÍA COMO EN LA CAPTURA DE REVOLUT */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setView('gallery');
                          }}
                          aria-label="Abrir galería de fondos"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            border: 0,
                            background: 'rgba(255,255,255,0.92)',
                            color: '#111418',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          }}
                        >
                          <ImageIcon size={16} />
                        </button>
                      </div>
                    </div>

                    {/* PARTE INFERIOR SIMULADA DEL MÓVIL */}
                    <div style={{ position: 'relative', zIndex: 2, padding: '0 14px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '12px' }}>
                        {[0, 1, 2, 3].map((dot) => (
                          <span key={dot} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.14)' }} />
                        ))}
                      </div>
                      <div style={{
                        height: '92px',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.08)',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.16)' }} />
                          <span style={{ width: '64px', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.16)' }} />
                          <span style={{ width: '48px', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.16)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TIRA CIRCULAR DE MINIATURAS INFERIORES */}
            <div className="nx-circle-strip">
              <button
                type="button"
                className="nx-circle-swatch"
                onClick={() => handleSelectPreset('indigo-wave')}
                aria-label="Restablecer fondo por defecto"
              >
                <span className="nx-circle-disc" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <RotateCcw size={17} />
                </span>
                <span>Original</span>
              </button>

              {HOME_BACKGROUNDS.slice(0, 6).map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={`nx-circle-swatch ${isSelected(bg) ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(bg.id)}
                >
                  <span className="nx-circle-disc" style={{ background: bg.thumbCss }} />
                  <span>{bg.shortName}</span>
                </button>
              ))}

              <button
                type="button"
                className={`nx-circle-swatch ${draft.customImage ? 'active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <span
                  className="nx-circle-disc"
                  style={{
                    background: draft.customImage
                      ? `url('${draft.customImage}') center / cover no-repeat`
                      : 'rgba(255,255,255,0.12)',
                  }}
                >
                  {!draft.customImage && <Upload size={16} />}
                </span>
                <span>Subir</span>
              </button>
            </div>

            {/* BOTÓN BLANCO APLICAR */}
            <div style={{ padding: '0 18px' }}>
              <button
                type="button"
                className="nx-btn-primary"
                style={{ width: '100%' }}
                onClick={handleApply}
              >
                Aplicar
              </button>
            </div>
          </>
        )}

        {/* VISTA 2: GALERÍA DE FONDOS EN 3 COLUMNAS */}
        {view === 'gallery' && (
          <>
            <div className="nx-bg-tabs">
              {['Todo', 'Minimal', 'Glass', 'Colores'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`nx-bg-tab ${activeFilter === tab ? 'active' : ''}`}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="nx-bg-grid">
              {draft.customImage && activeFilter === 'Todo' && (
                <button
                  type="button"
                  className="nx-bg-tile selected"
                  style={{ background: `url('${draft.customImage}') center / cover no-repeat` }}
                  onClick={() => setView('preview')}
                >
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Check size={13} strokeWidth={2.5} />
                  </span>
                </button>
              )}

              {filteredPresets.map((bg) => {
                const selected = isSelected(bg);
                return (
                  <button
                    key={bg.id}
                    type="button"
                    className={`nx-bg-tile ${selected ? 'selected' : ''}`}
                    style={{ background: bg.thumbCss }}
                    onClick={() => {
                      handleSelectPreset(bg.id);
                      setView('preview');
                    }}
                    aria-label={bg.name}
                  >
                    {selected && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Check size={13} strokeWidth={2.5} />
                      </span>
                    )}
                    <span style={{
                      position: 'absolute',
                      left: '8px',
                      right: '8px',
                      bottom: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      textAlign: 'left',
                      textShadow: '0 1px 6px rgba(0,0,0,0.65)',
                    }}>
                      {bg.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default HomeThemeModal;