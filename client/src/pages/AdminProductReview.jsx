import { useState, useEffect } from 'react';
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
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';

export default function AdminProductReview() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingProducts();
  }, [page]);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/products?status=PENDING_APPROVAL&page=${page}`);
      setProducts(res.data.data.products);
      setTotalPages(res.data.data.pagination.pages);
    } catch (err) {
      setError('Failed to fetch pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`/api/admin/products/${id}/approve`);
      fetchPendingProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      setError('Rejection reason is required');
      return;
    }
    try {
      await axios.post(`/api/admin/products/${rejectId}/reject`, { reason: rejectReason });
      setRejectOpen(false);
      setRejectReason('');
      setRejectId(null);
      fetchPendingProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    }
  };

  if (loading && products.length === 0) return <Typography>Loading pending products...</Typography>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Pending Products Review</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(product => (
              <TableRow key={product._id}>
                <TableCell>
                  <Typography variant="subtitle2">{product.vendorId?.storeName || 'Unknown Vendor'}</Typography>
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>₹{product.price}</TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="small" 
                    sx={{ mr: 1 }}
                    onClick={() => handleApprove(product._id)}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="small" 
                    onClick={() => {
                      setRejectId(product._id);
                      setRejectOpen(true);
                    }}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No pending products.</TableCell>
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

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <DialogTitle>Reject Product</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained">Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
