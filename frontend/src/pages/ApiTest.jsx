import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiCheck, FiX } from 'react-icons/fi';
import Button from '../components/Button';
import Card from '../components/Card';
import apiService from '../services/api';
import './ApiTest.css';

const ApiTest = () => {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api/test');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const methods = ['GET', 'POST', 'PUT', 'DELETE'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let res;
      const data = requestBody ? JSON.parse(requestBody) : null;

      switch (method) {
        case 'GET':
          res = await apiService.get(endpoint);
          break;
        case 'POST':
          res = await apiService.post(endpoint, data);
          break;
        case 'PUT':
          res = await apiService.put(endpoint, data);
          break;
        case 'DELETE':
          res = await apiService.delete(endpoint);
          break;
        default:
          break;
      }

      setResponse({
        status: res.status,
        data: res.data,
        headers: res.headers
      });
    } catch (err) {
      setError({
        message: err.message,
        response: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-test">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="api-test-title">API 테스트</h1>
        
        <Card title="요청 설정" className="request-card">
          <form onSubmit={handleSubmit} className="api-form">
            <div className="form-row">
              <div className="method-select">
                {methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`method-btn ${method === m ? 'active' : ''} method-${m.toLowerCase()}`}
                    onClick={() => setMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/endpoint"
                className="endpoint-input"
              />
            </div>

            {(method === 'POST' || method === 'PUT') && (
              <div className="form-group">
                <label>Request Body (JSON)</label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={6}
                  className="body-input"
                />
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              icon={<FiSend />}
              fullWidth
            >
              요청 보내기
            </Button>
          </form>
        </Card>

        {(response || error) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card 
              title="응답" 
              className="response-card"
              gradient={response && !error}
            >
              {response && (
                <div className="response-content">
                  <div className="response-status">
                    <FiCheck className="status-icon success" />
                    <span>Status: {response.status}</span>
                  </div>
                  <pre className="response-data">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {error && (
                <div className="error-content">
                  <div className="response-status">
                    <FiX className="status-icon error" />
                    <span>Error: {error.message}</span>
                  </div>
                  {error.response && (
                    <pre className="response-data error">
                      {JSON.stringify(error.response, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ApiTest;