import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { maintenanceRecords } from "../data/maintenanceRecords";

export default function MaintenanceBarChart() {
  const data = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const counts = months.map((m) => ({
      month: m,
      completed: 0,
      pending: 0,
    }));

    maintenanceRecords.forEach((r) => {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth();
      const s = (r.status || "").toLowerCase();
      if (s === "completed") counts[m].completed += 1;
      else if (s === "pending") counts[m].pending += 1;
    });

    return counts;
  }, []);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
          <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
