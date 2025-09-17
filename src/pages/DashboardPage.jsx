import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from '../components/header'; // Nosso header principal com logout
import "../assets/css/dashboard.css";

// --- Dados Iniciais (Mock) ---
// TODO: No futuro, estes dados virão do Firestore
const mockTransacoes = [
  { data: "2025-09-15", descricao: "Assinatura SaaS", valor: 59.90, tipo: "debito", forma_pagamento: "Cartão 8125" },
  { data: "2025-09-15", descricao: "IFD*IFood", valor: 35.50, tipo: "debito", forma_pagamento: "Cartão 8125" },
  { data: "2025-09-14", descricao: "Pagamento Cliente X", valor: 1200.00, tipo: "credito", forma_pagamento: "Pix" },
  { data: "2025-09-12", descricao: "Uber *Viagens", valor: 22.75, tipo: "debito", forma_pagamento: "Cartão 8125" },
];

// --- Constantes de Estilo ---
const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "linear-gradient(120deg, #3B82F6 0%, #9333EA 100%)";
const COLORS = ["#7C3AED", "#2563EB", "#9333EA", "#3B82F6", "#A78BFA", "#60A5FA"];

// --- Funções Utilitárias ---
function numberToBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// --- Componente Principal da Página ---
export default function DashboardPage() {
  const [pagina, setPagina] = useState('dashboard');
  const [transacoes, setTransacoes] = useState(mockTransacoes);
  
  // TODO: Implementar a lógica para salvar transações no Firestore quando a lista mudar.
  // useEffect(() => { ... salvar no banco de dados ... }, [transacoes]);

  const handleAdicionarTransacao = (novaTransacao) => {
    const hoje = new Date();
    hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    const dataFormatada = hoje.toISOString().split('T')[0];

    const transacaoCompleta = {
      ...novaTransacao,
      data: dataFormatada,
      tipo: 'debito',
      forma_pagamento: 'Cartão 8125', // Valor padrão por enquanto
    };

    setTransacoes(prevTransacoes => [...prevTransacoes, transacaoCompleta]);
    setPagina('dashboard');
  };

  return (
    <>
      <Header /> {/* Nosso Header com logout */}
      <div className="dashboard-container">
        <main className="main-content">
          <SubHeader pagina={pagina} setPagina={setPagina} />
          {pagina === 'dashboard' && <DashboardView transacoes={transacoes} setTransacoes={setTransacoes} />}
          {pagina === 'adicionar' && <PaginaAdicionarGasto onAdicionarTransacao={handleAdicionarTransacao} />}
        </main>
      </div>
    </>
  );
}

// --- Sub-Header para Navegação Interna ---
function SubHeader({ pagina, setPagina }) {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <motion.h1
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="header-title" style={{ backgroundImage: CARD_BORDER }}
        >
          Painel Financeiro
        </motion.h1>
        <nav className="header-nav">
          <button onClick={() => setPagina('dashboard')} className={pagina === 'dashboard' ? 'active' : ''}>Dashboard</button>
          <button onClick={() => setPagina('adicionar')} className={pagina === 'adicionar' ? 'active' : ''}>Adicionar Gasto</button>
        </nav>
      </div>
    </header>
  );
}

// --- Componente da Visão do Dashboard ---
function DashboardView({ transacoes, setTransacoes }) {
  const totais = useMemo(() => {
    const debito = transacoes.filter(t => t.tipo === "debito").reduce((acc, t) => acc + (t.valor || 0), 0);
    const credito = transacoes.filter(t => t.tipo === "credito").reduce((acc, t) => acc + (t.valor || 0), 0);
    return { debito, credito, saldo: credito - debito };
  }, [transacoes]);

  return (
    <motion.div 
        key="dashboard-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="dashboard-layout"
    >
      <div className="layout-col--main">
        <Card title="Transações Recentes">
          <TabelaTransacoes transacoes={transacoes} />
        </Card>
      </div>
      <div className="layout-col--sidebar">
        <div className="kpi-grid">
          <KPI title="Total Crédito" value={numberToBRL(totais.credito)} />
          <KPI title="Total Débito" value={numberToBRL(totais.debito)} />
          <KPI title="Saldo Atual" value={numberToBRL(totais.saldo)} highlight={totais.saldo >= 0 ? "positivo" : "negativo"} />
        </div>
        <GastosAgrupados transacoes={transacoes} />
      </div>
    </motion.div>
  );
}

// --- Componente da Página de Adicionar Gasto ---
function PaginaAdicionarGasto({ onAdicionarTransacao }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!descricao.trim() || !valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
      alert("Por favor, preencha a descrição e um valor válido.");
      return;
    }
    onAdicionarTransacao({ descricao: descricao.trim(), valor: parseFloat(valor) });
    setDescricao('');
    setValor('');
  };

  return (
    <motion.div 
        key="add-gasto-view"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10}}
        transition={{ duration: 0.3 }}
        className="adicionar-gasto-container"
    >
      <Card title="Adicionar Gasto do Dia">
        <form onSubmit={handleSubmit} className="adicionar-gasto-form">
          <div className="form-group">
            <label htmlFor="descricao">Descrição</label>
            <input id="descricao" type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Almoço" required />
          </div>
          <div className="form-group">
            <label htmlFor="valor">Valor (R$)</label>
            <input id="valor" type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="Ex: 25.50" step="0.01" min="0.01" required />
          </div>
          <button type="submit" className="form-submit-btn" style={{ background: CARD_BORDER }}>Adicionar Gasto</button>
        </form>
      </Card>
    </motion.div>
  );
}


// --- Componentes Reutilizáveis ---

function TabelaTransacoes({ transacoes }) {
  // Mostra apenas as últimas 10 transações
  const transacoesRecentes = [...transacoes].reverse().slice(0, 10);

  return (
    <div className="table-wrapper">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {transacoesRecentes.map((t, i) => (
            <tr key={i}>
              <td>{new Date(t.data + "T03:00:00Z").toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</td>
              <td>{t.descricao}</td>
              <td><span className={`transaction-badge transaction-badge--${t.tipo}`}>{t.tipo}</span></td>
              <td>{numberToBRL(t.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GastosAgrupados({ transacoes }) {
  const gastosAgrupados = useMemo(() => {
    const mapa = new Map();
    const debitoTransacoes = transacoes.filter(t => t.tipo === 'debito');
    
    debitoTransacoes.forEach(t => {
      // Simplifica descrições comuns para agrupar melhor
      const key = t.descricao.toLowerCase().includes('ifd*') ? 'iFood' : t.descricao.split(' *')[0].trim();
      const item = mapa.get(key) || { total: 0, count: 0 };
      item.total += t.valor;
      item.count += 1;
      mapa.set(key, item);
    });
    const arr = Array.from(mapa.entries()).map(([desc, data]) => ({ name: desc, value: data.total, count: data.count }));
    arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, 5); // Mostra os 5 maiores grupos de gastos
  }, [transacoes]);

  const totalDebito = useMemo(() => transacoes.filter(t => t.tipo === 'debito').reduce((acc, t) => acc + t.valor, 0), [transacoes]);

  if (gastosAgrupados.length === 0) return null;

  return (
    <Card title="Principais Gastos">
      <div className="gastos-agrupados-card">
        {gastosAgrupados.map((gasto, index) => {
          const porcentagem = totalDebito > 0 ? (gasto.value / totalDebito) * 100 : 0;
          return (
            <div key={index} className="gasto-item">
              <div className="gasto-item__header">
                <span className="gasto-item__descricao" title={gasto.name}>{gasto.name}</span>
                <span className="gasto-item__valor">{numberToBRL(gasto.value)}</span>
              </div>
              <div className="gasto-item__progresso-bg">
                <div className="gasto-item__progresso-fg" style={{ width: `${porcentagem}%`, background: COLORS[index % COLORS.length] }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function KPI({ title, value, highlight }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="kpi-card" style={{ background: CARD_BG, borderImage: `${CARD_BORDER} 1`}}>
      <div className="kpi-card__title">{title}</div>
      <div className={`kpi-card__value ${highlight ? 'kpi-card__value--' + highlight : ''}`}>{value}</div>
    </motion.div>
  );
}

function Card({ title, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="content-card" style={{ background: CARD_BG, borderImage: `${CARD_BORDER} 1`}}>
      <div className="content-card__header">
        <h3 className="content-card__title">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}