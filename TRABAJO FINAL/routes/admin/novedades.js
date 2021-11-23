var express = require('express');
const { rawListeners } = require('../../models/bd');
var router = express.Router();
var novedadesModel = require('./../../models/novedadesModel');
var util = require('util');
var cloudinary = require('cloudinary').v2;
const uploader = util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);

/* GET home page. */
router.get('/', async function(req, res, next) {
  var novedades = await novedadesModel.getNovedades();
  res.render('admin/novedades', {
      layout:'admin/layout',
      usuario: req.session.nombre,
      novedades
  });
});

router.get('/eliminar/:id', async (req, res, next) => { //eliminar
  var id = req.params.id;

  let novedad = await novedadesModel.getNovedadById(id);
  if (novedad.img_id) {
    await (destroy(novedad.img_id));
  }
  
  await novedadesModel.deleteNovedadesById(id);
  res.redirect('/admin/novedades')
});

router.get ('/agregar', (req, res, next) => { //agregar
  res.render('admin/agregar', {
    layout: 'admin/layout'
  })
});

router.post('/agregar', async (req, res, next) => {
  
    var img_id = '';
    if (req.files && Object.keys(req.files).length > 0) {
    imagen = req.files.imagen;
    img_id = (await uploader(imagen.tempFilePath)).public_id;
  }
  try {
    if (req.body.fecha != "" && req.body.ubicacion != "" && req.body.titulo != "" && req.body.subtitulo != "" && req.body.cuerpo != "") {

      await novedadesModel.insertNovedad({
        ...req.body, 
        img_id
      });
      res.redirect('/admin/novedades')
    }else{
      res.render('admin/agregar', {
        layout: 'admin/layout',
        error: true, message: 'Todos los campos son requeridos'
      })
    }
  }catch (error) {
    res.render('admin/agregar', {
      layout: 'admin/layout',
      error: true, message: 'No se creó la novedad'
    });
  }
});

router.get('/modificar/:id', async (req, res, next) => {
  let id = req.params.id;
  let novedad = await novedadesModel.getNovedadById(id);
  res.render('admin/modificar', {
    layout: 'admin/layout',
    novedad
  });
});

router.post('/modificar', async (req, res, next) => {
  try{
    let img_id = req.body.img_original;
    let borrar_img_vieja = false;

    if (req.body.img_delete === "1") {
      img_id = null;
      borrar_img_vieja = true;
    } else {
      if (req.files && Object.keys(req.files).lenght > 0) {
        imagen = req.files.imagen;
        img_id = (await uploader(imagen.tempFilePath)).public_id;
        borrar_img_vieja = true;
      }
    }
    if (borrar_img_vieja && req.body.img_original) {
      await (destroy(req.body.img_original));
    }

    var obj = {
      fecha: req.body.fecha,
      ubicacion: req.body.ubicacion,
      titulo: req.body.titulo,
      subtitulo: req.body.subtitulo,
      cuerpo: req.body.cuerpo,
      img_id
    }
    await novedadesModel.modificarNovedadesById(obj, req.body.id);
    res.redirect('/admin/novedades');
  } catch (error) {
    res.render('admin/modificar' , {
      layout: 'admin/layout',
      error: true, 
      message: 'No se modificó la novedad'
    })
  }
})

module.exports = router;