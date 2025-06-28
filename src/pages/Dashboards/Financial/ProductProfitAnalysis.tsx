import React from 'react';
import { TrendingUp, TrendingDown, Package, DollarSign, BarChart3 } from 'lucide-react';

interface ProductProfitData {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  procurementCost: number;
  profit: number;
  profitMargin: number;
}

interface ProductProfitAnalysisProps {
  data: ProductProfitData[];
  startDate: Date;
  endDate: Date;
}

const ProductProfitAnalysis: React.FC<ProductProfitAnalysisProps> = ({ data }) => {
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

  const totalRevenue = data.reduce((sum, product) => sum + product.revenue, 0);
  const totalProfit = data.reduce((sum, product) => sum + product.profit, 0);
  const totalCost = data.reduce((sum, product) => sum + product.procurementCost, 0);
  const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Phân Tích Lợi Nhuận Sản Phẩm</h3>
          <p className="text-sm text-gray-600">Top sản phẩm có lợi nhuận cao nhất</p>
        </div>
        {/* Có thể thêm nút làm mới nếu muốn */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Tổng Doanh Thu</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Tổng Lợi Nhuận</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalProfit)}</p>
        </div>
        
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Tổng Chi Phí</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Tỷ Lệ Lợi Nhuận TB</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatPercentage(averageProfitMargin)}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Lượng Bán</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh Thu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chi Phí</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lợi Nhuận</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ Lệ Lợi Nhuận</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data && data.length > 0 ? (
              data.map((product) => (
                <tr key={product.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                        <Package className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                        <div className="text-sm text-gray-500">ID: {product.productId.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.quantitySold}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(product.revenue)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(product.procurementCost)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(product.profit)}</div>
                    <div className="text-xs text-gray-500">
                      {product.profit > 0 ? (
                        <span className="text-green-600 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{formatPercentage(product.profitMargin)}
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {formatPercentage(product.profitMargin)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(product.profitMargin, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{formatPercentage(product.profitMargin)}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Không có dữ liệu sản phẩm trong khoảng thời gian này</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductProfitAnalysis; 