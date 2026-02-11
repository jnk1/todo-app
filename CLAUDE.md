# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## 重要：コミュニケーション言語

**ユーザーとのやりとりは原則として日本語で行うこと。**コード、コメント、コミットメッセージは英語で記述しますが、説明や質問への回答は日本語で返してください。

## Commitメッセージルール (Conventional Commits)

コミットメッセージは **Conventional Commits** を参考にして記述する。

基本フォーマット:

```txt
<type>(<scope>): <subject>
```

- type: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
- scope: 変更対象（任意。例: api, web, auth, deps）
- subject: 命令形・短く（例: "add", "fix", "update" など）。末尾にピリオドは付けない。

例:

- feat(auth): add OAuth login
- fix(api): handle empty payload
- refactor(web): simplify state management
- docs: update setup instructions
- chore(deps): bump requests to 2.x

破壊的変更（Breaking change）がある場合:

- feat!: drop legacy endpoint
- refactor(api)!: rename userId to user_id
（必要に応じて本文に BREAKING CHANGE: を書く）

補足:

- 挙動が変わる変更は refactor ではなく feat/fix とする（外から見える価値で分類する）

## プロジェクト概要

優先度管理、期限設定、フィルタリング、localStorage永続化機能を持つReact TODOアプリケーション。React 18、TypeScript、Viteで構築されています。

## 開発コマンド

```bash
# 開発サーバー起動 (http://localhost:5173)
npm run dev

# 本番ビルド (dist/に出力)
npm run build

# ESLint実行
npm run lint

# 本番ビルドのプレビュー
npm preview

# 型チェック（ファイル出力なし）
npx tsc --noEmit
```

## アーキテクチャ

### データフローパターン

このアプリケーションは**カスタムフック駆動アーキテクチャ**に従い、単方向データフローを採用しています：

```text
useLocalStorage (汎用localStorage同期)
    ↓
useTodos (ビジネスロジック層)
    ↓
App.tsx (状態オーケストレーション)
    ↓
Components (propsを介したプレゼンテーション)
```

**重要な原則**：ビジネスロジックは`hooks/useTodos.ts`に配置し、コンポーネントには置かない。コンポーネントはpropsを介してデータとコールバックを受け取り、プレゼンテーションに専念する。

### 状態管理

- **グローバルTODO状態**：`useTodos`フックで管理され、localStorageに自動同期
- **UI状態**：App.tsxにローカル（フィルター選択、編集中ID）
- **コンポーネント状態**：フォーム入力とローカルUIのみ（例：TodoForm）

### カスタムフック

#### `useLocalStorage<T>`

localStorageとの同期を行う汎用フック。`storage`イベントリスナーを使ったクロスタブ更新に対応。`useTodos`の基盤として使用。

#### `useTodos`

以下を提供する中核的なビジネスロジックハブ：

- CRUD操作（addTodo、updateTodo、deleteTodo、toggleComplete）
- `getFilteredTodos`経由でフィルタリング・ソート済みデータを提供
- 自動的なlocalStorage永続化とタイムスタンプ管理

### コンポーネントパターン

#### 編集モードパターン

TodoItemは、App.tsxで制御されるブール値フラグ（`isEditing`）を使用してインライン編集を実装。編集中はTodoFormを表示ビューの代わりにレンダリング。これにより編集状態を一元管理。

#### フィルターアーキテクチャ

フィルタリングはApp階層で`useTodos`の`getFilteredTodos`を使用して実行。TodoFilterコンポーネントはフィルター変更のトリガーのみを担当し、フィルタリング処理自体は行わない。

### 型システム

すべてのドメイン型は`types/todo.ts`で定義：

- `Todo` interface（ISO 8601タイムスタンプを持つコアデータモデル）
- `Priority` type ('high' | 'medium' | 'low')
- `FilterType` type ('all' | 'active' | 'completed')

`utils/`のユーティリティはこれらの型を使用してフィルタリング、ソート、日付操作を実行。

### ユーティリティの構成

- **`utils/todoHelpers.ts`**：TODOのフィルタリング、ソート、期限切れ検出のための純粋関数
- **`utils/dateHelpers.ts`**：日付フォーマット、バリデーション、比較のヘルパー

これらはステートレスなユーティリティで、独立してテスト可能。

### スタイリング規約

各コンポーネントに同じ場所に配置されたCSSファイルがある。グローバルスタイルとCSS変数（色、間隔）は`index.css`に定義。デザインは以下を使用：

- テーマ用のCSS変数（例：`--primary-color`、`--priority-high-bg`）
- レスポンシブブレークポイント：768px
- CSS-in-JSやプリプロセッサは不使用

### データ永続化

localStorageキー：`"todos"`
フォーマット：TodoオブジェクトのJSON配列

`useLocalStorage`内の`storage`イベントリスナーがクロスタブ同期を可能にする。あるタブでの変更が他のタブに自動的に反映される。

## 重要な実装ノート

### ID生成

`crypto.randomUUID()`を使用、古いブラウザ向けに`Date.now() + random`へのフォールバックあり。

### タイムスタンプ管理

すべてのTodo更新時に`updatedAt`が現在のISOタイムスタンプに自動設定される。`createdAt`は作成後は不変。

### 期限切れロジック

TODOが期限切れとなる条件：`!completed && dueDate < today`。`utils/todoHelpers.ts`内で`isOverdueTodo()`として実装。

### 優先度ソート

TODOは高→中→低の順でソート。`todoHelpers.ts`内の`priorityOrder`マッピングを使用。フィルタリング後に適用。

## Vite固有の動作

- **Hot Module Replacement (HMR)**：React コンポーネントはページ全体のリロードなしで更新
- **キャッシュ場所**：`node_modules/.vite/` - 古いモジュールエラーが出た場合はクリア
- **TypeScript**：Viteは型チェックを行わない。検証には`npx tsc --noEmit`を別途実行
