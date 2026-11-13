#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando Setup do SICOM TCC ===${NC}\n"

# 1. Verificar se o Docker está rodando
echo -e "${YELLOW}[1/6] Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Erro: O Docker não está rodando. Inicie o Docker e tente novamente.${NC}"
    exit 1
fi
echo "Docker OK."

# 2. Subir o banco de dados
echo -e "\n${YELLOW}[2/6] Subindo o banco de dados...${NC}"
docker compose up -d
echo "Aguardando o banco ficar saudável..."
sleep 5 # Dá um tempo para o Postgres iniciar
if ! docker compose ps | grep -q "healthy"; then
    echo "Aguardando mais um pouco..."
    sleep 5
fi
echo "Banco de dados OK."

# 3. Instalar dependências
echo -e "\n${YELLOW}[3/6] Instalando dependências...${NC}"
npm install

# 4. Configurar variáveis de ambiente (se não existir)
echo -e "\n${YELLOW}[4/6] Verificando .env...${NC}"
if [ ! -f .env ]; then
    echo "Criando .env a partir do .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}ATENÇÃO: Edite o arquivo .env com suas credenciais SMTP antes de continuar.${NC}"
else
    echo ".env já existe."
fi

# 5. Rodar Prisma (migrations + generate + seed)
echo -e "\n${YELLOW}[5/6] Configurando o Prisma...${NC}"
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# 6. Concluído
echo -e "\n${GREEN}=== Setup concluído com sucesso! ===${NC}"
echo -e "Para iniciar o servidor, rode: ${GREEN}npm run dev${NC}"