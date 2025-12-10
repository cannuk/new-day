import React, { FC, useCallback, useState } from 'react';
import styled from '@emotion/styled';
import { Flex, Input, Box } from 'theme-ui';
import { nanoid } from 'nanoid';

import { TaskType, Task } from './taskSlice';
import { DayTask } from '../day/daySlice';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';

type NewTaskProps = {
  taskType: TaskType;
  dayId: string;
};

export const NewTask: FC<NewTaskProps> = ({ taskType, dayId }) => {
  const [textVal, setTextVal] = useState('');
  const { addTask, addDayTask } = useFirestoreActions();
  const handleChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => setTextVal(ev.target.value), []);
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
