import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import filters from './filters';

/**
 * Classifica a linha em EX LTP, LTP ou Normal com base nas regras de dias pendentes.
 */
const getLtpClassification = (row) => {
  if (!row) return 'Normal';

  // 1. Checa EX-LTP
  if (
    filters.filter_VD_EX_LTP_LP(row) ||
    (filters.filter_REF_RAC_EX_LTP_LP && filters.filter_REF_RAC_EX_LTP_LP(row))
  ) {
    return 'EX LTP';
  }

  // 2. Checa LTP
  if (
    filters.filter_VD_LTP_LP(row) ||
    filters.filter_REF_RAC_LTP_LP(row) ||
    filters.filter_WSM_LP_LTP(row) ||
    filters.filter_CI_VD_LTP_LP(row) ||
    filters.filter_CI_MX_LTP_LP(row)
  ) {
    return 'LTP';
  }

  return 'Normal';
};

/**
 * Encontra a rota ativa e o status correspondente para um determinado ID de ordem de serviço.
 */
const findRouteForOrder = (orderId, activeRoutes) => {
  if (!orderId || !activeRoutes || !Array.isArray(activeRoutes)) {
    return { name: 'Sem Rota', status: 'Fora de Rota' };
  }

  const cleanId = String(orderId).trim();

  for (const route of activeRoutes) {
    // 1. Busca nos stops
    const hasStop = route.stops?.some(
      (stop) =>
        String(stop.serviceOrder || '').trim() === cleanId ||
        String(stop.ascJobNumber || '').trim() === cleanId
    );

    // 2. Busca na lista de ordens associadas
    const hasOrder = route.serviceOrders?.some(
      (o) => String(o.serviceOrderNumber || '').trim() === cleanId
    );

    if (hasStop || hasOrder) {
      // Determina status
      const isFinalized = route.finalizadas?.some(
        (o) => String(o.serviceOrderNumber || '').trim() === cleanId
      );
      const isPending = route.pendentes?.some(
        (o) => String(o.serviceOrderNumber || '').trim() === cleanId
      );
      const isToDo = route.a_fazer?.some(
        (o) => String(o.serviceOrderNumber || '').trim() === cleanId
      );

      let status = 'A Fazer';
      if (isFinalized) status = 'Concluída';
      else if (isPending) status = 'Pendente';
      else if (isToDo) status = 'A Fazer';

      return { name: route.name || 'Sem Nome', status };
    }
  }

  return { name: 'Sem Rota', status: 'Fora de Rota' };
};

/**
 * Exporta o relatório completo da nuvem enriquecido e estilizado.
 */
export const exportStyledCloudReport = (data1, activeRoutes, tableName) => {
  if (!data1 || data1.length <= 1) {
    alert('Não há dados disponíveis para exportar no momento.');
    return;
  }

  // 1. Prepara cabeçalhos
  const originalHeaders = data1[0];
  const newHeaders = [...originalHeaders, 'ROTA ATIVA', 'STATUS NA ROTA', 'CLASSIFICAÇÃO LTP'];

  const rows = [newHeaders];
  const rowClassifications = [];
  const rowRouteStatuses = [];

  // 2. Processa cada linha de dados
  const dataRows = data1.slice(1);
  dataRows.forEach((row) => {
    const orderId = row[1]; // service_order_no
    
    // Busca rota e classifica
    const routeInfo = findRouteForOrder(orderId, activeRoutes);
    const classification = getLtpClassification(row);

    // Adiciona dados
    rows.push([...row, routeInfo.name, routeInfo.status, classification]);
    rowClassifications.push(classification);
    rowRouteStatuses.push(routeInfo.status);
  });

  // 3. Cria a Worksheet usando xlsx-js-style
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const range = XLSX.utils.decode_range(ws['!ref']);

  // 4. Aplica estilos em cada célula
  for (let r = range.s.r; r <= range.e.r; r++) {
    const classification = r === 0 ? null : rowClassifications[r - 1];
    const routeStatus = r === 0 ? null : rowRouteStatuses[r - 1];

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) continue;

      // Estilo padrão para células de dados
      ws[cellRef].s = {
        font: { name: 'Segoe UI', size: 10 },
        alignment: { vertical: 'center', horizontal: 'left' },
        border: {
          top: { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } },
        },
      };

      // Formatar valores como texto para evitar problemas com SO Numbers longos
      if (typeof ws[cellRef].v === 'string') {
        ws[cellRef].t = 's';
      }

      if (r === 0) {
        // Estilo do Cabeçalho
        ws[cellRef].s.font = { name: 'Segoe UI', size: 11, bold: true, color: { rgb: 'FFFFFF' } };
        ws[cellRef].s.fill = { fgColor: { rgb: '1E293B' } }; // Slate 800
        ws[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
      } else {
        // Estilo da Linha de Dados
        
        // Cores de fundo baseadas em Classificação
        if (classification === 'EX LTP') {
          ws[cellRef].s.fill = { fgColor: { rgb: 'FFEDD5' } }; // Laranja Claro
        } else if (classification === 'LTP') {
          ws[cellRef].s.fill = { fgColor: { rgb: 'FEF9C3' } }; // Amarelo Claro
        }

        // Coluna Rota Ativa (terceira de trás para frente)
        if (c === range.e.c - 2) {
          const routeVal = ws[cellRef].v;
          if (routeVal === 'Sem Rota') {
            ws[cellRef].s.font.color = { rgb: '94A3B8' }; // Cinza se sem rota
          } else {
            ws[cellRef].s.font.bold = true;
          }
        }

        // Coluna Status da Rota (segunda de trás para frente)
        if (c === range.e.c - 1) {
          ws[cellRef].s.font.bold = true;
          ws[cellRef].s.alignment.horizontal = 'center';
          if (routeStatus === 'Concluída') {
            ws[cellRef].s.fill = { fgColor: { rgb: 'DCFCE7' } }; // Verde Claro
            ws[cellRef].s.font.color = { rgb: '15803D' };
          } else if (routeStatus === 'Pendente') {
            ws[cellRef].s.fill = { fgColor: { rgb: 'FEE2E2' } }; // Vermelho Claro
            ws[cellRef].s.font.color = { rgb: 'B91C1C' };
          } else if (routeStatus === 'A Fazer') {
            ws[cellRef].s.fill = { fgColor: { rgb: 'DBEAFE' } }; // Azul Claro
            ws[cellRef].s.font.color = { rgb: '1D4ED8' };
          } else {
            ws[cellRef].s.fill = { fgColor: { rgb: 'F1F5F9' } }; // Slate Claro
            ws[cellRef].s.font.color = { rgb: '475569' };
          }
        }

        // Coluna Classificação LTP (última coluna)
        if (c === range.e.c) {
          ws[cellRef].s.font.bold = true;
          ws[cellRef].s.alignment.horizontal = 'center';
          if (classification === 'EX LTP') {
            ws[cellRef].s.font.color = { rgb: 'C2410C' };
          } else if (classification === 'LTP') {
            ws[cellRef].s.font.color = { rgb: 'A16207' };
          } else {
            ws[cellRef].s.font.color = { rgb: '64748B' };
          }
        }
      }
    }
  }

  // 5. Ajustar a largura das colunas de forma inteligente
  const colWidths = newHeaders.map((header, colIdx) => {
    let maxLen = header.length;
    for (let r = 1; r < rows.length; r++) {
      const cellVal = rows[r][colIdx];
      if (cellVal) {
        maxLen = Math.max(maxLen, String(cellVal).length);
      }
    }
    return { wch: maxLen + 3 };
  });
  ws['!cols'] = colWidths;

  // 6. Gera o Workbook e faz o download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
  const formattedFileName = `relatorio_completo_${tableName || 'nuvem'}.xlsx`;
  saveAs(blob, formattedFileName);
};
