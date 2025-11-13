'use client';

import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const TableContainer = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  font-size: ${theme.typography.fontSizes.sm};
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableHeaderContainer = styled.thead`
  background-color: ${theme.colors.backgroundSecondary};
`;

const TableHeaderRow = styled.tr`
  height: 48px;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: ${theme.typography.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;
`;

const TableBodyContainer = styled.tbody`
  background-color: white;
`;

const TableBodyRow = styled.tr`
  height: 52px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${theme.colors.backgroundSecondary};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.border};
  }
`;

const TableBodyCell = styled.td`
  padding: 12px 16px;
  color: ${theme.colors.textSecondary};
`;

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({
  children,
  ...props
}) => {
  return <TableContainer {...props}>{children}</TableContainer>;
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  ...props
}) => {
  return <TableHeaderContainer {...props}>{children}</TableHeaderContainer>;
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  ...props
}) => {
  return <TableBodyContainer {...props}>{children}</TableBodyContainer>;
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  ...props
}) => {
  return <TableBodyRow {...props}>{children}</TableBodyRow>;
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  ...props
}) => {
  return <TableHeaderCell {...props}>{children}</TableHeaderCell>;
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  ...props
}) => {
  return <TableBodyCell {...props}>{children}</TableBodyCell>;
}; 