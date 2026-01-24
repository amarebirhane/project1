import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { Briefcase, FileText, DollarSign, Calendar } from 'lucide-react-native';

export default function CreateProjectScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [isActive, setIsActive] = useState(true);

    const handleSubmit = async () => {
        if (!name) {
            Alert.alert('Error', 'Please enter a project name');
            return;
        }

        setLoading(true);
        try {
            await client.post('/projects/', {
                name,
                description,
                budget: parseFloat(budget) || 0,
                is_active: isActive,
                start_date: new Date().toISOString(),
            });

            Alert.alert("Success", "Project created successfully");
            router.back();
        } catch (error: any) {
            console.error('Create project error:', error);
            Alert.alert('Error', 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Project Name</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <Briefcase size={20} color={colors.muted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="e.g. New Office Expansion"
                            placeholderTextColor={colors.muted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Budget (optional)</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <DollarSign size={20} color={colors.muted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="0.00"
                            placeholderTextColor={colors.muted}
                            value={budget}
                            onChangeText={setBudget}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                    <View style={[styles.textAreaContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.textArea, { color: colors.text }]}
                            placeholder="Describe the project goal..."
                            placeholderTextColor={colors.muted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </View>

                <View style={styles.switchGroup}>
                    <View>
                        <Text style={[styles.switchLabel, { color: colors.text }]}>Active Status</Text>
                        <Text style={[styles.switchSublabel, { color: colors.muted }]}>Set whether this project is currently active</Text>
                    </View>
                    <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Create Project</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    textAreaContainer: {
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 100,
    },
    textArea: {
        flex: 1,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    switchGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 20,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    switchSublabel: {
        fontSize: 12,
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
