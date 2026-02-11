import { useState } from 'react';
import type React from 'react';
import type { Priority } from '../../types/todo';
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

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
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
          placeholder="何をしますか？"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priority">優先度：</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="dueDate">期限：</label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={getToday()}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {isEditing ? '更新' : '追加'}
        </button>
      </div>
    </form>
  );
};
