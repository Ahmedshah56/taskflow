# TaskFlow ⚡

A clean, responsive task manager built to demonstrate modern React patterns — Hooks, Context API, custom hooks, and live REST API integration.

**Live Demo → [taskflow-ahmed.netlify.app](https://taskflow54.netlify.app/)**

---

## Tech Stack

- **React 18** — functional components throughout
- **useReducer + Context API** — global state management without Redux
- **Custom Hooks** — `useTasks()`, `useDailyQuote()` (REST API)
- **LocalStorage** — tasks persist across sessions
- **Vite** — fast dev server and build tool
- **CSS3** — fully responsive, mobile-first, no UI library

---

## Features

- ✅ Add, complete, and delete tasks
- 🎯 Priority levels — High, Medium, Low
- 🔍 Filter by All / Active / Completed
- 📊 Live completion progress arc dial
- 💬 Daily motivational quote via REST API
- 💾 LocalStorage persistence
- 📱 Mobile responsive (360px and up)

---

## React Concepts Demonstrated

| Concept | Where Used |
|---|---|
| `useState` | Form input, quote loading state |
| `useEffect` | LocalStorage sync, API fetch on mount |
| `useReducer` | Global task state (add, toggle, delete, filter) |
| `useContext` | Consume TaskContext across components |
| `useCallback` | Memoized action dispatchers |
| `useMemo` | Filtered task list, context value |
| Custom Hook | `useTasks()`, `useDailyQuote()` |
| REST API | `fetch()` — quotable.io API |

---

## Getting Started

```bash
git clone https://github.com/Ahmedshah56/taskflow.git
cd taskflow
npm install
npm run dev
```

---

## Project Structure

```
src/
└── App.jsx        # All components, context, hooks, and styles
```

---

## Author

**Syed Ahmed Ali Shah**  
Frontend Developer · React · Tailwind CSS · JavaScript  
[Portfolio](https://ahmedshah-portfolio.netlify.app) · [GitHub](https://github.com/Ahmedshah56) · [Fiverr](https://fiverr.com/pixelguru2)
