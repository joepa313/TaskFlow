//javascript
// =========================
// TASKFLOW APPLICATION
// =========================

// Load saved tasks from localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Track the current filter
let currentFilter = "all";

// =========================
// GET HTML ELEMENTS
// =========================

const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const taskSearch = document.getElementById("task-search");

const totalCount = document.getElementById("total-count");
const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");

// =========================
// SAVE TASKS
// =========================

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// =========================
// UPDATE DASHBOARD
// =========================

function updateDashboard() {
    totalCount.textContent = tasks.length;

    pendingCount.textContent = tasks.filter(
        task => !task.completed
    ).length;

    completedCount.textContent = tasks.filter(
        task => task.completed
    ).length;
}

// =========================
// DISPLAY TASKS
// =========================

function displayTasks() {
    // Clear the task list
    taskList.innerHTML = "";

    // Get the search text
    const searchTerm = taskSearch.value.toLowerCase().trim();

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        // Filter by completion status
        if (currentFilter === "pending" && task.completed) {
            return false;
        }

        if (currentFilter === "completed" && !task.completed) {
            return false;
        }

        // Filter by search text
        const searchableText = `
            ${task.title}
            ${task.description}
            ${task.category}
            ${task.priority}
        `.toLowerCase();

        return searchableText.includes(searchTerm);
    });

    // Show a message if there are no tasks
    if (filteredTasks.length === 0) {
        const message = document.createElement("p");

        if (tasks.length === 0) {
            message.textContent = "No tasks yet. Add your first task above!";
        } else {
            message.textContent = "No matching tasks found.";
        }

        message.style.color = "#777";
        taskList.appendChild(message);
    }

    // Create a card for each task
    filteredTasks.forEach(task => {
        // Create task card
        const card = document.createElement("div");
        card.className = "task-card";

        if (task.completed) {
            card.classList.add("completed-task");
        }

        // Create task information section
        const info = document.createElement("div");
        info.className = "task-info";

        // Task title
        const title = document.createElement("h4");
        title.textContent = task.title;

        // Task description
        const description = document.createElement("p");
        description.textContent =
            task.description || "No description";

        // Task details
        const details = document.createElement("p");

        details.textContent =
            `Category: ${task.category}` +
            (task.date ? ` | Due: ${task.date}` : "");

        // Priority badge
        const priorityBadge = document.createElement("span");

        priorityBadge.className =
            `priority-badge priority-${task.priority.toLowerCase()}`;

        priorityBadge.textContent =
            `${task.priority} Priority`;

        // Add information to task card
        info.appendChild(title);
        info.appendChild(description);
        info.appendChild(details);
        info.appendChild(priorityBadge);

        // =========================
        // TASK BUTTONS
        // =========================

        const actions = document.createElement("div");
        actions.className = "task-actions";

        // Complete button
        const completeButton = document.createElement("button");

        completeButton.className = "complete-btn";
        completeButton.dataset.action = "complete";
        completeButton.dataset.id = task.id;

        completeButton.textContent =
            task.completed ? "Undo" : "Complete";

        // Edit button
        const editButton = document.createElement("button");

        editButton.className = "edit-btn";
        editButton.dataset.action = "edit";
        editButton.dataset.id = task.id;
        editButton.textContent = "Edit";

        // Delete button
        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = task.id;
        deleteButton.textContent = "Delete";

        // Add buttons
        actions.appendChild(completeButton);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        // Add everything to the card
        card.appendChild(info);
        card.appendChild(actions);

        // Add the card to the page
        taskList.appendChild(card);
    });

    // Update dashboard statistics
    updateDashboard();
}

// =========================
// ADD NEW TASK
// =========================

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // Get form values
    const title = document
        .getElementById("task-title")
        .value
        .trim();

    const description = document
        .getElementById("task-description")
        .value
        .trim();

    const priority = document
        .getElementById("task-priority")
        .value;

    const category = document
        .getElementById("task-category")
        .value;

    const date = document
        .getElementById("task-date")
        .value;

    // Stop if the title is empty
    if (!title) {
        return;
    }

    // Create a new task
    const newTask = {
        id: Date.now().toString(),
        title: title,
        description: description,
        priority: priority,
        category: category,
        date: date,
        completed: false
    };

    // Add task to the array
    tasks.push(newTask);

    // Save and display
    saveTasks();
    displayTasks();

    // Clear the form
    taskForm.reset();
});

// =========================
// COMPLETE / EDIT / DELETE
// =========================

taskList.addEventListener("click", function(event) {
    const button = event.target.closest("button");

    // Stop if something other than a button was clicked
    if (!button) {
        return;
    }

    const taskId = button.dataset.id;
    const action = button.dataset.action;

    // =========================
    // EDIT TASK
    // =========================

    if (action === "edit") {
        const task = tasks.find(
            task => task.id === taskId
        );

        if (!task) {
            return;
        }

        // Edit title
        const title = prompt(
            "Edit task title:",
            task.title
        );

        if (title === null) {
            return;
        }

        if (!title.trim()) {
            alert("Task title cannot be empty.");
            return;
        }

        // Edit description
        const description = prompt(
            "Edit description:",
            task.description
        );

        if (description === null) {
            return;
        }

        // Edit priority
        const priority = prompt(
            "Enter priority: Low, Medium, or High",
            task.priority
        );

        if (priority === null) {
            return;
        }

        const validPriorities = [
            "Low",
            "Medium",
            "High"
        ];

        const selectedPriority = validPriorities.find(
            p =>
                p.toLowerCase() ===
                priority.trim().toLowerCase()
        );

        if (!selectedPriority) {
            alert("Please enter Low, Medium, or High.");
            return;
        }

        // Edit category
        const category = prompt(
            "Enter category: Personal, Work, School, or Other",
            task.category
        );

        if (category === null) {
            return;
        }

        const validCategories = [
            "Personal",
            "Work",
            "School",
            "Other"
        ];

        const selectedCategory = validCategories.find(
            c =>
                c.toLowerCase() ===
                category.trim().toLowerCase()
        );

        if (!selectedCategory) {
            alert(
                "Please enter Personal, Work, School, or Other."
            );
            return;
        }

        // Edit due date
        const date = prompt(
            "Enter due date (YYYY-MM-DD), or leave blank:",
            task.date
        );

        if (date === null) {
            return;
        }

        // Update the task
        task.title = title.trim();
        task.description = description.trim();
        task.priority = selectedPriority;
        task.category = selectedCategory;
        task.date = date.trim();
    }

    // =========================
    // COMPLETE / UNDO TASK
    // =========================

    if (action === "complete") {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    completed: !task.completed
                };
            }

            return task;
        });
    }

    // =========================
    // DELETE TASK
    // =========================

    if (action === "delete") {
        const confirmed = confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmed) {
            return;
        }

        tasks = tasks.filter(
            task => task.id !== taskId
        );
    }

    // Save changes and refresh the page
    saveTasks();
    displayTasks();
});

// =========================
// SIDEBAR FILTERS
// =========================

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {
        button.addEventListener("click", function() {
            // Change filter
            currentFilter = this.dataset.filter;

            // Remove active class from all buttons
            document
                .querySelectorAll(".nav-btn")
                .forEach(btn => {
                    btn.classList.remove("active");
                });

            // Add active class to selected button
            this.classList.add("active");

            // Refresh tasks
            displayTasks();
        });
    });

// =========================
// SEARCH TASKS
// =========================

taskSearch.addEventListener("input", displayTasks);

// =========================
// LOAD APPLICATION
// =========================

displayTasks();