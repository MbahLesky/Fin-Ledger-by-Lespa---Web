import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { auditRepository } from "@/db/repositories/audit-repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { csvExportService } from "@/services/csv-export-service";
import { formatShortDate } from "@/utils/date-utils";
import type { ExportRecord } from "@/types";

export function ExportPage() {
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

  async function refreshExportHistory() {
    setExportHistory(await auditRepository.listExports());
  }

  useEffect(() => {
    void refreshExportHistory();
  }, []);

  async function handleExport() {
    try {
      await csvExportService.exportTransactions();
      await refreshExportHistory();
      toast.success("CSV export downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to export data.");
    }
  }

  return (
    <PageShell
      title="Export data"
      description="Generate a spreadsheet-friendly CSV backup from your shared Supabase transactions."
      action={
        <Button onClick={() => void handleExport()}>
          <Download className="size-4" />
          Export CSV
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>CSV export</CardTitle>
          <CardDescription>
            The exported column order is date, type, amount, category, account, note.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Exports read active Supabase transactions, download through the browser, and store only export history locally on this device.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent exports</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {(exportHistory ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
              No exports yet. Generate your first CSV backup when you are ready.
            </div>
          ) : (
            exportHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.recordCount} records • {formatShortDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
