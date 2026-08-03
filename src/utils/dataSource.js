/**
 * Extrai um identificador limpo (nome de tabela/arquivo) a partir da string
 * `dataSource` exibida na UI (ex: "Supabase (asc_0003198122)" -> "asc_0003198122").
 * Usado para agrupar histórico por dataset (ex: asc_metrics_history, critical_cases_snapshots).
 */
export function getCleanSourceName(dataSource) {
  if (dataSource && dataSource.includes('Supabase')) {
    const match = dataSource.match(/\(([^)]+)\)/);
    return match ? match[1] : 'asc_0003198122';
  }
  if (dataSource && dataSource.includes('Planilha Local')) {
    const match = dataSource.match(/\(([^)]+)\)/);
    return match ? match[1] : 'local';
  }
  if (dataSource) {
    return dataSource;
  }
  return 'local';
}
