import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// --- CONFIGURACIÓN OPTIMIZADA PARA RENDER ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  // Usamos el host explícito de Gmail
    port: 465,               // Puerto SSL seguro (Render no bloquea este)
    secure: true,            // true para puerto 465, false para otros
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    },
    // Aumentamos el timeout para evitar errores si la red está lenta
    connectionTimeout: 10000, 
    greetingTimeout: 5000,
    socketTimeout: 10000 
});

// Función para enviar la notificación de nuevo ticket
export const sendNewTicketEmail = async (adminEmails, ticketData, fileUrls = []) => {
    
    const to = adminEmails.join(', '); 

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
        <p>Por favor, ingresa al panel de administración para gestionar este ticket.</p>
    `;

    const mailOptions = {
        from: `"Notificaciones SPER" <${process.env.EMAIL_USER}>`, 
        to: to, 
        subject: `Nuevo Ticket de Soporte: ${ticketData.problem_description.substring(0, 30)}...`, 
        html: htmlBody 
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("[Email Service] Error al enviar correo:", error);
    }
};

// Enviar email de reseteo de contraseña
export const sendPasswordResetEmail = async (userEmail, resetLink) => {
    
    const htmlBody = `
        <h1>Restablecimiento de Contraseña</h1>
        <p>Has solicitado restablecer tu contraseña para la aplicación Control de Flota.</p>
        <p>Por favor, haz clic en el siguiente enlace para establecer una nueva contraseña. El enlace es válido por 15 minutos:</p>
        <a 
            href="${resetLink}" 
            style="background-color: #009688; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;"
        >
            Restablecer Contraseña
        </a>
        <hr>
        <p>Si no solicitaste esto, por favor ignora este correo.</p>
    `;

    const mailOptions = {
        from: `"Notificaciones SPER" <${process.env.EMAIL_USER}>`, 
        to: userEmail, 
        subject: 'Restablecimiento de tu contraseña de SPER', 
        html: htmlBody 
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
    }
};


// Notificación de Acción en Vehículo (Carga o Edición)
export const sendVehicleActionEmail = async (adminEmails, actionType, user, vehicleData) => {
    const to = adminEmails.join(', ');

    const subjectAction = actionType === 'CREATE' ? 'Nuevo Vehículo Cargado' : 'Vehículo Actualizado';
    const color = actionType === 'CREATE' ? '#4CAF50' : '#2196F3'; 

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: ${color};">${subjectAction}</h1>
            <p>El usuario <strong>${user.username}</strong> (${user.unidad}) ha realizado una acción.</p>
            <hr>
            <h3>Detalles del Vehículo:</h3>
            <ul>
                <li><strong>Dominio:</strong> ${vehicleData.dominio || 'N/A'}</li>
                <li><strong>Marca/Modelo:</strong> ${vehicleData.marca} ${vehicleData.modelo}</li>
                <li><strong>Unidad Asignada:</strong> ${vehicleData.title}</li>
            </ul>
            <p>Ingresa a la plataforma para ver más detalles.</p>
        </div>
    `;

    const mailOptions = {
        from: `"Notificaciones SPER" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `📢 ${subjectAction}: ${vehicleData.dominio} - ${user.unidad}`,
        html: htmlBody
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("[Email Service] Error al enviar correo de vehículo:", error);
    }
};

// Notificación de Nuevo Mensaje de Chat
export const sendNewMessageEmail = async (adminEmails, senderName, senderUnit, messageContent) => {
    const to = adminEmails.join(', ');

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: #009688;">Nuevo Mensaje de Chat</h1>
            <p>Tienes un nuevo mensaje de soporte del usuario <strong>${senderName}</strong> (${senderUnit}).</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p style="font-style: italic;">"${messageContent}"</p>
            </div>
            <p>Ingresa al Chat de Soporte para responder.</p>
        </div>
    `;

    const mailOptions = {
        from: `"Notificaciones SPER" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `💬 Nuevo mensaje de ${senderName}`,
        html: htmlBody
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("[Email Service] Error al enviar correo de chat:", error);
    }
};