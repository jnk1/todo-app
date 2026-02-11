# TODOアプリ 設計ドキュメント

## 設計の意図（3行）

1. **カスタムフック駆動設計** - ビジネスロジックをコンポーネントから分離し、`useTodos`で一元管理することで保守性とテスタビリティを向上
2. **単方向データフロー** - Reactの原則に従い、状態は上位で管理、下位へpropsで配布することで予測可能な状態変更を実現
3. **型安全性の確保** - TypeScriptで全データ構造を厳密に定義し、実行時エラーを開発時に検出可能にする

## データの流れ（入力 → 変換 → 出力）

### 1. TODO追加フロー
```
入力: ユーザーがTodoFormでタイトル、優先度、期限を入力
  ↓
変換:
  - TodoForm.handleSubmit → バリデーション（タイトル必須）
  - App.handleAddTodo → useTodos.addTodo 呼び出し
  - useTodos.addTodo → 新しいTodoオブジェクト生成（ID、タイムスタンプ付与）
  - useLocalStorage → JSON化してlocalStorageに保存
  ↓
出力:
  - 状態更新 → 再レンダリング
  - TodoList → 新しいTODOを表示
  - TodoStats → 統計情報更新
```

### 2. TODO編集フロー
```
入力: ユーザーがTodoItemの「編集」ボタンをクリック
  ↓
変換:
  - App.setEditingId(todo.id) → 編集状態を設定
  - TodoItem → key={todo.id}でTodoFormを再マウント
  - TodoForm → initialDataから初期値を設定
  - ユーザーが編集 → TodoForm.handleSubmit
  - useTodos.updateTodo → 既存TODOを更新（updatedAtタイムスタンプ更新）
  - useLocalStorage → localStorageに保存
  ↓
出力:
  - 編集モード解除（editingId = null）
  - TodoItem → 更新された内容を表示
```

### 3. フィルタリングフロー
```
入力: ユーザーがTodoFilterで「すべて」「未完了」「完了済み」を選択
  ↓
変換:
  - App.setFilter(filterType) → フィルター状態更新
  - useMemo → getFilteredTodos(filter) 実行
  - todoHelpers.filterTodos → 条件に合うTODOを抽出
  - todoHelpers.sortTodosByPriority → 優先度順にソート
  ↓
出力:
  - TodoList → フィルタリング済みTODOを表示
  - TodoFilter → 各カテゴリの件数バッジ更新
```

### 4. データ永続化フロー
```
入力: useTodos内で状態変更（追加、更新、削除）
  ↓
変換:
  - useLocalStorage.setValue → 状態更新をトリガー
  - JSON.stringify(todos) → JSON文字列に変換
  - localStorage.setItem('todos', json) → ブラウザストレージに保存
  ↓
出力:
  - ページリロード時 → useLocalStorage初期化
  - localStorage.getItem('todos') → データ取得
  - JSON.parse → Todoオブジェクト配列に復元
```

### 5. クロスタブ同期フロー
```
入力: 別タブでTODOが変更される
  ↓
変換:
  - ブラウザがstorageイベントを発火
  - useLocalStorage内のイベントリスナーが検知
  - JSON.parse(e.newValue) → 新しい状態を解析
  - setStoredValue → React状態を更新
  ↓
出力:
  - 全コンポーネントが再レンダリング
  - 他のタブと同じ内容を表示
```

## 想定される失敗パターンと対策

### 1. localStorage関連の失敗

#### パターン1-1: localStorageが無効
**状況**: プライベートブラウジング、容量超過、ブラウザ設定で無効化
```typescript
// 対策: useLocalStorageでtry-catchによるエラーハンドリング
try {
  window.localStorage.setItem(key, JSON.stringify(valueToStore));
} catch (error) {
  console.error(`Error saving to localStorage key "${key}":`, error);
  // アプリは動作し続ける（メモリ上のみで動作）
}
```

#### パターン1-2: 破損したJSONデータ
**状況**: 手動編集、バグ、データ移行失敗
```typescript
// 対策: JSON.parseの失敗時はinitialValueを返す
try {
  return item ? JSON.parse(item) : initialValue;
} catch (error) {
  console.error(`Error loading from localStorage key "${key}":`, error);
  return initialValue; // デフォルト値で続行
}
```

### 2. 型安全性の失敗

#### パターン2-1: 不正なPriority値
**状況**: localStorageに古いデータ形式が残っている
```typescript
// 現状: 型定義のみで実行時チェックなし
type Priority = 'high' | 'medium' | 'low';

// 対策案: バリデーション関数の追加
function isValidPriority(value: unknown): value is Priority {
  return ['high', 'medium', 'low'].includes(value as string);
}

// または: Zodなどのスキーマバリデーションライブラリ使用
```

#### パターン2-2: 日付フォーマットの不整合
**状況**: 手動入力、異なるロケールのブラウザ
```typescript
// 対策: dateHelpers.tsでバリデーション
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
```

### 3. React状態管理の失敗

#### パターン3-1: 編集中に元のTODOが削除される
**状況**: 複数タブで同時操作、または編集中に別ユーザーが削除
```typescript
// 現状: 対策なし
// 影響: 編集保存時にエラーは出ないが、削除されたTODOが復活する

// 対策案:
const handleEditTodo = (id: string, title: string, priority: Priority, dueDate: string | null) => {
  const exists = todos.find(todo => todo.id === id);
  if (!exists) {
    alert('このTODOは既に削除されています');
    setEditingId(null);
    return;
  }
  updateTodo(id, { title, priority, dueDate });
};
```

#### パターン3-2: 大量のTODO追加によるパフォーマンス低下
**状況**: 数千件のTODOが登録される
```typescript
// 現状: すべてのTODOを一度にレンダリング
// 対策案:
// 1. 仮想スクロール（react-windowなど）の導入
// 2. ページネーション
// 3. 表示件数の制限
```

### 4. UI/UX関連の失敗

#### パターン4-1: フォーム送信の二重実行
**状況**: ユーザーが送信ボタンを連打
```typescript
// 現状: 対策なし
// 対策案: 送信中フラグの追加
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  setIsSubmitting(true);
  try {
    onSubmit(title.trim(), priority, dueDate || null);
  } finally {
    setIsSubmitting(false);
  }
};
```

#### パターン4-2: 期限切れTODOの視認性
**状況**: 期限切れTODOが大量にあるが気づかない
```typescript
// 現状: 赤文字で表示のみ
// 対策案:
// 1. 期限切れTODOを自動的に上部に表示
// 2. 通知バナーの追加
// 3. 期限1日前のリマインダー機能
```

### 5. ビルド・デプロイの失敗

#### パターン5-1: 型エラーがCI/CDで検出される
**状況**: ローカルでは動作するがビルド時にエラー
```bash
# 対策: pre-commitフックで型チェック（既に実装済み）
npx tsc --noEmit

# さらに: GitHub Actionsでもダブルチェック
- name: Type check
  run: npm run build
```

#### パターン5-2: ESLintルール違反
**状況**: コミット前チェックをスキップして直接プッシュ
```bash
# 対策: GitHub Actionsでも検証（推奨）
- name: Lint
  run: npm run lint
```

## この変更のリスクが高い箇所 TOP3

### 🔴 1位: useLocalStorage.ts - データ永続化の核

**リスクレベル**: 高

**理由**:
- **単一障害点**: すべてのTODOデータの保存・読み込みを担当
- **データ損失の可能性**: バグがあるとユーザーの全データが消失
- **デバッグ困難**: localStorage の問題は環境依存で再現が難しい

**影響範囲**:
- すべてのCRUD操作
- ページリロード後のデータ復元
- クロスタブ同期

**具体的なリスクシナリオ**:
```typescript
// 危険な変更例
const setValue = (value: T | ((val: T) => T)) => {
  const valueToStore = value instanceof Function ? value(storedValue) : value;
  setStoredValue(valueToStore);
  // ❌ ここでエラーが起きるとReact状態とlocalStorageが不整合
  window.localStorage.setItem(key, JSON.stringify(valueToStore));
};
```

**推奨される変更プロセス**:
1. 変更前に既存データのバックアップ機能を追加
2. ユニットテストを書いてから変更
3. localStorage無効環境でのフォールバック動作を確認
4. 段階的ロールアウト（カナリアリリース）

### 🟠 2位: useTodos.ts - ビジネスロジックの中枢

**リスクレベル**: 中〜高

**理由**:
- **ビジネスロジックの集約点**: すべてのTODO操作が集まる
- **状態管理の複雑性**: フィルタリング、ソート、CRUD が絡み合う
- **型安全性への依存**: 型エラーで実行時バグが発生しうる

**影響範囲**:
- TODO の追加、更新、削除、完了切り替え
- フィルタリングとソート
- タイムスタンプ管理

**具体的なリスクシナリオ**:
```typescript
// 危険な変更例
const updateTodo = useCallback((id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
  setTodos(prev =>
    prev.map(todo =>
      todo.id === id
        ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
        : todo
    )
  );
}, [setTodos]);

// ❌ updatesに不正なデータが入るとTodo型が壊れる
// 例: updateTodo(id, { priority: 'invalid' as Priority })
```

**推奨される変更プロセス**:
1. 既存の動作をテストで保護
2. 1つの操作ずつ変更（addTodo、updateTodoを同時に変更しない）
3. TypeScript strict モードで型チェック
4. 実データでの動作確認

### 🟡 3位: TodoItem.tsx - UIとロジックの境界

**リスクレベル**: 中

**理由**:
- **編集モードの状態管理**: keyによるコンポーネントリセットに依存
- **複数のイベントハンドラー**: 7つのpropsで操作が分散
- **表示ロジックの複雑性**: 完了、編集、期限切れの状態を組み合わせ

**影響範囲**:
- TODO項目の表示
- インライン編集機能
- 完了・削除・編集開始のトリガー

**具体的なリスクシナリオ**:
```typescript
// 危険な変更例
if (isEditing) {
  return (
    <div className="todo-item editing">
      <TodoForm
        key={todo.id}  // ❌ このkeyを削除するとuseEffectが必要になる
        onSubmit={handleEdit}
        initialData={{...}}
        isEditing
      />
    </div>
  );
}
```

**推奨される変更プロセス**:
1. 編集モードと表示モードを別コンポーネントに分離することを検討
2. propsの数を減らす（関数をまとめる）
3. ビジュアルリグレッションテストの導入
4. アクセシビリティテスト（キーボード操作、スクリーンリーダー）

## 最小構成案（抽象化を外した版）と比較

### 現在の設計（抽象化あり）

```typescript
// 階層構造
App (状態オーケストレーション)
  ├─ useTodos (ビジネスロジック)
  │   └─ useLocalStorage (永続化)
  ├─ TodoForm (入力UI)
  ├─ TodoFilter (フィルターUI)
  ├─ TodoStats (統計UI)
  └─ TodoList
      └─ TodoItem (個別TODO UI)

// ファイル数: 19ファイル
// コード行数: 約800行
```

**メリット**:
- ✅ ロジックとUIの分離
- ✅ 再利用可能なフック
- ✅ 単一責任の原則
- ✅ テストしやすい

**デメリット**:
- ❌ 初見での理解コスト
- ❌ ファイル間の移動が必要
- ❌ 小規模アプリには過剰

### 最小構成案（抽象化なし）

```typescript
// App.tsx - すべてを1ファイルに集約
import { useState, useEffect } from 'react';
import './App.css';

type Priority = 'high' | 'medium' | 'low';
type FilterType = 'all' | 'active' | 'completed';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function App() {
  // ===== 状態管理 =====
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem('todos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [filter, setFilter] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // ===== 永続化 =====
  useEffect(() => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [todos]);

  // ===== TODO操作 =====
  const addTodo = (title: string, priority: Priority, dueDate: string | null) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTodos([...todos, newTodo]);
  };

  const updateTodo = (id: string, title: string, priority: Priority, dueDate: string | null) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, title, priority, dueDate, updatedAt: new Date().toISOString() }
        : todo
    ));
  };

  const toggleComplete = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
        : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // ===== フィルタリング =====
  const filteredTodos = todos
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.priority] - order[a.priority];
    });

  // ===== 統計 =====
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;

  // ===== レンダリング =====
  return (
    <div className="app">
      <h1>📝 TODOアプリ</h1>

      {/* フォーム */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        addTodo(
          formData.get('title') as string,
          formData.get('priority') as Priority,
          formData.get('dueDate') as string || null
        );
        e.currentTarget.reset();
      }}>
        <input name="title" placeholder="何をしますか？" required />
        <select name="priority">
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
        <input name="dueDate" type="date" />
        <button type="submit">追加</button>
      </form>

      {/* 統計 */}
      <div>合計: {total} | 未完了: {active} | 完了: {completed}</div>

      {/* フィルター */}
      <div>
        <button onClick={() => setFilter('all')}>すべて ({total})</button>
        <button onClick={() => setFilter('active')}>未完了 ({active})</button>
        <button onClick={() => setFilter('completed')}>完了済み ({completed})</button>
      </div>

      {/* TODOリスト */}
      {filteredTodos.length === 0 ? (
        <p>まだTODOがありません</p>
      ) : (
        <ul>
          {filteredTodos.map(todo => (
            <li key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleComplete(todo.id)}
              />
              <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                {todo.title}
              </span>
              <span>優先度: {todo.priority}</span>
              {todo.dueDate && <span>期限: {todo.dueDate}</span>}
              <button onClick={() => setEditingId(todo.id)}>編集</button>
              <button onClick={() => deleteTodo(todo.id)}>削除</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
```

**ファイル数**: 2ファイル（App.tsx + App.css）
**コード行数**: 約150行

### 比較表

| 観点 | 現在の設計（抽象化あり） | 最小構成案（抽象化なし） |
|------|------------------------|----------------------|
| **ファイル数** | 19ファイル | 2ファイル |
| **コード行数** | 約800行 | 約150行 |
| **理解しやすさ（初見）** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **保守性（長期）** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **テストしやすさ** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **拡張性** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **パフォーマンス** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **学習コスト** | 高い | 低い |
| **適用規模** | 中〜大規模 | 小規模 |

### いつ最小構成を選ぶべきか

**最小構成が適切な場合**:
- ✅ プロトタイプ・PoC
- ✅ 1週間以内の使い捨てアプリ
- ✅ チュートリアル・教育目的
- ✅ チームメンバーが1〜2人
- ✅ 機能追加の予定なし

**現在の設計が適切な場合**:
- ✅ 長期運用予定（6ヶ月以上）
- ✅ チームでの開発
- ✅ 機能拡張の可能性が高い
- ✅ テストカバレッジが必要
- ✅ コードレビューの文化がある

### 段階的移行パス

```
Phase 1: 最小構成でスタート（1ファイル）
  ↓ 機能が増えてきた
Phase 2: ロジックを分離（App + hooks）
  ↓ UIが複雑になってきた
Phase 3: コンポーネント分割（現在の設計）
  ↓ さらにスケール
Phase 4: 状態管理ライブラリ導入（Redux/Zustand）
```

## まとめ

このTODOアプリは、**学習用・中規模チーム開発**を想定した設計です。

**トレードオフの選択**:
- 初期の理解コスト ＜ 長期的な保守性
- ファイル数の多さ ＜ 単一責任の明確さ
- 抽象化の複雑さ ＜ テストのしやすさ

**次のステップ**:
1. ユニットテストの追加（特にuseLocalStorage、useTodos）
2. E2Eテストの導入（Playwright/Cypress）
3. エラーバウンダリの追加
4. パフォーマンス測定（React DevTools Profiler）
5. アクセシビリティ監査（axe-core）
