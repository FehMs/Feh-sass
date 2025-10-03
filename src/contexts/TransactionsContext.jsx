import React, { createContext, useState, useContext } from 'react';

const mockTransacoes = [
    { data: "2025-09-15", descricao: "Assinatura SaaS", valor: 59.90, tipo: "debito", forma_pagamento: "Cartão 8125" },
    { data: "2025-09-15", descricao: "IFD*IFood", valor: 35.50, tipo: "debito", forma_pagamento: "Cartão 8125" },
    { data: "2025-09-14", descricao: "Pagamento Cliente X", valor: 1200.00, tipo: "credito", forma_pagamento: "Pix" },
    { data: "2025-09-12", descricao: "Uber *Viagens", valor: 22.75, tipo: "debito", forma_pagamento: "Cartão 8125" },
];

const TransactionsContext = createContext();

export function TransactionsProvider({ children }) {
    const [transacoes, setTransacoes] = useState(mockTransacoes);

    const addTransaction = (novaTransacao) => {
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const dataFormatada = hoje.toISOString().split('T')[0];

        const transacaoCompleta = {
            ...novaTransacao,
            data: dataFormatada,
            tipo: 'debito',
            forma_pagamento: 'Cartão 8125',
        };


            setTransacoes(prevTransacoes => [...prevTransacoes, transacaoCompleta]);
    };

    const value = {
        transacoes,
        addTransaction,
    };

    return (
        <TransactionsContext.Provider value={value}>
            {children}
        </TransactionsContext.Provider>
    );
}


export function useTransactions() {
    return useContext(TransactionsContext);
}