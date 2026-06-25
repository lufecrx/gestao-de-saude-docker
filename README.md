# Seleção FESF-SUS – 2 F.C

## VidaPlena — (FESF-SUS)

Este repositório contém toda a infraestrutura de conteinerização necessária para executar o sistema VidaPlena completo de forma isolada, reproduzível e pronta para produção.

---

## Arquitetura Docker

Todo o ecossistema VidaPlena é executado por meio de containers Docker orquestrados pelo **Docker Compose**. A arquitetura é composta por:

| Serviço | Tecnologia | Porta | Descrição |
|---------|-----------|-------|-----------|
| **Backend** | Python 3.12 + FastAPI | `8000` | API REST com CRUD de Pacientes e Agendamentos |
| **Frontend** | Next.js 14 (React + Tailwind CSS) | `3000` | Interface web |
| **Banco de Dados** | SQLite | — | Armazenamento local persistido em volume Docker |

Os containers comunicam-se por uma **rede bridge isolada** (`vidaplena-network`), garantindo que o frontend acesse o backend internamente sem expor portas adicionais.

---

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado no seu sistema:

- **Docker Engine**
- **Docker Compose**

Verifique a instalação com os comandos:

```bash
docker --version
docker compose version
```

---

## Comandos de Inicialização e Parada

### Subir o ambiente completo

Execute o comando abaixo na raiz do repositório para construir as imagens e iniciar todos os serviços:

```bash
docker compose up --build -d
```

### Derrubar o ambiente completo

Para parar e remover todos os containers, redes e volumes criados:

```bash
docker compose down
```

---

## URLs dos Serviços

Após executar `docker compose up --build -d`, os serviços estarão disponíveis nos seguintes endereços:

| Recurso | URL | Descrição |
|---------|-----|-----------|
| **Frontend (VidaPlena)** | [http://localhost:3000](http://localhost:3000) | Interface com dashboard, cadastro de pacientes e gestão de agendamentos |
| **API Backend** | [http://localhost:8000](http://localhost:8000) | Endpoint base da API FastAPI |
| **Documentação Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) | Documentação gerada automaticamente pelo FastAPI |

---

Desenvolvido para o Processo de Seleção FESF-SUS.
