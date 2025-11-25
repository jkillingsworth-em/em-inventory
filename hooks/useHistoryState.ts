import { useState, useCallback } from 'react';
import { InventoryItem, Stock } from '../types';

interface AppState {
    items: InventoryItem[];
    stock: Stock[];
    categoryColors: Record<string, string>;
}

export const useHistoryState = (initialState: AppState): [AppState, (newState: AppState | ((prevState: AppState) => AppState)) => void, () => void, () => void, boolean, boolean] => {
    const [history, setHistory] = useState<AppState[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = useCallback((newState: AppState | ((prevState: AppState) => AppState)) => {
        const currentState = history[currentIndex];
        const nextState = typeof newState === 'function' ? newState(currentState) : newState;
        
        if (JSON.stringify(nextState) === JSON.stringify(currentState)) {
            return;
        }

        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(nextState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [history, currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, history.length]);
    
    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;
    
    const currentState = history[currentIndex];

    return [currentState, setState, undo, redo, canUndo, canRedo];
};
