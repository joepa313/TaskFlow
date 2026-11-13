// =========================
// SUPABASE CONNECTION
// =========================

const SUPABASE_URL = "https://ptudugkkmhmlpdedfshg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable__YtpYT9dO2eppvuZ9n6Ibg_WZo_05Om";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// =========================
// APPLICATION VARIABLES
// =========================

let tasks = [];
let currentFilter = "all";
let editingTaskId = null;
let authMode = "login";


// =========================
// GET HTML ELEMENTS
// =========================

const authScreen = document.getElementById("auth-screen");
const app = document.getElementById("app");

const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authMessage = document.getElementById("auth-message");

const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const forgotPassword = document.getElementById("forgot-password");

const accountEmail = document.getElementById("account-email");
const logoutBtn = document.getElementById("logout-btn");

const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const searchInput = document.getElementById("search-input");

const totalTasks = document.getElementById("total-tasks");
const pendingTasks = document.getElementById("pending-tasks");
const completedTasks = document.getElementById("completed-tasks");

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const closeModal = document.getElementById("close-modal");


// =========================
// HELPER FUNCTIONS
// =========================

function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.style.color = isError ? "#dc2626" : "#16a34a";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}


// =========================
// AUTHENTICATION TABS
// =========================

loginTab.addEventListener("click", () => {
    authMode = "login";

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    authSubmit.textContent = "Login";
    forgotPassword.style.display = "inline";
    showMessage("");
});

signupTab.addEventListener("click", () => {
    authMode = "signup";

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    authSubmit.textContent = "Create Account";
    forgotPassword.style.display = "none";
    showMessage("");
});


// =========================
// CREATE ACCOUNT AND LOGIN
// =========================

authForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value;

    authSubmit.disabled = true;
    showMessage("Please wait...");

    try {
        if (authMode === "signup") {

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.href.split("#")[0]
                }
            });

            if (error) {
                throw error;
            }

            if (data.session) {
                showMessage("Account created successfully!");
            } else {
                showMessage(
                    "Account created! Check your email to confirm your account."
                );
            }

        } else {

            const { error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            showMessage("Login successful!");

        }

    } catch (error) {
        showMessage(error.message, true);
    }

    authSubmit.disabled = false;
});


// =========================
// FORGOT PASSWORD
// =========================

forgotPassword.addEventListener("click", async () => {

    const email = authEmail.value.trim();

    if (!email) {
        showMessage("Enter your email address first.", true);
        return;
    }

    showMessage("Sending password reset email...");

    const { error } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
            redirectTo: window.location.href.split("#")[0]
        }
    );

    if (error) {
        showMessage(error.message, true);
    } else {
        showMessage("Check your email for the password reset link.");
    }
});


// =========================
// LOG OUT
// =========================

logoutBtn.addEventListener("click", async () => {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert(error.message);
    }

});


// =========================
// AUTHENTICATION STATE
// =========================

async function handleAuthSession(session) {

    if (session) {

        authScreen.hidden = true;
        app.hidden = false;

        accountEmail.textContent = session.user.email;

        await loadTasks();

    } else {

        authScreen.hidden = false;
        app.hidden = true;

        tasks = [];
        renderTasks();
        updateDashboard();

    }
}


// =========================
// LOAD TASKS FROM SUPABASE
// =========================

async function loadTasks() {

    taskList.innerHTML = '<p class="empty-message">Loading tasks...</p>';

    const { data, error } = await supabaseClient
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        taskList.innerHTML =
            '<p class="empty-message">Could not load tasks: ' +
            escapeHTML(error.message) +
            '</p>';

        return;
    }

    tasks = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        priority: task.priority || "Medium",
        category: task.category || "Personal",
        date: task.due_date || "",
        completed: task.completed || false
    }));

    renderTasks();
    updateDashboard();
}


// =========================
// ADD A NEW TASK
// =========================

taskForm.addEventListener("submit", async event => {

    event.preventDefault();

    const newTask = {
        title: document.getElementById("task-title").value.trim(),
        description: document.getElementById("task-description").value.trim(),
        priority: document.getElementById("task-priority").value,
        category: document.getElementById("task-category").value,
        due_date: document.getElementById("task-date").value || null,
        completed: false
    };

    if (!newTask.title) {
        return;
    }

    const addButton = taskForm.querySelector("button[type='submit']");
    addButton.disabled = true;
    addButton.textContent = "Adding...";

    const { error } = await supabaseClient
        .from("tasks")
        .insert([newTask]);

    addButton.disabled = false;
    addButton.textContent = "Add Task";

    if (error) {
        alert("Could not add task: " + error.message);
        return;
    }

    taskForm.reset();

    document.getElementById("task-priority").value = "Medium";
    document.getElementById("task-category").value = "Personal";

    await loadTasks();

});


// =========================
// UPDATE DASHBOARD
// =========================

function updateDashboard() {

    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;

    totalTasks.textContent = tasks.length;
    pendingTasks.textContent = pending;
    completedTasks.textContent = completed;

}


// =========================
// DISPLAY TASKS
// =========================

function renderTasks() {

    taskList.innerHTML = "";

    let filteredTasks = [...tasks];

    if (currentFilter === "pending") {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }

    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML =
            '<p class="empty-message">No tasks found.</p>';

        return;
    }

    filteredTasks.forEach(task => {

        const taskCard = document.createElement("div");

        taskCard.className = "task-card";

        if (task.completed) {
            taskCard.classList.add("completed");
        }

        const priorityClass = task.priority.toLowerCase();

        const formattedDate = task.date
            ? new Date(task.date + "T00:00:00").toLocaleDateString()
            : "No due date";

        taskCard.innerHTML = `
            <div class="task-info">

                <h3 class="task-title">
                    ${escapeHTML(task.title)}
                </h3>

                <p class="task-description">
                    ${escapeHTML(task.description)}
                </p>

                <div class="task-details">

                    <span class="priority ${escapeHTML(priorityClass)}">
                        ${escapeHTML(task.priority)}
                    </span>

                    <span class="category">
                        ${escapeHTML(task.category)}
                    </span>

                    <span class="due-date">
                        ${escapeHTML(formattedDate)}
                    </span>

                </div>
            </div>

            <div class="task-actions">

                <button class="complete-btn">
                    ${task.completed ? "Undo" : "Complete"}
                </button>

                <button class="edit-btn">
                    Edit
                </button>

                <button class="delete-btn">
                    Delete
                </button>

            </div>
        `;

        const completeButton = taskCard.querySelector(".complete-btn");
        const editButton = taskCard.querySelector(".edit-btn");
        const deleteButton = taskCard.querySelector(".delete-btn");

        completeButton.addEventListener("click", () => {
            toggleTask(task.id, task.completed);
        });

        editButton.addEventListener("click", () => {
            openEditModal(task.id);
        });

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        taskList.appendChild(taskCard);

    });

}


// =========================
// COMPLETE OR UNDO TASK
// =========================

async function toggleTask(id, currentStatus) {

    const { error } = await supabaseClient
        .from("tasks")
        .update({
            completed: !currentStatus
        })
        .eq("id", id);

    if (error) {
        alert("Could not update task: " + error.message);
        return;
    }

    await loadTasks();

}


// =========================
// DELETE TASK
// =========================

async function deleteTask(id) {

    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) {
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Could not delete task: " + error.message);
        return;
    }

    await loadTasks();

}


// =========================
// OPEN EDIT WINDOW
// =========================

function openEditModal(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) {
        return;
    }

    editingTaskId = id;

    document.getElementById("edit-title").value = task.title;
    document.getElementById("edit-description").value = task.description;
    document.getElementById("edit-date").value = task.date;
    document.getElementById("edit-priority").value = task.priority;
    document.getElementById("edit-category").value = task.category;

    editModal.classList.add("show");

}


// =========================
// CLOSE EDIT WINDOW
// =========================

closeModal.addEventListener("click", () => {
    editModal.classList.remove("show");
    editingTaskId = null;
});

editModal.addEventListener("click", event => {

    if (event.target === editModal) {
        editModal.classList.remove("show");
        editingTaskId = null;
    }

});


// =========================
// SAVE EDITED TASK
// =========================

editForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!editingTaskId) {
        return;
    }

    const updatedTask = {
        title: document.getElementById("edit-title").value.trim(),
        description: document.getElementById("edit-description").value.trim(),
        due_date: document.getElementById("edit-date").value || null,
        priority: document.getElementById("edit-priority").value,
        category: document.getElementById("edit-category").value
    };

    const { error } = await supabaseClient
        .from("tasks")
        .update(updatedTask)
        .eq("id", editingTaskId);

    if (error) {
        alert("Could not save changes: " + error.message);
        return;
    }

    editModal.classList.remove("show");
    editingTaskId = null;

    await loadTasks();

});


// =========================
// TASK FILTERS
// =========================

document.querySelectorAll(".filter-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        renderTasks();

    });

});


// =========================
// SEARCH TASKS
// =========================

searchInput.addEventListener("input", () => {
    renderTasks();
});


// =========================
// START APPLICATION
// =========================

async function initializeApp() {

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        showMessage(error.message, true);
        return;
    }

    await handleAuthSession(data.session);

    supabaseClient.auth.onAuthStateChange((_event, session) => {

        setTimeout(() => {
            handleAuthSession(session);
        }, 0);

    });

}

initializeApp();