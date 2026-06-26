import { useState, useEffect, useCallback } from 'react';
import { fetchServiceOrders } from '../utils/supabaseLoader';

/**
 * Hook que carrega os dados de ordens de serviço do Supabase automaticamente
 * ao montar o componente. Expõe os dados no mesmo formato de data1 (array de arrays).
 *
 * @returns {{ data: Array, loading: boolean, error: string|null, refetch: Function }}
 */
export default function useSupabaseData(tableName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchServiceOrders(tableName);
      setData(rows);
    } catch (err) {
      console.error('[useSupabaseData]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
