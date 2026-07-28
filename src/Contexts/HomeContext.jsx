import { createContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import useActiveRoutes from "../hooks/useActiveRoutes";

export const HomeContext = createContext(null);

export function HomeProvider({ children }) {
  const { activeRoutes, activeOrderIdsSet, loading: activeRoutesLoading, refetch: refetchActiveRoutes } = useActiveRoutes();
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [combinedData_download, setCombinedData_download] = useState([]);
  const [visibleComponents, setVisibleComponents] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
    12: false,
    13: false,
    14: false,
  });

  const [selectedTable, setSelectedTable] = useState(() => {
    return localStorage.getItem('tracking_selected_table') || 'asc_0003198122';
  });

  const [tablesList, setTablesList] = useState(() => {
    const defaults = ['asc_0003198122', 'asc_0005286953'];
    try {
      const stored = localStorage.getItem('tracking_tables_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = Array.from(new Set([...defaults, ...parsed]));
        return merged;
      }
      return defaults;
    } catch (e) {
      return defaults;
    }
  });

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLocalMode, setIsLocalMode] = useState(() => {
    return localStorage.getItem('tracking_local_mode') === 'true';
  });

  const [userRole, setUserRole] = useState(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const checkPermissions = async () => {
    if (!user) return;
    try {
      // 1. Busca permissão do usuário logado
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error) {
        console.error('[Permissions] Erro ao carregar permissões:', error.message);
        setIsPendingApproval(true);
        setTablesList([]);
        return;
      }

      if (data) {
        // Usuário existe no cadastro de permissões
        setUserRole(data.role);
        setIsPendingApproval(false);

        const defaults = ['asc_0003198122', 'asc_0005286953'];
        let finalTables = [];

        if (data.allowed_tables?.includes('*') || data.role === 'admin') {
          // Acesso a todas
          try {
            const stored = localStorage.getItem('tracking_tables_list');
            const parsed = stored ? JSON.parse(stored) : [];
            finalTables = Array.from(new Set([...defaults, ...parsed]));
          } catch (e) {
            finalTables = defaults;
          }
        } else {
          // Acesso restrito
          finalTables = data.allowed_tables || [];
        }

        setTablesList(finalTables);

        // Ajusta a tabela selecionada ativa se não for permitida
        if (finalTables.length > 0 && !finalTables.includes(selectedTable)) {
          setSelectedTable(finalTables[0]);
        }
      } else {
        // Usuário não está na tabela de permissões. Vamos verificar se a tabela está totalmente vazia (bootstrapping)
        const { count, error: countError } = await supabase
          .from('user_permissions')
          .select('*', { count: 'exact', head: true });

        if (!countError && count === 0) {
          // A tabela de permissões está vazia! Registra o primeiro usuário como admin com acesso total
          const defaults = ['asc_0003198122', 'asc_0005286953'];
          const { error: insertError } = await supabase
            .from('user_permissions')
            .insert({
              email: user.email,
              role: 'admin',
              allowed_tables: ['*']
            });

          if (insertError) {
            console.error('[Permissions] Erro no auto-cadastro admin:', insertError.message);
            setIsPendingApproval(true);
            setTablesList([]);
          } else {
            console.log('[Permissions] Primeiro usuário autoinicializado como admin!');
            setUserRole('admin');
            setTablesList(defaults);
            setIsPendingApproval(false);
          }
        } else {
          // Já existem usuários cadastrados, então este novo usuário deve aguardar liberação
          setIsPendingApproval(true);
          setUserRole('user');
          setTablesList([]);
        }
      }
    } catch (err) {
      console.error('[Permissions] Erro genérico de permissões:', err);
      setIsPendingApproval(true);
      setTablesList([]);
    }
  };

  useEffect(() => {
    if (user) {
      checkPermissions();
    } else {
      setUserRole(null);
      setIsPendingApproval(false);
      // Reset tablesList para os padrões do local ao deslogar
      const defaults = ['asc_0003198122', 'asc_0005286953'];
      try {
        const stored = localStorage.getItem('tracking_tables_list');
        if (stored) {
          setTablesList(Array.from(new Set([...defaults, ...JSON.parse(stored)])));
        } else {
          setTablesList(defaults);
        }
      } catch (e) {
        setTablesList(defaults);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tracking_selected_table', selectedTable);
  }, [selectedTable]);

  useEffect(() => {
    localStorage.setItem('tracking_tables_list', JSON.stringify(tablesList));
  }, [tablesList]);

  useEffect(() => {
    localStorage.setItem('tracking_local_mode', isLocalMode);
  }, [isLocalMode]);

  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        setIsLocalMode(false); // desativa modo local ao autenticar
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsLocalMode(false);
  };

  const [dataSource, setDataSource] = useState("Sem dados");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [comparisonMode, setComparisonMode] = useState("last");

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!dataSource || dataSource === "Sem dados") return;

      // Extrai um identificador limpo para a tabela/arquivo
      let cleanSource = "local";
      if (dataSource.includes("Supabase")) {
        const match = dataSource.match(/\(([^)]+)\)/);
        cleanSource = match ? match[1] : "asc_0003198122";
      } else if (dataSource.includes("Planilha Local")) {
        const match = dataSource.match(/\(([^)]+)\)/);
        cleanSource = match ? match[1] : "local";
      } else {
        cleanSource = dataSource;
      }

      if (!user) {
        try {
          const stored = localStorage.getItem(`tracking_metrics_history_${cleanSource}`);
          if (stored) {
            setHistory(JSON.parse(stored));
            return;
          }
        } catch (e) {}
        return;
      }

      try {
        const { data, error } = await supabase
          .from('asc_metrics_history')
          .select('*')
          .eq('table_name', cleanSource)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map(row => ({
            timestamp: new Date(row.created_at).getTime(),
            quantity_LTP_VD: row.quantity_ltp_vd,
            quantity_EX_LTP_VD: row.quantity_ex_ltp_vd,
            inRoute: row.in_route,
            quantity_LTP_RAC_REF: row.quantity_ltp_rac_ref,
            quantity_EX_LTP_RAC_REF: row.quantity_ex_ltp_rac_ref,
            quantity_LTP_WSM: row.quantity_ltp_wsm,
            quantity_LTP_VD_CI: row.quantity_ltp_vd_ci,
            quantity_LTP_MX_CI: row.quantity_ltp_mx_ci,
            quantity_FTF: row.quantity_ftf,
            quantityDa: row.quantity_da,
            quantity_LP_up_to_3_days: row.quantity_lp_up_to_3_days,
            quantity_all_outdated_orders: row.quantity_all_outdated_orders,
            quantity_ALL_DA_OW: row.quantity_all_da_ow,
            quantity_DA_noParts: row.quantity_da_noparts,
            quantity_Oudated_IH: row.quantity_oudated_ih,
            quantity_Oudated_Repair_complete_IH: row.quantity_oudated_repair_complete_ih,
            quantity_complete_CI_LP: row.quantity_complete_ci_lp,
            quantity_complete_CI_OW_X09: row.quantity_complete_ci_ow_x09,
            quantity_complete_CI_OW_NOT_X09: row.quantity_complete_ci_ow_not_x09,
            quantity_POTENTIAL_first_visit: row.quantity_potential_first_visit,
            quantity_agenda_today: row.quantity_agenda_today,
            quantity_agenda_tomorrow: row.quantity_agenda_tomorrow,
            average: row.average,
            average2: row.average2
          }));
          setHistory(mapped);
          return;
        }
      } catch (e) {
        console.warn('[Supabase History] Falha ao carregar histórico do banco. Usando localStorage.', e.message);
      }

      // Fallback para localStorage
      try {
        const stored = localStorage.getItem(`tracking_metrics_history_${cleanSource}`);
        if (stored) {
          setHistory(JSON.parse(stored));
          return;
        }
      } catch (e) {
        console.error("Failed to parse localStorage history", e);
      }

      // Fallback para histórico fictício
      const now = Date.now();
      const mockMetrics = (offsetDays, variation) => ({
        timestamp: now - offsetDays * 24 * 60 * 60 * 1000 - (offsetDays === 0 ? 2 * 60 * 60 * 1000 : 0),
        quantity_LTP_VD: Math.max(0, 15 + variation),
        quantity_EX_LTP_VD: Math.max(0, 8 + variation),
        inRoute: Math.max(0, 6 + variation),
        quantity_LTP_RAC_REF: Math.max(0, 12 + variation),
        quantity_EX_LTP_RAC_REF: Math.max(0, 5 + variation),
        quantity_LTP_WSM: Math.max(0, 10 + variation),
        quantity_LTP_VD_CI: Math.max(0, 4 + variation),
        quantity_LTP_MX_CI: Math.max(0, 6 + variation),
        quantity_FTF: Math.max(0, 20 + variation),
        quantityDa: Math.max(0, 50 + variation),
        quantity_LP_up_to_3_days: Math.max(0, 14 + variation),
        quantity_all_outdated_orders: Math.max(0, 3 + variation),
        quantity_ALL_DA_OW: Math.max(0, 25 + variation),
        quantity_DA_noParts: Math.max(0, 18 + variation),
        quantity_Oudated_IH: Math.max(0, 2 + variation),
        quantity_Oudated_Repair_complete_IH: Math.max(0, 1 + variation),
        quantity_complete_CI_LP: Math.max(0, 9 + variation),
        quantity_complete_CI_OW_X09: Math.max(0, 4 + variation),
        quantity_complete_CI_OW_NOT_X09: Math.max(0, 7 + variation),
        quantity_POTENTIAL_first_visit: Math.max(0, 11 + variation),
        quantity_agenda_today: Math.max(0, 5 + variation),
        quantity_agenda_tomorrow: Math.max(0, 8 + variation),
        average: Math.max(1, 3.4 + variation * 0.1),
        average2: Math.max(1, 4.1 + variation * 0.1)
      });

      const mockHistory = [
        mockMetrics(30, -5),
        mockMetrics(7, -2),
        mockMetrics(1, 1),
        mockMetrics(0, -1)
      ];
      setHistory(mockHistory);
    };

    loadHistory();
  }, [dataSource, user]);

  return (
    <HomeContext.Provider
      value={{
        data1,
        setData1,
        data2,
        setData2,
        setFile1,
        setFile2,
        file1,
        file2,
        combinedData,
        setCombinedData,
        combinedData_download,
        setCombinedData_download,
        visibleComponents,
        setVisibleComponents,
        dataSource,
        setDataSource,
        lastUpdated,
        setLastUpdated,
        comparisonMode,
        setComparisonMode,
        history,
        setHistory,
        selectedTable,
        setSelectedTable,
        tablesList,
        setTablesList,
        session,
        user,
        isLocalMode,
        setIsLocalMode,
        signIn,
        signOut,
        activeRoutes,
        activeOrderIdsSet,
        activeRoutesLoading,
        refetchActiveRoutes,
        userRole,
        isPendingApproval,
        refreshPermissions: checkPermissions
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}
