import { ROUTES } from "../navigation/routes";
import { getCurrentUser } from "../repositories/userRepository";
import { showAppAlert } from "../services/alertService";

const useProfileViewModel = (navigation) => {
  const user = getCurrentUser();
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  const handleLogout = () => {
    showAppAlert({
      type: "warning",
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      actions: [
        {
          label: "Cancel",
          variant: "secondary",
        },
        {
          label: "Logout",
          variant: "danger",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.ROOT.AUTH_STACK }],
            });
          },
        },
      ],
      cancelable: true,
    });
  };

  return {
    user,
    initials,
    handleLogout,
  };
};

export default useProfileViewModel;
