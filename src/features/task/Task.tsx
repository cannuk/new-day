import React, { FC, useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import { Task as iTask, taskUpdated } from './taskSlice';
import { Flex, Input, Checkbox, Label } from 'theme-ui';

import { TaskMenu } from './taskMenu';

type TaskProps = {
  task: iTask;
  dayId: string;
};
export const Task: FC<TaskProps> = ({ task, dayId }) => {
  const [taskValue, setTaskValue] = useState('');
  const [complete, setComplete] = useState(false);
  const handleChange = useCallback((ev) => setTaskValue(ev.target.value), []);
  const dispatch = useDispatch();
  const inputEl = useRef<any>(null);
  useEffect(() => {
    setComplete(task.complete);
    setTaskValue(task.text);
  }, [task]);
  const updateTask = useCallback((updatedTask: any) => dispatch(taskUpdated(updatedTask)), [dispatch]);
  const handleBlur = useCallback(
    (ev) => {
      if (taskValue.trim() !== '') {
        updateTask({ id: task.id, text: taskValue });
      }
    },
    [task.id, taskValue, updateTask]
  );
  const handleKeypress = useCallback((ev) => {
    if (ev.key === 'Enter') {
      inputEl.current.blur();
    }
  }, []);
  const handleCheck = useCallback(
    (ev) => {
      const nTask = {
        id: task.id,
        complete: !complete,
        completed: !complete ? new Date().toString() : null,
      };
      updateTask(nTask);
    },
    [complete, task.id, updateTask]
  );
  return (
    <StyledFlex paddingBottom={2} paddingTop={2}>
      <StyledLabel>
        <Checkbox checked={complete} onChange={handleCheck} />
      </StyledLabel>
      <StyledInput
        ref={inputEl}
        onBlur={handleBlur}
        onKeyDown={handleKeypress}
        onChange={handleChange}
        bg={complete ? 'background' : 'muted'}
        value={taskValue}
        color={complete ? 'primary' : 'text'}
        sx={{ textDecoration: complete ? 'line-through' : 'none' }}
      />
      <TaskMenu task={task} />
    </StyledFlex>
  );
};

const StyledInput = styled(Input)`
  border: none;
`;

const StyledFlex = styled(Flex)`
  align-items: center;
`;

const StyledLabel = styled(Label)`
  width: auto;
`;
