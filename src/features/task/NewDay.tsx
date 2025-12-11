import { nanoid } from 'nanoid';
import { FC, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';
import { DayTask } from '../day/daySlice';
import { getTasksByDay, TaskType, Task } from './taskSlice';

type NewDayProps = {
  currentDayId: string;
};

export const NewDay: FC<NewDayProps> = ({ currentDayId }) => {
  const { addDay, addDayTask } = useFirestoreActions();
  // Only get tasks from the current day
  const currentDayTasks = useSelector(getTasksByDay(currentDayId)) as Task[];
  const incompleteTasks = currentDayTasks.filter((t: Task) => !t.complete);

  const handleClick = useCallback(() => {
    // Create a new day
    const newDayId = nanoid();
    addDay({ id: newDayId, created: new Date().toString() });

    // Incomplete Most Important tasks carry over to new day
    const incompleteMostTasks = incompleteTasks.filter((t: Task) => t.type === TaskType.Most);

    // Incomplete non-Most tasks carry over to new day
    const incompleteOtherTasks = incompleteTasks.filter((t: Task) => t.type !== TaskType.Most);

    // Create dayTasks for all incomplete tasks that should be in the new day
    const allTasksForNewDay = [...incompleteMostTasks, ...incompleteOtherTasks];
    allTasksForNewDay.forEach((task: Task) => {
      const dayTask: DayTask = {
        id: nanoid(),
        dayId: newDayId,
        taskId: task.id,
        created: new Date().toString(),
      };
      addDayTask(dayTask);
    });

    // Completed tasks stay in their original day (no deletion or updates needed)
  }, [incompleteTasks, addDay, addDayTask]);
  return (
    <button className="btn btn-primary btn-sm gap-2" onClick={handleClick}>
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
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      New Day
    </button>
  );
};
