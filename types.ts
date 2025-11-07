export interface Item {
  id: number;
  image: { name: string; base64: string; mimeType: string; } | null;
  category: string;
  side: string;
  finger: string;
  wrist: string;
  hand: string;
  scale: number;
}

export interface ModelPhoto {
    name: string;
    base64: string;
    mimeType: string;
    width: number;
    height: number;
}

export interface ResponseData {
  status: string;
  summary: string;
  placements: any[];
  debug: any;
}

// Reducer types
export interface AppState {
    loading: boolean;
    isRefining: boolean;
    loadingMessage: string;
    error: string | null;
    resultImage: string | null;
    resultData: ResponseData | null;
}

export type AppAction =
    | { type: 'START_SUBMIT' }
    | { type: 'START_REFINE' }
    | { type: 'SET_LOADING_MESSAGE'; payload: string }
    | { type: 'SET_SUCCESS'; payload: { image: string; data: ResponseData | null } }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'FINISH_PROCESSING' };
