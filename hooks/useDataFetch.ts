"use client";

import { useState, useEffect } from 'react';

export function useDataFetch(dataId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataId) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch data from API
    fetch(`/api/data/${dataId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        return response.json();
      })
      .then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [dataId]);

  return { data, loading, error };
}
