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

        // Mobile menu functionality
        setupMobileMenu();
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
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div class="flex-1 min-w-0">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <h3 class="text-sm sm:text-base font-medium text-gray-900 break-words sm:truncate sm:pr-2">${transaction.description}</h3>
                        <div class="flex-shrink-0">
                            <span class="text-lg sm:text-sm font-semibold ${transaction.type === 'cobrar' ? 'text-green-600' : 'text-red-600'}">
                                ${transaction.type === 'cobrar' ? '+' : '-'} $${transaction.amount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div class="mt-2 sm:mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                        <div class="flex items-center">
                            <svg class="flex-shrink-0 mr-1.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            ${formattedDate}
                        </div>
                        <div class="sm:ml-3">
                            ${statusBadge}
                        </div>
                        ${transaction.payments && transaction.payments.length > 0 ? `
                            <div class="sm:ml-3 flex items-center">
                                <svg class="flex-shrink-0 mr-1 h-3 w-3 sm:h-4 sm:w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span class="text-green-600 font-medium">${transaction.payments.length} abono${transaction.payments.length > 1 ? 's' : ''}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="flex flex-row sm:flex-col sm:ml-4 sm:flex-shrink-0 space-x-2 sm:space-x-0 sm:space-y-2">
                    <button onclick="markAsPaid('${transaction.id}')" class="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-2.5 py-2 sm:py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                        ${transaction.paid ? '✓ Pagado' : 'Marcar pagado'}
                    </button>
                    <button onclick="showPaymentModal('${transaction.id}')" class="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-2.5 py-2 sm:py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                        <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Abonos
                    </button>
                    <button onclick="deleteTransaction('${transaction.id}')" class="flex-none inline-flex items-center justify-center p-2 sm:p-1.5 border border-transparent rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
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
            .reduce((sum, t) => sum + t.amount, 0);
            
        const pagarTotal = transactions
            .filter(t => t.type === 'pagar' && !t.paid)
            .reduce((sum, t) => sum + t.amount, 0);
            
        totalCobrar.textContent = formatColombianNumber(cobrarTotal);
        totalPagar.textContent = formatColombianNumber(pagarTotal);
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
    function addPayment(transactionId, amount, date, description = '') {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        const payment = {
            id: Date.now().toString(),
            amount: parseFloat(amount),
            date: date || new Date().toISOString(),
            description: description || 'Abono',
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
        
        showNotification(`✅ Abono de ${formatCurrency(amount, transaction.currency)} registrado correctamente`, 'success');
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

    // Show payment management modal
    function showPaymentModal(transactionId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        const currentBalance = getCurrentBalance(transaction);
        const totalPaid = transaction.totalPaid || 0;
        const originalAmount = transaction.amount;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-800 flex items-center">
                            <svg class="h-6 w-6 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Gestionar Abonos - ${transaction.description}
                        </h2>
                        <button onclick="this.closest('.fixed').remove()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="p-6 space-y-6">
                    <!-- Resumen de la transacción -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div>
                                <p class="text-sm text-gray-600">Monto Original</p>
                                <p class="text-lg font-semibold text-gray-800">${formatCurrency(originalAmount)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Total Pagado</p>
                                <p class="text-lg font-semibold text-green-600">${formatCurrency(totalPaid)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Saldo Pendiente</p>
                                <p class="text-lg font-semibold text-red-600">${formatCurrency(currentBalance)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Formulario para agregar abono -->
                    <div class="bg-blue-50 rounded-xl p-4">
                        <h3 class="text-lg font-medium text-blue-800 mb-4">Agregar Nuevo Abono</h3>
                        <form id="paymentForm" class="space-y-4">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Monto del Abono</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input type="number" id="paymentAmount" step="0.01" min="0.01" max="${currentBalance}" 
                                               class="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                               placeholder="0.00" required>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha del Abono</label>
                                    <input type="date" id="paymentDate" 
                                           class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                           value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Descripción del Abono</label>
                                <input type="text" id="paymentDescription" 
                                       class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                       placeholder="Ej: Cuota mensual, Abono extraordinario, etc.">
                            </div>
                            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                                Registrar Abono
                            </button>
                        </form>
                    </div>

                    <!-- Historial de abonos -->
                    <div>
                        <h3 class="text-lg font-medium text-gray-800 mb-4">Historial de Abonos</h3>
                        <div id="paymentsHistory" class="space-y-3">
                            ${renderPaymentsHistory(transaction)}
                        </div>
                    </div>

                    <!-- Opciones adicionales -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h3 class="text-lg font-medium text-gray-800 mb-4">Opciones Adicionales</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onclick="addBankInstallment('${transactionId}')" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                                Agregar Cuota Bancaria
                            </button>
                            <button onclick="exportPaymentsHistory('${transactionId}')" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                                Exportar Historial
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup form submission
        const paymentForm = modal.querySelector('#paymentForm');
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const date = document.getElementById('paymentDate').value;
            const description = document.getElementById('paymentDescription').value;

            if (amount > currentBalance) {
                showNotification('❌ El monto del abono no puede ser mayor al saldo pendiente', 'error');
                return;
            }

            addPayment(transactionId, amount, date, description);
            modal.remove();
        });
    }

    // Render payments history
    function renderPaymentsHistory(transaction) {
        if (!transaction.payments || transaction.payments.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <svg class="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No hay abonos registrados</p>
                </div>
            `;
        }

        // Sort payments by date (newest first)
        const sortedPayments = [...transaction.payments].sort((a, b) => new Date(b.date) - new Date(a.date));

        return sortedPayments.map(payment => {
            const paymentDate = new Date(payment.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
                <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-medium text-gray-800">${payment.description || 'Abono'}</h4>
                                <span class="text-lg font-semibold text-green-600">$${payment.amount.toFixed(2)}</span>
                            </div>
                            <div class="flex items-center text-sm text-gray-500">
                                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                ${paymentDate}
                            </div>
                        </div>
                        <button onclick="deletePayment('${transaction.id}', '${payment.id}')" class="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Format number in Colombian format (with dots as thousand separators)
    function formatColombianNumber(number) {
        return number.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
    
    // Format currency with Colombian number format
    function formatCurrency(amount, currency = 'COP') {
        const formattedNumber = formatColombianNumber(amount);
        const currencySymbols = {
            'COP': '$',
            'USD': 'US$',
            'EUR': '€'
        };
        return `${currencySymbols[currency] || '$'} ${formattedNumber}`;
    }
    
    // Setup mobile menu functionality
    function setupMobileMenu() {
        // Mobile menu buttons
        const mobileExportBtn = document.getElementById('mobileExportBtn');
        const mobileImportInput = document.getElementById('mobileImportInput');
        const mobileManagePaymentsBtn = document.getElementById('mobileManagePaymentsBtn');

        if (mobileExportBtn) {
            mobileExportBtn.addEventListener('click', () => {
                // Trigger export functionality
                const exportBtn = document.getElementById('exportBtn');
                if (exportBtn) exportBtn.click();
                // Close mobile menu
                closeMobileMenu();
            });
        }

        if (mobileImportInput) {
            mobileImportInput.addEventListener('change', (e) => {
                // Trigger import functionality
                const importInput = document.getElementById('importInput');
                if (importInput && e.target.files[0]) {
                    importInput.files = e.target.files;
                    importInput.dispatchEvent(new Event('change'));
                }
                // Close mobile menu
                closeMobileMenu();
            });
        }

        if (mobileManagePaymentsBtn) {
            mobileManagePaymentsBtn.addEventListener('click', () => {
                // Trigger manage payments functionality
                const managePaymentsBtn = document.getElementById('managePaymentsBtn');
                if (managePaymentsBtn) managePaymentsBtn.click();
                // Close mobile menu
                closeMobileMenu();
            });
        }
    }

    // Close mobile menu function
    function closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Add bank installment modal
    window.addBankInstallment = function(transactionId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-800 flex items-center">
                            <svg class="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Agregar Cuota Bancaria
                        </h2>
                        <button onclick="this.closest('.fixed').remove()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="p-6 space-y-6">
                    <div class="bg-green-50 rounded-xl p-4">
                        <h3 class="text-lg font-medium text-green-800 mb-4">Configurar Cuota Bancaria</h3>
                        <form id="installmentForm" class="space-y-4">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Monto de la Cuota</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input type="number" id="installmentAmount" step="0.01" min="0.01" 
                                               class="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                               placeholder="0.00" required>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                                    <select id="installmentFrequency" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                        <option value="monthly">Mensual</option>
                                        <option value="biweekly">Quincenal</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="custom">Personalizada</option>
                                    </select>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                                    <input type="date" id="installmentStartDate" 
                                           class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                           value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Número de Cuotas</label>
                                    <input type="number" id="installmentCount" min="1" max="120" 
                                           class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                           placeholder="12" required>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <input type="text" id="installmentDescription" 
                                       class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                       placeholder="Ej: Cuota mensual del préstamo bancario" value="Cuota bancaria">
                            </div>
                            <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                                Crear Cuotas Bancarias
                            </button>
                        </form>
                    </div>

                    <div class="bg-blue-50 rounded-xl p-4">
                        <h4 class="font-medium text-blue-800 mb-2">Vista Previa de Cuotas</h4>
                        <div id="installmentPreview" class="text-sm text-blue-700">
                            Ingresa los datos para ver la vista previa de las cuotas
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup form submission
        const installmentForm = modal.querySelector('#installmentForm');
        const installmentAmount = modal.querySelector('#installmentAmount');
        const installmentCount = modal.querySelector('#installmentCount');
        const installmentStartDate = modal.querySelector('#installmentStartDate');
        const installmentFrequency = modal.querySelector('#installmentFrequency');
        const installmentPreview = modal.querySelector('#installmentPreview');

        // Update preview when form changes
        function updatePreview() {
            const amount = parseFloat(installmentAmount.value) || 0;
            const count = parseInt(installmentCount.value) || 0;
            const startDate = installmentStartDate.value;
            const frequency = installmentFrequency.value;

            if (amount > 0 && count > 0 && startDate) {
                const start = new Date(startDate);
                let preview = `Se crearán ${count} cuotas de $${amount.toFixed(2)} cada una.<br>`;
                
                if (frequency === 'monthly') {
                    preview += `Fechas: ${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} hasta ${new Date(start.getFullYear(), start.getMonth() + count - 1, start.getDate()).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
                } else if (frequency === 'biweekly') {
                    preview += `Fechas: ${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} hasta ${new Date(start.getTime() + (count * 14 * 24 * 60 * 60 * 1000)).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
                } else if (frequency === 'weekly') {
                    preview += `Fechas: ${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} hasta ${new Date(start.getTime() + (count * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
                } else {
                    preview += `Fechas: ${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} hasta ${new Date(start.getTime() + (count * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
                }

                installmentPreview.innerHTML = preview;
            } else {
                installmentPreview.innerHTML = 'Ingresa los datos para ver la vista previa de las cuotas';
            }
        }

        installmentAmount.addEventListener('input', updatePreview);
        installmentCount.addEventListener('input', updatePreview);
        installmentStartDate.addEventListener('input', updatePreview);
        installmentFrequency.addEventListener('change', updatePreview);

        installmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const amount = parseFloat(installmentAmount.value);
            const count = parseInt(installmentCount.value);
            const startDate = installmentStartDate.value;
            const frequency = installmentFrequency.value;
            const description = installmentDescription.value;

            if (amount <= 0 || count <= 0 || !startDate) {
                showNotification('❌ Por favor completa todos los campos correctamente', 'error');
                return;
            }

            // Create installments
            const start = new Date(startDate);
            let currentDate = new Date(start);

            for (let i = 0; i < count; i++) {
                const installmentDate = new Date(currentDate);
                const installmentDescription = `${description} ${i + 1}/${count}`;
                
                addPayment(transactionId, amount, installmentDate.toISOString().split('T')[0], installmentDescription);
                
                // Calculate next date based on frequency
                if (frequency === 'monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else if (frequency === 'biweekly') {
                    currentDate.setDate(currentDate.getDate() + 14);
                } else if (frequency === 'weekly') {
                    currentDate.setDate(currentDate.getDate() + 7);
                } else {
                    currentDate.setDate(currentDate.getDate() + 30);
                }
            }

            showNotification(`✅ Se crearon ${count} cuotas bancarias correctamente`, 'success');
            modal.remove();
        });
    };

    // Delete payment
    window.deletePayment = function(transactionId, paymentId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction || !transaction.payments) return;

        const payment = transaction.payments.find(p => p.id === paymentId);
        if (!payment) return;

        // Show confirmation dialog
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Confirmar Eliminación</h3>
                    <p class="text-gray-600 mb-6">¿Estás seguro de que quieres eliminar el abono de $${payment.amount.toFixed(2)} del ${new Date(payment.date).toLocaleDateString('es-ES')}?</p>
                    <div class="flex space-x-3">
                        <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button onclick="confirmDeletePayment('${transactionId}', '${paymentId}')" class="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    };

    // Confirm delete payment
    window.confirmDeletePayment = function(transactionId, paymentId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction || !transaction.payments) return;

        const paymentIndex = transaction.payments.findIndex(p => p.id === paymentId);
        if (paymentIndex === -1) return;

        const payment = transaction.payments[paymentIndex];
        
        // Remove payment
        transaction.payments.splice(paymentIndex, 1);
        
        // Recalculate total paid
        transaction.totalPaid = transaction.payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Update transaction status
        updateTransactionStatus(transaction);
        
        saveTransactions();
        renderTransactions();
        updateTotals();
        
        // Close modal
        document.querySelector('.fixed').remove();
        
        showNotification(`✅ Abono de $${payment.amount.toFixed(2)} eliminado correctamente`, 'success');
    };

    // Export payments history
    window.exportPaymentsHistory = function(transactionId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction || !transaction.payments || transaction.payments.length === 0) {
            showNotification('❌ No hay abonos para exportar', 'error');
            return;
        }

        // Create CSV content
        let csvContent = 'Fecha,Descripción,Monto\n';
        
        const sortedPayments = [...transaction.payments].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedPayments.forEach(payment => {
            const date = new Date(payment.date).toLocaleDateString('es-ES');
            const description = payment.description || 'Abono';
            const amount = payment.amount.toFixed(2);
            
            csvContent += `"${date}","${description}","${amount}"\n`;
        });

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `abonos_${transaction.description.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('✅ Historial de abonos exportado correctamente', 'success');
    };

    // Initialize the app
    init();
});
