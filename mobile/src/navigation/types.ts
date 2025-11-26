import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ChallengesTab: undefined;
  ProgressTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ChallengeDetail: { id: string };
};

export type ChallengesStackParamList = {
  Challenges: { category?: string };
  ChallengeDetail: { id: string };
};

export type ProgressStackParamList = {
  Progress: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Friends: undefined;
  MyChallenges: undefined;
  CreateChallenge: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
