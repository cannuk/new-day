import React from 'react';
import { Grid, Container, Heading, Box } from 'theme-ui';
import { Flex } from 'rebass';
import styled from '@emotion/styled';

import { NewDay } from '../task/NewDay';
import { TasksList } from '../task/TasksList';
import { NewTask } from '../task/NewTask';
import { TaskType } from '../task/taskSlice';
import { StaticTask } from '../task/StaticTask';

type MatchProps = {
  id: any;
};

export const Day = ({ id }: MatchProps) => (
  <Container p={3}>
    <Flex as="nav" justifyContent="flex-end">
      <NewDay />
    </Flex>
    <Grid gap={3}>
      <Box>
        <Heading>Rhythm</Heading>
        <Grid columns={[4, '1fr 1fr 1fr 1fr']}>
          <StaticTask taskType={TaskType.Rhythm} taskId="rhythm-1" />
          <StaticTask taskType={TaskType.Rhythm} taskId="rhythm-2" />
          <StaticTask taskType={TaskType.Rhythm} taskId="rhythm-3" />
          <StaticTask taskType={TaskType.Rhythm} taskId="rhythm-4" />
        </Grid>
      </Box>
      <Box>
        <Heading>Most Important</Heading>
        <MainTask taskType={TaskType.Most} taskId="most" />
      </Box>
      <Box>
        <Heading>Other</Heading>
        <TasksList type={TaskType.Other} />
        <NewTask taskType={TaskType.Other} />
      </Box>
      <Grid gap={4} columns={[2, '1fr 1fr']}>
        <Box>
          <Heading>Quick</Heading>
          <TasksList type={TaskType.Quick} />
          <NewTask taskType={TaskType.Quick} />
        </Box>
        <Box>
          <Heading>Pass Delegate or Postpone</Heading>
          <TasksList type={TaskType.PDP} />
          <NewTask taskType={TaskType.PDP} />
        </Box>
      </Grid>
    </Grid>
  </Container>
);

const MainTask = styled(StaticTask)`
  font-size: 150%;
`;
