import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/GuestList.css';
import { getConfig } from '../../config';

interface Guest {
  invitationCode: string;
  name: string;
  email: string;
  phone?: string;
  partySize?: number;
  rsvpStatus?: 'pending' | 'attending' | 'not_attending' | 'maybe';
  dietaryRestrictions?: string[];
  plusOneName?: string;
  plusOneDietaryRestrictions?: string[];
  submittedAt?: string;
}

interface FilterOptions {
  status: 'all' | 'pending' | 'attending' | 'not_attending' | 'maybe';
  search: string;
  dietary: 'all' | 'vegetarian' | 'vegan' | 'gluten-free' | 'nut-allergy' | 'other';
}

const GuestList: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    search: '',
    dietary: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = getConfig();
      const response = await fetch(`${config.adminApiUrl}admin/protected/guests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please login again.');
        }
        throw new Error('Failed to fetch guests');
      }

      const data = await response.json();
      setGuests(data.guests || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching guests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const filteredGuests = useMemo(() => {
    let filtered = [...guests];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((guest) => {
        if (filters.status === 'pending')
          return !guest.rsvpStatus || guest.rsvpStatus === 'pending';
        return guest.rsvpStatus === filters.status;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (guest) =>
          guest.name.toLowerCase().includes(searchLower) ||
          guest.email.toLowerCase().includes(searchLower) ||
          guest.invitationCode.toLowerCase().includes(searchLower)
      );
    }

    // Dietary filter
    if (filters.dietary !== 'all') {
      filtered = filtered.filter((guest) => {
        const hasDietary =
          guest.dietaryRestrictions?.includes(filters.dietary) ||
          guest.plusOneDietaryRestrictions?.includes(filters.dietary);
        return hasDietary;
      });
    }

    return filtered;
  }, [guests, filters]);

  const paginatedGuests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredGuests.slice(startIndex, endIndex);
  }, [filteredGuests, currentPage]);

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);

  const handleSelectAll = () => {
    if (selectedGuests.size === paginatedGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(paginatedGuests.map((g) => g.invitationCode)));
    }
  };

  const handleSelectGuest = (code: string) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedGuests(newSelected);
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return <span className="status-badge pending">Pending</span>;
    }
    if (status === 'attending') {
      return <span className="status-badge attending">Attending</span>;
    }
    if (status === 'not_attending') {
      return <span className="status-badge declined">Not Attending</span>;
    }
    if (status === 'maybe') {
      return <span className="status-badge maybe">Maybe</span>;
    }
    return <span className="status-badge declined">Unknown</span>;
  };

  if (loading) {
    return <div className="guest-list-loading">Loading guests...</div>;
  }

  if (error) {
    return <div className="guest-list-error">Error: {error}</div>;
  }

  return (
    <div className="guest-list-container">
      <div className="guest-list-header">
        <h1>Guest Management</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={fetchGuests}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="maybe">Maybe</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Dietary:</label>
          <select
            value={filters.dietary}
            onChange={(e) => setFilters({ ...filters, dietary: e.target.value as any })}
          >
            <option value="all">All</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten-free">Gluten-Free</option>
            <option value="nut-allergy">Nut Allergy</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {selectedGuests.size > 0 && (
        <div className="selection-bar">
          <span>{selectedGuests.size} guests selected</span>
          <div className="selection-actions">
            <button className="btn-secondary">Send Reminder</button>
            <button className="btn-secondary">Export Selected</button>
            <button className="btn-text" onClick={() => setSelectedGuests(new Set())}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="guest-table-container">
        <table className="guest-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    selectedGuests.size === paginatedGuests.length && paginatedGuests.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Code</th>
              <th>Status</th>
              <th>Party Size</th>
              <th>Dietary</th>
              <th>Responded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGuests.map((guest) => (
              <tr key={guest.invitationCode}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedGuests.has(guest.invitationCode)}
                    onChange={() => handleSelectGuest(guest.invitationCode)}
                  />
                </td>
                <td>
                  <div className="guest-name-cell">
                    <div>{guest.name}</div>
                    {guest.plusOneName && (
                      <div className="plus-one-name">+ {guest.plusOneName}</div>
                    )}
                  </div>
                </td>
                <td>{guest.email}</td>
                <td className="code-cell">{guest.invitationCode}</td>
                <td>{getStatusBadge(guest.rsvpStatus)}</td>
                <td>{guest.partySize || 1}</td>
                <td>
                  {guest.dietaryRestrictions?.length ? (
                    <div className="dietary-list">
                      {guest.dietaryRestrictions.map((d) => (
                        <span key={d} className="dietary-tag">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {guest.submittedAt && !isNaN(new Date(guest.submittedAt).getTime())
                    ? new Date(guest.submittedAt).toLocaleDateString()
                    : '-'}
                </td>
                <td>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      /* Edit functionality disabled */
                    }}
                    title="Edit"
                    disabled
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      <div className="guest-stats">
        <div className="stat">
          <span className="stat-label">Total Guests:</span>
          <span className="stat-value">{filteredGuests.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Attending:</span>
          <span className="stat-value">
            {filteredGuests.filter((g) => g.rsvpStatus === 'attending').length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Pending:</span>
          <span className="stat-value">
            {filteredGuests.filter((g) => !g.rsvpStatus || g.rsvpStatus === 'pending').length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Not Attending:</span>
          <span className="stat-value">
            {filteredGuests.filter((g) => g.rsvpStatus === 'not_attending').length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Maybe:</span>
          <span className="stat-value">
            {filteredGuests.filter((g) => g.rsvpStatus === 'maybe').length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GuestList;
