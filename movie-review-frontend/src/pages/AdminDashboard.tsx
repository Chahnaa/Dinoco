import React, { useEffect, useState } from 'react'
import { FaChartBar, FaFilm, FaUsers } from 'react-icons/fa'
import { getMovies, getStats, deleteMovie, editMovie, addMovie } from '../api/api'

type Stats = {
  total_movies: number
  total_users: number
  total_reviews: number
}

type Movie = {
  movie_id: number
  title: string
  description?: string
  poster_url?: string
}

const FilmIcon = FaFilm as unknown as React.ComponentType<{ className?: string }>
const UsersIcon = FaUsers as unknown as React.ComponentType<{ className?: string }>
const ChartIcon = FaChartBar as unknown as React.ComponentType<{ className?: string }>

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isAddingMovie, setIsAddingMovie] = useState(false)
  const [newMovieTitle, setNewMovieTitle] = useState('')
  const [newMovieDescription, setNewMovieDescription] = useState('')
  const [newMoviePoster, setNewMoviePoster] = useState('')

  const loadMovies = () => {
    getMovies()
      .then(res => setMovies(res.data))
      .catch(() => setMovies([]))
  }

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
    loadMovies()
  }, [])

  const handleDeleteMovie = async (movieId: number) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return
    try {
      await deleteMovie(movieId)
      loadMovies()
      getStats()
        .then(res => setStats(res.data))
        .catch(() => setStats(null))
    } catch (error) {
      alert('Failed to delete movie')
    }
  }

  const handleEditClick = (movie: Movie) => {
    setEditingId(movie.movie_id)
    setEditTitle(movie.title)
    setEditDescription(movie.description || '')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleEditSave = async (movieId: number) => {
    try {
      await editMovie(movieId, {
        title: editTitle,
        description: editDescription
      })
      loadMovies()
      handleEditCancel()
    } catch (error) {
      alert('Failed to update movie')
    }
  }

  const handleAddMovie = async () => {
    if (!newMovieTitle.trim()) {
      alert('Movie title is required')
      return
    }
    try {
      await addMovie({
        title: newMovieTitle,
        description: newMovieDescription,
        poster_url: newMoviePoster
      })
      loadMovies()
      getStats()
        .then(res => setStats(res.data))
        .catch(() => setStats(null))
      setIsAddingMovie(false)
      setNewMovieTitle('')
      setNewMovieDescription('')
      setNewMoviePoster('')
    } catch (error) {
      alert('Failed to add movie')
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-red-400">Admin Command</p>
        <h1 className="font-display text-3xl text-white">Dashboard Overview</h1>
        <p className="text-sm text-slate-400">Track performance, manage content, and keep the catalog sharp.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Movies', value: stats?.total_movies ?? '—', icon: <FilmIcon /> },
          { label: 'Total Users', value: stats?.total_users ?? '—', icon: <UsersIcon /> },
          { label: 'Total Reviews', value: stats?.total_reviews ?? '—', icon: <ChartIcon /> },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{card.label}</p>
                <h3 className="text-2xl font-semibold text-white">{card.value}</h3>
              </div>
              <div className="text-red-400">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Latest Movies</h3>
            <button 
              onClick={() => setIsAddingMovie(true)}
              className="rounded-xl border border-slate-700/60 px-3 py-2 text-xs text-slate-300 hover:border-red-400 hover:text-red-300 transition-colors"
            >
              Add Movie
            </button>
          </div>
          <div className="mt-4 space-y-3 text-xs text-slate-300">
            {isAddingMovie && (
              <div className="px-3 py-3 space-y-2 bg-slate-800/30 rounded-lg">
                <input
                  type="text"
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  className="w-full bg-slate-800/50 rounded px-2 py-1 text-white text-xs"
                  placeholder="Movie title"
                />
                <textarea
                  value={newMovieDescription}
                  onChange={(e) => setNewMovieDescription(e.target.value)}
                  className="w-full bg-slate-800/50 rounded px-2 py-1 text-white text-xs"
                  placeholder="Description"
                  rows={2}
                />
                <input
                  type="text"
                  value={newMoviePoster}
                  onChange={(e) => setNewMoviePoster(e.target.value)}
                  className="w-full bg-slate-800/50 rounded px-2 py-1 text-white text-xs"
                  placeholder="Poster URL (optional)"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setIsAddingMovie(false)
                      setNewMovieTitle('')
                      setNewMovieDescription('')
                      setNewMoviePoster('')
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMovie}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            {(movies.length ? movies.slice(0, 5) : []).map(movie => (
              <div key={movie.movie_id}>
                {editingId === movie.movie_id ? (
                  <div className="rounded-xl border border-slate-800/60 px-3 py-3 space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-slate-800/50 rounded px-2 py-1 text-white text-xs"
                      placeholder="Movie title"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-slate-800/50 rounded px-2 py-1 text-white text-xs"
                      placeholder="Description"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleEditCancel}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditSave(movie.movie_id)}
                        className="text-green-400 hover:text-green-300 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-3">
                    <span>{movie.title}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditClick(movie)}
                        className="text-red-300 hover:text-red-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteMovie(movie.movie_id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!movies.length && (
              <div className="px-3 py-3 text-slate-400">
                No movies available.
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white">Ratings Distribution</h3>
          <div className="mt-4 space-y-3 text-xs text-slate-300">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>{star}★</span>
                  <span>+{star * 3}%</span>
                </div>
                <div className="rating-bar">
                  <span style={{ width: `${star * 15}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
