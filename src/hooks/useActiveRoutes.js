import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

/**
 * Hook for fetching active routes from the API.
 * Um único endpoint devolve as rotas de todas as unidades; a chamada passa pela
 * Edge Function `service-orders` (supabase/functions/service-orders), que guarda
 * a chave da API como secret — nunca no bundle do navegador.
 * Implements retry logic and error handling (System Design: Resilience).
 */
export default function useActiveRoutes() {
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [activeOrderIdsSet, setActiveOrderIdsSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWithRetry = useCallback(async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fnError } = await supabase.functions.invoke('service-orders');
      if (fnError) {
        // Corpo real do erro fica em `error.context` (mesmo padrão do IntelligencePanel).
        let detail = fnError.message;
        if (fnError.context && typeof fnError.context.json === 'function') {
          try {
            const body = await fnError.context.json();
            if (body?.error) detail = body.error;
          } catch {
            // corpo não era JSON, mantém a mensagem genérica
          }
        }
        throw new Error(detail);
      }
      if (!Array.isArray(data)) throw new Error(data?.error || 'Resposta inesperada da API de rotas.');
      setActiveRoutes(data);

      // Build order IDs set (cache layer)
      const ids = new Set();
      data.forEach(route => {
        route.stops?.forEach(stop => {
          if (stop.serviceOrder) ids.add(String(stop.serviceOrder).trim());
          if (stop.ascJobNumber) ids.add(String(stop.ascJobNumber).trim());
        });
        route.serviceOrders?.forEach(order => {
          if (order.serviceOrderNumber) ids.add(String(order.serviceOrderNumber).trim());
        });
      });
      setActiveOrderIdsSet(ids);
      setLoading(false);
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.warn(`useActiveRoutes: retry ${attempt}/${MAX_RETRIES}...`);
        setTimeout(() => fetchWithRetry(attempt + 1), RETRY_DELAY * attempt);
      } else {
        console.error('useActiveRoutes: all retries failed', err);
        setError(err.message);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchWithRetry();
  }, [fetchWithRetry]);

  const refetch = useCallback(() => fetchWithRetry(), [fetchWithRetry]);

  return { activeRoutes, activeOrderIdsSet, loading, error, refetch };
}
