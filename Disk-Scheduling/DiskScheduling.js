const algorithmSelect = document.getElementById('algorithm');
const diskSizeInput = document.getElementById('diskSize');
const initialPositionInput = document.getElementById('initialPosition');
const requestsInput = document.getElementById('requests');
const directionSelect = document.getElementById('direction');
const speedInput = document.getElementById('speed');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const randomBtn = document.getElementById('randomBtn');
const clearBtn = document.getElementById('clearBtn');
const addBtn = document.getElementById('addBtn');
const diskHead = document.getElementById('diskHead');
const minTrackDisplay = document.getElementById('minTrack');
const maxTrackDisplay = document.getElementById('maxTrack');
const queueItemsContainer = document.getElementById('queueItems');
const queueCountDisplay = document.getElementById('queueCount');
const diskContainer = document.querySelector('.disk-container');
const totalOperationsDisplay = document.getElementById('totalOperations');
const totalDistanceDisplay = document.getElementById('totalDistance');
const averageSeekDisplay = document.getElementById('averageSeek');
const efficiencyDisplay = document.getElementById('efficiency');
const algorithmDescription = document.getElementById('algorithmDescription');

const algorithmDescriptions = {
    'fcfs': 'FCFS: Processes requests in the order they arrive. Simple but can be inefficient with random access patterns.',
    'sstf': 'SSTF: Always services the closest request to minimize seek time. Better performance but can cause starvation.',
    'scan': 'SCAN: Moves back and forth across the disk like an elevator. Services all requests in its path.',
    'cscan': 'C-SCAN: Like SCAN but jumps back to start after reaching the end. More uniform service times.',
    'look': 'LOOK: Similar to SCAN but only goes as far as the last request in each direction.',
    'clook': 'C-LOOK: Like C-SCAN but only goes as far as needed. Most efficient but complex.'
};

let isAnimating = false;
let animationQueue = [];
let selectedQueueItems = [];

function initialize() {
    updateDiskDisplay();
    resetStats();
    updateAlgorithmDescription();
    const initialPosition = parseInt(initialPositionInput.value);
    const diskSize = parseInt(diskSizeInput.value);
    if (initialPosition < 0) initialPositionInput.value = 0;
    if (initialPosition >= diskSize) initialPositionInput.value = diskSize - 1;
    positionHead(parseInt(initialPositionInput.value));
    diskHead.textContent = initialPositionInput.value;
    renderRequestQueue();
}

function updateAlgorithmDescription() {
    algorithmDescription.textContent = algorithmDescriptions[algorithmSelect.value];
}

function resetStats() {
    totalOperationsDisplay.textContent = '0';
    totalDistanceDisplay.textContent = '0';
    averageSeekDisplay.textContent = '0';
    efficiencyDisplay.textContent = '-';
    document.querySelectorAll('.seek-path').forEach(path => path.remove());
}

function updateDiskDisplay() {
    const diskSize = parseInt(diskSizeInput.value);
    minTrackDisplay.textContent = '0';
    maxTrackDisplay.textContent = (diskSize - 1).toString();
    document.querySelectorAll('.track-marker').forEach(marker => marker.remove());
}

function positionHead(position) {
    const diskSize = parseInt(diskSizeInput.value);
    position = Math.max(0, Math.min(position, diskSize - 1));
    const percentPosition = (position / (diskSize - 1)) * 100;
    diskHead.style.left = `${percentPosition}%`;
}

function renderRequestQueue() {
    queueItemsContainer.innerHTML = '';
    const requests = parseRequests();
    
    requests.forEach((req, index) => {
        const queueItem = document.createElement('div');
        queueItem.classList.add('queue-item');
        queueItem.textContent = req;
        queueItem.dataset.track = req;
        queueItem.addEventListener('click', toggleQueueItemSelection);
        queueItemsContainer.appendChild(queueItem);
        addTrackMarker(req);
    });
    
    updateQueueCount();
}

function toggleQueueItemSelection(e) {
    const item = e.target;
    const track = parseInt(item.dataset.track);
    
    if (item.classList.contains('selected')) {
        item.classList.remove('selected');
        selectedQueueItems = selectedQueueItems.filter(t => t !== track);
    } else {
        item.classList.add('selected');
        selectedQueueItems.push(track);
    }
}

function addTrackMarker(trackPosition) {
    const existingMarkers = document.querySelectorAll(`.track-marker[data-track="${trackPosition}"]`);
    existingMarkers.forEach(marker => marker.remove());
    
    const diskSize = parseInt(diskSizeInput.value);
    const percentPosition = (trackPosition / (diskSize - 1)) * 100;
    
    const marker = document.createElement('div');
    marker.classList.add('track-marker');
    marker.style.left = `${percentPosition}%`;
    marker.dataset.track = trackPosition;
    marker.textContent = trackPosition;
    diskContainer.appendChild(marker);
}

function parseRequests() {
    const requestsString = requestsInput.value.trim();
    return requestsString ? requestsString.split(',')
        .map(req => parseInt(req.trim()))
        .filter(req => !isNaN(req)) : [];
}

function updateQueueCount() {
    queueCountDisplay.textContent = parseRequests().length;
}

function generateRandomRequests() {
    const diskSize = parseInt(diskSizeInput.value);
    const count = Math.min(15, Math.max(5, Math.floor(diskSize / 20)));
    const requests = Array.from({length: count}, () => Math.floor(Math.random() * diskSize));
    requestsInput.value = requests.join(', ');
    renderRequestQueue();
}

function clearRequests() {
    requestsInput.value = '';
    renderRequestQueue();
}

function addRequest() {
    const diskSize = parseInt(diskSizeInput.value);
    const currentRequests = parseRequests();
    currentRequests.push(Math.floor(Math.random() * diskSize));
    requestsInput.value = currentRequests.join(', ');
    renderRequestQueue();
}

let currentAnimation = { interval: null, markers: [] };

function animateHeadMovement(fromTrack, toTrack, onComplete) {
    cleanupAnimation();
    const diskSize = parseInt(diskSizeInput.value);
    fromTrack = Math.max(0, Math.min(fromTrack, diskSize - 1));
    toTrack = Math.max(0, Math.min(toTrack, diskSize - 1));
    
    const fromPercent = (fromTrack / (diskSize - 1)) * 100;
    const toPercent = (toTrack / (diskSize - 1)) * 100;
    
    diskHead.textContent = fromTrack;
    diskHead.style.transition = '';
    diskHead.style.left = `${fromPercent}%`;
    
    const seekPath = document.createElement('div');
    seekPath.classList.add('seek-path');
    seekPath.style.left = `${Math.min(fromPercent, toPercent)}%`;
    seekPath.style.width = `${Math.abs(toPercent - fromPercent)}%`;
    
    if (toPercent < fromPercent) {
        seekPath.style.transform = 'rotate(180deg)';
    }
    
    diskContainer.appendChild(seekPath);
    currentAnimation.markers.push(seekPath);
    
    const distance = Math.abs(toTrack - fromTrack);
    const speedFactor = 41 - parseInt(speedInput.value);
    const duration = Math.max(1000, Math.min(5000, distance * 50 / speedFactor));
    
    setTimeout(() => {
        diskHead.style.transition = `left ${duration}ms linear`;
        diskHead.style.left = `${toPercent}%`;
    }, 50);
    
    const startTime = Date.now();
    const totalSteps = Math.ceil(duration / 50);
    let currentStep = 0;
    
    currentAnimation.interval = setInterval(() => {
        currentStep++;
        const progress = Math.min(1, currentStep / totalSteps);
        const currentTrack = Math.round(fromTrack + (toTrack - fromTrack) * progress);
        diskHead.textContent = currentTrack;
        
        if (currentStep % 2 === 0) {
            addPositionMarker(currentTrack);
        }
        
        if (progress >= 1) {
            diskHead.textContent = toTrack;
            highlightTrackMarker(toTrack);
            processQueueItem(toTrack);
            
            setTimeout(() => {
                seekPath.style.opacity = '0';
                setTimeout(() => seekPath.remove(), 500);
            }, 500);
            
            clearInterval(currentAnimation.interval);
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 500);
        }
    }, 50);
    
    return duration;
}

function addPositionMarker(trackPosition) {
    const diskSize = parseInt(diskSizeInput.value);
    const percentPosition = (trackPosition / (diskSize - 1)) * 100;
    
    const marker = document.createElement('div');
    marker.classList.add('position-marker');
    marker.style.left = `${percentPosition}%`;
    diskContainer.appendChild(marker);
    
    marker.addEventListener('animationend', () => marker.remove());
    currentAnimation.markers.push(marker);
}

function cleanupAnimation() {
    clearInterval(currentAnimation.interval);
    currentAnimation.markers.forEach(marker => marker.remove());
    currentAnimation = { interval: null, markers: [] };
}

function highlightTrackMarker(trackPosition) {
    document.querySelectorAll(`.track-marker[data-track="${trackPosition}"]`).forEach(marker => {
        marker.classList.add('pulse');
        setTimeout(() => marker.classList.remove('pulse'), 500);
    });
}

function processQueueItem(trackPosition) {
    document.querySelectorAll(`.queue-item[data-track="${trackPosition}"]`).forEach(item => {
        item.classList.add('process-animation');
        setTimeout(() => item.classList.add('processed'), 800);
    });
}

function resetVisualization() {
    cleanupAnimation();
    isAnimating = false;
    const initialPosition = parseInt(initialPositionInput.value);
    diskHead.style.transition = '';
    positionHead(initialPosition);
    diskHead.textContent = initialPosition;
    renderRequestQueue();
    resetStats();
}

function processAnimationQueue() {
    if (animationQueue.length === 0) {
        isAnimating = false;
        updateStats();
        return;
    }
    
    const nextMove = animationQueue.shift();
    const fromTrack = parseInt(diskHead.textContent);
    const toTrack = nextMove;
    
    animateHeadMovement(fromTrack, toTrack, processAnimationQueue);
}

function updateStats() {
    const operations = parseInt(totalOperationsDisplay.textContent);
    const distance = parseInt(totalDistanceDisplay.textContent);
    
    if (operations > 0) {
        const average = (distance / operations).toFixed(2);
        averageSeekDisplay.textContent = average;
        
        const diskSize = parseInt(diskSizeInput.value);
        const efficiency = ((1 - average / diskSize) * 100).toFixed(2);
        efficiencyDisplay.textContent = `${efficiency}%`;
    }
}


function runFCFS() {
    if (isAnimating) return;
    isAnimating = true;
    
    const requests = parseRequests();
    if (requests.length === 0) {
        isAnimating = false;
        return;
    }
    
    const initialPosition = parseInt(initialPositionInput.value);
    let totalDistance = 0;
    
    animationQueue = [...requests];
    
    totalOperationsDisplay.textContent = requests.length;
    
    let currentPosition = initialPosition;
    for (const req of requests) {
        totalDistance += Math.abs(req - currentPosition);
        currentPosition = req;
    }
    
    totalDistanceDisplay.textContent = totalDistance;
    processAnimationQueue();
}

function runSSTF() {
    if (isAnimating) return;
    isAnimating = true;
    
    const requests = parseRequests();
    if (requests.length === 0) {
        isAnimating = false;
        return;
    }
    
    const initialPosition = parseInt(initialPositionInput.value);
    let totalDistance = 0;
    let currentPosition = initialPosition;
    const unprocessed = [...requests];
    animationQueue = [];
    
    while (unprocessed.length > 0) {
        // Find closest request
        let closestIndex = 0;
        let minDistance = Math.abs(unprocessed[0] - currentPosition);
        
        for (let i = 1; i < unprocessed.length; i++) {
            const distance = Math.abs(unprocessed[i] - currentPosition);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }
        
        const nextRequest = unprocessed[closestIndex];
        animationQueue.push(nextRequest);
        totalDistance += minDistance;
        currentPosition = nextRequest;
        unprocessed.splice(closestIndex, 1);
    }
    
    totalOperationsDisplay.textContent = requests.length;
    totalDistanceDisplay.textContent = totalDistance;
    processAnimationQueue();
}

function runSCAN() {
    if (isAnimating) return;
    isAnimating = true;
    
    const requests = parseRequests();
    if (requests.length === 0) {
        isAnimating = false;
        return;
    }
    
    const diskSize = parseInt(diskSizeInput.value);
    const initialPosition = parseInt(initialPositionInput.value);
    const initialDirection = directionSelect.value;
    
    let totalDistance = 0;
    let currentPosition = initialPosition;
    const sortedRequests = [...requests].sort((a, b) => a - b);
    animationQueue = [];
    
    const lowerRequests = sortedRequests.filter(req => req < initialPosition);
    const higherRequests = sortedRequests.filter(req => req > initialPosition);
    const atPosition = sortedRequests.filter(req => req === initialPosition);
    
    if (initialDirection === 'up') {
        for (const req of higherRequests) {
            animationQueue.push(req);
            totalDistance += Math.abs(req - currentPosition);
            currentPosition = req;
        }
        
        if (lowerRequests.length > 0) {
            animationQueue.push(diskSize - 1);
            totalDistance += Math.abs((diskSize - 1) - currentPosition);
            currentPosition = diskSize - 1;
            
            for (const req of lowerRequests.reverse()) {
                animationQueue.push(req);
                totalDistance += Math.abs(req - currentPosition);
                currentPosition = req;
            }
        }
    } else {
        for (const req of lowerRequests.reverse()) {
            animationQueue.push(req);
            totalDistance += Math.abs(req - currentPosition);
            currentPosition = req;
        }
        
        if (higherRequests.length > 0) {
            animationQueue.push(0);
            totalDistance += Math.abs(0 - currentPosition);
            currentPosition = 0;
            
            for (const req of higherRequests) {
                animationQueue.push(req);
                totalDistance += Math.abs(req - currentPosition);
                currentPosition = req;
            }
        }
    }
    
    if (atPosition.length > 0 && !animationQueue.includes(initialPosition)) {
        animationQueue.unshift(initialPosition);
    }
    
    totalOperationsDisplay.textContent = animationQueue.length;
    totalDistanceDisplay.textContent = totalDistance;
    processAnimationQueue();
}

function runCSCAN() {
    if (isAnimating) return;
    isAnimating = true;
    
    const requests = parseRequests();
    if (requests.length === 0) {
        isAnimating = false;
        return;
    }
    
    const diskSize = parseInt(diskSizeInput.value);
    const initialPosition = parseInt(initialPositionInput.value);
    
    let totalDistance = 0;
    let currentPosition = initialPosition;
    const sortedRequests = [...requests].sort((a, b) => a - b);
    animationQueue = [];
    
    const lowerRequests = sortedRequests.filter(req => req < initialPosition);
    const higherRequests = sortedRequests.filter(req => req > initialPosition);
    const atPosition = sortedRequests.filter(req => req === initialPosition);
    
    for (const req of higherRequests) {
        animationQueue.push(req);
        totalDistance += Math.abs(req - currentPosition);
        currentPosition = req;
    }
    
    if (lowerRequests.length > 0) {
        if (currentPosition !== diskSize - 1) {
            animationQueue.push(diskSize - 1);
            totalDistance += Math.abs((diskSize - 1) - currentPosition);
            currentPosition = diskSize - 1;
        }
        
        totalDistance += diskSize - 1; 
        animationQueue.push(0);
        currentPosition = 0;
        
        for (const req of lowerRequests) {
            animationQueue.push(req);
            totalDistance += Math.abs(req - currentPosition);
            currentPosition = req;
        }
    }
    
    if (atPosition.length > 0 && !animationQueue.includes(initialPosition)) {
        animationQueue.unshift(initialPosition);
    }
    
    totalOperationsDisplay.textContent = animationQueue.length;
    totalDistanceDisplay.textContent = totalDistance;
    processAnimationQueue();
}

function runLOOK() {
    if (isAnimating) return;
    isAnimating = true;
    
    const requests = parseRequests();
    if (requests.length === 0) {
        isAnimating = false;
        return;
    }
    
    const initialPosition = parseInt(initialPositionInput.value);
    const initialDirection = directionSelect.value;
    
    let totalDistance = 0;
    let currentPosition = initialPosition;
    const sortedRequests = [...requests].sort((a, b) => a - b);
    animationQueue = [];
    
    const lowerRequests = sortedRequests.filter(req => req < initialPosition);
    const higherRequests = sortedRequests.filter(req => req > initialPosition);
    const atPosition = sortedRequests.filter(req => req === initialPosition);
    
    if (initialDirection === 'up') {
        for (const req of higherRequests) {
            animationQueue.push(req);
            totalDistance += Math.abs(req - currentPosition);
            currentPosition = req;
        }
        
        for (const req of lowerRequests.reverse()) {
            animationQueue.push(req);
            totalDistance += Math.abs(req - currentPosition);
            currentPosition = req;
        }
    } else {
        for (const req of lowerRequests.reverse()) {
            animationQueue.push(req);
            totalDistance += Math.abs(req - currentPosition);
            currentPosition = req;
        }
        
        for (const req of higherRequests) {
            animationQueue.push(req);
            totalDistance += Math.abs(req - currentPosition);
            currentPosition = req;
        }
    }
    
    if (atPosition.length > 0 && !animationQueue.includes(initialPosition)) {
        animationQueue.unshift(initialPosition);
    }
    
    totalOperationsDisplay.textContent = animationQueue.length;
    totalDistanceDisplay.textContent = totalDistance;
    processAnimationQueue();
}

function runCLOOK() {
    if (isAnimating) return;
    isAnimating = true;
    
    const requests = parseRequests();
    if (requests.length === 0) {
        isAnimating = false;
        return;
    }
    
    const initialPosition = parseInt(initialPositionInput.value);
    
    let totalDistance = 0;
    let currentPosition = initialPosition;
    const sortedRequests = [...requests].sort((a, b) => a - b);
    animationQueue = [];
    
    const lowerRequests = sortedRequests.filter(req => req < initialPosition);
    const higherRequests = sortedRequests.filter(req => req > initialPosition);
    const atPosition = sortedRequests.filter(req => req === initialPosition);
    
    // Process higher requests first
    for (const req of higherRequests) {
        animationQueue.push(req);
        totalDistance += Math.abs(req - currentPosition);
        currentPosition = req;
    }
    
    if (lowerRequests.length > 0) {
        const lowestRequest = lowerRequests[0];
        
        totalDistance += Math.abs(lowestRequest - currentPosition);
        animationQueue.push(lowestRequest);
        currentPosition = lowestRequest;
        
        for (let i = 1; i < lowerRequests.length; i++) {
            const req = lowerRequests[i];
            animationQueue.push(req);
            totalDistance += Math.abs(req - currentPosition);
            currentPosition = req;
        }
    }
    
    if (atPosition.length > 0 && !animationQueue.includes(initialPosition)) {
        animationQueue.unshift(initialPosition);
    }
    
    totalOperationsDisplay.textContent = animationQueue.length;
    totalDistanceDisplay.textContent = totalDistance;
    processAnimationQueue();
}

// Event listeners
runBtn.addEventListener('click', () => {
    if (isAnimating) return;
    resetStats();
    renderRequestQueue();
    const algorithm = algorithmSelect.value;
    const algorithms = {
        'fcfs': runFCFS,
        'sstf': runSSTF,
        'scan': runSCAN,
        'cscan': runCSCAN,
        'look': runLOOK,
        'clook': runCLOOK
    };
    algorithms[algorithm]?.();
});

resetBtn.addEventListener('click', () => {
    animationQueue = [];
    isAnimating = false;
    resetVisualization();
});

randomBtn.addEventListener('click', generateRandomRequests);
clearBtn.addEventListener('click', clearRequests);
addBtn.addEventListener('click', addRequest);
algorithmSelect.addEventListener('change', updateAlgorithmDescription);

diskSizeInput.addEventListener('change', () => {
    const diskSize = parseInt(diskSizeInput.value);
    if (diskSize < 10) diskSizeInput.value = 10;
    if (diskSize > 1000) diskSizeInput.value = 1000;
    updateDiskDisplay();
    const initialPosition = parseInt(initialPositionInput.value);
    if (initialPosition >= diskSize) {
        initialPositionInput.value = diskSize - 1;
        positionHead(diskSize - 1);
    }
    renderRequestQueue();
});

initialPositionInput.addEventListener('change', () => {
    const initialPosition = parseInt(initialPositionInput.value);
    const diskSize = parseInt(diskSizeInput.value);
    if (initialPosition < 0) initialPositionInput.value = 0;
    if (initialPosition >= diskSize) initialPositionInput.value = diskSize - 1;
    positionHead(parseInt(initialPositionInput.value));
    diskHead.textContent = initialPositionInput.value;
});

requestsInput.addEventListener('change', renderRequestQueue);

document.addEventListener('DOMContentLoaded', initialize);