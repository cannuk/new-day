import styled from '@emotion/styled';
import { useRef, useCallback, useState, FC } from 'react';
import { PortalWithState } from 'react-portal';
import { useSelector } from 'react-redux';
import { IconButton, Card, Box } from 'theme-ui';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';
import { Task as iTask, TaskType, getByType } from './taskSlice';

type TaskMenuProps = {
  task: iTask;
};
export const TaskMenu: FC<TaskMenuProps> = ({ task }) => {
  const [dims, setDims] = useState({ right: 0, top: 0 });
  const { updateTask, removeTask } = useFirestoreActions();
  const buttonRef = useRef<any>(null);
  const mostImportantTasks = useSelector(getByType(TaskType.Most)) as iTask[];

  const moveOther = useCallback(() => {
    updateTask({ ...task, type: TaskType.Other });
  }, [updateTask, task]);

  const moveQuick = useCallback(() => {
    updateTask({ ...task, type: TaskType.Quick });
  }, [updateTask, task]);

  const movePDP = useCallback(() => {
    updateTask({ ...task, type: TaskType.PDP });
  }, [updateTask, task]);

  const moveMostImportant = useCallback(() => {
    // If there are already 3 Most Important tasks, move the last one to Other
    if (mostImportantTasks.length >= 3) {
      const lastMost = mostImportantTasks[mostImportantTasks.length - 1];
      updateTask({ ...lastMost, type: TaskType.Other });
    }
    // Move this task to Most Important
    updateTask({ ...task, type: TaskType.Most });
  }, [updateTask, task, mostImportantTasks]);

  const onDelete = useCallback(() => removeTask(task.id), [removeTask, task.id]);
  const onOpen = useCallback(() => {
    const buttonPos = buttonRef.current.getBoundingClientRect();
    setDims({ right: buttonPos.right, top: buttonPos.y });
  }, []);
  return (
    <PortalWithState closeOnOutsideClick closeOnEsc onOpen={onOpen}>
      {({ openPortal, portal }) => (
        <>
          <StyledIconButton ref={buttonRef} onClick={openPortal}>
            <svg
              fill="currentcolor"
              width="16"
              height="16"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 16 16"
            >
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
            >
              <UL>
                {task.type !== TaskType.Most && <LI onClick={onDelete}>Delete</LI>}
                {task.type !== TaskType.Most && (
                  <LI onClick={moveMostImportant}>Move to Most Important</LI>
                )}
                {task.type !== TaskType.Other && <LI onClick={moveOther}>Move to Other</LI>}
                {task.type !== TaskType.Quick && <LI onClick={moveQuick}>Move to Quick</LI>}
                {task.type !== TaskType.PDP && <LI onClick={movePDP}>Move to PDP</LI>}
              </UL>
            </StyledCard>
          )}
        </>
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
