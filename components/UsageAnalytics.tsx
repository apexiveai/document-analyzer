"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface UsageData {
  email: string
  total_tokens: number
}

interface AdminUsageChartProps {
  data: UsageData[]
}

export default function UsageAnalytics({ data }: AdminUsageChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sort data by tokens descending for better visualization
  const sortedData = [...data].sort((a, b) => b.total_tokens - a.total_tokens)

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] bg-white rounded-2xl shadow-sm border border-indigo-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center w-full h-full">
          <div className="h-4 w-48 bg-gray-200 rounded mb-6 self-start"></div>
          <div className="flex-1 w-full bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px] sm:h-[500px] bg-white rounded-2xl shadow-sm border border-indigo-50 p-4 sm:p-6 overflow-hidden">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">AI Token Usage per User</h3>
        <p className="text-sm text-gray-500">Visualization of resource consumption across accounts</p>
      </div>
      
      <div className="w-full h-[320px] sm:h-[380px] relative">
        <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 40,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <YAxis 
              dataKey="email" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#374151', fontSize: 10 }}
              width={100}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: any) => [new Intl.NumberFormat().format(value), 'Tokens']}
            />
            <Bar 
              dataKey="total_tokens" 
              radius={[0, 6, 6, 0]} 
              barSize={20}
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index % 2 === 0 ? '#4f46e5' : '#06b6d4'} // Indigo to Cyan alternating
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
