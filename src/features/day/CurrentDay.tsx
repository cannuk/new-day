import { nanoid } from 'nanoid';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';
import { DayTask, getCurrent } from '../day/daySlice';
import { taskSelectors, Task, TaskType } from '../task/taskSlice';
import { Day } from './Day';

export const CurrentDay = () => {
  const current = useSelector(getCurrent);
  if (!current) {
    return <CreateNewDay />;
  }
  return <Day dayId={current.id} />;
};

const CreateNewDay = () => {
  const tasks = useSelector(taskSelectors.selectAll) as Task[];
  const { addDay, addTask, addDayTask, updateTask } = useFirestoreActions();

  const onClick = useCallback(() => {
    const dayId = nanoid();

    // Create the day
    addDay({ id: dayId, created: new Date().toString() });

    // Create template tasks and dayTasks
    const taskTemplates: Task[] = [];
    const dayTaskTemplates: DayTask[] = [];

    // Get existing Most Important tasks
    const existingMostImportant = tasks.filter((t: Task) => t.type === TaskType.Most);
    const otherTasks = tasks.filter((t: Task) => t.type !== TaskType.Most);

    // Keep first 3 Most Important, convert extras to Other
    const mostToKeep = existingMostImportant.slice(0, 3);
    const mostToConvert = existingMostImportant.slice(3);

    // Convert extra Most Important tasks to Other
    mostToConvert.forEach((t: Task) => {
      updateTask({ ...t, type: TaskType.Other });
    });

    // Create new Most Important tasks if we have fewer than 3
    const numToCreate = 3 - mostToKeep.length;
    for (let x = 0; x < numToCreate; x++) {
      const taskId = nanoid();
      const task: Task = {
        id: taskId,
        text: '',
        created: new Date().toString(),
        updated: new Date().toString(),
        complete: false,
        type: TaskType.Most,
        originDayId: dayId,
      };
      const dayTask: DayTask = {
        id: nanoid(),
        dayId,
        taskId,
        created: new Date().toString(),
      };
      taskTemplates.push(task);
      dayTaskTemplates.push(dayTask);
    }

    // Add dayTasks for existing Most Important tasks we're keeping
    mostToKeep.forEach((t: Task) => {
      dayTaskTemplates.push({
        id: nanoid(),
        dayId,
        taskId: t.id,
        created: new Date().toString(),
      });
    });

    // Add all new tasks
    taskTemplates.forEach((task) => addTask(task));

    // Add all dayTasks
    dayTaskTemplates.forEach((dayTask) => addDayTask(dayTask));

    // Migrate other existing tasks (and converted ones) to this day
    [...otherTasks, ...mostToConvert].forEach((t: Task) => {
      addDayTask({ id: nanoid(), dayId, taskId: t.id, created: new Date().toString() });
    });
  }, [tasks, addDay, addTask, addDayTask, updateTask]);

  return (
    <button className="btn btn-primary" onClick={onClick}>
      Add a Day
    </button>
  );
};
