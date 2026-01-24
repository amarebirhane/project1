import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
    const { colors } = useTheme();
    const { user, logout } = useAuthStore();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>
                        {user?.full_name || 'User Name'}
                    </Text>
                    <Text style={[styles.email, { color: colors.muted }]}>
                        {user?.email || 'email@example.com'}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.roleText, { color: colors.primary }]}>
                            {user?.role || 'User'}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.muted }]}>Account Settings</Text>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.menuText, { color: colors.text }]}>Security & Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.menuText, { color: colors.text }]}>Notification Preferences</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={logout}
                >
                    <LogOut size={20} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center', // Center mainly for this simple view
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        marginBottom: 12,
    },
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    section: {
        width: '100%',
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 12,
        marginLeft: 4,
    },
    menuItem: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
