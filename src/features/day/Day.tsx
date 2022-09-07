import React, { FC } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Grid, Container, Heading, Box } from 'theme-ui';
import { Flex } from 'rebass';
import styled from '@emotion/styled';

import { NewDay } from '../task/NewDay';
import { TasksList } from '../task/TasksList';
import { NewTask } from '../task/NewTask';
import { TaskType, Task as iTask, taskSelectors, getTasksByDay } from '../task/taskSlice';
import { dayTaskSelectors } from '../day/daySlice';
import { StaticTask } from '../task/StaticTask';

type MatchProps = {
  dayId: string;
};

export const Day = ({ dayId }: MatchProps) => (
  <Container p={3}>
    <Flex as="nav" justifyContent="flex-end">
      <NewDay />
    </Flex>
    <Grid gap={3}>
      <Box>
        <Heading>Rhythm</Heading>
        <Grid columns={[4, '1fr 1fr 1fr 1fr']}>
          <RhythmSection dayId={dayId} />
        </Grid>
      </Box>
      <Box>
        <Heading>Most Important</Heading>
        <MainTask taskType={TaskType.Most} taskId={`most-${dayId}`} dayId={dayId} />
      </Box>
      <Box>
        <Heading>Other</Heading>
        <TasksList type={TaskType.Other} dayId={dayId} />
        <NewTask taskType={TaskType.Other} dayId={dayId} />
      </Box>
      <Grid gap={4} columns={[2, '1fr 1fr']}>
        <Box>
          <Heading>Quick</Heading>
          <TasksList type={TaskType.Quick} dayId={dayId} />
          <NewTask taskType={TaskType.Quick} dayId={dayId} />
        </Box>
        <Box>
          <Heading>Pass Delegate or Postpone</Heading>
          <TasksList type={TaskType.PDP} dayId={dayId} />
          <NewTask taskType={TaskType.PDP} dayId={dayId} />
        </Box>
      </Grid>
    </Grid>
  </Container>
);

const RhythmSection: FC<MatchProps> = ({ dayId }) => {
  // const tasks = useSelector((state: RootState) => {
  //   return taskSelectors.selectAll(state);
  // });
  // let taskIds = useSelector((state: RootState) => {
  //   return dayTaskSelectors
  //     .selectAll(state)
  //     .filter((dt) => dt.dayId === dayId)
  //     .map((t) => t.taskId);
  // });
  let tasks = useSelector(getTasksByDay(dayId));
  let listTasks = tasks.filter((t: iTask) => t.type === TaskType.Rhythm);
  return (
    <>
      {listTasks.map((t) => (
        <StaticTask key={t.id} taskType={TaskType.Rhythm} taskId={t.id} dayId={dayId} />
      ))}
    </>
  );
};

const MainTask = styled(StaticTask)`
  font-size: 150%;
`;
