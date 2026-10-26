from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Genetic Algorithm Equation Solver API",
    version="1.0.0",
    description="API giải phương trình toán học sử dụng Giải thuật Di truyền (GA)"
)

# Cấu hình CORS cho phép React frontend kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "GA Equation Solver API is running"}