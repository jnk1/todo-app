import { Todo, Priority } from '../../types/todo';
import { TodoItem } from '../TodoItem/TodoItem';
import './TodoList.css';

interface TodoListProps {
  todos: Todo[];
  editingId: string | null;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string, priority: Priority, dueDate: string | null) => void;
  onEditStart: (id: string) => void;
  onEditEnd: () => void;
}

export const TodoList = ({
  todos,
  editingId,
  onToggleComplete,
  onDelete,
  onEdit,
  onEditStart,
  onEditEnd,
}: TodoListProps) => {
  if (todos.length === 0) {
    return (
      <div className="todo-list-empty">
        <p>No todos yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isEditing={editingId === todo.id}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onEdit={onEdit}
          onEditStart={onEditStart}
          onEditEnd={onEditEnd}
        />
      ))}
    </div>
  );
};
