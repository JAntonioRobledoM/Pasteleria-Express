require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

const app = express();

// Configurar strictQuery
mongoose.set('strictQuery', false);

// Conectar a MongoDB
(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado a MongoDB");
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
    }
})();

// Configuración de Express
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // reemplaza body-parser
app.use(express.json()); // Para JSON
app.use(methodOverride('_method'));

// Importar rutas
const dulcesRoutes = require('./router/dulce');
app.use('/dulce', dulcesRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.render('index');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
