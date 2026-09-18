import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Divider,
} from '@mui/material';

const steps = ['Basic Info', 'Pricing & Tax', 'Inventory & Shipping'];

export default function VendorProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    shortDescription: '',
    description: '',
    mrp: '',
    price: '',
    taxRate: '',
    hsnCode: '',
    stock: '',
    lowStockThreshold: '5',
    weight: '',
    weightUnit: 'GRAM',
    length: '',
    width: '',
    height: '',
    dimensionUnit: 'CM',
    images: [],
    status: 'PENDING_APPROVAL'
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) fetchProduct();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/vendor/categories'); // Adjust this route if needed
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      // We will assume a vendor can fetch their product by slug or id if an endpoint exists. 
      // If we don't have a direct /vendor/products/:id GET, we'll fetch from public slug.
      // Assuming GET /api/vendor/products is what we have right now.
      const res = await axios.get(`/api/products/${id}`); 
      const p = res.data.data.product;
      
      setFormData({
        name: p.name || '',
        sku: p.sku || '',
        categoryId: p.categoryId?._id || '',
        shortDescription: p.shortDescription || '',
        description: p.description || '',
        mrp: p.mrp || '',
        price: p.price || '',
        taxRate: p.taxRate || '',
        hsnCode: p.hsnCode || '',
        stock: p.stock || 0,
        lowStockThreshold: p.lowStockThreshold || 5,
        weight: p.weight || '',
        weightUnit: p.weightUnit || 'GRAM',
        length: p.length || '',
        width: p.width || '',
        height: p.height || '',
        dimensionUnit: p.dimensionUnit || 'CM',
        status: p.status || 'PENDING_APPROVAL',
        images: p.images || []
      });
    } catch (err) {
      setError('Failed to fetch product data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    // Basic validation before proceeding
    if (activeStep === 0) {
      if (!formData.name || !formData.sku || !formData.categoryId) {
        setError('Name, SKU, and Category are required');
        return;
      }
    }
    if (activeStep === 1) {
      if (!formData.mrp || !formData.price) {
        setError('MRP and Selling Price are required');
        return;
      }
      if (Number(formData.price) > Number(formData.mrp)) {
        setError('Selling price cannot be greater than MRP');
        return;
      }
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (isDraft = false) => {
    try {
      setLoading(true);
      setError('');
      
      const payload = { ...formData };
      if (isDraft) payload.status = 'DRAFT';

      if (isEditing) {
        await axios.put(`/api/vendor/products/${id}`, payload);
      } else {
        await axios.post(`/api/vendor/products`, payload);
      }
      navigate('/vendor/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Product Name *" name="name" value={formData.name} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="SKU *" name="sku" value={formData.sku} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select name="categoryId" value={formData.categoryId} onChange={handleChange} label="Category *">
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                  ))}
                  {/* Fallback if categories endpoint fails */}
                  {categories.length === 0 && <MenuItem value="TEMPORARY_CAT_ID">Default Category (Demo)</MenuItem>}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Short Description" name="shortDescription" value={formData.shortDescription} onChange={handleChange} multiline rows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Description" name="description" value={formData.description} onChange={handleChange} multiline rows={4} />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="MRP *" 
                name="mrp" 
                type="number" 
                value={formData.mrp} 
                onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Selling Price *" 
                name="price" 
                type="number" 
                value={formData.price} 
                onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Tax Rate (%)" name="taxRate" type="number" value={formData.taxRate} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="HSN Code" name="hsnCode" value={formData.hsnCode} onChange={handleChange} />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Stock Quantity" name="stock" type="number" value={formData.stock} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Low Stock Threshold" name="lowStockThreshold" type="number" value={formData.lowStockThreshold} onChange={handleChange} />
            </Grid>
            
            <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="body2" color="textSecondary">Shipping Dimensions</Typography></Divider></Grid>
            
            <Grid item xs={8} md={4}>
              <TextField fullWidth label="Weight" name="weight" type="number" value={formData.weight} onChange={handleChange} />
            </Grid>
            <Grid item xs={4} md={2}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select name="weightUnit" value={formData.weightUnit} onChange={handleChange} label="Unit">
                  <MenuItem value="GRAM">Gram</MenuItem>
                  <MenuItem value="KG">KG</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={4} md={2}>
              <TextField fullWidth label="L" name="length" type="number" value={formData.length} onChange={handleChange} />
            </Grid>
            <Grid item xs={4} md={2}>
              <TextField fullWidth label="W" name="width" type="number" value={formData.width} onChange={handleChange} />
            </Grid>
            <Grid item xs={4} md={2}>
              <TextField fullWidth label="H" name="height" type="number" value={formData.height} onChange={handleChange} />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          
          <Box>
            <Button 
              variant="outlined" 
              onClick={() => handleSubmit(true)}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              Save as Draft
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={() => handleSubmit(false)} disabled={loading}>
                {isEditing ? 'Update & Submit' : 'Submit Product'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
