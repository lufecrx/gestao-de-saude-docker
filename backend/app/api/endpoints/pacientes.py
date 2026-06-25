from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ... import models, schemas
from ...database import get_db

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@router.get("/", response_model=List[schemas.PacienteOut], summary="Listar pacientes", description="Retorna a lista de pacientes cadastrados. Suporta paginação no frontend e filtros simples implementados posteriormente.")
def list_pacientes(db: Session = Depends(get_db)):
    pacientes = db.query(models.Paciente).all()
    return pacientes


@router.get("/{paciente_id}", response_model=schemas.PacienteOut, summary="Obter paciente", description="Retorna os detalhes completos de um paciente pelo seu ID.")
def get_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado")
    return paciente


@router.post("/", response_model=schemas.PacienteOut, status_code=status.HTTP_201_CREATED, summary="Criar paciente", description="Cria um novo paciente. O CPF será validado e deve ser único.")
def create_paciente(paciente_in: schemas.PacienteCreate, db: Session = Depends(get_db)):
    # Verifica CPF único
    existing = db.query(models.Paciente).filter(models.Paciente.cpf == paciente_in.cpf).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado")

    paciente = models.Paciente(**paciente_in.model_dump())
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.put("/{paciente_id}", response_model=schemas.PacienteOut, summary="Atualizar paciente", description="Atualiza dados de um paciente existente. Campos não fornecidos permanecem inalterados.")
def update_paciente(paciente_id: int, paciente_in: schemas.PacienteUpdate, db: Session = Depends(get_db)):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado")

    data = paciente_in.model_dump(exclude_unset=True)
    if "cpf" in data and data["cpf"] != paciente.cpf:
        # checar duplicidade de CPF
        exists = db.query(models.Paciente).filter(models.Paciente.cpf == data["cpf"]).first()
        if exists and exists.id != paciente.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado")

    for key, value in data.items():
        setattr(paciente, key, value)

    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.delete("/{paciente_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remover paciente", description="Remove um paciente. Operação é irreversível no banco do MVP.")
def delete_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado")

    db.delete(paciente)
    db.commit()
    return None
