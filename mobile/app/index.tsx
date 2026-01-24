import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    StatusBar,
    ScrollView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { TrendingUp, Shield, Zap, ArrowRight, BarChart3, PieChart, Users, FileText } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Frontend Theme Colors
const THEME = {
    bg: '#0b0c10',
    card: 'rgba(31, 41, 55, 0.7)', // #1f2937 with opacity
    text: '#f9fafb',
    textSecondary: '#94a3b8',
    primary: '#00AA00',
    primaryGradient: ['#00AA00', '#10b981'] as const,
    border: 'rgba(0, 170, 0, 0.2)',
    glow: 'rgba(0, 170, 0, 0.1)',
};

const FeatureCard = ({ icon: Icon, title, description, delay }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%', marginBottom: 16 }}>
            {Platform.OS === 'ios' ? (
                <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
                    <CardContent Icon={Icon} title={title} description={description} />
                </BlurView>
            ) : (
                <View style={[styles.cardBlur, { backgroundColor: 'rgba(30, 41, 59, 0.8)' }]}>
                    <CardContent Icon={Icon} title={title} description={description} />
                </View>
            )}
        </Animated.View>
    );
};

const CardContent = ({ Icon, title, description }: any) => (
    <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
            <Icon size={24} color={THEME.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{description}</Text>
        </View>
    </View>
);

export default function LandingScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Gradients */}
            <LinearGradient
                colors={['#0f172a', '#0b0c10']}
                style={StyleSheet.absoluteFill}
            />

            {/* Ambient Glows */}
            <View style={[styles.glowMap, { top: -100, left: -50, backgroundColor: 'rgba(0, 170, 0, 0.15)' }]} />
            <View style={[styles.glowMap, { bottom: -100, right: -50, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
                    <View style={styles.badgeContainer}>
                        <LinearGradient
                            colors={['rgba(0, 170, 0, 0.1)', 'rgba(0, 170, 0, 0.05)']}
                            style={styles.badge}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.badgeText}>New v2.0 Released</Text>
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>
                        Enterprise Financial <Text style={{ color: THEME.primary }}>Management</Text> Platform
                    </Text>

                    <Text style={styles.subtitle}>
                        Transform your financial operations with intelligent automation, real-time analytics, and enterprise-grade security.
                    </Text>

                    <TouchableOpacity
                        style={styles.ctaButtonWrapper}
                        onPress={() => router.push('/(auth)/login')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={THEME.primaryGradient}
                            style={styles.ctaButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.ctaText}>Start Now</Text>
                            <ArrowRight size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        Unlock all features instantly. No payment details required.
                    </Text>
                </Animated.View>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>Powerful Features</Text>

                    <FeatureCard
                        icon={TrendingUp}
                        title="Advanced Analytics"
                        description="Transform raw financial data into actionable insights with real-time analytics."
                        delay={200}
                    />
                    <FeatureCard
                        icon={Zap}
                        title="Intelligent Budgeting"
                        description="Streamline budget planning and allocation across departments."
                        delay={400}
                    />
                    <FeatureCard
                        icon={Shield}
                        title="Enterprise Security"
                        description="Bank-level encryption and comprehensive audit trails."
                        delay={600}
                    />
                    <FeatureCard
                        icon={BarChart3}
                        title="Smart Reporting"
                        description="Generate professional financial reports and balance sheets instantly."
                        delay={800}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

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
        opacity: 0.6,
        transform: [{ scale: 1.5 }],
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 60,
    },
    badgeContainer: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 170, 0, 0.3)',
    },
    badge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    badgeText: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        color: 'white',
        textAlign: 'center',
        lineHeight: 48,
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    ctaButtonWrapper: {
        width: '100%',
        maxWidth: 280,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    ctaButton: {
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ctaText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    disclaimer: {
        marginTop: 16,
        fontSize: 12,
        color: '#6ee7b7',
        textAlign: 'center',
    },
    featuresSection: {
        width: '100%',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 24,
        textAlign: 'center',
    },
    cardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 170, 0, 0.15)',
    },
    cardContent: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 170, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 6,
    },
    cardDesc: {
        fontSize: 14,
        color: '#9ca3af',
        lineHeight: 20,
    },
});
