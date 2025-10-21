import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Wallet,
  Home,
  Zap,
  ShoppingCart,
  Coffee,
  Car,
  Heart,
  MoreHorizontal,
  TrendingUp,
  Check,
  X
} from "lucide-react";
import { db } from "../firebase/config";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/budgetPlanner.css";

const CATEGORY_ICONS = {
  moradia: Home,
  utilities: Zap,
  alimentacao: ShoppingCart,
  transporte: Car,
  lazer: Coffee,
  saude: Heart,
  outros: MoreHorizontal,
};

export default function BudgetPlanner() {
  const { currentUser } = useAuth();
  const [budgetDoc, setBudgetDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [tempSalary, setTempSalary] = useState("");
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [additionalIncomes, setAdditionalIncomes] = useState([]);
  
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "outros"
  });

  const [newIncome, setNewIncome] = useState({
    description: "",
    amount: ""
  });

  // Load data from Firebase
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const budgetRef = collection(db, "budgets");
    const q = query(budgetRef, where("userId", "==", currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        const data = { id: docData.id, ...docData.data() };
        setBudgetDoc(data);
        setMonthlySalary(data.monthlySalary || 0);
        setFixedExpenses(data.fixedExpenses || []);
        setVariableExpenses(data.variableExpenses || []);
        setAdditionalIncomes(data.additionalIncomes || []);
      } else {
        // Create initial document
        addDoc(collection(db, "budgets"), {
          userId: currentUser.uid,
          monthlySalary: 0,
          fixedExpenses: [],
          variableExpenses: [],
          additionalIncomes: [],
          criadoEm: serverTimestamp()
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const updateBudgetDoc = async (updates) => {
    if (!budgetDoc?.id) return;
    
    try {
      await updateDoc(doc(db, "budgets", budgetDoc.id), updates);
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      alert("Erro ao salvar alterações.");
    }
  };

  const totalIncome = useMemo(() => {
    return monthlySalary + additionalIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  }, [monthlySalary, additionalIncomes]);

  const totalFixedExpenses = useMemo(() => {
    return fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [fixedExpenses]);

  const totalVariableExpenses = useMemo(() => {
    return variableExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [variableExpenses]);

  const totalExpenses = totalFixedExpenses + totalVariableExpenses;
  const remainingBudget = totalIncome - totalExpenses;
  const budgetPercentage = totalIncome > 0 ? (remainingBudget / totalIncome) * 100 : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSaveSalary = async () => {
    const salary = parseFloat(tempSalary);
    if (isNaN(salary) || salary < 0) {
      alert("Digite um valor válido");
      return;
    }

    setMonthlySalary(salary);
    await updateBudgetDoc({ monthlySalary: salary });
    setShowSalaryModal(false);
    setTempSalary("");
  };

  const addFixedExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      alert("Preencha todos os campos");
      return;
    }

    const expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category
    };

    const updated = [...fixedExpenses, expense];
    setFixedExpenses(updated);
    await updateBudgetDoc({ fixedExpenses: updated });
    
    setNewExpense({ description: "", amount: "", category: "outros" });
    setShowFixedModal(false);
  };

  const addVariableExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      alert("Preencha todos os campos");
      return;
    }

    const expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category
    };

    const updated = [...variableExpenses, expense];
    setVariableExpenses(updated);
    await updateBudgetDoc({ variableExpenses: updated });
    
    setNewExpense({ description: "", amount: "", category: "outros" });
    setShowVariableModal(false);
  };

  const addIncome = async () => {
    if (!newIncome.description || !newIncome.amount) {
      alert("Preencha todos os campos");
      return;
    }

    const income = {
      id: Date.now().toString(),
      description: newIncome.description,
      amount: parseFloat(newIncome.amount)
    };

    const updated = [...additionalIncomes, income];
    setAdditionalIncomes(updated);
    await updateBudgetDoc({ additionalIncomes: updated });
    
    setNewIncome({ description: "", amount: "" });
    setShowIncomeModal(false);
  };

  const confirmDelete = (id, type) => {
    setDeleteTarget({ id, type });
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    const { id, type } = deleteTarget;

    if (type === 'fixed') {
      const updated = fixedExpenses.filter(exp => exp.id !== id);
      setFixedExpenses(updated);
      await updateBudgetDoc({ fixedExpenses: updated });
    } else if (type === 'variable') {
      const updated = variableExpenses.filter(exp => exp.id !== id);
      setVariableExpenses(updated);
      await updateBudgetDoc({ variableExpenses: updated });
    } else if (type === 'income') {
      const updated = additionalIncomes.filter(inc => inc.id !== id);
      setAdditionalIncomes(updated);
      await updateBudgetDoc({ additionalIncomes: updated });
    }

    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const circleRadius = 88;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressOffset = circleCircumference * (1 - Math.max(0, budgetPercentage) / 100);

  if (loading) {
    return (
      <div className="budget-container">
        <div className="budget-content">
          <div className="budget-header fade-in">
            <h1 className="budget-title">Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="budget-container">
        <div className="budget-content">
          <div className="budget-header fade-in">
            <h1 className="budget-title">Faça login para acessar</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-container">
      <div className="budget-content">
        <div className="budget-header fade-in">
          <h1 className="budget-title">Planejamento Financeiro</h1>
          <p className="budget-subtitle">Organize seu orçamento mensal</p>
        </div>

        <div className="budget-grid">
          <div>
            <div className="glass-card fade-in">
              <div className="glass-card-header">
                <h3 className="glass-card-title">Restante para Gastar</h3>
              </div>
              <div className="glass-card-body">
                <div className="circular-progress-container">
                  <div className="circular-progress">
                    <svg width="200" height="200">
                      <circle
                        cx="100"
                        cy="100"
                        r={circleRadius}
                        strokeWidth="16"
                        fill="none"
                        className="circular-progress-bg"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r={circleRadius}
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={progressOffset}
                        className={`circular-progress-bar ${
                          budgetPercentage > 30 ? 'success' : 
                          budgetPercentage > 0 ? 'warning' : 
                          'danger'
                        }`}
                      />
                    </svg>
                    <div className="circular-progress-text">
                      <div className={`circular-progress-value ${remainingBudget >= 0 ? 'success' : 'danger'}`}>
                        {formatCurrency(remainingBudget)}
                      </div>
                      <div className="circular-progress-label">
                        {budgetPercentage.toFixed(1)}% disponível
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card fade-in">
              <div className="glass-card-header">
                <h3 className="glass-card-title">
                  <Wallet />
                  Salário Mensal
                </h3>
                <button className="btn-icon" onClick={() => {
                  setTempSalary(monthlySalary.toString());
                  setShowSalaryModal(true);
                }}>
                  <Plus />
                </button>
              </div>
              <div className="glass-card-body">
                <div className="salary-display">
                  <div className="salary-value">{formatCurrency(monthlySalary)}</div>
                </div>
              </div>
            </div>

            <div className="glass-card fade-in">
              <div className="glass-card-header">
                <h3 className="glass-card-title">
                  <TrendingUp />
                  Receitas Adicionais
                </h3>
                <button className="btn-icon" onClick={() => setShowIncomeModal(true)}>
                  <Plus />
                </button>
              </div>
              <div className="glass-card-body">
                <div className="item-list">
                  {additionalIncomes.map((income) => (
                    <div key={income.id} className="item slide-in">
                      <div className="item-content">
                        <div className="item-info">
                          <div className="item-description">{income.description}</div>
                          <div className="item-value success">
                            {formatCurrency(income.amount)}
                          </div>
                        </div>
                      </div>
                      <button className="btn-ghost" onClick={() => confirmDelete(income.id, 'income')}>
                        <Trash2 />
                      </button>
                    </div>
                  ))}
                </div>

                {additionalIncomes.length === 0 && (
                  <div className="empty-state">Nenhuma receita adicional</div>
                )}

                <div className="summary-row total">
                  <span>Total de Receitas</span>
                  <span className="summary-value success">{formatCurrency(totalIncome)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="glass-card fade-in">
              <div className="glass-card-header">
                <h3 className="glass-card-title">
                  <Home />
                  Despesas Fixas
                </h3>
                <button className="btn-icon" onClick={() => setShowFixedModal(true)}>
                  <Plus />
                </button>
              </div>
              <div className="glass-card-body">
                <div className="item-list">
                  {fixedExpenses.map((expense) => {
                    const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal;
                    return (
                      <div key={expense.id} className="item slide-in">
                        <div className="item-content">
                          <div className="item-icon danger">
                            <Icon />
                          </div>
                          <div className="item-info">
                            <div className="item-description">{expense.description}</div>
                            <div className="item-value danger">
                              {formatCurrency(expense.amount)}
                            </div>
                          </div>
                        </div>
                        <button className="btn-ghost" onClick={() => confirmDelete(expense.id, 'fixed')}>
                          <Trash2 />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {fixedExpenses.length === 0 && (
                  <div className="empty-state">Nenhuma despesa fixa cadastrada</div>
                )}

                <div className="summary-row total">
                  <span>Total Fixas</span>
                  <span className="summary-value danger">{formatCurrency(totalFixedExpenses)}</span>
                </div>
              </div>
            </div>

            <div className="glass-card fade-in">
              <div className="glass-card-header">
                <h3 className="glass-card-title">Resumo do Mês</h3>
              </div>
              <div className="glass-card-body">
                <div className="summary-row">
                  <span className="summary-label">Total Receitas</span>
                  <span className="summary-value success">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total Despesas</span>
                  <span className="summary-value danger">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="summary-row total">
                  <span>Saldo</span>
                  <span className={`summary-value ${remainingBudget >= 0 ? 'success' : 'danger'}`}>
                    {formatCurrency(remainingBudget)}
                  </span>
                </div>
                {remainingBudget < 0 && (
                  <div className="alert danger">
                    ⚠️ Atenção: Suas despesas excedem suas receitas!
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="glass-card fade-in">
              <div className="glass-card-header">
                <h3 className="glass-card-title">
                  <ShoppingCart />
                  Despesas Variáveis
                </h3>
                <button className="btn-icon" onClick={() => setShowVariableModal(true)}>
                  <Plus />
                </button>
              </div>
              <div className="glass-card-body">
                <div className="item-list">
                  {variableExpenses.map((expense) => {
                    const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal;
                    return (
                      <div key={expense.id} className="item slide-in">
                        <div className="item-content">
                          <div className="item-icon warning">
                            <Icon />
                          </div>
                          <div className="item-info">
                            <div className="item-description">{expense.description}</div>
                            <div className="item-value warning">
                              {formatCurrency(expense.amount)}
                            </div>
                          </div>
                        </div>
                        <button className="btn-ghost" onClick={() => confirmDelete(expense.id, 'variable')}>
                          <Trash2 />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {variableExpenses.length === 0 && (
                  <div className="empty-state">Nenhuma despesa variável cadastrada</div>
                )}

                <div className="summary-row total">
                  <span>Total Variáveis</span>
                  <span className="summary-value warning">{formatCurrency(totalVariableExpenses)}</span>
                </div>
              </div>
            </div>

            <div className="glass-card fade-in">
              <div className="glass-card-header">
                <h3 className="glass-card-title">
                  <TrendingUp />
                  Previsão de Gastos
                </h3>
              </div>
              <div className="glass-card-body">
                <div className="progress-item">
                  <div className="progress-header">
                    <span className="progress-label">Despesas Fixas</span>
                    <span className="progress-value">{formatCurrency(totalFixedExpenses)}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar danger"
                      style={{ width: `${totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-header">
                    <span className="progress-label">Despesas Variáveis</span>
                    <span className="progress-value">{formatCurrency(totalVariableExpenses)}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar warning"
                      style={{ width: `${totalIncome > 0 ? (totalVariableExpenses / totalIncome) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-header">
                    <span className="progress-label">Disponível</span>
                    <span className="progress-value">{formatCurrency(Math.max(0, remainingBudget))}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar success"
                      style={{ width: `${Math.max(0, budgetPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="forecast-info">
                  <p className="forecast-text">
                    {remainingBudget >= 0
                      ? `Você está ${budgetPercentage.toFixed(0)}% dentro do orçamento! Continue assim.`
                      : `Você está gastando ${Math.abs(budgetPercentage).toFixed(0)}% acima do orçamento. Revise suas despesas.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Confirmar Salário */}
      <div className={`modal-overlay ${!showSalaryModal && 'hidden'}`} onClick={() => setShowSalaryModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Confirmar Salário Mensal</h3>
            <button className="modal-close" onClick={() => setShowSalaryModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={tempSalary}
                onChange={(e) => setTempSalary(e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSalaryModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveSalary}>
                <Check />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Delete Confirmation */}
      <div className={`modal-overlay ${!showDeleteModal && 'hidden'}`} onClick={() => setShowDeleteModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Confirmar Exclusão</h3>
            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p style={{ color: 'rgba(203, 213, 225, 0.9)', marginBottom: '1.5rem' }}>
              Tem certeza que deseja remover este item?
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                <X />
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={executeDelete} style={{ background: '#EF4444' }}>
                <Trash2 />
                Remover
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Despesa Fixa */}
      <div className={`modal-overlay ${!showFixedModal && 'hidden'}`} onClick={() => setShowFixedModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Adicionar Despesa Fixa</h3>
            <button className="modal-close" onClick={() => setShowFixedModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Aluguel"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="glass-select"
              >
                <option value="moradia">Moradia</option>
                <option value="utilities">Utilities</option>
                <option value="alimentacao">Alimentação</option>
                <option value="transporte">Transporte</option>
                <option value="saude">Saúde</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => {
                setShowFixedModal(false);
                setNewExpense({ description: "", amount: "", category: "outros" });
              }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={addFixedExpense}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Despesa Variável */}
      <div className={`modal-overlay ${!showVariableModal && 'hidden'}`} onClick={() => setShowVariableModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Adicionar Despesa Variável</h3>
            <button className="modal-close" onClick={() => setShowVariableModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Supermercado"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Valor Estimado (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="glass-select"
              >
                <option value="alimentacao">Alimentação</option>
                <option value="transporte">Transporte</option>
                <option value="lazer">Lazer</option>
                <option value="saude">Saúde</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => {
                setShowVariableModal(false);
                setNewExpense({ description: "", amount: "", category: "outros" });
              }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={addVariableExpense}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Receita */}
      <div className={`modal-overlay ${!showIncomeModal && 'hidden'}`} onClick={() => setShowIncomeModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Adicionar Receita Adicional</h3>
            <button className="modal-close" onClick={() => setShowIncomeModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Freelance"
                value={newIncome.description}
                onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={newIncome.amount}
                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => {
                setShowIncomeModal(false);
                setNewIncome({ description: "", amount: "" });
              }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={addIncome}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}