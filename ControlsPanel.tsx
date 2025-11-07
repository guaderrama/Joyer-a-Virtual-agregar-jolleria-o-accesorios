import React, { useState } from 'react';
import type { Item, ModelPhoto } from './types';
import { ItemCard } from './ItemCard';

interface ControlsPanelProps {
    modelPhoto: ModelPhoto | null;
    onModelPhotoChange: (file: File | null) => void;
    onRemoveModelPhoto: () => void;
    items: Item[];
    onAddItem: () => void;
    onItemChange: (id: number, field: keyof Item, value: any) => void;
    onRemoveItem: (id: number) => void;
    onSubmit: () => void;
    canSubmit: boolean;
    loading: boolean;
    maxItems: number;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
    modelPhoto,
    onModelPhotoChange,
    onRemoveModelPhoto,
    items,
    onAddItem,
    onItemChange,
    onRemoveItem,
    onSubmit,
    canSubmit,
    loading,
    maxItems
}) => {
    const [isDraggingModel, setIsDraggingModel] = useState(false);
    
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent, callback: (file: File) => void) => {
        e.preventDefault();
        setIsDraggingModel(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            callback(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    return (
        <aside className="controls-panel">
            <div className="form-group">
                <label>1. Sube la foto del modelo</label>
                <div
                    className={`drop-zone ${isDraggingModel ? 'drag-over' : ''} ${modelPhoto ? 'disabled' : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => !modelPhoto && setIsDraggingModel(true)}
                    onDragLeave={() => setIsDraggingModel(false)}
                    onDrop={(e) => handleDrop(e, onModelPhotoChange)}
                >
                    <label htmlFor="model-photo-input" className={`file-input-label ${modelPhoto ? 'disabled' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 4.095 0 5.555 0 7.318 0 9.366 1.708 11 3.781 11H7.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11h4.188C14.502 11 16 9.57 16 7.773c0-1.636-1.242-2.969-2.834-3.194C12.923 1.99 10.69 0 8 0zm-.5 14.5V11h1v3.5a.5.5 0 0 1-1 0z"/></svg>
                        <span>{modelPhoto ? modelPhoto.name : 'Arrastra o selecciona...'}</span>
                    </label>
                    <input id="model-photo-input" type="file" accept="image/png, image/jpeg" onChange={(e) => onModelPhotoChange(e.target.files ? e.target.files[0] : null)} disabled={!!modelPhoto} />
                </div>
                <p className="photo-tips">Para mejores resultados, usa fotos claras y bien iluminadas.</p>

                {modelPhoto && (
                  <div className="image-preview-container">
                    <img src={`data:${modelPhoto.mimeType};base64,${modelPhoto.base64}`} alt="Preview del modelo" className="image-preview" />
                    <button onClick={onRemoveModelPhoto} className="remove-image-btn" aria-label="Quitar imagen del modelo">&times;</button>
                  </div>
                )}
            </div>
          
            <div className="items-container">
                <label>2. Sube los artículos (máx. {maxItems})</label>
                {items.map((item, index) => (
                    <ItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        onItemChange={onItemChange}
                        onRemoveItem={onRemoveItem}
                    />
                ))}
            </div>

            <button onClick={onAddItem} disabled={items.length >= maxItems} className="add-item-btn">
                Añadir artículo
            </button>
          
            <button onClick={onSubmit} disabled={!canSubmit} className="submit-btn">
                {loading ? 'Procesando...' : 'Generar Imagen'}
            </button>
        </aside>
    );
};
