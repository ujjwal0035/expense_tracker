import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';

/**
 * Custom hook to handle Server-Sent Events (SSE) for upload job tracking.
 *
 * @param {string|null} jobId - The UUID of the upload job to stream.
 * @returns {{ status, totalRows, processedRows, errorLog, isComplete, isStreaming }}
 */
export function useSSE(jobId) {
  const [status, setStatus] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [errorLog, setErrorLog] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const token = localStorage.getItem('token');
    // EventSource doesn't support custom headers, so we pass token as query param
    // For SSE with auth, we'll use fetch-based SSE instead
    const controller = new AbortController();
    setIsStreaming(true);
    setIsComplete(false);

    const streamEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/expenses/stream/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setStatus(data.status);
                setTotalRows(data.total_rows || 0);
                setProcessedRows(data.processed_rows || 0);

                if (data.error_log) {
                  setErrorLog(data.error_log);
                }

                if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                  setIsComplete(true);
                  setIsStreaming(false);
                  return;
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('SSE stream error:', err);
          setIsStreaming(false);
        }
      }
    };

    streamEvents();

    return () => {
      controller.abort();
      setIsStreaming(false);
    };
  }, [jobId]);

  const reset = useCallback(() => {
    setStatus(null);
    setTotalRows(0);
    setProcessedRows(0);
    setErrorLog(null);
    setIsComplete(false);
    setIsStreaming(false);
  }, []);

  return { status, totalRows, processedRows, errorLog, isComplete, isStreaming, reset };
}
