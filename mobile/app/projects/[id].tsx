import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { ArrowLeft, Folder, Calendar, DollarSign, Briefcase, Info, CheckCircle2, XCircle } from 'lucide-react-native';

export default function ProjectDetailScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchProject = async () => {
        try {
            const response = await client.get(`/projects/${id}`);
            setProject(response.data);
        } catch (error) {
            console.error('Error fetching project details:', error);
            Alert.alert('Error', 'Failed to load project details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!project) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Project Details</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Folder size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: project.is_active ? '#dcfce7' : '#fee2e2' }]}>
                        <Text style={[styles.statusText, { color: project.is_active ? '#16a34a' : '#dc2626' }]}>
                            {project.is_active ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoGrid}>
                    <InfoBox
                        icon={DollarSign}
                        label="Budget"
                        value={`$${project.budget?.toLocaleString() || '0'}`}
                        colors={colors}
                    />
                    <InfoBox
                        icon={Calendar}
                        label="Deadline"
                        value={project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No deadline'}
                        colors={colors}
                    />
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <Info size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                    </View>
                    <Text style={[styles.descriptionText, { color: colors.muted }]}>
                        {project.description || 'No description provided for this project.'}
                    </Text>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <Briefcase size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Department Info</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.muted }]}>Project Type</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{project.project_type || 'General'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.muted }]}>Start Date</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const InfoBox = ({ icon: Icon, label, value, colors }: any) => (
    <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon size={20} color={colors.primary} />
        <Text style={[styles.infoBoxLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.infoBoxValue, { color: colors.text }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    mainCard: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    projectName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    infoBox: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 4,
    },
    infoBoxLabel: {
        fontSize: 12,
    },
    infoBoxValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    section: {
        paddingVertical: 20,
        borderTopWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});
