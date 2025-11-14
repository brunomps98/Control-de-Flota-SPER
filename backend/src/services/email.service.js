import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// Función para enviar la notificación
export const sendNewTicketEmail = async (adminEmails, ticketData, fileUrls = []) => {
    
    // Lista de correos de admins
    const to = adminEmails.join(', '); 

    // Creamos el contenido del correo en HTML
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

    // Opciones del correo
    const mailOptions = {
        from: `"Notificaciones SPER" <${process.env.EMAIL_USER}>`, // Quién envía
        to: to, // Quién recibe (los admins)
        subject: `Nuevo Ticket de Soporte: ${ticketData.problem_description.substring(0, 30)}...`, // Asunto
        html: htmlBody // Cuerpo del correo
    };

    // Enviar el correo
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Notificación de ticket enviada a: ${to}`);
    } catch (error) {
        console.error("[Email Service] Error al enviar correo:", error);
    }
};

// Enviar email de reseteo de contraseña
export const sendPasswordResetEmail = async (userEmail, resetLink) => {
    
    // Contenido del correo en HTML
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

    // Opciones del correo
    const mailOptions = {
        from: `"Notificaciones SPER" <${process.env.EMAIL_USER}>`, // Quién envía
        to: userEmail, // Quién recibe (el usuario)
        subject: 'Restablecimiento de tu contraseña de SPER', // Asunto
        html: htmlBody // Cuerpo del correo
    };

    // Enviar el correo
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Email de reseteo enviado a: ${userEmail}`);
    } catch (error) {
        console.error("[Email Service] Error al enviar correo de reseteo:", error);
    }
};