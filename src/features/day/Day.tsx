import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { UserSettings } from '../auth/UserSettings';
import { NewDay } from '../task/NewDay';
import { NewTask } from '../task/NewTask';
import { StaticTask } from '../task/StaticTask';
import { TaskType, getTasksByDay, Task as iTask } from '../task/taskSlice';
import { TasksList } from '../task/TasksList';

type MatchProps = {
  dayId: string;
};

export const Day = ({ dayId }: MatchProps) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <span className="text-xl font-bold px-4">New Day</span>
        </div>
        <div className="flex-none gap-2">
          <ThemeSwitcher />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <NewDay />
        </div>
      </div>

      {/* Settings Modal */}
      <UserSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Main Content */}
      <div className="container mx-auto p-4 space-y-6">
        {/* Most Important Section - Full Width, Highlighted */}
        <div className="card bg-base-100card bg-base-100 card-border border-base-300 card-sm">
          <div className="card-body">
            <h2 className="card-title text-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              Most Important
            </h2>
            <MostImportantSection dayId={dayId} />
          </div>
        </div>

        {/* Backlog Section */}
        <div className="card bg-base-100 card-border border-base-300">
          <div className="card-body">
            <h2 className="card-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Backlog
            </h2>
            <TasksList type={TaskType.Other} dayId={dayId} />
            <NewTask taskType={TaskType.Other} dayId={dayId} />
          </div>
        </div>

        {/* Quick and PDP Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Tasks */}
          <div className="card bg-base-100 card-border border-base-300 card-sm">
            <div className="card-body">
              <h2 className="card-title">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Quick
              </h2>
              <TasksList type={TaskType.Quick} dayId={dayId} />
              <NewTask taskType={TaskType.Quick} dayId={dayId} />
            </div>
          </div>

          {/* Pass, Delegate, or Postpone */}
          <div className="card bg-base-100 card-border border-base-300 card-sm">
            <div className="card-body">
              <h2 className="card-title">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Pass, Delegate, or Postpone
              </h2>
              <TasksList type={TaskType.PDP} dayId={dayId} />
              <NewTask taskType={TaskType.PDP} dayId={dayId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemeSwitcher: React.FC = () => {
  const themes = [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
  ];

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        Theme
        <svg
          width="12px"
          height="12px"
          className="inline-block h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content bg-base-300 rounded-box z-50 w-52 p-2 shadow-2xl max-h-96 overflow-y-auto"
      >
        {themes.map((theme) => (
          <li key={theme}>
            <input
              type="radio"
              name="theme-dropdown"
              className="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
              aria-label={theme.charAt(0).toUpperCase() + theme.slice(1)}
              value={theme}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

const MostImportantSection: React.FC<MatchProps> = ({ dayId }) => {
  const tasks = useSelector(getTasksByDay(dayId)) as iTask[];
  const mostImportantTasks = tasks.filter((t: iTask) => t.type === TaskType.Most);

  // Generate stable placeholder IDs for empty slots
  const placeholderIds = React.useMemo(
    () => [`most-${dayId}-slot-0`, `most-${dayId}-slot-1`, `most-${dayId}-slot-2`],
    [dayId]
  );

  // Build slots: first use existing tasks, then fill remaining with placeholders
  const slots = React.useMemo(() => {
    const result: { key: string; taskId: string }[] = [];
    const usedPlaceholders = new Set<string>();

    // First, add all existing tasks
    mostImportantTasks.slice(0, 3).forEach((task) => {
      // Check if this task's ID matches a placeholder pattern
      const placeholderMatch = placeholderIds.find((p: string) => p === task.id);
      if (placeholderMatch) {
        usedPlaceholders.add(placeholderMatch);
      }
      result.push({ key: task.id, taskId: task.id });
    });

    // Fill remaining slots with unused placeholders
    for (const placeholderId of placeholderIds) {
      if (result.length >= 3) break;
      if (!usedPlaceholders.has(placeholderId)) {
        result.push({ key: placeholderId, taskId: placeholderId });
      }
    }

    return result;
  }, [mostImportantTasks, placeholderIds]);

  return (
    <div className="space-y-2">
      {slots.map((slot: { key: string; taskId: string }, index: number) => (
        <div key={slot.key} className="flex items-center gap-2">
          <div className="badge badge-primary badge-lg">{index + 1}</div>
          <div className="flex-1">
            <StaticTask
              taskType={TaskType.Most}
              taskId={slot.taskId}
              dayId={dayId}
              className="text-lg"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
