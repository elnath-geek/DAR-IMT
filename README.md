# DAR-IMT

The repository for my system DAR-IMT.

# Getting Started

### Web

Requirement: Node v18.14.2

```
cd web
npm ci
echo "REACT_APP_BASEURL='http://localhost:8080'" > .env
npm run build
npm start
```

### Server

```
cd server/src
pip install pipenv
python -m pipenv install
python -m pipenv run python app.py
```
