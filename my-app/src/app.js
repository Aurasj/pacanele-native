import React, { useState } from 'react'; 
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native'; 
const Counter = ({ name }) => { 
const [count, setCount] = useState(0); 
return ( 
<View style={styles.counterBox}> 
<Text style={styles.title}>{name}</Text> 
<Text style={styles.number}>Count: {count}</Text> 
<View style={styles.buttons}> 
<Button title="+" onPress={() => setCount(count + 1)} />
<Button title="-" onPress={() => setCount(Math.max(count - 1, 0))} /> 
</View> 
</View> 
  ); 
}; 
export default function App() { 
return ( 
<ScrollView style={styles.container}> 
<Counter name="Cafea ☕" /> 
<Counter name="Apă 💧" /> 
<Counter name="Pași 👣" /> 
<Counter name="Zâmbete 😄" /> 
</ScrollView> 
  ); 
} 
const styles = StyleSheet.create({ 
container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' }, 
counterBox: { 
backgroundColor: '#fff', 
padding: 20, 
marginVertical: 10, 
borderRadius: 10, 
elevation: 3, 
  }, 
title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 }, 
number: { fontSize: 18, marginBottom: 10 }, 
buttons: { flexDirection: 'row', justifyContent: 'space-around' }, 
}); 
