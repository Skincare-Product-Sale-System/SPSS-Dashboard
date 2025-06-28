import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface OrderStatusData {
  status: string;
  count: number;
}

interface OrderStatusDistributionProps {
  data: OrderStatusData[];
}

const OrderStatusDistribution: React.FC<OrderStatusDistributionProps> = ({ data }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const statusLabels: { [key: string]: string } = {
    'Awaiting Payment': 'Chờ TT',
    'Processing': 'Đang Xử Lý',
    'Delivered': 'Đã Giao',
    'Cancelled': 'Đã Hủy',
    'Shipped': 'Đã Gửi',
    'Returned': 'Đã Trả'
  };

  const chartData = data.map(item => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
    originalStatus: item.status
  }));

  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const label = `${chartData[index].name} ${(percent * 100).toFixed(0)}%`;
    return (
      <text
        x={x}
        y={y}
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={500}
      >
        {label}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalOrders) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Số lượng: {data.value} đơn hàng
          </p>
          <p className="text-sm text-gray-600">
            Tỷ lệ: {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Phân Bố Trạng Thái Đơn Hàng</h3>
        <p className="text-sm text-gray-600">Tổng cộng: {totalOrders} đơn hàng</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Summary */}
      <div className="mt-6 space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{item.value}</div>
              <div className="text-xs text-gray-500">
                {((item.value / totalOrders) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusDistribution; 