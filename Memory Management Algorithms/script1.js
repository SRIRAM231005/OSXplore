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
                    let totalMemorySize = blocks.reduce((a, b) => a + b, 0); 
                    visualizeBlocks(blocks, totalMemorySize);
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

function visualizeBlocks(blocks, totalMemorySize) {
    let memoryVisual = document.getElementById("memory-visual");
    memoryVisual.innerHTML = ""; // Clear previous visualization

    console.log("blocks:", blocks);
    console.log("total:", totalMemorySize);

    blocks.forEach((block, index) => {
        let blockDiv = document.createElement("div");
        blockDiv.classList.add("memory-block");
        blockDiv.style.height = `${(block / totalMemorySize) * 100}%`;
        blockDiv.style.width = "100%";
        blockDiv.style.border = "2px solid white";
        blockDiv.style.position = "relative";
        blockDiv.style.backgroundColor = "black"; // Initially just show free blocks

        // Creating a span for text
        let textSpan = document.createElement("span");
        textSpan.classList.add("block-text");
        textSpan.textContent = `B${index + 1}(${block})`;
        textSpan.style.position = "absolute";
        textSpan.style.left = "10%"; // Initially inside the block
        textSpan.style.top = "50%";
        textSpan.style.transform = "translateY(-50%)";
        textSpan.style.transition = "left 1.5s ease-in-out"; // Smooth transition

        blockDiv.appendChild(textSpan);
        memoryVisual.appendChild(blockDiv);
    });
}



function allocateMemory() {
    let memoryVisual = document.getElementById("memory-visual");
    memoryVisual.innerHTML = '';

    let totalMemorySize = blocks.reduce((a, b) => a + b, 0); 
    let allocatedBlocks = blocks.map(size => ({ size, occupied: null, internalFragmentation: 0 , blockNo: -1 }));
    let allprocesses = processes.map(processSize => ({processSize , blockNo: -1}));

    let nextIndex = 0;
    let processAllocations = []; 

    processes.forEach((processSize, processIndex) => {
        let allocated = false;

        if (strategy === 'first') {
            for (let i = 0; i < allocatedBlocks.length; i++) {
                if (!allocatedBlocks[i].occupied && allocatedBlocks[i].size >= processSize) {
                    allocatedBlocks[i].occupied = processSize;
                    allocatedBlocks[i].internalFragmentation = allocatedBlocks[i].size - processSize;
                    allocatedBlocks[i].blockNo = i;
                    allprocesses[processIndex].blockNo = i;
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
                allocatedBlocks[bestIndex].blockNo = bestIndex;
                allprocesses[processIndex].blockNo = bestIndex;
                allocated = true;
            }
        } else if (strategy === 'worst') {
            let worstIndex = -1;
            
            // Find the block with the largest space that can fit the process
            for (let i = 0; i < allocatedBlocks.length; i++) {
                if (!allocatedBlocks[i].occupied && allocatedBlocks[i].size >= processSize) {
                    if (worstIndex === -1 || allocatedBlocks[i].size > allocatedBlocks[worstIndex].size) {
                        worstIndex = i;
                    }
                }
            }
        
            if (worstIndex !== -1) {
                allocatedBlocks[worstIndex].occupied = processSize;
                let remainingSpace = allocatedBlocks[worstIndex].size - processSize;

        
                // If there's internal fragmentation, update it
                allocatedBlocks[worstIndex].internalFragmentation = remainingSpace;
                allocatedBlocks[worstIndex].blockNo = worstIndex;
                allprocesses[processIndex].blockNo = worstIndex;
                
                allocated = true;
            }
        } else if (strategy === 'next') {
            let startIndex = nextIndex;
            while (true) {
                if (!allocatedBlocks[nextIndex].occupied && allocatedBlocks[nextIndex].size >= processSize) {
                    allocatedBlocks[nextIndex].occupied = processSize;
                    allocatedBlocks[nextIndex].internalFragmentation = allocatedBlocks[nextIndex].size - processSize;
                    allocatedBlocks[nextIndex].blockNo = nextIndex;
                    allprocesses[processIndex].blockNo = nextIndex;
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

    
    function moveTextOutsideBlocks() {
        document.querySelectorAll(".block-text").forEach(span => {
            span.style.left = "10%"; // Set initial position inside block
            span.offsetWidth; // Force reflow to ensure smooth transition
            span.style.transition = "left 1.5s ease-in-out";
            span.style.left = "110%"; // Moves outside to the right
        });
    }
     
    visualizeBlocks(blocks, totalMemorySize);
    moveTextOutsideBlocks();
    setTimeout(() => {
        visualizeAllocationStepByStep(allocatedBlocks, totalMemorySize);
        generateAllocationTable(processes, allocatedBlocks, allprocesses);
    }, 2000);
    addMessage("Memory allocation simulation complete! ✅");
}

function visualizeAllocationStepByStep(allocatedBlocks, totalMemorySize) {
    let memoryVisual = document.getElementById("memory-visual");
    let processColors = ["#4caf50", "#2196F3", "#FF9800", "#9C27B0", "#E91E63"]; // Different process colors
    let processColorMap = {};

    function getProcessColor(processId) {
        if (!processColorMap[processId]) {
            processColorMap[processId] = processColors[Object.keys(processColorMap).length % processColors.length];
        }
        return processColorMap[processId];
    }

    function visualizeBlock(index) {

        let allBlocks = document.querySelectorAll(".memory-block");

        if (index >= allocatedBlocks.length) return;
        if (index >= allBlocks.length) {
            console.error(`Block at index ${index} doesn't exist!`);
            return;
        }
        
        let block = allocatedBlocks[index];
        let blockDiv = allBlocks[index];
        console.log(memoryVisual);
        console.log(blockDiv);

        
            if (block.occupied) {
                let processColor = getProcessColor(block.occupied);
                
                // Create a new div for the process label
                let processDiv = document.createElement("div");
                processDiv.innerHTML = `<b>P${index+1}(${block.occupied})</b>`;
                processDiv.style.position = "absolute";
                processDiv.style.top = "0";
                processDiv.style.color = "white";
                processDiv.style.fontWeight = "bold";
                processDiv.style.opacity = "0"; // Start hidden
                processDiv.style.transition = "opacity 1s ease-in-out";
                
                // ✅ Set height based on block height dynamically
                processDiv.style.height = `${((block.size - block.internalFragmentation) / block.size) * 100}%`; // 60% of block height
                processDiv.style.display = "flex";
                processDiv.style.alignItems = "center"; 
                processDiv.style.justifyContent = "center"; 
            
                //blockDiv.style.backgroundColor = processColor;
                blockDiv.appendChild(processDiv); // Append process label without removing block name
            
                // Smooth transition
                setTimeout(() => {
                    blockDiv.style.backgroundColor = processColor;
                    processDiv.style.opacity = "1";
                    //processDiv.style.right = "50px"; // Moves outward
                }, 100);
            }
            

        if (block.internalFragmentation > 0) {
            let fragDiv = document.createElement("div");
            fragDiv.classList.add("internal-frag");
            fragDiv.style.height = `${(block.internalFragmentation / block.size) * 100}%`;
            fragDiv.style.width = "100%";
            fragDiv.style.position = "absolute";
            fragDiv.style.bottom = "0";
            fragDiv.innerHTML = `<b>Frag(${block.internalFragmentation})</b>`;
            fragDiv.style.opacity = "0";
            fragDiv.style.transition = "opacity 1s ease-in-out";
            blockDiv.appendChild(fragDiv);

            setTimeout(() => {
                fragDiv.style.backgroundColor = "red";
                fragDiv.style.opacity = "1"; // Fade in internal fragmentation
            }, 100);
        }

        setTimeout(() => visualizeBlock(index + 1), 1000); // Process next block smoothly
    }

    visualizeBlock(0);
}



function generateAllocationTable(processes, allocatedBlocks, allprocesses) {
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

    console.log(allocatedBlocks);
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

        console.log("index:",index);
        let allocatedBlockIndex = allprocesses[index].blockNo;
        console.log("allocatedBlockIndex:",allprocesses[index]);

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

