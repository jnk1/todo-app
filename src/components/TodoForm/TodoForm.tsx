import { useState, useEffect, FormEvent } from 'react';
import { Priority } from '../../types/todo';
import { getToday } from '../../utils/dateHelpers';
import './TodoForm.css';

interface TodoFormProps {
  onSubmit: (title: string, priority: Priority, dueDate: string | null) => void;
  initialData?: {
    title: string;
    priority: Priority;
    dueDate: string | null;
  };
  isEditing?: boolean;
}

export const TodoForm = ({ onSubmit, initialData, isEditing = false }: TodoFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setPriority(initialData.priority);
      setDueDate(initialData.dueDate || '');
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit(title.trim(), priority, dueDate || null);

    if (!isEditing) {
      setTitle('');
      setPriority('medium');
      setDueDate('');
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          type="text"
          className="todo-input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priority">Priority:</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="dueDate">Due Date:</label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={getToday()}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
};
