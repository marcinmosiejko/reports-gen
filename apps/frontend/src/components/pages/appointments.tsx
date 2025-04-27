import PageWrap from "../page-wrap";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getPaginationRowModel,
} from "@tanstack/react-table";
import type { AppointmentApi } from "common";
import { PageTitle } from "../page-title";
import { useState } from "react";
import { TablePagination } from "../table-pagination";
import { SERVER_HOST } from "@/constants";

const isDev = import.meta.env.MODE === "development";
const dateFormatOptions: Intl.DateTimeFormatOptions = {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};
const formatDate = (date: string) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString("en-US", dateFormatOptions);
};

const columns: ColumnDef<AppointmentApi>[] = [
  {
    header: "Patient",
    accessorFn: (row) => row.patient.name,
  },
  {
    header: "Voicebot",
    accessorFn: (row) => row.voicebot.name,
  },
  {
    header: "Clinic",
    accessorFn: (row) => row.clinic.name,
  },
  {
    header: "Doctor",
    accessorFn: (row) => row.visit.doctor,
  },
  {
    header: "Reason",
    accessorFn: (row) => row.visit.reason,
  },
  {
    header: "Start Time",
    accessorFn: (row) => row.visit.startDate,
    cell: (info) => formatDate(info.getValue() as string),
  },
  {
    header: "End Time",
    accessorFn: (row) => row.visit.endDate,
    cell: (info) => formatDate(info.getValue() as string),
  },
  {
    header: "Scheduled At",
    accessorFn: (row) => row.createdAt,
    cell: (info) => formatDate(info.getValue() as string),
  },
];

const PAGE_SIZE = 20;

const FetchAppointments = () => {
  const { isLoading, error, data } = useQuery<AppointmentApi[]>({
    queryKey: ["appointments"],
    queryFn: () =>
      fetch(`${SERVER_HOST}/appointments`).then((res) => res.json()),
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: false,
    pageCount: data ? Math.ceil(data.length / PAGE_SIZE) : -1,
    state: { pagination },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading)
    return (
      <div className="text-muted-foreground py-8 text-center">Loading...</div>
    );
  if (error) {
    if (isDev) {
      console.error("Error fetching appointments:", error);
    }
    return (
      <div className="text-destructive py-8 text-center">
        Error fetching appointments
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <TablePagination
        page={table.getState().pagination.pageIndex + 1}
        pageCount={table.getPageCount()}
        canPrevious={table.getCanPreviousPage()}
        canNext={table.getCanNextPage()}
        onPrevious={table.previousPage}
        onNext={table.nextPage}
      />
      <table className="w-full">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left text-sm font-medium text-gray-500"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="bg-white">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="border-border border-b px-4 py-2 text-sm"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Appointments = () => {
  return (
    <PageWrap>
      <PageTitle>Appointments</PageTitle>
      <FetchAppointments />
    </PageWrap>
  );
};

export default Appointments;
