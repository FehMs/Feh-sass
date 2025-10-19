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
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_482_4247)"><path d="M5 16H27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5 8H27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5 24H27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></g><defs><clipPath id="clip0_482_4247"><rect width="32" height="32" fill="white"></rect></clipPath></defs></svg>
          </div>
          
          <div 
            className={`menu ${isMenuOpen ? 'active' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className='headerMenu'>
              <span className='closeButton' onClick={toggleMenu}>&times;</span>
            </div>
            <ul>
              <li>Dashboard</li>
              <li>Relatórios</li>
              <li>Configurações</li>
            </ul>
          </div>

          <div className="logo">
            <a href="/">
              NeoWallet
            </a>
          </div>

          <div className="user-info">
            <nav>
              <Link to="/metas">Metas</Link>
            </nav>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.90039 20C7.50039 18.5 9.60039 17.5 12.0004 17.5C14.3004 17.5 16.5004 18.4 18.1004 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.1 9.40002C15.3 10.6 15.3 12.5 14.1 13.6C12.9 14.7 11 14.8 9.90002 13.6C8.80002 12.4 8.70002 10.5 9.90002 9.40002C11.1 8.30002 12.9 8.20002 14.1 9.40002" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M4 17C3.4 15.8 3 14.4 3 13C3 8 7 4 12 4C17 4 21 8 21 13C21 14.4 20.6 15.8 20 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            <button onClick={handleLogout} className="logout-button">
              Sair
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && <div className="modal-overlay" onClick={toggleMenu}></div>}
    </>
  );
}