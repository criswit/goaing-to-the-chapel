import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/GuestList.css';
import { loadConfig } from '../../config';

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
  notes?: string;
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
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const itemsPerPage = 20;

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      // Mock data for testing when no token
      if (!token) {
        const mockGuests: Guest[] = [
          {
            invitationCode: 'TEST001',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-0123',
            partySize: 2,
            rsvpStatus: 'attending',
            dietaryRestrictions: ['vegetarian'],
            plusOneName: 'Jane Doe',
            plusOneDietaryRestrictions: ['vegan'],
            submittedAt: new Date().toISOString(),
          },
          {
            invitationCode: 'TEST002',
            name: 'Bob Smith',
            email: 'bob@example.com',
            phone: '555-0124',
            partySize: 1,
            rsvpStatus: 'pending',
            dietaryRestrictions: [],
            submittedAt: new Date().toISOString(),
          },
          {
            invitationCode: 'TEST003',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phone: '555-0125',
            partySize: 3,
            rsvpStatus: 'maybe',
            dietaryRestrictions: ['gluten-free', 'nut-allergy'],
            submittedAt: new Date().toISOString(),
          },
        ];
        setGuests(mockGuests);
        setError(null);
        setLoading(false);
        return;
      }

      const config = await loadConfig();
      // Remove any trailing slash from adminApiUrl before appending the path
      const adminApiUrl = config.adminApiUrl.replace(/\/$/, '');
      const response = await fetch(`${adminApiUrl}/admin/protected/guests`, {
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

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest({ ...guest });
    setShowEditModal(true);
    setEditError(null); // Clear any previous errors
  };

  const handleSaveGuest = async () => {
    if (!editingGuest) return;

    try {
      const token = localStorage.getItem('adminToken');

      // For testing - update local state directly when no token
      if (!token) {
        // Update the guest in the local state
        setGuests(
          guests.map((g) => (g.invitationCode === editingGuest.invitationCode ? editingGuest : g))
        );

        setShowEditModal(false);
        setEditingGuest(null);
        return;
      }

      const config = await loadConfig();
      // Remove any trailing slash from adminApiUrl before appending the path
      const adminApiUrl = config.adminApiUrl.replace(/\/$/, '');

      // Only send the fields that should be updated, not DynamoDB internals
      const updateData = {
        name: editingGuest.name,
        email: editingGuest.email,
        phone: editingGuest.phone,
        rsvpStatus: editingGuest.rsvpStatus,
        partySize: editingGuest.partySize,
        plusOneName: editingGuest.plusOneName,
        dietaryRestrictions: editingGuest.dietaryRestrictions,
        plusOneDietaryRestrictions: editingGuest.plusOneDietaryRestrictions,
        notes: editingGuest.notes,
      };

      const response = await fetch(
        `${adminApiUrl}/admin/protected/guests/${editingGuest.invitationCode}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        // Try to parse error response for detailed error message
        let errorMessage = 'Failed to update guest';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            // If details is an array of validation errors
            if (Array.isArray(errorData.details)) {
              const detailMessages = errorData.details
                .map((detail: any) => detail.message || detail)
                .join(', ');
              errorMessage = `${errorMessage}: ${detailMessages}`;
            } else if (typeof errorData.details === 'string') {
              errorMessage = `${errorMessage}: ${errorData.details}`;
            }
          }
        } catch (parseError) {
          // If we can't parse the error response, use the default message
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Update the guest in the local state
      setGuests(
        guests.map((g) => (g.invitationCode === editingGuest.invitationCode ? editingGuest : g))
      );

      setShowEditModal(false);
      setEditingGuest(null);
      setEditError(null);
    } catch (err) {
      console.error('Error updating guest:', err);
      // Display the actual error message
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update guest. Please try again.';
      setEditError(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingGuest(null);
    setEditError(null);
  };

  const handleSendReminder = async () => {
    if (selectedGuests.size === 0) return;

    const confirmed = window.confirm(
      `Send reminder emails to ${selectedGuests.size} selected guest(s)?`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Please log in to send reminders');
        return;
      }

      const config = await loadConfig();
      const adminApiUrl = config.adminApiUrl.replace(/\/$/, '');

      // Get selected guest details (not currently used but may be needed for future features)
      // const selectedGuestList = guests.filter(g => selectedGuests.has(g.invitationCode));

      const response = await fetch(`${adminApiUrl}/admin/protected/send-reminders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationCodes: Array.from(selectedGuests),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reminders');
      }

      const result = await response.json();
      alert(`Successfully sent reminders to ${result.sentCount || selectedGuests.size} guest(s)`);
      setSelectedGuests(new Set());
    } catch (err) {
      console.error('Error sending reminders:', err);
      alert('Failed to send reminders. Please try again.');
    }
  };

  const handleExportSelected = () => {
    if (selectedGuests.size === 0) return;

    // Get selected guest data
    const selectedGuestList = guests.filter((g) => selectedGuests.has(g.invitationCode));

    // Create CSV content
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Invitation Code',
      'RSVP Status',
      'Party Size',
      'Plus One Name',
      'Dietary Restrictions',
      'Plus One Dietary',
      'Responded Date',
    ];
    const csvContent = [
      headers.join(','),
      ...selectedGuestList.map((guest) =>
        [
          guest.name,
          guest.email,
          guest.phone || '',
          guest.invitationCode,
          guest.rsvpStatus || 'pending',
          guest.partySize || 1,
          guest.plusOneName || '',
          (guest.dietaryRestrictions || []).join('; '),
          (guest.plusOneDietaryRestrictions || []).join('; '),
          guest.submittedAt ? new Date(guest.submittedAt).toLocaleDateString() : '',
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `selected_guests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            ↻ Refresh
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
            <button className="btn-secondary" onClick={handleSendReminder}>
              Send Reminder
            </button>
            <button className="btn-secondary" onClick={handleExportSelected}>
              Export Selected
            </button>
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
                    <div>{guest.name || 'Unknown Guest'}</div>
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
                  <button className="btn-icon" onClick={() => handleEditGuest(guest)} title="Edit">
                    ✎
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

      {showEditModal && editingGuest && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Guest</h2>
            {editError && (
              <div
                className="error-message"
                style={{
                  background: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '15px',
                  color: '#c00',
                }}
              >
                <strong>Error:</strong> {editError}
              </div>
            )}
            <div className="modal-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editingGuest.name}
                  onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingGuest.email}
                  onChange={(e) => setEditingGuest({ ...editingGuest, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  value={editingGuest.phone || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>RSVP Status:</label>
                <select
                  value={editingGuest.rsvpStatus || 'pending'}
                  onChange={(e) =>
                    setEditingGuest({
                      ...editingGuest,
                      rsvpStatus: e.target.value as Guest['rsvpStatus'],
                    })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="attending">Attending</option>
                  <option value="not_attending">Not Attending</option>
                  <option value="maybe">Maybe</option>
                </select>
              </div>

              <div className="form-group">
                <label>Party Size:</label>
                <input
                  type="number"
                  min="1"
                  value={editingGuest.partySize || 1}
                  onChange={(e) =>
                    setEditingGuest({
                      ...editingGuest,
                      partySize: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Plus One Name:</label>
                <input
                  type="text"
                  value={editingGuest.plusOneName || ''}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, plusOneName: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Dietary Restrictions:</label>
                <div className="checkbox-group">
                  {['vegetarian', 'vegan', 'gluten-free', 'nut-allergy'].map((diet) => (
                    <label key={diet} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editingGuest.dietaryRestrictions?.includes(diet) || false}
                        onChange={(e) => {
                          const restrictions = editingGuest.dietaryRestrictions || [];
                          if (e.target.checked) {
                            setEditingGuest({
                              ...editingGuest,
                              dietaryRestrictions: [...restrictions, diet],
                            });
                          } else {
                            setEditingGuest({
                              ...editingGuest,
                              dietaryRestrictions: restrictions.filter((r) => r !== diet),
                            });
                          }
                        }}
                      />
                      {diet.charAt(0).toUpperCase() + diet.slice(1).replace('-', ' ')}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-primary" onClick={handleSaveGuest}>
                  Save Changes
                </button>
                <button className="btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;
