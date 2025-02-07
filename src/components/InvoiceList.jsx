// src/components/InvoiceList.js
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Container,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { Edit, Trash, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-invoice/${id}`);
  };

  const handleView = (id) => {
    navigate(`/view-invoice/${id}`);
  };

  const handleDelete = async () => {
    try {
      await fetch(`http://localhost:5000/api/invoices/${selectedInvoice}`, {
        method: 'DELETE',
      });
      setDeleteDialogOpen(false);
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Invoices
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/new-invoice')}
        sx={{ mb: 3 }}
      >
        Create New Invoice
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice._id}>
                <TableCell>{invoice.customerDetails.name}</TableCell>
                <TableCell>{invoice.customerDetails.date}</TableCell>
                <TableCell>{invoice.customerDetails.mobile}</TableCell>
                <TableCell>₹{invoice.totals.total.toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleView(invoice._id)} color="primary">
                    <Eye />
                  </IconButton>
                  <IconButton onClick={() => handleEdit(invoice._id)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setSelectedInvoice(invoice._id);
                      setDeleteDialogOpen(true);
                    }}
                    color="secondary"
                  >
                    <Trash />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this invoice? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InvoiceList;