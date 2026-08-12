// Serviço de acesso ao relatório de indicadores no Supabase.
// Porta de smartos/src/services/supabase/indicatorReportService.ts (TS -> JS).
import { supabase } from "../lib/supabaseClient";

function mapFromDb(row) {
  return {
    id: row.id,
    fileName: row.file_name,
    partnerName: row.partner_name,
    location: row.location,
    metrics: row.metrics || [],
    uploadedAt: new Date(row.uploaded_at),
  };
}

const indicatorReportService = {
  async getLatest() {
    const { data, error } = await supabase
      .from("indicator_reports")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapFromDb(data);
  },

  // Substitui qualquer relatório anterior pelo recém-processado — só o mais
  // recente é usado para montar os gráficos.
  async replace({ fileName, partnerName, location, metrics }) {
    const { error: deleteError } = await supabase.from("indicator_reports").delete().not("id", "is", null);
    if (deleteError) throw deleteError;

    const { data: newRow, error } = await supabase
      .from("indicator_reports")
      .insert({
        file_name: fileName,
        partner_name: partnerName,
        location,
        metrics,
      })
      .select()
      .single();

    if (error) throw error;
    return mapFromDb(newRow);
  },

  async getTrackedMetrics() {
    const { data, error } = await supabase
      .from("indicator_tracked_metrics")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      metricKey: row.metric_key,
      metricName: row.metric_name,
      metricSection: row.metric_section,
    }));
  },

  async setTrackedMetrics(metrics) {
    const { error: deleteError } = await supabase.from("indicator_tracked_metrics").delete().not("id", "is", null);
    if (deleteError) throw deleteError;

    if (!metrics || metrics.length === 0) return;

    const { error } = await supabase
      .from("indicator_tracked_metrics")
      .insert(metrics.map((m) => ({ metric_key: m.key, metric_name: m.name, metric_section: m.section })));
    if (error) throw error;
  },
};

export default indicatorReportService;
