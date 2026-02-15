// GLOBAL STATE
let currentFilter = 'all';
let tasks = [];
let autoSaveTimer;

// TAB ORDER AND SWIPE SUPPORT
const tabOrder = ['dashboard', 'tasks', 'notes', 'habits', 'mood', 'letter', 'timer', 'garden', 'reflection'];
let touchStartX = 0;
let touchEndX = 0;

// ============= INITIALIZATION =============
window.onload = function () {
  loadTasks();
  loadDailyNote();
  renderHabits();
  populateNotesHistory();
  updateProgress();
  initDashboard();
  initMoodTracker();
  initTabSwipeSupport();
  initBloomTeddy();
  renderLetters();
  checkAndShowUnlockedLettersOnOpen();
};

// ============= TAB SWIPE AND SCROLL SUPPORT =============
function initTabSwipeSupport() {
  const container = document.querySelector('.container');

  // Touch swipe support for pages
  if (container) {
    container.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, false);

    container.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleTabSwipe();
    }, false);
  }

  // Keyboard arrow support
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      navigateToAdjacentTab('left');
    } else if (e.key === 'ArrowRight') {
      navigateToAdjacentTab('right');
    }
  });
}

function handleTabSwipe() {
  const swipeThreshold = 50;
  const difference = touchStartX - touchEndX;

  if (Math.abs(difference) > swipeThreshold) {
    if (difference > 0) {
      navigateToAdjacentTab('right');
    } else {
      navigateToAdjacentTab('left');
    }
  }
}

function navigateToAdjacentTab(direction) {
  const currentActive = document.querySelector('.tab-btn.active');
  if (!currentActive) return;

  const currentTabName = currentActive.getAttribute('data-tab');
  const currentIndex = tabOrder.indexOf(currentTabName);

  let nextIndex;
  if (direction === 'right' && currentIndex < tabOrder.length - 1) {
    nextIndex = currentIndex + 1;
  } else if (direction === 'left' && currentIndex > 0) {
    nextIndex = currentIndex - 1;
  } else {
    return;
  }

  const nextTabName = tabOrder[nextIndex];
  showTab(nextTabName);

  // Use setTimeout to ensure DOM is updated before scrolling
  setTimeout(() => {
    scrollTabIntoView(nextTabName);
  }, 50);
}

function scrollTabIntoView(tabName) {
  const container = document.getElementById('tabsContainer');
  const tabButton = container.querySelector(`[data-tab="${tabName}"]`);

  if (!tabButton || !container) return;

  // Get container and button dimensions
  const containerWidth = container.clientWidth;
  const containerScrollWidth = container.scrollWidth;
  const buttonWidth = tabButton.offsetWidth;
  const buttonLeft = tabButton.offsetLeft;

  // Calculate position to center the tab in the 3rd position (center of view)
  // The center position is containerWidth / 2
  // We want the tab to be at that center position
  const centerPosition = containerWidth / 2;
  const scrollTarget = buttonLeft - centerPosition + (buttonWidth / 2);

  // Clamp scroll position to valid range
  const minScroll = 0;
  const maxScroll = containerScrollWidth - containerWidth;
  const finalScroll = Math.max(minScroll, Math.min(maxScroll, scrollTarget));

  // Smooth scroll to the calculated position
  container.scrollTo({
    left: finalScroll,
    behavior: 'smooth'
  });
}

// ============= TAB SWITCHING =============
function showTab(tabName) {
  // Hide all tab contents
  const allTabs = document.querySelectorAll('.tab-content');
  allTabs.forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });

  // Remove active class from all buttons
  const allButtons = document.querySelectorAll('.tab-btn');
  allButtons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}Tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
    selectedTab.style.display = 'block';
  }

  // Activate selected button
  const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  }

  // Special handling for specific tabs
  if (tabName === 'garden') {
    initGarden();
  } else if (tabName === 'reflection') {
    renderReflections();
  }
}

// ============= DASHBOARD FUNCTIONS =============
function initDashboard() {
  updateGreeting();
  displayAffirmation();
  updateDashboardStats();
  displayDailyPrompt();
  displayDailyQuote();
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good morning, Sunshine ☀️';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon, Starlight 🌟';
  } else if (hour >= 17) {
    greeting = 'Good evening, Moonlight 🌙';
  }

  const greetingElement = document.getElementById('greetingText');
  if (greetingElement) {
    greetingElement.textContent = greeting;
  }
}

function updateDashboardStats() {
  const taskCount = tasks.filter(t => !t.completed).length;
  document.getElementById('taskCount').textContent = taskCount;

  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  const today = new Date().toISOString().split('T')[0];
  let maxStreak = 0;

  habits.forEach(habit => {
    const streak = calculateStreak(habit.completedDates);
    if (streak > maxStreak) maxStreak = streak;
  });

  document.getElementById('streakCount').textContent = maxStreak;
}

const dailyPrompts = [
  'Today, what made you smile?',
  'What are you grateful for today?',
  'What small joy will you create?',
  'How will you be kind today?',
  'What challenge will you overcome?',
  'What made you feel proud?',
  'Who did you help today?'
];

function displayDailyPrompt() {
  const day = new Date().getDate();
  const prompt = dailyPrompts[day % dailyPrompts.length];
  const promptElement = document.getElementById('dailyPrompt');
  if (promptElement) {
    promptElement.textContent = prompt;
  }
}

const dailyQuotes = [
  'You are stronger than you think.',
  'Every day is a fresh start.',
  'Your kindness matters.',
  'You deserve to be happy.',
  'Progress over perfection.',
  'You are doing great.',
  'Bloom at your own pace.',
  'Be gentle with yourself.'
];

const affirmations = [
  'You\'re doing better than you think 💕',
  'Small steps are still progress 🌱',
  'Today is soft and kind to you ✨',
  'You are enough, just as you are 💖',
  'Your efforts matter 🌸',
  'Be kind to yourself today 💗',
  'You\'ve got this 🌟',
  'Every moment is a fresh start 🍃'
];

function displayDailyQuote() {
  const day = new Date().getDate();
  const quote = dailyQuotes[day % dailyQuotes.length];
  const quoteElement = document.getElementById('dailyQuote');
  if (quoteElement) {
    quoteElement.textContent = quote;
  }
}

function displayAffirmation() {
  const day = new Date().getDate();
  const affirmation = affirmations[day % affirmations.length];
  const affirmationElement = document.getElementById('affirmationText');
  if (affirmationElement) {
    affirmationElement.textContent = affirmation;
  }
}

// ============= TAB NAVIGATION =============
function showTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  const selectedTab = document.getElementById(tabName + 'Tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Mark the corresponding button as active
  const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }

  // Load fresh data for that tab
  if (tabName === 'notes') {
    loadTodayNote();
  } else if (tabName === 'habits') {
    renderHabits();
  } else if (tabName === 'dashboard') {
    initDashboard();
  } else if (tabName === 'mood') {
    loadTodayMood();
  } else if (tabName === 'letter') {
    renderLetters();
  } else if (tabName === 'garden') {
    initGarden();
  } else if (tabName === 'reflection') {
    renderReflections();
  } else if (tabName === 'timer') {
    updateTimerDisplay();
  }

  // Scroll the tab button to center position (3rd position in view)
  setTimeout(() => {
    scrollTabIntoView(tabName);
  }, 50);
}

// ============= TASKS FUNCTIONS =============
function openTaskDatePicker() {
  const taskDate = document.getElementById('taskDate');
  if (!taskDate) return;
  try {
    if (typeof taskDate.showPicker === 'function') {
      taskDate.showPicker();
    } else {
      taskDate.focus();
      taskDate.click();
    }
  } catch (e) {
    taskDate.click();
  }
}

function addTask() {
  const input = document.getElementById('taskInput');
  const priority = document.getElementById('taskPriority').value;
  const date = document.getElementById('taskDate').value;
  const category = document.getElementById('taskCategory').value;
  const taskText = input.value.trim();

  if (taskText === '') return;

  const task = {
    id: Date.now(),
    text: taskText,
    completed: false,
    priority: priority,
    dueDate: date || new Date().toISOString().split('T')[0],
    category: category,
    createdDate: new Date().toISOString().split('T')[0]
  };

  tasks.push(task);
  updateStorage();
  renderTasks();
  updateProgress();

  input.value = '';
  document.getElementById('taskDate').value = '';

  // Play sound
  playCompleteSound();
}

function handleKey(event) {
  if (event.key === 'Enter') {
    addTask();
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  updateStorage();
  renderTasks();
  updateProgress();
}

function toggleComplete(checkbox) {
  const taskId = parseInt(checkbox.dataset.taskId);
  const task = tasks.find(t => t.id === taskId);

  if (task) {
    task.completed = checkbox.checked;
    updateStorage();
    renderTasks();
    updateProgress();

    if (checkbox.checked) {
      playCompleteSound();
      showCelebration();
      showReminder('Task completed! Great job! 💕');
      triggerTeddyReaction('TASK_COMPLETE', 'Well done! 🌟');
      refreshGardenAfterCheckIn();
    }
  }
}


function renderTasks() {
  const list = document.getElementById('taskList');
  const emptyMsg = document.getElementById('emptyMessage');
  list.innerHTML = '';

  let filteredTasks = tasks;

  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  if (filteredTasks.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'new-task';

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.dueDate < today && !task.completed;

    if (isOverdue) {
      li.classList.add('overdue');
    }

    const priorityColor = task.priority === 'low' ? 'low' : task.priority === 'medium' ? 'medium' : 'high';

    li.innerHTML = `
      <div class="task">
        <label style="display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;">
          <input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" onchange="toggleComplete(this)">
          <span class="checkmark"></span>
          <div style="text-align: left; flex: 1;">
            <span class="task-text" style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(task.text)}</span>
            <div class="task-date">${formatDate(task.dueDate)} ${isOverdue ? '⚠️' : ''}</div>
            <div class="task-category ${task.category}">${task.category}</div>
          </div>
        </label>
        <span class="priority-dot ${priorityColor}"></span>
      </div>
      <button class="delete" onclick="deleteTask(${task.id})">Delete</button>
    `;

    list.appendChild(li);
  });

  updateTaskCounter();
}

function filterTasks(filter) {
  currentFilter = filter;
  renderTasks();

  // Update button states
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function clearAll() {
  if (confirm('Delete all tasks?')) {
    tasks = [];
    updateStorage();
    renderTasks();
    updateProgress();
  }
}

function updateProgress() {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('progressFill').style.width = percentage + '%';
  document.getElementById('progressText').textContent = completed + '/' + total + ' tasks done';
}

function updateTaskCounter() {
  const counter = document.getElementById('taskCounter');
  if (tasks.length === 0) {
    counter.textContent = '';
  } else {
    const completed = tasks.filter(t => t.completed).length;
    counter.textContent = 'Total: ' + tasks.length + ' | Completed: ' + completed;
  }
}

function updateStorage() {
  localStorage.setItem('bloomBoardTasks', JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem('bloomBoardTasks');
  tasks = saved ? JSON.parse(saved) : [];
  renderTasks();
  updateProgress();
}

// ============= NOTES FUNCTIONS =============
function getTodayKey() {
  return 'note_' + new Date().toISOString().split('T')[0];
}

function loadDailyNote() {
  const textarea = document.getElementById('dailyNote');
  const saved = localStorage.getItem(getTodayKey());

  if (saved) {
    textarea.value = saved;
  } else {
    textarea.value = '';
  }

  document.getElementById('notesDate').textContent = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function loadTodayNote() {
  const today = new Date().toISOString().split("T")[0];

  document.getElementById("notesDate").textContent =
    new Date().toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  let notes = JSON.parse(localStorage.getItem("notesHistory")) || {};
  document.getElementById("dailyNote").value = notes[today] || "";

  // Update the select dropdown to show today's option
  const select = document.getElementById("notesHistorySelect");
  select.value = "";
}

function autoSaveNote() {
  clearTimeout(autoSaveTimer);

  autoSaveTimer = setTimeout(function () {
    saveDailyNote();
  }, 1000);
}

function saveDailyNote() {
  const textarea = document.getElementById('dailyNote');
  const today = new Date().toISOString().split('T')[0];

  // Save to today's note
  localStorage.setItem(getTodayKey(), textarea.value);

  // Save to history
  let notes = JSON.parse(localStorage.getItem('notesHistory')) || {};
  notes[today] = textarea.value;
  localStorage.setItem('notesHistory', JSON.stringify(notes));

  document.getElementById('notesStatus').textContent = 'Saved ✓';

  triggerTeddyReaction('NOTE_SAVED');
  refreshGardenAfterCheckIn();
  populateNotesHistory();
}

function populateNotesHistory() {
  const select = document.getElementById('notesHistorySelect');
  let notes = JSON.parse(localStorage.getItem('notesHistory')) || {};

  const dates = Object.keys(notes).sort().reverse();

  // Keep the first default option
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Add "Today" option
  const todayOption = document.createElement('option');
  todayOption.value = 'today';
  todayOption.textContent = 'Today';
  select.appendChild(todayOption);

  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    select.appendChild(option);
  });

  // Add event listener to handle selection
  select.addEventListener('change', handleNotesDropdown);
}

function handleNotesDropdown(event) {
  const selectedValue = event.target.value;

  if (selectedValue === '') {
    // Reset to default
    loadTodayNote();
  } else if (selectedValue === 'today') {
    // Load today's note
    loadTodayNote();
  } else {
    // Load selected date's note
    let notes = JSON.parse(localStorage.getItem('notesHistory')) || {};
    document.getElementById('dailyNote').value = notes[selectedValue] || '';
    document.getElementById('notesDate').textContent = selectedValue;
  }
}

// Event listener for notes
document.addEventListener('DOMContentLoaded', function () {
  const dailyNote = document.getElementById('dailyNote');
  if (dailyNote) {
    dailyNote.addEventListener('input', autoSaveNote);
  }

  const notesHistorySelect = document.getElementById('notesHistorySelect');
  if (notesHistorySelect) {
    notesHistorySelect.addEventListener('change', function () {
      const key = this.value;
      if (!key) return;

      let notes = JSON.parse(localStorage.getItem('notesHistory')) || {};
      document.getElementById('dailyNote').value = notes[key] || '';
      document.getElementById('notesStatus').textContent = 'Loaded from history 💗';
    });
  }
});

// ============= HABITS FUNCTIONS =============
function getTodayHabitsKey() {
  return 'habits_' + new Date().toISOString().split('T')[0];
}

function addHabit() {
  const input = document.getElementById('habitInput');
  const habitName = input.value.trim();

  if (habitName === '') return;

  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];

  const habit = {
    id: Date.now(),
    name: habitName,
    createdDate: new Date().toISOString().split('T')[0],
    completedDates: []
  };

  habits.push(habit);
  localStorage.setItem('allHabits', JSON.stringify(habits));

  input.value = '';
  renderHabits();
}

function renderHabits() {
  const list = document.getElementById('habitList');
  const emptyMsg = document.getElementById('emptyHabits');
  list.innerHTML = '';

  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  const today = new Date().toISOString().split('T')[0];

  if (habits.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  habits.forEach(habit => {
    const isCompletedToday = habit.completedDates.includes(today);
    const streak = calculateStreak(habit.completedDates);

    const li = document.createElement('li');
    li.className = isCompletedToday ? 'habit-done' : '';
    li.innerHTML = `
      <div class="habit-info">
        <span class="habit-name">${escapeHtml(habit.name)}</span>
        <span class="habit-streak">🔥 ${streak} day streak</span>
      </div>
      <div class="habit-actions">
        <button class="habit-check" onclick="toggleHabitComplete(${habit.id})">
          ${isCompletedToday ? '✓ Done' : 'Check In'}
        </button>
        <button class="habit-delete" onclick="deleteHabit(${habit.id})">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function toggleHabitComplete(habitId) {
  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  const today = new Date().toISOString().split('T')[0];

  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;

  const index = habit.completedDates.indexOf(today);
  if (index > -1) {
    habit.completedDates.splice(index, 1);
  } else {
    habit.completedDates.push(today);
  }

  localStorage.setItem('allHabits', JSON.stringify(habits));
  renderHabits();
  showReminder('Habit checked! Keep it up! 🔥');
  triggerTeddyReaction('TASK_COMPLETE');
  refreshGardenAfterCheckIn();
}

function deleteHabit(habitId) {
  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  habits = habits.filter(h => h.id !== habitId);
  localStorage.setItem('allHabits', JSON.stringify(habits));
  renderHabits();
}

function calculateStreak(completedDates) {
  if (completedDates.length === 0) return 0;

  const sortedDates = completedDates.sort().reverse();
  const today = new Date();
  let streak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (date.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ============= UTILITY FUNCTIONS =============
function playCompleteSound() {
  const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
  audio.volume = 0.3;
  audio.play().catch(e => console.log('Audio play blocked:', e));
}

function showCelebration() {
  const overlay = document.getElementById('celebrationOverlay');
  overlay.style.display = 'block';

  setTimeout(() => {
    overlay.style.display = 'none';
  }, 3000);
}

function showReminder(message) {
  const popup = document.getElementById('reminderPopup');
  document.getElementById('reminderText').textContent = message;

  popup.classList.add('show');

  setTimeout(() => {
    popup.classList.remove('show');
  }, 2500);
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============= MOOD TRACKER FUNCTIONS =============
const moodEmojis = ['😢', '😕', '😐', '🙂', '😄'];
const moodLabels = ['Sad', 'Unhappy', 'Neutral', 'Happy', 'Very Happy'];

function initMoodTracker() {
  const moodSlider = document.getElementById('moodSlider');
  if (moodSlider) {
    moodSlider.addEventListener('input', updateMoodEmoji);
    loadTodayMood();
  }
}

function updateMoodEmoji() {
  const slider = document.getElementById('moodSlider');
  const emojiElement = document.getElementById('moodEmoji');
  const value = parseInt(slider.value);

  if (emojiElement) {
    emojiElement.textContent = moodEmojis[value - 1];
  }
}

function saveMood() {
  const slider = document.getElementById('moodSlider');
  const value = parseInt(slider.value);
  const today = new Date().toISOString().split('T')[0];

  let moods = JSON.parse(localStorage.getItem('moodTracker')) || {};
  moods[today] = value;
  localStorage.setItem('moodTracker', JSON.stringify(moods));

  showReminder(`Mood saved: ${moodLabels[value - 1]} 💕`);

  // Apply mood glow to container
  const container = document.querySelector('.container');
  container.classList.remove('mood-glow-happy', 'mood-glow-calm', 'mood-glow-tired');

  if (value >= 4) {
    container.classList.add('mood-glow-happy');
    triggerTeddyReaction('MOOD_HAPPY');
  } else if (value === 3) {
    container.classList.add('mood-glow-calm');
    triggerTeddyReaction('MOOD_CALM');
  } else {
    container.classList.add('mood-glow-tired');
    triggerTeddyReaction('MOOD_LOW');
  }

  // Show celebration animation
  const emojiElement = document.getElementById('moodEmoji');
  if (emojiElement) {
    emojiElement.style.animation = 'none';
    setTimeout(() => {
      emojiElement.style.animation = 'pulse 2s ease-in-out infinite';
    }, 10);
  }

  renderMoodHistory();
}

function loadTodayMood() {
  const today = new Date().toISOString().split('T')[0];
  let moods = JSON.parse(localStorage.getItem('moodTracker')) || {};

  if (moods[today]) {
    const slider = document.getElementById('moodSlider');
    slider.value = moods[today];
    updateMoodEmoji();
  }

  renderMoodHistory();
}

function renderMoodHistory() {
  const historyContainer = document.getElementById('moodHistory');
  if (!historyContainer) return;
  // Recent moods section removed per design
  historyContainer.innerHTML = '';
}

// ============= MOOD CHART FUNCTIONS =============
function toggleMoodChart() {
  const modal = document.getElementById('moodChartModal');
  modal.classList.toggle('active');

  if (modal.classList.contains('active')) {
    // Draw the currently active chart
    const activeTab = document.querySelector('.chart-tab-btn.active');
    if (activeTab) {
      const chartType = activeTab.textContent.toLowerCase();
      setTimeout(() => drawChart(chartType), 100);
    }
  }
}

function switchChartView(chartType) {
  // Update tab buttons
  document.querySelectorAll('.chart-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update chart views
  document.querySelectorAll('.chart-view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(chartType + 'Chart').classList.add('active');

  // Draw the selected chart
  setTimeout(() => drawChart(chartType), 100);
}

function drawChart(type) {
  const moods = JSON.parse(localStorage.getItem('moodTracker')) || {};
  const canvasId = type + 'Canvas';
  const canvas = document.getElementById(canvasId);

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let data = [];
  let labels = [];

  if (type === 'weekly') {
    ({ data, labels } = getWeeklyData(moods));
  } else if (type === 'monthly') {
    ({ data, labels } = getMonthlyData(moods));
  } else if (type === 'yearly') {
    ({ data, labels } = getYearlyData(moods));
  }

  // Set canvas size
  canvas.width = canvas.offsetWidth;
  canvas.height = 300;

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw chart
  drawBarChart(ctx, data, labels, canvas.width, canvas.height, type);

  // Update info text
  updateChartInfo(type, data);
}

function getWeeklyData(moods) {
  const data = [];
  const labels = [];
  const today = new Date();

  // Get last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

    labels.push(dayName);
    data.push({
      value: moods[dateStr] || 0,
      emoji: moodEmojis[moods[dateStr] - 1] || '—'
    });
  }

  return { data, labels };
}

function getMonthlyData(moods) {
  const data = [];
  const labels = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get all days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];

    if (day % 5 === 0 || day === 1 || day === daysInMonth) {
      labels.push(day);
    } else {
      labels.push('');
    }

    data.push({
      value: moods[dateStr] || 0,
      emoji: moodEmojis[moods[dateStr] - 1] || '—'
    });
  }

  return { data, labels };
}

function getYearlyData(moods) {
  const data = [];
  const labels = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get average mood for each month
  for (let month = 0; month < 12; month++) {
    let monthMoods = [];
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, month, day);
      const dateStr = date.toISOString().split('T')[0];
      if (moods[dateStr]) {
        monthMoods.push(moods[dateStr]);
      }
    }

    const avgMood = monthMoods.length > 0 ?
      Math.round(monthMoods.reduce((a, b) => a + b, 0) / monthMoods.length) : 0;

    labels.push(months[month]);
    data.push({
      value: avgMood,
      emoji: moodEmojis[avgMood - 1] || '—',
      count: monthMoods.length
    });
  }

  return { data, labels };
}

function drawBarChart(ctx, data, labels, width, height, type) {
  const leftPadding = type === 'yearly' ? 50 : 44;
  const padding = type === 'yearly' ? 50 : 40;
  const bottomPadding = type === 'yearly' ? 60 : 40;
  const barWidth = (width - leftPadding - padding) / data.length;
  const maxValue = 5;
  const chartHeight = height - padding - bottomPadding;

  // Draw mood emojis on y-axis (1-5 from bottom to top)
  ctx.font = '16px Arial';
  ctx.textAlign = 'right';
  for (let i = 1; i <= maxValue; i++) {
    const y = height - bottomPadding - (i / maxValue) * chartHeight;
    ctx.fillText(moodEmojis[i - 1], leftPadding - 8, y + 5);
  }

  // Draw grid lines
  ctx.strokeStyle = 'rgba(240, 98, 146, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= maxValue; i++) {
    const y = height - bottomPadding - (i / maxValue) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(leftPadding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Draw bars
  data.forEach((item, index) => {
    const x = leftPadding + index * barWidth + barWidth / 2;
    const barHeight = (item.value / maxValue) * chartHeight;
    const y = height - bottomPadding - barHeight;

    // Draw bar with gradient
    const gradient = ctx.createLinearGradient(x - barWidth / 3, y, x - barWidth / 3, height - bottomPadding);
    gradient.addColorStop(0, '#f06292');
    gradient.addColorStop(1, '#ec407a');

    ctx.fillStyle = item.value > 0 ? gradient : 'rgba(240, 98, 146, 0.1)';
    ctx.fillRect(x - barWidth / 3, y, barWidth * 0.6, barHeight);

    // Draw label with different styles for yearly
    ctx.fillStyle = '#c2185b';

    if (type === 'yearly') {
      ctx.save();
      ctx.translate(x, height - bottomPadding + 10);
      ctx.rotate(Math.PI / 4);
      ctx.font = 'bold 10px Poppins';
      ctx.textAlign = 'right';
      ctx.fillText(labels[index], 0, 0);
      ctx.restore();
    } else {
      ctx.font = 'bold 11px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x, height - bottomPadding + 20);
    }
  });

  // Draw axes
  ctx.strokeStyle = '#c2185b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftPadding, padding);
  ctx.lineTo(leftPadding, height - bottomPadding);
  ctx.lineTo(width - padding, height - bottomPadding);
  ctx.stroke();
}

function updateChartInfo(type, data) {
  const infoElement = document.getElementById(type + 'Info');
  if (!infoElement) return;

  const validValues = data.filter(d => d.value > 0);

  if (validValues.length === 0) {
    infoElement.textContent = 'No mood data yet. Start tracking your mood!';
    return;
  }

  const avgMood = Math.round(validValues.reduce((sum, d) => sum + d.value, 0) / validValues.length);
  const moodTexts = ['Struggling', 'Unhappy', 'Neutral', 'Happy', 'Very Happy'];

  infoElement.textContent = `Average mood: ${moodEmojis[avgMood - 1]} ${moodTexts[avgMood - 1]} • ${validValues.length} entries`;
}

// ============= THEME TOGGLE =============
function toggleTheme() {
  const body = document.body;
  const toggle = document.getElementById('themeToggle');
  body.classList.toggle('dark-mode');
  toggle.textContent = body.classList.contains('dark-mode') ? '🌙' : '☀️';
  localStorage.setItem('bloomTheme', body.classList.contains('dark-mode') ? 'dark' : 'light');

  // Control teddy's night mode
  if (body.classList.contains('dark-mode')) {
    enableTeddyNightMode();
  } else {
    disableTeddyNightMode();
  }
}

// Load theme on startup
document.addEventListener('DOMContentLoaded', function () {
  const savedTheme = localStorage.getItem('bloomTheme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggle').textContent = '🌙';
  }
});

// ============= MASCOT FUNCTIONS =============
function showMascotMessage(message) {
  const bubble = document.getElementById('mascotBubble');
  bubble.textContent = message;
  bubble.style.animation = 'none';
  setTimeout(() => {
    bubble.style.animation = 'bubbleFade 3s ease forwards';
  }, 10);
}

// Show encouraging messages
const encouragementMessages = [
  'Great work! 💕',
  'You\'ve got this! 🌟',
  'Keep going! 🌸',
  'You\'re amazing! ✨',
  'So proud of you! 💖'
];

// ============= FUTURE LETTER FUNCTIONS =============
function saveLetter() {
  const content = document.getElementById('letterContent').value;
  const unlockDate = document.getElementById('letterUnlockDate').value;

  if (!content.trim() || !unlockDate) {
    showReminder('Please write a letter and set an unlock date 💌');
    return;
  }

  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  const letter = {
    id: Date.now(),
    content: content,
    unlockDate: unlockDate,
    createdDate: new Date().toISOString().split('T')[0],
    opened: false
  };

  letters.push(letter);
  localStorage.setItem('futureLetters', JSON.stringify(letters));

  document.getElementById('letterContent').value = '';
  document.getElementById('letterUnlockDate').value = '';

  showReminder('Letter saved! A letter from past you 💗');
  triggerTeddyReaction('NOTE_SAVED');
  renderLetters();
}

function renderLetters() {
  const container = document.getElementById('lettersList');
  if (!container) return;
  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];

  container.innerHTML = '';

  letters.sort((a, b) => new Date(b.unlockDate) - new Date(a.unlockDate));

  letters.forEach(letter => {
    const today = new Date().toISOString().split('T')[0];
    const isUnlocked = letter.unlockDate <= today;

    const letterEl = document.createElement('div');
    letterEl.className = `letter-envelope ${isUnlocked ? '' : 'locked'}`;
    letterEl.innerHTML = `
      <div class="letter-date">${new Date(letter.unlockDate).toLocaleDateString()}</div>
      <div class="letter-preview">${isUnlocked ? letter.content.substring(0, 60) + '...' : 'Locked until ' + new Date(letter.unlockDate).toLocaleDateString()}</div>
    `;

    if (isUnlocked) {
      letterEl.onclick = () => showLetterPopup(letter.content, letter.unlockDate);
    }

    container.appendChild(letterEl);
  });
}

function togglePreviousLetters() {
  const list = document.getElementById('lettersList');
  const btn = document.getElementById('previousLettersBtn');
  if (!list || !btn) return;
  const isHidden = list.style.display === 'none';
  list.style.display = isHidden ? 'block' : 'none';
  btn.textContent = isHidden ? '✕ Hide previous letters' : '💌 Previous Letters';
}

let letterPopupQueue = [];

function showLetterPopup(content, unlockDate) {
  const overlay = document.getElementById('letterPopupOverlay');
  const contentEl = document.getElementById('letterPopupContent');
  const dateEl = document.getElementById('letterPopupDate');
  if (!overlay || !contentEl || !dateEl) return;
  dateEl.textContent = unlockDate ? 'Unlocked on ' + new Date(unlockDate).toLocaleDateString() : '';
  contentEl.textContent = content;
  overlay.style.display = 'flex';
}

function closeLetterPopup() {
  const overlay = document.getElementById('letterPopupOverlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  if (letterPopupQueue.length > 0) {
    const next = letterPopupQueue.shift();
    setTimeout(() => showLetterPopup(next.content, next.unlockDate), 300);
  }
}

function checkAndShowUnlockedLettersOnOpen() {
  const today = new Date().toISOString().split('T')[0];
  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  const unlockedToday = letters.filter(l => l.unlockDate === today);
  const shownKey = 'letterPopupShown_' + today;
  const alreadyShown = JSON.parse(sessionStorage.getItem(shownKey) || '[]');

  const toShow = unlockedToday.filter(l => !alreadyShown.includes(l.id));
  if (toShow.length === 0) return;

  toShow.forEach(l => alreadyShown.push(l.id));
  sessionStorage.setItem(shownKey, JSON.stringify(alreadyShown));
  letterPopupQueue = toShow.slice(1);
  showLetterPopup(toShow[0].content, toShow[0].unlockDate);
}

// ============= FOCUS TIMER FUNCTIONS =============
let timerInterval = null;
let timerSeconds = 1500; // 25 minutes default
let isTimerRunning = false;

function setTimerDuration(minutes) {
  timerSeconds = minutes * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  document.getElementById('timerDisplay').textContent =
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;

  // Disable eye follow during focus timer
  setEyeFollowEnabled(false);

  triggerTeddyReaction('FOCUS_START');

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      completeTimer();
      // Re-enable eye follow after timer
      setEyeFollowEnabled(true);
    }
  }, 1000);
}

function pauseTimer() {
  if (!isTimerRunning) return;
  clearInterval(timerInterval);
  isTimerRunning = false;
  // Re-enable eye follow when paused
  setEyeFollowEnabled(true);
}

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = 1500;
  updateTimerDisplay();
}

function completeTimer() {
  showReminder('Great focus session! Take a break 🫖');
  triggerTeddyReaction('FOCUS_COMPLETE');
  // Floating petals animation
  createFloatingElements();
}

function createFloatingElements() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const petal = document.createElement('div');
      petal.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}%;
        top: 0;
        font-size: 20px;
        pointer-events: none;
        z-index: 998;
        animation: float 3s ease-in forwards;
      `;
      petal.textContent = ['🌸', '🌷', '🌹', '🌺', '✨'][i];
      document.body.appendChild(petal);
      setTimeout(() => petal.remove(), 3000);
    }, i * 200);
  }
}

// ============= REFLECTION FUNCTIONS =============
function saveReflection() {
  const well = document.getElementById('reflectionWell').value;
  const felt = document.getElementById('reflectionFelt').value;
  const grateful = document.getElementById('reflectionGrateful').value;

  if (!well.trim() && !felt.trim() && !grateful.trim()) {
    showReminder('Share at least one reflection 🌙');
    return;
  }

  let reflections = JSON.parse(localStorage.getItem('reflections')) || [];
  const today = new Date().toISOString().split('T')[0];

  reflections.push({
    date: today,
    well: well,
    felt: felt,
    grateful: grateful
  });

  localStorage.setItem('reflections', JSON.stringify(reflections));

  document.getElementById('reflectionWell').value = '';
  document.getElementById('reflectionFelt').value = '';
  document.getElementById('reflectionGrateful').value = '';

  showReminder('Reflection saved. You did well today 💫');
  showMascotMessage('Rest well! 🌙');
  renderReflections();
  refreshGardenAfterCheckIn();
}

function toggleReflectionHistory() {
  const list = document.getElementById('reflectionsList');
  const btn = document.getElementById('historyToggleBtn');
  if (!list || !btn) return;
  const isHidden = list.style.display === 'none' || list.style.display === '';
  list.style.display = isHidden ? 'block' : 'none';
  btn.textContent = isHidden ? '✕ Close history' : '📖 History';
  if (isHidden) renderReflections();
}

function renderReflections() {
  const container = document.getElementById('reflectionsList');
  if (!container) return;
  let reflections = JSON.parse(localStorage.getItem('reflections')) || [];

  container.innerHTML = '';
  reflections.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).forEach(reflection => {
    const entry = document.createElement('div');
    entry.className = 'reflection-entry';
    entry.innerHTML = `
      <div class="reflection-entry-date">${new Date(reflection.date).toLocaleDateString()}</div>
      <div class="reflection-entry-text">
        ${reflection.well ? `<strong>Well:</strong> ${reflection.well}<br>` : ''}
        ${reflection.felt ? `<strong>Felt:</strong> ${reflection.felt}<br>` : ''}
        ${reflection.grateful ? `<strong>Grateful:</strong> ${reflection.grateful}` : ''}
      </div>
    `;
    container.appendChild(entry);
  });
}

// Initialize features on tab switch
window.addEventListener('load', function () {
  initGarden();
  renderLetters();
  renderReflections();
  initBloomTeddy();
});

// ============= BLOOM TEDDY MASCOT =============
// ============= BLOOM TEDDY MASCOT =============
let blinkTimeout = null;
let sparkleTimeout = null;
let eyeFollowEnabled = true;
let eyeFollowIdleTimeout = null;
let lastMouseX = null;
let lastMouseY = null;

function initBloomTeddy() {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;

  teddy.addEventListener('click', (e) => {
    e.stopPropagation();
    showTeddyMessage('You\'re doing amazing! 💕');
  });

  // Start natural blinking and sparkle effects
  startNaturalBlinking();
  startSparkleEffect();

  // Start eye follow cursor effect
  initEyeFollowCursor();

  // Initialize shy hover reaction
  initShyHoverReaction();

  // Initialize Draggable Teddy
  initTeddyDrag();

  // Initialize Greeting Bubble
  initGreetingBubble();

  // Initial safe positioning check
  setTimeout(ensureSafePosition, 500);

  // Initialize Random Wandering
  initTeddyWander();

  // Initialize Expression System
  initTeddyExpressions();
}

function startNaturalBlinking() {
  const leftEyeGroup = document.getElementById('leftEyeGroup');
  const rightEyeGroup = document.getElementById('rightEyeGroup');

  if (!leftEyeGroup || !rightEyeGroup) return;

  function triggerBlink() {
    // Add blinking class to both eye groups
    leftEyeGroup.classList.add('blinking');
    rightEyeGroup.classList.add('blinking');

    // Remove class after animation completes
    setTimeout(() => {
      leftEyeGroup.classList.remove('blinking');
      rightEyeGroup.classList.remove('blinking');
    }, 200);

    // Schedule next blink (random between 3-6 seconds)
    const nextBlinkDelay = 3000 + Math.random() * 3000; // 3000-6000ms
    blinkTimeout = setTimeout(triggerBlink, nextBlinkDelay);
  }

  // Start first blink after initial delay
  const initialDelay = 2000 + Math.random() * 2000; // 2-4 seconds
  blinkTimeout = setTimeout(triggerBlink, initialDelay);
}

function startSparkleEffect() {
  const leftSparkle = document.querySelector('.eye-sparkle-left');
  const rightSparkle = document.querySelector('.eye-sparkle-right');

  if (!leftSparkle || !rightSparkle) return;

  function triggerSparkle() {
    // Add sparkling class to both eye glows
    leftSparkle.classList.add('sparkling');
    rightSparkle.classList.add('sparkling');

    // Remove classes after animation completes
    setTimeout(() => {
      leftSparkle.classList.remove('sparkling');
      rightSparkle.classList.remove('sparkling');
    }, 1200);

    // Schedule next sparkle (random between 8-12 seconds)
    const nextSparkleDelay = 8000 + Math.random() * 4000; // 8000-12000ms
    sparkleTimeout = setTimeout(triggerSparkle, nextSparkleDelay);
  }

  // Start first sparkle after initial delay
  const initialDelay = 5000 + Math.random() * 3000; // 5-8 seconds
  sparkleTimeout = setTimeout(triggerSparkle, initialDelay);
}

// Clean up timers if needed
function stopTeddyAnimations() {
  if (blinkTimeout) {
    clearTimeout(blinkTimeout);
    blinkTimeout = null;
  }
  if (sparkleTimeout) {
    clearTimeout(sparkleTimeout);
    sparkleTimeout = null;
  }
}

function showTeddyMessage(message) {
  const bubble = document.getElementById('teddyBubble');
  if (!bubble) return;

  if (!message || String(message).trim() === '') {
    bubble.style.visibility = 'hidden';
    bubble.style.opacity = '0';
    bubble.textContent = '';
    return;
  }

  bubble.textContent = message;
  bubble.style.visibility = 'visible';
  bubble.style.opacity = '1';
  bubble.style.animation = 'bubbleFadeIn 0.4s ease-out forwards';

  setTimeout(() => {
    bubble.style.opacity = '0';
    bubble.style.animation = 'none';
    setTimeout(() => {
      bubble.textContent = '';
      bubble.style.visibility = 'hidden';
    }, 200);
  }, 3000);
}

function setTeddyState(state) {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;

  teddy.classList.remove('happy', 'streak', 'reflection', 'focused');

  if (state) {
    teddy.classList.add(state);
  }
}

function triggerTeddyReaction(action, message = null) {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;

  switch (action) {
    case 'happy':
      setTeddyState('happy');
      if (message) showTeddyMessage(message);
      setTimeout(() => setTeddyState(null), 600);
      break;

    case 'streak':
      setTeddyState('streak');
      if (message) showTeddyMessage(message);
      setTimeout(() => setTeddyState(null), 800);
      break;

    case 'reflection':
      setTeddyState('reflection');
      if (message) showTeddyMessage(message);
      setTimeout(() => setTeddyState(null), 1000);
      break;

    case 'focused':
      setTeddyState('focused');
      if (message) showTeddyMessage(message);
      break;
  }
}

function triggerTeddyMood() {
  const slider = document.getElementById('moodSlider');
  if (slider) {
    const value = parseInt(slider.value);
    if (value >= 4) {
      triggerTeddyReaction('happy', 'You\'re glowing! 💫');
    }
  }
}

function triggerTeddyStreak() {
  triggerTeddyReaction('streak', 'Keep going! 🔥');
}

function triggerTeddyReflection() {
  triggerTeddyReaction('reflection', 'Beautiful thoughts 🌸');
}

// ============= EYE FOLLOW CURSOR EFFECT =============
function initEyeFollowCursor() {
  const leftPupil = document.getElementById('leftEyePupil');
  const rightPupil = document.getElementById('rightEyePupil');
  const teddy = document.getElementById('bloomTeddy');

  if (!leftPupil || !rightPupil || !teddy) return;

  // Eye center positions in viewBox coordinates
  const leftEyeCenter = { x: 60, y: 50 };
  const rightEyeCenter = { x: 80, y: 50 };
  const maxMovementRadius = 6; // Max pixels the pupil can move

  function updateEyePosition(e) {
    if (!eyeFollowEnabled) return;

    // Get mouse/touch position
    let clientX, clientY;
    if (e.type === 'touchmove' || e.type === 'touchstart') {
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    lastMouseX = clientX;
    lastMouseY = clientY;

    // Clear idle timeout
    if (eyeFollowIdleTimeout) {
      clearTimeout(eyeFollowIdleTimeout);
    }

    // Get teddy's position and size
    const teddyRect = teddy.getBoundingClientRect();
    const svg = teddy.querySelector('.teddy-svg');
    if (!svg) return;

    // Get SVG viewBox dimensions
    const viewBox = svg.getAttribute('viewBox').split(' ');
    const viewBoxWidth = parseFloat(viewBox[2]);
    const viewBoxHeight = parseFloat(viewBox[3]);

    // Calculate scale factors
    const scaleX = viewBoxWidth / teddy.offsetWidth;
    const scaleY = viewBoxHeight / teddy.offsetHeight;

    // Convert screen coordinates to SVG coordinates
    const svgX = (clientX - teddyRect.left) * scaleX;
    const svgY = (clientY - teddyRect.top) * scaleY;

    // Update left eye
    updateSingleEye(leftPupil, leftEyeCenter, svgX, svgY, maxMovementRadius);

    // Update right eye
    updateSingleEye(rightPupil, rightEyeCenter, svgX, svgY, maxMovementRadius);

    // Set idle timeout to return to center
    eyeFollowIdleTimeout = setTimeout(() => {
      returnEyesToCenter(leftPupil, rightPupil);
    }, 2000); // 2 seconds of no movement
  }

  function updateSingleEye(pupil, eyeCenter, targetX, targetY, maxRadius) {
    // Calculate offset from eye center
    const dx = targetX - eyeCenter.x;
    const dy = targetY - eyeCenter.y;

    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to max radius
    let finalX = dx;
    let finalY = dy;

    if (distance > maxRadius) {
      finalX = (dx / distance) * maxRadius;
      finalY = (dy / distance) * maxRadius;
    }

    // Apply transform using CSS transform (works with SVG elements)
    // Using viewBox units directly
    pupil.style.transform = `translate(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px)`;
  }

  function returnEyesToCenter(leftPupil, rightPupil) {
    if (!eyeFollowEnabled) return;

    leftPupil.style.transform = 'translate(0px, 0px)';
    rightPupil.style.transform = 'translate(0px, 0px)';
  }

  // Add listeners
  document.addEventListener('mousemove', updateEyePosition);
  document.addEventListener('touchmove', updateEyePosition, { passive: false });
  document.addEventListener('touchstart', updateEyePosition, { passive: true });
}

// Control eye follow based on timer/ambient mode
function setEyeFollowEnabled(enabled) {
  eyeFollowEnabled = enabled;

  if (!enabled) {
    // Return eyes to center when disabled
    const leftPupil = document.getElementById('leftEyePupil');
    const rightPupil = document.getElementById('rightEyePupil');
    if (leftPupil && rightPupil) {
      leftPupil.style.transform = 'translate(0, 0)';
      rightPupil.style.transform = 'translate(0, 0)';
    }
  }
}

// Monitor ambient mode changes
document.addEventListener('DOMContentLoaded', function () {
  const ambientModeSelect = document.getElementById('ambientMode');
  if (ambientModeSelect) {
    ambientModeSelect.addEventListener('change', function () {
      // Disable eye follow in ambient mode (calm mode)
      const isAmbient = this.value !== 'quiet' && this.value !== '';
      setEyeFollowEnabled(!isAmbient);
    });
  }
});

// ============= SHY HOVER REACTION =============
function initShyHoverReaction() {
  const teddy = document.getElementById('bloomTeddy');
  const headGroup = document.getElementById('headGroup');
  const leftEyeGroup = document.getElementById('leftEyeGroup');
  const rightEyeGroup = document.getElementById('rightEyeGroup');

  if (!teddy || !headGroup) return;

  let isShy = false;

  function calculateShyDirection(e) {
    // Get mouse/touch position relative to teddy
    const teddyRect = teddy.getBoundingClientRect();
    const teddyCenterX = teddyRect.left + teddyRect.width / 2;

    let clientX;
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else {
        return 0;
      }
    } else {
      clientX = e.clientX;
    }

    // Calculate which side the cursor is on
    const offsetX = clientX - teddyCenterX;
    // Normalize to -1 (left) to 1 (right)
    const normalized = Math.max(-1, Math.min(1, offsetX / (teddyRect.width / 2)));

    // Turn head away from cursor (opposite direction)
    // If cursor is on right, turn left (negative rotation)
    // If cursor is on left, turn right (positive rotation)
    return -normalized * 6; // Max 6 degrees rotation
  }

  function enterShyState(e) {
    if (isShy) return;
    isShy = true;

    teddy.classList.add('shy');

    // Calculate head rotation direction
    const rotation = calculateShyDirection(e);
    // Use SVG transform attribute for proper rotation
    headGroup.setAttribute('transform', `rotate(${rotation}, 70, 55)`);

    // Eyes look down slightly
    if (leftEyeGroup) {
      leftEyeGroup.style.transform = 'translateY(2px)';
    }
    if (rightEyeGroup) {
      rightEyeGroup.style.transform = 'translateY(2px)';
    }
  }

  function exitShyState() {
    if (!isShy) return;
    isShy = false;

    teddy.classList.remove('shy');

    // Return to neutral - use SVG transform attribute
    headGroup.setAttribute('transform', 'rotate(0, 70, 55)');

    if (leftEyeGroup) {
      leftEyeGroup.style.transform = 'translateY(0)';
    }
    if (rightEyeGroup) {
      rightEyeGroup.style.transform = 'translateY(0)';
    }
  }

  // Add event listeners
  teddy.addEventListener('mouseenter', enterShyState);
  teddy.addEventListener('mouseleave', exitShyState);
  teddy.addEventListener('touchstart', enterShyState, { passive: true });

  // Update head rotation on mouse move while hovering
  teddy.addEventListener('mousemove', (e) => {
    if (isShy) {
      const rotation = calculateShyDirection(e);
      headGroup.setAttribute('transform', `rotate(${rotation}, 70, 55)`);
    }
  });
}

// ============= TEDDY DRAG & POSITIONING FUNCTIONALITY =============
let isDragging = false;
let didDragMove = false; // true only if user actually moved pointer while dragging
let dragStartX, dragStartY;
let teddyStartX, teddyStartY;
const DRAG_THRESHOLD_PX = 5;

function initTeddyDrag() {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;

  // Mouse events
  teddy.addEventListener('mousedown', handleDragStart);
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);

  // Touch events
  teddy.addEventListener('touchstart', handleDragStart, { passive: false });
  document.addEventListener('touchmove', handleDragMove, { passive: false });
  document.addEventListener('touchend', handleDragEnd);

  // Handle window resize to keep teddy in bounds
  window.addEventListener('resize', ensureSafePosition);
}

function handleDragStart(e) {
  const teddy = document.getElementById('bloomTeddy');
  if (e.target.closest('.teddy-bubble')) return; // Allow clicking bubble

  // Prevent default to stop scrolling (except on bubble)
  if (e.target.closest('.teddy-svg') || e.target.classList.contains('bloom-teddy')) {
    if (e.type !== 'mousedown') e.preventDefault();
  } else {
    return;
  }

  isDragging = true;
  didDragMove = false;
  teddy.classList.add('grabbing');

  // Get start positions
  const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

  dragStartX = clientX;
  dragStartY = clientY;

  // Get current teddy position
  const rect = teddy.getBoundingClientRect();
  teddyStartX = rect.left;
  teddyStartY = rect.top;

  // Disable eye follow
  setEyeFollowEnabled(false);
}

function handleDragMove(e) {
  if (!isDragging) return;
  e.preventDefault();

  const teddy = document.getElementById('bloomTeddy');
  const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
    didDragMove = true;
  }

  teddy.style.left = `${teddyStartX + dx}px`;
  teddy.style.top = `${teddyStartY + dy}px`;
  teddy.style.bottom = 'auto';
  teddy.style.right = 'auto';
}

function handleDragEnd() {
  if (!isDragging) return;
  isDragging = false;

  const teddy = document.getElementById('bloomTeddy');
  teddy.classList.remove('grabbing');

  // Re-enable eye follow
  setEyeFollowEnabled(true);

  // Only snap position when user actually dragged; keep teddy in place on simple click
  if (didDragMove) {
    snapToSafePosition();
  }
}

function snapToSafePosition() {
  const teddy = document.getElementById('bloomTeddy');
  const rect = teddy.getBoundingClientRect();
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  const padding = 20;

  let targetLeft = rect.left;
  let targetTop = rect.top;

  // 1. Snap to nearest horizontal edge
  if (rect.left + rect.width / 2 < winWidth / 2) {
    targetLeft = padding; // Left
  } else {
    targetLeft = winWidth - rect.width - padding; // Right
  }

  // 2. Keep within vertical bounds
  if (rect.top < padding) targetTop = padding;
  if (rect.bottom > winHeight - padding) targetTop = winHeight - rect.height - padding;

  // 3. Collision Detection & Avoidance
  // Check if target position overlaps with important UI
  const potentialRect = {
    left: targetLeft,
    top: targetTop,
    right: targetLeft + rect.width,
    bottom: targetTop + rect.height,
    width: rect.width,
    height: rect.height
  };

  if (checkCollision(potentialRect)) {
    // Try alternative vertical positions
    // Try moving up
    let newTop = targetTop - 100;
    let attempts = 0;
    while (checkCollision({ ...potentialRect, top: newTop, bottom: newTop + rect.height }) && attempts < 5) {
      newTop -= 100;
      attempts++;
    }

    if (attempts < 5) {
      targetTop = newTop;
    } else {
      // Try moving down if up fail
      newTop = targetTop + 100;
      attempts = 0;
      while (checkCollision({ ...potentialRect, top: newTop, bottom: newTop + rect.height }) && attempts < 5) {
        newTop += 100;
        attempts++;
      }
      if (attempts < 5) targetTop = newTop;
    }

    // Ensure still in bounds
    if (targetTop < padding) targetTop = padding;
    if (targetTop + rect.height > winHeight - padding) targetTop = winHeight - rect.height - padding;
  }

  // Animate to final position
  teddy.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  teddy.style.left = `${targetLeft}px`;
  teddy.style.top = `${targetTop}px`;
  teddy.style.bottom = 'auto';
  teddy.style.right = 'auto';

  setTimeout(() => {
    teddy.style.transition = ''; // Reset to default
  }, 400);
}

function checkCollision(rect) {
  // Elements to avoid
  const obstacles = document.querySelectorAll('button, input, textarea, .card-item, .nav-item');

  for (let el of obstacles) {
    // Skip hidden elements
    if (el.offsetParent === null) continue;

    const obRect = el.getBoundingClientRect();

    // Check intersection
    if (!(rect.right < obRect.left ||
      rect.left > obRect.right ||
      rect.bottom < obRect.top ||
      rect.top > obRect.bottom)) {
      return true; // Collision detected
    }
  }
  return false;
}

function ensureSafePosition() {
  // Logic to ensure teddy isn't off screen or blocking
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;
  snapToSafePosition();
}

// ============= SPEECH BUBBLE GREETING =============
function initGreetingBubble() {
  const hour = new Date().getHours();
  let greeting = 'Good morning, Sunshine ☀️';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon, Starlight 🌟';
  } else if (hour >= 17) {
    greeting = 'Good evening, Moonlight 🌙';
  }

  // Update dashboard greeting instead of teddy bubble
  const greetingEl = document.querySelector('.greeting');
  if (greetingEl) {
    greetingEl.innerHTML = `<h2>${greeting}</h2><div class="greeting-divider"></div>`;
  }
}

// ============= TEDDY RANDOM WANDERING =============
function initTeddyWander() {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;

  // Start wandering loop
  scheduleNextMove();
}

function scheduleNextMove() {
  // Random interval between 5-15 seconds
  const interval = Math.random() * 10000 + 5000;

  setTimeout(() => {
    if (!isDragging) {
      performRandomMove();
    }
    // Continue loop regardless of drag state
    scheduleNextMove();
  }, interval);
}

function performRandomMove() {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;

  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  const padding = 20;

  // 30% chance to hop in place, 70% to walk to new spot
  if (Math.random() < 0.3) {
    // Hop in place
    teddy.classList.add('hopping');
    setTimeout(() => {
      teddy.classList.remove('hopping');
    }, 1000);
  } else {
    // Walk to new random position
    // Don't move too far - maybe 100-300px away
    const rect = teddy.getBoundingClientRect();
    const range = 250;

    let targetX = rect.left + (Math.random() * range * 2 - range);
    let targetY = rect.top + (Math.random() * range * 2 - range);

    // Clamp to screen bounds
    targetX = Math.max(padding, Math.min(winWidth - rect.width - padding, targetX));
    targetY = Math.max(padding, Math.min(winHeight - rect.height - padding, targetY));

    // Check collision for new spot
    const potentialRect = {
      left: targetX,
      top: targetY,
      right: targetX + rect.width,
      bottom: targetY + rect.height,
      width: rect.width,
      height: rect.height
    };

    // If collision, try to find a safe spot or just don't move
    if (checkCollision(potentialRect)) {
      // Just hop instead of moving into obstacle
      teddy.classList.add('hopping');
      setTimeout(() => {
        teddy.classList.remove('hopping');
      }, 1000);
      return;
    }

    // Animate walk
    teddy.classList.add('walking');

    // FLIP TEDDY TO FACE DIRECTION
    const svg = teddy.querySelector('.teddy-svg');
    if (targetX < rect.left) {
      // Moving left
      if (svg) svg.style.transform = 'scaleX(1)';
    } else {
      // Moving right - flip
      if (svg) svg.style.transform = 'scaleX(-1)';
    }

    // Move
    teddy.style.left = `${targetX}px`;
    teddy.style.top = `${targetY}px`;

    // Stop walking animation after arrival (approx time based on transition)
    setTimeout(() => {
      teddy.classList.remove('walking');
      // Reset flip
      if (svg) svg.style.transform = 'scaleX(1)';
    }, 1500);
  }

  // ============= EXPRESSION SYSTEM =============
  const TEDDY_STATES = {
    DEFAULT: { eye: 'normal', motion: 'breathe' },
    HAPPY: { eye: 'sparkle', motion: 'bounce' },
    EXCITED: { eye: 'sparkle', motion: 'hop' },
    SHY: { eye: 'shy', motion: 'shy' },
    FOCUSED: { eye: 'focused', motion: 'breatheSlow' },
    SLEEPY: { eye: 'sleepy', motion: 'breatheSlow' },
    LOW: { eye: 'sad', motion: 'low' },
    NEUTRAL: { eye: 'normal', motion: 'breathe' }
  };

  let currentEmotion = 'DEFAULT';
  let emotionTimeout;

  function initTeddyExpressions() {
    // Hook into existing events if possible, or expose globaltrigger
    window.triggerTeddyReaction = triggerTeddyReaction;

    // Set default state
    setTeddyEmotion('DEFAULT');

    // Add idle reaction loop
    setInterval(() => {
      if (currentEmotion === 'DEFAULT' && Math.random() < 0.1) {
        // Occasional blink/smile change or sparkle
        showTeddyMessage(getDialogue('IDLE'));
      }
    }, 15000);
  }

  function setTeddyEmotion(emotionKey) {
    const teddy = document.getElementById('bloomTeddy');
    const eyeGroup = document.querySelector('.teddy-eye-group');
    if (!teddy) return;

    const state = TEDDY_STATES[emotionKey] || TEDDY_STATES.DEFAULT;
    currentEmotion = emotionKey;

    // Reset eye state (visual only, pupils handled by separate logic)
    // For now simple class toggle on container if needed
    teddy.classList.remove('happy', 'focused', 'shy', 'sleepy', 'sad');
    if (state.eye !== 'normal') teddy.classList.add(state.eye);

    // Motion
    teddy.classList.remove('bounce', 'hop', 'breathe', 'breatheSlow');
    if (state.motion !== 'breathe') teddy.classList.add(state.motion);

    // Auto-revert to default after some time if not permanent state (like focus)
    if (emotionKey !== 'FOCUSED' && emotionKey !== 'SLEEPY' && emotionKey !== 'DEFAULT') {
      clearTimeout(emotionTimeout);
      emotionTimeout = setTimeout(() => {
        setTeddyEmotion('DEFAULT');
      }, 4000);
    }
  }

  function triggerTeddyReaction(eventType) {
    let emotion = 'DEFAULT';
    let dialogueKey = 'DEFAULT';

    switch (eventType) {
      case 'TASK_COMPLETE':
        emotion = 'EXCITED';
        dialogueKey = 'SUCCESS';
        // Add particle effect logic here
        createConfetti();
        break;
      case 'NOTE_SAVED':
        emotion = 'HAPPY';
        dialogueKey = 'SAVED';
        break;
      case 'FOCUS_START':
        emotion = 'FOCUSED';
        dialogueKey = 'FOCUS';
        break;
      case 'FOCUS_COMPLETE':
        emotion = 'HAPPY';
        dialogueKey = 'FOCUS_DONE';
        break;
      case 'MOOD_HAPPY':
        emotion = 'HAPPY';
        dialogueKey = 'MOOD_HAPPY';
        break;
      case 'MOOD_CALM':
        emotion = 'SLEEPY'; // Calm/Sleepy share vibes
        dialogueKey = 'MOOD_CALM';
        break;
      case 'MOOD_LOW':
        emotion = 'LOW';
        dialogueKey = 'MOOD_LOW';
        break;
      default:
        emotion = 'DEFAULT';
    }

    setTeddyEmotion(emotion);
    if (dialogueKey) {
      showTeddyMessage(getDialogue(dialogueKey));
    }
  }

  function getDialogue(key) {
    const dialogues = {
      IDLE: ["I'm here with you 💗", "Let's take it one step at a time", "You're doing great"],
      SUCCESS: ["You did it! I knew you could 💖", "Yay! Proud of you ✨", "Little wins matter!"],
      SAVED: ["Your thoughts are safe here 🌸", "Saved with love 💗", "You express yourself beautifully"],
      FOCUS: ["Let's focus together 🌙", "Quiet strength mode", "I'll stay with you"],
      FOCUS_DONE: ["You stayed with it! ⭐", "That was beautiful focus", "Rest time now 💗"],
      MOOD_HAPPY: ["Your joy is shining ✨", "That makes me happy too!"],
      MOOD_CALM: ["Peace looks good on you 🌿", "Breathe... just like that"],
      MOOD_LOW: ["I'm here with you 💗", "It's okay to feel this", "You don't have to rush"]
    };

    const options = dialogues[key] || dialogues.IDLE;
    return options[Math.floor(Math.random() * options.length)];
  }

  function createConfetti() {
    const teddy = document.getElementById('bloomTeddy');
    if (!teddy) return;

    for (let i = 0; i < 10; i++) {
      const el = document.createElement('div');
      el.innerHTML = '✨';
      el.style.position = 'absolute';
      el.style.left = '50%';
      el.style.top = '50%';
      el.style.fontSize = Math.random() * 10 + 10 + 'px';
      el.style.pointerEvents = 'none';
      el.style.transform = `translate(-50%, -50%)`;
      el.style.transition = 'all 1s ease-out';
      el.style.opacity = '1';

      teddy.appendChild(el);

      // Animate

      setTimeout(() => {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100 - 50;
        el.style.transform = `translate(${x}px, ${y}px) scale(0)`;
        el.style.opacity = '0';
      }, 10);

      setTimeout(() => {
        el.remove();
      }, 1000);
    }
  }
}

// ============= FOCUS AMBIENT SYSTEM =============
let isAmbientModeListenerAttached = false;
let currentFocusType = 'study';
let currentAmbientSound = 'quiet';
let isAmbientModeOn = false;

// Audio Placeholders
const sounds = {
  rain: new Audio(), // Placeholder URL
  cafe: new Audio(), // Placeholder URL
  quiet: null
};

// Initialize Ambient System
function initAmbientSystem() {
  // Attach event listeners if not already done (though onclick in HTML handles most)
  if (!isAmbientModeListenerAttached) {
    const toggle = document.getElementById('ambientToggle');
    if (toggle) {
      // Restore state if needed, for now default off
      toggle.checked = false;
    }
    isAmbientModeListenerAttached = true;
  }
}

function setFocusType(type) {
  currentFocusType = type;

  // Update Buttons
  document.querySelectorAll('.focus-group .pill-btn[data-type]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Apply Theme if Ambient Mode is ON
  if (isAmbientModeOn) {
    applyAmbientTheme();
  }
}

function setAmbientSound(sound) {
  currentAmbientSound = sound;

  // Update Buttons
  document.querySelectorAll('.focus-group .pill-btn[data-sound]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sound === sound);
  });

  // Handle Audio Playback
  if (isAmbientModeOn) {
    playAmbientSound();
  }
}

function toggleAmbientMode() {
  const toggle = document.getElementById('ambientToggle');
  isAmbientModeOn = toggle.checked;

  if (isAmbientModeOn) {
    document.body.classList.add('ambient-mode');
    applyAmbientTheme();
    playAmbientSound();

    // Trigger mascot reaction
    triggerTeddyReaction('FOCUS_START');
  } else {
    document.body.classList.remove('ambient-mode', 'ambient-study', 'ambient-work', 'ambient-quiet', 'ambient-rain', 'ambient-cafe');
    stopAmbientSound();

    // Reset mascot
    setTeddyEmotion('DEFAULT');
  }
}

function applyAmbientTheme() {
  // Remove existing theme classes
  document.body.classList.remove('ambient-study', 'ambient-work', 'ambient-quiet', 'ambient-rain', 'ambient-cafe');

  // Add new theme classes (both focus type AND sound type)
  document.body.classList.add(`ambient-${currentFocusType}`);
  document.body.classList.add(`ambient-${currentAmbientSound}`);

  // Update Mascot Behavior based on Focus Type
  if (currentFocusType === 'study') {
    setTeddyEmotion('DEFAULT'); // Calm/reading
  } else if (currentFocusType === 'work') {
    setTeddyEmotion('FOCUSED'); // Alert/focused
  }
}

function playAmbientSound() {
  // Stop any currently playing sound
  Object.values(sounds).forEach(s => {
    if (s) {
      s.pause();
      s.currentTime = 0;
    }
  });

  if (currentAmbientSound === 'quiet') return;

  const audio = sounds[currentAmbientSound];
  if (audio) {
    // Set audio source based on combination
    const combination = `${currentFocusType}-${currentAmbientSound}`;

    // Audio URL mapping (placeholder paths - replace with actual audio files)
    const audioUrls = {
      'study-rain': 'assets/audio/study-rain.mp3',      // Gentle rain, soft
      'study-cafe': 'assets/audio/study-cafe.mp3',      // Quiet library ambience
      'work-rain': 'assets/audio/work-rain.mp3',        // Focused rain, steady
      'work-cafe': 'assets/audio/work-cafe.mp3'         // Light productivity cafe sounds
    };

    if (audioUrls[combination]) {
      // audio.src = audioUrls[combination];
      // audio.loop = true;
      // audio.volume = 0.3;
      // audio.play().catch(e => console.log('Audio play failed', e));
      console.log(`Playing ${combination} sound from ${audioUrls[combination]}`);
    }
  }
}

function stopAmbientSound() {
  Object.values(sounds).forEach(s => {
    if (s) {
      s.pause();
      s.currentTime = 0;
    }
  });
}

// Hook into window load
window.addEventListener('load', initAmbientSystem);

// ============= GARDEN TAB FUNCTIONS (GSAP Growth) =============
const GARDEN_STAGES = {
  SEED: { min: 1, max: 2, icon: '•', class: 'plant-seed' },
  SPROUT: { min: 3, max: 5, icon: '🌱', class: 'plant-sprout' },
  BLOOM: { min: 6, max: Infinity, icon: null, class: 'plant-bloom' }
};

/** Returns inline SVG for the custom blooming flower (stem + 5 petals + center). */
function getBloomFlowerSVG() {
  const stemPath = 'M 20 50 Q 18 32 20 22';
  const petalAngles = [0, 72, 144, 216, 288];
  const petals = petalAngles.map(function (deg) {
    return '<path class="bloom-petal" d="M 20 10 Q 24 14 24 22 Q 24 28 20 32 Q 16 28 16 22 Q 16 14 20 10 Z" fill="#FFB7C5" transform="rotate(' + deg + ' 20 22)" transform-origin="20px 22px"/>';
  }).join('');
  return '<svg class="bloom-flower-svg" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" pointer-events="none">' +
    '<path class="bloom-stem" d="' + stemPath + '" fill="none" stroke="#90EE90" stroke-width="2.2" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>' +
    petals +
    '<circle class="bloom-center" cx="20" cy="22" r="3.5" fill="#FFD700"/>' +
    '</svg>';
}

function getStageForStreak(streakCount) {
  if (streakCount < 1) return null;
  if (streakCount <= 2) return GARDEN_STAGES.SEED;
  if (streakCount <= 5) return GARDEN_STAGES.SPROUT;
  return GARDEN_STAGES.BLOOM;
}

function checkActivityForDate(dateStr) {
  const tasksOnDate = tasks.filter(t => t.dueDate === dateStr && t.completed);
  const notes = JSON.parse(localStorage.getItem('notesHistory')) || {};
  const hasNote = notes[dateStr] != null && String(notes[dateStr]).trim() !== '';
  const reflections = JSON.parse(localStorage.getItem('reflections')) || [];
  const hasReflection = reflections.some(r => r.date === dateStr);
  const habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  const hasHabitCheckIn = habits.some(h => (h.completedDates || []).includes(dateStr));
  return tasksOnDate.length > 0 || hasNote || hasReflection || hasHabitCheckIn;
}

/** Returns consecutive days with activity ending on dateStr (inclusive). */
function getStreakForDate(dateStr) {
  let count = 0;
  let d = new Date(dateStr + 'T12:00:00');
  const today = new Date().toISOString().split('T')[0];
  while (true) {
    const str = d.toISOString().split('T')[0];
    if (str > today) break;
    if (!checkActivityForDate(str)) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

/**
 * GSAP bloom sequence: stem grows from soil, petals unfurl with stagger, center pops in.
 * @param {string} cellId - e.g. 'garden-cell-2025-02-15'
 */
function bloomSequence(cellId) {
  const cell = document.getElementById(cellId);
  if (!cell) return;
  const svg = cell.querySelector('.bloom-flower-svg');
  const stem = cell.querySelector('.bloom-stem');
  const petals = cell.querySelectorAll('.bloom-petal');
  const center = cell.querySelector('.bloom-center');
  if (!svg || !stem || !petals.length || !center || typeof gsap === 'undefined') return;

  gsap.set([stem, center], { opacity: 1 });
  gsap.set(petals, { opacity: 1, scale: 0, transformOrigin: '20px 22px' });
  gsap.set(center, { scale: 0, transformOrigin: '20px 22px' });
  stem.style.strokeDashoffset = '1';

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.to(stem, { strokeDashoffset: 0, duration: 0.45 }, 0);
  tl.to(petals, {
    scale: 1,
    rotation: '+=20',
    duration: 0.4,
    stagger: 0.08,
    ease: 'back.out(1.4)',
    transformOrigin: '20px 22px'
  }, 0.25);
  tl.fromTo(center, { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(1.7)' }, 0.5);
}

/**
 * Updates plant growth in a calendar cell with GSAP animation.
 * Handles dry-patch (no activity), wilt (plant → missed day), and resume (dry-patch → seed).
 * @param {string} cellId - e.g. 'garden-cell-2025-02-15'
 * @param {number} streakCount - consecutive check-in days ending on that date
 */
function updatePlantGrowth(cellId, streakCount) {
  const cell = document.getElementById(cellId);
  if (!cell) return;
  let iconEl = cell.querySelector('.plant-icon');
  if (!iconEl) return;

  const stage = getStageForStreak(streakCount);
  const prevStage = iconEl.getAttribute('data-stage') || '';
  const wasDryPatch = cell.classList.contains('dry-patch');
  const hadPlant = prevStage && prevStage !== '' && !iconEl.classList.contains('dry-patch-marker');

  if (!stage) {
    cell.classList.add('dry-patch');
    if (hadPlant && typeof gsap !== 'undefined') {
      gsap.to(iconEl, {
        rotation: 15,
        opacity: 0.6,
        duration: 0.4,
        ease: 'power2.in',
        overwrite: true,
        onComplete: function () {
          iconEl.textContent = '×';
          iconEl.className = 'plant-icon dry-patch-marker';
          iconEl.setAttribute('data-stage', '');
          iconEl.style.rotation = '';
          iconEl.style.opacity = '';
          gsap.set(iconEl, { rotation: 0, opacity: 1 });
        }
      });
    } else {
      iconEl.textContent = '×';
      iconEl.className = 'plant-icon dry-patch-marker';
      iconEl.setAttribute('data-stage', '');
    }
    return;
  }

  cell.classList.remove('dry-patch');
  iconEl.className = 'plant-icon ' + stage.class;
  iconEl.setAttribute('data-stage', stage.class);

  if (stage.class === 'plant-bloom') {
    iconEl.innerHTML = getBloomFlowerSVG();
    iconEl.style.width = '100%';
    iconEl.style.height = 'auto';
    iconEl.style.maxHeight = '100%';
    if (typeof gsap !== 'undefined') {
      requestAnimationFrame(function () { bloomSequence(cellId); });
    }
    return;
  }

  iconEl.textContent = stage.icon;

  if (typeof gsap !== 'undefined') {
    if (wasDryPatch) {
      gsap.fromTo(iconEl, { opacity: 0, scale: 0.6 }, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
    } else {
      const isLevelUp = prevStage !== stage.class && prevStage !== '';
      if (isLevelUp) {
        gsap.fromTo(iconEl, { scale: 0.3, opacity: 0 }, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
          overwrite: true
        });
      } else {
        gsap.fromTo(iconEl, { scale: 0.8 }, {
          scale: 1,
          duration: 0.35,
          ease: 'back.out(1.2)',
          overwrite: true
        });
      }
    }
  }
}

function initGarden() {
  const monthEl = document.getElementById('gardenMonth');
  const flowersEl = document.getElementById('gardenFlowers');

  if (!monthEl || !flowersEl) return;

  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  monthEl.textContent = monthName;

  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  flowersEl.innerHTML = '';

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const streakCount = getStreakForDate(dateStr);
    const cellId = 'garden-cell-' + dateStr;

    const flowerDiv = document.createElement('div');
    flowerDiv.className = 'flower-day';
    flowerDiv.id = cellId;
    flowerDiv.setAttribute('data-date', dateStr);

    const stage = getStageForStreak(streakCount);
    const isDryPatch = streakCount === 0;
    if (isDryPatch) {
      flowerDiv.classList.add('dry-patch');
    }
    const stageClass = isDryPatch ? 'dry-patch-marker' : (stage ? stage.class : 'plant-empty');
    const iconContent = isDryPatch ? '×' : (stage && stage.class === 'plant-bloom' ? getBloomFlowerSVG() : (stage ? stage.icon : ''));

    flowerDiv.innerHTML = '<span class="plant-icon ' + stageClass + '" data-stage="' + (isDryPatch ? '' : (stage ? stage.class : '')) + '">' + iconContent + '</span><span class="flower-date">' + day + '</span>';
    flowersEl.appendChild(flowerDiv);
  }

  if (typeof gsap !== 'undefined') {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const cellId = 'garden-cell-' + dateStr;
      const streakCount = getStreakForDate(dateStr);
      updatePlantGrowth(cellId, streakCount);
    }
  }
}

function refreshGardenAfterCheckIn() {
  const today = new Date().toISOString().split('T')[0];
  initGarden();
  if (typeof gsap !== 'undefined') {
    const cellId = 'garden-cell-' + today;
    const streakCount = getStreakForDate(today);
    requestAnimationFrame(() => updatePlantGrowth(cellId, streakCount));
  }
}

// ============= REFLECTION TAB FUNCTIONS =============
function renderReflections() {
  const listEl = document.getElementById('reflectionsList');
  if (!listEl) return;

  const reflections = JSON.parse(localStorage.getItem('reflections')) || [];

  if (reflections.length === 0) {
    listEl.innerHTML = '<p style="color: #c2185b; opacity: 0.7; text-align: center; margin-top: 20px;">No reflections yet 🌙</p>';
    return;
  }

  // Sort by date (newest first)
  reflections.sort((a, b) => new Date(b.date) - new Date(a.date));

  listEl.innerHTML = reflections.map(r => `
    <div class="reflection-item">
      <div class="reflection-date">${formatReflectionDate(r.date)}</div>
      <div class="reflection-content">
        <p><strong>Did well:</strong> ${r.well || '—'}</p>
        <p><strong>Felt:</strong> ${r.felt || '—'}</p>
        <p><strong>Grateful for:</strong> ${r.grateful || '—'}</p>
      </div>
    </div>
  `).join('');
}

function formatReflectionDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function saveReflection() {
  const well = document.getElementById('reflectionWell').value.trim();
  const felt = document.getElementById('reflectionFelt').value.trim();
  const grateful = document.getElementById('reflectionGrateful').value.trim();

  if (!well && !felt && !grateful) {
    alert('Please write at least one reflection 💖');
    return;
  }

  const reflection = {
    date: new Date().toISOString().split('T')[0],
    well,
    felt,
    grateful,
    timestamp: Date.now()
  };

  const reflections = JSON.parse(localStorage.getItem('reflections')) || [];
  reflections.push(reflection);
  localStorage.setItem('reflections', JSON.stringify(reflections));

  // Clear inputs
  document.getElementById('reflectionWell').value = '';
  document.getElementById('reflectionFelt').value = '';
  document.getElementById('reflectionGrateful').value = '';

  // Show success message
  alert('Reflection saved 🌙✨');

  // Re-render the list
  renderReflections();
  refreshGardenAfterCheckIn();

  // Trigger teddy reaction
  if (typeof triggerTeddyReaction === 'function') {
    triggerTeddyReaction('NOTE_SAVED');
  }
}

