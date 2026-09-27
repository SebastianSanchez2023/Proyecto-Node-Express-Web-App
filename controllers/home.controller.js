const path = require('path');

/**
 * Controlador para la ruta de inicio (/)
 * Retorna contenido HTML según requerimiento de la Lección 4
 */
const getHome = (req, res) => {
    // Servimos el archivo HTML estático principal desde la carpeta /public
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
};

module.exports = {
    getHome
};
