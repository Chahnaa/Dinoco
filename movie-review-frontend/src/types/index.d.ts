export interface Movie {
  movie_id: number
  title: string
  genre?: string
  language?: string
  release_year?: number
}

export interface Review {
  review_id: number
  user_id: number
  name?: string
  rating: number
  comment?: string
}
