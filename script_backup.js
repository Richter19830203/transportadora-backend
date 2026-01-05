// API Base URL
// Usar window.CONFIG.API_URL se dispon�vel (config.js), caso contr�rio usar localhost
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
    document.getElementById('form-orcamento').addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarOrcamento();
    });

    const filtroTexto = document.getElementById('filtro-orc-texto');
    const filtroStatus = document.getElementById('filtro-orc-status');
    if (filtroTexto) filtroTexto.addEventListener('input', aplicarFiltroOrcamentos);
    if (filtroStatus) filtroStatus.addEventListener('change', aplicarFiltroOrcamentos);

    // Faturamento
    document.getElementById('form-faturamento').addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarFaturamento();
    });

    // Gastos Mensais
    document.getElementById('form-gasto-mensal').addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarGastoMensal();
    });

    // Gastos Anuais
    document.getElementById('form-gasto-anual').addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarGastoAnual();
    });

    // Gastos Eventuais
    document.getElementById('form-gasto-eventual').addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarGastoEventual();
    });

    // Impostos
    document.getElementById('form-imposto').addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarImposto();
    });

    // Lucros
    document.getElementById('form-lucro').addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarLucro();
    });

    // Investimentos
    document.getElementById('form-investimento').addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarInvestimento();
    });

    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnLimpar = document.getElementById('btn-limpar');
    const btnExportar = document.getElementById('btn-exportar-excel');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => carregarDashboard());
    }
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            ['start-dia', 'start-mes', 'start-ano', 'end-dia', 'end-mes', 'end-ano'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            carregarDashboard();
        });
    }
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarExcel);
    }
}

// Navegação por abas
function showTab(tabName) {
    // Remover active de todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Ativar aba selecionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Carregar Dashboard
async function carregarDashboard() {
    try {
        const params = buildDashboardQuery();
        const response = await fetch(`${API_URL}/dashboard${params}`);
        const data = await response.json();

        document.getElementById('total-orcamentos').textContent = formatarMoeda(data.total_orcamentos);
        document.getElementById('total-faturamento').textContent = formatarMoeda(data.total_faturamento);
        document.getElementById('total-gastos').textContent = formatarMoeda(data.total_gastos);
        document.getElementById('lucro-liquido').textContent = formatarMoeda(data.lucro_liquido);
        document.getElementById('gastos-mensais').textContent = formatarMoeda(data.total_gastos_mensais);
        document.getElementById('gastos-anuais').textContent = formatarMoeda(data.total_gastos_anuais);
        document.getElementById('gastos-eventuais').textContent = formatarMoeda(data.total_gastos_eventuais);
        document.getElementById('total-impostos').textContent = formatarMoeda(data.total_impostos);
        document.getElementById('total-investimentos').textContent = formatarMoeda(data.total_investimentos);

        renderResumoChart(data);
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function buildDashboardQuery() {
    const search = new URLSearchParams();
    const ids = {
        start_dia: 'start-dia',
        start_mes: 'start-mes',
        start_ano: 'start-ano',
        end_dia: 'end-dia',
        end_mes: 'end-mes',
        end_ano: 'end-ano',
    };

    Object.entries(ids).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el || !el.value) return;
        if (key.includes('dia') || key.includes('mes')) {
            search.append(key, el.value.toString().padStart(2, '0'));
        } else {
            search.append(key, el.value);
        }
    });

    const qs = search.toString();
    return qs ? `?${qs}` : '';
}

function popularFiltrosData() {
    const dias = [''];
    for (let d = 1; d <= 31; d++) dias.push(d.toString().padStart(2, '0'));
    const meses = [''];
    for (let m = 1; m <= 12; m++) meses.push(m.toString().padStart(2, '0'));
    const anos = [''];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 10; y <= currentYear + 5; y++) anos.push(y.toString());

    const map = {
        'start-dia': dias,
        'start-mes': meses,
        'start-ano': anos,
        'end-dia': dias,
        'end-mes': meses,
        'end-ano': anos,
    };

    Object.entries(map).forEach(([id, values]) => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = '';
        values.forEach((val) => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val ? val : '---';
            select.appendChild(opt);
        });
    });
}

function renderResumoChart(data) {
    const canvas = document.getElementById('resumoChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const valores = [
        data.total_orcamentos,
        data.total_faturamento,
        data.total_gastos,
        data.lucro_liquido
    ];

    if (resumoChart) {
        resumoChart.data.datasets[0].data = valores;
        resumoChart.update();
        return;
    }

    resumoChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Orçamentos Enviados', 'Faturamento Real', 'Total Gastos', 'Lucro Líquido'],
            datasets: [{
                label: 'Valores (R$)',
                data: valores,
                backgroundColor: ['#28a745', '#007bff', '#ffc107', '#17a2b8'],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${formatarMoeda(ctx.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatarMoeda(value)
                    }
                }
            }
        }
    });
}

// Carregar todos os dados
function carregarTodosDados() {
    carregarOrcamentos();
    carregarFaturamento();
    carregarGastosMensais();
    carregarGastosAnuais();
    carregarGastosEventuais();
    carregarImpostos();
    carregarLucros();
    carregarInvestimentos();
}

// ========== ORÇAMENTOS ==========

async function adicionarOrcamento() {
    console.log("=== IN�CIO adicionarOrcamento ===");
    const dados = {
        descricao: document.getElementById('orc-descricao').value,
        valor_bruto: parseFloat(document.getElementById('orc-valor').value),
        cliente: document.getElementById('orc-cliente').value,
        data_envio: document.getElementById('orc-data').value,
        status: document.getElementById('orc-status').value
    };

    try {
        console.log("Enviando dados:", dados);const response = await fetch(`${API_URL}/orcamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });console.log("Response:", response);

        console.log("Status da resposta:", response.status);if (response.ok) {
            document.getElementById('form-orcamento').reset();
            carregarOrcamentos();
            carregarDashboard();
            alert('Orçamento adicionado com sucesso!');
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao adicionar orçamento:', error);
        alert('Erro ao adicionar orçamento!');
    }
}

async function carregarOrcamentos() {
    try {
        const response = await fetch(`${API_URL}/orcamentos`);
        const orcamentos = await response.json();
        cacheOrcamentos = Array.isArray(orcamentos) ? orcamentos : [];
        aplicarFiltroOrcamentos();
    } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
    }
}

function aplicarFiltroOrcamentos() {
    const texto = (document.getElementById('filtro-orc-texto')?.value || '').toLowerCase().trim();
    const status = document.getElementById('filtro-orc-status')?.value || '';

    const filtrados = cacheOrcamentos.filter((orc) => {
        const matchTexto = !texto ||
            (orc.descricao && orc.descricao.toLowerCase().includes(texto)) ||
            (orc.cliente && orc.cliente.toLowerCase().includes(texto));
        const matchStatus = !status || orc.status === status;
        return matchTexto && matchStatus;
    });

    renderizarOrcamentos(filtrados);
}

function renderizarOrcamentos(listaDados) {
    const lista = document.getElementById('lista-orcamentos');
    if (!lista) return;

    lista.innerHTML = '';

    if (!listaDados.length) {
        lista.innerHTML = '<p style="padding:12px">Nenhum orçamento encontrado com este filtro.</p>';
        return;
    }

    listaDados.forEach(orc => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <div class="item-info">
                <p><strong>Descrição:</strong> ${orc.descricao}</p>
                <p><strong>Cliente:</strong> ${orc.cliente}</p>
                <p><strong>Data:</strong> ${formatarData(orc.data_envio)}</p>
                <p><span class="status-badge status-${orc.status.toLowerCase()}">${orc.status}</span></p>
            </div>
            <div>
                <p class="item-valor">${formatarMoeda(orc.valor_bruto)}</p>
                <div class="item-actions">
                    <button class="btn-edit" onclick="editarStatusOrcamento(${orc.id}, '${orc.status}')">Alterar Status</button>
                    <button class="btn-delete" onclick="deletarOrcamento(${orc.id})">Excluir</button>
                </div>
            </div>
        `;
        lista.appendChild(div);
    });
}

async function deletarOrcamento(id) {
    if (!confirm('Deseja realmente excluir este orçamento?')) return;

    try {
        const response = await fetch(`${API_URL}/orcamentos/${id}`, { method: 'DELETE' });
        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarOrcamentos();
            carregarDashboard();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao deletar orçamento:', error);
    }
}

// ========== FATURAMENTO ==========

async function adicionarFaturamento() {
    const dados = {
        descricao: document.getElementById('fat-descricao').value,
        valor: parseFloat(document.getElementById('fat-valor').value),
        cliente: document.getElementById('fat-cliente').value,
        data_faturamento: document.getElementById('fat-data').value,
        nota_fiscal: document.getElementById('fat-nf').value
    };

    try {
        const response = await fetch(`${API_URL}/faturamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Status da resposta:", response.status);if (response.ok) {
            document.getElementById('form-faturamento').reset();
            carregarFaturamento();
            carregarDashboard();
            alert('Faturamento registrado com sucesso!');
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao adicionar faturamento:', error);
    }
}

async function carregarFaturamento() {
    try {
        const response = await fetch(`${API_URL}/faturamento`);
        const faturamentos = await response.json();

        const lista = document.getElementById('lista-faturamento');
        lista.innerHTML = '';

        faturamentos.forEach(fat => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>Descrição:</strong> ${fat.descricao}</p>
                    <p><strong>Cliente:</strong> ${fat.cliente}</p>
                    <p><strong>Data:</strong> ${formatarData(fat.data_faturamento)}</p>
                    ${fat.nota_fiscal ? `<p><strong>NF:</strong> ${fat.nota_fiscal}</p>` : ''}
                </div>
                <div>
                    <p class="item-valor">${formatarMoeda(fat.valor)}</p>
                    <div class="item-actions">
                        <button class="btn-delete" onclick="deletarFaturamento(${fat.id})">Excluir</button>
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao carregar faturamento:', error);
    }
}

async function deletarFaturamento(id) {
    if (!confirm('Deseja realmente excluir este faturamento?')) return;

    try {
        const response = await fetch(`${API_URL}/faturamento/${id}`, { method: 'DELETE' });
        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarFaturamento();
            carregarDashboard();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao deletar faturamento:', error);
    }
}

// ========== GASTOS MENSAIS ==========

async function adicionarGastoMensal() {
    const dados = {
        categoria: document.getElementById('gm-categoria').value,
        descricao: document.getElementById('gm-descricao').value,
        valor: parseFloat(document.getElementById('gm-valor').value),
        mes: parseInt(document.getElementById('gm-mes').value),
        ano: parseInt(document.getElementById('gm-ano').value),
        data_registro: document.getElementById('gm-data').value
    };

    try {
        const response = await fetch(`${API_URL}/gastos-mensais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Status da resposta:", response.status);if (response.ok) {
            document.getElementById('form-gasto-mensal').reset();
            carregarGastosMensais();
            carregarDashboard();
            alert('Gasto mensal registrado!');
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao adicionar gasto mensal:', error);
    }
}

async function carregarGastosMensais() {
    try {
        const response = await fetch(`${API_URL}/gastos-mensais`);
        const gastos = await response.json();

        const lista = document.getElementById('lista-gastos-mensais');
        lista.innerHTML = '';

        gastos.forEach(gasto => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>Categoria:</strong> ${gasto.categoria}</p>
                    <p><strong>Descrição:</strong> ${gasto.descricao}</p>
                    <p><strong>Período:</strong> ${gasto.mes}/${gasto.ano}</p>
                    <p><strong>Data:</strong> ${formatarData(gasto.data_registro)}</p>
                </div>
                <div>
                    <p class="item-valor">${formatarMoeda(gasto.valor)}</p>
                    <div class="item-actions">
                        <button class="btn-delete" onclick="deletarGastoMensal(${gasto.id})">Excluir</button>
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao carregar gastos mensais:', error);
    }
}

async function deletarGastoMensal(id) {
    if (!confirm('Deseja realmente excluir este gasto mensal?')) return;

    try {
        const response = await fetch(`${API_URL}/gastos-mensais/${id}`, { method: 'DELETE' });
        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarGastosMensais();
            carregarDashboard();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao deletar gasto mensal:', error);
    }
}

// ========== GASTOS ANUAIS ==========

async function adicionarGastoAnual() {
    const dados = {
        categoria: document.getElementById('ga-categoria').value,
        descricao: document.getElementById('ga-descricao').value,
        valor: parseFloat(document.getElementById('ga-valor').value),
        ano: parseInt(document.getElementById('ga-ano').value),
        data_registro: document.getElementById('ga-data').value
    };

    try {
        const response = await fetch(`${API_URL}/gastos-anuais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Status da resposta:", response.status);if (response.ok) {
            document.getElementById('form-gasto-anual').reset();
            carregarGastosAnuais();
            carregarDashboard();
            alert('Gasto anual registrado!');
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao adicionar gasto anual:', error);
    }
}

async function carregarGastosAnuais() {
    try {
        const response = await fetch(`${API_URL}/gastos-anuais`);
        const gastos = await response.json();

        const lista = document.getElementById('lista-gastos-anuais');
        lista.innerHTML = '';

        gastos.forEach(gasto => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>Categoria:</strong> ${gasto.categoria}</p>
                    <p><strong>Descrição:</strong> ${gasto.descricao}</p>
                    <p><strong>Ano:</strong> ${gasto.ano}</p>
                    <p><strong>Data:</strong> ${formatarData(gasto.data_registro)}</p>
                </div>
                <div>
                    <p class="item-valor">${formatarMoeda(gasto.valor)}</p>
                    <div class="item-actions">
                        <button class="btn-delete" onclick="deletarGastoAnual(${gasto.id})">Excluir</button>
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao carregar gastos anuais:', error);
    }
}

async function deletarGastoAnual(id) {
    if (!confirm('Deseja realmente excluir este gasto anual?')) return;

    try {
        const response = await fetch(`${API_URL}/gastos-anuais/${id}`, { method: 'DELETE' });
        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarGastosAnuais();
            carregarDashboard();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao deletar gasto anual:', error);
    }
}

// ========== GASTOS EVENTUAIS ==========

async function adicionarGastoEventual() {
    const dados = {
        tipo: document.getElementById('ge-tipo').value,
        descricao: document.getElementById('ge-descricao').value,
        valor: parseFloat(document.getElementById('ge-valor').value),
        data_ocorrencia: document.getElementById('ge-data').value,
        responsavel: document.getElementById('ge-responsavel').value
    };

    try {
        const response = await fetch(`${API_URL}/gastos-eventuais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Status da resposta:", response.status);if (response.ok) {
            document.getElementById('form-gasto-eventual').reset();
            carregarGastosEventuais();
            carregarDashboard();
            alert('Gasto eventual registrado!');
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao adicionar gasto eventual:', error);
    }
}

async function carregarGastosEventuais() {
    try {
        const response = await fetch(`${API_URL}/gastos-eventuais`);
        const gastos = await response.json();

        const lista = document.getElementById('lista-gastos-eventuais');
        lista.innerHTML = '';

        gastos.forEach(gasto => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>Tipo:</strong> ${gasto.tipo}</p>
                    <p><strong>Descrição:</strong> ${gasto.descricao}</p>
                    <p><strong>Data:</strong> ${formatarData(gasto.data_ocorrencia)}</p>
                    ${gasto.responsavel ? `<p><strong>Responsável:</strong> ${gasto.responsavel}</p>` : ''}
                </div>
                <div>
                    <p class="item-valor">${formatarMoeda(gasto.valor)}</p>
                    <div class="item-actions">
                        <button class="btn-delete" onclick="deletarGastoEventual(${gasto.id})">Excluir</button>
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao carregar gastos eventuais:', error);
    }
}

async function deletarGastoEventual(id) {
    if (!confirm('Deseja realmente excluir este gasto eventual?')) return;

    try {
        const response = await fetch(`${API_URL}/gastos-eventuais/${id}`, { method: 'DELETE' });
        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarGastosEventuais();
            carregarDashboard();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao deletar gasto eventual:', error);
    }
}

// ========== IMPOSTOS ==========

async function adicionarImposto() {
    const dados = {
        tipo_imposto: document.getElementById('imp-tipo').value,
        valor: parseFloat(document.getElementById('imp-valor').value),
        referencia: document.getElementById('imp-referencia').value,
        data_vencimento: document.getElementById('imp-vencimento').value
    };

    try {
        const response = await fetch(`${API_URL}/impostos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Status da resposta:", response.status);if (response.ok) {
            document.getElementById('form-imposto').reset();
            carregarImpostos();
            carregarDashboard();
            alert('Imposto registrado!');
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao adicionar imposto:', error);
    }
}

async function carregarImpostos() {
    try {
        const response = await fetch(`${API_URL}/impostos`);
        const impostos = await response.json();

        const lista = document.getElementById('lista-impostos');
        lista.innerHTML = '';

        impostos.forEach(imp => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>Tipo:</strong> ${imp.tipo_imposto}</p>
                    <p><strong>Referência:</strong> ${imp.referencia}</p>
                    <p><strong>Vencimento:</strong> ${formatarData(imp.data_vencimento)}</p>
                    <p><span class="status-badge status-${imp.status.toLowerCase()}">${imp.status}</span></p>
                </div>
                <div>
                    <p class="item-valor">${formatarMoeda(imp.valor)}</p>
                    <div class="item-actions">
                        ${imp.status === 'Pendente' ? `<button class="btn-update" onclick="marcarImpostoPago(${imp.id})">Pagar</button>` : ''}
                        <button class="btn-delete" onclick="deletarImposto(${imp.id})">Excluir</button>
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao carregar impostos:', error);
    }
}

async function marcarImpostoPago(id) {
    try {
        const response = await fetch(`${API_URL}/impostos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Pago' })
        });

        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarImpostos();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao atualizar imposto:', error);
    }
}

async function deletarImposto(id) {
    if (!confirm('Deseja realmente excluir este imposto?')) return;

    try {
        const response = await fetch(`${API_URL}/impostos/${id}`, { method: 'DELETE' });
        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarImpostos();
            carregarDashboard();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao deletar imposto:', error);
    }
}

// ========== LUCROS ==========

async function adicionarLucro() {
    const dados = {
        descricao: document.getElementById('lucro-descricao').value,
        valor: parseFloat(document.getElementById('lucro-valor').value),
        mes: parseInt(document.getElementById('lucro-mes').value),
        ano: parseInt(document.getElementById('lucro-ano').value),
        data_registro: document.getElementById('lucro-data').value
    };

    try {
        const response = await fetch(`${API_URL}/lucros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Status da resposta:", response.status);if (response.ok) {
            document.getElementById('form-lucro').reset();
            carregarLucros();
            carregarDashboard();
            alert('Lucro registrado!');
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao adicionar lucro:', error);
    }
}

async function carregarLucros() {
    try {
        const response = await fetch(`${API_URL}/lucros`);
        const lucros = await response.json();

        const lista = document.getElementById('lista-lucros');
        lista.innerHTML = '';

        lucros.forEach(lucro => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>Descrição:</strong> ${lucro.descricao}</p>
                    <p><strong>Período:</strong> ${lucro.mes}/${lucro.ano}</p>
                    <p><strong>Data:</strong> ${formatarData(lucro.data_registro)}</p>
                </div>
                <div>
                    <p class="item-valor">${formatarMoeda(lucro.valor)}</p>
                    <div class="item-actions">
                        <button class="btn-delete" onclick="deletarLucro(${lucro.id})">Excluir</button>
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao carregar lucros:', error);
    }
}

async function deletarLucro(id) {
    if (!confirm('Deseja realmente excluir este lucro?')) return;

    try {
        const response = await fetch(`${API_URL}/lucros/${id}`, { method: 'DELETE' });
        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarLucros();
            carregarDashboard();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao deletar lucro:', error);
    }
}

// ========== INVESTIMENTOS ==========

async function adicionarInvestimento() {
    const dados = {
        tipo: document.getElementById('inv-tipo').value,
        descricao: document.getElementById('inv-descricao').value,
        valor: parseFloat(document.getElementById('inv-valor').value),
        data_investimento: document.getElementById('inv-data').value,
        retorno_esperado: parseFloat(document.getElementById('inv-retorno').value || 0)
    };

    try {
        const response = await fetch(`${API_URL}/investimentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Status da resposta:", response.status);if (response.ok) {
            document.getElementById('form-investimento').reset();
            carregarInvestimentos();
            carregarDashboard();
            alert('Investimento registrado!');
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao adicionar investimento:', error);
    }
}

async function carregarInvestimentos() {
    try {
        const response = await fetch(`${API_URL}/investimentos`);
        const investimentos = await response.json();

        const lista = document.getElementById('lista-investimentos');
        lista.innerHTML = '';

        investimentos.forEach(inv => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>Tipo:</strong> ${inv.tipo}</p>
                    <p><strong>Descrição:</strong> ${inv.descricao}</p>
                    <p><strong>Data:</strong> ${formatarData(inv.data_investimento)}</p>
                    ${inv.retorno_esperado ? `<p><strong>Retorno Esperado:</strong> ${inv.retorno_esperado}%</p>` : ''}
                </div>
                <div>
                    <p class="item-valor">${formatarMoeda(inv.valor)}</p>
                    <div class="item-actions">
                        <button class="btn-delete" onclick="deletarInvestimento(${inv.id})">Excluir</button>
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao carregar investimentos:', error);
    }
}

async function deletarInvestimento(id) {
    if (!confirm('Deseja realmente excluir este investimento?')) return;

    try {
        const response = await fetch(`${API_URL}/investimentos/${id}`, { method: 'DELETE' });
        console.log("Status da resposta:", response.status);if (response.ok) {
            carregarInvestimentos();
            carregarDashboard();
        } else { const errorText = await response.text(); console.error("Erro na resposta:", response.status, errorText); alert("Erro: " + errorText); }
    } catch (error) {
        console.error('Erro ao deletar investimento:', error);
    }
}

// ========== FUNÇÕES AUXILIARES ==========

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarData(data) {
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

async function exportarExcel() {
    const btn = document.getElementById('btn-exportar-excel');

    try {
        if (btn) btn.disabled = true;
        const response = await fetch(`${API_URL}/export/excel`);
        if (!response.ok) {
            throw new Error('Falha na exportação');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const disposition = response.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?([^";]+)"?/i);
        const filename = match && match[1] ? match[1] : 'dados_transportadora.xlsx';

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        alert('Excel exportado com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        alert('Não foi possível exportar o Excel. Tente novamente.');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function editarStatusOrcamento(id, statusAtual) {
    const novoStatus = prompt(`Status atual: ${statusAtual}\n\nEscolha o novo status:\n1 - Pendente\n2 - Aprovado\n3 - Recusado`, statusAtual === 'Pendente' ? '1' : statusAtual === 'Aprovado' ? '2' : '3');
    
    if (!novoStatus) return;
    
    const statusMap = {
        '1': 'Pendente',
        '2': 'Aprovado',
        '3': 'Recusado'
    };
    
    const status = statusMap[novoStatus] || statusAtual;
    
    if (status === statusAtual) {
        alert('Nenhuma altera��o foi feita.');
        return;
    }
    
    try {
        const response = await fetch(`/api/orcamentos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensagem(result.message, 'success');
            carregarOrcamentos();
        } else {
            mostrarMensagem('Erro ao alterar status', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao alterar status do or�amento', 'error');
    }
}




