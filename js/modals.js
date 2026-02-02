// =====================================================
// MODAL & NOTIFICATION SYSTEM
// =====================================================

// Show notification toast
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    if (duration > 0) {
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
}

function getNotificationIcon(type) {
    const icons = {
        'success': '✓',
        'error': '✕',
        'warning': '⚠',
        'info': 'ℹ'
    };
    return icons[type] || '✓';
}

// Show modal dialog (with custom buttons)
function showModalDialog(title, message, type = 'info', buttons = ['OK']) {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        
        let buttonHTML = '';
        buttons.forEach((btnText, index) => {
            const btnClass = index === buttons.length - 1 ? 'btn btn-primary' : 'btn btn-secondary';
            buttonHTML += `<button class="${btnClass}" onclick="window._modalResolve(${index})">${btnText}</button>`;
        });

        modalOverlay.innerHTML = `
            <div class="modal-dialog ${type}">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="window._modalResolve(-1)">×</button>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-footer">
                    ${buttonHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        window._modalResolve = (buttonIndex) => {
            modalOverlay.remove();
            resolve(buttonIndex);
        };
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                resolve(-1);
            }
        });
    });
}

// Show alert
async function showAlert(message, title = 'Alert') {
    await showModalDialog(title, message, 'warning', ['OK']);
}

// Show confirmation dialog
async function showConfirm(message, title = 'Confirm') {
    const result = await showModalDialog(title, message, 'info', ['Cancel', 'OK']);
    return result === 1;
}

// Show input prompt
async function showPrompt(message, defaultValue = '', title = 'Enter Value') {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        
        modalOverlay.innerHTML = `
            <div class="modal-dialog info">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="window._promptResolve(null)">×</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <input type="text" id="prompt-input" class="prompt-input" value="${defaultValue}" placeholder="Enter value...">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window._promptResolve(null)">Cancel</button>
                    <button class="btn btn-primary" onclick="window._promptResolve(document.getElementById('prompt-input').value)">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        window._promptResolve = (value) => {
            modalOverlay.remove();
            resolve(value);
        };
        
        // Focus input and allow Enter key
        setTimeout(() => {
            const input = document.getElementById('prompt-input');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        window._promptResolve(input.value);
                    }
                });
            }
        }, 100);
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                resolve(null);
            }
        });
    });
}

// Show numeric input prompt
async function showNumericPrompt(message, defaultValue = '0', title = 'Enter Number') {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        
        modalOverlay.innerHTML = `
            <div class="modal-dialog info">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="window._numPromptResolve(null)">×</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <input type="number" id="numeric-prompt-input" class="prompt-input" value="${defaultValue}" placeholder="Enter number...">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window._numPromptResolve(null)">Cancel</button>
                    <button class="btn btn-primary" onclick="window._numPromptResolve(document.getElementById('numeric-prompt-input').value)">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        window._numPromptResolve = (value) => {
            modalOverlay.remove();
            resolve(value);
        };
        
        // Focus input
        setTimeout(() => {
            const input = document.getElementById('numeric-prompt-input');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        window._numPromptResolve(input.value);
                    }
                });
            }
        }, 100);
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                resolve(null);
            }
        });
    });
}

// Show selection dropdown
async function showSelectPrompt(message, options, title = 'Select Option') {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        
        let optionsHTML = '';
        options.forEach((opt, index) => {
            optionsHTML += `<option value="${index}">${opt}</option>`;
        });
        
        modalOverlay.innerHTML = `
            <div class="modal-dialog info">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="window._selectResolve(-1)">×</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <select id="select-input" class="prompt-input">
                        <option value="-1">Select...</option>
                        ${optionsHTML}
                    </select>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window._selectResolve(-1)">Cancel</button>
                    <button class="btn btn-primary" onclick="window._selectResolve(document.getElementById('select-input').value)">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        window._selectResolve = (value) => {
            modalOverlay.remove();
            resolve(value >= 0 ? parseInt(value) : null);
        };
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                resolve(null);
            }
        });
    });
}

// Show loading spinner
function showLoading(message = 'Loading...') {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'loading-overlay active';
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Show form with multiple fields
async function showFormDialog(title, fields, formType = 'info') {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        
        let formHTML = '';
        fields.forEach((field, index) => {
            if (field.type === 'text' || field.type === 'email' || field.type === 'password') {
                formHTML += `
                    <div class="form-group">
                        <label for="form-field-${index}">${field.label}</label>
                        <input type="${field.type}" id="form-field-${index}" class="form-input" placeholder="${field.placeholder || ''}" value="${field.value || ''}">
                    </div>
                `;
            } else if (field.type === 'select') {
                let optionsHTML = '';
                field.options.forEach((opt, optIndex) => {
                    optionsHTML += `<option value="${optIndex}">${opt}</option>`;
                });
                formHTML += `
                    <div class="form-group">
                        <label for="form-field-${index}">${field.label}</label>
                        <select id="form-field-${index}" class="form-input">
                            <option value="-1">Select ${field.label}...</option>
                            ${optionsHTML}
                        </select>
                    </div>
                `;
            }
        });
        
        modalOverlay.innerHTML = `
            <div class="modal-dialog ${formType}">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="window._formModalResolve(null)">×</button>
                </div>
                <div class="modal-body">
                    <form id="form-modal-form" onsubmit="event.preventDefault(); window._formModalResolve('submit');">
                        ${formHTML}
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window._formModalResolve(null)">Cancel</button>
                    <button class="btn btn-primary" onclick="window._formModalResolve('submit')">Create</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        window._formModalResolve = (action) => {
            if (action === 'submit') {
                const formData = {};
                fields.forEach((field, index) => {
                    const input = document.getElementById(`form-field-${index}`);
                    formData[field.name] = input.value;
                });
                modalOverlay.remove();
                resolve(formData);
            } else {
                modalOverlay.remove();
                resolve(null);
            }
        };
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                resolve(null);
            }
        });
        
        // Focus on first field
        setTimeout(() => {
            const firstInput = document.getElementById('form-field-0');
            if (firstInput) firstInput.focus();
        }, 100);
    });
}
