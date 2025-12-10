import { useCallback, FC } from 'react';
import { useSelector } from 'react-redux';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';
import { Task as iTask, TaskType, getByType } from './taskSlice';

type TaskMenuProps = {
  task: iTask;
};

export const TaskMenu: FC<TaskMenuProps> = ({ task }) => {
  const { updateTask, removeTask } = useFirestoreActions();
  const mostImportantTasks = useSelector(getByType(TaskType.Most)) as iTask[];

  const moveOther = useCallback(() => {
    updateTask({ ...task, type: TaskType.Other });
  }, [updateTask, task]);

  const moveQuick = useCallback(() => {
    updateTask({ ...task, type: TaskType.Quick });
  }, [updateTask, task]);

  const movePDP = useCallback(() => {
    updateTask({ ...task, type: TaskType.PDP });
  }, [updateTask, task]);

  const moveMostImportant = useCallback(() => {
    // If there are already 3 Most Important tasks, move the last one to Other
    if (mostImportantTasks.length >= 3) {
      const lastMost = mostImportantTasks[mostImportantTasks.length - 1];
      updateTask({ ...lastMost, type: TaskType.Other });
    }
    // Move this task to Most Important
    updateTask({ ...task, type: TaskType.Most });
  }, [updateTask, task, mostImportantTasks]);

  const onDelete = useCallback(() => removeTask(task.id), [removeTask, task.id]);

  const closeDropdown = () => {
    const elem = document.activeElement as HTMLElement;
    elem?.blur();
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
        <svg
          fill="currentColor"
          width="16"
          height="16"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm-2 8a2 2 0 100-4 2 2 0 000 4z"
          />
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg"
      >
        {task.type !== TaskType.Most && (
          <li>
            <button
              onClick={() => {
                onDelete();
                closeDropdown();
              }}
              className="text-error"
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </li>
        )}
        {task.type !== TaskType.Most && (
          <li>
            <button
              onClick={() => {
                moveMostImportant();
                closeDropdown();
              }}
            >
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              Move to Most Important
            </button>
          </li>
        )}
        {task.type !== TaskType.Other && (
          <li>
            <button
              onClick={() => {
                moveOther();
                closeDropdown();
              }}
            >
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Move to Other
            </button>
          </li>
        )}
        {task.type !== TaskType.Quick && (
          <li>
            <button
              onClick={() => {
                moveQuick();
                closeDropdown();
              }}
            >
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Move to Quick
            </button>
          </li>
        )}
        {task.type !== TaskType.PDP && (
          <li>
            <button
              onClick={() => {
                movePDP();
                closeDropdown();
              }}
            >
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Move to PDP
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};
