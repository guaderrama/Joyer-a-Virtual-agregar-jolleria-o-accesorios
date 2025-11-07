import type { ModelPhoto, Item } from './types';

export const cleanJsonString = (text: string): string => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
        return match[1];
    }
    return text.trim();
};

const formatScaleInstruction = (scale: number): string => {
    if (scale === 1) return '';
    const percentage = Math.round(Math.abs(scale - 1) * 100);
    if (percentage === 0) return '';
    if (scale > 1) {
        return ` y debe ser aproximadamente un ${percentage}% más grande de lo normal`;
    } else {
        return ` y debe ser aproximadamente un ${percentage}% más pequeño de lo normal`;
    }
};

const getBaseRules = (modelPhoto: ModelPhoto) => `
    MANDATO ABSOLUTO: ERES UNA HERRAMIENTA DE EDICIÓN PRECISA, NO UN CREADOR DE IMÁGENES. TU ÚNICA FUNCIÓN ES SUPERPONER ARTÍCULOS SOBRE UNA IMAGEN EXISTENTE SIN ALTERARLA.

    REGLAS CRÍTICAS INVIOLABLES (EL INCUMPLIMIENTO DE CUALQUIERA DE ELLAS ES UN FRACASO TOTAL):

    1.  **IDENTIDAD HUMANA SACROSANTA**:
        -   NUNCA, BAJO NINGUNA CIRCUMSTANCIA, ALTERES EL ROSTRO DE LA PERSONA. La cara, los ojos, la nariz, la boca, la expresión facial y la piel deben permanecer 100% idénticos a la foto original.
        -   LA ESTRUCTURA ÓSEA, la forma del cuerpo y la pose NO DEBEN CAMBIAR EN LO MÁS MÍNIMO.
        -   PRESERVA EL CABELLO: No cambies su estilo, color, textura o posición.

    2.  **FONDO Y ENTORNO INMUTABLES**:
        -   EL FONDO DEBE PERMANECER IDÉNTICO. No elimines, añadas ni modifiques ningún objeto, textura o elemento de iluminación del entorno.

    3.  **PRECISIÓN TÉCNICA**:
        -   DIMENSIONES EXACTAS: La imagen final DEBE tener exactamente las mismas dimensiones que la original: ${modelPhoto.width}px de ancho por ${modelPhoto.height}px de alto. NO la recortes ni redimensiones.
        -   CAMBIOS MÍNIMOS: El único cambio permitido es la adición de los artículos. Piensa en esto como pegar una capa fotorrealista sobre la imagen original. No hay más cambios autorizados.

    CUALQUIER DESVIACIÓN, POR MÍNIMA QUE SEA, DE ESTAS REGLAS RESULTARÁ EN UN FALLO. LA IMAGEN ORIGINAL ES LA VERDAD ABSOLUTA.
`;

const JSON_OUTPUT_SCHEMA = `
\`\`\`json
{
  "status": "ok | needs_input | error",
  "summary": "Resumen en español de la operación realizada.",
  "placements": [ { "item_index": 0, "categoria": "string", "confidence": 0.9 } ],
  "debug": { "notes": "Notas breves sobre el proceso de edición." }
}
\`\`\`
Si no puedes completar la solicitud, establece status='needs_input' y explica el motivo en 'summary'.
`;

export const buildInitialPrompt = (modelPhoto: ModelPhoto, items: Item[], settings: any) => {
    const itemDescriptions = items.map((item, index) => {
        let description = `- Artículo ${index + 1} (Imagen ${index + 2}): Es un/a '${item.category}'`;
        switch (item.category) {
            case 'anillo':
                if (item.finger) description += ` en el dedo '${item.finger}'`;
                break;
            case 'pulsera':
                if (item.wrist) description += ` en la muñeca '${item.wrist}'`;
                break;
            case 'arete':
                if (item.side) description += ` para el lado '${item.side}'`;
                break;
            case 'sombrero':
                description += ` que debe colocarse sobre la cabeza de forma natural`;
                break;
            case 'bufanda':
                description += ` que debe colocarse alrededor del cuello`;
                break;
            case 'bolso de mano':
                if (item.hand) description += ` que debe sostener con la mano '${item.hand}' de forma natural`;
                else description += ` que debe sostener con una de las manos de forma natural`;
                break;
        }
        description += formatScaleInstruction(item.scale);
        return description;
    }).join('\n            ');

    return `
        ${getBaseRules(modelPhoto)}

        OBJETIVO: Sobre la imagen base de la modelo, integra los siguientes artículos con el máximo fotorrealismo posible, siguiendo las reglas críticas y el proceso de análisis al pie de la letra.

        ARTÍCULOS A INTEGRAR:
        ${itemDescriptions}

        PROCESO DE ANÁLIS-IS E INTEGRACIÓN FOTORREALISTA (OBLIGATORIO):

        PASO 1: ANÁLISIS DE LA ESCENA (FOTO DEL MODELO)
        -   Iluminación: Identifica la dirección, intensidad, color (cálido/frío) y dureza (sombras nítidas/difusas) de la fuente de luz principal. Observa las luces de relleno y los reflejos existentes.
        -   Anatomía: Estudia las proporciones de la zona donde se colocará el artículo (ej. grosor del cuello, tamaño del dedo, contorno de la muñeca).

        PASO 2: ANÁLISIS DEL ARTÍCULO
        -   Material: Determina las propiedades del material del artículo (ej. oro pulido, plata cepillada, gema transparente, perla opaca).
        -   Escala Intrínseca: Estima el tamaño real del artículo.

        PASO 3: SÍNTESIS Y RENDERIZADO (LA PARTE MÁS IMPORTANTE)
        -   Escalado Adaptativo: Ajusta el tamaño del artículo para que se vea proporcionado y realista en la anatomía del modelo. Un anillo debe encajar en un dedo, no flotar sobre él. Un collar debe seguir la curva del cuello.
        -   Mapeo de Iluminación: Aplica luces y sombras sobre el artículo que sean 100% consistentes con la iluminación de la escena analizada en el PASO 1. Los reflejos en una joya de metal deben reflejar el entorno de la foto. Los brillos especulares deben coincidir con la dirección de la luz.
        -   Sombras Proyectadas: Genera sombras sutiles y precisas que el artículo proyectaría sobre la piel o la ropa del modelo. La forma y suavidad de esta sombra deben corresponder a la fuente de luz.
        -   Oclusión e Interacción: Asegúrate de que el artículo interactúe correctamente con el entorno (ej. una parte del collar se oculta bajo el cabello).

        CONFIGURACIÓN ADICIONAL:
        - Quitar joyería existente: ${settings.removeExisting}
        - Efecto de iluminación general a aplicar: ${settings.lightingEffect} (Usa esto como una guía, pero prioriza el análisis de la iluminación original).

        FORMATO DE SALIDA REQUERIDO:
        Tu respuesta DEBE contener dos partes:
        1. La imagen final editada en alta resolución.
        2. Un bloque de texto con un objeto JSON válido que siga este esquema exacto:
        ${JSON_OUTPUT_SCHEMA}
    `;
};

export const buildRefinePrompt = (modelPhoto: ModelPhoto, editingPrompt: string) => {
    return `
        TAREA DE RE-EDICIÓN: Modifica la "Imagen 2 (la versión ya editada)" según la instrucción, pero siguiendo las mismas reglas críticas de la creación inicial.

        ${getBaseRules(modelPhoto)}
        
        REGLA ADICIONAL DE REFINAMIENTO: Al aplicar la nueva instrucción, MANTÉN el nivel de fotorrealismo ya establecido. Asegúrate de que el escalado, la iluminación, los reflejos y las sombras del artículo modificado sigan siendo 100% consistentes con la foto original del modelo.

        IMÁGENES DE CONTEXTO:
        - Imagen 1: La foto ORIGINAL de la modelo. La identidad y la iluminación de esta escena son la VERDAD ABSOLUTA.
        - Imagen 2: La imagen que debes MODIFICAR.

        INSTRUCCIÓN DE RE-EDICIÓN: "${editingPrompt}"
        
        FORMATO DE SALIDA: Devuelve solo la nueva imagen editada y un objeto JSON como en la solicitud anterior.
    `;
};
