import { NextResponse } from "next/server";
import { getSprintReportData } from "@/lib/reports/data";
import { renderReport, type ReportType } from "@/lib/reports/pdf";

const TYPES: ReportType[] = ["initial", "weekly", "final"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sprintId: string; type: string }> },
) {
  const { sprintId, type } = await params;
  if (!TYPES.includes(type as ReportType)) {
    return new NextResponse("Tipo de reporte invalido", { status: 400 });
  }

  const data = await getSprintReportData(sprintId);
  if (!data) {
    return new NextResponse("Sprint no encontrado", { status: 404 });
  }

  const buffer = await renderReport(type as ReportType, data);
  const filename = `${type}-${data.sprint.name.replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
