class WebSocketClient {
    constructor() {
        this.packr = new msgpackr.Packr();
        this.unpackr = new msgpackr.Unpackr();
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        this.ws = new WebSocket('ws://localhost:3000');
        
        this.ws.binaryType = 'arraybuffer'; // Important for msgpack
        
        this.ws.onopen = () => {
            this.updateStatus(true);
            this.showError(null);
        };

        this.ws.onclose = () => {
            this.updateStatus(false);
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = () => {
            this.showError('WebSocket error occurred');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = this.unpackr.unpack(new Uint8Array(event.data));
                this.addMessage(data);
            } catch (err) {
                this.showError('Failed to parse message');
            }
        };
    }

    setupEventListeners() {
        const sendButton = document.getElementById('send-button');
        const operationData = document.getElementById('operation-data');
        const customRecordToggle = document.getElementById('custom-record-toggle');
        const recordId = document.getElementById('record-id');
        const tableSelect = document.getElementById('table-name');
        const rolesInput = document.getElementById('roles-input');
        const rolesField = document.getElementById('roles');
        const isDeletedToggle = document.getElementById('is-deleted-toggle');

        // Handle custom record ID toggle
        customRecordToggle.addEventListener('change', (e) => {
            recordId.disabled = !e.target.checked;
            if (!e.target.checked) {
                recordId.value = '';
            }
        });

        // Show/hide roles input based on table selection
        tableSelect.addEventListener('change', () => {
            rolesInput.classList.toggle('hidden', tableSelect.value !== 'users');
            if (tableSelect.value !== 'users') {
                rolesField.value = '';
            }
        });

        // Show/hide delete toggle based on table selection
        tableSelect.addEventListener('change', () => {
            // Only show for documents and users tables
            const showDelete = ['documents', 'users'].includes(tableSelect.value);
            isDeletedToggle.parentElement.parentElement.classList.toggle('hidden', !showDelete);
            if (!showDelete) {
                isDeletedToggle.checked = false;
            }
        });

        sendButton.addEventListener('click', () => {
            try {
                const data = JSON.parse(operationData.value);
                const operation = {
                    id: this.generateId(),
                    tableName: tableSelect.value,
                    recordId: customRecordToggle.checked ? recordId.value : this.generateId(),
                    operationData: {
                        ...data,
                        // Add roles array only for users table
                        ...(tableSelect.value === 'users' && rolesField.value ? {
                            roles: rolesField.value.split(',').map(role => role.trim()).filter(Boolean)
                        } : {}),
                        // Add is_deleted if checkbox is checked
                        ...(isDeletedToggle.checked ? { is_delete_operation: true } : {})
                    },
                    userId: this.generateId(),
                    timestamp: new Date()
                };

                // Validate custom record ID if provided
                if (customRecordToggle.checked && !this.isValidUUID(operation.recordId)) {
                    throw new Error('Invalid UUID format for record ID');
                }

                this.ws.send(this.packr.pack(operation));
                operationData.value = '';
                if (customRecordToggle.checked) {
                    recordId.value = '';
                }
            } catch (err) {
                this.showError(err.message || 'Invalid JSON data');
            }
        });
    }

    updateStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        const sendButton = document.getElementById('send-button');
        
        statusElement.textContent = `Status: ${connected ? 'Connected' : 'Disconnected'}`;
        sendButton.disabled = !connected;
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (message) {
            errorElement.textContent = `Error: ${message}`;
            errorElement.classList.remove('hidden');
        } else {
            errorElement.classList.add('hidden');
        }
    }

    addMessage(data) {
        const messagesElement = document.getElementById('messages');
        const messageElement = document.createElement('pre');
        messageElement.textContent = JSON.stringify(data, null, 2);
        messagesElement.prepend(messageElement);
    }

    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Add UUID validation method
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
}

// Initialize the client when the page loads
window.addEventListener('load', () => {
    new WebSocketClient();
}); 