export const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        // Si el usuario está autenticado en la sesión, permite continuar.
        next();
    } else {
        // Si no está autenticado, devuelve un error 401 en formato JSON.
        res.status(401).json({ message: 'Acceso no autorizado. Por favor, inicie sesión.' });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.admin === true) {
        next();
    } else {
        // Podrías cambiar esto a res.status(403).json({ message: '...'}) también
        res.status(403).send('Acceso denegado. Debes ser administrador para acceder a esta página.');
    }
};

export const limitFailedAttempts = (req, res, next) => {
    const MAX_FAILED_ATTEMPTS = 3;
    const BLOCK_TIME = 180000; // 3 minute in milliseconds

    if (req.session && req.session.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        const blockEndTime = req.session.blockEndTime || 0;
        const currentTime = Date.now();

        if (currentTime < blockEndTime) {
            const remainingTime = Math.ceil((blockEndTime - currentTime) / 1000);
            // Podrías cambiar esto a res.status(403).json({ message: '...'}) también
            res.status(403).send(`Demasiados intentos fallidos. Por favor, inténtelo de nuevo después de ${remainingTime} segundos.`);
        } else {
            req.session.failedAttempts = 0;
            req.session.blockEndTime = currentTime + BLOCK_TIME; // set the block end time
            next();
        }
    } else {
        next();
    }
};