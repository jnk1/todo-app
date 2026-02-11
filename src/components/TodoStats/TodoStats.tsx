import type { Todo } from '../../types/todo';
import { isOverdueTodo } from '../../utils/todoHelpers';
import './TodoStats.css';

interface TodoStatsProps {
  todos: Todo[];
}

export const TodoStats = ({ todos }: TodoStatsProps) => {
  const total = todos.length;
  const completed = todos.filter(todo => todo.completed).length;
  const active = total - completed;
  const overdue = todos.filter(isOverdueTodo).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="todo-stats">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        {overdue > 0 && (
          <div className="stat-item overdue">
            <span className="stat-value">{overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        )}
      </div>
      {total > 0 && (
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="progress-text">{completionRate}% Complete</span>
        </div>
      )}
    </div>
  );
};
