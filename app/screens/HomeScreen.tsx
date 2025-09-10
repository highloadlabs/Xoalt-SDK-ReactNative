import React from 'react';
import { View, Text,  StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator.tsx';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export const HomeScreen: React.FC<Props> = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏠 Home Screen</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, marginBottom: 16 },
});
