import React, { useState, useRef } from 'react';
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
} from '@mui/material';
import { Trash, Download as DownloadIcon,CirclePlus } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const App = () => {
  const invoiceRef = useRef();
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
    const element = invoiceRef.current;
    
    // Configure html2canvas with better settings
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#E0FFFF', // Light cyan background like in image
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF with A4 format
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Add company details at top
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTIMATE / ORDER', pdfWidth/2, 15, { align: 'center' });
    
    // Add the main content
    pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
    
    // Add terms at bottom
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const terms = [
      'Terms:',
      'Labour & Delivery Charge Will Be Extra',
      '50% Payment against Order and 50% Before delivery',
      'No Guarantee On Mirror',
      'We are not responsible for any loss or damage during transit [ Scratches & chipping ]',
      'This quote is Valid for 7 days Approval Rate.'
    ];
    
    let yPos = pdfHeight - 40;
    terms.forEach(term => {
      pdf.text(term, 10, yPos);
      yPos += 5;
    });
  
    // Add signature line
    pdf.text('Authorized Sig.', pdfWidth - 50, pdfHeight - 20);
    
    pdf.save(`estimate-${customerDetails.name || 'unnamed'}-${new Date().toISOString().split('T')[0]}.pdf`);
  };


  return (
    <Box className="p-4 max-w-7xl mx-auto">
      <div ref={invoiceRef}>
        <Card className="mb-4">
          <CardContent>
            <Typography variant="h5" className="mb-4">Customer Details</Typography>
            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                label="Customer Name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                fullWidth
              />
              <TextField
                label="Date"
                type="date"
                value={customerDetails.date}
                onChange={(e) => setCustomerDetails({...customerDetails, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Mobile Number"
                value={customerDetails.mobile}
                onChange={(e) => setCustomerDetails({...customerDetails, mobile: e.target.value})}
                fullWidth
              />
            </Box>
          </CardContent>
        </Card>

        <TableContainer component={Paper} className="mb-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Particular(Glass)</TableCell>
                <TableCell>X(Length)</TableCell>
                <TableCell>Y(Breadth)</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>SqFt</TableCell>
                <TableCell>Glass.Rate</TableCell>
                <TableCell>G.Total</TableCell>
                <TableCell>RunFt</TableCell>
                <TableCell>Polish.Rate</TableCell>
                <TableCell>RF.Total</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Action</TableCell>
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
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={product.x}
                      onChange={(e) => handleProductChange(index, 'x', e.target.value)}
                      type="number"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={product.y}
                      onChange={(e) => handleProductChange(index, 'y', e.target.value)}
                      type="number"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                      type="number"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{product.sqFt}</TableCell>
                  <TableCell>
                    <TextField
                      value={product.rate}
                      onChange={(e) => handleProductChange(index, 'rate', e.target.value)}
                      type="number"
                      size="small"
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
                    />
                  </TableCell>
                  <TableCell>{product.rfTotal}</TableCell>
                  <TableCell>{product.total}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => removeProduct(index)} size="small">
                      <Trash className="w-4 h-4" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box className="flex justify-between mt-4">
        <Button
          variant="contained"
          startIcon={<CirclePlus/>}
          onClick={addProduct}
        >
          Add Glass
        </Button>
        </Box>
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-2">Totals</Typography>
            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Typography>G.Total: {totals.gTotal.toFixed(2)}</Typography>
              <Typography>RF.Total: {totals.rfTotal.toFixed(2)}</Typography>
              <Typography>Total: {totals.total.toFixed(2)}</Typography>
            </Box>
          </CardContent>
        </Card>
      </div>

      <Box className="flex justify-between mt-4">
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={generatePDF}
        >
          Download PDF
        </Button>
      </Box>
    </Box>
  );
};

export default App;