from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

description_md = """
VidaPlena API - MVP

Este serviço implementa um subconjunto do ecossistema VidaPlena focado em `Pacientes` e `Agendamentos`. 
A documentação expõe rotas de CRUD, filtros clínicos,
validações de negócio e exemplos de payloads para avaliação técnica.

Use as rotas agrupadas por tags `Pacientes` e `Agendamentos`.
"""

from .database import engine, Base
from .api.endpoints.pacientes import router as pacientes_router
from .api.endpoints.agendamentos import router as agendamentos_router


app = FastAPI(
    title="VidaPlena API - Gestão de Saúde Familiar",
    description=description_md,
    version="0.1.0",
    contact={"name": "Luiz Felipe", "email": "luizfelipecrx@gmail.com"},
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Cria tabelas no SQLite (síncrono)
Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["Health"], summary="Health check", description="Rota para checar disponibilidade da API")
def health_check() -> JSONResponse:
    return JSONResponse(status_code=200, content={"status": "ok", "service": "VidaPlena API"})


# Registrar routers
app.include_router(pacientes_router)
app.include_router(agendamentos_router)
