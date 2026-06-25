from typing import List, Optional
from sqlalchemy import select, and_, between
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from datetime import datetime

from ..models import Agendamento, Paciente
from ..schemas.agendamento import AgendamentoCreate, AgendamentoUpdate


async def create_agendamento(db: AsyncSession, *, obj_in: AgendamentoCreate) -> Agendamento:
    # Verifica se paciente existe
    paciente = await db.get(Paciente, obj_in.paciente_id)
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado")

    ag = Agendamento(
        paciente_id=obj_in.paciente_id,
        data_hora=obj_in.data_hora,
        tipo_atendimento=obj_in.tipo_atendimento,
        profissional_responsavel=obj_in.profissional_responsavel,
        status=obj_in.status or "Agendado",
        observacoes=obj_in.observacoes,
    )
    db.add(ag)
    await db.commit()
    await db.refresh(ag)
    return ag


async def get_agendamento_by_id(db: AsyncSession, agendamento_id: int) -> Optional[Agendamento]:
    q = select(Agendamento).options(joinedload(Agendamento.paciente)).where(Agendamento.id == agendamento_id)
    result = await db.execute(q)
    return result.scalars().first()


async def get_agendamentos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    paciente_id: Optional[int] = None,
    status: Optional[str] = None,
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
) -> List[Agendamento]:
    q = select(Agendamento).options(joinedload(Agendamento.paciente))
    conditions = []
    if paciente_id is not None:
        conditions.append(Agendamento.paciente_id == paciente_id)
    if status is not None:
        conditions.append(Agendamento.status == status)
    if data_inicio is not None and data_fim is not None:
        conditions.append(Agendamento.data_hora.between(data_inicio, data_fim))
    elif data_inicio is not None:
        conditions.append(Agendamento.data_hora >= data_inicio)
    elif data_fim is not None:
        conditions.append(Agendamento.data_hora <= data_fim)

    if conditions:
        q = q.where(and_(*conditions))

    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


async def update_agendamento(db: AsyncSession, agendamento: Agendamento, obj_in: AgendamentoUpdate) -> Agendamento:
    data = obj_in.model_dump(exclude_unset=True)
    if "paciente_id" in data:
        paciente = await db.get(Paciente, data["paciente_id"])
        if not paciente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado")

    for key, value in data.items():
        setattr(agendamento, key, value)

    db.add(agendamento)
    await db.commit()
    await db.refresh(agendamento)
    return agendamento


async def delete_agendamento(db: AsyncSession, agendamento: Agendamento) -> None:
    await db.delete(agendamento)
    await db.commit()
