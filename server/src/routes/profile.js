import express from 'express';
import * as pc from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.use(protect);

router.get('/', pc.getProfile);
router.put('/', upload.single('avatar'), pc.updateProfile);
router.post('/change-password', pc.changePassword);
router.post('/request-change-email', pc.requestChangeEmail);
router.post('/change-email', pc.changeEmail);
router.post('/request-change-phone', pc.requestChangePhone);
router.post('/change-phone', pc.changePhone);
router.get('/devices', pc.getDevices);
router.delete('/devices/:deviceId', pc.removeDevice);
router.delete('/', pc.deleteAccount);

export default router;
