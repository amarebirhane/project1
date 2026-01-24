import { useEffect } from 'react';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inProtectedGroup = inTabsGroup || segments[0] === 'expenses' || segments[0] === 'projects';

    if (isAuthenticated && (inAuthGroup || !inProtectedGroup)) {
      // If user is signed in and trying to access auth pages or landing, redirect to tabs
      router.replace('/(tabs)');
    } else if (!isAuthenticated && inProtectedGroup) {
      // If user is not signed in and trying to access protected pages, redirect to login
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="expenses/create" options={{ presentation: 'modal', title: 'Add Expense', headerShown: true }} />
        <Stack.Screen name="projects/create" options={{ presentation: 'modal', title: 'New Project', headerShown: true }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}
