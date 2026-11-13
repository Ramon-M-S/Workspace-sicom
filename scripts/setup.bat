@echo off
echo === Iniciando Setup do SICOM TCC ===

echo [1/6] Verificando Docker...
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Docker nao esta rodando.
    exit /b 1
)

echo [2/6] Subindo banco de dados...
docker compose up -d
timeout /t 10 /nobreak > nul

echo [3/6] Instalando dependencias...
call npm install

echo [4/6] Verificando .env...
if not exist .env (
    copy .env.example .env
    echo ATENCAO: Edite o .env com suas credenciais.
)

echo [5/6] Configurando Prisma...
call npx prisma generate
call npx prisma migrate deploy
call npx prisma db seed

echo === Setup concluido! ===
echo Para iniciar: npm run dev
pause