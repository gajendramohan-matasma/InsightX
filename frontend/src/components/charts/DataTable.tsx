"use client";

import { Table, type Column } from "@/components/ui/Table";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils/formatters";

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: { key: string; header: string; format?: string; align?: string }[];
  title: string;
  className?: string;
}

export function DataTable({ data, columns, title, className }: DataTableProps) {
  const mappedColumns: Column<Record<string, unknown>>[] = columns.map((col) => ({
    key: col.key,
    header: col.header,
    sortable: true,
    align: (col.align as "left" | "center" | "right") ?? "left",
    render: (value: unknown) => {
      if (value == null) return "\u2014";

      switch (col.format) {
        case "currency":
          return formatCurrency(Number(value));
        case "percentage":
          return formatPercentage(Number(value));
        case "date":
          return formatDate(String(value));
        case "number":
          return Number(value).toLocaleString();
        default:
          return String(value);
      }
    },
  }));

  return (
    <div className={className}>
      {title && (
        <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      )}
      <Table data={data} columns={mappedColumns} />
    </div>
  );
}
