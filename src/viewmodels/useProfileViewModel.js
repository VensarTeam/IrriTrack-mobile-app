import { useCallback, useEffect, useState } from "react";
import { ROUTES } from "../navigation/routes";
import { showAppAlert } from "../services/alertService";
import { useAuth } from "../context/AuthContext";

const useProfileViewModel = (navigation) => {
  const { logout, refreshProfile, user: authenticatedUser } = useAuth();
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const user = authenticatedUser || {};
  const initials = (user.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("");

  const loadProfile = useCallback(async () => {
    setIsRefreshingProfile(true);

    try {
      await refreshProfile();
    } catch (error) {
      console.warn("Unable to load profile", error);
    } finally {
      setIsRefreshingProfile(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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
            void (async () => {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: ROUTES.ROOT.AUTH_STACK }],
              });
            })();
          },
        },
      ],
      cancelable: true,
    });
  };

  return {
    user,
    initials,
    isRefreshingProfile,
    handleLogout,
  };
};

export default useProfileViewModel;
