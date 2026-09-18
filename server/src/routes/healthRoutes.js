import express from 'express';
import { getHealthStatus, getLivenessStatus, getReadinessStatus } from '../controllers/healthController.js';

const router = express.Router();

router.get('/', getHealthStatus);
router.get('/liveness', getLivenessStatus);
router.get('/readiness', getReadinessStatus);

export default router;
