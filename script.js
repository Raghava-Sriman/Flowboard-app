document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let data = {
        folders: [],
        settings: {
            theme: 'light-mode'
        }
    };
    let currentFolderId = null;
    let draggedTaskId = null;

    // --- DOM ELEMENTS ---
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const totalTasksCountEl = document.getElementById('total-tasks-count');
    const foldersView = document.getElementById('folders-view');
    const boardView = document.getElementById('board-view');
    const foldersGrid = document.getElementById('folders-grid');
    const addFolderForm = document.getElementById('add-folder-form');
    const newFolderNameInput = document.getElementById('new-folder-name');
    const boardTitleEl = document.getElementById('board-title');
    const kanbanBoard = document.querySelector('.kanban-board');
    const backToFoldersBtn = document.getElementById('back-to-folders-btn');

    // --- COLUMN DEFINITIONS ---
    const columns = [
        { id: 'todo', title: 'Things to Do' },
        { id: 'working', title: 'Working' },
        { id: 'pending', title: 'Pending' },
        { id: 'paused', title: 'Paused' },
        { id: 'finished', title: 'Finished' }
    ];

    // --- DATA PERSISTENCE (LOCAL STORAGE) ---
    const saveData = () => {
        localStorage.setItem('flowBoardData', JSON.stringify(data));
    };

    const loadData = () => {
        const savedData = localStorage.getItem('flowBoardData');
        if (savedData) {
            data = JSON.parse(savedData);
        } else {
            // Add default folders if it's the first time
            data = {
                folders: [
                    { id: `folder-${Date.now()}`, name: 'School', tasks: [] },
                    { id: `folder-${Date.now() + 1}`, name: 'Home', tasks: [] }
                ],
                settings: { theme: 'light-mode' }
            };
        }
    };

    // --- THEME MANAGEMENT ---
    const applyTheme = () => {
        body.className = data.settings.theme;
        themeToggle.checked = data.settings.theme === 'dark-mode';
    };

    const toggleTheme = () => {
        data.settings.theme = data.settings.theme === 'light-mode' ? 'dark-mode' : 'light-mode';
        applyTheme();
        saveData();
    };

    // --- VIEW SWITCHING ---
    const showFoldersView = () => {
        currentFolderId = null;
        boardView.classList.remove('active-view');
        foldersView.classList.add('active-view');
        renderFolders();
        updateTotalTasksCount();
    };

    const showBoardView = (folderId) => {
        currentFolderId = folderId;
        foldersView.classList.remove('active-view');
        boardView.classList.add('active-view');
        renderBoard();
    };

    // --- RENDER FUNCTIONS ---
    const renderFolders = () => {
        foldersGrid.innerHTML = '';
        data.folders.forEach(folder => {
            const folderCard = document.createElement('div');
            folderCard.className = 'folder-card';
            folderCard.dataset.folderId = folder.id;

            folderCard.innerHTML = `
                <div class="folder-card-content">
                    <i class="fa-solid fa-folder"></i>
                    <div class="folder-info">
                        <h3>${folder.name}</h3>
                        <p>${folder.tasks.length} tasks</p>
                    </div>
                </div>
                <button class="delete-folder-btn" data-folder-id="${folder.id}"><i class="fa-solid fa-trash-can"></i></button>
            `;

            folderCard.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-folder-btn')) {
                    showBoardView(folder.id);
                }
            });

            foldersGrid.appendChild(folderCard);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-folder-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteFolder);
        });
    };

    const renderBoard = () => {
        const folder = data.folders.find(f => f.id === currentFolderId);
        if (!folder) {
            showFoldersView();
            return;
        }

        boardTitleEl.textContent = folder.name;
        kanbanBoard.innerHTML = '';

        columns.forEach(column => {
            const columnEl = document.createElement('div');
            columnEl.className = 'kanban-column';
            columnEl.id = `col-${column.id}`;
            columnEl.dataset.status = column.id;

            const tasksInColumn = folder.tasks.filter(t => t.status === column.id);

            columnEl.innerHTML = `
                <div class="column-header">
                    <h3 class="column-title">${column.title}</h3>
                    <span class="column-task-count">${tasksInColumn.length}</span>
                </div>
                <div class="task-list"></div>
                <form class="add-task-form add-form">
                    <input type="text" placeholder="Add a new task..." required>
                    <button type="submit"><i class="fa-solid fa-plus"></i></button>
                </form>
            `;
            kanbanBoard.appendChild(columnEl);

            const taskList = columnEl.querySelector('.task-list');
            tasksInColumn.forEach(task => {
                const taskCard = createTaskCard(task);
                taskList.appendChild(taskCard);
            });
        });

        addBoardEventListeners();
        updateTotalTasksCount();
    };

    const createTaskCard = (task) => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.taskId = task.id;
        taskCard.draggable = true;
        taskCard.innerHTML = `
            <span>${task.content}</span>
            <button class="delete-task-btn" data-task-id="${task.id}"><i class="fa-solid fa-xmark"></i></button>
        `;
        return taskCard;
    };

    // --- EVENT HANDLING ---
    const handleAddFolder = (e) => {
        e.preventDefault();
        const folderName = newFolderNameInput.value.trim();
        if (folderName) {
            const newFolder = {
                id: `folder-${Date.now()}`,
                name: folderName,
                tasks: []
            };
            data.folders.push(newFolder);
            newFolderNameInput.value = '';
            saveData();
            renderFolders();
        }
    };
    
    const handleDeleteFolder = (e) => {
        const folderId = e.currentTarget.dataset.folderId;
        if (confirm('Are you sure you want to delete this folder and all its tasks?')) {
            data.folders = data.folders.filter(f => f.id !== folderId);
            saveData();
            renderFolders();
            updateTotalTasksCount();
        }
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        const form = e.target;
        const input = form.querySelector('input');
        const taskContent = input.value.trim();
        const status = form.closest('.kanban-column').dataset.status;

        if (taskContent) {
            const newTask = {
                id: `task-${Date.now()}`,
                content: taskContent,
                status: status
            };
            const folder = data.folders.find(f => f.id === currentFolderId);
            folder.tasks.push(newTask);
            input.value = '';
            saveData();
            renderBoard();
        }
    };

    const handleDeleteTask = (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        const folder = data.folders.find(f => f.id === currentFolderId);
        folder.tasks = folder.tasks.filter(t => t.id !== taskId);
        saveData();
        renderBoard();
    };

    // --- DRAG AND DROP LOGIC ---
    const addBoardEventListeners = () => {
        document.querySelectorAll('.add-task-form').forEach(form => {
            form.addEventListener('submit', handleAddTask);
        });

        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteTask);
        });

        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedTaskId = e.target.dataset.taskId;
                setTimeout(() => e.target.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', (e) => {
                draggedTaskId = null;
                e.target.classList.remove('dragging');
            });
        });

        const columns = document.querySelectorAll('.kanban-column');
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });
            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });
            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                const newStatus = column.dataset.status;
                const folder = data.folders.find(f => f.id === currentFolderId);
                const task = folder.tasks.find(t => t.id === draggedTaskId);
                if (task) {
                    task.status = newStatus;
                    saveData();
                    renderBoard();
                }
            });
        });
    };

    // --- UTILITY FUNCTIONS ---
    const updateTotalTasksCount = () => {
        const total = data.folders.reduce((acc, folder) => acc + folder.tasks.length, 0);
        totalTasksCountEl.textContent = `Total Tasks: ${total}`;
    };

    // --- INITIALIZATION ---
    const init = () => {
        loadData();
        applyTheme();
        showFoldersView();
        themeToggle.addEventListener('change', toggleTheme);
        addFolderForm.addEventListener('submit', handleAddFolder);
        backToFoldersBtn.addEventListener('click', showFoldersView);
    };

    init();
});