import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { ROUTES } from "../navigation/routes";
import { showAppAlert } from "../services/alertService";
import { useAuth } from "../context/AuthContext";
import { isProjectAllowed } from "../services/authPermissions";
import {
  getCachedProjectList,
  refreshProjectList,
} from "../services/projectOfflineStore";

const useDashboardViewModel = (navigation) => {
  const { authorization, roleAccess, logout, refreshProfile } = useAuth();
  const [cachedProjects, setCachedProjects] = useState(null);
  const [isProjectListLoading, setIsProjectListLoading] = useState(true);
  const projects = cachedProjects || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshingProjects, setIsRefreshingProjects] = useState(false);

  const loadCachedProjects = useCallback(async () => {
    setIsProjectListLoading(true);
    try {
      const projectsFromCache = await getCachedProjectList();
      setCachedProjects(projectsFromCache);

      if (!projectsFromCache.length) {
        const networkState = await NetInfo.fetch();
        if (networkState.isConnected && networkState.isInternetReachable !== false) {
          setCachedProjects(await refreshProjectList());
        }
      }
    } catch (error) {
      console.log("[ProjectDashboard]", "Unable to load cached projects", {
        message: error?.message,
      });
      setCachedProjects((current) => current || []);
    } finally {
      setIsProjectListLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCachedProjects();
    }, [loadCachedProjects])
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const accessibleProjects = roleAccess.isAuthorizationReady
      ? projects.filter((project) => isProjectAllowed(authorization, project))
      : [];

    if (!normalizedQuery) {
      return accessibleProjects;
    }

    return accessibleProjects.filter((project) =>
      [project.name, project.client]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [authorization, projects, roleAccess.isAuthorizationReady, searchQuery]);
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
      await refreshProfile({ force: true });
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
    if (!roleAccess.isAuthorizationReady || !isProjectAllowed(authorization, project)) {
      showAppAlert({
        type: "warning",
        title: "Project access unavailable",
        message: "Refresh your access and try again.",
      });
      return;
    }
    navigation.navigate(ROUTES.ROOT.PROJECT_MODULES, {
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
    isProjectListLoading,
    isAuthorizationReady: roleAccess.isAuthorizationReady,
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
