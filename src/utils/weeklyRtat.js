// RTAT real (turnaround) das OS CONCLUÍDAS na semana corrente, por categoria.
//
// RTAT aqui = tempo de reparo = data de conclusão (col 27) − data de abertura
// (col 16), em dias. Diferente do "RTAT VD/DA" instantâneo (que é média do aging
// da coluna 15 do backlog em aberto).
//
// - Concluída: status ST035 (col 11) — mesmo critério dos filtros de reparo completo.
// - Nesta semana: data de conclusão (col 27) dentro da semana corrente (seg→dom).
// - Categoria DA/DTV: reusa filters.all_lp_DA / filters.all_lp_DTV (LP + IH +
//   códigos de produto), pros números baterem com o resto do dashboard.
//
// IMPORTANTE: opera sobre `combinedData` (as mesmas linhas que os filtros do
// HomePage), então os índices de coluna (11/16/27/34/37/58) são os já validados lá.
import filters from "./filters";

// Parser robusto das colunas de data (serial Excel | ISO | DD/MM/AAAA), alinhado
// ao parseDateString de filters.js.
function parseCell(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === "00/00/0000" || s === "null" || s === "undefined") return null;

  const num = Number(s);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + num * 86400000);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const p = s.split("/");
  if (p.length === 3) {
    const day = parseInt(p[0], 10);
    const month = parseInt(p[1], 10) - 1;
    let year = parseInt(p[2], 10);
    if (year < 100) year += 2000;
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  return null;
}

// Início da semana corrente (segunda-feira 00:00 local).
function weekStart(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // seg=0 ... dom=6
  d.setDate(d.getDate() - dow);
  return d;
}

export function computeWeeklyRtat(combinedData) {
  const rows = Array.isArray(combinedData) ? combinedData.slice(1) : [];
  const start = weekStart();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const acc = { da: { sum: 0, n: 0 }, dtv: { sum: 0, n: 0 } };

  for (const row of rows) {
    if (!row) continue;
    if (row[11] !== "ST035") continue; // só concluídas

    const done = parseCell(row[27]); // data de conclusão
    if (!done || done < start || done >= end) continue; // concluída nesta semana

    const open = parseCell(row[16]); // data de abertura
    if (!open) continue;

    const days = (done.getTime() - open.getTime()) / 86400000;
    if (days < 0) continue; // datas inconsistentes

    if (filters.all_lp_DA(row)) {
      acc.da.sum += days;
      acc.da.n += 1;
    } else if (filters.all_lp_DTV(row)) {
      acc.dtv.sum += days;
      acc.dtv.n += 1;
    }
  }

  return {
    weekStart: start,
    da: { avg: acc.da.n ? acc.da.sum / acc.da.n : null, count: acc.da.n },
    dtv: { avg: acc.dtv.n ? acc.dtv.sum / acc.dtv.n : null, count: acc.dtv.n },
  };
}
