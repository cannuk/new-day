declare module 'react-portal' {
  import { Component, ReactNode } from 'react';

  export interface PortalWithStateProps {
    children: (args: {
      openPortal: (e?: any) => void;
      closePortal: () => void;
      isOpen: boolean;
      portal: (children: ReactNode) => ReactNode;
    }) => ReactNode;
    closeOnOutsideClick?: boolean;
    closeOnEsc?: boolean;
    defaultOpen?: boolean;
    node?: Element;
    onOpen?: () => void;
    onClose?: () => void;
  }

  export class PortalWithState extends Component<PortalWithStateProps> {}

  export interface PortalProps {
    children: ReactNode;
    node?: Element;
  }

  export class Portal extends Component<PortalProps> {}
}
