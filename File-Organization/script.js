class FileSystem {
    constructor() {
        this.structure = {};
        this.currentMode = null;
        this.maxDepth = 1;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => this.selectMode(card.dataset.mode));
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showActionForm(btn.dataset.action));
        });

        document.getElementById('execute-action').addEventListener('click', () => this.executeCurrentAction());
        document.getElementById('cancel-action').addEventListener('click', () => this.hideActionForm());
    }

    selectMode(mode) {
        this.currentMode = mode;
        this.structure = mode === 'two' ? {} : { root: {} };
        this.maxDepth = mode === 'single' ? 1 : mode === 'two' ? 2 : Infinity;
        
        document.querySelector('.mode-selector').style.display = 'none';
        document.querySelector('.simulator-container').style.display = 'grid';
        document.getElementById('current-mode-label').textContent = `Current Mode: ${mode}-level organization`;
        
        this.updateVisualization();
    }

    showActionForm(action) {
        const form = document.querySelector('.action-form');
        const input1 = document.getElementById('input1');
        const input2 = document.getElementById('input2');

        form.style.display = 'grid';
        form.dataset.currentAction = action;

        switch(action) {
            case 'addFile':
            case 'createFolder':
                input1.placeholder = action === 'addFile' ? 'File name' : 'Folder name';
                input2.style.display = this.currentMode === 'hierarchical' ? 'block' : 'none';
                input2.placeholder = 'Path (e.g. root/folder1)';
                break;
            case 'deleteFile':
            case 'deleteFolder':
                input1.placeholder = action === 'deleteFile' ? 'File name' : 'Folder name';
                input2.style.display = this.currentMode === 'hierarchical' ? 'block' : 'none';
                input2.placeholder = 'Path (optional)';
                break;
            case 'searchFile':
                input1.placeholder = 'Name to search';
                input2.style.display = 'none';
                break;
            case 'listFiles':
                form.style.display = 'none';
                this.listFiles();
                break;
        }
    }

    hideActionForm() {
        document.querySelector('.action-form').style.display = 'none';
        document.getElementById('input1').value = '';
        document.getElementById('input2').value = '';
    }

    executeCurrentAction() {
        const action = document.querySelector('.action-form').dataset.currentAction;
        const name = document.getElementById('input1').value.trim();
        const path = document.getElementById('input2').value.trim();

        if (!name && action !== 'listFiles') {
            this.showNotification('Please enter a name', 'error');
            return;
        }

        switch(action) {
            case 'addFile':
                this.addFile(name, path);
                break;
            case 'createFolder':
                this.createFolder(name, path);
                break;
            case 'deleteFile':
                this.deleteFile(name, path);
                break;
            case 'deleteFolder':
                this.deleteFolder(name, path);
                break;
            case 'searchFile':
                this.searchFile(name);
                break;
        }

        this.hideActionForm();
        this.updateVisualization();
    }

    traversePath(path) {
        if (!path) return this.currentMode === 'two' ? this.structure : this.structure.root;
        
        const parts = path.split('/');
        let current = this.structure;
        
        if (this.currentMode !== 'two') {
            if (parts[0] !== 'root') return null;
            current = current.root;
            parts.shift();
        }

        for (const part of parts) {
            if (!current[part] || current[part] === 'file') return null;
            current = current[part];
        }
        
        return current;
    }

    getPathDepth(path) {
        return path ? path.split('/').length : 1;
    }

    addFile(name, path) {
        if (this.currentMode === 'single') {
            if (Object.keys(this.structure.root).length >= 10) {
                this.showNotification('Single-level directory can only contain 10 files', 'error');
                return;
            }
            this.structure.root[name] = 'file';
        } else if (this.currentMode === 'two') {
            const [user, fileName] = name.split('/');
            if (!fileName) {
                this.showNotification('Please use format: user/filename', 'error');
                return;
            }
            if (!this.structure[user]) this.structure[user] = {};
            this.structure[user][fileName] = 'file';
        } else {
            if (this.getPathDepth(path) > this.maxDepth) {
                this.showNotification('Maximum directory depth exceeded', 'error');
                return;
            }
            const target = this.traversePath(path);
            if (!target) {
                this.showNotification('Invalid path', 'error');
                return;
            }
            target[name] = 'file';
        }
        this.showNotification(`File '${name}' added successfully`, 'success');
    }

    createFolder(name, path) {
        if (this.currentMode === 'single') {
            this.showNotification('Cannot create folders in single-level mode', 'error');
            return;
        }

        if (this.currentMode === 'two') {
            if (!this.structure[name]) {
                this.structure[name] = {};
                this.showNotification(`User directory '${name}' created successfully`, 'success');
            } else {
                this.showNotification('User directory already exists', 'error');
            }
        } else {
            if (this.getPathDepth(path) >= this.maxDepth) {
                this.showNotification('Maximum directory depth exceeded', 'error');
                return;
            }
            const target = this.traversePath(path);
            if (!target) {
                this.showNotification('Invalid path', 'error');
                return;
            }
            if (target[name]) {
                this.showNotification('Folder already exists', 'error');
                return;
            }
            target[name] = {};
            this.showNotification(`Folder '${name}' created successfully`, 'success');
        }
    }

    deleteFile(name, path) {
        const target = this.traversePath(path);
        if (!target) {
            this.showNotification('Invalid path', 'error');
            return;
        }

        if (target[name] === 'file') {
            delete target[name];
            this.showNotification(`File '${name}' deleted successfully`, 'success');
        } else {
            this.showNotification(`File '${name}' not found`, 'error');
        }
    }

    deleteFolder(name, path) {
        if (this.currentMode === 'single') {
            this.showNotification('Cannot delete folders in single-level mode', 'error');
            return;
        }

        if (this.currentMode === 'two') {
            if (this.structure[name]) {
                delete this.structure[name];
                this.showNotification(`User directory '${name}' deleted successfully`, 'success');
            } else {
                this.showNotification('User directory not found', 'error');
            }
        } else {
            const target = this.traversePath(path);
            if (!target) {
                this.showNotification('Invalid path', 'error');
                return;
            }
            if (target[name] && target[name] !== 'file') {
                delete target[name];
                this.showNotification(`Folder '${name}' deleted successfully`, 'success');
            } else {
                this.showNotification('Folder not found', 'error');
            }
        }
    }

    searchFile(query) {
        const results = [];
        
        const searchInObject = (obj, currentPath = '') => {
            for (const key in obj) {
                const newPath = currentPath ? `${currentPath}/${key}` : key;
                if (obj[key] === 'file') {
                    if (key.toLowerCase().includes(query.toLowerCase())) {
                        results.push(newPath);
                    }
                } else {
                    searchInObject(obj[key], newPath);
                }
            }
        };

        if (this.currentMode === 'two') {
            searchInObject(this.structure);
        } else {
            searchInObject(this.structure.root, 'root');
        }

        if (results.length > 0) {
            this.showNotification(`Found ${results.length} files:\n${results.join('\n')}`, 'success');
        } else {
            this.showNotification('No files found', 'error');
        }
    }

    listFiles() {
        const files = [];
        
        const listInObject = (obj, currentPath = '') => {
            for (const key in obj) {
                const newPath = currentPath ? `${currentPath}/${key}` : key;
                if (obj[key] === 'file') {
                    files.push(newPath);
                } else {
                    listInObject(obj[key], newPath);
                }
            }
        };

        if (this.currentMode === 'two') {
            listInObject(this.structure);
        } else {
            listInObject(this.structure.root, 'root');
        }

        if (files.length > 0) {
            this.showNotification(`Files in system:\n${files.join('\n')}`, 'success');
        } else {
            this.showNotification('No files in the system', 'info');
        }
    }

    updateVisualization() {
        const treeView = document.getElementById('tree-view');
        treeView.innerHTML = this.generateTreeHTML(this.structure);
    }

    generateTreeHTML(obj, level = 0) {
        let html = '';
        for (const key in obj) {
            const indent = '  '.repeat(level);
            if (obj[key] === 'file') {
                html += `<div class="file-node" style="margin-left: ${level * 20}px">
                    <i class="fas fa-file"></i> ${key}
                </div>`;
            } else {
                html += `<div class="folder-node" style="margin-left: ${level * 20}px">
                    <i class="fas fa-folder"></i> ${key}
                </div>`;
                html += this.generateTreeHTML(obj[key], level + 1);
            }
        }
        return html;
    }

    showNotification(message, type) {
        const types = {
            success: '#22c55e',
            error: '#ef4444',
            info: '#3b82f6'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem;
            background: ${types[type]};
            color: white;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            max-width: 300px;
            z-index: 1000;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const modeCards = document.querySelectorAll(".mode-card");
    const simulatorContainer = document.querySelector(".simulator-container");
    const modeSelector = document.querySelector(".mode-selector");
    const currentModeLabel = document.getElementById("current-mode-label");
    const backBtn = document.getElementById("back-btn");

    // Handle clicking a file organization mode
    modeCards.forEach(card => {
        card.addEventListener("click", () => {
            const mode = card.dataset.mode;
            currentModeLabel.textContent = `Current Mode: ${mode}`;
            modeSelector.style.display = "none";
            simulatorContainer.style.display = "flex";
        });
    });

    // Back button logic to go back to mode selection
    backBtn.addEventListener("click", () => {
        simulatorContainer.style.display = "none";
        modeSelector.style.display = "block";
        currentModeLabel.textContent = "No mode selected";
    });
});



// Initialize the file system
const fileSystem = new FileSystem();