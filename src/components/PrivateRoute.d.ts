import { FC, ReactNode } from 'react';

export interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute: FC<PrivateRouteProps>; 