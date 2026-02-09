#!/bin/bash

echo "🧪 Testando Backend Local do Politika"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica se .env.local existe
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local não encontrado${NC}"
    echo ""
    echo "Crie o arquivo .env.local com sua chave:"
    echo ""
    echo "GEMINI_API_KEY=sua-chave-aqui"
    echo ""
    exit 1
fi

# Verifica se a chave está configurada
source .env.local
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ GEMINI_API_KEY não configurada no .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.local encontrado${NC}"
echo -e "${GREEN}✅ GEMINI_API_KEY configurada${NC}"
echo ""

# Verifica se node_modules existe
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    npm install
    echo ""
fi

# Inicia o servidor dev em background
echo -e "${YELLOW}🚀 Iniciando servidor dev...${NC}"
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

# Aguarda o servidor iniciar
echo "⏳ Aguardando servidor iniciar (porta 3000)..."
sleep 5

# Testa se o servidor está rodando
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Servidor não iniciou na porta 3000${NC}"
    kill $DEV_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Servidor rodando em http://localhost:3000${NC}"
echo ""

# Teste 1: Political Insight
echo "📊 Teste 1: Análise Política"
echo "----------------------------"

RESPONSE=$(curl -s -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "action": "politicalInsight",
    "data": {
      "handle": "teste"
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Análise política funcionando${NC}"
else
    echo -e "${RED}❌ Erro na análise política${NC}"
    echo "Resposta: $RESPONSE"
fi
echo ""

# Teste 2: Comparative Insight
echo "🔄 Teste 2: Análise Comparativa"
echo "--------------------------------"

RESPONSE=$(curl -s -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "action": "comparativeInsight",
    "data": {
      "handles": ["candidato1", "candidato2"]
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Análise comparativa funcionando${NC}"
else
    echo -e "${RED}❌ Erro na análise comparativa${NC}"
    echo "Resposta: $RESPONSE"
fi
echo ""

# Teste 3: Crisis Response (sem mídia)
echo "⚠️  Teste 3: Análise de Crise"
echo "----------------------------"

RESPONSE=$(curl -s -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "action": "crisisResponse",
    "data": {
      "incident": "Candidato envolvido em polêmica nas redes sociais"
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Análise de crise funcionando${NC}"
else
    echo -e "${RED}❌ Erro na análise de crise${NC}"
    echo "Resposta: $RESPONSE"
fi
echo ""

# Teste 4: Evaluate Response
echo "📝 Teste 4: Avaliação de Resposta"
echo "----------------------------------"

RESPONSE=$(curl -s -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "action": "evaluateResponse",
    "data": {
      "incident": "Escândalo político",
      "proposedResponse": "Vamos investigar e tomar as medidas cabíveis"
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Avaliação de resposta funcionando${NC}"
else
    echo -e "${RED}❌ Erro na avaliação de resposta${NC}"
    echo "Resposta: $RESPONSE"
fi
echo ""

# Teste 5: CORS
echo "🌐 Teste 5: CORS Headers"
echo "------------------------"

CORS_HEADERS=$(curl -s -I -X OPTIONS http://localhost:3000/api/gemini)

if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ CORS configurado corretamente${NC}"
else
    echo -e "${YELLOW}⚠️  CORS pode ter problemas${NC}"
fi
echo ""

# Resumo
echo "======================================"
echo "🎉 Testes Concluídos!"
echo ""
echo "Próximos passos:"
echo "1. Abra http://localhost:3000 no navegador"
echo "2. Teste manualmente as funcionalidades"
echo "3. Verifique o DevTools → Network → api/gemini"
echo "4. Se tudo estiver OK, faça o deploy!"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar o servidor${NC}"
echo ""

# Mantém o servidor rodando
wait $DEV_PID
