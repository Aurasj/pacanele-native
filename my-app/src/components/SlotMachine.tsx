import React, { useEffect, useState } from 'react';
import { BackHandler, ImageBackground, LayoutChangeEvent, Linking, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';

import { reelStrips, symbols } from '../constants/symbols';
import soundManager from '../utils/sound_manager';
import BigWin from './BigWin';
import Gamble from './Gamble';
import ReelSymbol from './ReelSymbol';

const BET_VALUES = [1, 5, 10, 20, 30, 50, 100];
const PAYOUTS: { [key: string]: number } = {
    seven: 100,
    crown: 50,
    watermelon: 20,
    grapes: 20,
    plum: 10,
    orange: 10,
    lemon: 5,
    cherry: 5,
    dollar: 20,
};

const LINES = [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0],
    [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0],
    [2, 1, 0, 1, 2],
];

interface ReelProps {
    strip: string[];
    stopIndex: number;
    isSpinning: boolean;
    colIndex: number;
    wildEffect: { cols: number[]; match: number };
    winningSymbols: { col: number; row: number; isDollar?: boolean }[];
    stops: number[];
    showBigWin: boolean;
    symbolSize: number;
    reelHeight: number;
}

const Reel = ({ strip, stopIndex, isSpinning, colIndex, wildEffect, winningSymbols, stops, showBigWin, symbolSize, reelHeight }: ReelProps) => {
    const translateY = useSharedValue(0);
    const fullStrip = [...strip, ...strip, ...strip];
    const stripLen = strip.length;
    const stripHeight = stripLen * symbolSize;

    useEffect(() => {
        if (isSpinning) {
            const duration = 800 + colIndex * 300;
            const totalDistance = stripHeight * (5 + colIndex * 2) + (stopIndex * symbolSize);

            // resetam pt bucla continua
            translateY.value = translateY.value % stripHeight;

            translateY.value = withTiming(-totalDistance, {
                duration: duration,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            });
        }
    }, [isSpinning, stopIndex, colIndex, stripHeight, symbolSize]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value % stripHeight }]
        };
    });

    const isExpandedCrown = (index: number) => {
        if (!wildEffect.cols.includes(colIndex) || wildEffect.match < 3) return false;

        const top = stops[colIndex] % stripLen;
        const mid = (stops[colIndex] + 1) % stripLen;
        const bot = (stops[colIndex] + 2) % stripLen;

        const effectiveIndex = index % stripLen;
        return effectiveIndex === top || effectiveIndex === mid || effectiveIndex === bot;
    };

    const checkWinType = (index: number) => {
        if (showBigWin) return null;

        const found = winningSymbols.find(s => {
            if (s.col !== colIndex) return false;
            const targetIndexInStrip = (stops[colIndex] + s.row) % stripLen;
            const currentIndexInStrip = index % stripLen;
            return currentIndexInStrip === targetIndexInStrip;
        });

        if (!found) return null;
        return found.isDollar ? 'win-dollar' : 'win-symbol';
    };

    const isWildCol = wildEffect.cols.includes(colIndex) && wildEffect.match >= 3;

    return (
        <View style={[styles.reel, isWildCol && styles.wildReel]}>
            <View style={{ width: symbolSize, height: reelHeight, overflow: 'hidden' }}>
                <Animated.View style={animatedStyle}>
                    {fullStrip.map((symbol: string, index: number) => {
                        const forceCrown = isExpandedCrown(index);
                        let winType = checkWinType(index);
                        const src = forceCrown ? symbols['crown'] : symbols[symbol];

                        if ((forceCrown || symbol === 'crown') && winType === 'win-symbol') {
                            winType = 'win';
                        }

                        return (
                            <ReelSymbol
                                key={index}
                                src={src}
                                size={symbolSize}
                                className={winType || ''}
                            />
                        );
                    })}
                </Animated.View>
            </View>
        </View>
    );
};

export default function SlotMachine() {
    const { width, height } = useWindowDimensions();

    // marimi pt toate ecranele
    const maxSymbolWidth = (width - 40) / 5.5;
    const maxSymbolHeight = (height * 0.55) / 3;
    const SYMBOL_SIZE = Math.min(maxSymbolWidth, maxSymbolHeight, 150);
    const REEL_HEIGHT = SYMBOL_SIZE * 3;

    const [reelLayout, setReelLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

    const reelsCount = 5;
    const [stops, setStops] = useState(Array(reelsCount).fill(0));
    const [spinning, setSpinning] = useState(false);
    const [reelSpinning, setReelSpinning] = useState(Array(reelsCount).fill(false));

    const [coins, setCoins] = useState(700);
    const [lastWin, setLastWin] = useState(0);
    const [betIndex, setBetIndex] = useState(3);
    const currentBet = BET_VALUES[betIndex];
    const [showBigWin, setShowBigWin] = useState(false);
    const [showDemoPanel, setShowDemoPanel] = useState(true);
    const [showGamble, setShowGamble] = useState(false);

    const [wildEffect, setWildEffect] = useState<{ cols: number[]; match: number }>({ cols: [], match: 0 });
    const [winningLines, setWinningLines] = useState<any[]>([]);
    const [winningSymbols, setWinningSymbols] = useState<{ col: number; row: number; isDollar?: boolean }[]>([]);

    useEffect(() => {
        soundManager.loadSounds();
    }, []);

    const onReelContainerLayout = (event: LayoutChangeEvent) => {
        const { width, height, x, y } = event.nativeEvent.layout;
        setReelLayout({ width, height, x, y });
    };

    const spin = () => {
        if (spinning || coins < currentBet || showGamble) return;
        soundManager.play('spin');

        setSpinning(true);
        setReelSpinning(Array(reelsCount).fill(true));

        setLastWin(0);
        setShowBigWin(false);
        setWildEffect({ cols: [], match: 0 });
        setWinningLines([]);
        setWinningSymbols([]);
        setCoins(c => c - currentBet);

        const newStops = reelStrips.map(strip => Math.floor(Math.random() * strip.length));
        setStops(newStops);

        // calculeaza tot dinainte
        const visible = getVisibleSymbols(newStops);
        const { wildCols, match: wildMatch } = determineWildColsOnly(visible);

        reelStrips.forEach((_, col) => {
            setTimeout(() => {
                setReelSpinning(prev => {
                    const next = [...prev];
                    next[col] = false;
                    return next;
                });
                soundManager.play('stop');

                // SCHIMBAT: nu mai punem efectul wild pe rand
                // asteptam sa se opreasca ultima roata

                if (col === reelsCount - 1) {
                    // da drumu la expansiune daca e cazul
                    if (wildMatch >= 3 && wildCols.length > 0) {
                        // punem aici ca sa se intample DUPA ce aterizeaza ultima roata
                        setWildEffect({ cols: wildCols, match: wildMatch });
                        // soundManager.play('expand');
                    }

                    // calcul final pt castig
                    calculateFinalWin(newStops, { cols: wildCols, match: wildMatch });
                    setTimeout(() => {
                        setSpinning(false);
                    }, 500);
                }
            }, 800 + col * 300);
        });
    };

    function getVisibleSymbols(currentStops: number[] = stops) {
        return currentStops.map((stopIndex, col) => {
            const strip = reelStrips[col];
            const len = strip.length;
            return [
                strip[stopIndex % len],
                strip[(stopIndex + 1) % len],
                strip[(stopIndex + 2) % len]
            ];
        });
    }

    function applyCrownWilds(visible: string[][], forceCheck = false) {
        let wildCols: number[] = [];
        const updated = visible.map((colSymbols, col) => {
            if (colSymbols.includes("crown") && col >= 1 && col <= 3) {
                wildCols.push(col);
                if (forceCheck) return ["crown", "crown", "crown"];
                return ["crown", "crown", "crown"];
            }
            return colSymbols;
        });
        return { updated, wildCols };
    }

    function determineWildColsOnly(visible: string[][]) {
        const { updated: visibleWithPotentialWilds, wildCols: potentialCols } = applyCrownWilds([...visible], true);

        let maxMatch = 0;
        LINES.forEach((line) => {
            const lineSymbols = line.map((row, col) => visibleWithPotentialWilds[col][row]);
            const count = getLineMatchCount(lineSymbols);
            maxMatch = Math.max(maxMatch, count);
        });

        if (maxMatch >= 3) {
            return { wildCols: potentialCols, match: maxMatch };
        } else {
            return { wildCols: [], match: 0 };
        }
    }

    function getLineMatchCount(lineSymbols: string[]) {
        const filtered = lineSymbols.map((s) => (s === "dollar" ? null : s));
        const firstNonWildIndex = filtered.findIndex((s) => s && s !== "crown");
        const target = firstNonWildIndex === -1 ? "crown" : filtered[firstNonWildIndex];

        let count = 0;
        for (let i = 0; i < filtered.length; i++) {
            const sym = filtered[i];
            if ((sym === target || sym === "crown") && sym !== null) {
                count++;
            } else if (target === "crown" && sym === null) {
                break;
            } else {
                break;
            }
        }
        return count >= 3 ? count : 0;
    }

    function applyCrownWildsFromEffect(visible: string[][], effect: { cols: number[] }) {
        const updated = visible.map((colSymbols, col) => {
            if (effect.cols.includes(col)) {
                return ["crown", "crown", "crown"];
            }
            return colSymbols;
        });
        return { updated };
    }

    function calculateFinalWin(currentStops: number[], precalcWildEffect: { cols: number[]; match: number }) {
        const visible = getVisibleSymbols(currentStops);
        const { updated: withWilds } = applyCrownWildsFromEffect(visible, precalcWildEffect);

        let totalWin = 0;
        let maxMatch = 0;
        let linesHit: any[] = [];
        let symbolsHit: any[] = [];
        const betRatio = currentBet / 20;

        LINES.forEach((line, idx) => {
            const lineSymbols = line.map((row, col) => withWilds[col][row]);
            const count = getLineMatchCount(lineSymbols);

            if (count > 0) {
                let symbolKey = "crown";
                for (let s of lineSymbols) {
                    if (s !== "crown") {
                        symbolKey = s;
                        break;
                    }
                }

                const baseValue = PAYOUTS[symbolKey] || 5;
                totalWin += baseValue * (count - 2) * betRatio;
                maxMatch = Math.max(maxMatch, count);
                linesHit.push({ lineIndex: idx, match: count });

                for (let col = 0; col < count; col++) {
                    symbolsHit.push({ col, row: line[col] });
                }
            }
        });

        // am pus deja wildEffect in spin() dar actualizam potrivirea aici doar ca sa fim siguri
        // dar important: nu vrem sa scriem peste 'cols' daca sunt puse deja
        // de fapt spin() pune cols. noi doar ne asiguram ca match e actualizat
        // sau mai simplu, resetam tot ca sa fim siguri ca e bine
        if (precalcWildEffect.match >= 3 && precalcWildEffect.cols.length > 0) {
            setWildEffect({ cols: precalcWildEffect.cols, match: maxMatch });
        } else {
            setWildEffect({ cols: [], match: 0 });
        }


        let dollarCount = 0;
        let scatterHits: any[] = [];

        visible.forEach((colSymbols, c) => {
            const isExpanded = precalcWildEffect.cols.includes(c) && maxMatch >= 3;
            colSymbols.forEach((sym, r) => {
                if (isExpanded && sym === "dollar") return;
                if (sym === "dollar") {
                    dollarCount++;
                    scatterHits.push({ col: c, row: r });
                }
            });
        });

        if (dollarCount >= 3) {
            soundManager.play("scatter");
            const scatterWin = PAYOUTS["dollar"] * (dollarCount - 2) * 5 * betRatio;
            totalWin += scatterWin;
            scatterHits.forEach(hit =>
                symbolsHit.push({ col: hit.col, row: hit.row, isDollar: true })
            );
        }

        if (totalWin > 0) {
            soundManager.play("win");
            setCoins(c => c + totalWin);
            setLastWin(totalWin);

            if (totalWin >= currentBet * 15) {
                soundManager.play("bigwin");
                setShowBigWin(true);
                setTimeout(() => {
                    setShowBigWin(false);
                }, 3000);
            }
        }

        setWinningLines([...linesHit]);
        setWinningSymbols([...symbolsHit]);
    }

    const handleGambleClose = (finalAmount: number) => {
        const delta = finalAmount - lastWin;
        setCoins(prev => prev + delta);
        if (finalAmount > 0) {
            setLastWin(finalAmount);
            if (delta > 0) soundManager.play('win');
        } else {
            setLastWin(0);
        }
        setShowGamble(false);
    };

    return (
        <ImageBackground source={require('../../assets/images/memo.jpg')} style={styles.container} resizeMode="cover">
            {showGamble && (
                <Gamble win={lastWin} onClose={handleGambleClose} />
            )}

            {showBigWin && <BigWin amount={lastWin} />}

            {showDemoPanel && (
                <View style={styles.overlay}>
                    <View style={styles.demoBox}>
                        <Text style={styles.demoTitle}>DEMO GAME</Text>
                        <Text style={styles.demoText}>
                            Acesta este un joc DEMO. Banii, câștigurile și pierderile sunt 100% virtuale.
                            Nu reprezintă jocuri de noroc reale.
                        </Text>
                        <TouchableOpacity style={styles.demoBtn} onPress={() => setShowDemoPanel(false)}>
                            <Text style={styles.demoBtnText}>OK, AM ÎNȚELES</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {!showDemoPanel && (
                <View style={styles.contentWrapper}>
                    <View style={styles.gameArea}>
                        <Text style={styles.title}>MEMO BET 🎰</Text>
                        <View style={styles.machine}>
                            <View style={styles.reelsContainer} onLayout={onReelContainerLayout}>
                                {reelStrips.map((strip, index) => (
                                    <Reel
                                        key={index}
                                        colIndex={index}
                                        strip={strip}
                                        stopIndex={stops[index]}
                                        isSpinning={reelSpinning[index]}
                                        wildEffect={wildEffect}
                                        winningSymbols={winningSymbols}
                                        stops={stops}
                                        showBigWin={showBigWin}
                                        symbolSize={SYMBOL_SIZE}
                                        reelHeight={REEL_HEIGHT}
                                    />
                                ))}

                                {!showBigWin && winningLines.length > 0 && reelLayout.width > 0 && (
                                    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="none">
                                        <Svg width="100%" height="100%" viewBox={`0 0 ${reelLayout.width} ${reelLayout.height}`}>
                                            {winningLines.map((obj, i) => {
                                                const line = LINES[obj.lineIndex];

                                                // calcule pt desenare
                                                const gap = 8;
                                                const availableWidth = reelLayout.width - (4 * gap);
                                                const slotWidth = availableWidth / 5;
                                                const slotHeight = reelLayout.height / 3;

                                                const baseStroke = Math.max(3, SYMBOL_SIZE * 0.05);
                                                const glowStroke = baseStroke * 2.5;

                                                const points = line.map((row, col) => {
                                                    const x = col * (slotWidth + gap) + slotWidth / 2;
                                                    const y = row * slotHeight + slotHeight / 2;
                                                    return `${x},${y}`;
                                                }).join(" ");

                                                return (
                                                    <React.Fragment key={i}>
                                                        <Polyline
                                                            points={points}
                                                            fill="none"
                                                            stroke="#ffe600"
                                                            strokeWidth={glowStroke}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeOpacity={0.4}
                                                        />
                                                        <Polyline
                                                            points={points}
                                                            fill="none"
                                                            stroke="#ffe600"
                                                            strokeWidth={baseStroke}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeOpacity={1}
                                                        />
                                                    </React.Fragment>
                                                );
                                            })}
                                        </Svg>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.panelContainer}>
                            <View style={styles.panelBox}>
                                <View style={styles.statGroup}>
                                    <Text style={styles.coinsLabel}>BANI</Text>
                                    <Text style={styles.coinsValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>
                                        {coins.toFixed(2)} LEI
                                    </Text>
                                </View>
                                <View style={[styles.statGroup, styles.betGroup]}>
                                    <Text style={styles.winLabel}>MIZA</Text>
                                    <Text style={styles.winValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>
                                        {currentBet.toFixed(2)} LEI
                                    </Text>
                                    <View style={styles.betButtons}>
                                        <TouchableOpacity onPress={() => setBetIndex(Math.max(0, betIndex - 1))} style={styles.betBtn}><Text style={styles.betBtnText}>-</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setBetIndex(Math.min(BET_VALUES.length - 1, betIndex + 1))} style={styles.betBtn}><Text style={styles.betBtnText}>+</Text></TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.statGroup}>
                                    <Text style={styles.winLabel}>CASTIG</Text>
                                    <Text style={styles.winValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>
                                        {lastWin.toFixed(2)} LEI
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.panelButtons}>
                                <TouchableOpacity
                                    style={[styles.spinButton, (spinning || coins < currentBet || showGamble) && styles.disabled]}
                                    onPress={spin}
                                    disabled={spinning || coins < currentBet || showGamble}
                                >
                                    <Text style={styles.spinText}>DA O MANA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.gambleBtn, (lastWin <= 0 || spinning || showGamble) && styles.disabled]}
                                    onPress={() => setShowGamble(true)}
                                    disabled={lastWin <= 0 || spinning || showGamble}
                                >
                                    <Text style={styles.gambleText}>DUBLEAZA</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.bottomPanel}>
                        <View style={styles.footerPanelBox}>
                            <TouchableOpacity style={[styles.footerBtn, { borderColor: '#ff4444' }]} onPress={() => BackHandler.exitApp()}>
                                <Text style={[styles.footerBtnText, { color: '#ff4444' }]}>✖ INCHIDE</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.footerBtn} onPress={() => Linking.openURL('https://github.com/Aurasj')}>
                                <Text style={styles.footerBtnText}>GITHUB</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.footerBtn} onPress={() => Linking.openURL('https://www.instagram.com/auras.me/')}>
                                <Text style={styles.footerBtnText}>INSTAGRAM</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    demoBox: {
        backgroundColor: '#222',
        borderWidth: 3,
        borderColor: '#ffd800',
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        maxWidth: 420,
    },
    demoTitle: {
        fontSize: 32,
        color: '#ffd800',
        marginBottom: 18,
        fontWeight: 'bold',
        textShadowColor: 'black',
        textShadowRadius: 10,
    },
    demoText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 24,
    },
    demoBtn: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: '#ff0000',
        borderWidth: 3,
        borderColor: '#ffd800',
        borderRadius: 10,
    },
    demoBtnText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    contentWrapper: {
        alignItems: 'center',
        width: '100%',
        flex: 1,
        // justifyContent: 'center', // scos ca sa lasam gameArea sa centreze
    },
    gameArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 42,
        color: '#ffd800',
        marginBottom: 10,
        fontWeight: 'bold',
        textShadowColor: 'black',
        textShadowRadius: 10,
        textAlign: 'center',
        flexShrink: 1,
    },
    machine: {
        padding: 5,
        position: 'relative',
        marginBottom: 5,
    },
    reelsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    reel: {
        borderWidth: 4,
        borderColor: '#ffd800',
        borderRadius: 12,
        backgroundColor: '#5a2b00',
        overflow: 'hidden',
    },
    wildReel: {
        backgroundColor: 'rgba(255, 120, 0, 0.3)',
        borderColor: '#ff961d',
    },
    panelContainer: {
        marginTop: 10,
        width: '95%',
        maxWidth: 800,
        alignItems: 'center',
        gap: 10,
    },
    panelBox: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderWidth: 2,
        borderColor: 'gold',
        borderRadius: 10,
        padding: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        gap: 2,
    },
    statGroup: {
        alignItems: 'center',
        flex: 1,
    },
    coinsLabel: { color: '#ccc', fontSize: 10, fontWeight: 'bold' },
    coinsValue: { color: '#ffd700', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    winLabel: { color: '#ccc', fontSize: 10, fontWeight: 'bold' },
    winValue: { color: '#ffd700', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    betGroup: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#444',
        paddingHorizontal: 5,
        flex: 1.2,
    },
    betButtons: {
        flexDirection: 'row',
        marginTop: 2,
        gap: 5,
        justifyContent: 'center',
        width: '100%',
    },
    betBtn: {
        backgroundColor: '#555',
        width: 25,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    betBtnText: { color: 'white', fontWeight: 'bold' },
    panelButtons: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 5,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    spinButton: {
        backgroundColor: '#cc0000',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 14,
        borderWidth: 4,
        borderColor: '#ffd800',
    },
    spinText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    gambleBtn: {
        backgroundColor: '#0066ff',
        paddingVertical: 12,
        paddingHorizontal: 26,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#00aaff',
        justifyContent: 'center',
    },
    gambleText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    disabled: { opacity: 0.5 },
    bottomPanel: {
        width: '100%',
        marginTop: 10,
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerPanelBox: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderWidth: 2,
        borderColor: 'gold',
        borderRadius: 12,
        padding: 10,
        flexDirection: 'row',
        gap: 15,
        justifyContent: 'space-around',
        width: '90%',
        maxWidth: 500,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    footerBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffd700',
        alignItems: 'center',
    },
    footerBtnText: {
        color: '#ffd700',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
