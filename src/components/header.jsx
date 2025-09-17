import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../assets/css/header.css'; // Vamos criar este arquivo de estilo

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      // Após o logout, redireciona o usuário para a página de login
      navigate('/login');
    } catch (error) {
      console.error("Falha ao fazer logout", error);
      // Você pode adicionar uma mensagem de erro para o usuário aqui
    }
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          MeuSaaS
        </div>
        <div className="user-info">
          {/* Mostra o email do usuário se ele estiver logado */}
          {currentUser && <span className="user-email">{currentUser.email}</span>}
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}