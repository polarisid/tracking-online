import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'asc_0003198122';

/**
 * Ordem exata das colunas — cada posição corresponde ao índice numérico
 * usado pelos filtros em filters.js.
 * null = coluna sem equivalente no Supabase (fica como null no array).
 */
export const COLUMN_MAP = [
  null,                          // 0  — coluna A vazia/index no Excel original
  'service_order_no',            // 1  → combined[0] = SO No ✓
  'asc_job_no',                  // 2  → combined[3] (não crítico para filtros)
  'nome_cliente',                // 3
  'cidade',                      // 4
  'bairro',                      // 5
  'estado',                      // 6
  'cep',                         // 7
  'status',                      // 8  — texto do status
  'model',                       // 9  → filter row[9].includes('VD') checa modelo
  null,                          // 10
  'status_comment',              // 11 — código ST035, ST025 etc.
  null,                          // 12
  null,                          // 13 — HP030/HL005 (não existe no Supabase)
  'reason',                      // 14 — Motivo / Reason label
  'pending_aging_days',          // 15 — dias pendentes (filtros LTP)
  'request_date',                // 16 — data de abertura
  null,                          // 17
  null,                          // 18
  null,                          // 19
  null,                          // 20
  null,                          // 21
  'col_1st_visit_date',          // 22 — 1ª visita
  null,                          // 23
  'asc_last_appointment_date',   // 24 — data do agendamento ASC ← corrigido!
  null,                          // 25
  null,                          // 26
  'goods_delivered_date',        // 27 — data de entrega
  null,                          // 28
  null,                          // 29
  null,                          // 30
  null,                          // 31
  null,                          // 32
  null,                          // 33
  'service_type',                // 34 — IH / CI / II / SH
  null,                          // 35
  null,                          // 36
  'in_out_warranty_flag',        // 37 — LP / OW
  'engineer_name',               // 38
  null,                          // 39
  null,                          // 40
  null,                          // 41
  null,                          // 42
  null,                          // 43
  null,                          // 44
  null,                          // 45
  null,                          // 46
  null,                          // 47
  null,                          // 48
  null,                          // 49
  null,                          // 50
  null,                          // 51
  null,                          // 52
  'w_ty_exception',              // 53
  null,                          // 54
  null,                          // 55
  null,                          // 56
  null,                          // 57
  'service_product_code',        // 58 — REF01, LED01, HTS01 etc.
  'service_product_description', // 59
  null,                          // 60
  'parts_no01',                  // 61 — Peça 01
];

/**
 * Formata uma string de data para DD/MM/YYYY se necessário.
 * O Supabase pode retornar datas em ISO (2026-06-19) ou no formato já legível.
 */
const formatDate = (value) => {
  if (!value || value === '00/00/0000') return value;

  // ISO format: 2026-06-19 → 19/06/2026
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  return value;
};

const DATE_INDICES = new Set([16, 22, 24, 27]);

/**
 * Converte um objeto de linha do Supabase em array indexado,
 * mantendo o mesmo formato que fileUploader.js produz a partir do Excel.
 */
const rowToArray = (obj) => {
  const row = COLUMN_MAP.map((colName, idx) => {
    if (!colName) return null;
    const val = obj[colName] ?? null;
    if (DATE_INDICES.has(idx) && val) return formatDate(val);
    return val;
  });

  const STATUS_MAP = {
    'ST015': 'Acknowledge(ASC)',
    'ST025': 'Engineer Assigned',
    'ST030': 'Pending',
    'ST035': 'Repair Completed'
  };

  const INVERSE_STATUS_MAP = {
    'Acknowledge(ASC)': 'ST015',
    'Engineer Assigned': 'ST025',
    'Pending': 'ST030',
    'Repair Completed': 'ST035'
  };

  const REASON_MAP = {
    'HE004': 'Appointment Date is set',
    'HE005': 'Repair in progress',
    'HP030': 'Waiting for Confirmation from customer',
    'HEZ03': 'FTF(Ready to go)'
  };

  const INVERSE_REASON_MAP = {
    'Appointment Date is set': 'HE004',
    'Repair in progress': 'HE005',
    'Waiting for Confirmation from customer': 'HP030',
    'FTF(Ready to go)': 'HEZ03'
  };

  const statusCode = row[11];
  const statusVal = row[8];
  const reasonCode = row[13];
  const reasonVal = row[14];

  if (statusCode && STATUS_MAP[statusCode]) {
    row[8] = STATUS_MAP[statusCode];
  } else if (statusVal && INVERSE_STATUS_MAP[statusVal]) {
    row[11] = INVERSE_STATUS_MAP[statusVal];
  }

  if (reasonCode && REASON_MAP[reasonCode]) {
    row[14] = REASON_MAP[reasonCode];
  } else if (reasonVal && INVERSE_REASON_MAP[reasonVal]) {
    row[13] = INVERSE_REASON_MAP[reasonVal];
  }

  return row;
};

/**
 * Busca todos os registros da tabela com paginação automática.
 * Retorna [headerRow, ...dataRows] — o mesmo formato de data1 em HomeContext.
 */
export const fetchServiceOrders = async (tableName = TABLE_NAME) => {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Supabase fetch error on table ${tableName}: ${error.message}`);

    allRows = allRows.concat(data);
    hasMore = data.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  if (allRows.length === 0) return [];

  // ===== DIAGNÓSTICO =====
  console.group('[Supabase] Diagnóstico de campos críticos');
  console.log('Total de linhas:', allRows.length);

  // Mostra exemplos dos 5 primeiros valores dos campos críticos dos filtros
  const sample = allRows.slice(0, 5).map(r => ({
    'row[11] status_comment': r.status_comment,
    'row[34] service_type':   r.service_type,
    'row[37] warranty_flag':  r.in_out_warranty_flag,
    'row[15] aging_days':     r.pending_aging_days,
    'row[22] appointment':    r.asc_last_appointment_date,
    'row[24] 1st_visit':      r.col_1st_visit_date,
    'row[58] product_code':   r.service_product_code,
  }));
  console.table(sample);
  console.groupEnd();
  // ===========================

  // Header row com os nomes das colunas (substitui row[0] do Excel)
  const headerRow = COLUMN_MAP.map((col) => col ?? '');

  const dataRows = allRows.map(rowToArray);

  return [headerRow, ...dataRows];
};
