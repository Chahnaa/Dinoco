import axios from "axios";

const API_URL = "http://127.0.0.1:5002/api";

export const getMovies = () => axios.get(`${API_URL}/movies`);
export const getMovieDetails = (id: number) => axios.get(`${API_URL}/movies/${id}`);
export const addMovie = (movie: any) => axios.post(`${API_URL}/movies`, movie);
export const editMovie = (id: number, movie: any) => axios.put(`${API_URL}/movies/${id}`, movie);
export const deleteMovie = (id: number) => axios.delete(`${API_URL}/movies/${id}`);

export const registerUser = (user: any) => axios.post(`${API_URL}/register`, user);
export const loginUser = (user: any) => axios.post(`${API_URL}/login`, user);
export const verifyLoginOtp = (payload: { email: string; code: string }) =>
	axios.post(`${API_URL}/login/verify-otp`, payload);

export const getReviews = (movie_id: number) => axios.get(`${API_URL}/reviews/movie/${movie_id}`);
export const addReview = (review: any) => axios.post(`${API_URL}/reviews`, review);

export const getStats = () => axios.get(`${API_URL}/stats`);

export default axios;
