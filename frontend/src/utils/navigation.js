
// Función de utilidad para redirigir al usuario a una nueva url
// Este código provoca una recarga completa de la página
// Export usamos para ser usada en otros archivos

export const redirectTo = (path) => {
    window.location.href = path;
};