let currentQuadrant = null;
let editingTaskId = null;
let taskIdCounter = 0;

const quadrantNames = {
  'urgent-important': 'Important & Urgent',
  'important': 'Important but Not Urgent',
  'urgent': 'Not Important but Urgent',
  'others': 'Not Important & Not Urgent'
};

// --- Color Generator for Subjects ---
function stringToHslColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return 'hsl(' + h + ', 70%, 85%)';
}

function getTasksFromStorage() {
  const storedTasks = localStorage.getItem('eisenhowerTasks');
  return storedTasks ? JSON.parse(storedTasks) : [];
}

function saveTasksToStorage(tasks) {
  localStorage.setItem('eisenhowerTasks', JSON.stringify(tasks));
}

// Helper to display 'no tasks' message
function showNoTasksMessage(quadrantId) {
    const list = document.getElementById(quadrantId);
    if (list && list.children.length === 0) {
        list.innerHTML = '<p class="no-tasks">No tasks in this quadrant</p>';
    }
}

function loadTasks() {
  const tasks = getTasksFromStorage();
  
  Object.keys(quadrantNames).forEach(q => {
    const el = document.getElementById(q);
    if (el) el.innerHTML = '';
  });

  // Set taskIdCounter higher than any existing ID
  const maxId = tasks.reduce((max, t) => Math.max(max, parseInt(t.id.split('-')[1] || 0)), 0);
  taskIdCounter = maxId;

  tasks.forEach(t => {
    const list = document.getElementById(t.quadrant || 'others');
    if (!list) return;

    const noTasksMsg = list.querySelector('.no-tasks');
    if (noTasksMsg) noTasksMsg.remove();
    
    const task = document.createElement('div');
    task.className = 'task';
    task.id = t.id;
    task.dataset.title = t.title;
    task.dataset.description = t.description || '';
    task.dataset.subject = t.subject || '';
    task.dataset.quadrant = t.quadrant || 'others';
    task.dataset.completed = t.completed ? 'true' : 'false';

    task.innerHTML = createTaskHTML(t.id, t.title, t.description || '', t.subject || '', t.completed);
    list.appendChild(task);
  });
  
  Object.keys(quadrantNames).forEach(showNoTasksMessage);
}


function openModal(quad) {
  currentQuadrant = quad;
  editingTaskId = null;

  const modal = document.getElementById("modal");
  modal.classList.add('show');

  // Reset form
  document.getElementById("task-title").value = "";
  document.getElementById("task-description").value = "";
  document.getElementById("task-subject").value = "";
  document.getElementById('modal-title').textContent = 'Add New Task';
  document.getElementById('modal-subtitle').textContent = `Adding task to: ${quadrantNames[quad]}`;
  document.getElementById('submit-btn').textContent = 'Add Task';

  setTimeout(() => {
    document.getElementById('task-title').focus();
  }, 100);
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove('show');

  editingTaskId = null;
  currentQuadrant = null;
}


function saveTask(event) {
  event.preventDefault();

  if (editingTaskId) {
    updateTask();
  } else {
    addTask();
  }
}

function addTask() {
  const taskTitle = document.getElementById("task-title").value.trim();
  const taskDescription = document.getElementById("task-description").value.trim();
  const taskSubject = document.getElementById("task-subject").value.trim();

  if (taskTitle === "") {
    alert("Please enter a task title");
    return;
  }

  const list = document.getElementById(currentQuadrant);

  const noTasksMsg = list.querySelector('.no-tasks');
  if (noTasksMsg) {
    noTasksMsg.remove();
  }

  taskIdCounter++;
  const taskId = `task-${taskIdCounter}`;

  const task = document.createElement("div");
  task.className = "task";
  task.id = taskId;
  task.dataset.title = taskTitle;
  task.dataset.description = taskDescription;
  task.dataset.subject = taskSubject;
  task.dataset.quadrant = currentQuadrant;
  task.dataset.completed = "false";

  task.innerHTML = createTaskHTML(taskId, taskTitle, taskDescription, taskSubject, false);
  list.appendChild(task);

  closeModal();
  showNotification('Task added successfully', 'success'); 

  const tasks = getTasksFromStorage();
  tasks.push({
    id: taskId,
    title: taskTitle,
    description: taskDescription,
    subject: taskSubject,
    quadrant: currentQuadrant,
    completed: false
  });
  saveTasksToStorage(tasks);
}

function createTaskHTML(taskId, title, description, subject, completed) {
  const subjectColor = subject ? stringToHslColor(subject) : '';

  let html = '<div class="task-header">';
  html += '<div class="task-content">';
  html += `<div class="task-title ${completed ? 'completed' : ''}">${title}</div>`;

  if (description) {
    html += `<div class="task-description text-muted small">${description}</div>`;
  }
  
  if (subject) {
      html += `<div class="task-subject" style="background-color: ${subjectColor}; color: #3b1366;">${subject}</div>`;
  }

  html += '</div>';
  html += '<div class="task-actions d-flex gap-1">';
  html += `<button class="task-action-btn check" onclick="toggleComplete('${taskId}')" title="Mark as complete"><i class="bi bi-check-lg"></i></button>`;
  html += `<button class="task-action-btn edit" onclick="editTask('${taskId}')" title="Edit task"><i class="bi bi-pencil"></i></button>`;
  html += `<button class="task-action-btn delete" onclick="deleteTask('${taskId}')" title="Delete task"><i class="bi bi-trash"></i></button>`;
  html += '</div>';
  html += '</div>';

  return html;
}

function toggleComplete(taskId) {
  const task = document.getElementById(taskId);
  let isCompleted = task.dataset.completed === "true";

  isCompleted = !isCompleted;
  task.dataset.completed = isCompleted ? "true" : "false";

  const titleElement = task.querySelector('.task-title');
  if (isCompleted) {
    titleElement.classList.add('completed');
  } else {
    titleElement.classList.remove('completed');
  }
  
  const tasks = getTasksFromStorage();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = isCompleted;
    saveTasksToStorage(tasks);
    
    if (isCompleted) {
        showNotification("Task marked complete", 'success');
    } else {
        showNotification("Task marked incomplete", 'error');
    }
  }
}

function editTask(taskId) {
  const task = document.getElementById(taskId);
  editingTaskId = taskId;
  currentQuadrant = task.dataset.quadrant;

  document.getElementById('task-title').value = task.dataset.title;
  document.getElementById('task-description').value = task.dataset.description;
  document.getElementById('task-subject').value = task.dataset.subject;

  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('modal-subtitle').textContent = `Editing task in: ${quadrantNames[currentQuadrant]}`;
  document.getElementById('submit-btn').textContent = 'Update Task';

  const modal = document.getElementById("modal");
  modal.classList.add('show');

  setTimeout(() => {
    document.getElementById('task-title').focus();
  }, 100);
}

function updateTask() {
  const taskTitle = document.getElementById("task-title").value.trim();
  const taskDescription = document.getElementById("task-description").value.trim();
  const taskSubject = document.getElementById("task-subject").value.trim();

  if (taskTitle === "") {
    alert("Please enter a task title");
    return;
  }

  const task = document.getElementById(editingTaskId);
  const completed = task.dataset.completed === "true";

  task.dataset.title = taskTitle;
  task.dataset.description = taskDescription;
  task.dataset.subject = taskSubject;

  task.innerHTML = createTaskHTML(editingTaskId, taskTitle, taskDescription, taskSubject, completed);

  closeModal();
  showNotification("Task updated successfully", 'info'); 
  
  const tasks = getTasksFromStorage();
  const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].title = taskTitle;
    tasks[taskIndex].description = taskDescription;
    tasks[taskIndex].subject = taskSubject;
    saveTasksToStorage(tasks);
  }
}

function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  const task = document.getElementById(taskId);
  const quadrant = task.dataset.quadrant;

  task.remove();

  showNoTasksMessage(quadrant);
  showNotification("Task deleted", 'error'); 
  
  const tasks = getTasksFromStorage().filter(t => t.id !== taskId);
  saveTasksToStorage(tasks);
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notification-text');

  notification.className = 'notification'; 
  
  notificationText.textContent = message;
  notification.classList.add(type); 
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Close modal when clicking outside
document.getElementById('modal').addEventListener('click', function (event) {
  if (event.target === this) {
    closeModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('modal');
    if (modal.classList.contains('show')) {
      closeModal();
    }
  }
});

// Dark Mode
document.addEventListener("DOMContentLoaded", function () {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }
});

// Load tasks from server on page load
document.addEventListener('DOMContentLoaded', loadTasks);

const appNav = document.getElementById('app-nav');
const menuToggle = document.getElementById('menu-toggle');
const appContent = document.querySelector('.app-content');
const appFooter = document.querySelector('.footer');

// Helper function to toggle the classes
const toggleMenu = () => {
    if (appNav) appNav.classList.toggle('nav-open');
    if (appContent) appContent.classList.toggle('blur-content');
    if (appFooter) appFooter.classList.toggle('blur-content');
};

if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
}

if (appContent) {
    appContent.addEventListener('click', (event) => {
        if (appNav && appNav.classList.contains('nav-open') && event.currentTarget.classList.contains('blur-content')) {
            toggleMenu();
        }
    });
}

if (appFooter) {
    appFooter.addEventListener('click', (event) => {
        if (appNav && appNav.classList.contains('nav-open') && event.currentTarget.classList.contains('blur-content')) {
            toggleMenu();
        }
    });
}