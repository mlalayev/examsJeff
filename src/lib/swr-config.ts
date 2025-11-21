/**
 * SWR Configuration for API caching and performance
 * 
 * This configuration enables:
 * - Smart caching of API responses
 * - Automatic revalidation
 * - Deduplication of requests
 * - Error retry logic
 */

export const swrConfig = {
  // Don't revalidate on window focus (can be annoying)
  revalidateOnFocus: false,
  
  // Revalidate if data is stale
  revalidateIfStale: true,
  
  // Dedupe requests within 60 seconds
  dedupingInterval: 60000,
  
  // Throttle focus events
  focusThrottleInterval: 60000,
  
  // Retry failed requests 3 times
  errorRetryCount: 3,
  
  // Retry interval (exponential backoff)
  errorRetryInterval: 5000,
  
  // Keep previous data while fetching
  keepPreviousData: true,
  
  // Default fetcher
  fetcher: async (url: string) => {
    const res = await fetch(url);
    
    if (!res.ok) {
      const error = new Error('API request failed');
      (error as any).status = res.status;
      throw error;
    }
    
    return res.json();
  },
};

export default swrConfig;


