import { FC } from 'react';
import { useSelector } from 'react-redux';
import { Task } from './Task';
import { TaskType, Task as iTask, getTasksByDay } from './taskSlice';

type TasksListProps = {
  type: TaskType;
  dayId: string;
};

export const TasksList: FC<TasksListProps> = ({ type, dayId }) => {
  // Get only tasks associated with this specific day
  const dayTasks = useSelector(getTasksByDay(dayId)) as iTask[];
  const listTasks = dayTasks.filter((t: iTask) => t.type === type);
  listTasks.sort((a, b) => {
    if ((a.complete && b.complete) || (!a.complete && !b.complete)) {
      return 0;
    }
    if (a.complete) {
      return 1;
    }
    return -1;
  });
  return (
    <div>
      {listTasks.map((t: iTask) => (
        <Task key={t.id} task={t} dayId={dayId} />
      ))}
    </div>
  );
};
