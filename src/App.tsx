import React from 'react';
import { ThemeProvider, Grid, Container, Heading, Box } from 'theme-ui';
import theme from './themes/start';
import styled from '@emotion/styled';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor } from './app/store';
import { NewDay } from './features/task/NewDay';
import { TasksList } from './features/task/TasksList';
import { StaticTask } from './features/task/StaticTask';
import { NewTask } from './features/task/NewTask';
import { TaskType } from './features/task/taskSlice';
import { Flex } from 'rebass';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <PersistGate loading={null} persistor={persistor}>
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
      </PersistGate>
    </ThemeProvider>
  );
}

const MainTask = styled(StaticTask)`
  font-size: 150%;
`;

export default App;
