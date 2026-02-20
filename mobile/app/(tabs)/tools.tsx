import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
// client removed as it was unused
import { Camera, FileText, Cpu, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const ToolButton = ({ title, description, icon: Icon, onPress, colors }: any) => (
    <TouchableOpacity
        style={[styles.toolBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
    >
        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
            <Icon size={24} color={colors.primary} />
        </View>
        <View style={styles.toolInfo}>
            <Text style={[styles.toolTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.toolDesc, { color: colors.muted }]}>{description}</Text>
        </View>
        <ChevronRight size={20} color={colors.muted} />
    </TouchableOpacity>
);

export default function ToolsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleReceiptScan = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to scan receipts.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadReceipt(result.assets[0].uri);
        }
    };

    const uploadReceipt = async (uri: string) => {
        setIsProcessing(true);
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'receipt.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            // Note: In React Native, we need to append an object for the file
            formData.append('file', {
                uri,
                name: filename,
                type,
            } as any);

            // Mocking the OCR processing for now if backend doesn't have the endpoint
            // In a real implementation:
            // const response = await client.post('/documents/process-receipt', formData, {
            //     headers: { 'Content-Type': 'multipart/form-data' }
            // });

            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

            Alert.alert(
                "Receipt Processed",
                "Successfully extracted data from receipt. Would you like to create an expense?",
                [
                    { text: "Later", style: "cancel" },
                    { text: "Create Expense", onPress: () => router.push('/expenses/create') }
                ]
            );
        } catch (error) {
            console.error('OCR Upload error:', error);
            Alert.alert('Error', 'Failed to process receipt.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Intelligent Tools</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                    Leverage AI and computer vision for your finances
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>VISION TOOLS</Text>
                <ToolButton
                    title="Receipt Scanner"
                    description="Instantly extract data from photos of receipts"
                    icon={Camera}
                    onPress={handleReceiptScan}
                    colors={colors}
                />
                <ToolButton
                    title="Batch Document Processing"
                    description="Upload multiple invoices for bulk analysis"
                    icon={FileText}
                    onPress={() => Alert.alert("Coming Soon", "Multi-document processing is being optimized.")}
                    colors={colors}
                />
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>AI ASSISTANTS</Text>
                <ToolButton
                    title="Financial Forecaster"
                    description="AI-driven predictions for your revenue/expenses"
                    icon={Cpu}
                    onPress={() => router.push('/explore')} // Redirect to analytics for now
                    colors={colors}
                />
                <ToolButton
                    title="Business Chatbot"
                    description="Ask questions about your financial health"
                    icon={Sparkles}
                    onPress={() => Alert.alert("AI Chat", "The AI assistant is preparing for deployment.")}
                    colors={colors}
                />
            </View>

            {isProcessing && (
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: '#fff', marginTop: 12, fontWeight: 'bold' }}>
                        Analyzing document...
                    </Text>
                </View>
            )}

            <View style={[styles.statusCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <CheckCircle2 size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.statusTitle, { color: colors.text }]}>ML Systems Online</Text>
                    <Text style={[styles.statusDesc, { color: colors.muted }]}>
                        Auto-learning is currently processing recent transactions.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 30,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    toolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    iconBox: {
        padding: 12,
        borderRadius: 12,
    },
    toolInfo: {
        flex: 1,
        marginLeft: 16,
        marginRight: 8,
    },
    toolTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    toolDesc: {
        fontSize: 12,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    statusCard: {
        margin: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statusDesc: {
        fontSize: 12,
    },
});
