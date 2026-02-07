import React, { useEffect, useState } from 'react'
import axios from 'axios'

type Movie = {
  movie_id: number
  title: string
  genre?: string
  language?: string
  release_year?: number
}

export default function MoviesList() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    axios
      .get<Movie[]>('http://127.0.0.1:5002/api/movies')
      .then((res) => {
        if (mounted) setMovies(res.data)
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load movies')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <div>Loading movies…</div>
  if (error) return <div style={{ color: 'crimson' }}>Error: {error}</div>
  if (movies.length === 0) return <div>No movies yet.</div>

  return (
    <div>
      <h2>Movies</h2>
      <ul>
        {movies.map((m) => (
          <li key={m.movie_id}>
            <strong>{m.title}</strong> — {m.genre} ({m.release_year})
          </li>
        ))}
      </ul>
    </div>
  )
}
