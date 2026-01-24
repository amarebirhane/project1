import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { DollarSign, Tag, Calendar, FileText } from 'lucide-react-native';

export default function CreateExpenseScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [vendor, setVendor] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async () => {
        if (!title || !amount || !category) {
            Alert.alert('Error', 'Please fill in required fields (Title, Amount, Category)');
            return;
        }

        setLoading(true);
        try {
            await client.post('/expenses/', {
                title,
                amount: parseFloat(amount),
                category: category.toUpperCase(), // Assuming backend expects uppercase enum
                vendor: vendor || 'Unknown',
                description,
                date: new Date().toISOString(),
                is_recurring: false,
            });

            // router.back(); // Go back to list
            // Or to ensure refresh
            router.back();
        } catch (error: any) {
            console.error('Create expense error:', error);
            Alert.alert('Error', 'Failed to create expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Title</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <FileText size={20} color={colors.muted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="e.g. Office Supplies"
                            placeholderTextColor={colors.muted}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Amount</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <DollarSign size={20} color={colors.muted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="0.00"
                            placeholderTextColor={colors.muted}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                        {['salary', 'rent', 'utilities', 'marketing', 'equipment', 'travel', 'supplies', 'insurance', 'taxes', 'other'].map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor: category === cat ? colors.primary : colors.secondary,
                                        borderColor: category === cat ? colors.primary : colors.border
                                    }
                                ]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    { color: category === cat ? '#fff' : colors.text }
                                ]}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Vendor</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text, marginLeft: 0 }]}
                            placeholder="e.g. Amazon"
                            placeholderTextColor={colors.muted}
                            value={vendor}
                            onChangeText={setVendor}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Save Expense</Text>
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
    button: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    categoryList: {
        flexDirection: 'row',
        marginTop: 4,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
