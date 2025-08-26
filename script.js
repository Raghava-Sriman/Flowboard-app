document.addEventListener('DOMContentLoaded', () => {

    // --- SVG ICONS ---
    const icons = {
        folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        paperPlane: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        listCheck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h10M6 12h12M6 18h12M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
        checkDouble: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L7 17l-5-5"></path><path d="M22 6l-7 7-3-3"></path></svg>`
    };

    // --- STATE MANAGEMENT ---
    let data = { folders: [], settings: { theme: 'light-mode' } };
    let currentFolderId = null;
    let draggedTaskId = null;

    // --- DOM ELEMENTS ---
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const totalTasksCountEl = document.getElementById('total-tasks-count');
    const finishedTasksCountEl = document.getElementById('finished-tasks-count');
    const foldersView = document.getElementById('folders-view');
    const boardView = document.getElementById('board-view');
    const foldersGrid = document.getElementById('folders-grid');
    const boardTitleEl = document.getElementById('board-title');
    const kanbanBoard = document.querySelector('.kanban-board');
    const backToFoldersBtn = document.getElementById('back-to-folders-btn');
    const activeTasksContainer = document.getElementById('active-tasks-container');
    const finishedTasksContainer = document.getElementById('finished-tasks-container');

    // --- COLUMN DEFINITIONS ---
    const columns = [
        { id: 'todo', title: 'Things to Do' },
        { id: 'working', title: 'Working' },
        { id: 'pending', title: 'Pending' },
        { id: 'paused', title: 'Paused' },
        { id: 'finished', title: 'Finished' }
    ];

    // --- DATA PERSISTENCE ---
    const saveData = () => { localStorage.setItem('flowBoardData', JSON.stringify(data)); };
    const loadData = () => {
        const savedData = localStorage.getItem('flowBoardData');
        if (savedData) data = JSON.parse(savedData);
        else {
            data = {
                folders: [ { id: `folder-${Date.now()}`, name: 'School', tasks: [] }, { id: `folder-${Date.now() + 1}`, name: 'Home', tasks: [] } ],
                settings: { theme: 'light-mode' }
            };
        }
    };

    // --- THEME MANAGEMENT ---
    const applyTheme = () => { body.className = data.settings.theme; themeToggle.checked = data.settings.theme === 'dark-mode'; };
    const toggleTheme = () => { data.settings.theme = data.settings.theme === 'light-mode' ? 'dark-mode' : 'light-mode'; applyTheme(); saveData(); };

    // --- VIEW SWITCHING ---
    const showFoldersView = () => { currentFolderId = null; boardView.classList.remove('active-view'); foldersView.classList.add('active-view'); renderFolders(); updateCounters(); };
    const showBoardView = (folderId) => { currentFolderId = folderId; foldersView.classList.remove('active-view'); boardView.classList.add('active-view'); renderBoard(); };

    // --- RENDER FUNCTIONS ---
    const renderFolders = () => {
        foldersGrid.innerHTML = '';
        data.folders.forEach(folder => {
            const folderCard = document.createElement('div');
            folderCard.className = 'folder-card';
            folderCard.dataset.folderId = folder.id;
            folderCard.innerHTML = `
                <div class="folder-card-content">
                    ${icons.folder}
                    <div class="folder-info">
                        <h3>${folder.name}</h3>
                        <p>${folder.tasks.length} tasks</p>
                    </div>
                </div>
                <button class="delete-folder-btn" data-folder-id="${folder.id}" aria-label="Delete Folder">${icons.trash}</button>
            `;
            folderCard.addEventListener('click', (e) => { if (!e.target.closest('.delete-folder-btn')) showBoardView(folder.id); });
            foldersGrid.appendChild(folderCard);
        });
        const addFolderCard = document.createElement('div');
        addFolderCard.className = 'add-folder-card';
        addFolderCard.innerHTML = `${icons.plus}<span>Add New Folder</span>`;
        addFolderCard.addEventListener('click', handleAddFolder);
        foldersGrid.appendChild(addFolderCard);
        document.querySelectorAll('.delete-folder-btn').forEach(btn => btn.addEventListener('click', handleDeleteFolder));
    };

    const renderBoard = () => {
        const folder = data.folders.find(f => f.id === currentFolderId);
        if (!folder) { showFoldersView(); return; }
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
                    <button type="submit" aria-label="Add Task">${icons.paperPlane}</button>
                </form>
            `;
            kanbanBoard.appendChild(columnEl);
            const taskList = columnEl.querySelector('.task-list');
            tasksInColumn.forEach(task => taskList.appendChild(createTaskCard(task)));
        });
        addBoardEventListeners();
        updateCounters();
    };

    const createTaskCard = (task) => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.taskId = task.id;
        taskCard.draggable = true;
        taskCard.innerHTML = `
            <span>${task.content}</span>
            <button class="delete-task-btn" data-task-id="${task.id}" aria-label="Delete Task">${icons.close}</button>
        `;
        return taskCard;
    };

    // --- EVENT HANDLING ---
    const handleAddFolder = () => {
        const folderName = prompt("Enter a name for the new folder:", "New Folder");
        if (folderName && folderName.trim() !== "") {
            data.folders.push({ id: `folder-${Date.now()}`, name: folderName.trim(), tasks: [] });
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
            updateCounters();
        }
    };
    const handleAddTask = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.querySelector('input');
        const taskContent = input.value.trim();
        const status = form.closest('.kanban-column').dataset.status;
        if (taskContent) {
            const folder = data.folders.find(f => f.id === currentFolderId);
            folder.tasks.push({ id: `task-${Date.now()}`, content: taskContent, status: status });
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
        document.querySelectorAll('.add-task-form').forEach(form => form.addEventListener('submit', handleAddTask));
        document.querySelectorAll('.delete-task-btn').forEach(btn => btn.addEventListener('click', handleDeleteTask));
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedTaskId = e.target.dataset.taskId;
                setTimeout(() => e.target.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', (e) => { draggedTaskId = null; e.target.classList.remove('dragging'); });
        });
        document.querySelectorAll('.kanban-column').forEach(column => {
            column.addEventListener('dragover', (e) => { e.preventDefault(); column.classList.add('drag-over'); });
            column.addEventListener('dragleave', () => { column.classList.remove('drag-over'); });
            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                const folder = data.folders.find(f => f.id === currentFolderId);
                const task = folder.tasks.find(t => t.id === draggedTaskId);
                if (task) { task.status = column.dataset.status; saveData(); renderBoard(); }
            });
        });
    };

    // --- UTILITY FUNCTIONS ---
    const updateCounters = () => {
        const counts = data.folders.reduce((acc, folder) => {
            folder.tasks.forEach(task => (task.status === 'finished' ? acc.finished++ : acc.active++));
            return acc;
        }, { active: 0, finished: 0 });
        totalTasksCountEl.textContent = `Active Tasks: ${counts.active}`;
        finishedTasksCountEl.textContent = `Tasks Finished: ${counts.finished}`;
    };

    const injectHeaderIcons = () => {
        activeTasksContainer.insertAdjacentHTML('afterbegin', icons.listCheck);
        finishedTasksContainer.insertAdjacentHTML('afterbegin', icons.checkDouble);
    };

    // --- INITIALIZATION ---
    const init = () => {
        loadData();
        applyTheme();
        injectHeaderIcons();
        showFoldersView();
        themeToggle.addEventListener('change', toggleTheme);
        backToFoldersBtn.addEventListener('click', showFoldersView);
    };

    init();
});
