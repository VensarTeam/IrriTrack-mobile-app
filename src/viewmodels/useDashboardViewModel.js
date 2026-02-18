import { ROUTES } from "../navigation/routes";
import { getProjects } from "../repositories/projectRepository";

const useDashboardViewModel = (navigation) => {
  const projects = getProjects();

  const openProject = () => {
    navigation.navigate(ROUTES.ROOT.PROJECT_DETAILS);
  };

  return {
    projects,
    openProject,
  };
};

export default useDashboardViewModel;
