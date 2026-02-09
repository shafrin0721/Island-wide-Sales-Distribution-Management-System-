// Settings.js - Handle all admin settings management

document.addEventListener('DOMContentLoaded', function() {
    loadSettingsFromStorage();
    updateLastUpdatedTime();
});

// Load settings from localStorage when page opens
function loadSettingsFromStorage() {
    const settings = JSON.parse(localStorage.getItem('adminSettings')) || getDefaultSettings();
    
    // Apply general settings
    document.getElementById('system-name').value = settings.systemName || 'RDC System';
    document.getElementById('company-name').value = settings.companyName || 'Rapid Delivery Center';
    document.getElementById('system-email').value = settings.systemEmail || 'admin@rdc.com';
    document.getElementById('phone').value = settings.phone || '+1 (555) 123-4567';
    
    // Apply notification preferences
    document.getElementById('email-notifications').checked = settings.emailNotifications !== false;
    document.getElementById('order-alerts').checked = settings.orderAlerts !== false;
    document.getElementById('inventory-alerts').checked = settings.inventoryAlerts !== false;
    document.getElementById('delivery-alerts').checked = settings.deliveryAlerts !== false;
    document.getElementById('user-alerts').checked = settings.userAlerts !== false;
    
    // Apply business rules
    document.getElementById('min-order-value').value = settings.minOrderValue || 10;
    document.getElementById('max-order-value').value = settings.maxOrderValue || 5000;
    document.getElementById('reorder-level').value = settings.reorderLevel || 10;
    document.getElementById('delivery-fee').value = settings.deliveryFee || 5.00;
    document.getElementById('tax-rate').value = settings.taxRate || 8.5;
    
    // Apply security settings
    document.getElementById('two-factor-auth').checked = settings.twoFactorAuth || false;
    document.getElementById('session-timeout').value = settings.sessionTimeout || 30;
    document.getElementById('require-password-reset').checked = settings.requirePasswordReset || false;
    document.getElementById('password-length').value = settings.passwordLength || 8;
    
    // Apply display settings
    document.getElementById('items-per-page').value = settings.itemsPerPage || 25;
    document.getElementById('dark-mode').checked = settings.darkMode || false;
    document.getElementById('compact-view').checked = settings.compactView || false;
    
    // Apply data management
    document.getElementById('auto-backup').checked = settings.autoBackup !== false;
    document.getElementById('backup-frequency').value = settings.backupFrequency || 'daily';
}

function getDefaultSettings() {
    return {
        systemName: 'RDC System',
        companyName: 'Rapid Delivery Center',
        systemEmail: 'admin@rdc.com',
        phone: '+1 (555) 123-4567',
        emailNotifications: true,
        orderAlerts: true,
        inventoryAlerts: true,
        deliveryAlerts: true,
        userAlerts: true,
        minOrderValue: 10,
        maxOrderValue: 5000,
        reorderLevel: 10,
        deliveryFee: 5.00,
        taxRate: 8.5,
        twoFactorAuth: false,
        sessionTimeout: 30,
        requirePasswordReset: false,
        passwordLength: 8,
        itemsPerPage: 25,
        darkMode: false,
        compactView: false,
        autoBackup: true,
        backupFrequency: 'daily'
    };
}

// Save all settings to localStorage
function saveSettings() {
    const settings = {
        systemName: document.getElementById('system-name').value,
        companyName: document.getElementById('company-name').value,
        systemEmail: document.getElementById('system-email').value,
        phone: document.getElementById('phone').value,
        emailNotifications: document.getElementById('email-notifications').checked,
        orderAlerts: document.getElementById('order-alerts').checked,
        inventoryAlerts: document.getElementById('inventory-alerts').checked,
        deliveryAlerts: document.getElementById('delivery-alerts').checked,
        userAlerts: document.getElementById('user-alerts').checked,
        minOrderValue: parseFloat(document.getElementById('min-order-value').value),
        maxOrderValue: parseFloat(document.getElementById('max-order-value').value),
        reorderLevel: parseInt(document.getElementById('reorder-level').value),
        deliveryFee: parseFloat(document.getElementById('delivery-fee').value),
        taxRate: parseFloat(document.getElementById('tax-rate').value),
        twoFactorAuth: document.getElementById('two-factor-auth').checked,
        sessionTimeout: parseInt(document.getElementById('session-timeout').value),
        requirePasswordReset: document.getElementById('require-password-reset').checked,
        passwordLength: parseInt(document.getElementById('password-length').value),
        itemsPerPage: parseInt(document.getElementById('items-per-page').value),
        darkMode: document.getElementById('dark-mode').checked,
        compactView: document.getElementById('compact-view').checked,
        autoBackup: document.getElementById('auto-backup').checked,
        backupFrequency: document.getElementById('backup-frequency').value,
        lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showNotification('Settings saved successfully!', 'success');
    updateLastUpdatedTime();
    
    // Apply theme immediately
    setTimeout(function() {
        applyThemeSettings();
    }, 100);
}

// Reset settings to defaults
function resetSettings() {
    showConfirm(
        'Reset Settings',
        'Are you sure you want to reset all settings to defaults?',
        function() {
            const defaults = getDefaultSettings();
            defaults.lastSaved = new Date().toISOString();
            localStorage.setItem('adminSettings', JSON.stringify(defaults));
            loadSettingsFromStorage();
            showNotification('Settings reset to defaults', 'success');
            
            // Apply theme after reset
            setTimeout(function() {
                applyThemeSettings();
            }, 100);
        },
        null
    );
}

// Update last updated time display
function updateLastUpdatedTime() {
    const settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
    const lastSaved = settings.lastSaved ? new Date(settings.lastSaved).toLocaleString() : 'Never';
    document.getElementById('last-updated').textContent = lastSaved;
}

// Backup data
function backupData() {
    const data = loadData();
    const backup = {
        timestamp: new Date().toISOString(),
        data: data
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rdc-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Backup downloaded successfully!', 'success');
}

// Export all data
function exportData() {
    const data = loadData();
    const exportData = {
        exportDate: new Date().toISOString(),
        users: data.users,
        products: data.products,
        orders: data.orders,
        inventory: data.inventory,
        deliveries: data.deliveries,
        cart: data.cart
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rdc-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

// Clear all data with confirmation
function confirmClearData() {
    showConfirm(
        'Clear All Data',
        'WARNING: This will permanently delete all data in the system. This action cannot be undone. Are you sure?',
        function() {
            localStorage.clear();
            showNotification('All data has been cleared', 'warning');
            setTimeout(() => {
                goToPage('../../index.html');
            }, 1000);
        },
        null
    );
}

// API Key management
function toggleAPIKeyVisibility() {
    const apiKeyInput = document.getElementById('api-key');
    const button = event.target;
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        button.textContent = 'Hide';
    } else {
        apiKeyInput.type = 'password';
        button.textContent = 'Show';
    }
}

function regenerateAPIKey() {
    showConfirm(
        'Regenerate API Key',
        'Regenerating your API key will invalidate the current key. Applications using the old key will stop working. Continue?',
        function() {
            const newKey = 'sk-rdc-' + Math.random().toString(36).substr(2, 20).toUpperCase();
            document.getElementById('api-key').value = newKey;
            
            let settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
            settings.apiKey = newKey;
            localStorage.setItem('adminSettings', JSON.stringify(settings));
            
            showNotification('API key regenerated successfully!', 'success');
        },
        null
    );
}

// Get current settings for use in other pages
function getSettings() {
    return JSON.parse(localStorage.getItem('adminSettings')) || getDefaultSettings();
}

// Apply dark mode if enabled
function applyThemeSettings() {
    try {
        const settings = getSettings();
        console.log('Applying theme settings - Dark mode:', settings.darkMode);
        
        // Remove both classes first to reset
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('light-mode');
        document.body.classList.remove('light-mode');
        
        // Apply selected theme
        if (settings.darkMode) {
            console.log('Activating dark mode...');
            document.documentElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
        } else {
            console.log('Activating light mode...');
            document.documentElement.classList.add('light-mode');
            document.body.classList.add('light-mode');
        }
        
        if (settings.compactView) {
            document.body.classList.add('compact-view');
        }
    } catch (e) {
        console.error('Error applying theme:', e);
    }
}

// Navigation helper
function goToPage(url) {
    window.location.href = url;
}

// Modal functions
function showConfirm(title, message, onConfirm, onCancel) {
    // Create a simple alert-like confirm dialog
    if (confirm(message)) {
        onConfirm();
    } else if (onCancel) {
        onCancel();
    }
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
}

// Apply theme on page load - use both events for maximum compatibility
document.addEventListener('DOMContentLoaded', function() {
    applyThemeSettings();
});
window.addEventListener('load', function() {
    applyThemeSettings();
});
