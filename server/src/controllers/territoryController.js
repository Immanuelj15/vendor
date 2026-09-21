import { Territory } from '../models/Territory.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const getStates = asyncWrapper(async (req, res) => {
  const states = await Territory.find({ type: 'STATE', status: 'ACTIVE' }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { states }, 'States retrieved'));
});

export const getAllDistricts = asyncWrapper(async (req, res) => {
  const districts = await Territory.find({ type: 'DISTRICT', status: 'ACTIVE' }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { districts }, 'Districts retrieved'));
});

export const getDistricts = asyncWrapper(async (req, res) => {
  const { stateId } = req.params;
  const districts = await Territory.find({ type: 'DISTRICT', parentTerritory: stateId, status: 'ACTIVE' }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { districts }, 'Districts retrieved'));
});

export const getAllTaluks = asyncWrapper(async (req, res) => {
  const taluks = await Territory.find({ type: 'TALUK', status: 'ACTIVE' }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { taluks }, 'Taluks retrieved'));
});

export const getTaluks = asyncWrapper(async (req, res) => {
  const { districtId } = req.params;
  const taluks = await Territory.find({ type: 'TALUK', parentTerritory: districtId, status: 'ACTIVE' }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { taluks }, 'Taluks retrieved'));
});

// Admin endpoints

export const createTerritory = asyncWrapper(async (req, res) => {
  const { type, name, code, parentTerritory, pincodes } = req.body;
  const territory = new Territory({ type, name, code, parentTerritory, pincodes });
  
  // Set denormalized fields
  if (parentTerritory) {
    const parent = await Territory.findById(parentTerritory);
    if (!parent) return res.status(404).json(new ApiResponse(404, null, 'Parent territory not found'));
    
    if (type === 'DISTRICT') {
      territory.state = parent.name;
    } else if (type === 'TALUK') {
      territory.state = parent.state;
      territory.district = parent.name;
    }
  }
  
  await territory.save();
  return res.status(201).json(new ApiResponse(201, { territory }, 'Territory created'));
});

export const updateTerritory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, code, status, pincodes } = req.body;
  
  const territory = await Territory.findByIdAndUpdate(
    id,
    { name, code, status, pincodes },
    { new: true, runValidators: true }
  );
  
  if (!territory) return res.status(404).json(new ApiResponse(404, null, 'Territory not found'));
  return res.status(200).json(new ApiResponse(200, { territory }, 'Territory updated'));
});

export const deactivateTerritory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const territory = await Territory.findByIdAndUpdate(
    id,
    { status: 'INACTIVE' },
    { new: true }
  );
  
  if (!territory) return res.status(404).json(new ApiResponse(404, null, 'Territory not found'));
  return res.status(200).json(new ApiResponse(200, { territory }, 'Territory deactivated'));
});

