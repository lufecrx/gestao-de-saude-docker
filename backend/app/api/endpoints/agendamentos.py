from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from ...schemas import (
    AgendamentoCreate,
    AgendamentoUpdate,
    AgendamentoResponse,
)
from ...database import get_async_db
from ...crud.crud_agendamento import (
    create_agendamento,
    get_agendamento_by_id,
    get_agendamentos,
    update_agendamento,
    delete_agendamento,
)

router = APIRouter(prefix="/agendamentos", tags=["Agendamentos"])


@router.post("/", response_model=AgendamentoResponse, status_code=status.HTTP_201_CREATED, summary="Criar agendamento", description="Cria um novo agendamento associado a um paciente existente.")
async def api_create_agendamento(obj_in: AgendamentoCreate, db: AsyncSession = Depends(get_async_db)):
    return await create_agendamento(db=db, obj_in=obj_in)


@router.get("/", response_model=List[AgendamentoResponse], summary="Listar agendamentos", description="Lista agendamentos com filtros por paciente, status e intervalo de datas. Use paginação via skip/limit.")
async def api_get_agendamentos(
    skip: int = 0,
    limit: int = 100,
    paciente_id: Optional[int] = None,
    status: Optional[str] = None,
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    db: AsyncSession = Depends(get_async_db),
):
    return await get_agendamentos(db=db, skip=skip, limit=limit, paciente_id=paciente_id, status=status, data_inicio=data_inicio, data_fim=data_fim)


@router.get("/{agendamento_id}", response_model=AgendamentoResponse, summary="Obter agendamento", description="Retorna os detalhes de um agendamento incluindo dados resumidos do paciente.")
async def api_get_agendamento(agendamento_id: int, db: AsyncSession = Depends(get_async_db)):
    ag = await get_agendamento_by_id(db=db, agendamento_id=agendamento_id)
    if not ag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado")
    return ag


@router.put("/{agendamento_id}", response_model=AgendamentoResponse, summary="Atualizar agendamento", description="Atualiza um agendamento existente.")
async def api_update_agendamento(agendamento_id: int, obj_in: AgendamentoUpdate, db: AsyncSession = Depends(get_async_db)):
    ag = await get_agendamento_by_id(db=db, agendamento_id=agendamento_id)
    if not ag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado")
    return await update_agendamento(db=db, agendamento=ag, obj_in=obj_in)


@router.delete("/{agendamento_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remover agendamento", description="Remove um agendamento existente.")
async def api_delete_agendamento(agendamento_id: int, db: AsyncSession = Depends(get_async_db)):
    ag = await get_agendamento_by_id(db=db, agendamento_id=agendamento_id)
    if not ag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado")
    await delete_agendamento(db=db, agendamento=ag)
    return None
