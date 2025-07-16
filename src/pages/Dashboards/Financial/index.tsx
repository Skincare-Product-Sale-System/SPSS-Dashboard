import React, { useEffect, useState } from 'react';
import BreadCrumb from 'Common/BreadCrumb';
import FinancialSummary from './FinancialSummary';
import ProductProfitAnalysis from './ProductProfitAnalysis';
import MonthlyReportChart from './MonthlyReportChart';
import OrderStatusDistribution from './OrderStatusDistribution';
import DateRangePicker from './DateRangePicker';
import { getApiUrl } from 'config/api';
import axios from 'axios';

interface FinancialData {
  financialSummary: {
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
    startDate: string;
    endDate: string;
  };
  topProfitableProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    procurementCost: number;
    profit: number;
    profitMargin: number;
  }>;
  monthlyReports: Array<{
    year: number;
    month: number;
    grossRevenue: number;
    discountAmount: number;
    revenue: number;
    procurementCost: number;
    profit: number;
    profitMargin: number;
    orderCount: number;
  }>;
  orderStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
}

const Financial = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    endDate: new Date()
  });

  const fetchFinancialData = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      setError(null);

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Get auth token from localStorage
      const authUser = localStorage.getItem("authUser");
      const token = authUser ? JSON.parse(authUser).accessToken : null;

      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Set authorization header
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('🔍 [Financial] Making API request...');
      console.log('📡 URL:', `${getApiUrl(`/financial-dashboard/all-financial-data?startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}`)}`);
      console.log('🔑 Token:', token.substring(0, 20) + '...');

      const response = await axios.get(
        `${getApiUrl(`/financial-dashboard/all-financial-data?startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}`)}`,
        config
      );

      console.log('📊 [Financial] API Response:', response);
      console.log('📋 [Financial] Response data:', response.data);

      // Check if response has data property
      if (response.data && response.data.success) {
        console.log('✅ [Financial] Setting financial data:', response.data.data);
        setFinancialData(response.data.data);
      } else if (response.data && response.data.data) {
        // If no success property but has data, assume it's successful
        console.log('✅ [Financial] Setting financial data (no success property):', response.data.data);
        setFinancialData(response.data.data);
      } else if (response.data) {
        // If response.data exists but no data property, use the whole response
        console.log('✅ [Financial] Setting financial data (using whole response):', response.data);
        setFinancialData(response.data);
      } else {
        throw new Error('Invalid response format from API');
      }

    } catch (err: any) {
      console.error('❌ [Financial] Error fetching financial data:', err);
      console.error('❌ [Financial] Error response:', err.response);
      console.error('❌ [Financial] Error message:', err.message);

      if (err.response?.status === 403) {
        setError('Access forbidden. Please check your permissions or login again.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An error occurred while fetching data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData(dateRange.startDate, dateRange.endDate);
  }, [dateRange]);

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    if (startDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }
    setDateRange({ startDate, endDate });
  };

  if (loading) {
    return (
      <div className="page-content">
        <BreadCrumb title="Kinh Tế" pageTitle="Dashboards" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <BreadCrumb title="Kinh Tế" pageTitle="Dashboards" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">Error</div>
            <div className="text-gray-600">{error}</div>
            <button
              onClick={() => fetchFinancialData(dateRange.startDate, dateRange.endDate)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <BreadCrumb title="Kinh Tế" pageTitle="Dashboards" />

        {/* Date Range Picker */}
        <div className="mb-6">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {/* Financial Summary Cards */}
        {financialData && (
          <FinancialSummary data={financialData.financialSummary} />
        )}

        {/* Charts and Analysis */}
        <div className="grid grid-cols-12 gap-x-5 mt-5">
          {/* Monthly Report Chart */}
          <div className="col-span-12 lg:col-span-8">
            {financialData && (
              <MonthlyReportChart data={financialData.monthlyReports} />
            )}
          </div>

          {/* Order Status Distribution */}
          <div className="col-span-12 lg:col-span-4">
            {financialData && (
              <OrderStatusDistribution data={financialData.orderStatusDistribution} />
            )}
          </div>
        </div>

        {/* Product Profit Analysis */}
        <div className="grid grid-cols-12 gap-x-5 mt-5">
          <div className="col-span-12">
            {financialData && (
              <ProductProfitAnalysis
                data={financialData.topProfitableProducts}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Financial; 