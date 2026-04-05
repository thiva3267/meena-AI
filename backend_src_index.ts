import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase initialization
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;

    // Save user message to Supabase
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert([{ id: conversationId, user_id: 'current_user' }])
      .select();

    if (convError) console.error('Conversation error:', convError);

    // Save message
    const { error: msgError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        role: 'user',
        content: message,
      }]);

    if (msgError) console.error('Message error:', msgError);

    // Call AI service (OpenAI/Gemini/etc.)
    const aiResponse = await callAIService(message);

    // Save assistant response
    await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
      }]);

    res.json({
      reply: aiResponse,
      conversationId,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Age generator endpoint
app.post('/api/age-generator', (req: Request, res: Response) => {
  try {
    const { birthDate } = req.body;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    res.json({ age });
  } catch (error) {
    res.status(400).json({ error: 'Invalid date format' });
  }
});

// Invoice generation endpoint
app.post('/api/invoice/generate', async (req: Request, res: Response) => {
  try {
    const { items, clientName, invoiceDate } = req.body;

    // Save invoice to Supabase
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([{
        client_name: clientName,
        invoice_date: invoiceDate,
        total_amount: items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0),
      }])
      .select();

    if (error) throw error;

    // Generate PDF (using pdfkit or similar)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    doc.fontSize(16).text('Invoice', { align: 'center' });
    doc.fontSize(10).text(`Client: ${clientName}`);
    doc.text(`Date: ${new Date(invoiceDate).toLocaleDateString()}`);
    doc.moveDown();

    items.forEach((item: InvoiceItem) => {
      doc.text(`${item.description} x${item.quantity} @ $${item.price} = $${item.quantity * item.price}`);
    });

    const total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
    doc.moveDown().fontSize(12).text(`Total: $${total}`);

    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

// AI Service helper
async function callAIService(message: string): Promise<string> {
  // Replace with actual AI API calls (OpenAI, Gemini, etc.)
  // Example:
  // const response = await fetch('https://api.openai.com/v1/chat/completions', { ... })
  return `Meena Assistant: Processing your request - "${message}"`;
}

app.listen(PORT, () => {
  console.log(`Meena AI Assistant backend running on port ${PORT}`);
});