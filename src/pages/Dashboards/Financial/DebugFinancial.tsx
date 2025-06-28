import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from 'config/api';

const DebugFinancial = () => {
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token
        const authUser = localStorage.getItem("authUser");
        const token = authUser ? JSON.parse(authUser).accessToken : null;
        
        console.log("🔍 [Debug] Token:", token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        
        if (!token) {
          throw new Error('No token found');
        }
        
        // Test API call
        const response = await axios.get(
          `${getApiUrl('/financial-dashboard/all-financial-data?startDate=2024-12-31T17%3A00%3A00.000Z&endDate=2025-06-28T03%3A40%3A42.894Z')}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log("📊 [Debug] Full Response:", response);
        console.log("📋 [Debug] Response.data:", response.data);
        console.log("📋 [Debug] Response.data.success:", response.data?.success);
        console.log("📋 [Debug] Response.data.data:", response.data?.data);
        console.log("📋 [Debug] Response.data.message:", response.data?.message);
        
        setResponseData(response.data);
        
      } catch (err: any) {
        console.error("❌ [Debug] API Error:", err);
        console.error("❌ [Debug] Error response:", err.response);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Financial API</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Financial API</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Financial API</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Response Analysis:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Has success property:</strong> {responseData?.success !== undefined ? 'Yes' : 'No'}</p>
          <p><strong>Success value:</strong> {responseData?.success}</p>
          <p><strong>Has data property:</strong> {responseData?.data !== undefined ? 'Yes' : 'No'}</p>
          <p><strong>Has message property:</strong> {responseData?.message !== undefined ? 'Yes' : 'No'}</p>
          <p><strong>Response type:</strong> {typeof responseData}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Full Response Data:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(responseData, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Suggested Data Structure:</h2>
        <div className="bg-blue-100 p-4 rounded">
          <p>Based on the response, the data should be accessed as:</p>
          <code className="block mt-2 bg-white p-2 rounded">
            {responseData?.success !== undefined 
              ? 'response.data.data (if success is true)'
              : responseData?.data !== undefined
              ? 'response.data.data'
              : 'response.data (direct data)'
            }
          </code>
        </div>
      </div>
    </div>
  );
};

export default DebugFinancial; 