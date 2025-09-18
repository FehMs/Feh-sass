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
          NeoWallet
        </div>
        <div className="user-info">
          {/* Mostra o email do usuário se ele estiver logado */}
          {currentUser && <span className="user-email">{currentUser.email}</span>}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.90039 20C7.50039 18.5 9.60039 17.5 12.0004 17.5C14.3004 17.5 16.5004 18.4 18.1004 20" stroke="#4D4D4D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14.1 9.40002C15.3 10.6 15.3 12.5 14.1 13.6C12.9 14.7 11 14.8 9.90002 13.6C8.80002 12.4 8.70002 10.5 9.90002 9.40002C11.1 8.30002 12.9 8.20002 14.1 9.40002" stroke="#4D4D4D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 17C3.4 15.8 3 14.4 3 13C3 8 7 4 12 4C17 4 21 8 21 13C21 14.4 20.6 15.8 20 17" stroke="#4D4D4D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}