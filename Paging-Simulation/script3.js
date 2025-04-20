let count = 0;
class PagingSimulation {
  constructor() {
    this.currentStep = 0;
    
    this.pageTableEntries = [
      { page: '0000', frame: '10000', content: ['a', 'b', 'c', 'd'] },
      { page: '0100', frame: '11000', content: ['e', 'f', 'g', 'h'] },
      { page: '1000', frame: '0100', content: ['i', 'j', 'k', 'l'] },
      { page: '1100', frame: '1000', content: ['m', 'n', 'o', 'p'] }
    ];

    this.tlbEntries = new Map();
    this.init();
  }

  init() {
    // Initialize controls
    this.nextBtn = document.getElementById('nextBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.statusEl = document.getElementById('status');

    // Initialize page table
    const tableEntries = document.querySelector('.table-entries');
    this.pageTableEntries.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'table-entry';
      div.innerHTML = `
        <span>Page ${entry.page}</span>
        <span>Frame ${entry.frame}</span>
      `;
      tableEntries.appendChild(div);
    });

    // Add search arrow
    const pageTable = document.querySelector('.page-table');
    const searchArrow = document.createElement('div');
    searchArrow.className = 'search-arrow';
    searchArrow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right-icon lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
    pageTable.appendChild(searchArrow);

    // Hide all frame contents initially
    document.querySelectorAll('.frame-content').forEach(frame => {
      frame.style.opacity = '0';
      frame.style.height = '0';
    });

    // Initialize tooltips
    tippy('[data-tippy-content]');

    // Event listeners
    console.log("hey");
    this.nextBtn.addEventListener('click', () =>{
        if(count == 7){
            this.reset();
            count = 0;
        }else{
            this.nextStep();
        }
    });
    this.resetBtn.addEventListener('click', () => this.reset());
  }

  calculatePhysicalAddresses(frame, page) {
    const addresses = [];
    const baseAddr = parseInt(frame, 2);
    for(let i = 0; i < 4; i++) {
      const offset = i;
      const physicalAddr = baseAddr + offset;
      addresses.push(physicalAddr.toString(2).padStart(16, '0'));
    }
    return addresses;
  }

  nextStep() {
    count++;
    console.log(count);
    this.clearHighlights();
    
    const steps = [
      {
        element: '.cpu',
        status: 'CPU generates logical address',
        action: () => this.updateLogicalAddress('1000', '00')
      },
      {
        element: '.logical-address',
        status: 'Address split into page number (1000) and displacement (00)',
        action: null
      },
      {
        element: '.tlb',
        status: 'Checking TLB for page translation',
        action: () => this.checkTLB('1000')
      },
      {
        element: '.page-table',
        status: 'TLB miss - searching page table for Page 1000',
        action: () => this.searchPageTable('1000')
      },
      {
        element: '.page-table',
        status: 'Found mapping: Page 1000 maps to Frame 0100',
        action: () => {
          this.updateTLB('1000', '0100');
          const pageEntry = this.pageTableEntries.find(entry => entry.page === '1000');
          const addresses = this.calculatePhysicalAddresses('0100', '1000');
          this.showPageMapping('0100', addresses, pageEntry.content);
        }
      },
      {
        element: '[data-addr="0100"]',
        status: `Mapping page contents to physical addresses:
                 Base(0100) + 00 = ${parseInt('0100', 2)} (0100)
                 Base(0100) + 01 = ${parseInt('0100', 2) + 1} (0101)
                 Base(0100) + 10 = ${parseInt('0100', 2) + 2} (0110)
                 Base(0100) + 11 = ${parseInt('0100', 2) + 3} (0111)`,
        action: null
      }
    ];

    if (this.currentStep < steps.length) {
      const step = steps[this.currentStep];
      document.querySelector(step.element).classList.add('highlight');
      this.statusEl.textContent = step.status;
      
      if (step.action) {
        step.action();
      }
      
      this.currentStep++;
    } else {
      this.currentStep = 0;
      this.statusEl.textContent = 'Click "Restart" to restart the simulation';
    }
  }

  searchPageTable(page) {
    const searchArrow = document.querySelector('.search-arrow');
    const tableEntries = document.querySelectorAll('.table-entry');
    let targetEntry;

    tableEntries.forEach((entry, index) => {
      if (entry.textContent.includes(`Page ${page}`)) {
        targetEntry = entry;
      }
    });

    if (targetEntry) {
      const targetRect = targetEntry.getBoundingClientRect();
      const tableRect = document.querySelector('.page-table').getBoundingClientRect();
      searchArrow.style.top = `${(targetRect.top - tableRect.top + targetRect.height / 2) - 25}px`;
      searchArrow.classList.add('searching');
    }
  }

  showPageMapping(frame, addresses, content) {
    const frameEl = document.querySelector(`[data-addr="${frame}"]`);
    if (frameEl) {
      const contentEl = frameEl.querySelector('.frame-content');
      contentEl.style.opacity = '1';
      contentEl.style.height = 'auto';
      contentEl.innerHTML = `<div class="address-mapping">
        ${addresses.map((addr, i) => `
          <div class="mapped-address">
            <span class="phys-addr">${addr}</span>
            <span class="content">${content[i]}</span>
          </div>
        `).join('')}
      </div>`;
    }
  }

  updateLogicalAddress(page, displacement) {
    const pageNum = document.querySelector('.page-num');
    const disp = document.querySelector('.displacement');
    pageNum.textContent = page;
    disp.textContent = displacement;
  }

  checkTLB(page) {
    const tlbHitArrow = document.querySelector('.tlb-hit-arrow');
    const tlbMissArrow = document.querySelector('.tlb-miss-arrow');
    
    if (this.tlbEntries.has(page)) {
      tlbHitArrow.classList.add('active');
      tlbMissArrow.classList.remove('active');
    } else {
      tlbHitArrow.classList.remove('active');
      tlbMissArrow.classList.add('active');
    }
  }

  updateTLB(page, frame) {
    this.tlbEntries.set(page, frame);
    const tlbEntries = document.querySelector('.tlb-entries');
    const entry = document.createElement('div');
    entry.className = 'tlb-entry';
    entry.innerHTML = `
      <span>${page}</span>
      <span>${frame}</span>
    `;
    tlbEntries.appendChild(entry);
  }

  reset() {
    this.currentStep = 0;
    this.tlbEntries.clear();
    this.clearHighlights();
    this.statusEl.textContent = 'Click "Next Step" to begin the simulation';
    
    // Reset TLB display
    const tlbEntries = document.querySelector('.tlb-entries');
    tlbEntries.innerHTML = `
      <div class="tlb-entry">
        <span>Page</span>
        <span>Frame</span>
      </div>
    `;
    
    // Reset logical address
    this.updateLogicalAddress('p', 'd');
    
    // Reset arrows
    document.querySelector('.tlb-hit-arrow')?.classList.remove('active');
    document.querySelector('.tlb-miss-arrow')?.classList.remove('active');
    document.querySelector('.search-arrow')?.classList.remove('searching');

    // Hide all frame contents
    document.querySelectorAll('.frame-content').forEach(frame => {
      frame.style.opacity = '0';
      frame.style.height = '0';
    });
  }

  clearHighlights() {
    document.querySelectorAll('.active, .highlight').forEach(el => {
      el.classList.remove('active', 'highlight');
    });
  }
}

// Initialize the simulation
new PagingSimulation();

lucide.createIcons();


// Initialize tippy tooltips on elements with the data-tippy-content attribute
document.addEventListener('DOMContentLoaded', () => {
    tippy('[data-tippy-content]');
  });
