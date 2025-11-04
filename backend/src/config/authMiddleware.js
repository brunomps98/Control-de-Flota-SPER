import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ message: 'Acceso no autorizado. Se requiere un token.' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token no válido o expirado.' });
        }
        // Si el token es válido, guardamos los datos del usuario en req.user
        req.user = user;
        next();
    });
};

// Middleware adaptado para verificar si el usuario es administrador.
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
};

