import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import { fontScale, moderateScale, verticalScale } from "../../constants/metrics";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
