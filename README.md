# 🚚 Sistema de Controle Financeiro - Transportadora

Sistema completo de gestão financeira para empresas de transporte, com controle de orçamentos, faturamento, gastos e investimentos.

## 📋 Funcionalidades

### Dashboard Financeiro
- Visão geral de todos os dados financeiros
- Totalizadores de orçamentos, faturamento e gastos
- Cálculo automático de lucro líquido

### Módulos do Sistema

1. **Orçamentos Enviados**
   - Registro de orçamentos com valor bruto
   - Controle de status (Pendente/Aprovado/Rejeitado)
   - Histórico de propostas enviadas

2. **Faturamento Real**
   - Registro de receitas efetivas
   - Controle de notas fiscais
   - Acompanhamento por cliente

3. **Gastos Mensais**
   - Categorização de despesas recorrentes
   - Combustível, manutenção, salários, etc.
   - Acompanhamento mês a mês

4. **Gastos Anuais**
   - IPVA, licenciamento, seguros
   - Taxas e tributos anuais
   - Planejamento de longo prazo

5. **Gastos Eventuais**
   - Reembolsos
   - Danos e perdas
   - Multas e acidentes
   - Despesas imprevistas

6. **Impostos e Notas Fiscais**
   - ISS, ICMS, PIS, COFINS, IRPJ, CSLL
   - Controle de vencimentos
   - Status de pagamento

7. **Lucros**
   - Registro de lucros por período
   - Análise de rentabilidade

8. **Investimentos**
   - Veículos, equipamentos, tecnologia
   - Retorno esperado
   - Planejamento de crescimento

## 🚀 Como Executar

### Pré-requisitos
- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Instalação

1. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

2. **Execute o servidor:**
```bash
python controle.py
```

3. **Acesse o sistema:**
Abra seu navegador e acesse: `http://localhost:5000`

## 💾 Banco de Dados

O sistema utiliza SQLite, criando automaticamente o arquivo `transportadora.db` na primeira execução.

## 🎨 Tecnologias Utilizadas

### Backend
- **Flask**: Framework web Python
- **SQLite**: Banco de dados
- **Flask-CORS**: Suporte para requisições cross-origin

### Frontend
- **HTML5**: Estrutura
- **CSS3**: Estilização com design moderno e responsivo
- **JavaScript (Vanilla)**: Interatividade e comunicação com API

## 📊 API Endpoints

### Orçamentos
- `GET /api/orcamentos` - Listar todos
- `POST /api/orcamentos` - Criar novo
- `DELETE /api/orcamentos/<id>` - Excluir

### Faturamento
- `GET /api/faturamento` - Listar todos
- `POST /api/faturamento` - Criar novo
- `DELETE /api/faturamento/<id>` - Excluir

### Gastos Mensais
- `GET /api/gastos-mensais` - Listar todos
- `POST /api/gastos-mensais` - Criar novo
- `DELETE /api/gastos-mensais/<id>` - Excluir

### Gastos Anuais
- `GET /api/gastos-anuais` - Listar todos
- `POST /api/gastos-anuais` - Criar novo
- `DELETE /api/gastos-anuais/<id>` - Excluir

### Gastos Eventuais
- `GET /api/gastos-eventuais` - Listar todos
- `POST /api/gastos-eventuais` - Criar novo
- `DELETE /api/gastos-eventuais/<id>` - Excluir

### Impostos
- `GET /api/impostos` - Listar todos
- `POST /api/impostos` - Criar novo
- `PUT /api/impostos/<id>` - Atualizar status
- `DELETE /api/impostos/<id>` - Excluir

### Lucros
- `GET /api/lucros` - Listar todos
- `POST /api/lucros` - Criar novo
- `DELETE /api/lucros/<id>` - Excluir

### Investimentos
- `GET /api/investimentos` - Listar todos
- `POST /api/investimentos` - Criar novo
- `DELETE /api/investimentos/<id>` - Excluir

### Dashboard
- `GET /api/dashboard` - Retorna dados consolidados

## 📱 Responsividade

O sistema é totalmente responsivo e se adapta a diferentes tamanhos de tela (desktop, tablet e mobile).

## 🔒 Segurança

- Validação de dados no frontend e backend
- Proteção contra SQL injection
- Confirmação antes de exclusões

## 🎯 Próximas Melhorias

- [ ] Sistema de autenticação de usuários
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Gráficos e dashboards interativos
- [ ] Backup automático do banco de dados
- [ ] Notificações de vencimento de impostos
- [ ] Integração com sistemas contábeis

## 📝 Licença

Projeto desenvolvido para fins educacionais.

## 👨‍💻 Suporte

Para dúvidas ou problemas, verifique se todas as dependências estão instaladas corretamente e se a porta 5000 está disponível.
