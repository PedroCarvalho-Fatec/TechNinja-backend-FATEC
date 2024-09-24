const express = require('express');
const {requestPasswordReset} = require('../controllers/userController')

const router = express.Router();

router.post('/request-password-reset', requestPasswordReset);

module.exports = router;