/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useReducer } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";
import { ControlsPanel } from './ControlsPanel';
import { OutputPanel } from './OutputPanel';
import { fileToBase64 } from './fileUtils';
import { buildInitialPrompt, buildRefinePrompt, cleanJsonString } from './promptBuilder';
import type { Item, ModelPhoto, ResponseData, AppState, AppAction } from './types';

const API_KEY = process.env.API_KEY;
const MAX_ITEMS = 3;

// --- STATE MANAGEMENT (useReducer) ---
const initialState: AppState = {
    loading: false,
    isRefining: false,
    loadingMessage: '',
    error: null,
    resultImage: null,
    resultData: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'START_SUBMIT':
            return {
                ...initialState,
                loading: true,
                loadingMessage: 'Iniciando proceso...',
            };
        case 'START_REFINE':
            return { ...state, isRefining: true, error: null };
        case 'SET_LOADING_MESSAGE':
            return { ...state, loadingMessage: action.payload };
        case 'SET_SUCCESS':
            return {
                ...state,
                resultImage: action.payload.image,
                resultData: action.payload.data,
                error: action.payload.data?.status === 'error' || action.payload.data?.status === 'needs_input'
                    ? action.payload.data.summary || 'El modelo indicó un problema con la entrada.'
                    : null,
            };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false, isRefining: false };
        case 'FINISH_PROCESSING':
            return { ...state, loading: false, isRefining: false };
        default:
            return state;
    }
}

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [modelPhoto, setModelPhoto] = useState<ModelPhoto | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState({
    removeExisting: 'auto',
    lightingEffect: 'ninguna',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);
  
  const loadingTexts = [
      'Analizando la iluminación de la escena...',
      'Estudiando las proporciones anatómicas...',
      'Determinando las propiedades del material de la joya...',
      'Ajustando la escala del artículo para un calce perfecto...',
      'Mapeando luces y sombras para mayor realismo...',
      'Generando reflejos consistentes con el entorno...',
      'Proyectando sombras sutiles sobre la piel...',
      'Finalizando la composición de la imagen...'
  ];

  useEffect(() => {
      let interval: number;
      if (state.loading && !state.isRefining) {
          dispatch({ type: 'SET_LOADING_MESSAGE', payload: loadingTexts[0] });
          let i = 1;
          interval = window.setInterval(() => {
              dispatch({ type: 'SET_LOADING_MESSAGE', payload: loadingTexts[i % loadingTexts.length] });
              i++;
          }, 2500);
      }
      return () => { if (interval) clearInterval(interval); };
  }, [state.loading, state.isRefining]);

  const handleFileSelected = async (file: File, callback: (data: any) => void) => {
      if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
          const { base64, mimeType } = await fileToBase64(file);
          callback({ name: file.name, base64, mimeType });
      } else {
          dispatch({ type: 'SET_ERROR', payload: "Por favor, selecciona un archivo de imagen (JPG o PNG)." });
      }
  };

  const handleModelPhotoChange = (file: File | null) => {
    if (!file) return;
    handleFileSelected(file, (data) => {
        const img = new Image();
        img.onload = () => setModelPhoto({ ...data, width: img.width, height: img.height });
        img.src = `data:${data.mimeType};base64,${data.base64}`;
    });
  };

  const handleAddItem = () => {
    if (items.length < MAX_ITEMS) {
      setItems([...items, { id: Date.now(), image: null, category: 'collar', side: '', finger: '', wrist: '', hand: '', scale: 1 }]);
    }
  };

  const handleItemChange = async (id: number, field: keyof Item, value: any) => {
      if (field === 'image' && value instanceof File) {
          handleFileSelected(value, (imageData) => {
              setItems(currentItems => currentItems.map(item => item.id === id ? { ...item, image: imageData } : item));
          });
      } else {
         setItems(currentItems => currentItems.map(item => item.id === id ? { ...item, [field]: value } : item));
      }
  };
  
  const processApiResponse = (response: any) => {
      let foundImage: string | null = null;
      let responseData: ResponseData | null = null;

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          foundImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          try {
            responseData = JSON.parse(cleanJsonString(part.text));
          } catch(e) {
            console.error("JSON parsing error:", e, "Raw text:", part.text);
            dispatch({ type: 'SET_ERROR', payload: "Error al procesar la respuesta del modelo (JSON inválido)." });
            return;
          }
        }
      }

      if (foundImage) {
        dispatch({ type: 'SET_SUCCESS', payload: { image: foundImage, data: responseData }});
      } else {
        dispatch({ type: 'SET_ERROR', payload: "La respuesta del modelo no contenía una imagen." });
      }
  };

  const handleSubmit = useCallback(async () => {
    if (!modelPhoto || items.length === 0 || items.some(item => !item.image)) {
      dispatch({ type: 'SET_ERROR', payload: 'Por favor, sube una foto del modelo y al menos una imagen de un artículo.'});
      return;
    }

    dispatch({ type: 'START_SUBMIT' });

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const textPrompt = buildInitialPrompt(modelPhoto, items, settings);

      const contents = {
        parts: [
          { inlineData: { data: modelPhoto.base64, mimeType: modelPhoto.mimeType } },
          ...items.flatMap(item => item.image ? [{ inlineData: { data: item.image.base64, mimeType: item.image.mimeType } }] : []),
          { text: textPrompt },
        ]
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
        config: { responseModalities: [Modality.IMAGE] },
      });

      processApiResponse(response);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      dispatch({ type: 'SET_ERROR', payload: `Ocurrió un error al contactar la API de Gemini: ${errorMessage}` });
    } finally {
      dispatch({ type: 'FINISH_PROCESSING' });
    }
  }, [modelPhoto, items, settings]);
  
  const handleRefineImage = useCallback(async (editingPrompt: string) => {
    if (!editingPrompt || !state.resultImage || !modelPhoto) {
        dispatch({ type: 'SET_ERROR', payload: "No hay imagen para refinar o falta la instrucción."});
        return;
    }
    
    dispatch({ type: 'START_REFINE' });

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const resultImageBase64 = state.resultImage.split(',')[1];
        const resultImageMimeType = state.resultImage.match(/data:(.*);/)?.[1] || 'image/png';
        const refinePrompt = buildRefinePrompt(modelPhoto, editingPrompt);

        const contents = {
            parts: [
                { inlineData: { data: modelPhoto.base64, mimeType: modelPhoto.mimeType } },
                { inlineData: { data: resultImageBase64, mimeType: resultImageMimeType } },
                { text: refinePrompt }
            ]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents,
            config: { responseModalities: [Modality.IMAGE] },
        });

        processApiResponse(response);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        dispatch({ type: 'SET_ERROR', payload: `Ocurrió un error durante el refinamiento: ${errorMessage}` });
    } finally {
        dispatch({ type: 'FINISH_PROCESSING' });
    }
}, [state.resultImage, modelPhoto]);

  const canSubmit = modelPhoto && items.length > 0 && items.every(i => i.image) && !state.loading && !state.isRefining;

  return (
    <>
      <header>
        <h1>Joyería Virtual</h1>
        <p className="app-description">Sube una foto y prueba virtualmente collares, anillos, pulseras y aretes con un realismo asombroso.</p>
      </header>
      <div className="app-container">
        <ControlsPanel
            modelPhoto={modelPhoto}
            onModelPhotoChange={handleModelPhotoChange}
            onRemoveModelPhoto={() => setModelPhoto(null)}
            items={items}
            onAddItem={handleAddItem}
            onItemChange={handleItemChange}
            onRemoveItem={(id) => setItems(items.filter(item => item.id !== id))}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
            loading={state.loading || state.isRefining}
            maxItems={MAX_ITEMS}
        />
        <main className="output-panel">
            <OutputPanel 
                state={state} 
                onRefine={handleRefineImage}
                onOpenModal={() => setIsModalOpen(true)}
            />
        </main>
      </div>
      
      {isModalOpen && state.resultImage && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <img src={state.resultImage} alt="Resultado en pantalla completa" className="modal-image"/>
                <button onClick={() => setIsModalOpen(false)} className="modal-close-btn" aria-label="Cerrar vista ampliada">&times;</button>
            </div>
        </div>
      )}
    </>
  );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}
