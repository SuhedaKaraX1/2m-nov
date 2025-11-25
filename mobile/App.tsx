import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 22,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>⚡ 2Mins Challenge</Text>
          <Text style={styles.subtitle}>Mobil Uygulama - React Native with Expo</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Hoş Geldiniz!</Text>
            <Text style={styles.cardText}>
              2 dakikalık görevlerle daha iyi alışkanlıklar oluşturun. Fiziksel sağlık, mental wellness, öğrenme, finans ve ilişkiler alanlarında başarı kazanın.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📱 Mobil Özellikler</Text>
            <Text style={styles.cardText}>
              • Günlük challenge alarmları{'\n'}
              • Gerçek zamanlı ilerleme takibi{'\n'}
              • Başarı rozetleri ve puanlar{'\n'}
              • Seri tutma sistemi{'\n'}
              • İstatistik ve analitik{'\n'}
              • Motive edici mesajlar
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>✨ Web Modunda Çalışıyor</Text>
            <Text style={styles.cardText}>
              Replit'te Expo uygulaması web modunda çalışmaktadır. Telefonunuzda test etmek için Expo Go uygulamasını kullanabilirsiniz.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚀 Başlamak İçin</Text>
            <Text style={styles.cardText}>
              1. cd mobile{'\n'}
              2. npx expo start --web{'\n'}
              3. Tarayıcıda http://localhost:19006
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
