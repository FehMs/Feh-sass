import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "../assets/css/metas.css";

const CARD_BG = "rgba(255,255,255,0.04)";
const COLORS = {
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  primary: "#3B82F6"
};

function numberToBRL(n) {
  if (typeof n !== 'number') return 'R$ 0,00';
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MetasGastos() {
  const [metaDiaria, setMetaDiaria] = useState(100);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [transacoes, setTransacoes] = useState([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [novaMetaInput, setNovaMetaInput] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const carregarMeta = async () => {
      const metaDocRef = doc(db, "metas", currentUser.uid);
      const metaDoc = await getDoc(metaDocRef);
      if (metaDoc.exists()) {
        setMetaDiaria(metaDoc.data().metaDiaria || 100);
      } else {
        await setDoc(metaDocRef, { metaDiaria: 100, userId: currentUser.uid });
        setMetaDiaria(100);
      }
    };
    carregarMeta();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setTransacoes([]);
      return;
    }

    setTransacoes([]); 

    const inicio = format(startOfMonth(mesAtual), 'yyyy-MM-dd');
    const fim = format(endOfMonth(mesAtual), 'yyyy-MM-dd');
    const q = query(
      collection(db, "transacoes"),
      where("userId", "==", currentUser.uid),
      where("data", ">=", inicio),
      where("data", "<=", fim)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransacoes(trans);
    });
    return () => unsubscribe();
  }, [currentUser, mesAtual]);

  const gastosPorDia = useMemo(() => {
    const mapa = new Map();
    transacoes.forEach(t => {
      const valorAtual = mapa.get(t.data) || 0;
      let novoValor = valorAtual;
      if (t.tipo === 'credito') {
        novoValor -= (t.valor || 0);
      } else { 
        novoValor += (t.valor || 0);
      }
      mapa.set(t.data, novoValor);
    });
    return mapa;
  }, [transacoes]);

  const quantidadePorDia = useMemo(() => {
    const mapa = new Map();
    transacoes.forEach(t => {
      const quantidadeAtual = mapa.get(t.data) || 0;
      mapa.set(t.data, quantidadeAtual + 1);
    });
    return mapa;
  }, [transacoes]);

  const saldoAcumulado = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 
    const inicioMes = startOfMonth(mesAtual);
    const fimMes = endOfMonth(mesAtual);

    if (inicioMes > hoje) {
      return 0;
    }

    const fimCalculo = hoje < fimMes ? hoje : fimMes;

    const dias = eachDayOfInterval({ start: inicioMes, end: fimCalculo });
    let saldo = 0;
    dias.forEach(dia => {
      const dataStr = format(dia, 'yyyy-MM-dd');
      const gastoLiquidoDia = gastosPorDia.get(dataStr) || 0;
      const diferenca = gastoLiquidoDia - metaDiaria;
      saldo += diferenca;
    });
    return saldo;
  }, [gastosPorDia, metaDiaria, mesAtual]);

  const salvarMeta = async () => {
    if (!currentUser || !novaMetaInput) return;
    const novaMeta = parseFloat(novaMetaInput);
    if (isNaN(novaMeta) || novaMeta <= 0) { alert("Valor inválido."); return; }
    await setDoc(doc(db, "metas", currentUser.uid), { metaDiaria: novaMeta, userId: currentUser.uid });
    setMetaDiaria(novaMeta);
    setEditandoMeta(false);
    setNovaMetaInput("");
  };

  const abrirDetalhes = (dia) => { setDiaSelecionado(dia); setDialogAberto(true); };

  const transacoesDia = useMemo(() => {
    if (!diaSelecionado) return [];
    const dataStr = format(diaSelecionado, 'yyyy-MM-dd');
    return transacoes.filter(t => t.data === dataStr);
  }, [diaSelecionado, transacoes]);

  const totalDiaLiquido = useMemo(() => {
    return transacoesDia.reduce((acc, t) => {
      if (t.tipo === 'credito') return acc - (t.valor || 0);
      return acc + (t.valor || 0);
    }, 0);
  }, [transacoesDia]);

  return (
    <>
      <div className="metas-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="metas-content" >
          <div className="metas-header"> <h1 className="metas-title">Metas de Gastos</h1> <p className="metas-subtitle">Acompanhe seus gastos diários</p> </div>
          <div className="metas-cards-grid">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="meta-card" style={{ background: CARD_BG }} >
              <div className="meta-card-header"> <h3 className="meta-card-title">Meta Diária</h3> <button onClick={() => { setNovaMetaInput(metaDiaria.toString()); setEditandoMeta(true); }} className="meta-edit-btn" >Editar</button> </div>
              <p className="meta-card-value">{numberToBRL(metaDiaria)}</p> <p className="meta-card-label">por dia</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="meta-card" style={{ background: CARD_BG }} >
              <h3 className="meta-card-title">Saldo Líquido (Mês)</h3>
              <p className={`meta-card-value ${Array.from(gastosPorDia.values()).reduce((a, b) => a + b, 0) > 0 ? 'meta-card-value--danger' : 'meta-card-value--success'}`}> {numberToBRL(Array.from(gastosPorDia.values()).reduce((a, b) => a + b, 0))} </p>
              <p className="meta-card-label">{format(mesAtual, "MMMM yyyy", { locale: ptBR })}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="meta-card" style={{ background: CARD_BG }} >
              <h3 className="meta-card-title"> {saldoAcumulado > 0 ? "Acima da Meta" : "Dentro da Meta"} </h3>
              <p className={`meta-card-value ${saldoAcumulado > 0 ? 'meta-card-value--danger' : 'meta-card-value--success'}`}> {numberToBRL(Math.abs(saldoAcumulado))} </p>
              <p className="meta-card-label"> {saldoAcumulado > 0 ? "acima" : "abaixo/dentro"} </p>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="calendario-section" style={{ background: CARD_BG }} >
            <div className="calendario-header"> <h2 className="calendario-title">{format(mesAtual, "MMMM yyyy", { locale: ptBR })}</h2> <div className="calendario-nav"> <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))} className="calendario-nav-btn">← Anterior</button> <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))} className="calendario-nav-btn">Próximo →</button> </div> </div>
            <CalendarioMetas mesAtual={mesAtual} gastosPorDia={gastosPorDia} quantidadePorDia={quantidadePorDia} metaDiaria={metaDiaria} onDiaClick={abrirDetalhes} />
          </motion.div>
        </motion.div>
        <AnimatePresence> {dialogAberto && ( <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDialogAberto(false)} > <motion.div className="modal-content modal-content--metas" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} > <div className="modal-header"> <h3>{diaSelecionado && format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}</h3> <button onClick={() => setDialogAberto(false)} className="modal-close-btn">&times;</button> </div> <div className="modal-body"> <div className="meta-detail-card"> <span className="meta-detail-label">Gasto Líquido Dia</span> <span className={`meta-detail-value ${totalDiaLiquido > 0 ? 'meta-detail-value--danger' : 'meta-detail-value--success'}`}>{numberToBRL(totalDiaLiquido)}</span> </div> <div className="meta-detail-card"> <span className="meta-detail-label">Meta do Dia</span> <span className="meta-detail-value-small">{numberToBRL(metaDiaria)}</span> </div> <div className={`meta-detail-card meta-detail-card--${totalDiaLiquido > metaDiaria ? 'danger' : 'success'}`}> <span className="meta-detail-label">Diferença</span> <span className={`meta-detail-value-small ${totalDiaLiquido > metaDiaria ? 'meta-detail-value--danger' : 'meta-detail-value--success'}`}> {totalDiaLiquido > metaDiaria ? '+' : ''}{numberToBRL(totalDiaLiquido - metaDiaria)} </span> </div> {transacoesDia.length > 0 && ( <div className="meta-transactions"> <h4 className="meta-transactions-title">Transações</h4> <div className="meta-transactions-list"> {transacoesDia.map(t => ( <div key={t.id} className="meta-transaction-item"> <span className="meta-transaction-desc">{t.descricao}</span> <span className={`meta-transaction-value ${t.tipo === 'credito' ? 'meta-transaction-value--credit' : ''}`}> {t.tipo === 'credito' ? '+' : ''}{numberToBRL(t.valor)} </span> </div> ))} </div> </div> )} </div> </motion.div> </motion.div> )} </AnimatePresence>
        <AnimatePresence> {editandoMeta && ( <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditandoMeta(false)} > <motion.div className="modal-content modal-content--edit" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} > <div className="modal-header"><h3>Editar Meta Diária</h3><button onClick={() => setEditandoMeta(false)} className="modal-close-btn">&times;</button></div> <div className="modal-body"> <div className="form-group"> <label htmlFor="nova-meta" className="form-label">Nova Meta (R$)</label> <input id="nova-meta" type="number" value={novaMetaInput} onChange={(e) => setNovaMetaInput(e.target.value)} placeholder="Ex: 100" step="0.01" min="0.01" className="form-input" /> </div> <div className="modal-actions"> <button onClick={() => { setEditandoMeta(false); setNovaMetaInput(""); }} className="modal-btn modal-btn--secondary">Cancelar</button> <button onClick={salvarMeta} className="modal-btn modal-btn--primary">Salvar Meta</button> </div> </div> </motion.div> </motion.div> )} </AnimatePresence>
      </div>
    </>
  );
}

function CalendarioMetas({ mesAtual, gastosPorDia, quantidadePorDia, metaDiaria, onDiaClick }) {
  const dias = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual)
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); 
  const primeiroDiaSemana = startOfMonth(mesAtual).getDay(); 

  return (
    <div className="calendario-grid">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
        <div key={dia} className="calendario-weekday">{dia}</div>
      ))}

      {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
        <div key={`empty-${i}`} /> 
      ))}

      {dias.map(dia => {
        const diaAtualLoop = new Date(dia);
        diaAtualLoop.setHours(0, 0, 0, 0);

        const dataStr = format(diaAtualLoop, 'yyyy-MM-dd');
        const gastoLiquido = gastosPorDia.get(dataStr) || 0;
        const quantidade = quantidadePorDia.get(dataStr) || 0;
        
        const excedeu = gastoLiquido > metaDiaria;
        
        const ehHoje = isSameDay(diaAtualLoop, hoje);
        const ehFuturo = diaAtualLoop > hoje;
        const ehPassado = diaAtualLoop < hoje;

        let className = 'calendario-day';
        if (ehFuturo) className += ' calendario-day--futuro';
        if (ehHoje) className += ' calendario-day--hoje';
        
        if (ehPassado || ehHoje) {
             if (gastosPorDia.has(dataStr) || (ehPassado && !gastosPorDia.has(dataStr))) {
                 className += excedeu ? ' calendario-day--excedeu' : ' calendario-day--ok';
             }
        }

        return (
          <motion.button
            key={dataStr}
            whileHover={{ scale: ehFuturo ? 1 : 1.05 }}
            whileTap={{ scale: ehFuturo ? 1 : 0.95 }}
            onClick={() => !ehFuturo && onDiaClick(diaAtualLoop)} 
            disabled={ehFuturo}
            className={className}
          >
            <div className="calendario-day-number">{format(diaAtualLoop, 'd')}</div>

            {quantidade > 0 && !ehFuturo && (
              <>
                <div className={`calendario-day-value ${excedeu ? 'calendario-day-value--danger' : 'calendario-day-value--success'}`}>
                  {numberToBRL(gastoLiquido)}
                </div>
                 <div className="calendario-day-count">
                    {quantidade} {quantidade === 1 ? 'trans.' : 'trans.'}
                 </div>
              </>
            )}
            
            {(ehPassado || ehHoje) && (
              <div className="calendario-day-indicator">
                <div className={`calendario-day-dot ${excedeu ? 'calendario-day-dot--danger' : 'calendario-day-dot--success'}`} />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}