import type { Todo, FilterType, Priority } from '../types/todo';
import { isOverdue } from './dateHelpers';

export const filterTodos = (todos: Todo[], filter: FilterType): Todo[] => {
  switch (filter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
};

const priorityOrder: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const sortTodosByPriority = (todos: Todo[]): Todo[] => {
  return [...todos].sort((a, b) => {
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

export const sortTodosByDueDate = (todos: Todo[]): Todo[] => {
  return [...todos].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
};

export const isOverdueTodo = (todo: Todo): boolean => {
  return !todo.completed && isOverdue(todo.dueDate);
};
