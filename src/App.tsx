import { useState, useMemo } from 'react';
import { FilterType, Priority } from './types/todo';
import { useTodos } from './hooks/useTodos';
import { TodoForm } from './components/TodoForm/TodoForm';
import { TodoList } from './components/TodoList/TodoList';
import { TodoFilter } from './components/TodoFilter/TodoFilter';
import { TodoStats } from './components/TodoStats/TodoStats';
import './App.css';

function App() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleComplete, getFilteredTodos } = useTodos();
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredTodos = useMemo(() => getFilteredTodos(filter), [filter, getFilteredTodos]);

  const counts = useMemo(() => ({
    all: todos.length,
    active: todos.filter(todo => !todo.completed).length,
    completed: todos.filter(todo => todo.completed).length,
  }), [todos]);

  const handleAddTodo = (title: string, priority: Priority, dueDate: string | null) => {
    addTodo(title, priority, dueDate);
  };

  const handleEditTodo = (
    id: string,
    title: string,
    priority: Priority,
    dueDate: string | null
  ) => {
    updateTodo(id, { title, priority, dueDate });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Todo App</h1>
        <p className="app-subtitle">Organize your tasks efficiently</p>
      </header>

      <main className="app-main">
        <TodoForm onSubmit={handleAddTodo} />

        <TodoStats todos={todos} />

        <TodoFilter
          currentFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        <TodoList
          todos={filteredTodos}
          editingId={editingId}
          onToggleComplete={toggleComplete}
          onDelete={deleteTodo}
          onEdit={handleEditTodo}
          onEditStart={setEditingId}
          onEditEnd={() => setEditingId(null)}
        />
      </main>

      <footer className="app-footer">
        <p>Built with React + TypeScript + Vite</p>
      </footer>
    </div>
  );
}

export default App;
