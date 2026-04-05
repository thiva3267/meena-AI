import React, { useState } from 'react';
import axios from 'axios';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export default function InvoiceGenerator() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);

  const addItem = () => {
    setItems([...items, { description, quantity, price }]);
    setDescription('');
    setQuantity(1);
    setPrice(0);
  };

  const generateInvoice = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/invoice/generate', {
        items,
        clientName: 'Client Name',
        invoiceDate: new Date().toISOString(),
      }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoice.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };

  return (
    <div className="invoice-generator">
      <h2>Invoice Generator</h2>
      
      <div className="item-input">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <button onClick={addItem}>Add Item</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>${item.price}</td>
              <td>${item.quantity * item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={generateInvoice}>Download Invoice as PDF</button>
    </div>
  );
}