# 🚀 Deploy no Render (100% Gratuito)

## 📋 Pré-requisitos

- [x] Conta GitHub
- [x] Conta Render (gratuita)

## ⚡ Passos Rápidos

### 1️⃣ Criar repositório GitHub

```bash
cd c:\Users\NOTE\Desktop\VScode\Transportadora

# Inicializar Git
git init
git add .
git commit -m "Initial commit"

# Criar repositório em https://github.com/new
# Nome sugerido: transportadora-backend

# Copiar URL do repositório e executar:
git remote add origin https://github.com/SEU_USER/transportadora-backend.git
git branch -M main
git push -u origin main
```

### 2️⃣ Registrar no Render

1. Acesse: https://render.com
2. Clique em **Sign up**
3. Conecte com sua conta GitHub
4. Autorize o Render acessar seus repositórios

### 3️⃣ Criar novo Web Service

1. Dashboard Render → **New +**
2. Selecione **Web Service**
3. Busque seu repositório `transportadora-backend`
4. Clique em **Connect**

### 4️⃣ Configurar Serviço

**Campo** | **Valor**
--- | ---
Name | `transportadora-api`
Environment | `Python 3`
Build Command | `pip install -r requirements.txt`
Start Command | `gunicorn controle:app`
Plan | `Free` ✅

### 5️⃣ Deploy

- Clique em **Deploy**
- Render construirá e iniciará seu app
- Você receberá uma URL: `https://transportadora-api-xxxx.onrender.com`

⏳ **Pode levar 2-3 minutos**

---

## ✅ Após Deploy

Quando receber a URL, a estrutura será:
```
https://transportadora-api-xxxx.onrender.com/api/orcamentos
https://transportadora-api-xxxx.onrender.com/api/faturamento
... etc
```

## 🔗 Atualizar Netlify

Após ter a URL do Render, atualize em `netlify/index.html`:

```javascript
// Mude esta linha:
window.API_URL = "http://localhost:5000/api";

// Para esta:
window.API_URL = "https://transportadora-api-xxxx.onrender.com/api";
```

Depois faça upload da pasta `netlify/` para o Netlify.

---

## 🐛 Troubleshooting

**"Build failed"**
- Verifique se `requirements.txt` está na raiz
- Verifique se `controle.py` existe

**"502 Bad Gateway"**
- Espere 2-3 minutos após deploy
- Verifique logs no Render

**"Port already in use"**
- Render automático configura PORT
- Não hardcode a porta em `controle.py`

---

## 📝 Notas Importantes

- Render recarrega o app se ficar sem requisições por 15 minutos
- Banco de dados SQLite é perdido a cada restart
- **IMPORTANTE:** Considere usar PostgreSQL para produção (tem tier gratuito no Render)

