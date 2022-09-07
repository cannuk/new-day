import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'theme-ui';
import { nanoid } from 'nanoid';

import { getCurrent, dayAdded, dayTaskAdded } from './daySlice';
import { taskSelectors, Task, tasksUpdated, TaskType, getByType } from '../task/taskSlice';
import { DayTask, dayTasksUpdated } from '../day/daySlice';
import { Day } from './Day';

export const CurrentDay = () => {
  const current = useSelector(getCurrent);
  if (!current) {
    return <CreateNewDay />;
  }
  return <Day dayId={current.id} />;
};

const CreateNewDay = () => {
  const dispatch = useDispatch();
  const tasks = useSelector(taskSelectors.selectAll);
  const importantTask = useSelector(getByType(TaskType.Most));
  const onClick = () => {
    debugger;
    const dayId = createDay(dispatch);
    createTemplateTasks(dispatch, dayId, importantTask);
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

const createTemplateTasks = (dispatch: any, dayId: string, importantTask: Task[]) => {
  let taskTemplates = [];
  let dayTaskTemplates = [];
  for (let x = 0; x < 4; x++) {
    let taskId = nanoid();
    let task: Task = {
      id: taskId,
      text: '',
      created: new Date().toString(),
      updated: new Date().toString(),
      complete: false,
      type: TaskType.Rhythm,
    };
    let dayTask: DayTask = {
      id: nanoid(),
      dayId,
      taskId,
      created: new Date().toString(),
    };
    taskTemplates.push(task);
    dayTaskTemplates.push(dayTask);
  }
  let imptTaskId;
  if (importantTask.length === 0) {
    imptTaskId = nanoid();
    taskTemplates.push({
      id: imptTaskId,
      text: '',
      created: new Date().toString(),
      updated: new Date().toString(),
      complete: false,
      type: TaskType.Most,
    });
  } else {
    imptTaskId = importantTask[0].id;
  }

  dayTaskTemplates.push({
    id: nanoid(),
    dayId,
    taskId: imptTaskId,
    created: new Date().toString(),
  });
  dispatch(tasksUpdated(taskTemplates));
  dispatch(dayTasksUpdated(dayTaskTemplates));
};
