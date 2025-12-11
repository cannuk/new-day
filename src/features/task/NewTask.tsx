import { nanoid } from 'nanoid';
import { FC, useCallback, useState } from 'react';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';
import { DayTask } from '../day/daySlice';
import { TaskType, Task } from './taskSlice';

type NewTaskProps = {
  taskType: TaskType;
  dayId: string;
};

export const NewTask: FC<NewTaskProps> = ({ taskType, dayId }) => {
  const [textVal, setTextVal] = useState('');
  const { addTask, addDayTask } = useFirestoreActions();
  const handleChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => setTextVal(ev.target.value),
    []
  );
  const onKeypress = useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      setTextVal((ev.target as HTMLInputElement).value);
      if (ev.key === 'Enter' && textVal.trim() !== '') {
        const taskId = nanoid();
        const task: Task = {
          id: taskId,
          text: textVal,
          created: new Date().toString(),
          updated: new Date().toString(),
          complete: false,
          type: taskType,
          originDayId: dayId,
        };
        const dayTask: DayTask = {
          id: nanoid(),
          dayId,
          taskId,
          created: new Date().toString(),
        };
        setTextVal('');
        addTask(task);
        addDayTask(dayTask);
      }
    },
    [dayId, addTask, addDayTask, taskType, textVal]
  );

  return (
    <div className="flex items-center gap-3 py-3 mt-2 border-t border-base-200">
      <div className="w-6 flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-base-content/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <input
        type="text"
        className="input input-sm input-ghost flex-1 focus:input-bordered placeholder:text-base-content/40"
        placeholder="Add a new task... (press Enter)"
        onChange={handleChange}
        onKeyDown={onKeypress}
        value={textVal}
      />
      <div className="w-8" />
    </div>
  );
};
