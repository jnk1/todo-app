import type { FilterType } from '../../types/todo';
import './TodoFilter.css';

interface TodoFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    active: number;
    completed: number;
  };
}

export const TodoFilter = ({ currentFilter, onFilterChange, counts }: TodoFilterProps) => {
  return (
    <div className="todo-filter">
      <button
        className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
        onClick={() => onFilterChange('all')}
      >
        All
        <span className="count-badge">{counts.all}</span>
      </button>
      <button
        className={`filter-btn ${currentFilter === 'active' ? 'active' : ''}`}
        onClick={() => onFilterChange('active')}
      >
        Active
        <span className="count-badge">{counts.active}</span>
      </button>
      <button
        className={`filter-btn ${currentFilter === 'completed' ? 'active' : ''}`}
        onClick={() => onFilterChange('completed')}
      >
        Completed
        <span className="count-badge">{counts.completed}</span>
      </button>
    </div>
  );
};
