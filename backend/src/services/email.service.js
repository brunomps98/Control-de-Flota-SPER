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

// 2. Función para enviar la notificación
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

    // 3. Opciones del correo
    const mailOptions = {
        from: `"Notificaciones SPER" <${process.env.EMAIL_USER}>`, // Quién envía
        to: to, // Quién recibe (los admins)
        subject: `Nuevo Ticket de Soporte: ${ticketData.problem_description.substring(0, 30)}...`, // Asunto
        html: htmlBody // Cuerpo del correo
    };

    // 4. Enviar el correo
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Notificación de ticket enviada a: ${to}`);
    } catch (error) {
        console.error("[Email Service] Error al enviar correo:", error);
    }
};