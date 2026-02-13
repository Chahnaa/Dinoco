import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import PrivateRoute from './components/PrivateRoute'
import Home from './pages/Home'
import MovieDetails from './pages/MovieDetails'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import BrowseMovies from './pages/BrowseMovies'
import Account from './pages/Account'
import Settings from './pages/Settings'

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-shell">
        <Header />
        <main className="px-5 py-8 pt-20 lg:px-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<BrowseMovies />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
