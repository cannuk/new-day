import React, { FC, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import { Flex, Input, Box } from 'theme-ui';
import { nanoid } from 'nanoid';

import { TaskType, Task, taskAdded } from './taskSlice';

type NewTaskProps = {
  taskType: TaskType;
};

export const NewTask: FC<NewTaskProps> = ({ taskType }) => {
  const [textVal, setTextVal] = useState('');
  const dispatch = useDispatch();
  const handleChange = useCallback((ev) => setTextVal(ev.target.value), []);
  const onKeypress = useCallback(
    (ev) => {
      setTextVal(ev.target.value);
      if (ev.key === 'Enter' && textVal.trim() !== '') {
        let task: Task = {
          id: nanoid(),
          text: textVal,
          created: new Date().toString(),
          updated: new Date().toString(),
          complete: false,
          type: taskType,
        };
        setTextVal('');
        dispatch(taskAdded(task));
      }
    },
    [dispatch, taskType, textVal]
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
