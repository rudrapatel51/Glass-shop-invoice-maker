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
} from '@mui/material';
import { Trash, Download, Plus } from 'lucide-react';
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
  }]);

  const calculateValues = (product) => {
    const x = parseFloat(product.x) || 0;
    const y = parseFloat(product.y) || 0;
    const quantity = parseFloat(product.quantity) || 0;
    const rate = parseFloat(product.rate) || 0;
    const rRate = parseFloat(product.rRate) || 0;

    const sqFt = ((x * y) / 144) * quantity;
    const gTotal = sqFt * rate;
    const runFt = (((x / 12) + (y / 12)) * 2);
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

  const addProduct = () => {
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
    }]);
  };

  const removeProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const calculateTotals = () => {
    return products.reduce((acc, product) => ({
      gTotal: acc.gTotal + parseFloat(product.gTotal || 0),
      rfTotal: acc.rfTotal + parseFloat(product.rfTotal || 0),
      total: acc.total + parseFloat(product.total || 0),
    }), { gTotal: 0, rfTotal: 0, total: 0 });
  };

  const totals = calculateTotals();

  const generatePDF = async () => {
    try {
      const element = printRef.current;
      
      await new Promise(resolve => setTimeout(resolve, 100));
  
      const printElement = element.querySelector('table');
      if (printElement) {
        printElement.style.width = '100%';
        printElement.style.tableLayout = 'fixed';
        
        const cells = printElement.querySelectorAll('th, td');
        cells.forEach(cell => {
          cell.style.padding = '4px';
          cell.style.fontSize = '8px';
          cell.style.whiteSpace = 'nowrap';
          cell.style.overflow = 'hidden';
          cell.style.textOverflow = 'ellipsis';
        });
      }
  
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: true,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (document) => {
          const printElement = document.querySelector('[ref="printRef"]');
          if (printElement) {
            printElement.style.display = 'block';
            printElement.style.width = '100%';
            const table = printElement.querySelector('table');
            if (table) {
              table.style.display = 'table';
              table.style.width = '100%';
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait', 
        unit: 'mm',
        format: 'a4'
      });
  
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Header
      pdf.setFillColor(25, 118, 210);
      pdf.rect(0, 0, pdfWidth, 20, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ESTIMATE / ORDER OF MAHADEV GLASS', pdfWidth/2, 15, { align: 'center' });
      
      pdf.setTextColor(0, 0, 0);
      
      try {
        pdf.addImage(imgData, 'JPEG', 10, 25, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error adding image to PDF:', error);
      }
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const terms = [
        'Terms:',
        'Labour & Delivery Charge Will Be Extra',
        '50% Payment against Order and 50% Before delivery',
        'No Guarantee On Mirror',
        'We are not responsible for any loss or damage during transit [ Scratches & chipping ]',
        'This quote is Valid for 7 days Approval Rate.'
      ];
      
      let yPos = pdfHeight - 30;
      terms.forEach(term => {
        pdf.text(term, 10, yPos);
        yPos += 4;
      });
  
      pdf.text('Authorized Sig.', pdfWidth - 40, pdfHeight - 10);
      
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
        <TableCell sx={{ width: '15%' }}>Particular(Glass)</TableCell>
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
          <TableCell>{product.x}</TableCell>
          <TableCell>{product.y}</TableCell>
          <TableCell>{product.quantity}</TableCell>
          <TableCell>{product.sqFt}</TableCell>
          <TableCell>{product.rate}</TableCell>
          <TableCell>{product.gTotal}</TableCell>
          <TableCell>{product.runFt}</TableCell>
          <TableCell>{product.rRate}</TableCell>
          <TableCell>{product.rfTotal}</TableCell>
          <TableCell>{product.total}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>


                  <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="subtitle1">G.Total: ₹{totals.gTotal.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="subtitle1">RF.Total: ₹{totals.rfTotal.toFixed(2)}</Typography>
                      </Grid>
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
                    <TableCell sx={{ color: 'white' }}>Particular(Glass)</TableCell>
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
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          value={product.particular}
                          onChange={(e) => handleProductChange(index, 'particular', e.target.value)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={product.x}
                          onChange={(e) => handleProductChange(index, 'x', e.target.value)}
                          type="number"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={product.y}
                          onChange={(e) => handleProductChange(index, 'y', e.target.value)}
                          type="number"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                          type="number"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{product.sqFt}</TableCell>
                      <TableCell>
                        <TextField
                          value={product.rate}
                          onChange={(e) => handleProductChange(index, 'rate', e.target.value)}
                          type="number"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{product.gTotal}</TableCell>
                      <TableCell>{product.runFt}</TableCell>
                      <TableCell>
                        <TextField
                          value={product.rRate}
                          onChange={(e) => handleProductChange(index, 'rRate', e.target.value)}
                          type="number"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{product.rfTotal}</TableCell>
                      <TableCell>{product.total}</TableCell>
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

            {/* Add Product Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={addProduct}
              >
                Add Glass
              </Button>
            </Box>

            {/* Totals Card */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle1">
                        G.Total: ₹{totals.gTotal.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle1">
                        RF.Total: ₹{totals.rfTotal.toFixed(2)}
                      </Typography>
                    </Paper>
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