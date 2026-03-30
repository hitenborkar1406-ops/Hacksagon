import express from 'express';
import { verifyCode, issueCode, listCodes, deactivateCode } from '../controllers/patientAccessController.js';

const router = express.Router();

router.post('/verify',                          verifyCode);
router.post('/issue',                           issueCode);
router.get('/:patientId',                       listCodes);
router.put('/:accessCode/deactivate',           deactivateCode);

export default router;
