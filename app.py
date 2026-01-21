from flask import Flask, send_from_directory
from api import api_blueprint

app = Flask(__name__, static_folder='public', static_url_path='')

app.register_blueprint(api_blueprint, url_prefix='/api')


@app.route('/')
def index():
    return send_from_directory('public', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('public', path)


if __name__ == '__main__':
    print("=" * 50)
    print("Server running on http://localhost:3000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=3000)