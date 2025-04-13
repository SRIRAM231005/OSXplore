document.addEventListener("DOMContentLoaded", () => {
    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    function switchTab(tabId) {
        // Hide all panels
        tabPanels.forEach(panel => {
            panel.style.display = 'none';
            panel.classList.remove('active');
        });

        // Remove active class from all buttons
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected panel
        const selectedPanel = document.getElementById(tabId);
        selectedPanel.style.display = 'block';
        selectedPanel.classList.add('active');

        // Activate selected button
        const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
        selectedBtn.classList.add('active');
    }

    // Add click handlers to tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });

    // Initialize with first tab
    switchTab('overview');

    // Message Passing Simulation
    const sendBtn = document.getElementById('send-message-btn');
    const message = document.getElementById('message');
    const process1 = document.getElementById('process1');
    const process2 = document.getElementById('process2');

    sendBtn.addEventListener('click', () => {
        sendBtn.disabled = true;
        process1.style.backgroundColor = '#bbdefb';
        message.style.transform = 'scale(1)';
        message.style.animation = 'sendMessage 2s ease';

        setTimeout(() => {
            process2.style.backgroundColor = '#c8e6c9';
            
            setTimeout(() => {
                // Reset states
                process1.style.backgroundColor = '#e3f2fd';
                process2.style.backgroundColor = '#e3f2fd';
                message.style.transform = 'scale(0)';
                message.style.animation = 'none';
                sendBtn.disabled = false;
            }, 1500);
        }, 1000);
    });

    // Shared Memory Simulation
    const produceBtn = document.getElementById('produce-btn');
    const consumeBtn = document.getElementById('consume-btn');
    const sharedMemory = document.getElementById('shared-memory');
    let dataInMemory = false;

    produceBtn.addEventListener('click', () => {
        if (!dataInMemory) {
            sharedMemory.style.backgroundColor = '#a5d6a7';
            sharedMemory.textContent = 'Data Written';
            dataInMemory = true;
            produceBtn.disabled = true;
            consumeBtn.disabled = false;
        }
    });

    consumeBtn.addEventListener('click', () => {
        if (dataInMemory) {
            sharedMemory.style.backgroundColor = '#e8f5e9';
            sharedMemory.textContent = 'Shared Memory';
            dataInMemory = false;
            produceBtn.disabled = false;
            consumeBtn.disabled = true;
        }
    });

    // Thread Synchronization Simulation
    const syncBtn = document.getElementById('sync-btn');
    const thread1 = document.getElementById('thread1');
    const thread2 = document.getElementById('thread2');
    const sharedResource = document.getElementById('shared-resource');

    syncBtn.addEventListener('click', () => {
        syncBtn.disabled = true;
        
        // Thread 1 accessing resource
        thread1.style.backgroundColor = '#bbdefb';
        sharedResource.style.backgroundColor = '#bbdefb';
        sharedResource.textContent = 'Thread 1 Access';

        setTimeout(() => {
            // Thread 2 waiting
            thread2.style.backgroundColor = '#ffcdd2';
            
            setTimeout(() => {
                // Thread 1 releases, Thread 2 accesses
                thread1.style.backgroundColor = '#e3f2fd';
                thread2.style.backgroundColor = '#c8e6c9';
                sharedResource.style.backgroundColor = '#c8e6c9';
                sharedResource.textContent = 'Thread 2 Access';

                setTimeout(() => {
                    // Reset states
                    thread2.style.backgroundColor = '#e3f2fd';
                    sharedResource.style.backgroundColor = '#e8f5e9';
                    sharedResource.textContent = 'Shared Resource';
                    syncBtn.disabled = false;
                }, 1500);
            }, 1500);
        }, 1500);
    });
});