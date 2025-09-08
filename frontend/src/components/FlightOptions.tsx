import React, { useState, useMemo } from 'react';
import { Clock, Globe, Filter, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import '../styles/FlightOptions.css';

interface FlightOption {
  id: string;
  airline: string;
  origin: 'SFO' | 'SEA';
  destination: string;
  route: string[];
  duration: {
    min: number;
    max: number;
    display: string;
  };
  classes: {
    economy: {
      min: number;
      max: number;
      category: 'Budget' | 'Mid-Range' | 'Premium' | 'Expensive';
    };
    business: {
      min: number;
      max: number;
      category: 'Budget' | 'Mid-Range' | 'Premium' | 'Expensive';
    };
    first?: {
      min: number;
      max: number;
      category: 'Budget' | 'Mid-Range' | 'Premium' | 'Expensive';
    };
  };
  features: string[];
  isBestValue?: boolean;
  isFastest?: boolean;
}

const flightData: FlightOption[] = [
  {
    id: 'ai-sfo',
    airline: 'Air India',
    origin: 'SFO',
    destination: 'GOI',
    route: ['SFO', 'DEL', 'GOI'],
    duration: { min: 17, max: 21, display: '17-21 hours' },
    classes: {
      economy: { min: 900, max: 1350, category: 'Budget' },
      business: { min: 4000, max: 5500, category: 'Mid-Range' },
    },
    features: ['Direct to Delhi', 'Shortest overall time'],
    isFastest: true,
  },
  {
    id: 'ai-sea',
    airline: 'Air India',
    origin: 'SEA',
    destination: 'GOI',
    route: ['SEA', 'DEL', 'GOI'],
    duration: { min: 18, max: 22, display: '18-22 hours' },
    classes: {
      economy: { min: 950, max: 1400, category: 'Budget' },
      business: { min: 4100, max: 5600, category: 'Mid-Range' },
    },
    features: ['Direct to Delhi'],
  },
  {
    id: 'emirates-sfo',
    airline: 'Emirates',
    origin: 'SFO',
    destination: 'GOI',
    route: ['SFO', 'DXB', 'GOI'],
    duration: { min: 20, max: 24, display: '20-24 hours' },
    classes: {
      economy: { min: 1100, max: 1500, category: 'Mid-Range' },
      business: { min: 4500, max: 6500, category: 'Premium' },
      first: { min: 12000, max: 19000, category: 'Expensive' },
    },
    features: ['A380 aircraft', 'Premium lounges', 'Shower spa on First'],
    isBestValue: true,
  },
  {
    id: 'emirates-sea',
    airline: 'Emirates',
    origin: 'SEA',
    destination: 'GOI',
    route: ['SEA', 'DXB', 'GOI'],
    duration: { min: 20, max: 24, display: '20-24 hours' },
    classes: {
      economy: { min: 1100, max: 1500, category: 'Mid-Range' },
      business: { min: 4500, max: 6500, category: 'Premium' },
      first: { min: 12000, max: 19000, category: 'Expensive' },
    },
    features: ['A380 aircraft', 'Premium lounges', 'Shower spa on First'],
  },
  {
    id: 'qatar-sfo',
    airline: 'Qatar Airways',
    origin: 'SFO',
    destination: 'GOI',
    route: ['SFO', 'DOH', 'GOI'],
    duration: { min: 19, max: 23, display: '19-23 hours' },
    classes: {
      economy: { min: 1000, max: 1450, category: 'Budget' },
      business: { min: 4200, max: 6200, category: 'Premium' },
    },
    features: ['Qsuite business class', '5-star service'],
  },
  {
    id: 'qatar-sea',
    airline: 'Qatar Airways',
    origin: 'SEA',
    destination: 'GOI',
    route: ['SEA', 'DOH', 'GOI'],
    duration: { min: 19, max: 23, display: '19-23 hours' },
    classes: {
      economy: { min: 1000, max: 1450, category: 'Budget' },
      business: { min: 4200, max: 6200, category: 'Premium' },
    },
    features: ['Qsuite business class', '5-star service'],
  },
  {
    id: 'turkish-sfo',
    airline: 'Turkish Airlines',
    origin: 'SFO',
    destination: 'GOI',
    route: ['SFO', 'IST', 'GOI'],
    duration: { min: 20, max: 24, display: '20-24 hours' },
    classes: {
      economy: { min: 950, max: 1350, category: 'Budget' },
      business: { min: 3900, max: 5800, category: 'Mid-Range' },
    },
    features: ['Istanbul stopover option', 'Excellent cuisine'],
  },
  {
    id: 'turkish-sea',
    airline: 'Turkish Airlines',
    origin: 'SEA',
    destination: 'GOI',
    route: ['SEA', 'IST', 'GOI'],
    duration: { min: 19, max: 23, display: '19-23 hours' },
    classes: {
      economy: { min: 950, max: 1350, category: 'Budget' },
      business: { min: 3900, max: 5800, category: 'Mid-Range' },
    },
    features: ['Istanbul stopover option', 'Excellent cuisine'],
  },
  {
    id: 'singapore-sfo',
    airline: 'Singapore Airlines',
    origin: 'SFO',
    destination: 'GOI',
    route: ['SFO', 'SIN', 'BOM', 'GOI'],
    duration: { min: 22, max: 26, display: '22-26 hours' },
    classes: {
      economy: { min: 1200, max: 1500, category: 'Mid-Range' },
      business: { min: 5000, max: 7000, category: 'Premium' },
    },
    features: ['World-class service', 'Singapore stopover'],
  },
  {
    id: 'lufthansa-sfo',
    airline: 'Lufthansa',
    origin: 'SFO',
    destination: 'GOI',
    route: ['SFO', 'FRA', 'BOM', 'GOI'],
    duration: { min: 21, max: 25, display: '21-25 hours' },
    classes: {
      economy: { min: 1100, max: 1450, category: 'Mid-Range' },
      business: { min: 4800, max: 6500, category: 'Premium' },
    },
    features: ['German efficiency', 'Frankfurt hub'],
  },
  {
    id: 'lufthansa-sea',
    airline: 'Lufthansa',
    origin: 'SEA',
    destination: 'GOI',
    route: ['SEA', 'FRA', 'BOM', 'GOI'],
    duration: { min: 21, max: 25, display: '21-25 hours' },
    classes: {
      economy: { min: 1100, max: 1450, category: 'Mid-Range' },
      business: { min: 4800, max: 6500, category: 'Premium' },
    },
    features: ['German efficiency', 'Frankfurt hub'],
  },
  {
    id: 'british-sfo',
    airline: 'British Airways',
    origin: 'SFO',
    destination: 'GOI',
    route: ['SFO', 'LHR', 'BOM', 'GOI'],
    duration: { min: 22, max: 26, display: '22-26 hours' },
    classes: {
      economy: { min: 1150, max: 1500, category: 'Mid-Range' },
      business: { min: 4500, max: 6300, category: 'Premium' },
    },
    features: ['London stopover', 'OneWorld alliance'],
  },
  {
    id: 'british-sea',
    airline: 'British Airways',
    origin: 'SEA',
    destination: 'GOI',
    route: ['SEA', 'LHR', 'BOM', 'GOI'],
    duration: { min: 22, max: 26, display: '22-26 hours' },
    classes: {
      economy: { min: 1150, max: 1500, category: 'Mid-Range' },
      business: { min: 4500, max: 6300, category: 'Premium' },
    },
    features: ['London stopover', 'OneWorld alliance'],
  },
];

type SortBy = 'airline' | 'duration' | 'price' | 'none';
type ClassType = 'all' | 'economy' | 'business' | 'first';
type ViewMode = 'table' | 'cards';

const FlightOptions: React.FC = () => {
  const [selectedOrigin, setSelectedOrigin] = useState<'all' | 'SFO' | 'SEA'>('all');
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);

  const airlines = useMemo(() => {
    return Array.from(new Set(flightData.map((f) => f.airline))).sort();
  }, []);

  const filteredFlights = useMemo(() => {
    let filtered = [...flightData];

    if (selectedOrigin !== 'all') {
      filtered = filtered.filter((f) => f.origin === selectedOrigin);
    }

    if (selectedAirlines.length > 0) {
      filtered = filtered.filter((f) => selectedAirlines.includes(f.airline));
    }

    if (selectedClass === 'first') {
      filtered = filtered.filter((f) => f.classes.first);
    }

    if (sortBy === 'airline') {
      filtered.sort((a, b) => a.airline.localeCompare(b.airline));
    } else if (sortBy === 'duration') {
      filtered.sort((a, b) => a.duration.min - b.duration.min);
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => {
        const aPrice =
          selectedClass === 'business' ? a.classes.business.min : a.classes.economy.min;
        const bPrice =
          selectedClass === 'business' ? b.classes.business.min : b.classes.economy.min;
        return aPrice - bPrice;
      });
    }

    return filtered;
  }, [selectedOrigin, selectedAirlines, selectedClass, sortBy]);

  const toggleAirline = (airline: string) => {
    setSelectedAirlines((prev) =>
      prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline]
    );
  };

  const clearFilters = () => {
    setSelectedOrigin('all');
    setSelectedAirlines([]);
    setSelectedClass('all');
    setSortBy('none');
  };

  const getCategoryClass = (category: string) => {
    return `price-category ${category.toLowerCase().replace('-', '-')}`;
  };

  return (
    <div className="flight-options-section">
      <div className="filter-header">
        <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={18} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            Card View
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Origin City</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedOrigin === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedOrigin('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${selectedOrigin === 'SFO' ? 'active' : ''}`}
                onClick={() => setSelectedOrigin('SFO')}
              >
                SFO
              </button>
              <button
                className={`filter-btn ${selectedOrigin === 'SEA' ? 'active' : ''}`}
                onClick={() => setSelectedOrigin('SEA')}
              >
                SEA
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Airlines</label>
            <div className="filter-buttons airlines-grid">
              {airlines.map((airline) => (
                <button
                  key={airline}
                  className={`filter-btn ${selectedAirlines.includes(airline) ? 'active' : ''}`}
                  onClick={() => toggleAirline(airline)}
                >
                  {airline}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Class</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedClass === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedClass('all')}
              >
                All Classes
              </button>
              <button
                className={`filter-btn ${selectedClass === 'economy' ? 'active' : ''}`}
                onClick={() => setSelectedClass('economy')}
              >
                Economy
              </button>
              <button
                className={`filter-btn ${selectedClass === 'business' ? 'active' : ''}`}
                onClick={() => setSelectedClass('business')}
              >
                Business
              </button>
              <button
                className={`filter-btn ${selectedClass === 'first' ? 'active' : ''}`}
                onClick={() => setSelectedClass('first')}
              >
                First
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${sortBy === 'none' ? 'active' : ''}`}
                onClick={() => setSortBy('none')}
              >
                Default
              </button>
              <button
                className={`filter-btn ${sortBy === 'airline' ? 'active' : ''}`}
                onClick={() => setSortBy('airline')}
              >
                Airline
              </button>
              <button
                className={`filter-btn ${sortBy === 'duration' ? 'active' : ''}`}
                onClick={() => setSortBy('duration')}
              >
                Duration
              </button>
              <button
                className={`filter-btn ${sortBy === 'price' ? 'active' : ''}`}
                onClick={() => setSortBy('price')}
              >
                Price
              </button>
            </div>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      <div className="results-count">Showing {filteredFlights.length} flight options</div>

      {viewMode === 'table' ? (
        <div className="flights-table-wrapper">
          <table className="flights-table">
            <thead>
              <tr>
                <th>Origin</th>
                <th>Airline</th>
                <th>Route</th>
                <th>Duration</th>
                <th>Economy</th>
                <th>Business</th>
                {selectedClass === 'first' && <th>First</th>}
              </tr>
            </thead>
            <tbody>
              {filteredFlights.map((flight) => (
                <tr
                  key={flight.id}
                  className={flight.isBestValue ? 'best-value' : flight.isFastest ? 'fastest' : ''}
                >
                  <td>
                    <span className="origin-badge">{flight.origin}</span>
                  </td>
                  <td>
                    <div className="airline-cell">
                      <span>{flight.airline}</span>
                      {flight.isBestValue && (
                        <span className="badge best-value-badge">
                          <TrendingUp size={14} /> Best Value
                        </span>
                      )}
                      {flight.isFastest && (
                        <span className="badge fastest-badge">
                          <Clock size={14} /> Fastest
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="route-cell">{flight.route.join(' → ')}</div>
                  </td>
                  <td>{flight.duration.display}</td>
                  <td>
                    <span className={getCategoryClass(flight.classes.economy.category)}>
                      {flight.classes.economy.category}
                    </span>
                  </td>
                  <td>
                    <span className={getCategoryClass(flight.classes.business.category)}>
                      {flight.classes.business.category}
                    </span>
                  </td>
                  {selectedClass === 'first' && (
                    <td>
                      {flight.classes.first?.category ? (
                        <span className={getCategoryClass(flight.classes.first.category)}>
                          {flight.classes.first.category}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flights-cards">
          {filteredFlights.map((flight) => (
            <div
              key={flight.id}
              className={`flight-card ${flight.isBestValue ? 'best-value' : ''} ${flight.isFastest ? 'fastest' : ''}`}
            >
              <div className="flight-card-header">
                <h4>{flight.airline}</h4>
                <span className="origin-badge">{flight.origin}</span>
                {flight.isBestValue && (
                  <span className="badge best-value-badge">
                    <TrendingUp size={14} /> Best Value
                  </span>
                )}
                {flight.isFastest && (
                  <span className="badge fastest-badge">
                    <Clock size={14} /> Fastest
                  </span>
                )}
              </div>

              <div className="flight-card-route">
                <Globe size={16} />
                <span>{flight.route.join(' → ')}</span>
              </div>

              <div className="flight-card-details">
                <div className="detail-item">
                  <Clock size={14} />
                  <span>{flight.duration.display}</span>
                </div>

                <div className="price-section">
                  {selectedClass === 'all' || selectedClass === 'economy' ? (
                    <div className="price-item">
                      <span className="price-label">Economy:</span>
                      <span
                        className={`price-value ${getCategoryClass(flight.classes.economy.category)}`}
                      >
                        {flight.classes.economy.category}
                      </span>
                    </div>
                  ) : null}

                  {selectedClass === 'all' || selectedClass === 'business' ? (
                    <div className="price-item">
                      <span className="price-label">Business:</span>
                      <span
                        className={`price-value ${getCategoryClass(flight.classes.business.category)}`}
                      >
                        {flight.classes.business.category}
                      </span>
                    </div>
                  ) : null}

                  {(selectedClass === 'all' || selectedClass === 'first') &&
                  flight.classes.first ? (
                    <div className="price-item">
                      <span className="price-label">First:</span>
                      <span
                        className={`price-value ${getCategoryClass(flight.classes.first.category)}`}
                      >
                        {flight.classes.first.category}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlightOptions;
