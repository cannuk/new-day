import styled from '@emotion/styled';
import { nanoid } from 'nanoid';
import React, { FC, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { Flex, Input, Checkbox, Label, Box } from 'theme-ui';
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

const ST: FC<TaskProps> = ({ taskId, taskType, className, dayId }) => {
  const taskSelector = useMemo(() => taskSelectors.selectById, []);
  const task = useSelector((state: RootState) => taskSelector(state, taskId), shallowEqual);

  const [taskValue, setTaskValue] = useState('');
  const [complete, setComplete] = useState(false);
  const handleChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => setTaskValue(ev.target.value),
    []
  );
  const { updateTask, addTask, addDayTask } = useFirestoreActions();
  const inputEl = useRef<any>(null);
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
      inputEl.current.blur();
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
    <StyledFlex className={className} paddingBottom={3}>
      <StyledLabel>
        <Checkbox checked={complete} onChange={handleCheck} />
      </StyledLabel>
      <StyledInput
        ref={inputEl}
        onBlur={handleBlur}
        onKeyDown={handleKeypress}
        onChange={handleChange}
        bg={complete ? 'background' : 'muted'}
        color={complete ? 'primary' : 'text'}
        sx={{ textDecoration: complete ? 'line-through' : 'none' }}
        value={taskValue}
      />
      {task ? <TaskMenu task={task as iTask} /> : <SpaceBox />}
    </StyledFlex>
  );
};

export const StaticTask = styled(ST)``;

const StyledInput = styled(Input)`
  border: none;
`;

const StyledFlex = styled(Flex)`
  align-items: center;
`;

const StyledLabel = styled(Label)`
  width: auto;
`;
const SpaceBox = styled(Box)`
  width: 32px;
`;
