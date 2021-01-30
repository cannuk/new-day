import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'theme-ui';
import { nanoid } from 'nanoid';

import { getCurrent, dayAdded, dayTaskAdded } from './daySlice';
import { taskSelectors, Task } from '../task/taskSlice';
import { Day } from './Day';

export const CurrentDay = () => {
  const current = useSelector(getCurrent);
  if (!current) {
    return <CreateNewDay />;
  }
  return <Day id={current.id} />;
};

const CreateNewDay = () => {
  const dispatch = useDispatch();
  const tasks = useSelector(taskSelectors.selectAll);
  const onClick = () => {
    const dayId = createDay(dispatch);
    if (tasks) {
      migrateTasks(dispatch, tasks, dayId);
    }
  };
  return <Button onClick={onClick}>Add a Day</Button>;
};

const createDay = (dispatch: any) => {
  const dayId = nanoid();
  dispatch(dayAdded({ id: dayId, created: new Date().toString() }));
  return dayId;
};

const migrateTasks = (dispatch: any, tasks: any, dayId: string) => {
  if (tasks) {
    tasks.forEach((t: Task) =>
      dispatch(dayTaskAdded({ id: nanoid(), dayId, taskId: t.id, created: new Date().toString() }))
    );
  }
};
