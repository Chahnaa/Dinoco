# Movie Review Backend

Minimal Flask backend with SQLAlchemy and MySQL (PyMySQL).

Setup

1. Create a virtual environment and activate it:

```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and edit `DATABASE_URL`.

4. Run the app locally:

```bash
python app.py
```

The app listens on port 5000 with endpoints:
- `GET /health` — health check
- `GET /reviews` — list reviews
- `POST /reviews` — create review (JSON: `movie_title`, `rating`, optional `reviewer_name`, `comment`)

The backend implemented here uses MySQL (mysql-connector). New endpoints (base path `/api`) include:
- `GET /` — home
- `POST /api/register` — register user (JSON: `name`,`email`,`password`)
- `POST /api/login` — login (JSON: `email`,`password`)
- `GET /api/movies` — list movies
- `POST /api/movies` — add movie (JSON: `title`,`genre`,`language`,`release_year`)
- `PUT /api/movies/<id>` — update movie
- `DELETE /api/movies/<id>` — delete movie
- `POST /api/reviews` — add review (JSON: `user_id`,`movie_id`,`rating`,`comment`)
- `GET /api/reviews/movie/<movie_id>` — get reviews for a movie

Create the DB and tables with `schema.sql` before running (or use your own DB):

```bash
mysql -u root -p < schema.sql
```

Docker (recommended)
1. Ensure Docker Desktop is installed and running.
2. From the backend folder run:

```bash
docker-compose up --build
```

This starts a MySQL container (initialized with `schema.sql`) and the backend on port `5002`.

Access:
- Backend health: `http://127.0.0.1:5002/`
- Movies endpoint: `http://127.0.0.1:5002/api/movies`

To stop:

```bash
docker-compose down
```

