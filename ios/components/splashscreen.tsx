import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

// This is a minimal Lottie JSON for a "Growing Blue Circle" (Placeholder)
const constructionPlaceholder = {
  "v": "5.5.7", "fr": 60, "ip": 0, "op": 60, "w": 100, "h": 100, "nm": "Simple Loading", "ddd": 0,
  "assets": [],
  "layers": [{
    "ddd": 0, "ind": 1, "ty": 4, "nm": "Circle", "sr": 1, "ks": {
      "o": { "a": 0, "k": 100 },
      "r": { "a": 0, "k": 0 },
      "p": { "a": 0, "k": [50, 50] },
      "a": { "a": 0, "k": [0, 0] },
      "s": { "a": 1, "k": [
        { "t": 0, "s": [0, 0], "e": [100, 100] },
        { "t": 30, "s": [100, 100], "e": [80, 80] },
        { "t": 60, "s": [80, 80] }
      ]}
    },
    "shapes": [{
      "ty": "gr", "it": [{
        "d": 1, "ty": "el", "s": { "a": 0, "k": [50, 50] }, "p": { "a": 0, "k": [0, 0] }, "nm": "Ellipse"
      }, {
        "ty": "fl", "c": { "a": 0, "k": [0, 0.48, 1, 1] }, "o": { "a": 0, "k": 100 }, "nm": "Fill"
      }]
    }]
  }]
};

export default function AppSplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const startFadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => onFinish());
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LottieView
        autoPlay
        loop={false}
        onAnimationFinish={startFadeOut}
        style={styles.animation}
        // PASSED DIRECTLY AS OBJECT
        source={constructionPlaceholder} 
      />
      <Animated.Text style={styles.text}>MODIPROOF</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  animation: { width: 200, height: 200 },
  text: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '900',
    color: '#007AFF',
    letterSpacing: 4
  }
});