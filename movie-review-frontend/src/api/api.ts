import axios from "axios";

const API_URL = "http://127.0.0.1:5002/api";

// Create axios instance with auth headers
const apiClient = axios.create({
  baseURL: API_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getMovies = () => apiClient.get(`/movies`);
export const getMovieDetails = (id: number) => apiClient.get(`/movies/${id}`);
export const addMovie = (movie: any) => apiClient.post(`/movies`, movie);
export const editMovie = (id: number, movie: any) => apiClient.put(`/movies/${id}`, movie);
export const deleteMovie = (id: number) => apiClient.delete(`/movies/${id}`);

export const registerUser = (user: any) => apiClient.post(`/register`, user);
export const loginUser = (user: any) => apiClient.post(`/login`, user);
export const verifyLoginOtp = (payload: { email: string; code: string }) =>
  apiClient.post(`/login/verify-otp`, payload);

export const getReviews = (movie_id: number) => apiClient.get(`/reviews/movie/${movie_id}`);
export const getMovieReviewStats = (movie_id: number) => apiClient.get(`/reviews/movie/${movie_id}/stats`);
export const getUserReviewForMovie = (movie_id: number, user_id: number) => apiClient.get(`/reviews/movie/${movie_id}/user/${user_id}`);
export const getUserReviews = () => apiClient.get(`/reviews/user`);
export const addReview = (review: any) => apiClient.post(`/reviews`, review);

export const getStats = () => apiClient.get(`/stats`);
export const getAdminAnalytics = () => apiClient.get(`/admin/analytics`);
export const getRecommendations = () => apiClient.get(`/recommendations`);

export default axios;
