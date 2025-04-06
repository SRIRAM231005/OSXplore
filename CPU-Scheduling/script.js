document.addEventListener("DOMContentLoaded", function () {
    const algorithmSelect = document.getElementById("algorithm");
    const tableBody = document.getElementById("processTableBody");
    const startBtn = document.getElementById("startBtn");
    const resultArea = document.getElementById("resultArea");
  
    let processes = [];
    let quantum = 2; // Default time quantum for Round Robin
  
    document.getElementById("addProcess").addEventListener("click", function () {
      const arrival = parseInt(document.getElementById("arrivalTime").value);
      const burst = parseInt(document.getElementById("burstTime").value);
      const priority = parseInt(document.getElementById("priority").value) || 0;
  
      if (isNaN(arrival) || isNaN(burst)) {
        alert("Please enter valid numbers");
        return;
      }
  
      const id = processes.length + 1;
      processes.push({
        id,
        arrival,
        burst,
        remaining: burst,
        priority,
      });
  
      tableBody.innerHTML += `
        <tr>
          <td>P${id}</td>
          <td>${arrival}</td>
          <td>${burst}</td>
          <td>${priority}</td>
        </tr>
      `;
    });
  
    startBtn.addEventListener("click", function () {
      const algorithm = algorithmSelect.value;
      if (algorithm === "fcfs") {
        simulateFCFS();
      } else if (algorithm === "sjf") {
        simulateSJFPreemptive();
      } else if (algorithm === "rr") {
        simulateRoundRobin();
      } else if (algorithm === "priority") {
        simulatePriority();
      }
    });
  
    function simulateFCFS() {
      const sorted = [...processes].sort((a, b) => a.arrival - b.arrival);
      let time = 0;
      let totalWT = 0, totalTAT = 0;
      const schedule = [];
      let result = `<h3>FCFS Simulation</h3><table>
        <tr><th>Process</th><th>AT</th><th>BT</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
  
      for (let p of sorted) {
        if (time < p.arrival) time = p.arrival;
        const start = time;
        time += p.burst;
        const tat = time - p.arrival;
        const wt = tat - p.burst;
  
        totalWT += wt;
        totalTAT += tat;
  
        result += `<tr>
          <td>P${p.id}</td>
          <td>${p.arrival}</td>
          <td>${p.burst}</td>
          <td>${time}</td>
          <td>${tat}</td>
          <td>${wt}</td>
        </tr>`;
  
        schedule.push({ pid: `P${p.id}`, start, end: time });
      }
  
      result += `</table>
        <p><strong>Average Waiting Time:</strong> ${(totalWT / processes.length).toFixed(2)}</p>
        <p><strong>Average Turnaround Time:</strong> ${(totalTAT / processes.length).toFixed(2)}</p>`;
      resultArea.innerHTML = result;
      displayGanttChart(schedule);
    }
  
    function simulateSJFPreemptive() {
      const n = processes.length;
      let time = 0, completed = 0;
      const remaining = processes.map(p => p.burst);
      const waitingTime = Array(n).fill(0);
      const turnAroundTime = Array(n).fill(0);
      const startTimes = Array(n).fill(null);
      const timeline = [];
  
      while (completed < n) {
        let idx = -1;
        let minRem = Infinity;
  
        for (let i = 0; i < n; i++) {
          if (processes[i].arrival <= time && remaining[i] > 0 && remaining[i] < minRem) {
            minRem = remaining[i];
            idx = i;
          }
        }
  
        if (idx === -1) {
          time++;
          continue;
        }
  
        if (startTimes[idx] === null) startTimes[idx] = time;
        remaining[idx]--;
        timeline.push(`P${processes[idx].id}`);
        time++;
  
        if (remaining[idx] === 0) {
          completed++;
          turnAroundTime[idx] = time - processes[idx].arrival;
          waitingTime[idx] = turnAroundTime[idx] - processes[idx].burst;
        }
      }
  
      let result = `<h3>Preemptive SJF Simulation</h3><table>
        <tr><th>Process</th><th>AT</th><th>BT</th><th>ST</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
      let avgWT = 0, avgTAT = 0;
  
      for (let i = 0; i < n; i++) {
        const ct = startTimes[i] + processes[i].burst + waitingTime[i];
        avgWT += waitingTime[i];
        avgTAT += turnAroundTime[i];
  
        result += `<tr>
          <td>P${processes[i].id}</td>
          <td>${processes[i].arrival}</td>
          <td>${processes[i].burst}</td>
          <td>${startTimes[i]}</td>
          <td>${ct}</td>
          <td>${turnAroundTime[i]}</td>
          <td>${waitingTime[i]}</td>
        </tr>`;
      }
  
      result += `</table><p><strong>Average Waiting Time:</strong> ${(avgWT / n).toFixed(2)}</p>
        <p><strong>Average Turnaround Time:</strong> ${(avgTAT / n).toFixed(2)}</p>`;
  
      // Compress timeline to Gantt format
      let schedule = [];
      let current = timeline[0], start = 0;
      for (let i = 1; i <= timeline.length; i++) {
        if (timeline[i] !== current) {
          schedule.push({ pid: current, start, end: i });
          current = timeline[i];
          start = i;
        }
      }
  
      resultArea.innerHTML = result;
      displayGanttChart(schedule);
    }
  
    function simulateRoundRobin() {
      const queue = [];
      const schedule = [];
      const remaining = processes.map(p => p.burst);
      const arrivalMap = new Map(processes.map(p => [p.id, p.arrival]));
      const n = processes.length;
  
      let time = 0, completed = 0;
      const visited = Array(n).fill(false);
      let result = `<h3>Round Robin (q=${quantum})</h3><table>
        <tr><th>Process</th><th>AT</th><th>BT</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
      const completion = Array(n).fill(0);
  
      while (completed < n) {
        for (let i = 0; i < n; i++) {
          if (!visited[i] && processes[i].arrival <= time) {
            queue.push(i);
            visited[i] = true;
          }
        }
  
        if (queue.length === 0) {
          time++;
          continue;
        }
  
        const idx = queue.shift();
        const start = time;
        const execTime = Math.min(quantum, remaining[idx]);
        remaining[idx] -= execTime;
        time += execTime;
        schedule.push({ pid: `P${processes[idx].id}`, start, end: time });
  
        for (let i = 0; i < n; i++) {
          if (!visited[i] && processes[i].arrival <= time) {
            queue.push(i);
            visited[i] = true;
          }
        }
  
        if (remaining[idx] > 0) {
          queue.push(idx);
        } else {
          completed++;
          completion[idx] = time;
        }
      }
  
      let avgWT = 0, avgTAT = 0;
      for (let i = 0; i < n; i++) {
        const tat = completion[i] - processes[i].arrival;
        const wt = tat - processes[i].burst;
        avgWT += wt;
        avgTAT += tat;
  
        result += `<tr>
          <td>P${processes[i].id}</td>
          <td>${processes[i].arrival}</td>
          <td>${processes[i].burst}</td>
          <td>${completion[i]}</td>
          <td>${tat}</td>
          <td>${wt}</td>
        </tr>`;
      }
  
      result += `</table><p><strong>Average Waiting Time:</strong> ${(avgWT / n).toFixed(2)}</p>
        <p><strong>Average Turnaround Time:</strong> ${(avgTAT / n).toFixed(2)}</p>`;
      resultArea.innerHTML = result;
      displayGanttChart(schedule);
    }
  
    function simulatePriority() {
      const sorted = [...processes].sort((a, b) => {
        if (a.arrival === b.arrival) return a.priority - b.priority;
        return a.arrival - b.arrival;
      });
  
      let time = 0, totalWT = 0, totalTAT = 0;
      const schedule = [];
      const completed = [];
      let result = `<h3>Priority Scheduling</h3><table>
        <tr><th>Process</th><th>AT</th><th>BT</th><th>Priority</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
  
      while (completed.length < processes.length) {
        const available = sorted.filter(p => p.arrival <= time && !completed.includes(p.id));
        if (available.length === 0) {
          time++;
          continue;
        }
  
        available.sort((a, b) => a.priority - b.priority);
        const current = available[0];
        const start = time;
        time += current.burst;
        const tat = time - current.arrival;
        const wt = tat - current.burst;
  
        totalWT += wt;
        totalTAT += tat;
        completed.push(current.id);
  
        result += `<tr>
          <td>P${current.id}</td>
          <td>${current.arrival}</td>
          <td>${current.burst}</td>
          <td>${current.priority}</td>
          <td>${time}</td>
          <td>${tat}</td>
          <td>${wt}</td>
        </tr>`;
  
        schedule.push({ pid: `P${current.id}`, start, end: time });
      }
  
      result += `</table><p><strong>Average Waiting Time:</strong> ${(totalWT / processes.length).toFixed(2)}</p>
        <p><strong>Average Turnaround Time:</strong> ${(totalTAT / processes.length).toFixed(2)}</p>`;
      resultArea.innerHTML = result;
      displayGanttChart(schedule);
    }
  });
  
  function displayGanttChart(schedule) {
    const ganttChart = document.getElementById("gantt-chart");
    ganttChart.innerHTML = "";
  
    schedule.forEach((entry) => {
      const container = document.createElement("div");
      container.classList.add("gantt-container");
  
      const block = document.createElement("div");
      block.classList.add("gantt-block");
      block.style.backgroundColor = getColor(entry.pid);
      block.innerText = entry.pid;
  
      const time = document.createElement("div");
      time.classList.add("gantt-time");
      time.innerText = entry.start;
  
      container.appendChild(block);
      container.appendChild(time);
      ganttChart.appendChild(container);
    });
  
    if (schedule.length > 0) {
      const last = schedule[schedule.length - 1];
      const finalTime = document.createElement("div");
      finalTime.classList.add("gantt-time");
      finalTime.innerText = last.end;
      ganttChart.appendChild(finalTime);
    }
  }
  
  function getColor(pid) {
    const colors = {
      P1: "#ff7675",
      P2: "#74b9ff",
      P3: "#55efc4",
      P4: "#ffeaa7",
      P5: "#a29bfe",
    };
    return colors[pid] || "#81ecec";
  }
  