import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { ApiError as AppError } from '../utils/ApiError.js';

export const createSubscriptionPlan = async (req, res, next) => {
  try {
    const { name, code, description, monthlyPrice, yearlyPrice, currency, applicableEntityType, features, displayOrder } = req.body;
    
    // Check if code already exists
    const existingPlan = await SubscriptionPlan.findOne({ code: code.toUpperCase() });
    if (existingPlan) {
      return next(new AppError('A plan with this code already exists', 400));
    }
    
    const plan = new SubscriptionPlan({
      name,
      code: code.toUpperCase(),
      description,
      monthlyPrice,
      yearlyPrice,
      currency: currency || 'INR',
      applicableEntityType,
      features,
      displayOrder: displayOrder || 0
    });
    
    await plan.save();
    
    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionPlans = async (req, res, next) => {
  try {
    const { entityType, activeOnly } = req.query;
    
    const query = {};
    if (entityType) query.applicableEntityType = entityType;
    if (activeOnly === 'true') query.isActive = true;
    
    const plans = await SubscriptionPlan.find(query).sort({ displayOrder: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, monthlyPrice, yearlyPrice, features, displayOrder } = req.body;
    
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return next(new AppError('Subscription plan not found', 404));
    }
    
    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (monthlyPrice !== undefined) plan.monthlyPrice = monthlyPrice;
    if (yearlyPrice !== undefined) plan.yearlyPrice = yearlyPrice;
    if (features !== undefined) plan.features = features;
    if (displayOrder !== undefined) plan.displayOrder = displayOrder;
    
    await plan.save();
    
    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

export const togglePlanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return next(new AppError('Subscription plan not found', 404));
    }
    
    plan.isActive = isActive;
    await plan.save();
    
    res.status(200).json({
      success: true,
      message: `Subscription plan ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};
