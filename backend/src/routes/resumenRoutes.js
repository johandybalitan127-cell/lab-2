const express = require('express');
const router = express.Router();
const resumenController = require('../controllers/resumenController');

router.get('/', resumenController.obtenerResumen);

module.exports = router;
