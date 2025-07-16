import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Archive } from 'lucide-react';

interface FinancialSummaryProps {
  data: {
    grossRevenue: number;
    discountAmount: number;
    totalRevenue: number;
    totalProcurementCost: number;
    inventoryProcurementCost: number;
    totalProfit: number;
    profitMargin: number;
    completedOrderCount: number;
    pendingOrderCount: number;
    profitMarginPercent: number;
    procurementCostPercent: number;
    inventoryCostPercent: number;
    completedOrderRate: number;
    pendingOrderRate: number;
    discountRate: number;
  };
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Helper function to determine trend direction
  const getTrendDirection = (value: number) => {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'neutral';
  };

  // Helper function to format trend value with sign
  const formatTrendValue = (value: number) => {
    if (value > 0) return `+${formatPercentage(value)}`;
    return formatPercentage(value);
  };

  const summaryCards = [
    {
      title: 'Tổng Doanh Thu',
      value: formatCurrency(data.totalRevenue),
      icon: <DollarSign className="h-6 w-6 text-green-600" />,
      iconBg: 'bg-green-100',
      textColor: 'text-green-600',
      trend: getTrendDirection(data.profitMarginPercent),
      trendValue: formatTrendValue(data.profitMarginPercent),
      description: 'So với kỳ trước'
    },
    {
      title: 'Lợi Nhuận',
      value: formatCurrency(data.totalProfit),
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-600',
      trend: getTrendDirection(data.profitMarginPercent),
      trendValue: formatPercentage(data.profitMargin),
      description: 'Tỷ lệ lợi nhuận'
    },
    {
      title: 'Chi Phí Mua Hàng',
      value: formatCurrency(data.totalProcurementCost),
      icon: <Package className="h-6 w-6 text-orange-600" />,
      iconBg: 'bg-orange-100',
      textColor: 'text-orange-600',
      trend: getTrendDirection(data.procurementCostPercent),
      trendValue: formatTrendValue(data.procurementCostPercent),
      description: 'So với kỳ trước'
    },
    {
      title: 'Chi Phí Tồn Kho',
      value: formatCurrency(data.inventoryProcurementCost),
      icon: <Archive className="h-6 w-6 text-indigo-600" />,
      iconBg: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      trend: getTrendDirection(data.inventoryCostPercent),
      trendValue: formatTrendValue(data.inventoryCostPercent),
      description: 'So với kỳ trước'
    },
    {
      title: 'Đơn Hàng Hoàn Thành',
      value: data.completedOrderCount.toString(),
      icon: <ShoppingCart className="h-6 w-6 text-purple-600" />,
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-600',
      trend: getTrendDirection(data.completedOrderRate),
      trendValue: formatTrendValue(data.completedOrderRate),
      description: 'So với kỳ trước'
    },
    {
      title: 'Đơn Hàng Chờ Xử Lý',
      value: data.pendingOrderCount.toString(),
      icon: <Users className="h-6 w-6 text-yellow-600" />,
      iconBg: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      trend: getTrendDirection(data.pendingOrderRate),
      trendValue: formatTrendValue(data.pendingOrderRate),
      description: 'So với kỳ trước'
    },
    {
      title: 'Giảm Giá',
      value: formatCurrency(data.discountAmount),
      icon: <TrendingDown className="h-6 w-6 text-red-600" />,
      iconBg: 'bg-red-100',
      textColor: 'text-red-600',
      trend: getTrendDirection(data.discountRate),
      trendValue: formatTrendValue(data.discountRate),
      description: 'So với kỳ trước'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-5">
      {summaryCards.map((card, index) => (
        <div
          key={index}
          className={
            `bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full transition-shadow duration-300 hover:shadow-md`
          }
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${card.iconBg} flex items-center justify-center`}>
              {card.icon}
            </div>
            <div className={`text-sm font-medium ${card.textColor} flex items-center`}>
              {card.trend === 'up' && <TrendingUp className="h-4 w-4 inline mr-1" />}
              {card.trend === 'down' && <TrendingDown className="h-4 w-4 inline mr-1" />}
              {card.trendValue}
            </div>
          </div>
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
          <p className="text-xs text-gray-500">{card.description}</p>
        </div>
      ))}
    </div>
  );
};

export default FinancialSummary; 