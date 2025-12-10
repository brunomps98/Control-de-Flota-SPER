// Archivo de configuración de socketIO

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();
// Seteamos URL y variables de entorno para que funcione en capacitor tambien
const SOCKET_URL = platform === 'android' 
    ? 'https://control-de-flota-backend.onrender.com' 
    : import.meta.env.VITE_API_URL;


const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token'); 

        if (!token) {
            return;
        }


        const newSocket = io(SOCKET_URL, {
            auth: {
                token: token 
            },
            path: "/socket.io/",
            transports: ['websocket'],
            upgrade: false 
        });

        setSocket(newSocket);

        // Manejo de eventos de conexión
        newSocket.on('connect', () => {
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket.io: Error de conexión ', err.message);
        });

        newSocket.on('disconnect', () => {
        });

        // Función de limpieza: se desconecta cuando el componente se desmonta
        return () => {
            newSocket.disconnect();
        };

    }, []); // El array vacío [] asegura que esto se ejecute solo una vez

    // Proveemos el socket al resto de la aplicación
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};