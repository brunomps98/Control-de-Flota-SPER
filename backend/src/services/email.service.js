import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM; 

const SAFE_DEMO_EMAIL = ['controldeflotasper@gmail.com']; 

// Nuevo ticket de soporte
export const sendNewTicketEmail = async (adminEmails, ticketData, fileUrls = []) => {

    let filesHtml = '<p>No se adjuntaron archivos.</p>';
    if (fileUrls.length > 0) {
        filesHtml = '<ul>' + fileUrls.map(url => `<li><a href="${url}">Ver Archivo Adjunto</a></li>`).join('') + '</ul>';
    }

    const htmlBody = `
        <h1>Nuevo Ticket de Soporte Recibido</h1>
        <p>Se ha generado un nuevo caso de soporte desde el formulario público.</p>
        <hr>
        <h2>Detalles del Caso:</h2>
        <ul>
            <li><strong>Nombre:</strong> ${ticketData.name} ${ticketData.surname}</li>
            <li><strong>Email:</strong> ${ticketData.email}</li>
            <li><strong>Teléfono:</strong> ${ticketData.phone}</li>
        </ul>
        <h2>Descripción del Problema:</h2>
        <p>${ticketData.problem_description}</p>
        <h2>Archivos Adjuntos:</h2>
        ${filesHtml}
        <hr>
        <p>Ingresa al panel de administración para gestionarlo.</p>
    `;

    try {
        await resend.emails.send({
            from: FROM, 
            to: SAFE_DEMO_EMAIL, 
            subject: `Nuevo Ticket: ${ticketData.problem_description.substring(0, 30)}...`,
            html: htmlBody
        });
        console.log("✅ [Ticket] Correo enviado con Resend");
    } catch (error) {
        console.error("[Email Service] Error al enviar correo:", error);
    }
};

// Reseteo de contraseña
export const sendPasswordResetEmail = async (userEmail, resetLink) => {

    const htmlBody = `
        <h1>Restablecimiento de Contraseña</h1>
        <p>Has solicitado restablecer tu contraseña para el usuario: <strong>${userEmail}</strong></p>
        <p>Haz clic en el siguiente enlace (válido por 15 minutos):</p>
        <a href="${resetLink}" style="background:#009688;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">
            Restablecer Contraseña
        </a>
        <hr>
        <p>⚠️ NOTA MODO DEMO: Este correo fue redirigido a tu cuenta admin porque estás en Sandbox.</p>
    `;

    try {
        await resend.emails.send({
            from: FROM,
            to: SAFE_DEMO_EMAIL, 
            subject: 'Restablecimiento de tu contraseña (Modo Demo)',
            html: htmlBody
        });
        console.log(`✅ [Password] Reset enviado a ${SAFE_DEMO_EMAIL} (Original: ${userEmail})`);
    } catch (error) {
        console.error("[Email Service] Error al enviar correo:", error);
    }
};

// Acción en vehiculo
export const sendVehicleActionEmail = async (adminEmails, actionType, user, vehicleData) => {

    const subjectAction = actionType === 'CREATE' ? 'Nuevo Vehículo Cargado' : 'Vehículo Actualizado';
    const color = actionType === 'CREATE' ? '#4CAF50' : '#2196F3';

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: ${color};">${subjectAction}</h1>
            <p>Usuario: <strong>${user.username}</strong> (${user.unidad})</p>
            <hr>
            <h3>Detalles:</h3>
            <ul>
                <li><strong>Dominio:</strong> ${vehicleData.dominio || 'N/A'}</li>
                <li><strong>Marca/Modelo:</strong> ${vehicleData.marca} ${vehicleData.modelo}</li>
                <li><strong>Unidad:</strong> ${vehicleData.title}</li>
            </ul>
        </div>
    `;

    try {
        await resend.emails.send({
            from: FROM,
            to: SAFE_DEMO_EMAIL, 
            subject: `📢 ${subjectAction}: ${vehicleData.dominio}`,
            html: htmlBody
        });
        console.log("✅ [Vehicle] Notificación enviada");
    } catch (error) {
        console.error("[Email Service] Error:", error);
    }
};

// Mensaje de chat 
export const sendNewMessageEmail = async (adminEmails, senderName, senderUnit, messageContent) => {

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: #009688;">Nuevo Mensaje de Chat</h1>
            <p><strong>${senderName}</strong> (${senderUnit}) envió un mensaje:</p>
            <blockquote style="background:#f4f4f4;padding:10px;border-radius:5px;">
                "${messageContent}"
            </blockquote>
            <p>Ingresa al panel para responder.</p>
        </div>
    `;

    try {
        await resend.emails.send({
            from: FROM,
            to: SAFE_DEMO_EMAIL, 
            subject: `💬 Nuevo mensaje de ${senderName}`,
            html: htmlBody
        });
        console.log("✅ [Chat] Notificación enviada");
    } catch (error) {
        console.error("[Email Service] Error:", error);
    }
};