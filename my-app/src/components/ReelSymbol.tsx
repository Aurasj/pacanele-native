
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

interface SymbolProps {
    src: any;
    className?: string;
    size?: number;
}

export default function ReelSymbol({ src, className, size = 100 }: SymbolProps) {
    const isWin = className?.includes('win');
    const showFlame = className?.includes('win-symbol');

    const pulse = useSharedValue(1);

    useEffect(() => {
        if (isWin) {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 300 }),
                    withTiming(1, { duration: 300 })
                ),
                -1,
                true
            );
        } else {
            pulse.value = 1;
        }
    }, [isWin]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }]
    }));

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* flacara e in SPATELE simbolului acum z-index 0/1 */}
            {showFlame && (
                <Image
                    source={require('../../assets/flame.gif')}
                    style={[styles.flame, { width: size, height: size }]}
                    contentFit="contain"
                />
            )}

            {/* imaginea simbolului PULSEAZA */}
            <Animated.View style={[{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 10 }, animatedStyle]}>
                <Image
                    source={src}
                    style={styles.image}
                    contentFit="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    image: {
        width: '90%',
        height: '90%',
    },
    flame: {
        position: 'absolute',
        zIndex: 0,
        opacity: 0.8,
    }
});
