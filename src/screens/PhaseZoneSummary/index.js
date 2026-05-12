import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import { SafeAreaView } from 'react-native-safe-area-context';

const PhaseZoneSummary = () => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Phase Zone Summary</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.content}>
        <Text>Phase Zone Summary Screen</Text>
      </View>
    </SafeAreaView>
  );
};

export default PhaseZoneSummary;
