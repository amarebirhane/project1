'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styled, { useTheme } from 'styled-components';
import Sidebar from '@/components/common/Sidebar';
import Navbar from '@/components/common/Navbar';
import {
    Shield,
    Search,
    RefreshCw,
    Calendar,
    Activity,
    Box,
    ChevronLeft,
    ChevronRight,
    Info,
    User as UserIcon,
    ArrowUpDown,
    X,
    Clock,
    Globe
} from 'lucide-react';
import { useAuth } from '@/lib/rbac/auth-context';
import { auditService, type AuditLogFilters } from '@/lib/services/audit-service';
import { type AuditLog } from '@/lib/api';
import { UserType } from '@/lib/rbac/models';

const TEXT_PRIMARY = (props: any) => props.theme.colors.text;
const TEXT_SECONDARY = (props: any) => props.theme.colors.mutedForeground;
const ACCENT_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const CARD_BG = (props: any) => props.theme.colors.card;
const BORDER_COLOR = (props: any) => props.theme.colors.border;

// Styled Components
const LayoutContainer = styled.div`
    display: flex;
    min-height: 100vh;
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
`;

const MainContent = styled.main`
    flex: 1;
    margin-left: 250px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
`;

const ContentWrapper = styled.div`
    margin-top: 64px;
    padding: 32px 40px;
    flex: 1;
    max-width: 1600px;
`;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid ${BORDER_COLOR};
`;

const TitleSection = styled.div`
    h1 {
        font-size: 32px;
        font-weight: 800;
        background: ${ACCENT_GRADIENT};
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        
        svg {
            background: ${ACCENT_GRADIENT};
            -webkit-background-clip: text;
            color: #667eea;
        }
    }
    p {
        color: ${TEXT_SECONDARY};
        margin-top: 8px;
        font-size: 15px;
        letter-spacing: -0.01em;
    }
`;

const RefreshButton = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    background: ${ACCENT_GRADIENT};
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 14px color-mix(in srgb, #667eea, transparent 60%);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px color-mix(in srgb, #667eea, transparent 50%);
    }

    &:active {
        transform: translateY(0);
    }

    svg.spinning {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;

const FilterCard = styled.div`
    background: color-mix(in srgb, ${CARD_BG}, transparent 20%);
    backdrop-filter: blur(20px);
    border: 1px solid ${BORDER_COLOR};
    border-radius: 16px;
    padding: 24px 28px;
    margin-bottom: 28px;
    box-shadow: ${props => props.theme.shadows.sm};
`;

const FilterGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    align-items: end;
    
    & > *:first-child {
        grid-column: 1 / -1;
    }
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const InputGroup = styled.div`
    position: relative;
    
    label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: ${TEXT_SECONDARY};
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    
    input, select {
        width: 100%;
        padding: 12px 14px 12px 42px;
        border: 1px solid ${BORDER_COLOR};
        border-radius: 10px;
        background-color: ${props => props.theme.colors.background};
        color: ${TEXT_PRIMARY};
        font-size: 14px;
        font-weight: 500;
        outline: none;
        transition: all 0.2s ease;

        &:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px color-mix(in srgb, #667eea, transparent 88%);
        }
        
        &::placeholder {
            color: ${props => props.theme.colors.mutedForeground};
        }
    }
    
    select {
        padding-left: 42px;
        appearance: none;
        cursor: pointer;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        background-size: 16px;
    }
    
    svg {
        position: absolute;
        left: 14px;
        top: 38px;
        color: #94a3b8;
        width: 18px;
        height: 18px;
        pointer-events: none;
    }
`;

const TableCard = styled.div`
    background: ${CARD_BG};
    backdrop-filter: blur(20px);
    border: 1px solid ${BORDER_COLOR};
    border-radius: 16px;
    overflow: hidden;
    box-shadow: ${props => props.theme.shadows.md};
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    text-align: left;

    thead {
        background: color-mix(in srgb, ${props => props.theme.colors.backgroundSecondary}, transparent 30%);
        border-bottom: 1px solid ${BORDER_COLOR};
    }

    th {
        padding: 16px 20px;
        font-size: 11px;
        font-weight: 700;
        color: ${TEXT_SECONDARY};
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    tbody tr {
        border-bottom: 1px solid ${BORDER_COLOR};
        transition: all 0.2s ease;

        &:last-child {
            border-bottom: none;
        }

        &:hover {
            background: color-mix(in srgb, ${props => props.theme.colors.primary}, transparent 95%);
        }
    }

    td {
        padding: 18px 20px;
        font-size: 14px;
        color: ${TEXT_PRIMARY};
        vertical-align: middle;
    }
`;

const Badge = styled.span<{ $color: string; $bg: string }>`
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: ${props => props.$color};
    background-color: ${props => props.$bg};
    text-transform: uppercase;
`;

const UserInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .name {
        font-weight: 600;
        color: ${TEXT_PRIMARY};
        font-size: 14px;
    }
    .email {
        font-size: 12px;
        color: ${TEXT_SECONDARY};
    }
`;

const DetailsCell = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: ${TEXT_SECONDARY};
    padding: 6px 12px;
    border-radius: 8px;
    background: ${props => props.theme.colors.backgroundSecondary};
    border: none;
    transition: all 0.2s ease;
    font-size: 14px;
    font-family: inherit;

    &:hover {
        background: #667eea;
        color: white;
    }
`;

// Modal Components
const ModalOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
    animation: fadeIn 0.2s ease;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const ModalContent = styled.div`
    background: ${props => props.theme.colors.background};
    border-radius: 16px;
    width: 100%;
    max-width: 700px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideUp 0.3s ease;

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

const ModalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid ${BORDER_COLOR};
    background: ${props => props.theme.colors.backgroundSecondary};
`;

const ModalTitle = styled.h2`
    font-size: 18px;
    font-weight: 700;
    color: ${TEXT_PRIMARY};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const ModalClose = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: ${props => props.theme.colors.background};
    color: ${TEXT_SECONDARY};
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #fee2e2;
        color: #b91c1c;
    }
`;

const ModalBody = styled.div`
    padding: 24px;
    overflow-y: auto;
    max-height: calc(85vh - 140px);
`;

const DetailSection = styled.div`
    margin-bottom: 24px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const DetailLabel = styled.div`
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${TEXT_SECONDARY};
    margin-bottom: 8px;
`;

const DetailValue = styled.div`
    font-size: 14px;
    color: ${TEXT_PRIMARY};
    font-weight: 500;
`;

const MetaGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background: ${props => props.theme.colors.backgroundSecondary};
    border-radius: 12px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const MetaItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
        color: #667eea;
        flex-shrink: 0;
    }

    .label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: ${TEXT_SECONDARY};
    }

    .value {
        font-size: 14px;
        font-weight: 600;
        color: ${TEXT_PRIMARY};
    }
`;

const JsonBlock = styled.div<{ $variant: 'old' | 'new' }>`
    background: ${props => props.$variant === 'old'
        ? `color-mix(in srgb, ${props.theme.colors.error}, transparent 95%)`
        : `color-mix(in srgb, ${props.theme.colors.primary}, transparent 95%)`};
    border: 1px solid ${props => props.$variant === 'old'
        ? `color-mix(in srgb, ${props.theme.colors.error}, transparent 80%)`
        : `color-mix(in srgb, ${props.theme.colors.primary}, transparent 80%)`};
    border-radius: 10px;
    padding: 16px;
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    color: ${TEXT_PRIMARY};

    pre {
        margin: 0;
    }
`;

const JsonLabel = styled.div<{ $variant: 'old' | 'new' }>`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: ${props => props.$variant === 'old' ? props.theme.colors.error : props.theme.colors.primary};
    margin-bottom: 10px;
`;


const Pagination = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    background: ${props => props.theme.colors.backgroundSecondary};
    border-top: 1px solid ${BORDER_COLOR};
    font-size: 14px;
    color: ${TEXT_SECONDARY};
    
    b {
        color: ${TEXT_PRIMARY};
        font-weight: 600;
    }
`;

const PageActions = styled.div`
    display: flex;
    gap: 20px;

    button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: ${props => props.theme.colors.background};
        color: ${TEXT_PRIMARY};
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
            background: ${props => props.theme.colors.backgroundSecondary};
            border-color: #667eea;
            color: #667eea;
        }

        &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
    }
`;

const LoadingOverlay = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 80px;
    color: #64748b;
    gap: 16px;
    
    svg {
        color: #667eea;
    }
    
    span {
        font-size: 14px;
        font-weight: 500;
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 32px;
    text-align: center;
    
    svg {
        width: 48px;
        height: 48px;
        color: #cbd5e1;
        margin-bottom: 16px;
    }
    
    h3 {
        font-size: 16px;
        font-weight: 600;
        color: ${TEXT_PRIMARY};
        margin: 0 0 8px 0;
    }
    
    p {
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
    }
`;

export default function AuditLogsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();
    const theme = useTheme();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Filters
    const [filters, setFilters] = useState<AuditLogFilters>({
        limit: 10,
        skip: 0
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce search term
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Apply debounced search term using the correct 'search' parameter
            const currentFilters: AuditLogFilters = { ...filters };
            if (debouncedSearch) {
                currentFilters.search = debouncedSearch;
            }
            const data = await auditService.getLogs(currentFilters);
            setLogs(data);
        } catch (err: any) {
            console.error('Failed to fetch audit logs:', err);
            setError('Failed to load audit logs. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filters, debouncedSearch]);

    useEffect(() => {
        // Check for admin-level access
        const adminRoles: string[] = [UserType.ADMIN];
        if (!isLoading && (!isAuthenticated || !user?.role || !adminRoles.includes(user.role))) {
            router.push('/admin/audit');
        }
    }, [isAuthenticated, isLoading, user, router]);

    useEffect(() => {
        const adminRoles: string[] = [UserType.ADMIN];
        if (isAuthenticated && user?.role && adminRoles.includes(user.role)) {
            fetchLogs();
        }
    }, [isAuthenticated, user, fetchLogs]);

    const handlePageChange = (direction: 'next' | 'prev') => {
        const delta = direction === 'next' ? (filters.limit || 50) : -(filters.limit || 50);
        const newSkip = Math.max(0, (filters.skip || 0) + delta);
        setFilters(prev => ({ ...prev, skip: newSkip }));
    };

    const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, skip: 0 }));
    };

    const getActionStyles = (action: string) => {
        const type = action.toLowerCase();
        switch (type) {
            case 'create': return { color: theme.colors.primary, bg: `color-mix(in srgb, ${theme.colors.primary}, transparent 90%)` };
            case 'update': return { color: '#3b82f6', bg: `color-mix(in srgb, #3b82f6, transparent 90%)` };
            case 'delete': return { color: theme.colors.error, bg: `color-mix(in srgb, ${theme.colors.error}, transparent 90%)` };
            case 'login': return { color: '#a855f7', bg: `color-mix(in srgb, #a855f7, transparent 90%)` };
            case 'logout': return { color: theme.colors.mutedForeground, bg: `color-mix(in srgb, ${theme.colors.mutedForeground}, transparent 90%)` };
            case 'approve': return { color: '#22c55e', bg: `color-mix(in srgb, #22c55e, transparent 90%)` };
            case 'reject': return { color: '#f97316', bg: `color-mix(in srgb, #f97316, transparent 90%)` };
            default: return { color: theme.colors.mutedForeground, bg: `color-mix(in srgb, ${theme.colors.mutedForeground}, transparent 90%)` };
        }
    };

    const renderJSON = (jsonStr: string | undefined | null) => {
        if (!jsonStr) return null;
        try {
            const parsed = JSON.parse(jsonStr);
            return <pre>{JSON.stringify(parsed, null, 2)}</pre>;
        } catch {
            return <div>{jsonStr}</div>;
        }
    };

    if (isLoading || !isAuthenticated || !user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <RefreshCw className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <LayoutContainer>
            <Sidebar />
            <MainContent>
                <Navbar />
                <ContentWrapper>
                    <PageHeader>
                        <TitleSection>
                            <h1><Shield /> Audit Logs</h1>
                            <p>Track all critical system activities and user actions</p>
                        </TitleSection>
                        <RefreshButton onClick={fetchLogs}>
                            <RefreshCw className={loading ? 'spinning' : ''} size={18} />
                            Refresh Logs
                        </RefreshButton>
                    </PageHeader>

                    <FilterCard>
                        <FilterGrid>
                            <InputGroup>
                                <label>Search User</label>
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Username or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </InputGroup>

                            <InputGroup>
                                <label>Action</label>
                                <Activity size={16} />
                                <select
                                    onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                                    value={filters.action || ''}
                                >
                                    <option value="">All Actions</option>
                                    <option value="create">Create</option>
                                    <option value="update">Update</option>
                                    <option value="delete">Delete</option>
                                    <option value="login">Login</option>
                                    <option value="logout">Logout</option>
                                    <option value="approve">Approve</option>
                                    <option value="reject">Reject</option>
                                </select>
                            </InputGroup>

                            <InputGroup>
                                <label>Resource Type</label>
                                <Box size={16} />
                                <select
                                    onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
                                    value={filters.resource_type || ''}
                                >
                                    <option value="">All Resources</option>
                                    <option value="auth">Auth</option>
                                    <option value="user">User</option>
                                    <option value="sale">Sale</option>
                                    <option value="inventory">Inventory</option>
                                    <option value="revenue">Revenue</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </InputGroup>

                            <InputGroup>
                                <label>Start Date</label>
                                <Calendar size={16} />
                                <input
                                    type="date"
                                    onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                                    value={filters.start_date || ''}
                                />
                            </InputGroup>
                        </FilterGrid>
                    </FilterCard>

                    <TableCard>
                        <div style={{ overflowX: 'auto' }}>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Resource</th>
                                        <th>Details</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <LoadingOverlay>
                                                    <RefreshCw className="spinning" size={24} />
                                                    <span>Loading system logs...</span>
                                                </LoadingOverlay>
                                            </td>
                                        </tr>
                                    ) : logs.length > 0 ? (
                                        logs.map((log) => {
                                            const styles = getActionStyles(log.action);
                                            return (
                                                <tr key={log.id}>
                                                    <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <UserInfo>
                                                            <span className="name">{log.user?.full_name || log.user_full_name || log.user?.username || 'System'}</span>
                                                            <span className="email">{log.user?.email || log.user_email}</span>
                                                        </UserInfo>
                                                    </td>
                                                    <td>
                                                        <Badge $color={styles.color} $bg={styles.bg}>
                                                            {log.action}
                                                        </Badge>
                                                    </td>
                                                    <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                                        {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                                                    </td>
                                                    <td>
                                                        <DetailsCell
                                                            onClick={() => setSelectedLog(log)}
                                                        >
                                                            <Info size={14} />
                                                            <span>View Details</span>
                                                        </DetailsCell>
                                                    </td>


                                                    <td style={{ color: theme.colors.mutedForeground, fontFamily: "'SF Mono', monospace", fontSize: 13 }}>
                                                        {log.ip_address || '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={6}>
                                                <EmptyState>
                                                    <Shield />
                                                    <h3>No audit logs found</h3>
                                                    <p>Try adjusting your filters or check back later.</p>
                                                </EmptyState>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        <Pagination>
                            <div>
                                Showing <b>{(filters.skip || 0) + 1}</b> to <b>{(filters.skip || 0) + logs.length}</b> logs
                            </div>
                            <PageActions>
                                <button
                                    onClick={() => handlePageChange('prev')}
                                    disabled={filters.skip === 0}
                                    title="Previous Page"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => handlePageChange('next')}
                                    disabled={logs.length < (filters.limit || 50)}
                                    title="Next Page"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </PageActions>
                        </Pagination>
                    </TableCard>
                </ContentWrapper>
            </MainContent>

            {/* Details Modal */}
            {selectedLog && (
                <ModalOverlay onClick={() => setSelectedLog(null)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>
                                <Info size={20} />
                                Audit Log Details
                            </ModalTitle>
                            <ModalClose onClick={() => setSelectedLog(null)}>
                                <X size={18} />
                            </ModalClose>
                        </ModalHeader>
                        <ModalBody>
                            <MetaGrid>
                                <MetaItem>
                                    <Clock size={18} />
                                    <div>
                                        <div className="label">Timestamp</div>
                                        <div className="value">{new Date(selectedLog.created_at).toLocaleString()}</div>
                                    </div>
                                </MetaItem>
                                <MetaItem>
                                    <Activity size={18} />
                                    <div>
                                        <div className="label">Action</div>
                                        <div className="value" style={{ textTransform: 'uppercase' }}>{selectedLog.action}</div>
                                    </div>
                                </MetaItem>
                                <MetaItem>
                                    <Globe size={18} />
                                    <div>
                                        <div className="label">IP Address</div>
                                        <div className="value">{selectedLog.ip_address || 'Unknown'}</div>
                                    </div>
                                </MetaItem>
                            </MetaGrid>

                            <DetailSection>
                                <DetailLabel>User</DetailLabel>
                                <DetailValue>
                                    {selectedLog.user?.full_name || selectedLog.user_full_name || selectedLog.user?.username || 'System'}
                                    {(selectedLog.user?.email || selectedLog.user_email) && (
                                        <span style={{ color: theme.colors.mutedForeground, marginLeft: 8 }}>
                                            ({selectedLog.user?.email || selectedLog.user_email})
                                        </span>
                                    )}
                                </DetailValue>
                            </DetailSection>

                            <DetailSection>
                                <DetailLabel>Resource</DetailLabel>
                                <DetailValue style={{ textTransform: 'capitalize' }}>
                                    {selectedLog.resource_type} {selectedLog.resource_id ? `#${selectedLog.resource_id}` : ''}
                                </DetailValue>
                            </DetailSection>

                            {selectedLog.old_values && (
                                <DetailSection>
                                    <JsonLabel $variant="old">
                                        <Box size={14} />
                                        Previous Values
                                    </JsonLabel>
                                    <JsonBlock $variant="old">
                                        {renderJSON(selectedLog.old_values)}
                                    </JsonBlock>
                                </DetailSection>
                            )}

                            {selectedLog.new_values && (
                                <DetailSection>
                                    <JsonLabel $variant="new">
                                        <Box size={14} />
                                        New Values
                                    </JsonLabel>
                                    <JsonBlock $variant="new">
                                        {renderJSON(selectedLog.new_values)}
                                    </JsonBlock>
                                </DetailSection>
                            )}

                            {!selectedLog.old_values && !selectedLog.new_values && (
                                <DetailSection>
                                    <div style={{
                                        padding: '20px',
                                        background: theme.colors.backgroundSecondary,
                                        borderRadius: '10px',
                                        textAlign: 'center',
                                        color: theme.colors.mutedForeground,
                                        fontSize: '14px'
                                    }}>
                                        <Info size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                                        <p style={{ margin: 0 }}>No data changes recorded for this action.</p>
                                        <p style={{ margin: '8px 0 0 0', fontSize: 12, color: theme.colors.mutedForeground }}>
                                            This is typically for actions like login, logout, or view events.
                                        </p>
                                    </div>
                                </DetailSection>
                            )}


                            {selectedLog.user_agent && (
                                <DetailSection>
                                    <DetailLabel>User Agent</DetailLabel>
                                    <DetailValue style={{ fontSize: 12, color: theme.colors.mutedForeground, wordBreak: 'break-all' }}>
                                        {selectedLog.user_agent}
                                    </DetailValue>
                                </DetailSection>
                            )}
                        </ModalBody>
                    </ModalContent>
                </ModalOverlay>
            )}
        </LayoutContainer>
    );
}

