import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';  // HomePage로 변경
import Dashboard from './pages/Dashboard';
import SafetyAlertsPage from './pages/Safety';  // SafetyAlertsPage로 변경

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/safety" element={<Safet