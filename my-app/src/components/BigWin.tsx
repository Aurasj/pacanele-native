
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface BigWinProps {
    amount: number;
}

export default function BigWin({ amount }: BigWinProps) {
    const scale = useSharedValue(0.1);
    const rotation = useSharedValue(0);

    useEffect(() => {
        // intrare + puls continuu
        scale.value = withSequence(
            withSpring(1.2, { damping: 10 }), // apare brusc
            withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 500, easing: Easing.ease }),
                    withTiming(1, { duration: 500, easing: Easing.ease })
                ),
                -1, // infinit
                true // auto-inversare (desi secventa manuala e mai buna)
            )
        );

        // leganare continua pt imagine
        rotation.value = withRepeat(
            withSequence(
                withTiming(10, { duration: 1500 }),
                withTiming(-10, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const containerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const imageStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.container, containerStyle]}>
                <Animated.View style={imageStyle}>
                    <Image
                        source={require('../../assets/symbols/7.png')}
                        style={{ width: 180, height: 180, marginBottom: 10 }}
                        contentFit="contain"
                    />
                </Animated.View>

                <Text style={styles.title}>BIG WIN!</Text>

                <View style={styles.amountBox}>
                    <Text style={styles.currency}>LEI</Text>
                    <Text style={styles.amount}>{amount.toFixed(2)}</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)', // fundal mai inchis pt contrast
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
    },
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 70,
        fontWeight: '900',
        color: '#FFD700', // auriu
        textShadowColor: '#bf6c00', // umbra mai inchisa
        textShadowOffset: { width: 4, height: 4 },
        textShadowRadius: 15,
        letterSpacing: 2,
    },
    amountBox: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 10,
        backgroundColor: '#cc0000', // fundal rosu pt bani
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#FFD700',
        elevation: 10, // umbra pt android
        shadowColor: 'black', // umbra pt ios
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
    },
    amount: {
        fontSize: 55,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'black',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    currency: {
        fontSize: 25,
        color: '#FFD700',
        fontWeight: 'bold',
        marginRight: 10,
    },
});
