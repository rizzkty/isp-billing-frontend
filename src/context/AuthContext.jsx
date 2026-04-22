import { createContext, useState, useContext } from 'react';

// Membuat "kotak memori"
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // State untuk menyimpan data user yang login
    const [user, setUser] = useState(null);

    // Fungsi untuk login (Sementara pura-pura dulu sebelum ada database)
    const login = (username, role) => {
        setUser({ username, role });
    };

    // Fungsi untuk logout
    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Fungsi bantuan agar komponen lain gampang mengambil data user
export const useAuth = () => useContext(AuthContext);
