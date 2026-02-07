from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/movies", methods=["GET"])
def get_movies():
    # Hardcoded example; replace with a MySQL query when ready
    movies = [
        {"movie_id": 1, "title": "Inception", "rating": 5},
        {"movie_id": 2, "title": "Interstellar", "rating": 4},
    ]
    return jsonify(movies)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
