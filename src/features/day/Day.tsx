import styled from '@emotion/styled';
import React from 'react';
import { useSelector } from 'react-redux';
import { Flex } from 'rebass';
import { Grid, Container, Heading, Box } from 'theme-ui';
import { NewDay } from '../task/NewDay';
import { NewTask } from '../task/NewTask';
import { StaticTask } from '../task/StaticTask';
import { TaskType, getTasksByDay, Task as iTask } from '../task/taskSlice';
import { TasksList } from '../task/TasksList';

type MatchProps = {
  dayId: string;
};

export const Day = ({ dayId }: MatchProps) => {
  return (
    <Container p={3}>
      <Flex as="nav" justifyContent="flex-end">
        <NewDay />
      </Flex>
      <Grid gap={3}>
        <Box>
          <Heading>Most Important</Heading>
          <MostImportantSection dayId={dayId} />
        </Box>
        <Box>
          <Heading>Backlog</Heading>
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
};

const MostImportantSection: React.FC<MatchProps> = ({ dayId }) => {
  const tasks = useSelector(getTasksByDay(dayId)) as iTask[];
  const mostImportantTasks = tasks.filter((t: iTask) => t.type === TaskType.Most);

  // Always render 3 slots - use existing task IDs or generate placeholder IDs
  const slots = [0, 1, 2].map((index) => {
    const task = mostImportantTasks[index];
    return {
      key: task?.id || `most-${dayId}-${index}`,
      taskId: task?.id || `most-${dayId}-${index}`,
    };
  });

  return (
    <>
      {slots.map((slot) => (
        <MainTask key={slot.key} taskType={TaskType.Most} taskId={slot.taskId} dayId={dayId} />
      ))}
    </>
  );
};

const MainTask = styled(StaticTask)`
  font-size: 150%;
`;
