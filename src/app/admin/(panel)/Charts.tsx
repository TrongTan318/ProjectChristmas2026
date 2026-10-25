'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/admin/ui';

type Point = { label: string; value: number };

function Empty() {
  return <p className="flex h-56 items-center justify-center text-sm text-zinc-500">Chưa có dữ liệu.</p>;
}

export function BarChartCard({ title, data }: { title: string; data: Point[] }) {
  return (
    <Card title={title}>
      {data.every((d) => d.value === 0) ? (
        <Empty />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Phiếu']} />
              <Bar dataKey="value" fill="#6d1a2b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function LineChartCard({ title, data }: { title: string; data: Point[] }) {
  return (
    <Card title={title}>
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Phiếu']} />
              <Line type="monotone" dataKey="value" stroke="#b38f23" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
