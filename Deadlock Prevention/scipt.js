// Global variables
let resources = [];
let processes = [];
let allocations = [];
let requests = [];

// Constants for graph layout
const NODE_RADIUS = 30;
const RESOURCE_WIDTH = 60;
const RESOURCE_HEIGHT = 60;
const ARROW_SIZE = 10;
const LEVEL_SPACING = 200;
const NODE_SPACING = 150;

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    setupAccordion();
    setupResourceInputs();
    setupAllocationInputs();
    setupRequestInputs();
    setupResetButton();
    
    // Initialize the form
    document.getElementById('resource-count').dispatchEvent(new Event('input'));
});

function setupAccordion() {
    const accordions = document.getElementsByClassName("accordion");
    for (let i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener("click", function() {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    }
}

function setupResourceInputs() {
    const resourceCountInput = document.getElementById('resource-count');
    const setResourcesBtn = document.getElementById('set-resources');
    
    resourceCountInput.addEventListener('input', function() {
        const count = parseInt(this.value);
        const container = document.getElementById('resource-inputs');
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label for="resource-${i}">Resource ${String.fromCharCode(65 + i)} instances:</label>
                <input type="number" id="resource-${i}" min="1" value="1">
            `;
            container.appendChild(div);
        }
    });
    
    setResourcesBtn.addEventListener('click', function() {
        const count = parseInt(document.getElementById('resource-count').value);
        resources = [];
        
        for (let i = 0; i < count; i++) {
            const instances = parseInt(document.getElementById(`resource-${i}`).value);
            resources.push({
                id: `R${String.fromCharCode(65 + i)}`,
                instances: instances
            });
        }
        
        // Show resource cards
        const container = document.getElementById('resource-cards');
        container.innerHTML = '';
        resources.forEach(res => {
            const card = document.createElement('div');
            card.className = 'resource-card';
            card.innerHTML = `${res.id} (${res.instances})`;
            container.appendChild(card);
        });
        
        document.getElementById('resources-display').style.display = 'block';
        document.getElementById('allocation-section').style.display = 'block';
        document.getElementById('process-count').dispatchEvent(new Event('input'));
    });
}

function setupAllocationInputs() {
    const processCountInput = document.getElementById('process-count');
    const setAllocationBtn = document.getElementById('set-allocation');
    
    processCountInput.addEventListener('input', function() {
        const count = parseInt(this.value);
        const container = document.getElementById('allocation-inputs');
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            
            let html = `<label>Process P${i+1} holds:</label>`;
            resources.forEach((res, j) => {
                html += `
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <input type="number" id="alloc-p${i+1}-r${j}" min="0" max="${res.instances}" value="0" 
                               style="width: 60px; margin-right: 5px;">
                        <span>of ${res.id} (max ${res.instances})</span>
                    </div>
                `;
            });
            
            div.innerHTML = html;
            container.appendChild(div);
        }
    });
    
    setAllocationBtn.addEventListener('click', function() {
        const processCount = parseInt(document.getElementById('process-count').value);
        processes = [];
        allocations = [];
        
        for (let i = 0; i < processCount; i++) {
            processes.push(`P${i+1}`);
            
            resources.forEach((res, j) => {
                const held = parseInt(document.getElementById(`alloc-p${i+1}-r${j}`).value);
                if (held > 0) {
                    allocations.push({
                        process: `P${i+1}`,
                        resource: res.id,
                        amount: held
                    });
                }
            });
        }
        
        document.getElementById('request-section').style.display = 'block';
        setupRequestInputFields();
    });
}

function setupRequestInputFields() {
    const container = document.getElementById('request-inputs');
    container.innerHTML = '';
    
    processes.forEach(process => {
        const div = document.createElement('div');
        div.className = 'form-group';
        
        let html = `<label>Process ${process} requests:</label>`;
        resources.forEach((res, j) => {
            const held = allocations.filter(a => a.process === process && a.resource === res.id)
                                  .reduce((sum, a) => sum + a.amount, 0);
            const maxCanRequest = res.instances - held;
            
            html += `
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <input type="number" id="req-${process}-r${j}" min="0" max="${maxCanRequest}" value="0" 
                           style="width: 60px; margin-right: 5px;">
                    <span>of ${res.id} (max ${maxCanRequest})</span>
                </div>
            `;
        });
        
        div.innerHTML = html;
        container.appendChild(div);
    });
}

function setupRequestInputs() {
    const setRequestsBtn = document.getElementById('set-requests');
    
    setRequestsBtn.addEventListener('click', function() {
        requests = [];
        
        processes.forEach(process => {
            resources.forEach((res, j) => {
                const requested = parseInt(document.getElementById(`req-${process}-r${j}`).value);
                if (requested > 0) {
                    requests.push({
                        process: process,
                        resource: res.id,
                        amount: requested
                    });
                }
            });
        });
        
        document.getElementById('graph-section').style.display = 'block';
        drawGraph();
    });
}

function setupResetButton() {
    document.getElementById('reset-btn').addEventListener('click', function() {
        resources = [];
        processes = [];
        allocations = [];
        requests = [];
        
        document.getElementById('resources-display').style.display = 'none';
        document.getElementById('allocation-section').style.display = 'none';
        document.getElementById('request-section').style.display = 'none';
        document.getElementById('graph-section').style.display = 'none';
        
        document.getElementById('resource-count').value = '2';
        document.getElementById('resource-count').dispatchEvent(new Event('input'));
    });
}

// Graph drawing and analysis
function drawGraph() {
    // Clear previous graph
    d3.select("#graph-container").html("");
    
    const width = document.getElementById('graph-container').clientWidth;
    const height = document.getElementById('graph-container').clientHeight;
    
    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Create a group for zooming/panning
    const g = svg.append("g");
    
    // Calculate positions for processes and resources
    const processPositions = {};
    const resourcePositions = {};
    
    // Position processes in a vertical line on the left
    const processStartY = (height - (processes.length - 1) * NODE_SPACING) / 2;
    processes.forEach((process, i) => {
        processPositions[process] = {
            x: width * 0.3,
            y: processStartY + i * NODE_SPACING
        };
    });
    
    // Position resources in a vertical line on the right
    const resourceStartY = (height - (resources.length - 1) * NODE_SPACING) / 2;
    resources.forEach((resource, i) => {
        resourcePositions[resource.id] = {
            x: width * 0.7,
            y: resourceStartY + i * NODE_SPACING
        };
    });
    
    // Draw processes (circles)
    processes.forEach(process => {
        g.append("circle")
            .attr("cx", processPositions[process].x)
            .attr("cy", processPositions[process].y)
            .attr("r", NODE_RADIUS)
            .attr("fill", "#2ecc71");
        
        g.append("text")
            .attr("class", "node-text")
            .attr("x", processPositions[process].x)
            .attr("y", processPositions[process].y)
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("fill", "white")
            .text(process);
    });
    
    // Draw resources (rectangles with instances)
    resources.forEach(resource => {
        const instances = resource.instances;
        const pos = resourcePositions[resource.id];
        
        // Main resource rectangle
        g.append("rect")
            .attr("x", pos.x - RESOURCE_WIDTH/2)
            .attr("y", pos.y - RESOURCE_HEIGHT/2)
            .attr("width", RESOURCE_WIDTH)
            .attr("height", RESOURCE_HEIGHT)
            .attr("fill", "#e74c3c");
        
        // Resource label
        g.append("text")
            .attr("class", "node-text")
            .attr("x", pos.x)
            .attr("y", pos.y - RESOURCE_HEIGHT/2 - 10)
            .attr("text-anchor", "middle")
            .text(resource.id);
        
        // Instance dots
        if (instances === 1) {
            g.append("circle")
                .attr("cx", pos.x)
                .attr("cy", pos.y)
                .attr("r", 5)
                .attr("fill", "white");
        } else {
            // Arrange dots in a circle for multiple instances
            const dotRadius = Math.min(20, RESOURCE_WIDTH/2 - 10);
            for (let i = 0; i < Math.min(instances, 8); i++) {
                const angle = (i * 2 * Math.PI) / Math.min(instances, 8);
                g.append("circle")
                    .attr("cx", pos.x + dotRadius * Math.cos(angle))
                    .attr("cy", pos.y + dotRadius * Math.sin(angle))
                    .attr("r", 5)
                    .attr("fill", "white");
            }
            if (instances > 8) {
                g.append("text")
                    .attr("x", pos.x)
                    .attr("y", pos.y + RESOURCE_HEIGHT/2 + 15)
                    .attr("text-anchor", "middle")
                    .text(`${instances} instances`);
            }
        }
    });
    
    // Create arrow marker definitions
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", ARROW_SIZE)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#3498db");
    
    svg.append("defs").append("marker")
        .attr("id", "arrowhead-request")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", ARROW_SIZE)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#9b59b6");
    
    // Draw allocation edges (resource to process)
    allocations.forEach(allocation => {
        const resourcePos = resourcePositions[allocation.resource];
        const processPos = processPositions[allocation.process];
        
        // Calculate direction vector
        const dx = processPos.x - resourcePos.x;
        const dy = processPos.y - resourcePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate start and end points at the edges of the nodes
        const startX = resourcePos.x + (dx / distance) * (RESOURCE_WIDTH/2);
        const startY = resourcePos.y + (dy / distance) * (RESOURCE_HEIGHT/2);
        const endX = processPos.x - (dx / distance) * NODE_RADIUS;
        const endY = processPos.y - (dy / distance) * NODE_RADIUS;
        
        // Draw line with arrow
        g.append("line")
            .attr("x1", startX)
            .attr("y1", startY)
            .attr("x2", endX)
            .attr("y2", endY)
            .attr("stroke", "#3498db")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrowhead)");
        
        // Add amount label if > 1
        if (allocation.amount > 1) {
            g.append("text")
                .attr("x", (startX + endX) / 2)
                .attr("y", (startY + endY) / 2)
                .attr("text-anchor", "middle")
                .attr("dy", -5)
                .text(allocation.amount);
        }
    });
    
    // Draw request edges (process to resource)
    requests.forEach(request => {
        const processPos = processPositions[request.process];
        const resourcePos = resourcePositions[request.resource];
        
        // Calculate direction vector
        const dx = resourcePos.x - processPos.x;
        const dy = resourcePos.y - processPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate start and end points at the edges of the nodes
        const startX = processPos.x + (dx / distance) * NODE_RADIUS;
        const startY = processPos.y + (dy / distance) * NODE_RADIUS;
        const endX = resourcePos.x - (dx / distance) * (RESOURCE_WIDTH/2);
        const endY = resourcePos.y - (dy / distance) * (RESOURCE_HEIGHT/2);
        
        // Draw line with arrow
        g.append("line")
            .attr("x1", startX)
            .attr("y1", startY)
            .attr("x2", endX)
            .attr("y2", endY)
            .attr("stroke", "#9b59b6")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .attr("marker-end", "url(#arrowhead-request)");
        
        // Add amount label if > 1
        if (request.amount > 1) {
            g.append("text")
                .attr("x", (startX + endX) / 2)
                .attr("y", (startY + endY) / 2)
                .attr("text-anchor", "middle")
                .attr("dy", -5)
                .text(request.amount);
        }
    });
    
    // Analyze for deadlocks
    analyzeDeadlock();
}

function analyzeDeadlock() {
    // Build a graph representation for cycle detection
    const graph = {};
    
    // Add processes and resources as nodes
    processes.forEach(p => graph[p] = []);
    resources.forEach(r => graph[r.id] = []);
    
    // Add edges based on allocations and requests
    allocations.forEach(a => {
        // Allocation: resource -> process
        graph[a.resource].push({node: a.process, type: 'allocation'});
    });
    
    requests.forEach(r => {
        // Request: process -> resource
        graph[r.process].push({node: r.resource, type: 'request'});
    });
    
    // Check for cycles (deadlock detection)
    const cycles = findCycles(graph);
    const resultDiv = document.getElementById('analysis-result');
    
    if (cycles.length > 0) {
        // Filter cycles to only those involving single-instance resources
        const deadlockCycles = cycles.filter(cycle => {
            const resourceNodes = cycle.filter(node => node.startsWith('R'));
            return resourceNodes.every(r => {
                const resource = resources.find(res => res.id === r);
                const allocated = allocations.filter(a => a.resource === r).length;
                return resource.instances - allocated <= 0; // No available instances
            });
        });
        
        if (deadlockCycles.length > 0) {
            // Highlight the cycles in the graph
            highlightCycles(deadlockCycles);
            
            // Display deadlock warning
            resultDiv.innerHTML = `
                <h3 style="color: #e74c3c;">Deadlock Detected!</h3>
                <p>The system is in a deadlock state due to the following cycle(s):</p>
                <ul>
                    ${deadlockCycles.map(cycle => `<li>${cycle.join(" → ")} → ${cycle[0]}</li>`).join('')}
                </ul>
                <p>This occurs because each process in the cycle is waiting for a resource held by another process in the cycle, 
                and all resources involved have only one instance.</p>
            `;
            return;
        }
    }
    
    resultDiv.innerHTML = `
        <h3 style="color: #2ecc71;">No Deadlock Detected</h3>
        <p>The system is in a safe state with no circular wait conditions.</p>
    `;
}

function highlightCycles(cycles) {
    // For each cycle, highlight the edges that form the cycle
    cycles.forEach(cycle => {
        for (let i = 0; i < cycle.length; i++) {
            const from = cycle[i];
            const to = cycle[(i + 1) % cycle.length];
            
            // Find all edges between these nodes
            d3.selectAll("line").each(function() {
                const line = d3.select(this);
                const x1 = parseFloat(line.attr("x1"));
                const y1 = parseFloat(line.attr("y1"));
                const x2 = parseFloat(line.attr("x2"));
                const y2 = parseFloat(line.attr("y2"));
                
                // Check if this line connects the two nodes in our cycle
                if (isEdgeBetweenNodes(from, to, x1, y1, x2, y2)) {
                    line.classed("cycle", true);
                }
            });
        }
    });
}

function isEdgeBetweenNodes(from, to, x1, y1, x2, y2) {
    const svg = document.querySelector("#graph-container svg");
    const elements = svg.querySelectorAll("circle, rect");
    
    let fromElement, toElement;
    
    // Find the from and to elements
    for (let el of elements) {
        if (el.tagName === "circle") {
            const text = el.nextElementSibling;
            if (text && text.textContent === from) fromElement = el;
            if (text && text.textContent === to) toElement = el;
        } else if (el.tagName === "rect") {
            const text = el.previousElementSibling;
            if (text && text.textContent === from) fromElement = el;
            if (text && text.textContent === to) toElement = el;
        }
    }
    
    if (!fromElement || !toElement) return false;
    
    // Get positions of the elements
    let fromX, fromY, toX, toY;
    
    if (fromElement.tagName === "circle") {
        fromX = parseFloat(fromElement.getAttribute("cx"));
        fromY = parseFloat(fromElement.getAttribute("cy"));
    } else {
        fromX = parseFloat(fromElement.getAttribute("x")) + RESOURCE_WIDTH/2;
        fromY = parseFloat(fromElement.getAttribute("y")) + RESOURCE_HEIGHT/2;
    }
    
    if (toElement.tagName === "circle") {
        toX = parseFloat(toElement.getAttribute("cx"));
        toY = parseFloat(toElement.getAttribute("cy"));
    } else {
        toX = parseFloat(toElement.getAttribute("x")) + RESOURCE_WIDTH/2;
        toY = parseFloat(toElement.getAttribute("y")) + RESOURCE_HEIGHT/2;
    }
    
    // Check if the edge connects these points (with some tolerance)
    const tolerance = 5;
    return (
        (Math.abs(x1 - fromX) < tolerance && Math.abs(y1 - fromY) < tolerance &&
        Math.abs(x2 - toX) < tolerance && Math.abs(y2 - toY) < tolerance) ||
        (Math.abs(x1 - toX) < tolerance && Math.abs(y1 - toY) < tolerance &&
        Math.abs(x2 - fromX) < tolerance && Math.abs(y2 - fromY) < tolerance)
    );
}

function findCycles(graph) {
    const nodes = Object.keys(graph);
    const visited = {};
    const recursionStack = {};
    const cycles = [];
    
    function dfs(node, path, edgeTypes) {
        if (!visited[node]) {
            visited[node] = true;
            recursionStack[node] = true;
            path.push(node);
            
            for (const edge of graph[node]) {
                const neighbor = edge.node;
                const newEdgeTypes = [...edgeTypes, edge.type];
                
                if (!visited[neighbor]) {
                    dfs(neighbor, [...path], newEdgeTypes);
                } else if (recursionStack[neighbor]) {
                    // Found a cycle - check if it's a valid deadlock cycle
                    const cycleStart = path.indexOf(neighbor);
                    if (cycleStart !== -1) {
                        const cycle = path.slice(cycleStart);
                        const cycleEdgeTypes = newEdgeTypes.slice(cycleStart);
                        
                        // Must alternate between request and allocation edges
                        let valid = true;
                        for (let i = 0; i < cycle.length; i++) {
                            const current = cycleEdgeTypes[i];
                            const next = cycleEdgeTypes[(i + 1) % cycle.length];
                            if (current === next) {
                                valid = false;
                                break;
                            }
                        }
                        
                        if (valid && cycle.some(n => n.startsWith('P')) && cycle.some(n => n.startsWith('R'))) {
                            // Check if we already have this cycle in reverse order
                            const cycleKey = cycle.join(',');
                            const reverseKey = [...cycle].reverse().join(',');
                            if (!cycles.some(c => c.join(',') === cycleKey || c.join(',') === reverseKey)) {
                                cycles.push(cycle);
                            }
                        }
                    }
                }
            }
        }
        recursionStack[node] = false;
    }
    
    for (const node of nodes) {
        if (!visited[node]) {
            dfs(node, [], []);
        }
    }
    
    return cycles;
}