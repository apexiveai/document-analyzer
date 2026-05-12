"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Users, Activity, Brain, ShieldCheck } from "lucide-react";

interface UsageData {
  email: string;
  total_tokens: number;
}

interface AdminUsageChartProps {
  data: UsageData[];
}

const COLORS = ["#6366F1", "#8B5CF6", "#06B6D4", "#0EA5E9", "#14B8A6"];

const trendData = [
  { day: "Mon", tokens: 1200 },
  { day: "Tue", tokens: 2400 },
  { day: "Wed", tokens: 1800 },
  { day: "Thu", tokens: 4200 },
  { day: "Fri", tokens: 3000 },
  { day: "Sat", tokens: 5200 },
  { day: "Sun", tokens: 4100 },
];

export default function UsageAnalytics({ data }: AdminUsageChartProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.total_tokens - a.total_tokens);
  }, [data]);

  const chartHeight = Math.max(sortedData.length * 55, 320);

  const topUser = sortedData[0];

  // Empty State
  if (!sortedData.length) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center">
        <div className="mb-5 rounded-full bg-slate-100 p-6">
          <Activity className="h-10 w-10 text-slate-400" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800">No Usage Data</h2>

        <p className="mt-2 text-sm text-slate-500">
          No token activity available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-indigo-600 via-violet-600 to-cyan-500 p-8 text-white shadow-[0_10px_50px_rgba(0,0,0,0.15)]">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-xl">
              <Brain className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AI Usage Intelligence
              </h1>

              <p className="mt-1 text-sm text-indigo-100">
                Real-time system analytics and token insights
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-widest text-indigo-100">
                Most Active User
              </p>

              <p className="mt-2 text-lg font-semibold">{topUser?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Active Users"
          value={sortedData.length}
          icon={<Users className="h-5 w-5" />}
          color="from-cyan-500 to-sky-500"
        />

        <StatCard
          title="Peak User Tokens"
          value={new Intl.NumberFormat().format(topUser?.total_tokens ?? 0)}
          icon={<Brain className="h-5 w-5" />}
          color="from-rose-500 to-pink-500"
        />

        <StatCard
          title="AI Health"
          value="98%"
          icon={<ShieldCheck className="h-5 w-5" />}
          color="from-emerald-500 to-green-500"
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* BAR CHART */}
        <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              User Token Usage
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              User ranking based on AI token consumption
            </p>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2">
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedData}
                  layout="vertical"
                  barCategoryGap={18}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={false}
                    stroke="#E2E8F0"
                  />

                  <XAxis type="number" axisLine={false} tickLine={false} />

                  <YAxis
                    dataKey="email"
                    type="category"
                    width={180}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: string) =>
                      value.length > 22 ? value.slice(0, 22) + "..." : value
                    }
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(99,102,241,0.08)",
                    }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#fff",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [
                      new Intl.NumberFormat().format(Number(value ?? 0)),
                      "Tokens",
                    ]}
                  />

                  <Bar
                    dataKey="total_tokens"
                    radius={[0, 10, 10, 0]}
                    barSize={28}
                  >
                    {sortedData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TOP USERS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Top Users</h2>

            <p className="mt-1 text-sm text-slate-500">Highest AI consumers</p>
          </div>

          <div className="space-y-4">
            {sortedData.slice(0, 5).map((user, index) => (
              <div
                key={user.email}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    #{index + 1}
                  </div>

                  <div>
                    <p className="max-w-[150px] truncate text-sm font-semibold text-slate-800">
                      {user.email}
                    </p>

                    <p className="text-xs text-slate-500">Active User</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {new Intl.NumberFormat().format(user.total_tokens)}
                  </p>

                  <p className="text-xs text-slate-400">tokens</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TREND CHART */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Weekly Usage Trend
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            AI token activity during the last 7 days
          </p>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />

                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />

              <XAxis dataKey="day" axisLine={false} tickLine={false} />

              <YAxis axisLine={false} tickLine={false} />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="tokens"
                stroke="#6366F1"
                strokeWidth={3}
                fill="url(#usageGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* KPI CARD */
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      <div
        className={`absolute right-0 top-0 h-24 w-24 rounded-full bg-linear-to-br ${color} opacity-10 blur-2xl`}
      />

      <div className="relative">
        <div
          className={`inline-flex rounded-2xl bg-linear-to-br ${color} p-3 text-white shadow-lg`}
        >
          {icon}
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}
