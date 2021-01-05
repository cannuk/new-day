/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from 'theme-ui';
import React, { useRef, useCallback, useState, FC } from 'react';
import { RootState } from '../../app/store';

import { IconButton, Card, Box } from 'theme-ui';
import styled from '@emotion/styled';
import { PortalWithState } from 'react-portal';
import { nanoid } from 'nanoid';
import { taskUpdated, tasksUpdated, Task as iTask, TaskType, taskRemoved, taskSelectors } from './taskSlice';
import { useDispatch, useSelector } from 'react-redux';

const update = (task: iTask, dispatch: any) => {
  dispatch(taskUpdated(task));
};

const deleteTask = (taskId: string, dispatch: any) => {
  dispatch(taskRemoved(taskId));
};

const move = (task: iTask, type: TaskType, dispatch: any) => {
  const nTask = { ...task, type };
  update(nTask, dispatch);
};

type TaskMenuProps = {
  task: iTask;
};
export const TaskMenu: FC<TaskMenuProps> = ({ task }) => {
  const importantTask = useSelector((state: RootState) => taskSelectors.selectById(state, 'most'));
  const [dims, setDims] = useState({ right: 0, top: 0 });
  const dispatch = useDispatch();
  const buttonRef = useRef<any>(null);

  const moveOther = useCallback(() => {
    move(task, TaskType.Other, dispatch);
  }, [dispatch, task]);

  const moveQuick = useCallback(() => {
    move(task, TaskType.Quick, dispatch);
  }, [dispatch, task]);

  const movePDP = useCallback(() => {
    move(task, TaskType.PDP, dispatch);
  }, [dispatch, task]);

  const moveImportant = useCallback(() => {
    const updates = [];
    if (importantTask && importantTask.text !== '') {
      updates.push({ ...importantTask, id: nanoid(), type: TaskType.Other });
    }
    updates.push({ ...task, id: 'most', type: TaskType.Most });
    deleteTask(task.id, dispatch);
    deleteTask('most', dispatch);
    dispatch(tasksUpdated(updates));
  }, [dispatch, importantTask, task]);

  const onDelete = useCallback(() => deleteTask(task.id, dispatch), [dispatch, task.id]);
  const onOpen = useCallback(() => {
    const buttonPos = buttonRef.current.getBoundingClientRect();
    setDims({ right: buttonPos.right, top: buttonPos.y });
  }, []);
  return (
    <PortalWithState closeOnOutsideClick closeOnEsc onOpen={onOpen}>
      {({ openPortal, closePortal, isOpen, portal }) => (
        <React.Fragment>
          <StyledIconButton ref={buttonRef} onClick={openPortal}>
            <svg fill="currentcolor" width="16" height="16" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 2a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm-2 8a2 2 0 100-4 2 2 0 000 4z"
              ></path>
            </svg>
          </StyledIconButton>
          {portal(
            <StyledCard
              variant="menu"
              sx={{
                left: dims.right - 150,
                top: dims.top + 40,
              }}
              // onClick={closePortal}
            >
              <UL>
                <LI onClick={onDelete}>Delete</LI>
                {task.type === TaskType.Other && <LI onClick={moveImportant}>Most Important</LI>}
                {task.type !== TaskType.Other && <LI onClick={moveOther}>Move to Other</LI>}
                {task.type !== TaskType.Quick && <LI onClick={moveQuick}>Move to Quick</LI>}
                {task.type !== TaskType.PDP && <LI onClick={movePDP}>Move to PDP</LI>}
              </UL>
            </StyledCard>
          )}
        </React.Fragment>
      )}
    </PortalWithState>
  );
};
type LIProps = {
  children: any;
  onClick?: any;
};
const LI: FC<LIProps> = ({ children, onClick }) => {
  return (
    <Box
      as="li"
      sx={{
        borderRadius: 4,
        cursor: 'pointer',
        padding: 1,
        ':hover': {
          bg: 'primary',
          color: 'background',
        },
      }}
      onClick={onClick}
    >
      {children}
    </Box>
  );
};

const StyledIconButton = styled(IconButton)`
  cursor: pointer;
  position: relative;
`;

const StyledCard = styled(Card)`
  position: absolute;
  width: 150px;
`;

const UL = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;
`;
