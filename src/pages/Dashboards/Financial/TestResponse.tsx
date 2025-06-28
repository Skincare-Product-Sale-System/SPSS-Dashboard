import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from 'config/api';

const TestResponse = () => {
  const [result, setResult] = useState<any>(null);

  const testAPI = async () => {
    try {
      const authUser = localStorage.getItem("authUser");
      const token = authUser ? JSON.parse(authUser).accessToken : null;
      
      if (!token) {
        alert('No token found');
        return;
      }

      const response = await axios.get(
        `${getApiUrl('/financial-dashboard/all-financial-data?startDate=2024-12-31T17%3A00%3A00.000Z&endDate=2025-06-28T03%3A40%3A42.894Z')}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Raw response:', response);
      console.log('Response.data:', response.data);
      
      setResult({
        status: response.status,
        data: response.data,
        hasSuccess: 'success' in response.data,
        hasData: 'data' in response.data,
        successValue: response.data.success,
        dataType: typeof response.data.data
      });

    } catch (error: any) {
      console.error('Error:', error);
      setResult({
        error: error.message,
        response: error.response?.data
      });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test API Response</h1>
      
      <button 
        onClick={testAPI}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Test API
      </button>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestResponse; 