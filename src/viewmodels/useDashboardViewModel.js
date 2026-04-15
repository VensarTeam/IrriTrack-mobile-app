import { useMemo, useState } from "react";
import { ROUTES } from "../navigation/routes";
import { getProjects } from "../repositories/projectRepository";
import { showAppAlert } from "../services/alertService";

const useDashboardViewModel = (navigation) => {
  const projects = getProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) =>
      [project.name, project.client]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [projects, searchQuery]);
  const clearSearch = () => setSearchQuery("");

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
    filteredProjects,
    searchQuery,
    openProject,
    handleLogout,
    setSearchQuery,
    clearSearch,
  };
};

export default useDashboardViewModel;
