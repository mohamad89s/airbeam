import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'airbeam_transfer_history';
const MAX_HISTORY_ITEMS = 50;

export const useHistory = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const storedHistory = localStorage.getItem(STORAGE_KEY);
        if (storedHistory) {
            try {
                setHistory(JSON.parse(storedHistory));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }
    }, []);

    const addToHistory = useCallback((items) => {
        // Each item: { type, name, size, direction, timestamp }
        setHistory(prev => {
            const newHistory = [...items, ...prev].slice(0, MAX_HISTORY_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setHistory([]);
    }, []);

    return {
        history,
        addToHistory,
        clearHistory
    };
};
