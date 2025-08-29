// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tabCobrar = document.getElementById('tabCobrar');
    const tabPagar = document.getElementById('tabPagar');
    const transactionForm = document.getElementById('transactionForm');
    const transactionsList = document.getElementById('transactionsList');
    const totalCobrar = document.getElementById('totalCobrar');
    const totalPagar = document.getElementById('totalPagar');
    
    // State
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let currentTab = 'cobrar';

    // Initialize the app
    function init() {
        // Set initial tab styling
        switchTab('cobrar');
        renderTransactions();
        updateTotals();
        setupEventListeners();
        setupImportExport();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Tab switching
        tabCobrar.addEventListener('click', () => switchTab('cobrar'));
        tabPagar.addEventListener('click', () => switchTab('pagar'));
        
        // Form submission
        transactionForm.addEventListener('submit', handleFormSubmit);
        
        // Search and filter
        document.getElementById('searchInput').addEventListener('input', () => {
            renderTransactions();
        });
        
        document.getElementById('filterType').addEventListener('change', () => {
            renderTransactions();
        });
    }

    // Switch between tabs
    function switchTab(tab) {
        currentTab = tab;
        
        // Update tab styles
        if (tab === 'cobrar') {
            // Green for 'Cuentas por Cobrar'
            tabCobrar.classList.add('border-green-500', 'text-green-600', 'bg-green-50');
            tabCobrar.classList.remove('text-gray-500', 'bg-white');
            // Reset 'Cuentas por Pagar' tab
            tabPagar.classList.remove('border-red-500', 'text-red-600', 'bg-red-50');
            tabPagar.classList.add('text-gray-500', 'bg-white');
        } else {
            // Red for 'Cuentas por Pagar'
            tabPagar.classList.add('border-red-500', 'text-red-600', 'bg-red-50');
            tabPagar.classList.remove('text-gray-500', 'bg-white');
            // Reset 'Cuentas por Cobrar' tab
            tabCobrar.classList.remove('border-green-500', 'text-green-600', 'bg-green-50');
            tabCobrar.classList.add('text-gray-500', 'bg-white');
        }
        
        // Update transaction type in form
        document.getElementById('transactionType').value = tab;
        
        // Re-render transactions
        renderTransactions();
    }

    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(transactionForm);
        const transaction = {
            id: Date.now().toString(),
            type: formData.get('transactionType'),
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            dueDate: formData.get('dueDate'),
            createdAt: new Date().toISOString()
        };
        
        // Add to transactions array and save
        transactions.push(transaction);
        saveTransactions();
        
        // Reset form and update UI
        transactionForm.reset();
        renderTransactions();
        updateTotals();
    }

    // Render transactions list
    function renderTransactions() {
        // Filter transactions by current tab
        const filteredTransactions = transactions.filter(
            t => t.type === currentTab
        );
        
        // Get search term and filter type
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterType = document.getElementById('filterType').value;
        
        // Apply filters
        let displayTransactions = filteredTransactions.filter(transaction => {
            const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) || 
                               transaction.amount.toString().includes(searchTerm);
            const matchesType = filterType === 'all' || transaction.type === filterType;
            return matchesSearch && matchesType;
        });
        
        // Sort by due date (ascending) and then by paid status (unpaid first)
        displayTransactions.sort((a, b) => {
            if (a.paid !== b.paid) {
                return a.paid ? 1 : -1;
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Clear current list
        transactionsList.innerHTML = '';
        
        // Show/hide empty state
        const emptyState = document.getElementById('emptyState');
        if (displayTransactions.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }
        
        // Group transactions by date
        const transactionsByDate = {};
        displayTransactions.forEach(transaction => {
            const dateKey = new Date(transaction.dueDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            if (!transactionsByDate[dateKey]) {
                transactionsByDate[dateKey] = [];
            }
            transactionsByDate[dateKey].push(transaction);
        });
        
        // Add transactions to the list grouped by date
        Object.entries(transactionsByDate).forEach(([date, dateTransactions]) => {
            // Add date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'text-sm font-medium text-gray-500 mb-2 mt-4 first:mt-0';
            dateHeader.textContent = date;
            transactionsList.appendChild(dateHeader);
            
            // Add transactions for this date
            dateTransactions.forEach(transaction => {
                const transactionElement = createTransactionElement(transaction);
                transactionsList.appendChild(transactionElement);
            });
        });
    }
    
    // Create a transaction element
    function createTransactionElement(transaction) {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200';
        
        const dueDate = new Date(transaction.dueDate);
        const formattedDate = dueDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateObj = new Date(transaction.dueDate);
        dueDateObj.setHours(0, 0, 0, 0);
        
        const isOverdue = dueDateObj < today && !transaction.paid;
        const isToday = dueDateObj.getTime() === today.getTime();
        
        // Calculate days until due
        const timeDiff = dueDateObj - today;
        const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        let statusBadge = '';
        if (transaction.paid) {
            statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Pagado</span>';
        } else if (isOverdue) {
            statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Vencido ${Math.abs(daysUntilDue)}d</span>`;
        } else if (isToday) {
            statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Hoy</span>';
        } else if (daysUntilDue <= 3) {
            statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">En ${daysUntilDue}d</span>`;
        }
        
        transactionElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <h3 class="text-base font-medium text-gray-900 truncate pr-2">${transaction.description}</h3>
                        <div class="flex-shrink-0">
                            <span class="text-sm font-semibold ${transaction.type === 'cobrar' ? 'text-green-600' : 'text-red-600'}">
                                ${transaction.type === 'cobrar' ? '+' : '-'} $${transaction.amount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div class="mt-1 flex flex-wrap items-center text-sm text-gray-500">
                        <div class="flex items-center mr-3">
                            <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            ${formattedDate}
                        </div>
                        ${statusBadge}
                    </div>
                </div>
                <div class="ml-4 flex-shrink-0 flex space-x-2">
                    <button onclick="markAsPaid('${transaction.id}')" class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        ${transaction.paid ? '✓ Pagado' : 'Marcar pagado'}
                    </button>
                    <button onclick="deleteTransaction('${transaction.id}')" class="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Add paid style if transaction is paid
        if (transaction.paid) {
            transactionElement.classList.add('opacity-70');
            transactionElement.querySelector('h3').classList.add('line-through', 'text-gray-400');
        }
        
        return transactionElement;
    }
    
    // Update the total amounts
    function updateTotals() {
        const cobrarTotal = transactions
            .filter(t => t.type === 'cobrar' && !t.paid)
            .reduce((sum, t) => sum + getCurrentBalance(t), 0);
            
        const pagarTotal = transactions
            .filter(t => t.type === 'pagar' && !t.paid)
            .reduce((sum, t) => sum + getCurrentBalance(t), 0);
            
        totalCobrar.textContent = cobrarTotal.toFixed(2);
        totalPagar.textContent = pagarTotal.toFixed(2);
    }
    
    // Calculate current balance including interest and payments
    function getCurrentBalance(transaction) {
        const originalAmount = transaction.amount;
        const totalPaid = transaction.totalPaid || 0;
        const interest = calculateInterest(transaction);
        return Math.max(0, originalAmount + interest - totalPaid);
    }
    
    // Calculate interest for a transaction
    function calculateInterest(transaction) {
        if (!transaction.interestRate || transaction.interestRate === 0) return 0;
        
        const dueDate = new Date(transaction.dueDate);
        const today = new Date();
        const monthsLate = Math.max(0, (today.getFullYear() - dueDate.getFullYear()) * 12 + (today.getMonth() - dueDate.getMonth()));
        
        // Simple interest calculation
        return (transaction.amount * (transaction.interestRate / 100) * monthsLate);
    }
    
    // Add payment to a transaction
    function addPayment(transactionId, amount, date) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        const payment = {
            id: Date.now().toString(),
            amount: parseFloat(amount),
            date: date || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        if (!transaction.payments) transaction.payments = [];
        transaction.payments.push(payment);
        transaction.totalPaid = (transaction.totalPaid || 0) + payment.amount;
        
        // Update transaction status
        updateTransactionStatus(transaction);
        
        saveTransactions();
        renderTransactions();
        updateTotals();
        
        showNotification(`✅ Abono de $${amount} registrado correctamente`, 'success');
    }
    
    // Update transaction status based on payments and balance
    function updateTransactionStatus(transaction) {
        const currentBalance = getCurrentBalance(transaction);
        
        if (currentBalance <= 0) {
            transaction.status = 'paid';
        } else if (transaction.totalPaid > 0) {
            transaction.status = 'partially_paid';
        } else {
            const dueDate = new Date(transaction.dueDate);
            const today = new Date();
            if (dueDate < today) {
                transaction.status = 'overdue';
            } else {
                transaction.status = 'pending';
            }
        }
    }
    
    // Save transactions to localStorage
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    // Mark a transaction as paid
    window.markAsPaid = function(id) {
        const transaction = transactions.find(t => t.id === id);
        if (transaction) {
            transaction.paid = !transaction.paid;
            transaction.updatedAt = new Date().toISOString();
            saveTransactions();
            
            // Update the UI immediately for better UX
            const transactionElement = document.querySelector(`[data-transaction-id="${id}"]`);
            if (transactionElement) {
                // Add a temporary class for visual feedback
                transactionElement.classList.add('opacity-50');
                
                // Wait for the animation to complete before re-rendering
                setTimeout(() => {
                    renderTransactions();
                    updateTotals();
                    
                    const message = transaction.paid 
                        ? '✅ Transacción marcada como pagada' 
                        : '🔄 Transacción marcada como pendiente';
                    showNotification(message, transaction.paid ? 'success' : 'info');
                }, 150);
            }
        }
    };
    
    // Delete a transaction
    window.deleteTransaction = function(id) {
        // Find the transaction to get its description for the message
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        // Create a more modern confirmation dialog
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-sm w-full mx-auto shadow-xl transform transition-all">
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mt-3">¿Eliminar transacción?</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500">
                            ¿Estás seguro de que quieres eliminar "${transaction.description}" por $${transaction.amount.toFixed(2)}?
                        </p>
                    </div>
                    <div class="mt-4 flex justify-center space-x-3">
                        <button type="button" class="delete-confirm-cancel px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Cancelar
                        </button>
                        <button type="button" class="delete-confirm-ok px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.appendChild(modal);
        
        // Handle button clicks
        const cancelBtn = modal.querySelector('.delete-confirm-cancel');
        const confirmBtn = modal.querySelector('.delete-confirm-ok');
        
        const cleanup = () => {
            cancelBtn.removeEventListener('click', onCancel);
            confirmBtn.removeEventListener('click', onConfirm);
            modal.remove();
            document.body.style.overflow = ''; // Re-enable scrolling
        };
        
        const onCancel = () => {
            modal.classList.add('opacity-0');
            setTimeout(cleanup, 200);
        };
        
        const onConfirm = () => {
            // Remove the transaction
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            
            // Update UI
            const transactionElement = document.querySelector(`[data-transaction-id="${id}"]`);
            if (transactionElement) {
                // Add animation class
                transactionElement.classList.add('opacity-0', 'scale-95', 'transition-all', 'duration-200');
                
                // Wait for animation to complete before removing and re-rendering
                setTimeout(() => {
                    renderTransactions();
                    updateTotals();
                    showNotification('🗑️ Transacción eliminada', 'success');
                }, 200);
            }
            
            cleanup();
        };
        
        // Add event listeners
        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirm);
        
        // Disable scrolling when modal is open
        document.body.style.overflow = 'hidden';
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) onCancel();
        });
        
        // Close with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', handleEscape);
        
        // Clean up event listener when modal is closed
        const observer = new MutationObserver(() => {
            if (!document.body.contains(modal)) {
                document.removeEventListener('keydown', handleEscape);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
    };
    
    // Setup import/export functionality
    function setupImportExport() {
        // Export to JSON
        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            // Create a JSON string of the transactions
            const dataStr = JSON.stringify(transactions, null, 2);
            
            // Create a data URI
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            // Create a temporary link and trigger download
            const exportName = `cuentas-${new Date().toISOString().split('T')[0]}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportName);
            linkElement.click();
            
            showNotification('✅ Datos exportados a JSON correctamente', 'success');
        });
        
        // Export to Excel
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            try {
                // Prepare the data for Excel
                const dataForExcel = transactions.map(trans => ({
                    'Tipo': trans.type === 'cobrar' ? 'Por Cobrar' : 'Por Pagar',
                    'Descripción': trans.description,
                    'Monto': trans.amount,
                    'Moneda': '$',
                    'Fecha Vencimiento': new Date(trans.dueDate).toLocaleDateString('es-ES'),
                    'Estado': trans.paid ? 'Pagado' : 'Pendiente',
                    'Fecha Creación': new Date(trans.createdAt).toLocaleString('es-ES')
                }));
                
                // Create a new workbook
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(dataForExcel);
                
                // Add the worksheet to the workbook
                XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
                
                // Generate Excel file and trigger download
                const exportName = `cuentas-${new Date().toISOString().split('T')[0]}.xlsx`;
                XLSX.writeFile(wb, exportName);
                
                showNotification('Datos exportados a Excel correctamente', 'success');
            } catch (error) {
                console.error('Error al exportar a Excel:', error);
                showNotification('Error al exportar a Excel', 'error');
            }
        });
        
        // Import input
        document.getElementById('importInput').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (confirm('¿Deseas reemplazar los datos actuales con los importados?')) {
                        transactions = importedData;
                        saveTransactions();
                        renderTransactions();
                        updateTotals();
                        showNotification('Datos importados correctamente', 'success');
                    }
                } catch (error) {
                    console.error('Error al importar datos:', error);
                    showNotification('Error al importar datos. El archivo podría estar dañado.', 'error');
                }
                // Reset the input to allow re-importing the same file
                event.target.value = '';
            };
            reader.readAsText(file);
        });
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    // Initialize the app
    init();
});
