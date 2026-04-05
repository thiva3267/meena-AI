// Configuration
const API_URL = 'http://localhost:5000/api';
let conversationId = localStorage.getItem('conversationId') || generateId();
let invoiceItems = [];

// ===== Tab Navigation =====
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = link.getAttribute('data-tab');
        
        // Remove active class from all links and contents
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        
        // Add active class to clicked link and corresponding content
        link.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// ===== Chat Functionality =====
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const clearBtn = document.getElementById('clearChat');
const loader = document.getElementById('loader');

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

clearBtn.addEventListener('click', () => {
    chatMessages.innerHTML = `
        <div class="message assistant">
            <div class="message-content">
                👋 Hello! I'm Meena, your AI Assistant. How can I help you today?
            </div>
        </div>
    `;
    chatInput.value = '';
});

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Disable input while sending
    chatInput.disabled = true;
    sendBtn.disabled = true;
    loader.style.display = 'inline-block';

    // Add user message to chat
    addMessage(message, 'user');
    chatInput.value = '';

    try {
        // Send to backend
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationId: conversationId
            })
        });

        if (!response.ok) throw new Error('Failed to send message');

        const data = await response.json();
        conversationId = data.conversationId;
        localStorage.setItem('conversationId', conversationId);

        // Add assistant response
        addMessage(data.reply, 'assistant');
    } catch (error) {
        console.error('Chat error:', error);
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        loader.style.display = 'none';
        chatInput.focus();
    }
}

function addMessage(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== Age Calculator =====
const birthDateInput = document.getElementById('birthDate');
const calculateBtn = document.getElementById('calculateBtn');
const ageResult = document.getElementById('ageResult');

calculateBtn.addEventListener('click', calculateAge);
birthDateInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculateAge();
});

function calculateAge() {
    const birthDate = new Date(birthDateInput.value);
    
    if (!birthDateInput.value) {
        alert('Please select a birth date');
        return;
    }

    if (birthDate > new Date()) {
        alert('Birth date cannot be in the future');
        return;
    }

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    document.getElementById('years').textContent = years;
    document.getElementById('months').textContent = months;
    document.getElementById('days').textContent = days;
    document.getElementById('ageText').textContent = 
        `You are ${years} years, ${months} months, and ${days} days old`;

    ageResult.style.display = 'block';
}

// ===== Invoice Generator =====
const clientNameInput = document.getElementById('clientName');
const itemDescInput = document.getElementById('itemDesc');
const itemQtyInput = document.getElementById('itemQty');
const itemPriceInput = document.getElementById('itemPrice');
const addItemBtn = document.getElementById('addItemBtn');
const invoiceItemsBody = document.getElementById('invoiceItems');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const printBtn = document.getElementById('printBtn');

addItemBtn.addEventListener('click', addInvoiceItem);
downloadPdfBtn.addEventListener('click', downloadPDF);
printBtn.addEventListener('click', printInvoice);

function addInvoiceItem() {
    const description = itemDescInput.value.trim();
    const quantity = parseInt(itemQtyInput.value) || 1;
    const price = parseFloat(itemPriceInput.value) || 0;

    if (!description || quantity <= 0 || price <= 0) {
        alert('Please fill in all fields with valid values');
        return;
    }

    invoiceItems.push({ description, quantity, price });
    
    itemDescInput.value = '';
    itemQtyInput.value = '1';
    itemPriceInput.value = '';
    itemDescInput.focus();

    updateInvoicePreview();
}

function updateInvoicePreview() {
    // Update client name
    document.getElementById('previewClient').textContent = 
        clientNameInput.value || 'Not specified';

    // Update date
    const today = new Date().toLocaleDateString();
    document.getElementById('previewDate').textContent = today;

    // Update items table
    if (invoiceItems.length === 0) {
        invoiceItemsBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #999;">No items added</td>
            </tr>
        `;
    } else {
        invoiceItemsBody.innerHTML = invoiceItems.map((item, index) => {
            const total = item.quantity * item.price;
            return `
                <tr>
                    <td>${escapeHtml(item.description)}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${total.toFixed(2)}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteItem(${index})" style="
                            background: var(--danger-color);
                            color: white;
                            padding: 0.25rem 0.5rem;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.8rem;
                        ">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('tax').textContent = tax.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

function deleteItem(index) {
    invoiceItems.splice(index, 1);
    updateInvoicePreview();
}

function downloadPDF() {
    if (invoiceItems.length === 0) {
        alert('Please add items to the invoice');
        return;
    }

    const clientName = clientNameInput.value || 'Client';
    const today = new Date().toLocaleDateString();
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #333; }
                .details { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; }
                td { padding: 10px; border: 1px solid #ddd; }
                .summary { text-align: right; margin-top: 20px; }
                .total { font-size: 18px; font-weight: bold; color: #10b981; }
            </style>
        </head>
        <body>
            <h1>INVOICE</h1>
            <div class="details">
                <p><strong>Client:</strong> ${escapeHtml(clientName)}</p>
                <p><strong>Date:</strong> ${today}</p>
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
                    ${invoiceItems.map(item => `
                        <tr>
                            <td>${escapeHtml(item.description)}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>$${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="summary">
                <p>Subtotal: $${subtotal.toFixed(2)}</p>
                <p>Tax (10%): $${tax.toFixed(2)}</p>
                <p class="total">Total: $${total.toFixed(2)}</p>
            </div>
        </body>
        </html>
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
    element.setAttribute('download', `Invoice_${clientName}_${today}.html`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function printInvoice() {
    if (invoiceItems.length === 0) {
        alert('Please add items to the invoice');
        return;
    }

    window.print();
}

// ===== Utility Functions =====
function generateId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.getElementById('previewDate').textContent = new Date().toLocaleDateString();
clientNameInput.addEventListener('input', updateInvoicePreview);