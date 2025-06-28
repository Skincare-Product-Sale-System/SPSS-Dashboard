import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from 'config/api';

const SimpleFinancial = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get auth token
        const authUser = localStorage.getItem("authUser");
        const token = authUser ? JSON.parse(authUser).accessToken : null;
        
        console.log("Token:", token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        
        if (!token) {
          throw new Error('No token found');
        }
        
        // Test API call
        const response = await axios.get(
          `${getApiUrl('/financial-dashboard/summary?startDate=2024-12-31T17%3A00%3A00.000Z&endDate=2025-06-28T03%3A40%3A42.894Z')}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log("API Response:", response);
        setData(response.data);
        
      } catch (err: any) {
        console.error("API Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Financial Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default SimpleFinancial; 