from pydantic import BaseModel, Field, field_validator
from pydantic_core import PydanticCustomError
from datetime import datetime
from typing import Optional
from .paciente import PacienteOut


class AgendamentoBase(BaseModel):
    paciente_id: int
    data_hora: datetime
    tipo_atendimento: str = Field(..., max_length=80)
    profissional_responsavel: Optional[str] = Field(None, max_length=120)
    status: Optional[str] = Field("Agendado", max_length=20)
    observacoes: Optional[str] = None


class AgendamentoCreate(AgendamentoBase):
    @field_validator("data_hora")
    def date_not_in_past(cls, v: datetime) -> datetime:
        now = datetime.now(v.tzinfo) if v.tzinfo else datetime.now()
        if v < now:
            raise PydanticCustomError(
                "data_hora_passada",
                "data_hora não pode ser uma data passada",
            )
        return v


class AgendamentoUpdate(BaseModel):
    paciente_id: Optional[int] = None
    data_hora: Optional[datetime] = None
    tipo_atendimento: Optional[str] = Field(None, max_length=80)
    profissional_responsavel: Optional[str] = Field(None, max_length=120)
    status: Optional[str] = Field(None, max_length=20)
    observacoes: Optional[str] = None

    @field_validator("data_hora")
    def date_not_in_past(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return v
        now = datetime.now(v.tzinfo) if v.tzinfo else datetime.now()
        if v < now:
            raise PydanticCustomError(
                "data_hora_passada",
                "data_hora não pode ser uma data passada",
            )
        return v


class PacienteResumido(BaseModel):
    id: int
    nome: str

    model_config = {"from_attributes": True}


class AgendamentoResponse(AgendamentoBase):
    id: int
    paciente: PacienteResumido

    model_config = {"from_attributes": True}
