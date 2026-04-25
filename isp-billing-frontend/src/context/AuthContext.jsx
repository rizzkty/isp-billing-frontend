import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. Ambil sesi yang tersimpan (User + Token)
    const [auth, setAuth] = useState(() => {
        const savedAuth = localStorage.getItem('isp_auth');
        return savedAuth ? JSON.parse(savedAuth) : { user: null, token: null };
    });

    // 2. Fungsi Login: Simpan User & Token ke State dan LocalStorage
    const login = (userData, token) => {
        const authData = { user: userData, token };
        setAuth(authData);
        localStorage.setItem('isp_auth', JSON.stringify(authData));
    };

    // 3. Fungsi Logout: Bersihkan State dan LocalStorage
    const logout = () => {
        setAuth({ user: null, token: null });
        localStorage.removeItem('isp_auth');
    };

    return (
        <AuthContext.Provider value={{ ...auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);