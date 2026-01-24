import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { register, isLoading, error } = useAuthStore();
    const { colors } = useTheme();
    const router = useRouter();

    const handleRegister = async () => {
        try {
            await register({
                full_name: fullName,
                email,
                password,
                role: 'USER' // Default role
            });
            router.replace('/login');
        } catch (err) {
            // Error handled in store
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>
                        Join us to manage your finances smarter
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <User size={20} color={colors.muted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Full Name"
                            placeholderTextColor={colors.muted}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <Mail size={20} color={colors.muted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Email"
                            placeholderTextColor={colors.muted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <Lock size={20} color={colors.muted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Password"
                            placeholderTextColor={colors.muted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            {showPassword ? (
                                <EyeOff size={20} color={colors.muted} />
                            ) : (
                                <Eye size={20} color={colors.muted} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.buttonText}>Get Started</Text>
                                <ArrowRight size={20} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.muted }]}>
                            Already have an account?
                        </Text>
                        <Link href="/login" asChild>
                            <TouchableOpacity>
                                <Text style={[styles.linkText, { color: colors.primary }]}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 14,
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
