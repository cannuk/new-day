import React, { FC, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { tasksRemoved, getCompleted, TaskType, tasksUpdated } from './taskSlice';
import { NavLink } from 'theme-ui';

export const NewDay: FC<any> = () => {
  const dispatch = useDispatch();
  const completedTasks = useSelector(getCompleted);
  const handleClick = useCallback(() => {
    let remove = completedTasks
      .filter((t) => t.type === TaskType.Other || t.type === TaskType.PDP || t.type === TaskType.Quick)
      .map((t) => t.id);
    let update = completedTasks
      .filter((t) => t.type === TaskType.Most)
      .map((t) => ({
        id: t.id,
        text: '',
        complete: false,
        created: new Date().toString(),
        updated: new Date().toString(),
        completed: undefined,
        type: t.type,
      }));
    dispatch(tasksUpdated(update));
    dispatch(tasksRemoved(remove));
  }, [completedTasks, dispatch]);
  return <StyledLink onClick={handleClick}>New Day</StyledLink>;
};

const StyledLink = styled(NavLink)`
  cursor: pointer;
`;
