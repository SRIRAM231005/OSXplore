let chatBox = document.getElementById("chat-box");
let userInput = document.getElementById("user-input");

let step = 0;
let strategy = "";
let numBlocks = 0;
let blocks = [];
let numProcesses = 0;
let processes = [];

function addMessage(text, isUser = false) {
    let msg = document.createElement("div");
    msg.classList.add("chat-message");
    if (isUser) msg.classList.add("user-message");
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function handleUserInput(event) {
    if (event.key === "Enter") {
        let input = userInput.value.trim();
        if (input === "") return;
        addMessage(input, true);
        userInput.value = "";
        processStep(input);
    }
}

function processStep(input) {
    switch (step) {
        case 0:
            addMessage("Welcome to the Memory Allocation Simulator! 🖥️");
            addMessage("Select an allocation strategy:\n -> for First Fit type first\n -> for Best Fit type best\n ->for Worst Fit type worst\n -> for Next Fit type next");
            step = 1;
            break;
        case 1:
            if (["first", "best", "worst", "next"].includes(input.toLowerCase())) {
                strategy = input.toLowerCase();
                addMessage(`Selected: ${strategy.toUpperCase()} ✅`);
                addMessage("How many memory blocks do you want?");
                step = 2;
            } else {
                addMessage("Please enter a valid strategy: First, Best, Worst, or Next.");
            }
            break;
        case 2:
            numBlocks = parseInt(input);
            if (!isNaN(numBlocks) && numBlocks > 0) {
                addMessage(`You have chosen ${numBlocks} blocks. Now, enter sizes one by one.`);
                step = 3;
            } else {
                addMessage("Enter a valid number of blocks.");
            }
            break;
        case 3:
            let blockSize = parseInt(input);
            if (!isNaN(blockSize) && blockSize > 0) {
                blocks.push(blockSize);
                if (blocks.length < numBlocks) {
                    addMessage(`Block ${blocks.length}/${numBlocks} added. Enter next size.`);
                } else {
                    addMessage("All blocks added! Now, how many processes do you want?");
                    step = 4;
                }
            } else {
                addMessage("Enter a valid block size.");
            }
            break;
        case 4:
            numProcesses = parseInt(input);
            if (!isNaN(numProcesses) && numProcesses > 0) {
                addMessage(`You have chosen ${numProcesses} processes. Now, enter sizes one by one.`);
                step = 5;
            } else {
                addMessage("Enter a valid number of processes.");
            }
            break;
        case 5:
            let processSize = parseInt(input);
            if (!isNaN(processSize) && processSize > 0) {
                processes.push(processSize);
                if (processes.length < numProcesses) {
                    addMessage(`Process ${processes.length}/${numProcesses} added. Enter next size.`);
                } else {
                    addMessage("All processes added! Running the simulation... 🔄");
                    setTimeout(allocateMemory, 1000);
                }
            } else {
                addMessage("Enter a valid process size.");
            }
            break;
    }
}

function allocateMemory() {
    let memoryVisual = document.getElementById("memory-visual");
    memoryVisual.innerHTML = '';

    let totalMemorySize = blocks.reduce((a, b) => a + b, 0); 
    let allocatedBlocks = blocks.map(size => ({ size, occupied: null, internalFragmentation: 0 }));

    let nextIndex = 0; 

    processes.forEach((processSize, processIndex) => {
        let allocated = false;

        if (strategy === 'first') {
            for (let i = 0; i < allocatedBlocks.length; i++) {
                if (!allocatedBlocks[i].occupied && allocatedBlocks[i].size >= processSize) {
                    allocatedBlocks[i].occupied = processSize;
                    allocatedBlocks[i].internalFragmentation = allocatedBlocks[i].size - processSize;
                    allocated = true;
                    break;
                }
            }
        } else if (strategy === 'best') {
            let bestIndex = -1;
            for (let i = 0; i < allocatedBlocks.length; i++) {
                if (!allocatedBlocks[i].occupied && allocatedBlocks[i].size >= processSize) {
                    if (bestIndex === -1 || allocatedBlocks[i].size < allocatedBlocks[bestIndex].size) {
                        bestIndex = i;
                    }
                }
            }
            if (bestIndex !== -1) {
                allocatedBlocks[bestIndex].occupied = processSize;
                allocatedBlocks[bestIndex].internalFragmentation = allocatedBlocks[bestIndex].size - processSize;
                allocated = true;
            }
        } else if (strategy === 'worst') {
            let worstIndex = -1;
            for (let i = 0; i < allocatedBlocks.length; i++) {
                if (!allocatedBlocks[i].occupied && allocatedBlocks[i].size >= processSize) {
                    if (worstIndex === -1 || allocatedBlocks[i].size > allocatedBlocks[worstIndex].size) {
                        worstIndex = i;
                    }
                }
            }
            if (worstIndex !== -1) {
                allocatedBlocks[worstIndex].occupied = processSize;
                allocatedBlocks[worstIndex].internalFragmentation = allocatedBlocks[worstIndex].size - processSize;
                allocated = true;
            }
        } else if (strategy === 'next') {
            let startIndex = nextIndex;
            while (true) {
                if (!allocatedBlocks[nextIndex].occupied && allocatedBlocks[nextIndex].size >= processSize) {
                    allocatedBlocks[nextIndex].occupied = processSize;
                    allocatedBlocks[nextIndex].internalFragmentation = allocatedBlocks[nextIndex].size - processSize;
                    allocated = true;
                    nextIndex = (nextIndex + 1) % allocatedBlocks.length; 
                    break;
                }
                nextIndex = (nextIndex + 1) % allocatedBlocks.length;
                if (nextIndex === startIndex) break;
            }
        }

        if (!allocated) {
            console.log(`Process ${processSize} could not be allocated`);
        }
    });

    // Visualization
    allocatedBlocks.forEach((block, index) => {
        let blockDiv = document.createElement("div");
        blockDiv.classList.add("memory-block");
        blockDiv.style.height = `${(block.size / totalMemorySize) * 100}%`;
        blockDiv.style.width = "100%";
        blockDiv.style.border = "1px solid white";
        blockDiv.style.position = "relative";

        if (block.occupied) {
            blockDiv.innerHTML = `<b>P(${block.occupied})</b>`;
            blockDiv.style.backgroundColor = "#4caf50"; // Allocated memory
        } else {
            blockDiv.innerHTML = `<b>B(${block.size})</b>`;
            blockDiv.style.backgroundColor = "black"; // Free block
        }

        memoryVisual.appendChild(blockDiv);

        if (block.internalFragmentation > 0) {
            let fragDiv = document.createElement("div");
            fragDiv.classList.add("internal-frag");
            fragDiv.style.height = `${(block.internalFragmentation / block.size) * 100}%`;
            fragDiv.style.width = "100%";
            fragDiv.style.backgroundColor = "red";
            fragDiv.style.position = "absolute";
            fragDiv.style.bottom = "0";
            fragDiv.innerHTML = `<b>Frag(${block.internalFragmentation})</b>`;
            blockDiv.appendChild(fragDiv);
        }
    });
    generateAllocationTable(processes, allocatedBlocks);
    addMessage("Memory allocation simulation complete! ✅");
}


function generateAllocationTable(processes, allocatedBlocks) {
    let tableContainer = document.getElementById("allocation-table");
    tableContainer.innerHTML = ""; // Clear previous table if exists

    let table = document.createElement("table");
    table.classList.add("allocation-table");

    // Create header row
    let headerRow = document.createElement("tr");
    let headers = ["Process No.", "Process Size", "Block No."];

    headers.forEach(text => {
        let th = document.createElement("th");
        th.innerText = text;
        headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    // Create rows for each process
    processes.forEach((processSize, index) => {
        let tr = document.createElement("tr");

        let td1 = document.createElement("td");
        td1.innerText = index + 1;
        tr.appendChild(td1);

        let td2 = document.createElement("td");
        td2.innerText = processSize;
        tr.appendChild(td2);

        let td3 = document.createElement("td");

        let allocatedBlockIndex = allocatedBlocks.findIndex(block => block.occupied === processSize);

        if (allocatedBlockIndex !== -1) {
            td3.innerText = allocatedBlockIndex + 1; // Block index (1-based)
            td3.style.color = "#ff0099"; // Pink for allocated
        } else {
            td3.innerText = "Not Allocated";
            td3.style.color = "#ffcc00"; // Yellow for not allocated
        }

        tr.appendChild(td3);
        table.appendChild(tr);
    });

    tableContainer.appendChild(table);
}


function resetPage() {
    location.reload(); // Reloads the current page
}


addMessage("Hello!  Welcome to OSXplore  Let's start the Memory Allocation Simulator. Type Enter to continue.");

document.getElementById("openDialog").addEventListener("click", function() {
    document.getElementById("algoDialog").style.display = "flex";
});

document.querySelector(".close-btn").addEventListener("click", function() {
    document.getElementById("algoDialog").style.display = "none";
});

// Close when clicking outside the box
window.addEventListener("click", function(event) {
    let dialog = document.getElementById("algoDialog");
    if (event.target === dialog) {
        dialog.style.display = "none";
    }
});

