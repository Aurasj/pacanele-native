import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

interface GambleProps {
    win: number;
    onClose: (finalAmount: number) => void;
}

const HISTORY_LIMIT = 5;

// istoric fals pt sesiune (se poate folosi AsyncStorage)
let globalHistory: string[] = [];

export default function Gamble({ win, onClose }: GambleProps) {
    const [currentWin, setCurrentWin] = useState(win);
    const [revealed, setRevealed] = useState<'red' | 'black' | null>(null);
    const [result, setResult] = useState<boolean | null>(null);
    const [history, setHistory] = useState<string[]>(globalHistory);

    const flipAnim = useSharedValue(0);
    const scaleAnim = useSharedValue(1);

    useEffect(() => {
        // animatie de intrare
        scaleAnim.value = withSpring(1);
    }, []);

    const pick = (color: 'red' | 'black') => {
        if (revealed) return;

        // animeaza intoarcerea
        flipAnim.value = withSequence(
            withTiming(90, { duration: 150 }),
            withTiming(0, { duration: 150 })
        );

        setTimeout(() => {
            const real = Math.random() < 0.5 ? 'red' : 'black';
            setRevealed(real);

            const isWin = real === color;
            setResult(isWin);

            if (isWin) {
                setCurrentWin(prev => prev * 2);
            }

            // actualizeaza istoric
            const newHistory = [...history, real].slice(-HISTORY_LIMIT);
            setHistory(newHistory);
            globalHistory = newHistory;

        }, 150);
    };

    const continueGamble = () => {
        setRevealed(null);
        setResult(null);
        flipAnim.value = 0;
    };

    const collect = () => {
        onClose(result === false ? 0 : currentWin);
    };

    // stiluri animate
    const cardStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotateY: `${flipAnim.value}deg` }
            ]
        };
    });

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.title}>DUBLEAZA FRATE</Text>

                <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>CASTIG CURENT</Text>
                    <Text style={styles.amountValue}>{currentWin.toFixed(2)} LEI</Text>
                </View>

                {/* CARD AREA */}
                <View style={styles.cardArea}>
                    <Animated.View style={[styles.card, cardStyle]}>
                        {!revealed ? (
                            <View style={styles.cardBack} />
                        ) : (
                            <Image
                                source={revealed === 'red'
                                    ? require('../../assets/cards/red.png')
                                    : require('../../assets/cards/black.png')
                                }
                                style={styles.cardImage}
                                contentFit="contain"
                            />
                        )}
                    </Animated.View>
                </View>

                {/* CONTROLS */}
                {result === null ? (
                    <View style={{ width: '100%', alignItems: 'center', gap: 15 }}>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={() => pick('red')}>
                                <Text style={styles.btnText}>ROSIE</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnBlack]} onPress={() => pick('black')}>
                                <Text style={styles.btnText}>NEAGRA</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={[styles.btn, styles.btnGreen, { minWidth: 200 }]} onPress={collect}>
                            <Text style={styles.btnText}>COLECTEAZA</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.resultContainer}>
                        {result ? (
                            <>
                                <Text style={styles.winMsg}>AI CASTIGAT!</Text>
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={continueGamble}>
                                        <Text style={styles.btnText}>DUBLEAZA IAR</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={collect}>
                                        <Text style={styles.btnText}>IA BANII</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.loseMsg}>AI PIERDUT...</Text>
                                <TouchableOpacity style={[styles.btn, styles.btnGray]} onPress={() => onClose(0)}>
                                    <Text style={styles.btnText}>INAPOI</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {/* HISTORY */}
                <View style={styles.historyContainer}>
                    <Text style={styles.historyLabel}>ISTORIC:</Text>
                    <View style={styles.historyRow}>
                        {history.map((h, i) => (
                            <Image
                                key={i}
                                source={h === 'red'
                                    ? require('../../assets/cards/red.png')
                                    : require('../../assets/cards/black.png')
                                }
                                style={styles.historyCard}
                                contentFit="contain"
                            />
                        ))}
                    </View>
                </View>

            </Animated.View>
        </View>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100000,
    },
    container: {
        width: Math.min(width - 40, 450),
        backgroundColor: '#222',
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#FFD700',
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 20,
        textShadowColor: '#ffa500',
        textShadowRadius: 10,
    },
    amountBox: {
        alignItems: 'center',
        marginBottom: 30,
    },
    amountLabel: {
        color: '#aaa',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    amountValue: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 215, 0, 0.5)',
        textShadowRadius: 10,
    },
    cardArea: {
        height: 220,
        justifyContent: 'center',
        marginBottom: 30,
    },
    card: {
        width: 140,
        height: 200,
        backfaceVisibility: 'hidden',
    },
    cardBack: {
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
        borderRadius: 10,
        borderWidth: 4,
        borderColor: '#fff',
        // model simplu pt spatele cartii
        borderStyle: 'dashed',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 15,
        justifyContent: 'center',
        width: '100%',
    },
    btn: {
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 10,
        minWidth: 120,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    btnRed: { backgroundColor: '#cc0000' },
    btnBlack: { backgroundColor: '#111' },
    btnBlue: { backgroundColor: '#0066ff' },
    btnGreen: { backgroundColor: '#00aa00' },
    btnGray: { backgroundColor: '#555' },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultContainer: {
        alignItems: 'center',
        width: '100%',
    },
    winMsg: {
        color: '#00ff00',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
        textShadowColor: 'rgba(0, 255, 0, 0.5)',
        textShadowRadius: 10,
    },
    loseMsg: {
        color: '#ff0000',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    historyContainer: {
        marginTop: 30,
        alignItems: 'center',
        width: '100%',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    historyLabel: {
        color: '#666',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    historyRow: {
        flexDirection: 'row',
        gap: 10,
    },
    historyCard: {
        width: 30,
        height: 45,
        borderRadius: 4,
    }
});
