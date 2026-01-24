// app/accounting/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    DollarSign,
    Globe,
    Receipt,
    TrendingUp,
    FileText,
    BrainCircuit,
    Users,
    ArrowRight,
    Activity
} from "lucide-react";
import { apiClient } from "@/lib/api";
import Layout from "@/components/layout";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
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
  max-width: 1000px;
  margin: 0 15%;
  padding: ${props => props.theme.spacing.sm};
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.xxl};
  animation: ${fadeIn} 0.5s ease-out;
  
  h1 {
    font-size: 3rem;
    font-weight: 900;
    color: ${props => props.theme.colors.textDark};
    letter-spacing: -1.5px;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1.2rem;
    font-weight: 600;
  }
`;

const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
`;

const ModuleCard = styled(motion.button) <{ $color: string }>`
  position: relative;
  background: ${props => props.theme.colors.card};
  border-radius: 24px;
  padding: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  text-align: left;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme.shadows.sm};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.$color};
    transform: scaleX(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.$color}40;
    
    &::before {
      transform: scaleX(1);
    }

    .icon-wrapper {
      transform: scale(1.1);
      box-shadow: 0 8px 16px ${props => props.$color}40;
    }

    .arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${props => props.$color}15;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  svg {
    color: ${props => props.$color};
  }
`;

const ModuleTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${props => props.theme.colors.textDark};
  margin-bottom: 8px;
`;

const ModuleDescription = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 600;
  line-height: 1.5;
`;

const ArrowIcon = styled.div`
  position: absolute;
  bottom: 24px;
  right: 24px;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: ${props => props.theme.colors.textSecondary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
`;

const StatCard = styled(motion.div) <{ $color: string }>`
  background: ${props => props.theme.colors.card};
  border-radius: 20px;
  padding: 28px;
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${props => props.theme.shadows.sm};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.$color};
  }

  .content {
    .label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${props => props.theme.colors.textSecondary};
      margin-bottom: 8px;
    }
    
    .value {
      font-size: 2rem;
      font-weight: 900;
      color: ${props => props.theme.colors.textDark};
      
      &.loading {
        color: ${props => props.theme.colors.textSecondary};
        font-size: 1.5rem;
      }
    }
  }

  .icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: ${props => props.$color}15;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$color};
    animation: ${float} 3s ease-in-out infinite;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${props => props.theme.colors.textDark};
  margin-bottom: 24px;
  margin-top: 48px;
`;

interface Stats {
    totalAccounts: number;
    journalEntries: number;
    activeCurrencies: number;
    taxRates: number;
}

export default function AccountingHomePage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats>({
        totalAccounts: 0,
        journalEntries: 0,
        activeCurrencies: 0,
        taxRates: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [accountsRes, journalRes, currenciesRes, taxRatesRes] = await Promise.all([
                apiClient.getAccountingAccounts().catch(() => ({ data: [] })),
                apiClient.getJournalEntries().catch(() => ({ data: [] })),
                apiClient.getCurrencies().catch(() => ({ data: [] })),
                apiClient.getTaxRates().catch(() => ({ data: [] })),
            ]);

            setStats({
                totalAccounts: accountsRes.data?.length || 0,
                journalEntries: journalRes.data?.length || 0,
                activeCurrencies: currenciesRes.data?.filter((c: any) => c.is_active).length || 0,
                taxRates: taxRatesRes.data?.filter((r: any) => r.is_active).length || 0,
            });
        } catch (error) {
            console.error("Failed to fetch accounting stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const modules = [
        {
            title: "Chart of Accounts",
            description: "Manage your account structure and hierarchy",
            icon: BookOpen,
            href: "/accounting/accounts",
            color: "#2563eb",
        },
        {
            title: "Journal Entries",
            description: "View and manage double-entry journal entries",
            icon: FileText,
            href: "/accounting/journal-entries",
            color: "#10b981",
        },
        {
            title: "Tax Configuration",
            description: "Configure tax types and rates",
            icon: Receipt,
            href: "/accounting/taxes",
            color: "#9333ea",
        },
        {
            title: "Currency Management",
            description: "Manage currencies and exchange rates",
            icon: Globe,
            href: "/accounting/currencies",
            color: "#f59e0b",
        },
        {
            title: "Trial Balance",
            description: "View trial balance report",
            icon: TrendingUp,
            href: "/accounting/trial-balance",
            color: "#6366f1",
        },
        {
            title: "General Ledger",
            description: "View general ledger by account",
            icon: DollarSign,
            href: "/accounting/general-ledger",
            color: "#14b8a6",
        },
        {
            title: "Applied AI",
            description: "Fraud detection and scenario modeling",
            icon: BrainCircuit,
            href: "/accounting/ai",
            color: "#ef4444",
        },
        {
            title: "Payroll",
            description: "Manage employees and process payments",
            icon: Users,
            href: "/accounting/payroll",
            color: "#8b5cf6",
        },
    ];

    const statsData = [
        {
            label: "Total Accounts",
            value: stats.totalAccounts,
            icon: BookOpen,
            color: "#2563eb",
        },
        {
            label: "Journal Entries",
            value: stats.journalEntries,
            icon: FileText,
            color: "#10b981",
        },
        {
            label: "Active Currencies",
            value: stats.activeCurrencies,
            icon: Globe,
            color: "#f59e0b",
        },
        {
            label: "Tax Rates",
            value: stats.taxRates,
            icon: Receipt,
            color: "#9333ea",
        },
    ];

    return (
        <Layout>
            <PageWrapper>
                <ContentContainer>
                    <Header>
                        <h1>Accounting System</h1>
                        <p>Double-entry bookkeeping with multi-currency and tax support</p>
                    </Header>

                    {/* Module Grid */}
                    <ModuleGrid>
                        {modules.map((module, index) => {
                            const Icon = module.icon;
                            return (
                                <ModuleCard
                                    key={module.href}
                                    $color={module.color}
                                    onClick={() => router.push(module.href)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <IconWrapper className="icon-wrapper" $color={module.color}>
                                        <Icon size={28} />
                                    </IconWrapper>
                                    <ModuleTitle>{module.title}</ModuleTitle>
                                    <ModuleDescription>{module.description}</ModuleDescription>
                                    <ArrowIcon className="arrow">
                                        <ArrowRight size={20} />
                                    </ArrowIcon>
                                </ModuleCard>
                            );
                        })}
                    </ModuleGrid>

                    {/* Quick Stats */}
                    <SectionTitle>
                        <Activity size={24} style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
                        Quick Statistics
                    </SectionTitle>
                    <StatsGrid>
                        {statsData.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <StatCard
                                    key={stat.label}
                                    $color={stat.color}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                >
                                    <div className="content">
                                        <div className="label">{stat.label}</div>
                                        <div className={`value ${loading ? 'loading' : ''}`}>
                                            {loading ? '...' : stat.value.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="icon">
                                        <Icon size={24} />
                                    </div>
                                </StatCard>
                            );
                        })}
                    </StatsGrid>
                </ContentContainer>
            </PageWrapper>
        </Layout>
    );
}
