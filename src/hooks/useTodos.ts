import { useCallback } from 'react';
import { Todo, Priority, FilterType } from '../types/todo';
import { useLocalStorage } from './useLocalStorage';
import { filterTodos, sortTodosByPriority } from '../utils/todoHelpers';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useTodos = () => {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);

  const addTodo = useCallback(
    (title: string, priority: Priority, dueDate: string | null) => {
      const newTodo: Todo = {
        id: generateId(),
        title,
        completed: false,
        priority,
        dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTodos(prev => [...prev, newTodo]);
    },
    [setTodos]
  );

  const updateTodo = useCallback(
    (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id
            ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
            : todo
        )
      );
    },
    [setTodos]
  );

  const deleteTodo = useCallback(
    (id: string) => {
      setTodos(prev => prev.filter(todo => todo.id !== id));
    },
    [setTodos]
  );

  const toggleComplete = useCallback(
    (id: string) => {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id
            ? {
                ...todo,
                completed: !todo.completed,
                updatedAt: new Date().toISOString(),
              }
            : todo
        )
      );
    },
    [setTodos]
  );

  const getFilteredTodos = useCallback(
    (filter: FilterType) => {
      const filtered = filterTodos(todos, filter);
      return sortTodosByPriority(filtered);
    },
    [todos]
  );

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    getFilteredTodos,
  };
};
