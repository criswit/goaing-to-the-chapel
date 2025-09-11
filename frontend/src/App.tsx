import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Travel from './components/Travel';
import Stay from './components/Stay';
import Events from './components/Events';
import Attire from './components/Attire';
import Registry from './components/Registry';
import FAQ from './components/FAQ';
import RSVP from './components/RSVP';
import FloatingTraditionsButton from './components/FloatingTraditionsButton';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import StatsOverview from './components/Admin/StatsOverview';
import GuestList from './components/Admin/GuestList';
import './App.css';

// Home page component that displays only the Hero section
function Home() {
  return (
    <>
      <Hero />
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <>
                <Navigation />
                <Home />
                <FloatingTraditionsButton />
              </>
            }
          />
          <Route
            path="/rsvp"
            element={
              <>
                <Navigation />
                <RSVP />
                <FloatingTraditionsButton />
              </>
            }
          />
          <Route
            path="/travel"
            element={
              <>
                <Navigation />
                <Travel />
                <FloatingTraditionsButton />
              </>
            }
          />
          <Route
            path="/stay"
            element={
              <>
                <Navigation />
                <Stay />
                <FloatingTraditionsButton />
              </>
            }
          />
          <Route
            path="/events"
            element={
              <>
                <Navigation />
                <Events />
                <FloatingTraditionsButton />
              </>
            }
          />
          <Route
            path="/attire"
            element={
              <>
                <Navigation />
                <Attire />
                <FloatingTraditionsButton />
              </>
            }
          />
          <Route
            path="/registry"
            element={
              <>
                <Navigation />
                <Registry />
                <FloatingTraditionsButton />
              </>
            }
          />
          <Route
            path="/faq"
            element={
              <>
                <Navigation />
                <FAQ />
                <FloatingTraditionsButton />
              </>
            }
          />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<StatsOverview />} />
            <Route path="guests" element={<GuestList />} />
            <Route path="bulk" element={<div>Bulk Operations - Coming Soon</div>} />
            <Route path="export" element={<div>Export Data - Coming Soon</div>} />
            <Route path="settings" element={<div>Settings - Coming Soon</div>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
