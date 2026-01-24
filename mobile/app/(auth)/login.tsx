import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Mail, Lock, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';

const THEME = {
    bg: '#0b0c10',
    card: 'rgba(30, 41, 59, 0.6)',
    text: '#f9fafb',
    textSecondary: '#94a3b8',
    primary: '#00AA00',
    primaryGradient: ['#00AA00', '#10b981'] as const,
    border: 'rgba(148, 163, 184, 0.1)',
    inputBg: 'rgba(15, 23, 42, 0.4)',
    focusBorder: '#00AA00',
    error: '#f87171',
};

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const { login, isLoading, error } = useAuthStore();
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await login(email, password);
        } catch (err) {
            // Error handling in store
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradients */}
            <LinearGradient
                colors={['#0f172a', '#0b0c10']}
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.glowMap, { top: -100, left: -50, backgroundColor: 'rgba(0, 170, 0, 0.1)' }]} />
            <View style={[styles.glowMap, { bottom: -100, right: -50, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={THEME.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to access your dashboard</Text>
                    </View>

                    {/* Glassmorphic Form Card */}
                    <View style={styles.cardContainer}>
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                                <LoginForm
                                    email={email} setEmail={setEmail}
                                    password={password} setPassword={setPassword}
                                    showPassword={showPassword} setShowPassword={setShowPassword}
                                    focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                                    handleLogin={handleLogin} isLoading={isLoading} error={error}
                                />
                            </BlurView>
                        ) : (
                            <View style={[styles.glassCard, { backgroundColor: THEME.card }]}>
                                <LoginForm
                                    email={email} setEmail={setEmail}
                                    password={password} setPassword={setPassword}
                                    showPassword={showPassword} setShowPassword={setShowPassword}
                                    focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                                    handleLogin={handleLogin} isLoading={isLoading} error={error}
                                />
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const LoginForm = ({ email, setEmail, password, setPassword, showPassword, setShowPassword, focusedInput, setFocusedInput, handleLogin, isLoading, error }: any) => (
    <View style={styles.formContent}>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
                styles.inputContainer,
                focusedInput === 'email' && styles.inputFocused
            ]}>
                <Mail size={20} color={focusedInput === 'email' ? THEME.primary : THEME.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                />
            </View>
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[
                styles.inputContainer,
                focusedInput === 'password' && styles.inputFocused
            ]}>
                <Lock size={20} color={focusedInput === 'password' ? THEME.primary : THEME.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword ? <EyeOff size={20} color={THEME.textSecondary} /> : <Eye size={20} color={THEME.textSecondary} />}
                </TouchableOpacity>
            </View>
        </View>

        {error && (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        )}

        <TouchableOpacity
            style={styles.loginButtonWrapper}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={THEME.primaryGradient}
                style={styles.loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <LogIn size={20} color="white" style={{ marginLeft: 8 }} />
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/register" asChild>
                <TouchableOpacity>
                    <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
            </Link>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.bg,
    },
    glowMap: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
        transform: [{ scale: 1.5 }],
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 24,
        zIndex: 10,
        padding: 8,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.textSecondary,
    },
    cardContainer: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    glassCard: {
        width: '100%',
    },
    formContent: {
        padding: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: THEME.text,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: THEME.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.border,
        paddingHorizontal: 16,
    },
    inputFocused: {
        borderColor: THEME.focusBorder,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    errorContainer: {
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.2)',
    },
    errorText: {
        color: THEME.error,
        textAlign: 'center',
        fontSize: 14,
    },
    loginButtonWrapper: {
        width: '100%',
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 24,
    },
    loginButton: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: THEME.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: THEME.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
});
