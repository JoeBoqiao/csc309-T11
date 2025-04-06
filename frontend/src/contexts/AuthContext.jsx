import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// 获取后端地址（来自 .env 文件）
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // 页面加载时自动检查 token 并恢复登录状态
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            return;
        }

        fetch(`${BACKEND_URL}/user/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(async (res) => {
                if (!res.ok) throw await res.json();
                return res.json();
            })
            .then((data) => {
                setUser(data.user);
            })
            .catch(() => {
                localStorage.removeItem("token");
                setUser(null);
            });
    }, []);

    /**
     * 登出函数
     */
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    /**
     * 登录函数
     */
    const login = async (username, password) => {
        try {
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const error = await res.json();
                return error.message;
            }

            const data = await res.json();
            localStorage.setItem("token", data.token);

            const profileRes = await fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    Authorization: `Bearer ${data.token}`,
                },
            });

            const profileData = await profileRes.json();
            setUser(profileData.user);
            navigate("/profile");
        } catch (error) {
            return "Something went wrong";
        }
    };

    /**
     * 注册函数
     */
    const register = async ({ username, firstname, lastname, password }) => {
        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, firstname, lastname, password }),
            });

            if (!res.ok) {
                const error = await res.json();
                return error.message;
            }

            navigate("/success");
        } catch (error) {
            return "Something went wrong";
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};
