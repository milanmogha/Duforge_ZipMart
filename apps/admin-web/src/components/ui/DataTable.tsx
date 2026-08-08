import React from "react";

interface DataTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  columns: string[];
  children: React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  children,
  className = "",
  ...rest
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <table
        className={`w-full min-w-max text-left text-sm ${className}`}
        {...rest}
      >
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
};

export default DataTable;
