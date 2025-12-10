import React, { FC } from 'react';
import { useSelector } from 'react-redux';
// import styled from '@emotion/styled';
import { RootState } from '../../app/store';
import { TaskType, Task as iTask, taskSelectors } from './taskSlice';
import { Box } from 'theme-ui';
import { Task } from './Task';

type TasksListProps = {
  type: TaskType;
  dayId: string;
};

export const TasksList: FC<TasksListProps> = ({ type, dayId }) => {
  const tasks = useSelector((state: RootState) => {
    return taskSelectors.selectAll(state);
  });
  let listTasks = tasks.filter((t: iTask) => t.type === type);
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
    <Box>
      {listTasks.map((t: iTask) => (
        <Task key={t.id} task={t} dayId={dayId} />
      ))}
    </Box>
  );
};
