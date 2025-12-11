import { nanoid } from 'nanoid';
import React, { FC, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { RootState } from '../../app/store';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';
import { DayTask } from '../day/daySlice';
import { TaskMenu } from './taskMenu';
import { taskSelectors, TaskType, Task as iTask } from './taskSlice';

type TaskProps = {
  taskId: string;
  taskType: TaskType;
  className?: string;
  dayId: string;
};

export const StaticTask: FC<TaskProps> = ({ taskId, taskType, className, dayId }) => {
  const taskSelector = useMemo(() => taskSelectors.selectById, []);
  const task = useSelector((state: RootState) => taskSelector(state, taskId), shallowEqual);

  const [taskValue, setTaskValue] = useState('');
  const [complete, setComplete] = useState(false);
  const handleChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => setTaskValue(ev.target.value),
    []
  );
  const { updateTask, addTask, addDayTask } = useFirestoreActions();
  const inputEl = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (task) {
      setComplete(task.complete);
      setTaskValue(task.text || '');
    }
  }, [task]);
  const handleBlur = useCallback(() => {
    if ((taskValue || '').trim() !== '') {
      if (!task) {
        const newTask = {
          id: taskId,
          text: taskValue,
          complete: false,
          created: new Date().toString(),
          updated: new Date().toString(),
          type: taskType,
          originDayId: dayId,
        };
        const dayTask: DayTask = {
          id: nanoid(),
          dayId,
          taskId,
          created: new Date().toString(),
        };
        addTask(newTask);
        addDayTask(dayTask);
      } else {
        updateTask({ ...task, text: taskValue });
      }
    }
  }, [dayId, task, taskId, taskType, taskValue, addTask, addDayTask, updateTask]);
  const handleKeypress = useCallback((ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter') {
      inputEl.current?.blur();
    }
  }, []);
  const handleCheck = useCallback(() => {
    const nTask = {
      id: taskId,
      complete: !complete,
      completed: !complete ? new Date().toString() : undefined,
    };
    updateTask(nTask);
  }, [complete, taskId, updateTask]);

  return (
    <div className={`flex items-center gap-3 py-1 group ${className || ''}`}>
      <input
        type="checkbox"
        className={`checkbox ${complete ? 'checkbox-success' : 'checkbox-primary'}`}
        checked={complete}
        onChange={handleCheck}
      />
      <input
        ref={inputEl}
        type="text"
        className={`input input-ghost flex-1 focus:input-bordered ${
          complete ? 'text-base-content/50 line-through' : ''
        }`}
        placeholder="What's most important today?"
        onBlur={handleBlur}
        onKeyDown={handleKeypress}
        onChange={handleChange}
        value={taskValue}
      />
      {task ? (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <TaskMenu task={task as iTask} />
        </div>
      ) : (
        <div className="w-8" />
      )}
    </div>
  );
};
