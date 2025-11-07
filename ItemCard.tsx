import React, { useState } from 'react';
import type { Item } from './types';

interface ItemCardProps {
    item: Item;
    index: number;
    onItemChange: (id: number, field: keyof Item, value: any) => void;
    onRemoveItem: (id: number) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, index, onItemChange, onRemoveItem }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onItemChange(item.id, 'image', e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };
    
    const handleRemoveImage = () => {
        onItemChange(item.id, 'image', null);
    }

    return (
        <div className="item-card">
            <div className="item-header">
                <h4>Artículo {index + 1}</h4>
                <button onClick={() => onRemoveItem(item.id)} className="remove-item-btn" aria-label={`Quitar artículo ${index + 1}`}>&times;</button>
            </div>
            
            <div
                className={`item-image-uploader drop-zone ${isDragging ? 'drag-over' : ''} ${item.image ? 'disabled' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={() => !item.image && setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                {item.image ? (
                    <div className="image-preview-container">
                        <img src={`data:${item.image.mimeType};base64,${item.image.base64}`} alt={`Preview del artículo ${index + 1}`} className="image-preview" />
                        <button onClick={handleRemoveImage} className="remove-image-btn" aria-label="Quitar imagen del artículo">&times;</button>
                    </div>
                ) : (
                    <label htmlFor={`item-image-input-${item.id}`} className="file-input-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                        <span style={{ flexShrink: 1 }}>Arrastra o sube...</span>
                    </label>
                )}
                <input id={`item-image-input-${item.id}`} type="file" accept="image/png, image/jpeg" onChange={(e) => e.target.files && onItemChange(item.id, 'image', e.target.files[0])} style={{ display: 'none' }} />
            </div>

            <div className="form-group" style={{marginTop: '16px'}}>
                <label htmlFor={`category-select-${item.id}`}>Categoría</label>
                <select id={`category-select-${item.id}`} className="input" value={item.category} onChange={(e) => onItemChange(item.id, 'category', e.target.value)}>
                    <option value="collar">Collar</option>
                    <option value="anillo">Anillo</option>
                    <option value="pulsera">Pulsera</option>
                    <option value="arete">Aretes</option>
                    <option value="sombrero">Sombrero</option>
                    <option value="bufanda">Bufanda</option>
                    <option value="bolso de mano">Bolso de mano</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor={`scale-slider-${item.id}`}>Ajuste de Tamaño</label>
                <div className="scale-control">
                    <input
                        id={`scale-slider-${item.id}`}
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={item.scale}
                        onChange={(e) => onItemChange(item.id, 'scale', parseFloat(e.target.value))}
                        className="scale-slider"
                    />
                    <span>{Math.round(item.scale * 100)}%</span>
                </div>
            </div>

            {item.category === 'anillo' && (
                <div className="form-group">
                    <label htmlFor={`finger-select-${item.id}`}>Dedo</label>
                    <select id={`finger-select-${item.id}`} className="input" value={item.finger} onChange={(e) => onItemChange(item.id, 'finger', e.target.value)}>
                        <option value="">Cualquiera</option>
                        <option value="índice">Índice</option>
                        <option value="corazón">Corazón</option>
                        <option value="anular">Anular</option>
                        <option value="meñique">Meñique</option>
                        <option value="pulgar">Pulgar</option>
                    </select>
                </div>
            )}

            {item.category === 'pulsera' && (
                <div className="form-group">
                    <label htmlFor={`wrist-select-${item.id}`}>Muñeca</label>
                    <select id={`wrist-select-${item.id}`} className="input" value={item.wrist} onChange={(e) => onItemChange(item.id, 'wrist', e.target.value)}>
                        <option value="">Cualquiera</option>
                        <option value="izquierda">Izquierda</option>
                        <option value="derecha">Derecha</option>
                    </select>
                </div>
            )}

            {item.category === 'arete' && (
                <div className="form-group">
                    <label htmlFor={`side-select-${item.id}`}>Lado</label>
                    <select id={`side-select-${item.id}`} className="input" value={item.side} onChange={(e) => onItemChange(item.id, 'side', e.target.value)}>
                        <option value="">Ambos</option>
                        <option value="izquierdo">Izquierdo</option>
                        <option value="derecho">Derecho</option>
                    </select>
                </div>
            )}
            
            {item.category === 'bolso de mano' && (
                <div className="form-group">
                    <label htmlFor={`hand-select-${item.id}`}>Mano</label>
                    <select id={`hand-select-${item.id}`} className="input" value={item.hand} onChange={(e) => onItemChange(item.id, 'hand', e.target.value)}>
                        <option value="">Cualquiera</option>
                        <option value="izquierda">Izquierda</option>
                        <option value="derecha">Derecha</option>
                    </select>
                </div>
            )}
        </div>
    );
};
