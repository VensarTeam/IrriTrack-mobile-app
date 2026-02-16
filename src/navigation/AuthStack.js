import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Login';
import OtpScreen from '../screens/Otp';
import { ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false , animation: "slide_from_right"}}>
      <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.AUTH.OTP} component={OtpScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
