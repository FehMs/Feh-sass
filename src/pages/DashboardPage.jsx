import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Header from '../components/header';
import "../assets/css/dashboard.css";

import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";


const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "linear-gradient(120deg, #3B82F6 0%, #9333EA 100%)";
const COLORS = ["#7C3AED", "#2563EB", "#9333EA", "#3B82F6", "#A78BFA", "#60A5FA"];

function numberToBRL(n) {
  if (typeof n !== 'number') return 'R$ 0,00';
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizarDescricao(descricao) {
  if (typeof descricao !== 'string') return 'Outros';
  const descLower = descricao.toLowerCase();
  if (descLower.includes('ifd*') || descLower.includes('ifood')) return 'iFood';
  if (descLower.includes('uber')) return 'Uber';
  if (descLower.includes('assinatura')) return 'Assinaturas';
  
  return descricao.split(' *')[0].trim();
}

export default function DashboardPage() {
  const [pagina, setPagina] = useState('dashboard');
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setTransacoes([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const transacoesCollectionRef = collection(db, "transacoes");

    const q = query(
      transacoesCollectionRef,
      where("userId", "==", currentUser.uid),
      orderBy("criadoEm", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transacoesFormatadas = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
  
        data: doc.data().data
      }));
      setTransacoes(transacoesFormatadas);
      setCarregando(false);
    });

    return () => unsubscribe();

  }, [currentUser?.uid]);


  const handleAdicionarTransacao = async (novaTransacao) => {
    if (!currentUser) {
      alert("Você precisa estar logado para adicionar uma transação.");
      return;
    }
    
    const hoje = new Date();
    hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    const dataFormatada = hoje.toISOString().split('T')[0];

    try {
      await addDoc(collection(db, "transacoes"), {
        ...novaTransacao,
        data: dataFormatada,
        tipo: 'debito',
        forma_pagamento: 'Cartão 8125',
        userId: currentUser.uid,
        criadoEm: serverTimestamp()
      });
      setPagina('dashboard');
    } catch (error) {
      console.error("Erro ao adicionar transação: ", error);
      alert("Ocorreu um erro ao salvar o gasto.");
    }
  };


  return (
    <>
      <Header />
      <div className="dashboard-container">
        <main className="main-content">
          <SubHeader pagina={pagina} setPagina={setPagina} />
          {carregando ? ( // Mostra mensagem de carregamento
            <p>Carregando transações...</p>
          ) : (
            <>
              {pagina === 'dashboard' && <DashboardView transacoes={transacoes} />}
              {pagina === 'adicionar' && <PaginaAdicionarGasto onAdicionarTransacao={handleAdicionarTransacao} />}
            </>
          )}
        </main>
      </div>
    </>
  );
}

function SubHeader({ pagina, setPagina }) {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <motion.h1
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="header-title"
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

function DashboardView({ transacoes }) {
  const [modalData, setModalData] = useState(null);

  const totalDebito = useMemo(() => {
    return transacoes
      .filter(t => t.tipo === "debito")
      .reduce((acc, t) => acc + (t.valor || 0), 0);
  }, [transacoes]);


  return (
    <>
      <motion.div
        key="dashboard-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="dashboard-layout"
      >
        <div className="layout-col--sidebar">
          <KPI title="Total de Gastos" value={numberToBRL(totalDebito)} highlight="negativo" />

          <GastosAgrupados 
            transacoes={transacoes} 
            onGastoClick={setModalData} 
            totalDebito={totalDebito} 
          />
        </div>
        <div className="layout-col--main">
          <Card title="Todas as Transações">
            <TabelaTransacoes transacoes={transacoes} />
          </Card>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {modalData && <ModalDetalhesGasto data={modalData} onClose={() => setModalData(null)} />}
      </AnimatePresence>
    </>
  );
}

function TabelaTransacoes({ transacoes }) {
  // 5. REMOVIDO o slice e o reverse para mostrar TODAS as transações na ordem original
  return (
    <div className="table-wrapper">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {transacoes.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.data + "T03:00:00Z").toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</td>
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

function GastosAgrupados({ transacoes, onGastoClick, totalDebito }) { 
    const gastosAgrupados = useMemo(() => {
        const mapa = new Map();
        const debitoTransacoes = transacoes.filter(t => t.tipo === 'debito');
    
        debitoTransacoes.forEach(t => {
          const key = normalizarDescricao(t.descricao);
          const item = mapa.get(key) || { total: 0, count: 0, transacoesOriginais: [] };
          item.total += t.valor;
          item.count += 1;
          item.transacoesOriginais.push(t);
          mapa.set(key, item);
        });
    
        const arr = Array.from(mapa.entries()).map(([desc, data]) => ({ 
            name: desc, 
            value: data.total, 
            count: data.count,
            transacoes: data.transacoesOriginais
        }));
    
        arr.sort((a, b) => b.value - a.value);
        return arr;
    }, [transacoes]);

  if (gastosAgrupados.length === 0) return null;

  return (
    <Card title="Gastos por Categoria">
      <div className="gastos-agrupados-card">
        {gastosAgrupados.map((gasto, index) => {
          const porcentagem = totalDebito > 0 ? (gasto.value / totalDebito) * 100 : 0;
          return (
            <div key={index} className="gasto-item" onClick={() => onGastoClick(gasto)}>
              <div className="gasto-item__header">
                <span className="gasto-item__descricao" title={gasto.name}>
                  {gasto.name} <span className="gasto-item__count">({gasto.count})</span>
                </span>
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


function ModalDetalhesGasto({ data, onClose }) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{data.name}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <div className="modal-summary">
            <span>Total Gasto: <strong>{numberToBRL(data.value)}</strong></span>
            <span>Nº de Transações: <strong>{data.count}</strong></span>
          </div>
          <ul className="modal-transactions-list">
            {data.transacoes.map(t => (
              <li key={t.id}>
                <span>{new Date(t.data + "T03:00:00Z").toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</span>
                <span title={t.descricao}>{t.descricao}</span>
                <strong>{numberToBRL(t.valor)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

function KPI({ title, value, highlight }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="kpi-card" style={{ background: CARD_BG}}>
      <div className="kpi-card__title">{title}</div>
      <div className={`kpi-card__value ${highlight ? 'kpi-card__value--' + highlight : ''}`}>{value}</div>
    </motion.div>
  );
}

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

// No final do seu arquivo, na função Card:

function Card({ title, children }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }} 
      className="content-card" 
      style={{ background: CARD_BG }}
    >
      <div className="content-card__header">
        <h3 className="content-card__title">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}