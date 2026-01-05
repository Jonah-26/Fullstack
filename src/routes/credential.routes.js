import express from 'express';
import * as credentialController from '../controllers/credential.controller.js';

const router = express.Router();

router.post('/', credentialController.addCredential);
router.get('/:id', credentialController.getCredentials);

export default router;
