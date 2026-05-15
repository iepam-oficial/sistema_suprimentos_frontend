export interface ExportToCSVOptions {
  head: string[];
  body: (string | number)[][];
  fileName?: string;
}

function escapeCell(value: string | number): string {
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV({ head, body, fileName = 'relatorio.csv' }: ExportToCSVOptions) {
  const lines = [
    head.map(escapeCell).join(','),
    ...body.map((row) => row.map(escapeCell).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
