import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { db } from "../firebase/config"; 
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CARD_BORDER = "linear-gradient(120deg, #3B82F6 0%, #9333EA 100%)";

function Card({ title, children }) {
    return (
        <motion.section 
            initial={{ opacity: 0, y: 8 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.5 }} 
            className="content-card" 
            style={{ background: 'rgba(255,255,255,0.04)' }}
        >
            <div className="content-card__header">
                <h3 className="content-card__title">{title}</h3>
            </div>
            {children}
        </motion.section>
    );
}


export default function AddExpensePage() {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validação (continua a mesma)
        if (!descricao.trim() || !valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
            alert("Por favor, preencha a descrição e um valor válido.");
            return;
        }

        if (!currentUser) {
            alert("Erro: usuário não autenticado.");
            return;
        }

        setIsLoading(true);

        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const dataFormatada = hoje.toISOString().split('T')[0];

        try {
            await addDoc(collection(db, "transacoes"), {
                descricao: descricao.trim(),
                valor: parseFloat(valor),
                data: dataFormatada,
                tipo: 'debito',
                userId: currentUser.uid,
                criadoEm: serverTimestamp()
            });

            navigate('/');

        } catch (error) {
            console.error("Erro ao adicionar gasto: ", error);
            alert("Não foi possível adicionar o gasto. Tente novamente.");
            setIsLoading(false);
        }
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
                    <button type="submit" className="form-submit-btn" style={{ background: CARD_BORDER }} disabled={isLoading}>
                        {isLoading ? 'Adicionando...' : 'Adicionar Gasto'}
                    </button>
                </form>
            </Card>
        </motion.div>
    );
}