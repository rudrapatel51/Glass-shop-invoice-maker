import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InvoiceList from "./components/InvoiceList"
import InvoiceForm from "./components/InvoiceForm"


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Layout />}> */}
          {/* <Route index element={<Home />} /> */}
          <Route path="/" element={<InvoiceList />} />
        <Route path="/new-invoice" element={<InvoiceForm />} />
        <Route path="/edit-invoice/:id" element={<InvoiceForm />} />
        <Route path="/view-invoice/:id" element={<InvoiceForm mode="view" />} />
      {/* </Route> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App