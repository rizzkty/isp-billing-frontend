import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. Saat aplikasi dibuka, cek dulu apakah ada "KTP" yang tersimpan di browser
    const [user, setUser] = useState(() => {
        const savedSession = localStorage.getItem('isp_session');
        return savedSession ? JSON.parse(savedSession) : null;
    });

    // 2. Fungsi Login: Simpan "KTP" ke dalam memori browser (localStorage)
    const login = (username, role) => {
        const userData = { username, role };
        setUser(userData);
        localStorage.setItem('isp_session', JSON.stringify(userData));
    };

    // 3. Fungsi Logout: Bakar "KTP" dari memori browser
    const logout = () => {
        setUser(null);
        localStorage.removeItem('isp_session');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);