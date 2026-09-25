export async function checkBackendHealth() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data && data.status === 'ok') {
      return { online: true, data };
    }
    return { online: false, error: 'Invalid response format' };
  } catch (error) {
    return { online: false, error: error.message };
  }
}

export async function fetchCities() {
  try {
    const response = await fetch('/api/cities');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch cities:', error);
    return [];
  }
}

export async function fetchSystemStatus() {
  try {
    const response = await fetch('/api/system/status');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch system status:', error);
    return null;
  }
}

export async function fetchFeedStatuses() {
  try {
    const response = await fetch('/api/feeds');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch feed statuses:', error);
    return [];
  }
}

export async function fetchFeedStatusDiagnostics() {
  try {
    const response = await fetch('/api/feed-status');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch feed status diagnostics:', error);
    return null;
  }
}

export async function fetchEvents({ city, source, eventType, zone, limit = 50 } = {}) {
  try {
    const params = new URLSearchParams();
    if (city && city !== 'all') params.append('city', city);
    if (source && source !== 'all') params.append('source', source);
    if (eventType) params.append('eventType', eventType);
    if (zone && zone !== 'all') params.append('zone', zone);
    if (limit) params.append('limit', limit);

    const response = await fetch(`/api/events?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return { count: 0, events: [] };
  }
}

export async function fetchInsights(city = null) {
  try {
    const url = city && city !== 'all' ? `/api/insights?city=${encodeURIComponent(city)}` : '/api/insights';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch insights:', error);
    return { city: city || 'ALL', insights: [] };
  }
}

export async function fetchTrends(city = null) {
  try {
    const url = city && city !== 'all' ? `/api/trends?city=${encodeURIComponent(city)}` : '/api/trends';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return { trends: {} };
  }
}

export async function fetchAlerts(city = null) {
  try {
    const url = city && city !== 'all' ? `/api/alerts?city=${encodeURIComponent(city)}` : '/api/alerts';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return { activeAlerts: [], history: [] };
  }
}

export async function fetchHistory(city = 'Delhi', window = 24) {
  try {
    const response = await fetch(`/api/history?city=${encodeURIComponent(city)}&window=${window}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return { observations: [], insufficientData: true };
  }
}

export async function triggerSystemRefresh() {
  try {
    const response = await fetch('/api/system/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('System refresh POST warning:', error.message);
    return null;
  }
}


