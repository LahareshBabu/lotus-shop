from fastapi import FastAPI

# 1. Initialize the Walkie-Talkie
app = FastAPI()

# 2. Open the basic communication channel
@app.get("/")
def read_root():
    return {
        "status": "Online",
        "message": "Lotus Machine Learning Engine is ready."
    }