import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL;
const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token'); 

        if (!token) {
            console.log("Socket: Usuario no logueado, no se conectará.");
            return;
        }

        const newSocket = io(SOCKET_URL, {
            auth: {
                token: token 
            },
            path: "/socket.io/"
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket.io: Conectado al servidor ✅ ID:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket.io: Error de conexión ❌', err.message);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket.io: Desconectado del servidor 🔌');
        });

        return () => {
            newSocket.disconnect();
        };

    }, []); 

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};