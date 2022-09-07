import React, { FC, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import { Flex, Input, Box } from 'theme-ui';
import { nanoid } from 'nanoid';

import { TaskType, Task, taskAdded } from './taskSlice';
import { DayTask, dayTaskAdded } from '../day/daySlice';

type NewTaskProps = {
  taskType: TaskType;
  dayId: string;
};

export const NewTask: FC<NewTaskProps> = ({ taskType, dayId }) => {
  const [textVal, setTextVal] = useState('');
  const dispatch = useDispatch();
  const handleChange = useCallback((ev) => setTextVal(ev.target.value), []);
  const onKeypress = useCallback(
    (ev) => {
      setTextVal(ev.target.value);
      if (ev.key === 'Enter' && textVal.trim() !== '') {
        const taskId = nanoid();
        let task: Task = {
          id: taskId,
          text: textVal,
          created: new Date().toString(),
          updated: new Date().toString(),
          complete: false,
          type: taskType,
        };
        let dayTask: DayTask = {
          id: nanoid(),
          dayId,
          taskId,
          created: new Date().toString(),
        };
        setTextVal('');
        dispatch(taskAdded(task));
        dispatch(dayTaskAdded(dayTask));
      }
    },
    [dayId, dispatch, taskType, textVal]
  );

  return (
    <StyledFlex paddingTop={3} paddingBottom={3}>
      <SpaceBox />
      <StyledInput
        backgroundColor="primary"
        placeholder="New Task"
        onChange={handleChange}
        onKeyDown={onKeypress}
        bg="background"
        sx={{ borderColor: 'muted', borderWidth: 2 }}
        value={textVal}
      />
      <SpaceBox />
    </StyledFlex>
  );
};

const StyledInput = styled(Input)``;
const StyledFlex = styled(Flex)`
  align-items: center;
`;
const SpaceBox = styled(Box)`
  width: 32px;
`;
