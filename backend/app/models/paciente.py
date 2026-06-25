from sqlalchemy import Column, Integer, String, Date, Text, DateTime, func
from sqlalchemy.orm import relationship
from ..database import Base


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    cpf = Column(String(11), nullable=False, unique=True, index=True)
    data_nascimento = Column(Date, nullable=False)
    telefone = Column(String(20), nullable=True)
    email = Column(String(120), nullable=True)
    sexo = Column(String(20), nullable=True)
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamento com Agendamento (back_populates definido no outro lado)
    agendamentos = relationship(
        "Agendamento",
        back_populates="paciente",
        cascade="all, delete-orphan",
        lazy="select",
    )
