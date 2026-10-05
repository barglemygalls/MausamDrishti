import React, { useState } from 'react';
import { Code2, Play, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { API_ENDPOINTS } from '../services/apiDocsService';

export function API() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [paramValues, setParamValues] = useState({
    day: 5,
    variable: 'rainfall',
    threshold: 0.50,
    location_id: 'grid_4821',
    event_id: 'hist_monsoon_dep_2021'
  });
  const [responseJson, setResponseJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleParamChange = (name, val) => {
    setParamValues(prev => ({ ...prev, [name]: val }));
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await selectedEndpoint.execute(paramValues);
      setResponseJson(res);
    } catch (err) {
      setResponseJson({ error: err.message });
    }
    setLoading(false);
  };

  const constructQueryString = () => {
    if (!selectedEndpoint.params || selectedEndpoint.params.length === 0) return '';
    const query = selectedEndpoint.params
      .map(p => `${p.name}=${paramValues[p.name] !== undefined ? paramValues[p.name] : p.default}`)
      .join('&');
    return `?${query}`;
  };

  const fullUrl = `https://mausam-drishti.ncmrwf.gov.in${selectedEndpoint.path}${constructQueryString()}`;
  const curlCommand = `curl -X GET "${fullUrl}" \\\n  -H "Accept: application/json"`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Operational Decision-Support API
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Machine-readable endpoints providing forecast confidence, bust probabilities, XAI explanations, and historical error archives
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Endpoint Selector Menu */}
        <div className="scientific-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '12px' }}>
            OPERATIONAL ENDPOINTS
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {API_ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path;
              return (
                <button
                  key={ep.path}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    setResponseJson(null);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--primary-accent)' : 'var(--border-light)',
                    backgroundColor: isSelected ? 'var(--primary-accent-light)' : '#FFFFFF',
                    color: isSelected ? 'var(--primary-accent)' : 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      backgroundColor: 'var(--primary-accent)',
                      color: '#FFFFFF',
                      padding: '1px 4px',
                      borderRadius: '2px'
                    }}>
                      GET
                    </span>
                    <span className="mono-text" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      {ep.path}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.3 }}>
                    {ep.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Explorer & Execution Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="scientific-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: 'var(--primary-accent)',
                    color: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: '3px'
                  }}>
                    GET
                  </span>
                  <h3 className="mono-text" style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedEndpoint.path}
                  </h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedEndpoint.summary}
                </p>
              </div>

              <button
                onClick={handleExecute}
                disabled={loading}
                className="btn-primary"
                style={{ padding: '8px 16px' }}
              >
                <Play size={14} fill="#FFFFFF" />
                <span>{loading ? 'Executing...' : 'Execute Request'}</span>
              </button>
            </div>

            {/* Query Parameters Config */}
            {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Query Parameters
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {selectedEndpoint.params.map(p => (
                    <div key={p.name} style={{ backgroundColor: 'var(--surface-card-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                        {p.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({p.type})</span>
                      </label>
                      <input
                        type={p.type === 'integer' || p.type === 'float' ? 'number' : 'text'}
                        step={p.type === 'float' ? '0.05' : '1'}
                        value={paramValues[p.name] !== undefined ? paramValues[p.name] : p.default}
                        onChange={(e) => handleParamChange(p.name, e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: '4px',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-neutral)',
                          fontSize: '0.8125rem'
                        }}
                      />
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        {p.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* cURL Snippet */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  cURL Command
                </span>
                <button
                  onClick={handleCopyCurl}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: 'var(--primary-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre style={{
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-family-mono)',
                overflowX: 'auto'
              }}>
                {curlCommand}
              </pre>
            </div>

            {/* Live Response Output Inspector */}
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Response Body (JSON)
              </span>
              <pre style={{
                backgroundColor: '#0F172A',
                color: '#38BDF8',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-family-mono)',
                maxHeight: '380px',
                overflowY: 'auto',
                lineHeight: 1.45
              }}>
                {responseJson ? JSON.stringify(responseJson, null, 2) : '// Click "Execute Request" above to view live operational JSON response'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
