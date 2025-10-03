import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../contexts/TransactionsContext'; 

const CARD_BORDER = "linear-gradient(120deg, #3B82F6 0%, #9333EA 100%)";


export default function AddExpensePage() {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const { addTransaction } = useTransactions();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!descricao.trim() || !valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
            alert("Por favor, preencha a descrição e um valor válido.");
            return;
        }

        addTransaction({ descricao: descricao.trim(), valor: parseFloat(valor) });

        navigate('/');
    };

    return (
        <motion.div
            key="add-gasto-view"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }} className="adicionar-gasto-container"
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
