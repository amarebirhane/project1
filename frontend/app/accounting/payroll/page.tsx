"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Calendar,
    DollarSign,
    FileText,
    Plus,
    Search,
    ChevronRight,
    CheckCircle2,
    Clock,
    UserPlus,
    Calculator,
    ArrowUpRight,
    Briefcase,
    Building2,
    CreditCard,
    X,
    Filter,
    ShieldCheck,
    TrendingUp,
    MoreHorizontal,
    Eye
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import styled, { css, keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

interface Employee {
    id: number;
    user_id: number;
    employee_id: string;
    job_title: string;
    department_id?: number;
    hire_date: string;
    base_salary: number;
    payment_frequency: string;
    bank_account_number?: string;
    bank_name?: string;
    status: string;
}

interface PayrollPeriod {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    payment_date?: string;
    status: "draft" | "generated" | "approved" | "paid";
    total_gross: number;
    total_deductions: number;
    total_net: number;
}

interface Payslip {
    id: number;
    employee_id: number;
    period_id: number;
    base_salary: number;
    gross_pay: number;
    net_pay: number;
    status: string;
}

interface User {
    id: number;
    username: string;
    full_name: string;
    email: string;
}

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, ${props => props.theme.colors.muted} 100%);
  padding: ${props => props.theme.spacing.xl};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 940px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
  animation: ${fadeIn} 0.5s ease-out;
`;

const TitleSection = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: ${props => props.theme.colors.textDark};
    letter-spacing: -1px;
    margin-bottom: 4px;
  }
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1.1rem;
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const HeaderButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${props => props.$variant === 'secondary' ? props.theme.colors.card : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'};
  color: ${props => props.$variant === 'secondary' ? props.theme.colors.textDark : 'white'};
  padding: 14px 28px;
  border-radius: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  border: ${props => props.$variant === 'secondary' ? `1px solid ${props.theme.colors.border}` : 'none'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$variant === 'secondary' ? 'none' : '0 10px 20px -5px rgba(37, 99, 235, 0.3)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$variant === 'secondary' ? props.theme.shadows.md : '0 15px 25px -5px rgba(37, 99, 235, 0.4)'};
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 32px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 32px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding-bottom: 16px;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  transition: color 0.2s;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.theme.colors.primary};
    border-radius: 3px;
    transform: scaleX(${props => props.$active ? 1 : 0});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled(motion.div) <{ $color: string }>`
  background: ${props => props.theme.colors.card};
  padding: 32px;
  border-radius: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 24px;

  .icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: ${props => props.$color}15;
    color: ${props => props.$color};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    .label { font-size: 0.875rem; color: ${props => props.theme.colors.textSecondary}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 2rem; font-weight: 900; color: ${props => props.theme.colors.textDark}; }
    .sub { font-size: 0.875rem; color: #10b981; font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
  }
`;

const GlassPanel = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  border-radius: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const PanelHeader = styled.div`
  padding: 24px 32px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SearchInputContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  
  input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    background: ${props => props.theme.colors.muted};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
    transition: all 0.2s;

    &:focus { outline: none; border-color: ${props => props.theme.colors.primary}; background: ${props => props.theme.colors.card}; }
  }

  svg { position: absolute; left: 16px; top: 12px; color: ${props => props.theme.colors.textSecondary}; }
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;

  ${props => (props.$status === 'active' || props.$status === 'approved' || props.$status === 'paid') ? css`
    background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);
  ` : (props.$status === 'draft' || props.$status === 'generated') ? css`
    background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);
  ` : css`
    background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);
  `}
`;

const ModernTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 16px 32px;
    font-size: 0.75rem;
    font-weight: 800;
    color: ${props => props.theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 1px;
    background: ${props => props.theme.colors.backgroundSecondary};
  }

  td {
    padding: 20px 32px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
  }

  tr:last-child td { border-bottom: none; }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${props => props.theme.colors.textDark};
`;

const HelperText = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 700;
  font-size: 0.875rem;
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  width: 100%;
  max-width: 600px;
  border-radius: 32px;
  padding: 40px;
  position: relative;
  border: 1px solid ${props => props.theme.colors.border};
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  label { display: block; font-size: 0.875rem; font-weight: 700; color: ${props => props.theme.colors.textDark}; margin-bottom: 8px; }
  input, select {
    width: 100%;
    padding: 14px 18px;
    background: ${props => props.theme.colors.muted};
    border: 2px solid transparent;
    border-radius: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
    &:focus { outline: none; border-color: ${props => props.theme.colors.primary}; background: ${props => props.theme.colors.card}; }
  }

  select option {
    background: ${props => props.theme.colors.card};
    color: ${props => props.theme.colors.textDark};
  }
`;

export default function PayrollDashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "employees" | "periods">("overview");
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
    const [payslips, setPayslips] = useState<Payslip[]>([]);

    useEffect(() => {
        fetchData();
        fetchUsers();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, periodRes] = await Promise.all([
                apiClient.getEmployees(),
                apiClient.getPayrollPeriods()
            ]);
            if (empRes.data) setEmployees(empRes.data);
            if (periodRes.data) setPeriods(periodRes.data);
        } catch (error) {
            console.error("Failed to fetch payroll data:", error);
            toast.error("Failed to load payroll information");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get<User[]>('/users/');
            if (res.data) setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const handleCreatePeriod = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await apiClient.createPayrollPeriod({
                name: formData.get("name") as string,
                start_date: formData.get("start_date") as string,
                end_date: formData.get("end_date") as string,
                payment_date: formData.get("payment_date") as string || null,
            });
            toast.success("Payroll period created");
            setIsPeriodModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to create payroll period");
        }
    };

    const handleRegisterEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await apiClient.createEmployee({
                user_id: parseInt(formData.get("user_id") as string),
                employee_id: formData.get("employee_id") as string,
                job_title: formData.get("job_title") as string,
                hire_date: formData.get("hire_date") as string,
                base_salary: parseFloat(formData.get("base_salary") as string),
                bank_account_number: formData.get("bank_account") as string,
                bank_name: formData.get("bank_name") as string,
            });
            toast.success("Employee registered successfully");
            setIsEmployeeModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to register employee");
        }
    };

    const handleGeneratePayslips = async (id: number) => {
        try {
            await apiClient.generatePayslips(id);
            toast.success("Payslips generated");
            fetchData();
        } catch (error) {
            toast.error("Failed to generate payslips");
        }
    };

    const handleApprovePayroll = async (id: number) => {
        try {
            await apiClient.approvePayroll(id);
            toast.success("Payroll approved & accounting journals created");
            fetchData();
        } catch (error) {
            toast.error("Approval failed");
        }
    };

    const viewPayslips = async (period: PayrollPeriod) => {
        try {
            setSelectedPeriod(period);
            const res = await apiClient.getPayslips(period.id);
            if (res.data) setPayslips(res.data);
            setIsPayslipModalOpen(true);
        } catch (error) {
            toast.error("Failed to fetch payslips");
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.job_title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        totalEmployees: employees.length,
        totalNet: periods.filter(p => p.status === 'paid' || p.status === 'approved').reduce((acc, p) => acc + p.total_net, 0),
        avgSalary: employees.length > 0 ? employees.reduce((acc, e) => acc + e.base_salary, 0) / employees.length : 0
    };

    return (
        <Layout>
            <PageWrapper>
                <ContentContainer>
                    <Header>
                        <TitleSection>
                            <h1>Payroll Center</h1>
                            <p>Compliance, automation, and talent compensation</p>
                        </TitleSection>
                        <ActionButtonGroup>
                            <HeaderButton $variant="secondary" onClick={() => setIsEmployeeModalOpen(true)}>
                                <UserPlus size={20} /> Register Employee
                            </HeaderButton>
                            <HeaderButton onClick={() => setIsPeriodModalOpen(true)}>
                                <Plus size={20} /> New Period
                            </HeaderButton>
                        </ActionButtonGroup>
                    </Header>

                    <TabsContainer>
                        {["overview", "employees", "periods"].map((tab) => (
                            <TabButton
                                key={tab}
                                $active={activeTab === tab}
                                onClick={() => setActiveTab(tab as any)}
                            >
                                {tab}
                            </TabButton>
                        ))}
                    </TabsContainer>

                    {activeTab === "overview" && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                            <StatsGrid>
                                <StatCard $color="#2563eb" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                    <div className="icon"><Users size={32} /></div>
                                    <div className="content">
                                        <div className="label">Workforce</div>
                                        <div className="value">{stats.totalEmployees}</div>
                                        <div className="sub"><TrendingUp size={14} /> Active Personnel</div>
                                    </div>
                                </StatCard>
                                <StatCard $color="#10b981" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                                    <div className="icon"><DollarSign size={32} /></div>
                                    <div className="content">
                                        <div className="label">Total Paid</div>
                                        <div className="value">${stats.totalNet.toLocaleString()}</div>
                                        <div className="sub">Lifecycle MTD</div>
                                    </div>
                                </StatCard>
                                <StatCard $color="#f59e0b" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                                    <div className="icon"><Calculator size={32} /></div>
                                    <div className="content">
                                        <div className="label">Avg. Base Pay</div>
                                        <div className="value">${stats.avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <div className="sub">Across All Tracks</div>
                                    </div>
                                </StatCard>
                            </StatsGrid>

                            <GlassPanel initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <PanelHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Clock style={{ color: '#2563eb' }} size={24} />
                                        <SectionTitle>Draft/Processing Periods</SectionTitle>
                                    </div>
                                </PanelHeader>
                                <ModernTable>
                                    <thead>
                                        <tr>
                                            <th>Period Name</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {periods.filter(p => p.status !== 'paid').length === 0 ? (
                                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>No active payroll cycles</td></tr>
                                        ) : (
                                            periods.filter(p => p.status !== 'paid').map(period => (
                                                <tr key={period.id}>
                                                    <td>{period.name}</td>
                                                    <td>{new Date(period.start_date).toLocaleDateString()}</td>
                                                    <td>{new Date(period.end_date).toLocaleDateString()}</td>
                                                    <td><StatusBadge $status={period.status}>{period.status}</StatusBadge></td>
                                                    <td style={{ display: 'flex', gap: '8px' }}>
                                                        {period.status === 'draft' && (
                                                            <HeaderButton style={{ padding: '8px 16px', borderRadius: '10px' }} onClick={() => handleGeneratePayslips(period.id)}>
                                                                <Calculator size={16} /> Generate
                                                            </HeaderButton>
                                                        )}
                                                        {period.status === 'generated' && (
                                                            <>
                                                                <HeaderButton style={{ padding: '8px 16px', borderRadius: '10px' }} onClick={() => viewPayslips(period)}>
                                                                    <Eye size={16} /> Review
                                                                </HeaderButton>
                                                                <HeaderButton style={{ padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }} onClick={() => handleApprovePayroll(period.id)}>
                                                                    <ShieldCheck size={16} /> Approve
                                                                </HeaderButton>
                                                            </>
                                                        )}
                                                        {period.status === 'approved' && (
                                                            <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                                                <CheckCircle2 size={20} /> Ready for Disbursement
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </ModernTable>
                            </GlassPanel>
                        </div>
                    )}

                    {activeTab === "employees" && (
                        <GlassPanel initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <PanelHeader>
                                <SearchInputContainer>
                                    <Search size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by ID or Title..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </SearchInputContainer>
                                <HelperText>{filteredEmployees.length} Results Found</HelperText>
                            </PanelHeader>
                            <ModernTable>
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Job Title</th>
                                        <th>Base Salary</th>
                                        <th>Hired Date</th>
                                        <th>Status</th>
                                        <th style={{ width: '48px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.id}>
                                            <td style={{ fontWeight: 800, color: '#1e293b' }}>{emp.employee_id}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Briefcase size={16} style={{ color: '#64748b' }} />
                                                    {emp.job_title}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 800 }}>${emp.base_salary.toLocaleString()}</td>
                                            <td style={{ color: '#64748b' }}>{new Date(emp.hire_date).toLocaleDateString()}</td>
                                            <td><StatusBadge $status={emp.status}>{emp.status}</StatusBadge></td>
                                            <td>
                                                <button style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </ModernTable>
                        </GlassPanel>
                    )}

                    {activeTab === "periods" && (
                        <GlassPanel initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <PanelHeader>
                                <SectionTitle>Full Cycle History</SectionTitle>
                            </PanelHeader>
                            <ModernTable>
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Start / End</th>
                                        <th>Total Net</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {periods.map((p) => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 800 }}>{p.name}</td>
                                            <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                {new Date(p.start_date).toLocaleDateString()} → {new Date(p.end_date).toLocaleDateString()}
                                            </td>
                                            <td style={{ fontWeight: 900 }}>${p.total_net.toLocaleString()}</td>
                                            <td><StatusBadge $status={p.status}>{p.status}</StatusBadge></td>
                                            <td>
                                                <HeaderButton $variant="secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => viewPayslips(p)}>
                                                    View Slips
                                                </HeaderButton>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </ModernTable>
                        </GlassPanel>
                    )}
                </ContentContainer>
            </PageWrapper>

            {/* Register Employee Modal */}
            <AnimatePresence>
                {isEmployeeModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ModalContent initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <SectionTitle style={{ fontSize: '1.5rem', fontWeight: 900 }}>Register New Employee</SectionTitle>
                                <button onClick={() => setIsEmployeeModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleRegisterEmployee}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <FormGroup>
                                        <label>Associate User</label>
                                        <select name="user_id" required>
                                            <option value="">Select User...</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.username})</option>)}
                                        </select>
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Company ID</label>
                                        <input name="employee_id" placeholder="EMP-001" required />
                                    </FormGroup>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <FormGroup>
                                        <label>Job Title</label>
                                        <input name="job_title" placeholder="Lead Engineer" required />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Hire Date</label>
                                        <input type="date" name="hire_date" required />
                                    </FormGroup>
                                </div>
                                <FormGroup>
                                    <label>Base Monthly Salary</label>
                                    <input type="number" name="base_salary" placeholder="5000.00" required />
                                </FormGroup>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <FormGroup>
                                        <label>Bank Name</label>
                                        <input name="bank_name" placeholder="Global Trust Bank" />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Account Number</label>
                                        <input name="bank_account" placeholder="XXXX-XXXX-XXXX" />
                                    </FormGroup>
                                </div>
                                <HeaderButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                                    Save Employee Profile
                                </HeaderButton>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>

            {/* Create Period Modal */}
            <AnimatePresence>
                {isPeriodModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ModalContent initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <SectionTitle style={{ fontSize: '1.5rem', fontWeight: 900 }}>New Payroll Period</SectionTitle>
                                <button onClick={() => setIsPeriodModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleCreatePeriod}>
                                <FormGroup>
                                    <label>Period Label</label>
                                    <input name="name" placeholder="January 2024 Payroll" required />
                                </FormGroup>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <FormGroup>
                                        <label>Start Date</label>
                                        <input type="date" name="start_date" required />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>End Date</label>
                                        <input type="date" name="end_date" required />
                                    </FormGroup>
                                </div>
                                <FormGroup>
                                    <label>Scheduled Payment Date</label>
                                    <input type="date" name="payment_date" />
                                </FormGroup>
                                <HeaderButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                                    Initialize Payroll Period
                                </HeaderButton>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>

            {/* Payslips Modal */}
            <AnimatePresence>
                {isPayslipModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ModalContent style={{ maxWidth: '800px' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <div>
                                    <SectionTitle style={{ fontSize: '1.5rem', fontWeight: 900 }}>Review Payslips</SectionTitle>
                                    <HelperText style={{ fontWeight: 600 }}>{selectedPeriod?.name}</HelperText>
                                </div>
                                <button onClick={() => setIsPayslipModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                            </div>
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <ModernTable>
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th style={{ textAlign: 'right' }}>Base Pay</th>
                                            <th style={{ textAlign: 'right' }}>Allowances</th>
                                            <th style={{ textAlign: 'right' }}>Net Pay</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payslips.map(slip => (
                                            <tr key={slip.id}>
                                                <td>
                                                    <div style={{ fontWeight: 800 }}>ID: {slip.employee_id}</div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>${slip.base_salary.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right' }}>$0.00</td>
                                                <td style={{ textAlign: 'right', fontWeight: 900, color: '#1e293b' }}>${slip.net_pay.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </ModernTable>
                            </div>
                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                                <HeaderButton $variant="secondary" onClick={() => setIsPayslipModalOpen(false)}>Close Review</HeaderButton>
                            </div>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </Layout>
    );
}
