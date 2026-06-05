

// Central state cache memory list register
let tasksCollectionRegistry = [];

function syncToLocalStorage() {
  localStorage.setItem('29tasks_multi_state', JSON.stringify(tasksCollectionRegistry));
}

function fetchFromLocalStorage() {
  const rawCache = localStorage.getItem('29tasks_multi_state');
  if (rawCache) {
    tasksCollectionRegistry = JSON.parse(rawCache);
  }
}

// --- ACTIVE ROUTER RUNTIME INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
  fetchFromLocalStorage();

  // Load clock module immediately into top header banner ribbon components across all frames
  initGlobalClockRibbon();

  // Init Hamburger Sidebar navigation drawer on all pages
  initSidebarNavigationModule();

  // Execute matching sub-modules depending dynamically on viewport layout element presence
  if (document.getElementById('task-feed')) {
    initWorkspacePageModule();
  } else if (document.getElementById('stopwatch-label')) {
    initTimingToolsPageModule();
  } else if (document.getElementById('dial-daily')) {
    initAnalyticsPageModule();
  }
});

// Shared Header Clock Logic

function initGlobalClockRibbon() {
  const liveClockNode = document.getElementById('live-clock');
  if (!liveClockNode) return;

  function runClockTick() {
    const timeObj = new Date();
    let hr = timeObj.getHours();
    const min = String(timeObj.getMinutes()).padStart(2, '0');
    const sec = String(timeObj.getSeconds()).padStart(2, '0');
    const meridiem = hr >= 12 ? 'PM' : 'AM';

    hr = hr % 12;
    if (hr === 0) hr = 12;
    const hrStr = String(hr).padStart(2, '0');
    
    liveClockNode.innerText = `${hrStr}:${min}:${sec} ${meridiem}`;
  }
  setInterval(runClockTick, 1000);
  runClockTick();
}
// Sidebar Slide Drawer Control System
function initSidebarNavigationModule() {
  const menuTriggerBtn = document.querySelector('.icon-menu-btn');
  const sidebarElement = document.getElementById('app-sidebar');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  const overlayMaskElement = document.getElementById('sidebar-overlay');

  if (menuTriggerBtn && sidebarElement && closeSidebarBtn && overlayMaskElement) {
    menuTriggerBtn.addEventListener('click', function() {
      sidebarElement.classList.remove('hidden-sidebar');
      overlayMaskElement.classList.remove('hidden-overlay');
    });

    closeSidebarBtn.addEventListener('click', closeNavigationDrawer);
    overlayMaskElement.addEventListener('click', closeNavigationDrawer);

    function closeNavigationDrawer() {
      sidebarElement.classList.add('hidden-sidebar');
      overlayMaskElement.classList.add('hidden-overlay');
    }
  }
}

// Task List Core Functionality

function initWorkspacePageModule() {
  const taskField = document.getElementById('new-task-field');
  const submitTaskBtn = document.getElementById('submit-task-btn');

  if (!submitTaskBtn || !taskField) return;

  submitTaskBtn.addEventListener('click', addTaskRecord);
  taskField.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTaskRecord(); });

  function addTaskRecord() {
    const inputStr = taskField.value.trim();
    if (inputStr === '') return;

    const currentTimestamp = new Date();

    const taskItem = {
      uid: Date.now(),
      titleText: inputStr,
      outcomeState: 'pending', 
      creationDateStr: currentTimestamp.toISOString(), // Real date tracking string for backend queries
      displayTimeLabel: currentTimestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + " at " + currentTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    tasksCollectionRegistry.push(taskItem);
    taskField.value = '';
    syncToLocalStorage();
    renderTasksWorkspace();
  }

  window.evaluateTaskOutcome = function(taskUid, assignedStatus) {
    tasksCollectionRegistry = tasksCollectionRegistry.map(function(item) {
      if (item.uid === taskUid) {
        item.outcomeState = (item.outcomeState === assignedStatus) ? 'pending' : assignedStatus;
      }
      return item;
    });
    syncToLocalStorage();
    renderTasksWorkspace();
  };

  window.purgeTaskRecord = function(taskUid) {
    tasksCollectionRegistry = tasksCollectionRegistry.filter(item => item.uid !== taskUid);
    syncToLocalStorage();
    renderTasksWorkspace();
  };

  function renderTasksWorkspace() {
    const taskFeed = document.getElementById('task-feed');
    if (!taskFeed) return;
    taskFeed.innerHTML = '';

    tasksCollectionRegistry.forEach(function(item) {
      const liNode = document.createElement('li');
      liNode.className = 'task-item-row';
      
      if (item.outcomeState === 'passed') liNode.classList.add('passed');
      if (item.outcomeState === 'failed') liNode.classList.add('failed');

      liNode.innerHTML = `
        <div class="left-task-block">
          <div class="double-box-group">
            <button class="box-node box-green ${item.outcomeState === 'passed' ? 'selected-pass' : ''}" onclick="evaluateTaskOutcome(${item.uid}, 'passed')">✓</button>
            <button class="box-node box-red ${item.outcomeState === 'failed' ? 'selected-fail' : ''}" onclick="evaluateTaskOutcome(${item.uid}, 'failed')">✕</button>
          </div>
          <div>
            <span class="item-text-node">${item.titleText}</span>
            <span class="task-timestamp">Added ${item.displayTimeLabel}</span>
          </div>
        </div>
        <button class="dismiss-task-btn" onclick="purgeTaskRecord(${item.uid})">Dismiss</button>
      `;
      taskFeed.appendChild(liNode);
    });
  }

  renderTasksWorkspace();
}
// Stopwatch and Timer Event Handlers
function initTimingToolsPageModule() {
  // 1. Asynchronous Stopwatch Counting Thread Logic
  let swLoopId = null;
  let swTicks = 0;
  const swLabel = document.getElementById('stopwatch-label');
  const swStart = document.getElementById('sw-start');
  const swStop = document.getElementById('sw-stop');
  const swReset = document.getElementById('sw-reset');

  if (swStart && swStop && swReset && swLabel) {
    swStart.addEventListener('click', function() {
      swStart.classList.add('hidden');
      swStop.classList.remove('hidden');
      swReset.disabled = true;
      swLoopId = setInterval(() => { swTicks++; updateStopwatchUI(); }, 10);
    });

    swStop.addEventListener('click', function() {
      clearInterval(swLoopId);
      swStop.classList.add('hidden');
      swStart.classList.remove('hidden');
      swReset.disabled = false;
    });

    swReset.addEventListener('click', function() {
      clearInterval(swLoopId);
      swTicks = 0;
      swLabel.innerText = "00:00:00";
      swReset.disabled = true;
    });
  }

  function updateStopwatchUI() {
    if (!swLabel) return;
    const m = String(Math.floor(swTicks / 6000)).padStart(2, '0');
    const s = String(Math.floor((swTicks % 6000) / 100)).padStart(2, '0');
    const cs = String(swTicks % 100).padStart(2, '0');
    swLabel.innerText = `${m}:${s}:${cs}`;
  }

  // 2. High-End Custom Input Countdown Timer Engine
  let tmLoopId = null;
  let tmRemainingSeconds = 600; 
  
  const tmLabel = document.getElementById('countdown-label');
  const tmStart = document.getElementById('tm-start');
  const tmStop = document.getElementById('tm-stop');
  const tmReset = document.getElementById('tm-reset');
  const inputsWrapper = document.getElementById('timer-inputs-wrapper');
  
  const inputMin = document.getElementById('input-minutes');
  const inputSec = document.getElementById('input-seconds');

  if (tmStart && tmStop && tmReset && tmLabel && inputsWrapper && inputMin && inputSec) {
    tmStart.addEventListener('click', function() {
      if (!inputsWrapper.classList.contains('hidden')) {
        const customMin = parseInt(inputMin.value) || 0;
        const customSec = parseInt(inputSec.value) || 0;
        tmRemainingSeconds = (customMin * 60) + customSec;
        
        if (tmRemainingSeconds <= 0) {
          alert("Please assign a custom countdown limit higher than zero!");
          return;
        }
      }

      inputsWrapper.classList.add('hidden');
      tmStart.classList.add('hidden');
      tmStop.classList.remove('hidden');
      updateCountdownUI();

      tmLoopId = setInterval(() => {
        if (tmRemainingSeconds > 0) {
          tmRemainingSeconds--;
          updateCountdownUI();
        } else {
          clearInterval(tmLoopId);
          alert("Timer limit reached!");
          resetCountdownTracker();
        }
      }, 1000);
    });

    tmStop.addEventListener('click', function() {
      clearInterval(tmLoopId);
      tmStop.classList.add('hidden');
      tmStart.classList.remove('hidden');
    });

    tmReset.addEventListener('click', resetCountdownTracker);
  }

  function resetCountdownTracker() {
    if (!tmLabel || !inputsWrapper || !tmStop || !tmStart || !inputMin || !inputSec) return;
    clearInterval(tmLoopId);
    
    const customMin = String(parseInt(inputMin.value) || 0).padStart(2, '0');
    const customSec = String(parseInt(inputSec.value) || 0).padStart(2, '0');
    
    tmLabel.innerText = `${customMin}:${customSec}`;
    inputsWrapper.classList.remove('hidden');
    tmStop.classList.add('hidden');
tmStart.classList.remove('hidden');
  }

  function updateCountdownUI() {
    if (!tmLabel) return;
    const min = String(Math.floor(tmRemainingSeconds / 60)).padStart(2, '0');
    const sec = String(tmRemainingSeconds % 60).padStart(2, '0');
    tmLabel.innerText = `${min}:${sec}`;
  }
}

// Calendar Filtering and Task Analytics
function initAnalyticsPageModule() {
  const datePicker = document.getElementById('analysis-date-picker');
  if (!datePicker) return;

  // Set the calendar dropdown input to default to today's date initially
  const today = new Date();
  const localYear = today.getFullYear();
  const localMonth = String(today.getMonth() + 1).padStart(2, '0');
  const localDay = String(today.getDate()).padStart(2, '0');
  datePicker.value = `${localYear}-${localMonth}-${localDay}`;

  // Bind a change trigger handler to recalculate whenever user selects a new date
  datePicker.addEventListener('change', calculateDateFilteredMetrics);

  function calculateDateFilteredMetrics() {
    const chosenDateString = datePicker.value;
    if (!chosenDateString) return;

    const targetedInstant = new Date(chosenDateString + "T23:59:59"); 
    
    const rawMsPerDay = 24 * 60 * 60 * 1000;
    const rawMsPerWeek = 7 * rawMsPerDay;
    const rawMsPerMonth = 30 * rawMsPerDay;

    let totalDaily = 0, passedDaily = 0;
    let totalWeekly = 0, passedWeekly = 0;
    let totalMonthly = 0, passedMonthly = 0;

    tasksCollectionRegistry.forEach(function(item) {
      const itemDate = new Date(item.creationDateStr || Date.now());
      const relativeTimeDifference = targetedInstant - itemDate;

      if (relativeTimeDifference >= 0) {
        if (relativeTimeDifference <= rawMsPerDay) {
          totalDaily++;
          if (item.outcomeState === 'passed') passedDaily++;
        }
        if (relativeTimeDifference <= rawMsPerWeek) {
          totalWeekly++;
          if (item.outcomeState === 'passed') passedWeekly++;
        }
        if (relativeTimeDifference <= rawMsPerMonth) {
          totalMonthly++;
          if (item.outcomeState === 'passed') passedMonthly++;
        }
      }
    });

    const dailyRatio = totalDaily > 0 ? Math.round((passedDaily / totalDaily) * 100) : 0;
    const weeklyRatio = totalWeekly > 0 ? Math.round((passedWeekly / totalWeekly) * 100) : 0;
    const monthlyRatio = totalMonthly > 0 ? Math.round((passedMonthly / totalMonthly) * 100) : 0;

    const dialDaily = document.getElementById('dial-daily');
    const txtDaily = document.getElementById('txt-daily');
    const dialWeekly = document.getElementById('dial-weekly');
    const txtWeekly = document.getElementById('txt-weekly');
    const dialMonthly = document.getElementById('dial-monthly');
    const txtMonthly = document.getElementById('txt-monthly');

    if (dialDaily && txtDaily && dialWeekly && txtWeekly && dialMonthly && txtMonthly) {
      dialDaily.style.setProperty('--percent', dailyRatio);
      txtDaily.innerText = `${dailyRatio}%`;

      dialWeekly.style.setProperty('--percent', weeklyRatio);
      txtWeekly.innerText = `${weeklyRatio}%`;

      dialMonthly.style.setProperty('--percent', monthlyRatio);
      txtMonthly.innerText = `${monthlyRatio}%`;
    }
  }

  calculateDateFilteredMetrics();
}
