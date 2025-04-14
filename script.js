const topicToURLMap = {
  "CPU Scheduling": "CPU-Scheduling/index.html",
  "MFT-MVT": "MFT-MVT/index.html",
  "RTOS": "RTOS/index.html",
  "System Calls": "SystemCalls/index.html",
  "Process Synchronization": "Process-Synchronization/opening_page.html",
  "Frame Allocation": "Frame_Allocation/frame1.html",
  "File Allocation": "File_Allocation/fileinfo.html",
  "Memory Allocation Techniques": "Memory Management Algorithms/conti.html",
  "Paging Simulation": "Paging-Simulation/paging.html",
  "Deadlock Avoidance and Prevention": "Deadlock Avoidance and Prevention/index.html",
  "Page Replacement Algorithms": "page-replacement/index.html",
  "Disk Scheduling Techniques": "Disk-Scheduling/DiskScheduling.html",
  "File Organization Techniques": "File-Organization/index.html",
  "Process Communication (IPC)": "IPC/index.html"
};

function navigateToPage(url) {
  window.location.href = url;
}

function scrollToFeatures() {
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-scroll]').forEach((el) => observer.observe(el));
  
  const topicDivs = document.querySelectorAll('.topic');
  
  topicDivs.forEach(topic => {
    const topicText = topic.textContent.trim();
    const url = topicToURLMap[topicText];
    
    if (url) {
      const button = document.createElement('a');
      button.href = url;
      button.className = 'topic-button';
      button.textContent = topicText;
      
     
      topic.parentNode.replaceChild(button, topic);
    }
  });
});

const background = document.querySelector('.backgroundBoxes');
let X = 0, Y = 0; 
let x = 0, y = 0; 

document.addEventListener('mousemove', (event) => {
  x = event.clientX;
  y = event.clientY;
});

function updatePosition() {
  X += (x - X) * 0.1;
  Y += (y - Y) * 0.1;

  const maskStyle = `radial-gradient(circle 150px at ${X}px ${Y}px, 
                   rgba(0, 0, 0, 1) 40%, 
                   rgba(0, 0, 0, 0.6) 60%, 
                   rgba(0, 0, 0, 0) 80%)`;

  background.style.maskImage = maskStyle;
  background.style.webkitMaskImage = maskStyle;

  requestAnimationFrame(updatePosition);
}

updatePosition();
