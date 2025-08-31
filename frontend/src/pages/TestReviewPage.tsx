import React, { useState } from 'react';
import { reviewsApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TestReviewPage: React.FC = () => {
  const { user, login } = useAuth();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await login({ email: 'testconsumer@example.com', password: 'password123' });
      setResult('Login successful!');
    } catch (error: any) {
      setResult('Login failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleTestSubmit = async () => {
    console.log('TestReviewPage: Starting test');
    setLoading(true);
    
    // Check authentication state
    const token = localStorage.getItem('token');
    const authStatus = `Auth Status:\n- Token exists: ${!!token}\n- Token preview: ${token ? token.substring(0, 20) + '...' : 'None'}\n- User: ${user ? user.name + ' (' + user.role + ')' : 'Not logged in'}`;
    
    setResult('Starting test...\n\n' + authStatus);
    
    try {
      const testData = {
        productId: 'PROD-1756570380068-4HXO9LOE7',
        rating: 5,
        comment: 'Test review from test page'
      };
      
      console.log('TestReviewPage: Calling API with:', testData);
      setResult(prev => prev + '\n\nSubmitting test review: ' + JSON.stringify(testData));
      const response = await reviewsApi.createReview(testData);
      console.log('TestReviewPage: API response:', response);
      setResult(prev => prev + '\nTest review response: ' + JSON.stringify(response));
      setResult(prev => prev + `\nSuccess: Review created with ID ${response.data._id}`);
    } catch (error: any) {
      console.log('TestReviewPage: API error:', error);
      setResult(prev => prev + '\nTest review error: ' + (error.message || 'Unknown error'));
      if (error.response) {
        setResult(prev => prev + '\nError response: ' + JSON.stringify(error.response.data));
        setResult(prev => prev + '\nError status: ' + error.response.status);
      }
      if (error.request) {
        setResult(prev => prev + '\nRequest made but no response received');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Review API Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="mb-4">User: {user ? user.name : 'Not logged in'}</p>
          <p className="mb-4">User Role: {user ? user.role : 'N/A'}</p>
          
          {!user && (
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 mr-4"
            >
              {loginLoading ? 'Logging in...' : 'Login as Test User'}
            </button>
          )}
          
          <button
            onClick={handleTestSubmit}
            disabled={loading || !user}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Review Submission'}
          </button>
          
          {result && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestReviewPage;