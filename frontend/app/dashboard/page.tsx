'use client';
import React from 'react';
import styled from 'styled-components';
import { useAuth } from '/@/lib/rbac/auth-context';
import { ComponentGate, ComponentId } from '/@/lib/rbac';
import { Users, DollarSign, TrendingUp, FileText, Shield, Calendar, CreditCard, Activity, Briefcase, UserCheck, ClipboardList, BarChart3, Wallet } from 'lucide-react';
import Layout from '@/components/para';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  flex: 1;
  padding: 24px;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const StatsCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
`;

const CardValue = styled.div`
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: rgba(0, 170, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  svg {
    width: 24px;
    height: 24px;
    color: #00AA00;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
`;

const TableTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    font-weight: 600;
    color: #555;
    font-size: 14px;
  }
`;

const Badge = styled.span<{ type: 'success' | 'warning' | 'danger' | 'info' }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch(props.type) {
      case 'success': return 'rgba(0, 170, 0, 0.1)';
      case 'warning': return 'rgba(255, 170, 0, 0.1)';
      case 'danger': return 'rgba(255, 0, 0, 0.1)';
      case 'info': return 'rgba(0, 100, 255, 0.1)';
      default: return 'rgba(0, 170, 0, 0.1)';
    }
  }};
  color: ${props => {
    switch(props.type) {
      case 'success': return '#00AA00';
      case 'warning': return '#FFA500';
      case 'danger': return '#FF0000';
      case 'info': return '#0064FF';
      default: return '#00AA00';
    }
  }};
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  margin: 32px 0 16px 0;
  color: #333;
`;

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Helper function to show welcome message based on user type
  const renderWelcomeHeader = () => {
    if (!user) return <h1>Dashboard</h1>;
   
    return (
      <div>
        <h1>Welcome, {user.name}</h1>
        <p>Your {user.userType} Dashboard</p>
      </div>
    );
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          {renderWelcomeHeader()}
          
          {/* Admin Dashboard */}
          <ComponentGate componentId={ComponentId.DASHBOARD}>
            <SectionTitle>System Overview</SectionTitle>
            <DashboardGrid>
              <StatsCard>
                <CardIcon>
                  <Users />
                </CardIcon>
                <CardTitle>Total Users</CardTitle>
                <CardValue>1,248</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <DollarSign />
                </CardIcon>
                <CardTitle>Total Revenue</CardTitle>
                <CardValue>$1.2M</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <FileText />
                </CardIcon>
                <CardTitle>Active Transactions</CardTitle>
                <CardValue>843</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <TrendingUp />
                </CardIcon>
                <CardTitle>Growth Rate</CardTitle>
                <CardValue>15%</CardValue>
              </StatsCard>
            </DashboardGrid>
          </ComponentGate>
          
          {/* Manager Dashboard */}
          <ComponentGate componentId={ComponentId.MANAGER_DASHBOARD}>
            <SectionTitle>Department Performance</SectionTitle>
            <DashboardGrid>
              <StatsCard>
                <CardIcon>
                  <DollarSign />
                </CardIcon>
                <CardTitle>Department Revenue</CardTitle>
                <CardValue>$450K</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <Activity />
                </CardIcon>
                <CardTitle>Expense Ratio</CardTitle>
                <CardValue>42%</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <ClipboardList />
                </CardIcon>
                <CardTitle>Pending Approvals</CardTitle>
                <CardValue>12</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <BarChart3 />
                </CardIcon>
                <CardTitle>Quarterly Targets</CardTitle>
                <CardValue>85%</CardValue>
              </StatsCard>
            </DashboardGrid>
          </ComponentGate>
          
          {/* Accountant Dashboard */}
          <ComponentGate componentId={ComponentId.ACCOUNTANT_DASHBOARD}>
            <SectionTitle>Financial Records</SectionTitle>
            <DashboardGrid>
              <StatsCard>
                <CardIcon>
                  <CreditCard />
                </CardIcon>
                <CardTitle>Outstanding Invoices</CardTitle>
                <CardValue>37</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <FileText />
                </CardIcon>
                <CardTitle>Pending Audits</CardTitle>
                <CardValue>5</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <Wallet />
                </CardIcon>
                <CardTitle>Current Balance</CardTitle>
                <CardValue>$250K</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <Shield />
                </CardIcon>
                <CardTitle>Compliance Score</CardTitle>
                <CardValue>98%</CardValue>
              </StatsCard>
            </DashboardGrid>
          </ComponentGate>
          
          {/* Employee Dashboard */}
          <ComponentGate componentId={ComponentId.EMPLOYEE_DASHBOARD}>
            <SectionTitle>Personal Finance Overview</SectionTitle>
            <DashboardGrid>
              <StatsCard>
                <CardIcon>
                  <Wallet />
                </CardIcon>
                <CardTitle>Personal Balance</CardTitle>
                <CardValue>$5,200</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <DollarSign />
                </CardIcon>
                <CardTitle>Monthly Expenses</CardTitle>
                <CardValue>$1,800</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <ClipboardList />
                </CardIcon>
                <CardTitle>Pending Requests</CardTitle>
                <CardValue>3</CardValue>
              </StatsCard>
              <StatsCard>
                <CardIcon>
                  <TrendingUp />
                </CardIcon>
                <CardTitle>Savings Goal</CardTitle>
                <CardValue>75%</CardValue>
              </StatsCard>
            </DashboardGrid>
          </ComponentGate>

          {/* Recent Transactions Table - Common for all roles */}
          <SectionTitle>Recent Transactions</SectionTitle>
          <TableContainer>
            <TableTitle>Latest Activity</TableTitle>
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-11-10</td>
                  <td>Salary Deposit</td>
                  <td className="text-green-600">+$2,500</td>
                  <td><Badge type="success">Completed</Badge></td>
                </tr>
                <tr>
                  <td>2023-11-09</td>
                  <td>Utility Bill Payment</td>
                  <td className="text-red-600">-$150</td>
                  <td><Badge type="success">Completed</Badge></td>
                </tr>
                <tr>
                  <td>2023-11-08</td>
                  <td>Grocery Purchase</td>
                  <td className="text-red-600">-$89</td>
                  <td><Badge type="warning">Pending</Badge></td>
                </tr>
                <tr>
                  <td>2023-11-07</td>
                  <td>Client Invoice</td>
                  <td className="text-green-600">+$1,200</td>
                  <td><Badge type="danger">Overdue</Badge></td>
                </tr>
              </tbody>
            </Table>
          </TableContainer>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default AdminDashboard;