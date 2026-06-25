from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Agendamento(Base):
    __tablename__ = "agendamentos"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True)
    data_hora = Column(DateTime, nullable=False, index=True)
    tipo_atendimento = Column(String(80), nullable=False)
    profissional_responsavel = Column(String(120), nullable=True)
    status = Column(String(20), nullable=False, default="Agendado")
    observacoes = Column(Text, nullable=True)

    # Relacionamento bidirecional com Paciente
    paciente = relationship("Paciente", back_populates="agendamentos", lazy="joined")
