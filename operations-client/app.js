class WebSocketClient {
    constructor() {
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        this.ws = new WebSocket('ws://localhost:3000');
        
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
                const data = JSON.parse(event.data);
                this.addMessage(data);
            } catch (err) {
                this.showError('Failed to parse message');
            }
        };
    }

    setupEventListeners() {
        const sendButton = document.getElementById('send-button');
        const operationData = document.getElementById('operation-data');

        sendButton.addEventListener('click', () => {
            try {
                const data = JSON.parse(operationData.value);
                const operation = {
                    id: this.generateId(),
                    tableName: 'documents',
                    recordId: this.generateId(),
                    operationData: data,
                    userId: this.generateId(),
                    timestamp: new Date()
                };

                this.ws.send(JSON.stringify(operation));
                operationData.value = '';
            } catch (err) {
                this.showError('Invalid JSON data');
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
}

// Initialize the client when the page loads
window.addEventListener('load', () => {
    new WebSocketClient();
}); 