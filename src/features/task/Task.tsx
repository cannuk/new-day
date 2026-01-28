import React, { FC, useState, useCallback, useRef, useEffect } from 'react';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';
import { TaskMenu } from './taskMenu';
import { Task as iTask } from './taskSlice';

type TaskProps = {
  task: iTask;
  dayId: string;
};

export const Task: FC<TaskProps> = ({ task }) => {
  const [taskValue, setTaskValue] = useState('');
  const [complete, setComplete] = useState(false);
  const handleChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => setTaskValue(ev.target.value),
    []
  );
  const { updateTask } = useFirestoreActions();
  const inputEl = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setComplete(task.complete);
    setTaskValue(task.text || '');
  }, [task]);
  const handleBlur = useCallback(() => {
    if ((taskValue || '').trim() !== '') {
      updateTask({ id: task.id, text: taskValue });
    }
  }, [task.id, taskValue, updateTask]);
  const handleKeypress = useCallback((ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter') {
      inputEl.current?.blur();
    }
  }, []);
  const handleCheck = useCallback(() => {
    const nTask = {
      id: task.id,
      complete: !complete,
      completed: !complete ? new Date().toString() : undefined,
    };
    updateTask(nTask);
  }, [complete, task.id, updateTask]);

  return (
    <div className="flex items-center gap-3 py-2 group">
      <input
        type="checkbox"
        className={`checkbox checkbox-sm ${complete ? 'checkbox-success' : 'checkbox-primary'}`}
        checked={complete}
        onChange={handleCheck}
      />
      <input
        ref={inputEl}
        type="text"
        className={`input input-sm input-ghost flex-1 focus:input-bordered ${
          complete ? 'text-base-content/50 line-through' : ''
        }`}
        placeholder="Task description..."
        onBlur={handleBlur}
        onKeyDown={handleKeypress}
        onChange={handleChange}
        value={taskValue}
      />
      <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <TaskMenu task={task} />
      </div>
    </div>
  );
};
