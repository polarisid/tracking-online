import { useState, useEffect, useCallback } from 'react';

const API_URL_OLIVE = 'https://smartos-olive.vercel.app/api/service-orders';
const API_URL_SLZ = 'https://smartos-slz.vercel.app/api/service-orders';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

/**
 * Hook for fetching active routes from the API.
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
      
      const [resOlive, resSlz] = await Promise.all([
        fetch(API_URL_OLIVE).then(r => r.ok ? r.json() : []),
        fetch(API_URL_SLZ).then(r => r.ok ? r.json() : [])
      ]);
      const data = [...resOlive, ...resSlz];
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
