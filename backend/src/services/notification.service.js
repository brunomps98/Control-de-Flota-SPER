import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { __dirname } from '../utils.js'; 

// Determinamos dónde leer la clave
const isProduction = process.env.NODE_ENV === 'production';

const serviceAccountPath = isProduction 
    ? '/etc/secrets/firebase-service-account.json' 
    : path.join(__dirname, './config/firebase-service-account.json');

try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK inicializado correctamente.');

} catch (error) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    if (!isProduction) {
        console.warn('Asegúrate de tener el archivo "firebase-service-account.json" en la carpeta "src/config/" para pruebas locales.');
    }
}


/**
 * @summary Envía una notificación push a un token de dispositivo específico
 * @param {string} fcmToken - El token de Firebase del dispositivo
 * @param {string} title - El título de la notificación
 * @param {string} body - El cuerpo del mensaje
 * @param {object} data - Datos adicionales (ej. a qué chat abrir)
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken) {
        console.warn('[FCM] Intento de envío sin token.');
        return;
    }

    const message = {
        token: fcmToken,
        notification: {
            title: title,
            body: body,
        },
        data: data, 
        android: { 
            priority: 'high',
            notification: {
                sound: 'default',
                click_action: 'FLUTTER_NOTIFICATION_CLICK' 
            }
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('[FCM] Notificación enviada:', response);
    } catch (error) {
        console.error('[FCM] Error al enviar notificación:', error);
    }
};