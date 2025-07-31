// Todo List Application
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addTodo');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
    }

    bindEvents() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Focus input on load
        this.todoInput.focus();
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.render();
        this.updateStats();
        
        // Clear input and focus
        this.todoInput.value = '';
        this.todoInput.focus();

        // Add success animation
        this.addBtn.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
            this.addBtn.style.animation = '';
        }, 300);
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingId = id;
        this.render();
        
        // Focus the edit input
        const editInput = document.querySelector(`[data-edit-id="${id}"]`);
        if (editInput) {
            editInput.focus();
            editInput.select();
        }
    }

    saveEdit(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.saveTodos();
        }
        this.editingId = null;
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;

        // Animate stats
        [this.totalTasksEl, this.completedTasksEl, this.pendingTasksEl].forEach(el => {
            el.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                el.style.animation = '';
            }, 300);
        });
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }

        this.emptyState.classList.remove('show');
        
        this.todoList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="todoApp.toggleTodo(${todo.id})">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                
                ${this.editingId === todo.id 
                    ? `<input type="text" 
                         class="todo-input edit-input" 
                         value="${todo.text}"
                         data-edit-id="${todo.id}"
                         onblur="todoApp.saveEdit(${todo.id}, this.value)"
                         onkeypress="if(event.key === 'Enter') todoApp.saveEdit(${todo.id}, this.value)"
                         onkeyup="if(event.key === 'Escape') todoApp.editingId = null; todoApp.render()">`
                    : `<span class="todo-text">${this.escapeHtml(todo.text)}</span>`
                }
                
                <div class="todo-actions">
                    <button class="action-btn edit-btn" onclick="todoApp.editTodo(${todo.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="todoApp.deleteTodo(${todo.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for edit inputs
        document.querySelectorAll('.edit-input').forEach(input => {
            input.addEventListener('blur', (e) => {
                this.saveEdit(parseInt(e.target.dataset.editId), e.target.value);
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveEdit(parseInt(e.target.dataset.editId), e.target.value);
                }
            });
            
            input.addEventListener('keyup', (e) => {
                if (e.key === 'Escape') {
                    this.editingId = null;
                    this.render();
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
let todoApp;

document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
    
    // Add some sample todos if empty
    if (todoApp.todos.length === 0) {
        const sampleTodos = [
            'Welcome to TaskMaster! 🎉',
            'Click the checkbox to mark as complete',
            'Use the edit button to modify tasks',
            'Filter tasks using the buttons above'
        ];
        
        sampleTodos.forEach(text => {
            const todo = {
                id: Date.now() + Math.random(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            todoApp.todos.push(todo);
        });
        
        todoApp.saveTodos();
        todoApp.render();
        todoApp.updateStats();
    }
});

// Add some nice keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add todo
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        todoApp.addTodo();
    }
    
    // Escape to cancel editing
    if (e.key === 'Escape' && todoApp.editingId) {
        todoApp.editingId = null;
        todoApp.render();
    }
});

// Add smooth scrolling and better UX
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll to top when adding first todo
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('todo-item')) {
                entry.target.style.animation = 'slideIn 0.3s ease';
            }
        });
    });
    
    // Observe todo items for animation
    setTimeout(() => {
        document.querySelectorAll('.todo-item').forEach(item => {
            observer.observe(item);
        });
    }, 100);
}); 