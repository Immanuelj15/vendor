import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

const statusColors = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  REJECTED: 'error',
  ACTIVE: 'success',
  INACTIVE: 'default'
};

export default function VendorProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [page, search, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams({ page });
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);

      const res = await axios.get(`/api/vendor/products?${queryParams.toString()}`);
      setProducts(res.data.data.products);
      setStats(res.data.data.stats || {});
      setTotalPages(res.data.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products. You may not be eligible.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await axios.post(`/api/vendor/products/${productId}/status`, { status: newStatus });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`/api/vendor/products/${productToDelete}`);
      setDeleteOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading && products.length === 0) return <Typography>Loading products...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">My Products</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/vendor/products/new')}
        >
          Add Product
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Stack direction="row" spacing={2} sx={{ mb: 3, overflowX: 'auto' }}>
        <Chip label={`Total: ${stats.total || 0}`} color="primary" />
        <Chip label={`Active: ${stats.ACTIVE || 0}`} color="success" />
        <Chip label={`Pending: ${stats.PENDING_APPROVAL || 0}`} color="warning" />
        <Chip label={`Draft: ${stats.DRAFT || 0}`} />
        <Chip label={`Rejected: ${stats.REJECTED || 0}`} color="error" />
      </Stack>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <TextField 
          label="Search Products" 
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Price (MRP)</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(product => (
              <TableRow key={product._id}>
                <TableCell>
                  <Typography variant="subtitle2">{product.name}</Typography>
                  <Typography variant="caption" color="textSecondary">{product.categoryId?.name}</Typography>
                </TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>
                  ₹{product.price} 
                  {product.mrp > product.price && (
                    <Typography variant="caption" sx={{ textDecoration: 'line-through', ml: 1, color: 'error.main' }}>
                      ₹{product.mrp}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={product.stock} 
                    size="small" 
                    color={product.stock <= product.lowStockThreshold ? 'error' : 'success'} 
                  />
                </TableCell>
                <TableCell>
                  <Chip label={product.status} size="small" color={statusColors[product.status] || 'default'} />
                </TableCell>
                <TableCell>
                  <IconButton component={Link} to={`/vendor/products/${product._id}/edit`} size="small">
                    <EditIcon />
                  </IconButton>
                  
                  {product.status === 'ACTIVE' && (
                    <Button size="small" onClick={() => handleStatusChange(product._id, 'INACTIVE')}>Deactivate</Button>
                  )}
                  
                  {product.status === 'INACTIVE' && (
                    <Button size="small" onClick={() => handleStatusChange(product._id, 'ACTIVE')}>Activate</Button>
                  )}

                  {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                    <Button size="small" onClick={() => handleStatusChange(product._id, 'PENDING_APPROVAL')}>Submit</Button>
                  )}

                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => {
                      setProductToDelete(product._id);
                      setDeleteOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this product? This action will hide it from future use.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
