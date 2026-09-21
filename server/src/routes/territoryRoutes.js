import express from 'express';
import {
  getStates,
  getAllDistricts,
  getDistricts,
  getAllTaluks,
  getTaluks,
  createTerritory,
  updateTerritory,
  deactivateTerritory,
} from '../controllers/territoryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public / General read routes
router.get('/states', getStates);
router.get('/districts', getAllDistricts);
router.get('/taluks', getAllTaluks);
router.get('/states/:stateId/districts', getDistricts);
router.get('/districts/:districtId/taluks', getTaluks);

// Admin routes
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

router.post('/', createTerritory);
router.put('/:id', updateTerritory);
router.post('/:id/deactivate', deactivateTerritory);

export default router;
