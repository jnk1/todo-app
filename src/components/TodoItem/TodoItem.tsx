import { Todo, Priority } from '../../types/todo';
import { formatDate } from '../../utils/dateHelpers';
import { isOverdueTodo } from '../../utils/todoHelpers';
import { TodoForm } from '../TodoForm/TodoForm';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
  isEditing: boolean;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string, priority: Priority, dueDate: string | null) => void;
  onEditStart: (id: string) => void;
  onEditEnd: () => void;
}

export const TodoItem = ({
  todo,
  isEditing,
  onToggleComplete,
  onDelete,
  onEdit,
  onEditStart,
  onEditEnd,
}: TodoItemProps) => {
  const handleEdit = (title: string, priority: Priority, dueDate: string | null) => {
    onEdit(todo.id, title, priority, dueDate);
    onEditEnd();
  };

  const isOverdue = isOverdueTodo(todo);

  if (isEditing) {
    return (
      <div className="todo-item editing">
        <TodoForm
          onSubmit={handleEdit}
          initialData={{
            title: todo.title,
            priority: todo.priority,
            dueDate: todo.dueDate,
          }}
          isEditing
        />
        <button className="btn btn-cancel" onClick={onEditEnd}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
      />
      <div className="todo-content">
        <span className="todo-title">{todo.title}</span>
        <div className="todo-meta">
          <span className={`priority-badge priority-${todo.priority}`}>
            {todo.priority}
          </span>
          {todo.dueDate && (
            <span className="due-date">
              📅 {formatDate(todo.dueDate)}
            </span>
          )}
        </div>
      </div>
      <div className="todo-actions">
        <button
          className="btn btn-edit"
          onClick={() => onEditStart(todo.id)}
          disabled={todo.completed}
        >
          Edit
        </button>
        <button
          className="btn btn-delete"
          onClick={() => onDelete(todo.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
