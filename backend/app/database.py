import os
from typing import Generator, AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:////data/vidaplena.db"
)

ASYNC_DATABASE_URL = os.getenv(
    "ASYNC_DATABASE_URL",
    "sqlite+aiosqlite:////data/vidaplena.db"
)


# Engine e sessão síncrona (usada para create_all)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """Dependency síncrona que fornece sessão do SQLAlchemy."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Engine e sessionmaker assíncronos para endpoints que usam AsyncSession
async_engine = create_async_engine(ASYNC_DATABASE_URL, connect_args={"check_same_thread": False})
AsyncSessionLocal = async_sessionmaker(bind=async_engine, expire_on_commit=False, class_=AsyncSession)


async def get_async_db() -> AsyncGenerator:
    """Dependency assíncrona que fornece `AsyncSession` e garante fechamento."""
    async with AsyncSessionLocal() as session:
        yield session

