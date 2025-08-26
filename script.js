document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const folderView = document.getElementById('folder-view');
    const taskView = document.getElementById('task-view');
    const taskBoard = document.getElementById('task-board');
    const currentFolderTitle = document.getElementById('current-folder-title');
    const backToFoldersBtn = document.getElementById('back-to-folders-btn');
    const addTaskForm = document.getElementById('add-task-form');
    const newTaskInput = document.getElementById('new-task-input');
    const totalTasksCountElem = document.getElementById('total-tasks-count');
    const finishedTasksCountElem = document.getElementById('finished-tasks-count');
    const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');

    // App State
    let currentFolderIndex = null;
    let draggedTask = null;

    const columns = [
        { id: 'todo', title: 'Things to Do' },
        { id: 'working', title: 'Working' },
        { id: 'pending', title: 'Pending' },
        { id: 'paused', title: 'Paused' },
        { id: 'finished', title: 'Finished' }
    ];

    let data = {
        folders: [
            { name: 'School', tasks: [] },
            { name: 'Home', tasks: [] }
        ]
    };

    // --- DATA PERSISTENCE ---
    function saveData() {
        localStorage.setItem('flowboardData', JSON.stringify(data));
    }

    function loadData() {
        const savedData = localStorage.getItem('flowboardData');
        if (savedData) {
            data = JSON.parse(savedData);
        }
        const savedTheme = localStorage.getItem('flowboardTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleCheckbox.checked = false;
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleCheckbox.checked = true;
        }
    }

    // --- VIEW MANAGEMENT ---
    function showFolderView() {
        folderView.style.display = 'grid';
        taskView.style.display = 'none';
        currentFolderIndex = null;
        renderFolders();
        updateCounters();
    }

    function showTaskView(folderIndex) {
        folderView.style.display = 'none';
        taskView.style.display = 'block';
        currentFolderIndex = folderIndex;
        renderTasks();
    }

    // --- RENDERING ---
    function renderFolders() {
        folderView.innerHTML = '';
        data.folders.forEach((folder, index) => {
            const folderCard = document.createElement('div');
            folderCard.className = 'folder-card';
            folderCard.dataset.index = index;
            
            const activeTasks = folder.tasks.filter(t => t.status !== 'finished').length;

            folderCard.innerHTML = `
                <h2>${folder.name}</h2>
                <div class="folder-meta">${activeTasks} active tasks</div>
            `;
            folderCard.addEventListener('click', () => showTaskView(index));
            folderView.appendChild(folderCard);
        });

        // Add "Add Folder" card
        const addFolderCard = document.createElement('div');
        addFolderCard.id = 'add-folder-card';
        addFolderCard.title = 'Create a new folder';
        addFolderCard.innerHTML = `
            <svg class="plus-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        `;
        addFolderCard.addEventListener('click', addFolder);
        folderView.appendChild(addFolderCard);
    }
    
    function renderTasks() {
        if (currentFolderIndex === null) return;
        
        const folder = data.folders[currentFolderIndex];
        currentFolderTitle.textContent = folder.name;
        taskBoard.innerHTML = '';

        columns.forEach(column => {
            const columnEl = document.createElement('div');
            columnEl.className = 'task-column';
            columnEl.dataset.columnId = column.id;
            
            const tasksInColumn = folder.tasks.filter(task => task.status === column.id);

            columnEl.innerHTML = `
                <div class="column-header">
                    <h3>${column.title}</h3>
                    <span class="column-task-count">${tasksInColumn.length}</span>
                </div>
                <div class="task-list"></div>
            `;

            const taskList = columnEl.querySelector('.task-list');

            tasksInColumn.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card';
                taskCard.draggable = true;
                taskCard.textContent = task.content;
                taskCard.dataset.taskId = task.id;
                taskList.appendChild(taskCard);
                
                taskCard.addEventListener('dragstart', handleDragStart);
                taskCard.addEventListener('dragend', handleDragEnd);
            });
            
            columnEl.addEventListener('dragover', handleDragOver);
            columnEl.addEventListener('drop', handleDrop);
            
            taskBoard.appendChild(columnEl);
        });
        updateCounters();
    }

    // --- COUNTERS ---
    function updateCounters() {
        let total = 0;
        let finished = 0;

        data.folders.forEach(folder => {
            folder.tasks.forEach(task => {
                if (task.status === 'finished') {
                    finished++;
                } else {
                    total++;
                }
            });
        });

        totalTasksCountElem.textContent = total;
        finishedTasksCountElem.textContent = finished;
    }

    // --- EVENT HANDLERS & LOGIC ---
    function addFolder() {
        const name = prompt('Enter a name for the new folder:');
        if (name && name.trim()) {
            data.folders.push({ name: name.trim(), tasks: [] });
            saveData();
            renderFolders();
        } else if (name !== null) {
            alert('Folder name cannot be empty.');
        }
    }
    
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskContent = newTaskInput.value.trim();
        if (taskContent && currentFolderIndex !== null) {
            const newTask = {
                id: `task-${Date.now()}`,
                content: taskContent,
                status: 'todo' // Default status
            };
            data.folders[currentFolderIndex].tasks.push(newTask);
            saveData();
            renderTasks();
            newTaskInput.value = '';
        }
    });

    backToFoldersBtn.addEventListener('click', showFolderView);

    themeToggleCheckbox.addEventListener('change', () => {
        if (!themeToggleCheckbox.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('flowboardTheme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('flowboardTheme', 'light');
        }
    });

    // --- DRAG AND DROP LOGIC ---
    function handleDragStart(e) {
        draggedTask = e.target;
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedTask = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        if (!draggedTask) return;

        const dropZoneColumn = e.target.closest('.task-column');
        if (!dropZoneColumn) return;

        const taskId = draggedTask.dataset.taskId;
        const newStatus = dropZoneColumn.dataset.columnId;

        const task = data.folders[currentFolderIndex].tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            saveData();
            renderTasks();
        }
    }

    // --- INITIALIZATION ---
    function init() {
        loadData();
        showFolderView();
    }

    init();
});
