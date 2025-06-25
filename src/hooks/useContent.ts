import { useState, useEffect } from 'react';

interface UseContentOptions {
  keys?: string[];
}

export function useContent(category: string, options?: UseContentOptions) {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/content/${category}`, {
          method: options?.keys ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: options?.keys ? JSON.stringify({ keys: options.keys }) : undefined,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [category, options?.keys?.join(',')]);

  return { content, loading, error };
}

// Hook to fetch multiple categories at once
export function useMultiContent(categories: string[]) {
  const [content, setContent] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categories }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (categories.length > 0) {
      fetchContent();
    }
  }, [categories.join(',')]);

  return { content, loading, error };
}