import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../assets/css/header.css'; // A importação original foi restaurada
import { Link } from 'react-router-dom';

export default function Header() {
  // A lógica de autenticação e navegação foi restaurada
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // O estado para o menu foi mantido
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Falha ao fazer logout", error);
    }
  }

  // A função para controlar o menu foi mantida
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <div className='menu__mobile' onClick={toggleMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="35px" height="35px" viewBox="0 0 24 24" fill="none">
            <path d="M4 6H20M4 12H14M4 18H9" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <div 
            className={`menu ${isMenuOpen ? 'active' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className='headerMenu'>
              <svg onClick={toggleMenu} xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ccc" height="20px" width="20px" version="1.1" stroke-width="1" id="Capa_1" viewBox="0 0 460.775 460.775" xml:space="preserve">
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"/>
              </svg>
            </div>
            <ul>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/metas">Metas</Link></li>
              <li>Configurações</li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.90039 20C7.50039 18.5 9.60039 17.5 12.0004 17.5C14.3004 17.5 16.5004 18.4 18.1004 20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14.1 9.40002C15.3 10.6 15.3 12.5 14.1 13.6C12.9 14.7 11 14.8 9.90002 13.6C8.80002 12.4 8.70002 10.5 9.90002 9.40002C11.1 8.30002 12.9 8.20002 14.1 9.40002" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 17C3.4 15.8 3 14.4 3 13C3 8 7 4 12 4C17 4 21 8 21 13C21 14.4 20.6 15.8 20 17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                Conta
              </li>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </ul>
          </div>

          <div className="logo">
            <a href="/">
              NeoWallet
            </a>
          </div>

          <div className="user-info">
            <nav className='navbar'>
              <Link to="/metas">Metas</Link>
            </nav>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.90039 20C7.50039 18.5 9.60039 17.5 12.0004 17.5C14.3004 17.5 16.5004 18.4 18.1004 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.1 9.40002C15.3 10.6 15.3 12.5 14.1 13.6C12.9 14.7 11 14.8 9.90002 13.6C8.80002 12.4 8.70002 10.5 9.90002 9.40002C11.1 8.30002 12.9 8.20002 14.1 9.40002" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M4 17C3.4 15.8 3 14.4 3 13C3 8 7 4 12 4C17 4 21 8 21 13C21 14.4 20.6 15.8 20 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </div>
        </div>
        {isMenuOpen && <div className="modal-overlay" onClick={toggleMenu}></div>}
      </header>
    </>
  );
}