import React, { useState } from 'react';
import type { AppState } from './types';

interface OutputPanelProps {
    state: AppState;
    onRefine: (prompt: string) => void;
    onOpenModal: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ state, onRefine, onOpenModal }) => {
    const [activeTab, setActiveTab] = useState('resultado');
    const [editingPrompt, setEditingPrompt] = useState('');

    const handleRefineSubmit = () => {
        onRefine(editingPrompt);
        setEditingPrompt('');
    };

    return (
        <>
            <div className="tab-bar">
                <button className={`tab-btn ${activeTab === 'resultado' ? 'active' : ''}`} onClick={() => setActiveTab('resultado')}>Resultado</button>
                <button className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`} onClick={() => setActiveTab('json')} disabled={!state.resultData}>JSON</button>
            </div>

            <div className="tab-content">
                {state.loading && !state.isRefining && (
                    <div className="dynamic-loading">
                        <div className="spinner"></div>
                        <p>{state.loadingMessage}</p>
                    </div>
                )}
                
                {state.error && <div className="error-message">{state.error}</div>}
                
                {!state.loading && !state.error && activeTab === 'resultado' && (
                    <div className="result-wrapper">
                        {!state.resultImage && (
                          <div className="welcome-placeholder">
                              <h2>Bienvenido a Joyería Virtual</h2>
                              <p>Prueba joyas en tus fotos en 3 simples pasos:</p>
                              <ol>
                                  <li><span>1.</span>Sube la foto de una persona.</li>
                                  <li><span>2.</span>Añade las joyas que quieras probar.</li>
                                  <li><span>3.</span>¡Genera la magia!</li>
                              </ol>
                          </div>
                        )}
                        {state.resultImage && (
                            <div className="result-image-container">
                                {state.isRefining && <div className="loading-skeleton" style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1}}></div>}
                                <img src={state.resultImage} alt="Resultado final" className="result-image" style={{visibility: state.isRefining ? 'hidden' : 'visible' }} />
                                 <div className="result-actions">
                                    <a href={state.resultImage} download="joyeria-virtual.png" className="action-btn">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                                      Descargar
                                    </a>
                                    <button onClick={onOpenModal} className="action-btn">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>
                                      Ampliar
                                    </button>
                                 </div>
                            </div>
                        )}
                        {state.resultImage && (
                             <div className="refine-controls">
                                <input type="text" value={editingPrompt} onChange={(e) => setEditingPrompt(e.target.value)} placeholder="Refinar imagen (ej: 'haz el collar más grande')" className="refine-input" />
                                <button onClick={handleRefineSubmit} disabled={state.isRefining || !editingPrompt} className="refine-btn">
                                    {state.isRefining ? '...' : 'Refinar'}
                                </button>
                             </div>
                        )}
                    </div>
                )}
                
                {!state.loading && !state.error && activeTab === 'json' && state.resultData && (
                    <pre className="json-output">
                        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(state.resultData, null, 2))} className="copy-btn">Copiar</button>
                        {JSON.stringify(state.resultData, null, 2)}
                    </pre>
                )}
            </div>
        </>
    );
};
