import { Alert } from "react-native";
import { ROUTES } from "../navigation/routes";
import { getCurrentUser } from "../repositories/userRepository";

const useProfileViewModel = (navigation) => {
  const user = getCurrentUser();
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.ROOT.AUTH_STACK }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  return {
    user,
    initials,
    handleLogout,
  };
};

export default useProfileViewModel;
