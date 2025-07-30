import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Archive, User, Truck, ShoppingBag } from 'lucide-react';

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
    totalUsers: number;
    totalOrders: number;
    totalDeliveredOrders: number;
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

  // Top row cards - user and order metrics
  const userOrderCards = [
    {
      title: 'Tổng Người Dùng',
      value: data.totalUsers.toString(),
      icon: <User className="h-6 w-6 text-blue-600" />,
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-600',
      trend: 'neutral',
      trendValue: '',
      description: 'Tổng số người dùng'
    },
    {
      title: 'Tổng Đơn Hàng',
      value: data.totalOrders.toString(),
      icon: <ShoppingBag className="h-6 w-6 text-purple-600" />,
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-600',
      trend: 'neutral',
      trendValue: '',
      description: 'Tổng số đơn hàng'
    },
    {
      title: 'Đơn Hàng Đã Giao',
      value: data.totalDeliveredOrders.toString(),
      icon: <Truck className="h-6 w-6 text-green-600" />,
      iconBg: 'bg-green-100',
      textColor: 'text-green-600',
      trend: 'neutral',
      trendValue: '',
      description: 'Tổng số đơn hàng đã giao'
    }
  ];

  // First row cards - financial metrics
  const financialCards = [
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

  // Second row cards - operational metrics
  const operationalCards = [
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
    }
  ];

  // Card component to avoid repetition
  const Card = ({ card }: { card: any }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full transition-shadow duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
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
        <p className="text-xl md:text-2xl font-bold text-gray-900 break-words" title={card.value}>
          {card.value}
        </p>
      </div>
      <p className="text-xs text-gray-500">{card.description}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Top row - User and Order metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {userOrderCards.map((card, index) => (
          <Card key={`user-order-${index}`} card={card} />
        ))}
      </div>

      {/* First row - Financial metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {financialCards.map((card, index) => (
          <Card key={`financial-${index}`} card={card} />
        ))}
      </div>

      {/* Second row - Operational metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {operationalCards.map((card, index) => (
          <Card key={`operational-${index}`} card={card} />
        ))}
      </div>
    </div>
  );
};

export default FinancialSummary; 