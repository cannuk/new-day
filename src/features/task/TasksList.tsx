import { FC } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Task } from './Task';
import { TaskType, Task as iTask, taskSelectors } from './taskSlice';

type TasksListProps = {
  type: TaskType;
  dayId: string;
};

export const TasksList: FC<TasksListProps> = ({ type, dayId }) => {
  const tasks = useSelector((state: RootState) => {
    return taskSelectors.selectAll(state);
  });
  const listTasks = tasks.filter((t: iTask) => t.type === type);
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
