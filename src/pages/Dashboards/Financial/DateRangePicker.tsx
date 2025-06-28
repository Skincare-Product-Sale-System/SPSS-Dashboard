import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleApply = () => {
    if (tempStartDate > tempEndDate) {
      alert('Ngày bắt đầu không thể sau ngày kết thúc');
      return;
    }
    onDateRangeChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  const presetRanges = [
    {
      label: 'Hôm nay',
      getDates: () => {
        const today = new Date();
        return { start: today, end: today };
      }
    },
    {
      label: 'Tuần này',
      getDates: () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return { start: startOfWeek, end: now };
      }
    },
    {
      label: 'Tháng này',
      getDates: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: now };
      }
    },
    {
      label: 'Năm nay',
      getDates: () => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: now };
      }
    },
    {
      label: '30 ngày qua',
      getDates: () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return { start: thirtyDaysAgo, end: now };
      }
    },
    {
      label: '90 ngày qua',
      getDates: () => {
        const now = new Date();
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return { start: ninetyDaysAgo, end: now };
      }
    }
  ];

  const handlePresetClick = (preset: any) => {
    const { start, end } = preset.getDates();
    setTempStartDate(start);
    setTempEndDate(end);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Khoảng thời gian:</span>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="text-sm">
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Khoảng thời gian nhanh</h3>
              <div className="grid grid-cols-2 gap-2">
                {presetRanges.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(preset)}
                    className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={tempStartDate.toISOString().split('T')[0]}
                  onChange={(e) => setTempStartDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={tempEndDate.toISOString().split('T')[0]}
                  onChange={(e) => setTempEndDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker; 