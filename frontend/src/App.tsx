import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Travel from './components/Travel';
import Events from './components/Events';
import Attire from './components/Attire';
import Registry from './components/Registry';
import FAQ from './components/FAQ';
import RSVP from './components/RSVP';
import './App.css';

// Home page component that displays all sections
function Home() {
  return (
    <>
      <Hero />
      <Travel />
      <Events />
      <Attire />
      <Registry />
      <FAQ />
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rsvp" element={<RSVP />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/events" element={<Events />} />
          <Route path="/attire" element={<Attire />} />
          <Route path="/registry" element={<Registry />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
