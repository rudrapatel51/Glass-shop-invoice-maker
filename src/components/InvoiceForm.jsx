import React, { useState, useRef,useEffect } from 'react';
import {
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  ThemeProvider,
  createTheme,
  Grid,
  AppBar,
  Toolbar,
  useMediaQuery,
  Menu,
  MenuItem,
} from '@mui/material';
import { Trash, Download, Plus, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate, useParams } from 'react-router-dom';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const invoiceRef = useRef();
  const printRef = useRef();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Menu state for add button
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    date: '',
    mobile: '',
  });

  const [products, setProducts] = useState([{
    particular: '',
    x: '',
    y: '',
    quantity: '',
    sqFt: 0,
    rate: '',
    gTotal: 0,
    runFt: 0,
    rRate: '',
    rfTotal: 0,
    total: 0,
    isGlass: true, // New field to identify if it's a glass item
  }]);

  const calculateValues = (product) => {
    // Only calculate if it's a glass item
    if (!product.isGlass) {
      return {
        ...product,
        sqFt: '',
        gTotal: '',
        runFt: '',
        rfTotal: '',
      };
    }

    const x = parseFloat(product.x) || 0;
    const y = parseFloat(product.y) || 0;
    const quantity = parseFloat(product.quantity) || 0;
    const rate = parseFloat(product.rate) || 0;
    const rRate = parseFloat(product.rRate) || 0;

    const sqFt = ((x * y) / 144) * quantity;
    const gTotal = sqFt * rate;
    const runFt = (((x / 12) + (y / 12)) * 2*quantity);
    const rfTotal = runFt * rRate;
    const total = gTotal + rfTotal;

    return {
      ...product,
      sqFt: sqFt.toFixed(2),
      gTotal: gTotal.toFixed(2),
      runFt: runFt.toFixed(2),
      rfTotal: rfTotal.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value,
    };
    newProducts[index] = calculateValues(newProducts[index]);
    setProducts(newProducts);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const addProduct = (isGlass = true) => {
    setProducts([...products, {
      particular: '',
      x: '',
      y: '',
      quantity: '',
      sqFt: 0,
      rate: '',
      gTotal: 0,
      runFt: 0,
      rRate: '',
      rfTotal: 0,
      total: 0,
      isGlass: isGlass,
    }]);
    handleMenuClose();
  };

  const removeProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const calculateTotals = () => {
    return products.reduce((acc, product) => {
      // Only include glass items in total calculations
      if (product.isGlass) {
        return {
          gTotal: acc.gTotal + parseFloat(product.gTotal || 0),
          rfTotal: acc.rfTotal + parseFloat(product.rfTotal || 0),
          total: acc.total + parseFloat(product.total || 0),
        };
      } else {
        // For custom fields, add only the total if it's a number
        const customTotal = parseFloat(product.total) || 0;
        return {
          gTotal: acc.gTotal,
          rfTotal: acc.rfTotal,
          total: acc.total + customTotal,
        };
      }
    }, { gTotal: 0, rfTotal: 0, total: 0 });
  };

  const totals = calculateTotals();

const generatePDF = async () => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait', 
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Header Section
    pdf.setFillColor(25, 118, 210);
    pdf.rect(0, 0, pdfWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTIMATE / ORDER OF MAHADEV GLASS', pdfWidth/2, 17, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0);
    
    // Customer Details Section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Customer Details:', 10, 40);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Name: ${customerDetails.name || 'N/A'}`, 10, 50);
    pdf.text(`Date: ${customerDetails.date || 'N/A'}`, 70, 50);
    pdf.text(`Mobile: ${customerDetails.mobile || 'N/A'}`, 130, 50);
    
    // Draw a line separator
    pdf.setLineWidth(0.5);
    pdf.line(10, 55, pdfWidth - 10, 55);
    
    // Table Header
    let yPos = 65;
    const tableStartY = yPos;
    
    pdf.setFillColor(240, 240, 240);
    pdf.rect(10, yPos, pdfWidth - 20, 8, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    
    // Define column positions and widths
    const columns = [
      { title: 'Particular', x: 12, width: 30 },
      { title: 'X(L)', x: 42, width: 12 },
      { title: 'Y(B)', x: 54, width: 12 },
      { title: 'Qty', x: 66, width: 12 },
      { title: 'SqFt', x: 78, width: 15 },
      { title: 'G.Rate', x: 93, width: 15 },
      { title: 'G.Total', x: 108, width: 15 },
      { title: 'RunFt', x: 123, width: 15 },
      { title: 'P.Rate', x: 138, width: 15 },
      { title: 'RF.Total', x: 153, width: 15 },
      { title: 'Total', x: 168, width: 20 }
    ];
    
    columns.forEach(col => {
      pdf.text(col.title, col.x, yPos + 5);
    });
    
    yPos += 10;
    
    // Table Data
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    products.forEach((product, index) => {
      // Add new page if needed
      if (yPos > pdfHeight - 50) {
        pdf.addPage();
        yPos = 20;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(10, yPos, pdfWidth - 20, 8, 'F');
      }
      
      const rowData = [
        { text: product.particular || '', x: 12, width: 28 },
        { text: product.isGlass ? (product.x || '') : (product.x || ''), x: 42, width: 10 },
        { text: product.isGlass ? (product.y || '') : (product.y || ''), x: 54, width: 10 },
        { text: product.isGlass ? (product.quantity || '') : (product.quantity || ''), x: 66, width: 10 },
        { text: product.isGlass ? (product.sqFt || '') : (product.sqFt || ''), x: 78, width: 13 },
        { text: product.isGlass ? (product.rate || '') : (product.rate || ''), x: 93, width: 13 },
        { text: product.isGlass ? (product.gTotal || '') : (product.gTotal || ''), x: 108, width: 13 },
        { text: product.isGlass ? (product.runFt || '') : (product.runFt || ''), x: 123, width: 13 },
        { text: product.isGlass ? (product.rRate || '') : (product.rRate || ''), x: 138, width: 13 },
        { text: product.isGlass ? (product.rfTotal || '') : (product.rfTotal || ''), x: 153, width: 13 },
        { text: product.total || '', x: 168, width: 18 }
      ];
      
      rowData.forEach(cell => {
        const text = String(cell.text);
        if (text.length > 10) {
          // Split long text into multiple lines
          const lines = pdf.splitTextToSize(text, cell.width);
          pdf.text(lines[0], cell.x, yPos + 5);
          if (lines[1]) {
            pdf.text(lines[1], cell.x, yPos + 8);
          }
        } else {
          pdf.text(text, cell.x, yPos + 5);
        }
      });
      
      yPos += 10;
    });
    
    // Add Total Row within the table
    pdf.setFillColor(25, 118, 210);
    pdf.rect(10, yPos, pdfWidth - 20, 10, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    // Calculate totals for each column
    const gTotalSum = products.reduce((sum, product) => sum + (parseFloat(product.gTotal) || 0), 0);
    const rfTotalSum = products.reduce((sum, product) => sum + (parseFloat(product.rfTotal) || 0), 0);
    
    // Display totals in respective columns
    pdf.text('TOTAL', 12, yPos + 7);
    pdf.text(`${gTotalSum}`, 108, yPos + 7);
    pdf.text(`${rfTotalSum}`, 153, yPos + 7);
    pdf.text(`${totals.total}`, 168, yPos + 7);
    
    pdf.setTextColor(0, 0, 0);
    yPos += 10;
    
    // Draw table borders
    pdf.setLineWidth(0.3);
    // Vertical lines
    columns.forEach(col => {
      pdf.line(col.x - 2, tableStartY, col.x - 2, yPos);
    });
    pdf.line(pdfWidth - 10, tableStartY, pdfWidth - 10, yPos);
    
    // Horizontal lines
    pdf.line(10, tableStartY, pdfWidth - 10, tableStartY);
    pdf.line(10, tableStartY + 8, pdfWidth - 10, tableStartY + 8);
    pdf.line(10, yPos, pdfWidth - 10, yPos);
    
    // Terms and Conditions
    yPos += 15;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Terms & Conditions:', 10, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const terms = [
      '• Labour & Delivery Charge Will Be Extra',
      '• 50% Payment against Order and 50% Before delivery',
      '• No Guarantee On Mirror',
      '• We are not responsible for any loss or damage during transit [Scratches & chipping]',
      '• This quote is Valid for 7 days Approval Rate.'
    ];
    
    yPos += 8;
    terms.forEach(term => {
      if (yPos > pdfHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(term, 10, yPos);
      yPos += 5;
    });
    
    // Signature Section
    const signatureY = Math.max(yPos + 15, pdfHeight - 25);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Authorized Signature:', pdfWidth - 60, signatureY);
    
    // Draw signature line
    pdf.setLineWidth(0.5);
    pdf.line(pdfWidth - 45, signatureY + 10, pdfWidth - 10, signatureY + 10);
    
    pdf.save(`estimate-${customerDetails.name || 'unnamed'}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Error generating PDF. Please try again.');
  }
};
  const saveInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = {
        customerDetails,
        products,
        totals: calculateTotals()
      };

      const url = id 
        ? `http://localhost:5000/api/invoices/${id}`
        : 'http://localhost:5000/api/invoices';
      
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/invoices/${id}`);
      const data = await response.json();
      
      setCustomerDetails(data.customerDetails);
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <AppBar position="static" sx={{ mb: 4 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Glass Invoice Generator
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl">
          <div ref={invoiceRef}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Customer Name"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Date"
                      type="date"
                      value={customerDetails.date}
                      onChange={(e) => setCustomerDetails({...customerDetails, date: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Mobile Number"
                      value={customerDetails.mobile}
                      onChange={(e) => setCustomerDetails({...customerDetails, mobile: e.target.value})}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Hidden Print Section */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
  <div ref={printRef} style={{ backgroundColor: '#ffffff', padding: '20px', width: '210mm' }}>
       <Box sx={{ p: 2 }}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                      <Typography variant="subtitle1">Customer: {customerDetails.name}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="subtitle1">Date: {customerDetails.date}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="subtitle1">Mobile: {customerDetails.mobile}</Typography>
                    </Grid>
                  </Grid>

                  <TableContainer component={Paper}>
                  <Table size="small" style={{ width: '100%' }}>
                  <TableHead>
      <TableRow>
        <TableCell sx={{ width: '15%' }}>Particular</TableCell>
        <TableCell sx={{ width: '10%' }}>X(Length)</TableCell>
        <TableCell sx={{ width: '10%' }}>Y(Breadth)</TableCell>
        <TableCell sx={{ width: '10%' }}>Quantity</TableCell>
        <TableCell sx={{ width: '10%' }}>SqFt</TableCell>
        <TableCell sx={{ width: '10%' }}>Glass.Rate</TableCell>
        <TableCell sx={{ width: '10%' }}>G.Total</TableCell>
        <TableCell sx={{ width: '10%' }}>RunFt</TableCell>
        <TableCell sx={{ width: '10%' }}>Polish.Rate</TableCell>
        <TableCell sx={{ width: '10%' }}>RF.Total</TableCell>
        <TableCell sx={{ width: '10%' }}>Total</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {products.map((product, index) => (
        <TableRow key={index}>
          <TableCell>{product.particular}</TableCell>
          <TableCell>{product.isGlass ? product.x : '-'}</TableCell>
          <TableCell>{product.isGlass ? product.y : '-'}</TableCell>
          <TableCell>{product.isGlass ? product.quantity : '-'}</TableCell>
          <TableCell>{product.isGlass ? product.sqFt : '-'}</TableCell>
          <TableCell>{product.isGlass ? product.rate : '-'}</TableCell>
          <TableCell>{product.isGlass ? product.gTotal : '-'}</TableCell>
          <TableCell>{product.isGlass ? product.runFt : '-'}</TableCell>
          <TableCell>{product.isGlass ? product.rRate : '-'}</TableCell>
          <TableCell>{product.isGlass ? product.rfTotal : '-'}</TableCell>
          <TableCell>{product.total}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>


                  <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5' }}>
                    <Grid container spacing={2}>
                      {/* <Grid item xs={4}>
                        <Typography variant="subtitle1">G.Total: ₹{totals.gTotal.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="subtitle1">RF.Total: ₹{totals.rfTotal.toFixed(2)}</Typography>
                      </Grid> */}
                      <Grid item xs={4}>
                        <Typography variant="subtitle1">Total: ₹{totals.total.toFixed(2)}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </div>
            </div>

            {/* Editable Products Table */}
            <TableContainer component={Paper} sx={{ mb: 4, overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white' }}>Particular</TableCell>
                    <TableCell sx={{ color: 'white' }}>X(Length)</TableCell>
                    <TableCell sx={{ color: 'white' }}>Y(Breadth)</TableCell>
                    <TableCell sx={{ color: 'white' }}>Quantity</TableCell>
                    <TableCell sx={{ color: 'white' }}>SqFt</TableCell>
                    <TableCell sx={{ color: 'white' }}>Glass.Rate</TableCell>
                    <TableCell sx={{ color: 'white' }}>G.Total</TableCell>
                    <TableCell sx={{ color: 'white' }}>RunFt</TableCell>
                    <TableCell sx={{ color: 'white' }}>Polish.Rate</TableCell>
                    <TableCell sx={{ color: 'white' }}>RF.Total</TableCell>
                    <TableCell sx={{ color: 'white' }}>Total</TableCell>
                    <TableCell sx={{ color: 'white' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index} sx={{ bgcolor: product.isGlass ? 'inherit' : '#f8f9fa' }}>
                      <TableCell>
                        <TextField
                          value={product.particular}
                          onChange={(e) => handleProductChange(index, 'particular', e.target.value)}
                          size="small"
                          variant="outlined"
                          placeholder={product.isGlass ? "Glass type..." : "Item description..."}
                        />
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          <TextField
                            value={product.x}
                            onChange={(e) => handleProductChange(index, 'x', e.target.value)}
                            type="number"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <TextField
                            value={product.x}
                            onChange={(e) => handleProductChange(index, 'x', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          <TextField
                            value={product.y}
                            onChange={(e) => handleProductChange(index, 'y', e.target.value)}
                            type="number"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <TextField
                            value={product.y}
                            onChange={(e) => handleProductChange(index, 'y', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          <TextField
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                            type="number"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <TextField
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          product.sqFt
                        ) : (
                          <TextField
                            value={product.sqFt}
                            onChange={(e) => handleProductChange(index, 'sqFt', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          <TextField
                            value={product.rate}
                            onChange={(e) => handleProductChange(index, 'rate', e.target.value)}
                            type="number"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <TextField
                            value={product.rate}
                            onChange={(e) => handleProductChange(index, 'rate', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          product.gTotal
                        ) : (
                          <TextField
                            value={product.gTotal}
                            onChange={(e) => handleProductChange(index, 'gTotal', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          product.runFt
                        ) : (
                          <TextField
                            value={product.runFt}
                            onChange={(e) => handleProductChange(index, 'runFt', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          <TextField
                            value={product.rRate}
                            onChange={(e) => handleProductChange(index, 'rRate', e.target.value)}
                            type="number"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <TextField
                            value={product.rRate}
                            onChange={(e) => handleProductChange(index, 'rRate', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          product.rfTotal
                        ) : (
                          <TextField
                            value={product.rfTotal}
                            onChange={(e) => handleProductChange(index, 'rfTotal', e.target.value)}
                            size="small"
                            variant="outlined"
                            placeholder="Custom field..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isGlass ? (
                          product.total
                        ) : (
                          <TextField
                            value={product.total}
                            onChange={(e) => handleProductChange(index, 'total', e.target.value)}
                            type="number"
                            size="small"
                            variant="outlined"
                            placeholder="Total amount..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => removeProduct(index)}
                          color="secondary"
                          size="small"
                        >
                          <Trash />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add Product Button with Dropdown */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Button
                variant="contained"
                startIcon={<Plus />}
                endIcon={<ChevronDown />}
                onClick={handleMenuClick}
              >
                Add Item
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem onClick={() => addProduct(true)}>
                  <Plus style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                  Add Glass
                </MenuItem>
                <MenuItem onClick={() => addProduct(false)}>
                  <Plus style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                  Add Custom Field
                </MenuItem>
              </Menu>
            </Box>

            {/* Totals Card */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    {/* <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle1">
                        G.Total: ₹{totals.gTotal.toFixed(2)}
                      </Typography>
                    </Paper> */}
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    {/* <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle1">
                        RF.Total: ₹{totals.rfTotal.toFixed(2)}
                      </Typography>
                    </Paper> */}
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle1">
                        Total: ₹{totals.total.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </div>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>

          <Button
    variant="contained"
    color="primary"
    onClick={saveInvoice}
    disabled={loading}
  >
    {loading ? 'Saving...' : 'Save Invoice'}
  </Button>
  </Box>

          {/* Download PDF Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Download />}
              onClick={generatePDF}
            >
              Download PDF
            </Button>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default InvoiceForm;