import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { ROUTES } from "../navigation/routes";
import { getProjects } from "../repositories/projectRepository";
import { showAppAlert } from "../services/alertService";
import { useAuth } from "../context/AuthContext";
import {
  getCachedProjectList,
  refreshProjectList,
} from "../services/projectOfflineStore";
import { syncOmsBasicUnitsForProjectInBackground } from "../services/omsOfflineStore";

const useDashboardViewModel = (navigation) => {
  const { logout } = useAuth();
  const fallbackProjects = useMemo(() => getProjects(), []);
  const [cachedProjects, setCachedProjects] = useState(null);
  const projects = cachedProjects !== null ? cachedProjects : fallbackProjects;
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshingProjects, setIsRefreshingProjects] = useState(false);

  const loadCachedProjects = useCallback(async () => {
    try {
      const projectsFromCache = await getCachedProjectList();

      if (projectsFromCache.length) {
        setCachedProjects(projectsFromCache);
      } else {
        setCachedProjects([]);
      }
    } catch (error) {
      console.log("[ProjectDashboard]", "Unable to load cached projects", {
        message: error?.message,
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCachedProjects();
    }, [loadCachedProjects])
  );

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

  const refreshProjects = async () => {
    if (isRefreshingProjects) return;

    setIsRefreshingProjects(true);
    console.log("[ProjectDashboard]", "Pull refresh requested");

    try {
      const networkState = await NetInfo.fetch();
      const isOnline =
        Boolean(networkState.isConnected) &&
        networkState.isInternetReachable !== false;

      if (!isOnline) {
        showAppAlert({
          type: "info",
          title: "Offline",
          message: "Showing saved projects.",
        });
        return;
      }

      const freshProjects = await refreshProjectList();
      setCachedProjects(freshProjects);
    } catch (error) {
      console.log("[ProjectDashboard]", "Project refresh failed", {
        message: error?.message,
        status: error?.status,
      });
      showAppAlert({
        type: "danger",
        title: "Refresh failed",
        message: error?.message || "Unable to refresh projects.",
      });
    } finally {
      setIsRefreshingProjects(false);
    }
  };

  const openProject = (project) => {
    const projectId = project?.id || project?.projectId || "";
    void syncOmsBasicUnitsForProjectInBackground(projectId);

    navigation.navigate(ROUTES.ROOT.PROJECT_DETAILS, {
      project,
      projectName: project?.name,
    });
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
            void (async () => {
              try {
                await logout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: ROUTES.ROOT.AUTH_STACK }],
                });
              } catch (error) {
                console.warn("[Logout]", "Logout failed", error?.message);
                showAppAlert({
                  type: "danger",
                  title: "Logout failed",
                  message:
                    error?.message || "Unable to logout. Please try again.",
                });
              }
            })();
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
    isRefreshingProjects,
    refreshProjects,
    openProject,
    handleLogout,
    setSearchQuery,
    clearSearch,
  };
};

export default useDashboardViewModel;
