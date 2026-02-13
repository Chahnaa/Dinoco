import React, { useEffect, useState } from 'react'
import { FaChartBar, FaFilm, FaUsers, FaStar, FaClock } from 'react-icons/fa'
import { getMovies, getStats, deleteMovie, editMovie, addMovie, getAdminAnalytics } from '../api/api'

type Stats = {
  total_movies: number
  total_users: number
  total_reviews: number
}

type Analytics = {
  overview: {
    total_movies: number
    total_users: number
    total_reviews: number
    active_reviewers_30d: number
    movies_without_reviews: number
  }
  top_reviewed_movies: Array<{
    movie_id: number
    title: string
    poster_url?: string
    review_count: number
    avg_rating: number
  }>
  top_rated_movies: Array<{
    movie_id: number
    title: string
    poster_url?: string
    review_count: number
    avg_rating: number
  }>
  recent_reviews: Array<{
    review_id: number
    rating: number
    comment?: string
    review_date: string
    user_name: string
    movie_title: string
  }>
  rating_distribution: Array<{
    rating: number
    count: number
  }>
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
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
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

  const loadAnalytics = () => {
    getAdminAnalytics()
      .then(res => setAnalytics(res.data))
      .catch(err => {
        console.error('Failed to load analytics:', err)
        setAnalytics(null)
      })
  }

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
    loadMovies()
    loadAnalytics()
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
          { label: 'Total Movies', value: analytics?.overview.total_movies ?? stats?.total_movies ?? '—', icon: '🎬', color: 'from-blue-500/20 to-blue-600/20' },
          { label: 'Total Users', value: analytics?.overview.total_users ?? stats?.total_users ?? '—', icon: '👥', color: 'from-purple-500/20 to-purple-600/20' },
          { label: 'Total Reviews', value: analytics?.overview.total_reviews ?? stats?.total_reviews ?? '—', icon: '⭐', color: 'from-yellow-500/20 to-yellow-600/20' },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{card.label}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{card.value}</h3>
              </div>
              <div className="text-4xl opacity-50">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active Reviewers (30 days)</p>
                <h3 className="text-3xl font-bold text-white mt-1">{analytics.overview.active_reviewers_30d}</h3>
              </div>
              <div className="text-4xl opacity-50">📊</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Movies Without Reviews</p>
                <h3 className="text-3xl font-bold text-white mt-1">{analytics.overview.movies_without_reviews}</h3>
              </div>
              <div className="text-4xl opacity-50">⚠️</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Reviewed Movies */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Top Reviewed Movies</h3>
          <div className="space-y-3">
            {analytics?.top_reviewed_movies.map((movie, idx) => (
              <div key={movie.movie_id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-slate-600">#{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{movie.title}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <span>{movie.review_count} reviews</span>
                    <span>•</span>
                    <span className="text-yellow-400">★ {Number(movie.avg_rating).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
            {!analytics?.top_reviewed_movies.length && (
              <div className="text-slate-400 text-sm text-center py-4">No reviews yet</div>
            )}
          </div>
        </div>

        {/* Top Rated Movies */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Highest Rated Movies (min 3 reviews)</h3>
          <div className="space-y-3">
            {analytics?.top_rated_movies.map((movie, idx) => (
              <div key={movie.movie_id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">#{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{movie.title}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <span className="text-yellow-400 font-bold">★ {Number(movie.avg_rating).toFixed(2)}</span>
                    <span>•</span>
                    <span>{movie.review_count} reviews</span>
                  </div>
                </div>
              </div>
            ))}
            {!analytics?.top_rated_movies.length && (
              <div className="text-slate-400 text-sm text-center py-4">Not enough reviews yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">{/* Movie Management Section */}
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
          <h3 className="text-sm font-semibold text-white">Rating Distribution</h3>
          <div className="mt-4 space-y-3 text-xs text-slate-300">
            {[5, 4, 3, 2, 1].map(star => {
              const distribution = analytics?.rating_distribution.find(d => d.rating === star)
              const count = distribution?.count || 0
              const total = analytics?.rating_distribution.reduce((sum, d) => sum + d.count, 0) || 1
              const percentage = Math.round((count / total) * 100)
              
              return (
                <div key={star} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{star}★</span>
                    <span className="text-slate-500">{count} ({percentage}%)</span>
                  </div>
                  <div className="rating-bar">
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Reviews Section */}
      {analytics?.recent_reviews && analytics.recent_reviews.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Reviews</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.recent_reviews.map((review) => (
              <div key={review.review_id} className="p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{review.user_name}</span>
                      <span className="text-xs text-slate-500">→</span>
                      <span className="text-sm text-slate-300 truncate">{review.movie_title}</span>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-slate-400 line-clamp-2">{review.comment}</p>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(review.review_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-yellow-400 font-bold">{review.rating}★</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
