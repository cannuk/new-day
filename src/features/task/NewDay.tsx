import React, { FC, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { Task as iTask, tasksRemoved, getCompleted, TaskType, tasksUpdated } from './taskSlice';
import { NavLink } from 'theme-ui';

export const NewDay: FC<any> = () => {
  const dispatch = useDispatch();
  const completedTasks = useSelector(getCompleted);
  const handleClick = useCallback(() => {
    let remove = completedTasks
      .filter((t) => t.type === TaskType.Other || t.type === TaskType.PDP || t.type === TaskType.Quick)
      .map((t) => t.id);
    let update = completedTasks
      .filter((t) => t.type === TaskType.Most || t.type === TaskType.Rhythm)
      .map((t) => {
        if (t.type === TaskType.Most) {
          return {
            id: t.id,
            text: '',
            complete: false,
            created: new Date().toString(),
            updated: new Date().toString(),
            completed: undefined,
            type: t.type,
          };
        }
        return {
          id: t.id,
          type: t.type,
          text: t.text,
          complete: false,
          created: new Date().toString(),
          updated: new Date().toString(),
        };
      });
    dispatch(tasksUpdated(update));
    dispatch(tasksRemoved(remove));
  }, [completedTasks, dispatch]);
  return <StyledLink onClick={handleClick}>New Day</StyledLink>;
};

const StyledLink = styled(NavLink)`
  cursor: pointer;
`;
