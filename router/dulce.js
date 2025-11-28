const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Dulce = require('../models/dulce');

// Configuración de almacenamiento de imágenes con multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Carpeta donde se guardarán las imágenes
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre único con fecha
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Sólo se permiten imágenes (jpg, jpeg, png, gif)');
        }
    }
});

// Mostrar todos los Dulces con paginación y filtrado por tipo
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const filtroTipo = req.query.tipo || null;

        // Crear el objeto de filtro basado en si hay un tipo especificado
        const filtro = filtroTipo ? { tipo: filtroTipo } : {};

        const dulces = await Dulce.find(filtro).skip(skip).limit(limit);
        const totalDulces = await Dulce.countDocuments(filtro);

        res.render('dulce/list', {
            dulces,
            currentPage: page,
            totalPages: Math.ceil(totalDulces / limit),
            filtroTipo // Pasar el filtro actual a la vista
        });
    } catch (error) {
        console.error("Error al obtener los dulces:", error);
        res.status(500).send("Error al cargar los dulces");
    }
});

// Mostrar el panel de admin con paginación
router.get('/admin', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const dulces = await Dulce.find().skip(skip).limit(limit);
        const totalDulces = await Dulce.countDocuments();

        res.render('dulce/admin_panel', {
            dulces,
            currentPage: page,
            totalPages: Math.ceil(totalDulces / limit)
        });
    } catch (error) {
        console.error("Error al obtener los dulces:", error);
        res.status(500).send("Error al cargar los dulces en el panel de admin");
    }
});

// Formulario para crear un Dulce
router.get('/new', (req, res) => {
    res.render('dulce/new');
});

// Crear un Dulce con subida de imagen
router.post('/', upload.single('imagen'), async (req, res) => {
    try {
        const { nombre, tipo, descripcion } = req.body;
        const imagen = req.file ? req.file.filename : 'default.jpg';

        await Dulce.create({ nombre, tipo, descripcion, imagen });
        res.redirect('/dulce');
    } catch (error) {
        console.error("Error al crear el dulce:", error);
        res.status(500).send("Error al agregar el dulce");
    }
});

// Formulario para editar un Dulce
router.get('/:id/edit', async (req, res) => {
    try {
        const dulce = await Dulce.findById(req.params.id);
        res.render('dulce/edit', { dulce });
    } catch (error) {
        console.error("Error al obtener el dulce para editar:", error);
        res.status(500).send("Error al cargar la edición del dulce");
    }
});

// Actualizar Dulce con nueva imagen si se sube una
router.put('/:id', upload.single('imagen'), async (req, res) => {
    try {
        const { nombre, tipo, descripcion } = req.body;
        const dulce = await Dulce.findById(req.params.id);

        let imagen = dulce.imagen; // Mantener la imagen existente si no se sube una nueva
        if (req.file) {
            imagen = req.file.filename;
        }

        await Dulce.findByIdAndUpdate(req.params.id, { nombre, tipo, descripcion, imagen });
        res.redirect('/dulce');
    } catch (error) {
        console.error("Error al actualizar el dulce:", error);
        res.status(500).send("Error al actualizar el dulce");
    }
});

// Eliminar Dulce y su imagen asociada
router.delete('/:id', async (req, res) => {
    try {
        // Buscar el dulce para obtener su imagen antes de eliminarlo
        const dulce = await Dulce.findById(req.params.id);

        if (dulce && dulce.imagen && dulce.imagen !== 'default.jpg') {
            // Construir la ruta al archivo de imagen
            const imagePath = path.join(__dirname, '../public/uploads/', dulce.imagen);

            // Verificar si el archivo existe y eliminarlo
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Imagen eliminada: ${dulce.imagen}`);
            }
        }

        // Eliminar el dulce de la base de datos
        await Dulce.findByIdAndDelete(req.params.id);
        res.redirect('/dulce/admin');
    } catch (error) {
        console.error("Error al eliminar el dulce:", error);
        res.status(500).send("Error al eliminar el dulce");
    }
});

module.exports = router;
