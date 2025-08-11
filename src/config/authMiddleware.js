export const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

export const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.admin === true) {
        next(); 
    } else {
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