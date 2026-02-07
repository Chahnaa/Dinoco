import React, { useEffect, useState } from 'react'
import { FaChartBar, FaFilm, FaUsers } from 'react-icons/fa'
import { getMovies, getStats } from '../api/api'

type Stats = {
  total_movies: number
  total_users: number
  total_reviews: number
}

type Movie = {
  movie_id: number
  title: string
}

const FilmIcon = FaFilm as unknown as React.ComponentType<{ className?: string }>
const UsersIcon = FaUsers as unknown as React.ComponentType<{ className?: string }>
const ChartIcon = FaChartBar as unknown as React.ComponentType<{ className?: string }>

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
    getMovies()
      .then(res => setMovies(res.data))
      .catch(() => setMovies([]))
  }, [])

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
            <button className="rounded-xl border border-slate-700/60 px-3 py-2 text-xs text-slate-300">
              Add Movie
            </button>
          </div>
          <div className="mt-4 space-y-3 text-xs text-slate-300">
            {(movies.length ? movies.slice(0, 5) : []).map(movie => (
              <div key={movie.movie_id} className="flex items-center justify-between rounded-xl border border-slate-800/60 px-3 py-3">
                <span>{movie.title}</span>
                <div className="flex gap-2">
                  <button className="text-red-300">Edit</button>
                  <button className="text-slate-500">Delete</button>
                </div>
              </div>
            ))}
            {!movies.length && (
              <div className="rounded-xl border border-slate-800/60 px-3 py-3 text-slate-400">
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
