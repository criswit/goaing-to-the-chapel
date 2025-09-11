import React, { useState, useEffect } from 'react';
import '../../styles/StatsOverview.css';
import { loadConfig } from '../../config';

interface RSVPStats {
  totalInvited: number;
  totalResponded: number;
  totalAttending: number;
  totalDeclined: number;
  totalPending: number;
  totalMaybe: number;
  totalGuests: number;
  dietaryRestrictions: {
    vegetarian: number;
    vegan: number;
    glutenFree: number;
    nutAllergy: number;
    other: number;
  };
  responseRate: number;
  averagePartySize: number;
  recentResponses: Array<{
    name: string;
    email: string;
    respondedAt: string;
    status: string;
    partySize: number;
  }>;
}

const StatsOverview: React.FC = () => {
  const [stats, setStats] = useState<RSVPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = await loadConfig();
      // Remove any trailing slash from adminApiUrl before appending the path
      const adminApiUrl = config.adminApiUrl.replace(/\/$/, '');
      const response = await fetch(`${adminApiUrl}/admin/protected/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please login again.');
        }
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return <div className="stats-loading">Loading statistics...</div>;
  }

  if (error) {
    return <div className="stats-error">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="stats-error">No statistics available</div>;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="stats-overview">
      <div className="stats-header">
        <h1>RSVP Dashboard</h1>
        <button className="refresh-button" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-value">{stats.totalInvited}</div>
          <div className="stat-label">Total Invited</div>
        </div>

        <div className="stat-card success">
          <div className="stat-value">{stats.totalAttending}</div>
          <div className="stat-label">Attending</div>
          <div className="stat-sublabel">{stats.totalGuests} total guests</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-value">{stats.totalPending}</div>
          <div className="stat-label">Pending</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-value">{stats.totalDeclined}</div>
          <div className="stat-label">Not Attending</div>
        </div>

        <div className="stat-card maybe">
          <div className="stat-value">{stats.totalMaybe || 0}</div>
          <div className="stat-label">Maybe</div>
        </div>

        <div className="stat-card info">
          <div className="stat-value">{stats.responseRate.toFixed(1)}%</div>
          <div className="stat-label">Response Rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.averagePartySize.toFixed(1)}</div>
          <div className="stat-label">Avg Party Size</div>
        </div>
      </div>

      <div className="stats-sections">
        <div className="stats-section">
          <h2>Dietary Restrictions</h2>
          <div className="dietary-grid">
            {stats.dietaryRestrictions.vegetarian > 0 && (
              <div className="dietary-item">
                <span className="dietary-count">{stats.dietaryRestrictions.vegetarian}</span>
                <span className="dietary-label">Vegetarian</span>
              </div>
            )}
            {stats.dietaryRestrictions.vegan > 0 && (
              <div className="dietary-item">
                <span className="dietary-count">{stats.dietaryRestrictions.vegan}</span>
                <span className="dietary-label">Vegan</span>
              </div>
            )}
            {stats.dietaryRestrictions.glutenFree > 0 && (
              <div className="dietary-item">
                <span className="dietary-count">{stats.dietaryRestrictions.glutenFree}</span>
                <span className="dietary-label">Gluten-Free</span>
              </div>
            )}
            {stats.dietaryRestrictions.nutAllergy > 0 && (
              <div className="dietary-item">
                <span className="dietary-count">{stats.dietaryRestrictions.nutAllergy}</span>
                <span className="dietary-label">Nut Allergy</span>
              </div>
            )}
            {stats.dietaryRestrictions.other > 0 && (
              <div className="dietary-item">
                <span className="dietary-count">{stats.dietaryRestrictions.other}</span>
                <span className="dietary-label">Other</span>
              </div>
            )}
          </div>
        </div>

        <div className="stats-section">
          <h2>Recent Responses</h2>
          <div className="recent-responses">
            {stats.recentResponses.length === 0 ? (
              <p className="no-responses">No responses yet</p>
            ) : (
              <table className="responses-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Party Size</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentResponses.map((response) => (
                    <tr key={`${response.email}-${response.respondedAt}`}>
                      <td>
                        <div className="guest-name">{response.name}</div>
                        <div className="guest-email">{response.email}</div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${response.status === 'attending' ? 'attending' : response.status === 'not_attending' ? 'declined' : response.status === 'maybe' ? 'maybe' : 'pending'}`}
                        >
                          {response.status === 'attending'
                            ? 'Attending'
                            : response.status === 'not_attending'
                              ? 'Not Attending'
                              : response.status === 'maybe'
                                ? 'Maybe'
                                : 'Pending'}
                        </span>
                      </td>
                      <td>{response.partySize}</td>
                      <td>{formatDate(response.respondedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="response-chart">
        <h2>Response Overview</h2>
        <div className="chart-container">
          <div className="chart-bar">
            <div
              className="bar-segment attending"
              style={{ width: `${(stats.totalAttending / stats.totalInvited) * 100}%` }}
            >
              {stats.totalAttending > 0 && `${stats.totalAttending}`}
            </div>
            <div
              className="bar-segment declined"
              style={{ width: `${(stats.totalDeclined / stats.totalInvited) * 100}%` }}
            >
              {stats.totalDeclined > 0 && `${stats.totalDeclined}`}
            </div>
            <div
              className="bar-segment maybe"
              style={{ width: `${((stats.totalMaybe || 0) / stats.totalInvited) * 100}%` }}
            >
              {(stats.totalMaybe || 0) > 0 && `${stats.totalMaybe}`}
            </div>
            <div
              className="bar-segment pending"
              style={{ width: `${(stats.totalPending / stats.totalInvited) * 100}%` }}
            >
              {stats.totalPending > 0 && `${stats.totalPending}`}
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color attending"></span>
              <span>Attending</span>
            </div>
            <div className="legend-item">
              <span className="legend-color declined"></span>
              <span>Not Attending</span>
            </div>
            <div className="legend-item">
              <span className="legend-color maybe"></span>
              <span>Maybe</span>
            </div>
            <div className="legend-item">
              <span className="legend-color pending"></span>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
