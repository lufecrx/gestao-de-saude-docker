from pydantic import BaseModel, Field, EmailStr, field_validator
from pydantic_core import PydanticCustomError
from datetime import date
import re


def _clean_cpf(cpf: str) -> str:
    return re.sub(r"\D", "", cpf or "")


def _validate_cpf_checksum(cpf: str) -> bool:
    cpf = _clean_cpf(cpf)
    if len(cpf) != 11:
        return False
    if cpf == cpf[0] * 11:
        return False

    def _calc_digit(cpf_slice: str) -> int:
        peso = len(cpf_slice) + 1
        total = 0
        for ch in cpf_slice:
            total += int(ch) * peso
            peso -= 1
        resto = (total * 10) % 11
        return resto if resto < 10 else 0

    d1 = _calc_digit(cpf[:9])
    d2 = _calc_digit(cpf[:9] + str(d1))
    return int(cpf[9]) == d1 and int(cpf[10]) == d2


class PacienteBase(BaseModel):
    nome: str = Field(..., max_length=120)
    cpf: str = Field(..., description="CPF com ou sem formatação (11 dígitos)")
    data_nascimento: date
    telefone: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    sexo: str | None = Field(None, max_length=20)
    observacoes: str | None = None

    @field_validator("cpf")
    def cpf_must_be_valid(cls, v: str) -> str:
        v_clean = _clean_cpf(v)
        if not _validate_cpf_checksum(v_clean):
            raise PydanticCustomError("cpf_invalido", "CPF inválido")
        return v_clean


class PacienteCreate(PacienteBase):
    pass


class PacienteUpdate(BaseModel):
    nome: str | None = Field(None, max_length=120)
    cpf: str | None = Field(None, description="CPF com ou sem formatação (11 dígitos)")
    data_nascimento: date | None = None
    telefone: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    sexo: str | None = Field(None, max_length=20)
    observacoes: str | None = None

    @field_validator("cpf")
    def cpf_must_be_valid(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v_clean = _clean_cpf(v)
        if not _validate_cpf_checksum(v_clean):
            raise PydanticCustomError("cpf_invalido", "CPF inválido")
        return v_clean


class PacienteOut(PacienteBase):
    id: int

    model_config = {"from_attributes": True}
