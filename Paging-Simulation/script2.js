class PagingSimulation {
    constructor() {
      this.currentStep = 0;
      
      this.pageTableEntries = [
        { page: '0000', frame: '10000' },
        { page: '0100', frame: '11000' },
        { page: '1000', frame: '0100' },
        { page: '1100', frame: '1000' }
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
  
      // Initialize tooltips
      tippy('[data-tippy-content]');
  
      // Event listeners
      this.nextBtn.addEventListener('click', () => this.nextStep());
      this.resetBtn.addEventListener('click', () => this.reset());
    }
  
    nextStep() {
      this.clearHighlights();
      
      const steps = [
        {
          element: '.cpu',
          status: 'CPU generates logical address',
          action: () => this.updateLogicalAddress('1000', '123')
        },
        {
          element: '.logical-address',
          status: 'Address split into page number (1000) and displacement (123)',
          action: null
        },
        {
          element: '.tlb',
          status: 'Checking TLB for page translation',
          action: () => this.checkTLB('1000')
        },
        {
          element: '.page-table',
          status: 'TLB miss - checking page table: Page 1000 maps to Frame 0100',
          action: () => this.updateTLB('1000', '0100')
        },
        {
          element: '[data-addr="0100"]',
          status: 'Accessing physical memory at Frame 0100 + displacement',
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
        this.statusEl.textContent = 'Click "Next Step" to restart the simulation';
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
    }
  
    clearHighlights() {
      document.querySelectorAll('.active, .highlight').forEach(el => {
        el.classList.remove('active', 'highlight');
      });
    }
  }
  
  // Initialize the simulation
  new PagingSimulation();
  
  
  // Initialize tippy tooltips on elements with the data-tippy-content attribute
  document.addEventListener('DOMContentLoaded', () => {
    tippy('[data-tippy-content]');
  });
  