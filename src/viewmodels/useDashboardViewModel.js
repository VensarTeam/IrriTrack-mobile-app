import { ROUTES } from "../navigation/routes";
import { getProjects } from "../repositories/projectRepository";
import { showAppAlert } from "../services/alertService";

const useDashboardViewModel = (navigation) => {
  const projects = getProjects();

  const openProject = () => {
    navigation.navigate(ROUTES.ROOT.PROJECT_DETAILS);
  };

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
    projects,
    openProject,
    handleLogout,
  };
};

export default useDashboardViewModel;
