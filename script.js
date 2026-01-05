// API Base URL
// Usar window.CONFIG.API_URL se disponível (config.js), caso contrário usar localhost
const API_URL = window.CONFIG?.API_URL || 'http://localhost:5000/api';
let resumoChart = null;
let cacheOrcamentos = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    popularFiltrosData();
    carregarDashboard();
    carregarTodosDados();
    configurarEventos();
});

// Configurar eventos dos formulários
function configurarEventos() {
    // Orçamentos
    document.getElementById('form-orcamento')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarOrcamento();
    });

    // Faturamento
    document.getElementById('form-faturamento')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarFaturamento();
    });

    // Gastos Mensais
    document.getElementById('form-gastos-mensais')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarGastosMensais();
    });

    // Gastos Anuais
    document.getElementById('form-gastos-anuais')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarGastosAnuais();
    });

    // Gastos Eventuais
    document.getElementById('form-gastos-eventuais')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarGastosEventuais();
    });

    // Impostos
    document.getElementById('form-impostos')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarImpostos();
    });

    // Lucros
    document.getElementById('form-lucros')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarLucros();
    });

    // Investimentos
    document.getElementById('form-investimentos')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarInvestimentos();
    });

    // Filtros de Orçamentos
    document.getElementById('filtro-orc-texto')?.addEventListener('input', aplicarFiltroOrcamentos);
    document.getElementById('filtro-orc-status')?.addEventListener('change', aplicarFiltroOrcamentos);
}

// ==================== ORÇAMENTOS ====================
async function adicionarOrcamento() {
    console.log("=== INÍCIO adicionarOrcamento ===");
    
    const dados = {
        descricao: document.getElementById('orc-descricao').value,
        valor_bruto: parseFloat(document.getElementById('orc-valor').value),
        cliente: document.getElementById('orc-cliente').value,
        data_envio: document.getElementById('orc-data').value,
        status: document.getElementById('orc-status').value
    };

    try {
        console.log("Enviando dados:", dados);
        
        const response = await fetch(`${API_URL}/orcamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Response:", response);
        console.log("Status da resposta:", response.status);

        if (response.ok) {
            document.getElementById('form-orcamento').reset();
            carregarOrcamentos();
            carregarDashboard();
            alert('Orçamento adicionado com sucesso!');
        } else {
            const errorText = await response.text();
            console.error("Erro na resposta:", response.status, errorText);
            alert("Erro: " + errorText);
        }
    } catch (error) {
        console.error("Erro ao adicionar orçamento:", error);
        alert("Erro: " + error.message);
    }
}

async function carregarOrcamentos() {
    try {
        const response = await fetch(`${API_URL}/orcamentos`);
        const dados = await response.json();
        
        // Cachear os dados para filtragem
        cacheOrcamentos = dados;
        aplicarFiltroOrcamentos();
        
    } catch (error) {
        console.error("Erro ao carregar orçamentos:", error);
    }
}

function aplicarFiltroOrcamentos() {
    const textoFiltro = document.getElementById('filtro-orc-texto')?.value.toLowerCase() || '';
    const statusFiltro = document.getElementById('filtro-orc-status')?.value || '';

    const listaDados = cacheOrcamentos.filter(orc => {
        // Filtrar por texto (descrição ou cliente)
        const temTexto = !textoFiltro || 
            orc.descricao.toLowerCase().includes(textoFiltro) || 
            orc.cliente.toLowerCase().includes(textoFiltro);

        // Filtrar por status
        const temStatus = !statusFiltro || orc.status === statusFiltro;

        return temTexto && temStatus;
    });

    renderizarOrcamentos(listaDados);
}

function renderizarOrcamentos(listaDados) {
    const lista = document.getElementById('lista-orcamentos');
    if (!lista) return;

    if (listaDados.length === 0) {
        lista.innerHTML = '<p>Nenhum orçamento encontrado.</p>';
        return;
    }

    lista.innerHTML = listaDados.map(orc => `
        <div class="item">
            <h4>${orc.cliente}</h4>
            <p>${orc.descricao}</p>
            <p class="item-valor">${formatarMoeda(orc.valor_bruto)}</p>
            <p class="item-data">${new Date(orc.data_envio).toLocaleDateString()}</p>
            <p class="status-badge status-${orc.status.toLowerCase()}">${orc.status}</p>
            <div class="botoes-acao">
                <button class="btn-edit" onclick="editarStatusOrcamento(${orc.id}, '${orc.status}')">Alterar Status</button>
                <button class="btn-delete" onclick="deletarOrcamento(${orc.id})">Deletar</button>
            </div>
        </div>
    `).join('');
}

function editarStatusOrcamento(id, statusAtual) {
    const novoStatus = prompt(`Alterar status de "${statusAtual}":\n1 = Pendente\n2 = Aprovado\n3 = Recusado`, '1');
    
    if (novoStatus === null) return;
    
    const statusMap = { '1': 'Pendente', '2': 'Aprovado', '3': 'Recusado' };
    const statusSelecionado = statusMap[novoStatus];
    
    if (!statusSelecionado) {
        alert('Status inválido!');
        return;
    }
    
    atualizarStatusOrcamento(id, statusSelecionado);
}

async function atualizarStatusOrcamento(id, novoStatus) {
    try {
        const response = await fetch(`${API_URL}/orcamentos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });

        if (response.ok) {
            carregarOrcamentos();
            carregarDashboard();
            alert('Status atualizado com sucesso!');
        } else {
            alert('Erro ao atualizar status');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

async function deletarOrcamento(id) {
    if (!confirm('Tem certeza que deseja deletar este orçamento?')) return;

    try {
        const response = await fetch(`${API_URL}/orcamentos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarOrcamentos();
            carregarDashboard();
            alert('Orçamento deletado!');
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

// ==================== FATURAMENTO ====================
async function adicionarFaturamento() {
    const dados = {
        descricao: document.getElementById('fat-descricao').value,
        valor: parseFloat(document.getElementById('fat-valor').value),
        data_recebimento: document.getElementById('fat-data').value
    };

    try {
        const response = await fetch(`${API_URL}/faturamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            document.getElementById('form-faturamento').reset();
            carregarFaturamento();
            carregarDashboard();
            alert('Faturamento adicionado!');
        } else {
            alert('Erro ao adicionar faturamento');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

async function carregarFaturamento() {
    try {
        const response = await fetch(`${API_URL}/faturamento`);
        const dados = await response.json();
        
        const lista = document.getElementById('lista-faturamento');
        if (!lista) return;

        lista.innerHTML = dados.map(fat => `
            <div class="item">
                <p>${fat.descricao}</p>
                <p class="item-valor">${formatarMoeda(fat.valor)}</p>
                <p class="item-data">${new Date(fat.data_recebimento).toLocaleDateString()}</p>
                <button class="btn-delete" onclick="deletarFaturamento(${fat.id})">Deletar</button>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function deletarFaturamento(id) {
    if (!confirm('Deletar este faturamento?')) return;

    try {
        const response = await fetch(`${API_URL}/faturamento/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarFaturamento();
            carregarDashboard();
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

// ==================== GASTOS MENSAIS ====================
async function adicionarGastosMensais() {
    const dados = {
        categoria: document.getElementById('gm-categoria').value,
        descricao: document.getElementById('gm-descricao').value,
        valor: parseFloat(document.getElementById('gm-valor').value),
        mes: document.getElementById('gm-mes').value
    };

    try {
        const response = await fetch(`${API_URL}/gastos_mensais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            document.getElementById('form-gastos-mensais').reset();
            carregarGastosMensais();
            carregarDashboard();
            alert('Gasto mensal adicionado!');
        } else {
            alert('Erro ao adicionar');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

async function carregarGastosMensais() {
    try {
        const response = await fetch(`${API_URL}/gastos_mensais`);
        const dados = await response.json();
        
        const lista = document.getElementById('lista-gastos-mensais');
        if (!lista) return;

        lista.innerHTML = dados.map(gm => `
            <div class="item">
                <p><strong>${gm.categoria}</strong></p>
                <p>${gm.descricao}</p>
                <p class="item-valor">${formatarMoeda(gm.valor)}</p>
                <p class="item-data">${gm.mes}</p>
                <button class="btn-delete" onclick="deletarGastosMensais(${gm.id})">Deletar</button>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function deletarGastosMensais(id) {
    if (!confirm('Deletar este gasto?')) return;

    try {
        const response = await fetch(`${API_URL}/gastos_mensais/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarGastosMensais();
            carregarDashboard();
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

// ==================== GASTOS ANUAIS ====================
async function adicionarGastosAnuais() {
    const dados = {
        categoria: document.getElementById('ga-categoria').value,
        descricao: document.getElementById('ga-descricao').value,
        valor: parseFloat(document.getElementById('ga-valor').value),
        ano: document.getElementById('ga-ano').value
    };

    try {
        const response = await fetch(`${API_URL}/gastos_anuais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            document.getElementById('form-gastos-anuais').reset();
            carregarGastosAnuais();
            carregarDashboard();
            alert('Gasto anual adicionado!');
        } else {
            alert('Erro ao adicionar');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

async function carregarGastosAnuais() {
    try {
        const response = await fetch(`${API_URL}/gastos_anuais`);
        const dados = await response.json();
        
        const lista = document.getElementById('lista-gastos-anuais');
        if (!lista) return;

        lista.innerHTML = dados.map(ga => `
            <div class="item">
                <p><strong>${ga.categoria}</strong></p>
                <p>${ga.descricao}</p>
                <p class="item-valor">${formatarMoeda(ga.valor)}</p>
                <p class="item-data">${ga.ano}</p>
                <button class="btn-delete" onclick="deletarGastosAnuais(${ga.id})">Deletar</button>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function deletarGastosAnuais(id) {
    if (!confirm('Deletar este gasto?')) return;

    try {
        const response = await fetch(`${API_URL}/gastos_anuais/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarGastosAnuais();
            carregarDashboard();
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

// ==================== GASTOS EVENTUAIS ====================
async function adicionarGastosEventuais() {
    const dados = {
        descricao: document.getElementById('ge-descricao').value,
        valor: parseFloat(document.getElementById('ge-valor').value),
        data: document.getElementById('ge-data').value
    };

    try {
        const response = await fetch(`${API_URL}/gastos_eventuais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            document.getElementById('form-gastos-eventuais').reset();
            carregarGastosEventuais();
            carregarDashboard();
            alert('Gasto eventual adicionado!');
        } else {
            alert('Erro ao adicionar');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

async function carregarGastosEventuais() {
    try {
        const response = await fetch(`${API_URL}/gastos_eventuais`);
        const dados = await response.json();
        
        const lista = document.getElementById('lista-gastos-eventuais');
        if (!lista) return;

        lista.innerHTML = dados.map(ge => `
            <div class="item">
                <p>${ge.descricao}</p>
                <p class="item-valor">${formatarMoeda(ge.valor)}</p>
                <p class="item-data">${new Date(ge.data).toLocaleDateString()}</p>
                <button class="btn-delete" onclick="deletarGastosEventuais(${ge.id})">Deletar</button>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function deletarGastosEventuais(id) {
    if (!confirm('Deletar este gasto?')) return;

    try {
        const response = await fetch(`${API_URL}/gastos_eventuais/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarGastosEventuais();
            carregarDashboard();
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

// ==================== IMPOSTOS ====================
async function adicionarImpostos() {
    const dados = {
        tipo: document.getElementById('imp-tipo').value,
        valor: parseFloat(document.getElementById('imp-valor').value),
        data_vencimento: document.getElementById('imp-vencimento').value
    };

    try {
        const response = await fetch(`${API_URL}/impostos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            document.getElementById('form-impostos').reset();
            carregarImpostos();
            carregarDashboard();
            alert('Imposto adicionado!');
        } else {
            alert('Erro ao adicionar');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

async function carregarImpostos() {
    try {
        const response = await fetch(`${API_URL}/impostos`);
        const dados = await response.json();
        
        const lista = document.getElementById('lista-impostos');
        if (!lista) return;

        lista.innerHTML = dados.map(imp => `
            <div class="item">
                <p><strong>${imp.tipo}</strong></p>
                <p class="item-valor">${formatarMoeda(imp.valor)}</p>
                <p class="item-data">${new Date(imp.data_vencimento).toLocaleDateString()}</p>
                <button class="btn-delete" onclick="deletarImpostos(${imp.id})">Deletar</button>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function deletarImpostos(id) {
    if (!confirm('Deletar este imposto?')) return;

    try {
        const response = await fetch(`${API_URL}/impostos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarImpostos();
            carregarDashboard();
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

// ==================== LUCROS ====================
async function adicionarLucros() {
    const dados = {
        mes: document.getElementById('luc-mes').value,
        valor: parseFloat(document.getElementById('luc-valor').value),
        descricao: document.getElementById('luc-descricao').value
    };

    try {
        const response = await fetch(`${API_URL}/lucros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            document.getElementById('form-lucros').reset();
            carregarLucros();
            carregarDashboard();
            alert('Lucro adicionado!');
        } else {
            alert('Erro ao adicionar');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

async function carregarLucros() {
    try {
        const response = await fetch(`${API_URL}/lucros`);
        const dados = await response.json();
        
        const lista = document.getElementById('lista-lucros');
        if (!lista) return;

        lista.innerHTML = dados.map(luc => `
            <div class="item">
                <p>${luc.descricao}</p>
                <p class="item-valor">${formatarMoeda(luc.valor)}</p>
                <p class="item-data">${luc.mes}</p>
                <button class="btn-delete" onclick="deletarLucros(${luc.id})">Deletar</button>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function deletarLucros(id) {
    if (!confirm('Deletar este lucro?')) return;

    try {
        const response = await fetch(`${API_URL}/lucros/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarLucros();
            carregarDashboard();
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

// ==================== INVESTIMENTOS ====================
async function adicionarInvestimentos() {
    const dados = {
        categoria: document.getElementById('inv-categoria').value,
        descricao: document.getElementById('inv-descricao').value,
        valor: parseFloat(document.getElementById('inv-valor').value),
        data: document.getElementById('inv-data').value,
        retorno_esperado: parseFloat(document.getElementById('inv-retorno').value) || 0
    };

    try {
        const response = await fetch(`${API_URL}/investimentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            document.getElementById('form-investimentos').reset();
            carregarInvestimentos();
            carregarDashboard();
            alert('Investimento adicionado!');
        } else {
            alert('Erro ao adicionar');
        }
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    }
}

async function carregarInvestimentos() {
    try {
        const response = await fetch(`${API_URL}/investimentos`);
        const dados = await response.json();
        
        const lista = document.getElementById('lista-investimentos');
        if (!lista) return;

        lista.innerHTML = dados.map(inv => `
            <div class="item">
                <p><strong>${inv.categoria}</strong></p>
                <p>${inv.descricao}</p>
                <p class="item-valor">${formatarMoeda(inv.valor)}</p>
                <p class="item-data">${new Date(inv.data).toLocaleDateString()}</p>
                <p>Retorno esperado: ${inv.retorno_esperado}%</p>
                <button class="btn-delete" onclick="deletarInvestimentos(${inv.id})">Deletar</button>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function deletarInvestimentos(id) {
    if (!confirm('Deletar este investimento?')) return;

    try {
        const response = await fetch(`${API_URL}/investimentos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarInvestimentos();
            carregarDashboard();
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

// ==================== DASHBOARD ====================
async function carregarDashboard() {
    try {
        const [orcamentosRes, faturamentoRes, gastosRes, lucroseRes] = await Promise.all([
            fetch(`${API_URL}/orcamentos`),
            fetch(`${API_URL}/faturamento`),
            fetch(`${API_URL}/gastos_mensais`),
            fetch(`${API_URL}/lucros`)
        ]);

        const orcamentos = await orcamentosRes.json();
        const faturamento = await faturamentoRes.json();
        const gastos = await gastosRes.json();
        const lucros = await lucroseRes.json();

        // Calcular totais
        const totalOrcamentos = orcamentos.reduce((sum, o) => sum + o.valor_bruto, 0);
        const totalFaturamento = faturamento.reduce((sum, f) => sum + f.valor, 0);
        const totalGastos = gastos.reduce((sum, g) => sum + g.valor, 0);
        const totalLucros = lucros.reduce((sum, l) => sum + l.valor, 0);

        // Atualizar cards
        document.getElementById('card-orcamentos')!.textContent = formatarMoeda(totalOrcamentos);
        document.getElementById('card-faturamento')!.textContent = formatarMoeda(totalFaturamento);
        document.getElementById('card-gastos')!.textContent = formatarMoeda(totalGastos);
        document.getElementById('card-lucros')!.textContent = formatarMoeda(totalLucros);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

// ==================== CARREGAMENTO GERAL ====================
async function carregarTodosDados() {
    carregarOrcamentos();
    carregarFaturamento();
    carregarGastosMensais();
    carregarGastosAnuais();
    carregarGastosEventuais();
    carregarImpostos();
    carregarLucros();
    carregarInvestimentos();
}

// ==================== UTILITÁRIOS ====================
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function popularFiltrosData() {
    const today = new Date().toISOString().split('T')[0];
    
    ['orc-data', 'fat-data', 'gm-mes', 'ga-ano', 'ge-data', 'imp-vencimento', 'luc-mes', 'inv-data'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem && !elem.value) {
            elem.value = today;
        }
    });
}
