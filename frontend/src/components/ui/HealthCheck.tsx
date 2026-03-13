'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { HealthResponse } from '@/lib/types';

export function HealthCheck() {
  const [status, setStatus] = useState<string>('checking...');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    apiClient<HealthResponse>('/health/')
      .then((data) => {
        setStatus(data.status === 'ok' ? 'Backend connected' : 'Unexpected response');
      })
      .catch(() => {
        setStatus('Backend unavailable');
        setError(true);
      });
  }, []);

  return (
    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
      error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
    }`}>
      {status}
    </div>
  );
}
