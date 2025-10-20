import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Header from '../components/header';
import "../assets/css/dashboard.css";

import { db } from "../firebase/config";
import { 
  collection, query, where, onSnapshot, 
  addDoc, serverTimestamp, orderBy, 
  writeBatch, doc, 
  deleteDoc
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";


const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "linear-gradient(120deg, #3B82F6 0%, #9333EA 100%)";
const COLORS = ["#7C3AED", "#2563EB", "#9333EA", "#3B82F6", "#A78BFA", "#60A5FA"];

// --- FUNÇÕES HELPER (sem alterações) ---

function getTodayLocalString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

const mesMap = {
  'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 
  'MAI': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08', 
  'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
};

function formatarDataJson(dataStr) {
  try {
    const [dia, mesAbv] = dataStr.split(' ');
    const mes = mesMap[mesAbv.toUpperCase()];
    if (!mes) throw new Error(`Mês inválido: ${mesAbv}`);
    
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1; 

    let ano = anoAtual;
    if (parseInt(mes, 10) > mesAtual) {
      ano = anoAtual - 1;
    }
    
    return `${ano}-${mes}-${String(dia).padStart(2, '0')}`;
  } catch (error) {
    console.error("Erro ao formatar data:", dataStr, error);
    return null;
  }
}

function formatarValorJson(valorStr) {
  try {
    const ehNegativo = valorStr.includes('-');
    const valorLimpo = valorStr
      .replace('R$', '')
      .replace('-', '')
      .replace(/\./g, '') 
      .replace(',', '.')
      .trim();
    
    let valor = parseFloat(valorLimpo);

    if (ehNegativo && valor > 0) { 
      valor = -valor;
    }
    return valor;
  } catch (error) {
    console.error("Erro ao formatar valor:", valorStr, error);
    return NaN;
  }
}

// --- COMPONENTE PRINCIPAL (sem alterações) ---

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
    setCarregando(true); 
    try {
      await addDoc(collection(db, "transacoes"), {
        ...novaTransacao, 
        tipo: 'debito',
        forma_pagamento: 'Cartão 8125',
        userId: currentUser.uid,
        criadoEm: serverTimestamp()
      });
      setPagina('dashboard');
    } catch (error) {
      console.error("Erro ao adicionar transação: ", error);
      alert("Ocorreu um erro ao salvar o gasto.");
      setCarregando(false);
    }
  };

  const handleImportarTransacoes = async (transacoesArray) => {
    if (!currentUser) {
      alert("Você precisa estar logado para importar.");
      return;
    }
    
    setCarregando(true);
    
    const batch = writeBatch(db);
    const transacoesCollectionRef = collection(db, "transacoes");
    let sucessoCount = 0;
    let falhaCount = 0;

    for (const transacao of transacoesArray) {
      const dataFormatada = formatarDataJson(transacao.Data);
      const valorFormatado = formatarValorJson(transacao.Valor);
      
      if (!dataFormatada || isNaN(valorFormatado) || !transacao.Nome) {
        console.warn("Item pulado (dados inválidos):", transacao);
        falhaCount++;
        continue; 
      }

      const ehCredito = valorFormatado < 0;
      const tipoTransacao = ehCredito ? 'credito' : 'debito';
      const valorParaSalvar = ehCredito ? Math.abs(valorFormatado) : valorFormatado;

      const newDocRef = doc(transacoesCollectionRef); 
      batch.set(newDocRef, {
        descricao: transacao.Nome,
        valor: valorParaSalvar,
        data: dataFormatada,
        tipo: tipoTransacao,
        forma_pagamento: 'Importado',
        userId: currentUser.uid,
        criadoEm: serverTimestamp()
      });
      sucessoCount++;
    }

    try {
      await batch.commit();
      alert(`${sucessoCount} transações importadas com sucesso! ${falhaCount > 0 ? `(${falhaCount} falharam)` : ''}`);
      setPagina('dashboard');
    } catch (error) {
      console.error("Erro ao importar transações em lote: ", error);
      alert("Ocorreu um erro ao salvar os gastos.");
      setCarregando(false);
    }
  };

  const handleRemoverTransacao = async (id) => {
    if (!currentUser) {
      alert("Você precisa estar logado para remover uma transação.");
      return;
    }
    if (!window.confirm("Tem certeza que deseja remover este gasto?")) {
      return;
    }
    try {
      const docRef = doc(db, "transacoes", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao remover transação: ", error);
      alert("Ocorreu um erro ao remover o gasto.");
    }
  };


  return (
    <>
      <Header />
      <div className="dashboard-container">
        <main className="main-content">
          <SubHeader pagina={pagina} setPagina={setPagina} />
          {carregando ? (
            <p>Carregando transações...</p>
          ) : (
            <>
              {pagina === 'dashboard' && (
                <DashboardView 
                  transacoes={transacoes} 
                  onRemoverTransacao={handleRemoverTransacao} 
                />
              )}
              {pagina === 'adicionar' && <PaginaAdicionarGasto onAdicionarTransacao={handleAdicionarTransacao} />}
              {pagina === 'importar' && <PaginaImportarJSON onImportarTransacoes={handleImportarTransacoes} />}
            </>
          )}
        </main>
      </div>
    </>
  );
}

// SubHeader (sem alterações)
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
          <button onClick={() => setPagina('importar')} className={pagina === 'importar' ? 'active' : ''}>Importar JSON</button>
        </nav>
      </div>
    </header>
  );
}

// --- DashboardView MODIFICADO ---
function DashboardView({ transacoes, onRemoverTransacao }) {
  const [modalData, setModalData] = useState(null);

  // 1. Cálculo 1: Total de Débitos (para o gráfico/categorias)
  const totalDebito = useMemo(() => {
    return transacoes
      .filter(t => t.tipo === "debito") 
      .reduce((acc, t) => acc + (t.valor || 0), 0);
  }, [transacoes]);

  // 2. Cálculo 2: Saldo Líquido (para o KPI principal)
  const saldoLiquido = useMemo(() => {
    return transacoes.reduce((acc, t) => {
      if (t.tipo === "debito") {
        return acc + (t.valor || 0); // Soma gastos
      }
      if (t.tipo === "credito") {
        return acc - (t.valor || 0); // Subtrai estornos
      }
      return acc;
    }, 0);
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
          {/* 3. KPI atualizado para mostrar o Saldo Líquido */}
          <KPI 
            title="Saldo Líquido" 
            value={numberToBRL(saldoLiquido)} 
            highlight={saldoLiquido > 0 ? "negativo" : "positivo"} 
          />

          {/* 4. GastosAgrupados continua usando o totalDebito (correto) */}
          <GastosAgrupados 
            transacoes={transacoes} 
            onGastoClick={setModalData} 
            totalDebito={totalDebito} 
          />
        </div>
        <div className="layout-col--main">
          <Card title="Todas as Transações">
            <TabelaTransacoes 
              transacoes={transacoes} 
              onRemoverTransacao={onRemoverTransacao} 
            />
          </Card>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {modalData && (
          <ModalDetalhesGasto 
            data={modalData} 
            onClose={() => setModalData(null)} 
            onRemoverTransacao={onRemoverTransacao}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// TabelaTransacoes (sem alterações)
function TabelaTransacoes({ transacoes, onRemoverTransacao }) {
  return (
    <div className="table-wrapper">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {transacoes.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.data + "T03:00:00Z").toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</td>
              <td>{t.descricao}</td>
              <td><span className={`transaction-badge transaction-badge--${t.tipo}`}>{t.tipo}</span></td>
              <td>{numberToBRL(t.valor)}</td>
              <td>
                <button 
                  onClick={() => onRemoverTransacao(t.id)} 
                  className="btn-remover"
                  title="Remover transação"
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// GastosAgrupados (sem alterações)
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

// ModalDetalhesGasto (sem alterações)
function ModalDetalhesGasto({ data, onClose, onRemoverTransacao }) {
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
                <button 
                  onClick={() => onRemoverTransacao(t.id)} 
                  className="btn-remover-modal"
                  title="Remover transação"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

// KPI (sem alterações)
function KPI({ title, value, highlight }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="kpi-card" style={{ background: CARD_BG}}>
      <div className="kpi-card__title">{title}</div>
      <div className={`kpi-card__value ${highlight ? 'kpi-card__value--' + highlight : ''}`}>{value}</div>
    </motion.div>
  );
}

// PaginaAdicionarGasto (sem alterações)
function PaginaAdicionarGasto({ onAdicionarTransacao }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(getTodayLocalString());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!descricao.trim() || !valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0 || !data) {
      alert("Por favor, preencha a descrição, data e um valor válido.");
      return;
    }
    onAdicionarTransacao({ 
      descricao: descricao.trim(), 
      valor: parseFloat(valor),
      data: data 
    });
    setDescricao('');
    setValor('');
    setData(getTodayLocalString());
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
      <Card title="Adicionar Gasto">
        <form onSubmit={handleSubmit} className="adicionar-gasto-form">
          <div className="form-group">
            <label htmlFor="descricao">Descrição</label>
            <input id="descricao" type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Almoço" required />
          </div>
          <div className="form-group">
            <label htmlFor="valor">Valor (R$)</label>
            <input id="valor" type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="Ex: 25.50" step="0.01" min="0.01" required />
          </div>
          
          <div className="form-group">
            <label htmlFor="data">Data</label>
            <input 
              id="data" 
              type="date" 
              value={data} 
              onChange={e => setData(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="form-submit-btn" style={{ background: CARD_BORDER }}>Adicionar Gasto</button>
        </form>
      </Card>
    </motion.div>
  );
}

// PaginaImportarJSON (sem alterações)
function PaginaImportarJSON({ onImportarTransacoes }) {
  const [jsonInput, setJsonInput] = useState('');
  const [isImportando, setIsImportando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsImportando(true);

    let transacoesArray;
    try {
      const jsonLimpo = jsonInput.replace(/\u00A0/g, ' ');
      transacoesArray = JSON.parse(jsonLimpo);
    } catch (error) {
      console.error("Erro de Parse JSON:", error);
      alert("Erro no JSON. Verifique se o formato está correto. (Ex: [ { ... }, { ... } ])");
      setIsImportando(false);
      return;
    }
    if (!Array.isArray(transacoesArray)) {
      alert("O JSON deve ser um array (lista) de transações.");
      setIsImportando(false);
      return;
    }
    try {
      await onImportarTransacoes(transacoesArray);
    } catch (error) {
      console.error(error);
    }
    setIsImportando(false);
    setJsonInput('');
  };

  return (
    <motion.div 
      key="import-json-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10}}
      transition={{ duration: 0.3 }}
      className="adicionar-gasto-container"
    >
      <Card title="Importar Gastos com JSON">
        <form onSubmit={handleSubmit} className="adicionar-gasto-form">
          <div className="form-group">
            <label htmlFor="json-input">Cole seu JSON aqui</label>
            <textarea 
              id="json-input"
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              placeholder='[&#10;  { "Data": "09 OUT", "Nome": "Pg *99 Ride", "Valor": "R$ 13,08" },&#10;  { "Data": "10 OUT", "Nome": "Estorno", "Valor": "-R$ 45,50" }&#10;]'
              rows={10}
              required
            />
          </div>
          <button type="submit" className="form-submit-btn" style={{ background: CARD_BORDER }} disabled={isImportando}>
            {isImportando ? 'Importando...' : 'Importar Gastos'}
          </button>
        </form>
      </Card>
    </motion.div>
  );
}

// Card (sem alterações)
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