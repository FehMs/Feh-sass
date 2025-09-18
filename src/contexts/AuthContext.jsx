import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  // 1. NOVAS IMPORTAÇÕES PARA O LOGIN COM GOOGLE
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Funções de autenticação existentes
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  // 2. NOVA FUNÇÃO PARA LOGIN COM GOOGLE
  function signInWithGoogle() {
    // Cria uma instância do provedor do Google
    const provider = new GoogleAuthProvider();
    // Abre o pop-up de login do Google
    return signInWithPopup(auth, provider);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    signInWithGoogle // 3. ADICIONA A NOVA FUNÇÃO AO CONTEXTO
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}