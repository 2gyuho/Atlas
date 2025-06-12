import { useState, useEffect } from 'react';

export const useApiDebug = () => {
    const [apiCalls, setApiCalls] = useState([]);
    const [isDebugMode, setIsDebugMode] = useState(true);

    const logApiCall = (method, url, status, data, error) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method,
            url,
            status,
            data,
            error,
            id: Date.now() + Math.random()
        };
        
        if (isDebugMode) {
            console.log('🔍 API Debug:', logEntry);
        }
        
        setApiCalls(prev => [logEntry, ...prev].slice(0, 50)); // 최근 50개만 유지
    };

    const clearLogs = () => setApiCalls([]);

    return {
        apiCalls,
        logApiCall,
        clearLogs,
        isDebugMode,
        setIsDebugMode
    };
};
