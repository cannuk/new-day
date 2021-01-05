import React, { FC, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import { useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import { RootState } from '../../app/store';
import { taskUpdated, taskSelectors, TaskType, tasksUpdated } from './taskSlice';
import { Flex, Input, Checkbox, Label, Box } from 'theme-ui';

type TaskProps = {
  taskId: string;
  taskType: TaskType;
  className?: string;
};

const ST: FC<TaskProps> = ({ taskId, taskType, className }) => {
  const taskSelector = useMemo(() => taskSelectors.selectById, []);
  let task = useSelector((state: RootState) => taskSelector(state, taskId), shallowEqual);

  const [taskValue, setTaskValue] = useState('');
  const [complete, setComplete] = useState(false);
  const handleChange = useCallback((ev) => setTaskValue(ev.target.value), []);
  const dispatch = useDispatch();
  const inputEl = useRef<any>(null);
  const updateTask = useCallback((updatedTask: any) => dispatch(taskUpdated(updatedTask)), [dispatch]);
  useEffect(() => {
    if (task) {
      setComplete(task.complete);
      setTaskValue(task.text);
    }
  }, [task]);
  const handleBlur = useCallback(
    (ev) => {
      if (taskValue.trim() !== '') {
        let update;
        if (!task) {
          update = {
            id: taskId,
            text: taskValue,
            complete: false,
            created: new Date().toString(),
            updated: new Date().toString(),
            type: taskType,
          };
        } else {
          update = { ...task, text: taskValue };
        }
        updateTask(update);
      }
    },
    [task, taskId, taskType, taskValue, updateTask]
  );
  const handleKeypress = useCallback((ev) => {
    if (ev.key === 'Enter') {
      inputEl.current.blur();
    }
  }, []);
  const handleCheck = useCallback(
    (ev) => {
      const nTask = {
        id: taskId,
        complete: !complete,
        completed: !complete ? new Date().toString() : null,
      };
      updateTask(nTask);
    },
    [complete, taskId, updateTask]
  );
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
      <SpaceBox />
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
