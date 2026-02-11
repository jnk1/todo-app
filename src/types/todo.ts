export type Priority = 'high' | 'medium' | 'low';
export type FilterType = 'all' | 'active' | 'completed';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;        // ISO 8601形式
  createdAt: string;             // ISO 8601形式
  updatedAt: string;             // ISO 8601形式
}
