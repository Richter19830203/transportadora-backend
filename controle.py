"""
Sistema de Controle Financeiro para Transportadora
Backend Flask com API RESTful
"""

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os
import sys

import pandas as pd

BASE_DIR = getattr(sys, "_MEIPASS", os.path.abspath(os.path.dirname(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Caminho fixo do Excel
EXCEL_FILE = os.path.join(BASE_DIR, "dados_transportadora.xlsx")

app = Flask(__name__, template_folder=TEMPLATES_DIR, static_folder=STATIC_DIR)
CORS(app)

def atualizar_excel():
    """Atualiza o arquivo Excel com todos os dados do banco"""
    try:
        conn = get_db()
        tables = {
            'orcamentos': 'Orcamentos',
            'faturamento': 'Faturamento',
            'gastos_mensais': 'Gastos_Mensais',
            'gastos_anuais': 'Gastos_Anuais',
            'gastos_eventuais': 'Gastos_Eventuais',
            'impostos': 'Impostos',
            'lucros': 'Lucros',
            'investimentos': 'Investimentos'
        }

        with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl', mode='w') as writer:
            for table, sheet_name in tables.items():
                try:
                    df = pd.read_sql_query(f"SELECT * FROM {table}", conn)
                    sheet_name_short = sheet_name[:31]
                    df.to_excel(writer, index=False, sheet_name=sheet_name_short)
                except Exception as e:
                    print(f"Erro ao salvar tabela {table}: {e}")
        
        conn.close()
        print(f"✅ Excel atualizado: {EXCEL_FILE}")
    except Exception as e:
        print(f"❌ Erro ao atualizar Excel: {e}")

# Configuração do banco de dados
DATABASE = 'transportadora.db'

def get_db():
    """Conecta ao banco de dados"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa o banco de dados com as tabelas necessárias"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Tabela de Orçamentos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orcamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            valor_bruto REAL NOT NULL,
            cliente TEXT NOT NULL,
            data_envio TEXT NOT NULL,
            status TEXT DEFAULT 'Pendente',
            data_alteracao_status TEXT
        )
    ''')
    
    # Adicionar coluna data_alteracao_status se não existir (para bancos existentes)
    try:
        cursor.execute('ALTER TABLE orcamentos ADD COLUMN data_alteracao_status TEXT')
        conn.commit()
    except sqlite3.OperationalError:
        pass  # Coluna já existe
    
    # Tabela de Faturamento
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS faturamento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            cliente TEXT NOT NULL,
            data_faturamento TEXT NOT NULL,
            nota_fiscal TEXT
        )
    ''')
    
    # Tabela de Gastos Mensais
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gastos_mensais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            mes INTEGER NOT NULL,
            ano INTEGER NOT NULL,
            data_registro TEXT NOT NULL
        )
    ''')
    
    # Tabela de Gastos Anuais
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gastos_anuais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            ano INTEGER NOT NULL,
            data_registro TEXT NOT NULL
        )
    ''')
    
    # Tabela de Gastos Eventuais
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gastos_eventuais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            data_ocorrencia TEXT NOT NULL,
            responsavel TEXT
        )
    ''')
    
    # Tabela de Impostos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS impostos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo_imposto TEXT NOT NULL,
            valor REAL NOT NULL,
            referencia TEXT NOT NULL,
            data_vencimento TEXT NOT NULL,
            status TEXT DEFAULT 'Pendente'
        )
    ''')
    
    # Tabela de Lucros
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lucros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            mes INTEGER NOT NULL,
            ano INTEGER NOT NULL,
            data_registro TEXT NOT NULL
        )
    ''')
    
    # Tabela de Investimentos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS investimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            data_investimento TEXT NOT NULL,
            retorno_esperado REAL
        )
    ''')
    
    conn.commit()
    conn.close()

# Rotas da API

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/<filename>')
def serve_static(filename):
    """Serve arquivos estáticos"""
    return send_file(os.path.join(STATIC_DIR, filename))

# ========== ORÇAMENTOS ==========

@app.route('/api/orcamentos', methods=['GET', 'POST'])
def orcamentos():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        print(f"[DEBUG] Recebendo POST em /api/orcamentos")
        print(f"[DEBUG] Dados recebidos: {data}")
        data_alteracao = datetime.now().strftime('%Y-%m-%d %H:%M:%S') if data.get('status') != 'Pendente' else None
        cursor.execute('''
            INSERT INTO orcamentos (descricao, valor_bruto, cliente, data_envio, status, data_alteracao_status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['descricao'], data['valor_bruto'], data['cliente'], 
              data['data_envio'], data.get('status', 'Pendente'), data_alteracao))
        conn.commit()
        conn.close()
        atualizar_excel()  # ✅ Atualizar Excel após inserir
        return jsonify({'success': True, 'message': 'Orçamento cadastrado com sucesso!'})
    
    cursor.execute('SELECT * FROM orcamentos ORDER BY data_envio DESC')
    orcamentos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(orcamentos)

@app.route('/api/orcamentos/<int:id>', methods=['DELETE', 'PUT', 'PATCH'])
def orcamento_id(id):
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'DELETE':
        cursor.execute('DELETE FROM orcamentos WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        atualizar_excel()  # ✅ Atualizar Excel após deletar
        return jsonify({'success': True, 'message': 'Orçamento removido!'})
    
    if request.method == 'PATCH':
        # Endpoint simplificado para alterar apenas o status
        data = request.json
        
        # Verificar se o status está sendo alterado
        cursor.execute('SELECT status FROM orcamentos WHERE id=?', (id,))
        resultado = cursor.fetchone()
        
        if not resultado:
            conn.close()
            return jsonify({'success': False, 'message': 'Orçamento não encontrado!'}), 404
        
        if resultado['status'] != data['status']:
            # Status foi alterado, registrar data/hora
            data_alteracao = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute('''
                UPDATE orcamentos 
                SET status=?, data_alteracao_status=?
                WHERE id=?
            ''', (data['status'], data_alteracao, id))
        else:
            cursor.execute('UPDATE orcamentos SET status=? WHERE id=?', (data['status'], id))
        
        conn.commit()
        conn.close()
        atualizar_excel()  # ✅ Atualizar Excel após alterar status
        return jsonify({'success': True, 'message': f'Status alterado para {data["status"]}!'})
    
    if request.method == 'PUT':
        data = request.json
        
        # Verificar se o status está sendo alterado
        cursor.execute('SELECT status FROM orcamentos WHERE id=?', (id,))
        resultado = cursor.fetchone()
        data_alteracao = None
        
        if resultado and resultado['status'] != data['status']:
            # Status foi alterado, registrar data/hora
            data_alteracao = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        if data_alteracao:
            cursor.execute('''
                UPDATE orcamentos 
                SET descricao=?, valor_bruto=?, cliente=?, data_envio=?, status=?, data_alteracao_status=?
                WHERE id=?
            ''', (data['descricao'], data['valor_bruto'], data['cliente'], 
                  data['data_envio'], data['status'], data_alteracao, id))
        else:
            cursor.execute('''
                UPDATE orcamentos 
                SET descricao=?, valor_bruto=?, cliente=?, data_envio=?, status=?
                WHERE id=?
            ''', (data['descricao'], data['valor_bruto'], data['cliente'], 
                  data['data_envio'], data['status'], id))
        
        conn.commit()
        conn.close()
        atualizar_excel()  # ✅ Atualizar Excel após atualizar
        return jsonify({'success': True, 'message': 'Orçamento atualizado!'})

# ========== FATURAMENTO ==========

@app.route('/api/faturamento', methods=['GET', 'POST'])
def faturamento():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO faturamento (descricao, valor, cliente, data_faturamento, nota_fiscal)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['descricao'], data['valor'], data['cliente'], 
              data['data_faturamento'], data.get('nota_fiscal', '')))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Faturamento registrado!'})
    
    cursor.execute('SELECT * FROM faturamento ORDER BY data_faturamento DESC')
    faturamentos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(faturamentos)

@app.route('/api/faturamento/<int:id>', methods=['DELETE'])
def faturamento_id(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM faturamento WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    atualizar_excel()
    return jsonify({'success': True, 'message': 'Faturamento removido!'})

# ========== GASTOS MENSAIS ==========

@app.route('/api/gastos-mensais', methods=['GET', 'POST'])
def gastos_mensais():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO gastos_mensais (categoria, descricao, valor, mes, ano, data_registro)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['categoria'], data['descricao'], data['valor'], 
              data['mes'], data['ano'], data['data_registro']))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Gasto mensal registrado!'})
    
    cursor.execute('SELECT * FROM gastos_mensais ORDER BY ano DESC, mes DESC')
    gastos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(gastos)

@app.route('/api/gastos-mensais/<int:id>', methods=['DELETE'])
def gasto_mensal_id(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM gastos_mensais WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    atualizar_excel()
    return jsonify({'success': True, 'message': 'Gasto mensal removido!'})

# ========== GASTOS ANUAIS ==========

@app.route('/api/gastos-anuais', methods=['GET', 'POST'])
def gastos_anuais():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO gastos_anuais (categoria, descricao, valor, ano, data_registro)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['categoria'], data['descricao'], data['valor'], 
              data['ano'], data['data_registro']))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Gasto anual registrado!'})
    
    cursor.execute('SELECT * FROM gastos_anuais ORDER BY ano DESC')
    gastos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(gastos)

@app.route('/api/gastos-anuais/<int:id>', methods=['DELETE'])
def gasto_anual_id(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM gastos_anuais WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    atualizar_excel()
    return jsonify({'success': True, 'message': 'Gasto anual removido!'})

# ========== GASTOS EVENTUAIS ==========

@app.route('/api/gastos-eventuais', methods=['GET', 'POST'])
def gastos_eventuais():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO gastos_eventuais (tipo, descricao, valor, data_ocorrencia, responsavel)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['tipo'], data['descricao'], data['valor'], 
              data['data_ocorrencia'], data.get('responsavel', '')))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Gasto eventual registrado!'})
    
    cursor.execute('SELECT * FROM gastos_eventuais ORDER BY data_ocorrencia DESC')
    gastos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(gastos)

@app.route('/api/gastos-eventuais/<int:id>', methods=['DELETE'])
def gasto_eventual_id(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM gastos_eventuais WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    atualizar_excel()
    return jsonify({'success': True, 'message': 'Gasto eventual removido!'})

# ========== IMPOSTOS ==========

@app.route('/api/impostos', methods=['GET', 'POST'])
def impostos():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO impostos (tipo_imposto, valor, referencia, data_vencimento, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['tipo_imposto'], data['valor'], data['referencia'], 
              data['data_vencimento'], data.get('status', 'Pendente')))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Imposto registrado!'})
    
    cursor.execute('SELECT * FROM impostos ORDER BY data_vencimento DESC')
    impostos_lista = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(impostos_lista)

@app.route('/api/impostos/<int:id>', methods=['DELETE', 'PUT'])
def imposto_id(id):
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'DELETE':
        cursor.execute('DELETE FROM impostos WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Imposto removido!'})
    
    if request.method == 'PUT':
        data = request.json
        cursor.execute('UPDATE impostos SET status=? WHERE id=?', (data['status'], id))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Status atualizado!'})

# ========== LUCROS ==========

@app.route('/api/lucros', methods=['GET', 'POST'])
def lucros():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO lucros (descricao, valor, mes, ano, data_registro)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['descricao'], data['valor'], data['mes'], 
              data['ano'], data['data_registro']))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Lucro registrado!'})
    
    cursor.execute('SELECT * FROM lucros ORDER BY ano DESC, mes DESC')
    lucros_lista = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(lucros_lista)

@app.route('/api/lucros/<int:id>', methods=['DELETE'])
def lucro_id(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM lucros WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    atualizar_excel()
    return jsonify({'success': True, 'message': 'Lucro removido!'})

# ========== INVESTIMENTOS ==========

@app.route('/api/investimentos', methods=['GET', 'POST'])
def investimentos():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO investimentos (tipo, descricao, valor, data_investimento, retorno_esperado)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['tipo'], data['descricao'], data['valor'], 
              data['data_investimento'], data.get('retorno_esperado', 0)))
        conn.commit()
        conn.close()
        atualizar_excel()
        return jsonify({'success': True, 'message': 'Investimento registrado!'})
    
    cursor.execute('SELECT * FROM investimentos ORDER BY data_investimento DESC')
    investimentos_lista = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(investimentos_lista)

@app.route('/api/investimentos/<int:id>', methods=['DELETE'])
def investimento_id(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM investimentos WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    atualizar_excel()
    return jsonify({'success': True, 'message': 'Investimento removido!'})

# ========== DASHBOARD / RELATÓRIOS ==========

@app.route('/api/dashboard')
def dashboard():
    """Retorna dados consolidados para o dashboard com filtros opcionais de período (início/fim)."""

    def build_date(prefix: str, is_start: bool) -> str:
        ano = request.args.get(f'{prefix}_ano')
        mes = request.args.get(f'{prefix}_mes')
        dia = request.args.get(f'{prefix}_dia')

        if not ano and not mes and not dia:
            return '0001-01-01' if is_start else '9999-12-31'

        y = int(ano) if ano else (1 if is_start else 9999)
        m = int(mes) if mes else (1 if is_start else 12)
        d = int(dia) if dia else (1 if is_start else 31)

        return f"{y:04d}-{m:02d}-{d:02d}"

    start_date = build_date('start', is_start=True)
    end_date = build_date('end', is_start=False)

    conn = get_db()
    cursor = conn.cursor()

    def date_range_sum(table: str, column: str, sum_col: str) -> float:
        cursor.execute(
            f"""
            SELECT COALESCE(SUM({sum_col}), 0) as total
            FROM {table}
            WHERE date({column}) BETWEEN date(?) AND date(?)
            """,
            (start_date, end_date),
        )
        return cursor.fetchone()['total']

    # Totais baseados em datas
    total_orcamentos = date_range_sum('orcamentos', 'data_envio', 'valor_bruto')
    total_faturamento = date_range_sum('faturamento', 'data_faturamento', 'valor')
    total_gastos_eventuais = date_range_sum('gastos_eventuais', 'data_ocorrencia', 'valor')
    total_impostos = date_range_sum('impostos', 'data_vencimento', 'valor')
    total_investimentos = date_range_sum('investimentos', 'data_investimento', 'valor')

    # Gastos mensais (usa ano/mes)
    start_year = int(request.args.get('start_ano') or 0)
    start_month = int(request.args.get('start_mes') or 1)
    end_year = int(request.args.get('end_ano') or 9999)
    end_month = int(request.args.get('end_mes') or 12)

    start_month_key = start_year * 100 + start_month
    end_month_key = end_year * 100 + end_month

    cursor.execute(
        """
        SELECT COALESCE(SUM(valor), 0) as total
        FROM gastos_mensais
        WHERE (? = 0 OR (ano * 100 + mes) >= ?)
          AND (? = 0 OR (ano * 100 + mes) <= ?)
        """,
        (start_year, start_month_key, end_year, end_month_key),
    )
    total_gastos_mensais = cursor.fetchone()['total']

    # Gastos anuais (usa ano)
    cursor.execute(
        """
        SELECT COALESCE(SUM(valor), 0) as total
        FROM gastos_anuais
        WHERE (? = 0 OR ano >= ?)
          AND (? = 0 OR ano <= ?)
        """,
        (start_year, start_year, end_year, end_year),
    )
    total_gastos_anuais = cursor.fetchone()['total']

    # Lucros (usa ano/mes)
    cursor.execute(
        """
        SELECT COALESCE(SUM(valor), 0) as total
        FROM lucros
        WHERE (? = 0 OR (ano * 100 + mes) >= ?)
          AND (? = 0 OR (ano * 100 + mes) <= ?)
        """,
        (start_year, start_month_key, end_year, end_month_key),
    )
    total_lucros = cursor.fetchone()['total']

    conn.close()

    total_gastos = total_gastos_mensais + total_gastos_anuais + total_gastos_eventuais + total_impostos
    lucro_liquido = total_faturamento - total_gastos

    return jsonify({
        'total_orcamentos': total_orcamentos,
        'total_faturamento': total_faturamento,
        'total_gastos_mensais': total_gastos_mensais,
        'total_gastos_anuais': total_gastos_anuais,
        'total_gastos_eventuais': total_gastos_eventuais,
        'total_impostos': total_impostos,
        'total_gastos': total_gastos,
        'total_lucros': total_lucros,
        'total_investimentos': total_investimentos,
        'lucro_liquido': lucro_liquido
    })


@app.route('/api/export/excel')
def export_excel():
    """Exporta todos os registros do banco para um único Excel com abas separadas.
    Se o arquivo já existir, adiciona novos registros nas linhas abaixo."""

    conn = get_db()
    tables = {
        'orcamentos': 'Orcamentos',
        'faturamento': 'Faturamento',
        'gastos_mensais': 'Gastos_Mensais',
        'gastos_anuais': 'Gastos_Anuais',
        'gastos_eventuais': 'Gastos_Eventuais',
        'impostos': 'Impostos',
        'lucros': 'Lucros',
        'investimentos': 'Investimentos'
    }

    # Nome fixo do arquivo
    filename = "dados_transportadora.xlsx"
    # Usar o diretório BASE_DIR que é o diretório do script
    filepath = os.path.join(BASE_DIR, filename)

    try:
        # Se o arquivo já existe, carregar dados existentes
        existing_data = {}
        if os.path.exists(filepath):
            try:
                for table, sheet_name in tables.items():
                    existing_data[sheet_name] = pd.read_excel(filepath, sheet_name=sheet_name[:31])
            except Exception as e:
                print(f"Aviso ao ler arquivo existente: {e}")
                existing_data = {}

        # Buscar dados atuais do banco
        with pd.ExcelWriter(filepath, engine='openpyxl', mode='w') as writer:
            for table, sheet_name in tables.items():
                try:
                    df_new = pd.read_sql_query(f"SELECT * FROM {table}", conn)
                except Exception as e:
                    print(f"Erro ao ler tabela {table}: {e}")
                    df_new = pd.DataFrame()
                
                # Se já existiam dados nessa aba, concatenar mantendo apenas registros únicos
                sheet_name_short = sheet_name[:31]
                if sheet_name_short in existing_data:
                    df_combined = pd.concat([existing_data[sheet_name_short], df_new], ignore_index=True)
                    # Remove duplicatas mantendo a última ocorrência
                    df_combined = df_combined.drop_duplicates(keep='last')
                else:
                    df_combined = df_new
                
                df_combined.to_excel(writer, index=False, sheet_name=sheet_name_short)
        
        # Verificar se o arquivo foi criado com sucesso
        if not os.path.exists(filepath):
            return jsonify({'error': 'Erro ao criar arquivo Excel'}), 500

        # Retornar o arquivo para download
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        print(f"Erro ao exportar Excel: {e}")
        return jsonify({'error': f'Erro ao exportar Excel: {str(e)}'}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', '5000'))
    is_packaged = getattr(sys, 'frozen', False)
    debug_mode = False if is_packaged else True
    print("🚚 Sistema de Controle da Transportadora iniciado!")
    print(f"📊 Acesse: http://127.0.0.1:{port}")
    app.run(debug=debug_mode, port=port)
