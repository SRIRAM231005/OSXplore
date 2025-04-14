// Global variables
let resources = [];
let processes = [];
let available = [];
let maxDemand = [];
let allocation = [];
let need = [];
let work = [];
let finish = [];
let safeSequence = [];
let animationStep = 0;
let animationTimeline = null;
let currentProcessIndex = -1;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const resourceCountInput = document.getElementById('resource-count');
    const setResourcesBtn = document.getElementById('set-resources');
    const resourceDetailsDiv = document.getElementById('resource-details');
    const resourceInputsDiv = document.getElementById('resource-inputs');
    const saveResourcesBtn = document.getElementById('save-resources');

    const processCountInput = document.getElementById('process-count');
    const setProcessesBtn = document.getElementById('set-processes');
    const processDetailsDiv = document.getElementById('process-details');
    const maxDemandInputsDiv = document.getElementById('max-demand-inputs');
    const allocationInputsDiv = document.getElementById('allocation-inputs');
    const saveProcessesBtn = document.getElementById('save-processes');

    const processInputDiv = document.getElementById('process-input');
    const visualizationSection = document.getElementById('visualization-section');
    const resourceCardsDiv = document.getElementById('resource-cards');
    const processDisplayDiv = document.getElementById('process-display');
    const animationArea = document.getElementById('animation-area');
    const algorithmLog = document.getElementById('algorithm-log');
    const startAnimationBtn = document.getElementById('start-animation');
    const stepAnimationBtn = document.getElementById('step-animation');
    const resetAnimationBtn = document.getElementById('reset-animation');
    const resultMessageDiv = document.getElementById('result-message');
    const safeSequenceDiv = document.getElementById('safe-sequence');

    // Event listeners
    setResourcesBtn.addEventListener('click', setupResourceInputs);
    saveResourcesBtn.addEventListener('click', saveResources);
    setProcessesBtn.addEventListener('click', setupProcessInputs);
    saveProcessesBtn.addEventListener('click', saveProcesses);
    startAnimationBtn.addEventListener('click', startAnimation);
    stepAnimationBtn.addEventListener('click', nextAnimationStep);
    resetAnimationBtn.addEventListener('click', resetAnimation);

    // Functions
    function setupResourceInputs() {
        const count = parseInt(resourceCountInput.value);
        if (isNaN(count) || count < 1 || count > 10) {
            alert('Please enter a valid number of resources (1-10)');
            return;
        }

        resourceInputsDiv.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.innerHTML = `
                <label for="resource-${i}">Resource ${String.fromCharCode(65 + i)} (${String.fromCharCode(65 + i)}):</label>
                <input type="number" id="resource-${i}" min="1" value="${Math.floor(Math.random() * 10) + 1}">
            `;
            resourceInputsDiv.appendChild(div);
        }
        
        resourceDetailsDiv.classList.remove('hidden');
    }

    function saveResources() {
        const count = parseInt(resourceCountInput.value);
        if (isNaN(count) || count < 1 || count > 10) {
            alert('Please enter a valid number of resources (1-10)');
            return;
        }

        resources = [];
        available = [];
        
        for (let i = 0; i < count; i++) {
            const input = document.getElementById(`resource-${i}`);
            if (!input) {
                alert('Error: Resource input not found');
                return;
            }
            const value = parseInt(input.value);
            if (isNaN(value) || value < 1) {
                alert(`Please enter a valid number for resource ${String.fromCharCode(65 + i)}`);
                return;
            }
            
            resources.push({
                id: String.fromCharCode(65 + i),
                total: value,
                available: value
            });
            available.push(value);
        }
        
        // Hide resource details and show process input
        resourceDetailsDiv.classList.add('hidden');
        processInputDiv.classList.remove('hidden');
        
        console.log('Resources saved:', resources);
        console.log('Available resources:', available);
    }

    function setupProcessInputs() {
        const processCount = parseInt(processCountInput.value);
        const resourceCount = resources.length;
        
        // Setup Max Demand inputs
        maxDemandInputsDiv.innerHTML = '<table><tr><th>Process</th>';
        for (let i = 0; i < resourceCount; i++) {
            maxDemandInputsDiv.innerHTML += `<th>${resources[i].id}</th>`;
        }
        maxDemandInputsDiv.innerHTML += '</tr>';
        
        for (let i = 0; i < processCount; i++) {
            let row = `<tr><td>P${i}</td>`;
            for (let j = 0; j < resourceCount; j++) {
                const max = Math.min(resources[j].total, Math.floor(Math.random() * resources[j].total) + 1);
                row += `<td><input type="number" id="max-${i}-${j}" min="0" max="${resources[j].total}" value="${max}"></td>`;
            }
            row += '</tr>';
            maxDemandInputsDiv.innerHTML += row;
        }
        maxDemandInputsDiv.innerHTML += '</table>';
        
        // Setup Allocation inputs
        allocationInputsDiv.innerHTML = '<table><tr><th>Process</th>';
        for (let i = 0; i < resourceCount; i++) {
            allocationInputsDiv.innerHTML += `<th>${resources[i].id}</th>`;
        }
        allocationInputsDiv.innerHTML += '</tr>';
        
        for (let i = 0; i < processCount; i++) {
            let row = `<tr><td>P${i}</td>`;
            for (let j = 0; j < resourceCount; j++) {
                const max = parseInt(document.getElementById(`max-${i}-${j}`).value);
                const alloc = Math.floor(Math.random() * (max + 1));
                row += `<td><input type="number" id="alloc-${i}-${j}" min="0" max="${max}" value="${alloc}"></td>`;
            }
            row += '</tr>';
            allocationInputsDiv.innerHTML += row;
        }
        allocationInputsDiv.innerHTML += '</table>';
        
        processDetailsDiv.classList.remove('hidden');
    }

    function saveProcesses() {
        const processCount = parseInt(processCountInput.value);
        const resourceCount = resources.length;
        
        // Initialize arrays
        maxDemand = new Array(processCount);
        allocation = new Array(processCount);
        need = new Array(processCount);
        
        for (let i = 0; i < processCount; i++) {
            maxDemand[i] = new Array(resourceCount);
            allocation[i] = new Array(resourceCount);
            need[i] = new Array(resourceCount);
            
            for (let j = 0; j < resourceCount; j++) {
                maxDemand[i][j] = parseInt(document.getElementById(`max-${i}-${j}`).value);
                allocation[i][j] = parseInt(document.getElementById(`alloc-${i}-${j}`).value);
                need[i][j] = maxDemand[i][j] - allocation[i][j];
                
                // Update available resources
                available[j] -= allocation[i][j];
            }
        }
        
        // Initialize other arrays
        work = [...available];
        finish = new Array(processCount).fill(false);
        safeSequence = [];
        
        // Update UI
        updateResourceDisplay();
        updateProcessDisplay();
        visualizationSection.classList.remove('hidden');
    }

    function updateResourceDisplay() {
        resourceCardsDiv.innerHTML = '';
        resources.forEach((res, index) => {
            const card = document.createElement('div');
            card.className = 'resource-card';
            card.dataset.type = res.id;
            card.textContent = res.available;
            card.id = `res-card-${index}`;
            resourceCardsDiv.appendChild(card);
        });
    }

    function updateProcessDisplay() {
        processDisplayDiv.innerHTML = '';
        for (let i = 0; i < finish.length; i++) {
            const process = document.createElement('div');
            process.className = 'process';
            if (finish[i]) {
                process.classList.add('finished');
            } else if (i === currentProcessIndex) {
                process.classList.add('executing');
            }
            process.textContent = `P${i}`;
            process.id = `process-${i}`;
            processDisplayDiv.appendChild(process);
        }
    }

    function startAnimation() {
        // Reset previous animation
        resetAnimation();
        
        // Disable start button, enable step button
        startAnimationBtn.disabled = true;
        stepAnimationBtn.disabled = false;
        resetAnimationBtn.disabled = false;
        
        // Start the first step
        nextAnimationStep();
    }

    function nextAnimationStep() {
        const processCount = finish.length;
        const resourceCount = available.length;
        
        // Clear previous messages
        resultMessageDiv.className = 'message hidden';
        safeSequenceDiv.className = 'safe-sequence hidden';
        
        // Clear previous process highlighting
        if (currentProcessIndex >= 0) {
            document.getElementById(`process-${currentProcessIndex}`).classList.remove('executing');
        }
        
        // Find next process to execute
        let found = false;
        currentProcessIndex = -1;
        
        // Clear the log but keep the initial state
        algorithmLog.innerHTML = '';
        logAlgorithmStep(`Starting step ${animationStep + 1} of Banker's Algorithm`);
        
        // Show current work vector
        logAlgorithmStep(`Current Work vector: [${work.join(', ')}]`);
        
        // Show which processes are finished
        const finishedProcesses = finish.map((f, i) => f ? `P${i}` : null).filter(f => f !== null);
        logAlgorithmStep(`Finished processes: ${finishedProcesses.length > 0 ? finishedProcesses.join(', ') : 'None'}`);
        
        // Find a process that can be allocated
        for (let i = 0; i < processCount; i++) {
            if (!finish[i]) {
                logAlgorithmStep(`Checking process P${i}...`);
                
                let canAllocate = true;
                let comparisonHTML = '<div class="comparison"><div class="comparison-item"><div>Resource</div><div>Need</div><div>Work</div></div>';
                
                for (let j = 0; j < resourceCount; j++) {
                    const comparisonClass = need[i][j] <= work[j] ? 'comparison-ok' : 'comparison-fail';
                    comparisonHTML += `
                        <div class="comparison-item">
                            <div>${resources[j].id}</div>
                            <div class="comparison-value ${comparisonClass}">${need[i][j]}</div>
                            <div class="comparison-value">${work[j]}</div>
                        </div>
                    `;
                    
                    if (need[i][j] > work[j]) {
                        canAllocate = false;
                    }
                }
                
                comparisonHTML += '</div>';
                algorithmLog.innerHTML += comparisonHTML;
                
                if (canAllocate) {
                    logAlgorithmStep(`P${i} can be allocated! Need <= Work for all resources`, 'log-success');
                    currentProcessIndex = i;
                    found = true;
                    break;
                } else {
                    logAlgorithmStep(`P${i} cannot be allocated (Need > Work for some resources)`, 'log-warning');
                }
            }
        }
        
        if (found) {
            // Highlight the current process
            document.getElementById(`process-${currentProcessIndex}`).classList.add('executing');
            
            // Visualize the allocation
            visualizeAllocation(currentProcessIndex);
            
            // Update the algorithm state
            logAlgorithmStep(`Executing P${currentProcessIndex} and releasing its resources:`);
            
            let releaseHTML = '<div class="matrix-display">';
            releaseHTML += '<div class="matrix-title">Allocation for P' + currentProcessIndex + ' to be released:</div>';
            releaseHTML += '<table><tr>';
            
            for (let j = 0; j < resourceCount; j++) {
                releaseHTML += `<th>${resources[j].id}</th>`;
            }
            releaseHTML += '</tr><tr>';
            
            for (let j = 0; j < resourceCount; j++) {
                releaseHTML += `<td>${allocation[currentProcessIndex][j]}</td>`;
            }
            releaseHTML += '</tr></table></div>';
            
            algorithmLog.innerHTML += releaseHTML;
            
            // Update work vector
            let workUpdateHTML = '<div class="matrix-display">';
            workUpdateHTML += '<div class="matrix-title">Updating Work vector (Work = Work + Allocation):</div>';
            workUpdateHTML += '<table><tr><th>Resource</th><th>Old Work</th><th>+ Allocation</th><th>= New Work</th></tr>';
            
            for (let j = 0; j < resourceCount; j++) {
                const oldWork = work[j];
                const alloc = allocation[currentProcessIndex][j];
                work[j] += alloc;
                
                workUpdateHTML += `
                    <tr>
                        <td>${resources[j].id}</td>
                        <td>${oldWork}</td>
                        <td>${alloc}</td>
                        <td>${work[j]}</td>
                    </tr>
                `;
            }
            
            workUpdateHTML += '</table></div>';
            algorithmLog.innerHTML += workUpdateHTML;
            
            // Mark process as finished
            finish[currentProcessIndex] = true;
            safeSequence.push(currentProcessIndex);
            
            logAlgorithmStep(`P${currentProcessIndex} marked as finished`, 'log-success');
            logAlgorithmStep(`New Work vector: [${work.join(', ')}]`);
            logAlgorithmStep(`Safe sequence so far: ${safeSequence.map(p => `P${p}`).join(' → ')}`);
            
            // Update resource display
            updateResourceDisplay();
            updateProcessDisplay();
        } else {
            // Check if all processes are finished
            const allFinished = finish.every(val => val);
            
            if (allFinished) {
                // System is in safe state
                logAlgorithmStep('All processes finished! System is in a safe state!', 'log-success');
                
                resultMessageDiv.textContent = 'System is in a safe state! No deadlock will occur.';
                resultMessageDiv.className = 'message success';
                resultMessageDiv.classList.remove('hidden');
                
                safeSequenceDiv.textContent = 'Safe Sequence: ' + safeSequence.map(p => `P${p}`).join(' → ');
                safeSequenceDiv.classList.remove('hidden');
            } else {
                // System is in unsafe state
                logAlgorithmStep('No process found that can be allocated with current Work!', 'log-error');
                logAlgorithmStep('System is in an unsafe state - deadlock possible!', 'log-error');
                
                resultMessageDiv.textContent = 'Deadlock detected! System is in an unsafe state.';
                resultMessageDiv.className = 'message error';
                resultMessageDiv.classList.remove('hidden');
                
                safeSequenceDiv.textContent = 'Partial Sequence: ' + safeSequence.map(p => `P${p}`).join(' → ');
                safeSequenceDiv.classList.remove('hidden');
            }
            
            // Disable step button
            stepAnimationBtn.disabled = true;
        }
        
        animationStep++;
        
        // Scroll to bottom of log
        algorithmLog.scrollTop = algorithmLog.scrollHeight;
    }

    function logAlgorithmStep(message, className = '') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${className}`;
        logEntry.textContent = message;
        algorithmLog.appendChild(logEntry);
    }

    function visualizeAllocation(processIndex) {
        const processElement = document.getElementById(`process-${processIndex}`);
        const processRect = processElement.getBoundingClientRect();
        const animationRect = animationArea.getBoundingClientRect();
        
        const offsetX = processRect.left - animationRect.left + processRect.width / 2;
        const offsetY = processRect.top - animationRect.top + processRect.height / 2;
        
        // Create resource paths and moving elements
        for (let j = 0; j < resources.length; j++) {
            if (allocation[processIndex][j] > 0) {
                // Create path
                const path = document.createElement('div');
                path.className = 'resource-path';
                path.style.width = '100px';
                path.style.left = `${offsetX}px`;
                path.style.top = `${offsetY}px`;
                path.style.transform = `rotate(${j * 30}deg)`;
                animationArea.appendChild(path);
                
                // Create moving resource
                const resource = document.createElement('div');
                resource.className = 'resource-moving';
                resource.style.left = `${offsetX}px`;
                resource.style.top = `${offsetY}px`;
                animationArea.appendChild(resource);
                
                // Animate the resource
                gsap.to(resource, {
                    x: 100 * Math.cos(j * 30 * Math.PI / 180),
                    y: 100 * Math.sin(j * 30 * Math.PI / 180),
                    duration: 1,
                    ease: "power1.out",
                    onComplete: function() {
                        path.remove();
                        resource.remove();
                    }
                });
            }
        }
        
        // Highlight the process
        gsap.to(processElement, {
            scale: 1.2,
            backgroundColor: '#2ecc71',
            duration: 0.5,
            yoyo: true,
            repeat: 1
        });
    }

    function resetAnimation() {
        // Reset algorithm state
        work = [...available];
        finish = new Array(finish.length).fill(false);
        safeSequence = [];
        animationStep = 0;
        currentProcessIndex = -1;
        
        // Reset UI
        startAnimationBtn.disabled = false;
        stepAnimationBtn.disabled = true;
        resetAnimationBtn.disabled = true;
        
        resultMessageDiv.className = 'message hidden';
        safeSequenceDiv.className = 'safe-sequence hidden';
        algorithmLog.innerHTML = '';
        
        // Update displays
        updateResourceDisplay();
        updateProcessDisplay();
    }
});