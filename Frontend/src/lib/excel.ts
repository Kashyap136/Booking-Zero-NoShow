import ExcelJS from "exceljs";

export interface AttendanceRow {
  staffName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
}

export interface SheetColumn {
  header: string;
  key: string;
  width?: number;
}

function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportRowsToExcel(
  columns: SheetColumn[],
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1",
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 16,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  headerRow.alignment = { horizontal: "center" };

  rows.forEach((r) => {
    const row: Record<string, string> = {};
    for (const col of columns) {
      const v = r[col.key];
      row[col.key] = v === null || v === undefined || v === "" ? "-" : String(v);
    }
    sheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, filename);
}

export async function exportAttendanceToExcel(
  rows: AttendanceRow[],
  month: string,
): Promise<void> {
  await exportRowsToExcel(
    [
      { header: "Staff Name", key: "staffName", width: 24 },
      { header: "Date", key: "date", width: 14 },
      { header: "Clock In", key: "clockIn", width: 12 },
      { header: "Clock Out", key: "clockOut", width: 12 },
      { header: "Status", key: "status", width: 12 },
    ],
    rows.map((r) => ({
      staffName: r.staffName,
      date: r.date,
      clockIn: r.clockIn || "-",
      clockOut: r.clockOut || "-",
      status: r.status,
    })),
    `attendance-${month}.xlsx`,
    "Attendance",
  );
}