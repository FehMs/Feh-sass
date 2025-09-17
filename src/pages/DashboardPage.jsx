import Header from '../components/header';
import { useAuth } from '../contexts/AuthContext';
import "../assets/css/dashboard.css"

export default function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <>
      <Header />
      
      <div className="page__dashboard">
        <h2>Dashboard</h2>
        <h3>Olá, {currentUser?.email}!</h3>
        <p>Este é o seu painel de controle. Bem-vindo(a) ao seu SaaS!</p>
      </div>
    </>
  );
}