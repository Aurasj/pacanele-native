import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import SlotMachine from '../src/components/SlotMachine';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <SlotMachine />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
