from fastapi import FastAPI

app = FastAPI(title="PrakTIs API")

@app.get("/")
def read_root():
    return {"message": "Welcome to PrakTIs Backend API!"}