import { refreshChecklistProcessMaster } from "./checklistOfflineSync";
import { refreshContractorList } from "./contractorOfflineStore";
import { refreshOmsBasicUnitsForProject } from "./omsOfflineStore";
import { getCachedProjectList, refreshProjectList } from "./projectOfflineStore";

const LOG_PREFIX = "[MasterSync]";

const logMasterSync = (message, details = undefined) => {
  if (typeof details === "undefined") {
    //console.log(LOG_PREFIX, message);
    return;
  }

  //console.log(LOG_PREFIX, message, details);
};

const getProjectIds = (projects = []) =>
  Array.from(
    new Set(
      projects
        .map((project) => String(project?.id || project?.projectId || "").trim())
        .filter(Boolean)
    )
  );

const getChecklistSummary = (processes = []) => {
  const processCount = processes.length;
  let subprocessCount = 0;
  let checklistCount = 0;

  processes.forEach((process) => {
    const subprocesses = Array.isArray(process?.subprocesses)
      ? process.subprocesses
      : [];
    subprocessCount += subprocesses.length;
    checklistCount += subprocesses.reduce(
      (count, subprocess) => count + (subprocess?.checklists?.length || 0),
      0
    );
  });

  return {
    processCount,
    subprocessCount,
    checklistCount,
  };
};

const syncOmsBasicForProjects = async (projects = []) => {
  const projectIds = getProjectIds(projects);
  let omsUnitCount = 0;
  let failedOmsProjectCount = 0;

  for (const projectId of projectIds) {
    try {
      omsUnitCount += await refreshOmsBasicUnitsForProject(projectId);
    } catch (error) {
      failedOmsProjectCount += 1;
      logMasterSync("OMS basic sync failed for project", {
        projectId,
        message: error?.message,
        status: error?.status,
      });
    }
  }

  return {
    omsProjectCount: projectIds.length,
    omsUnitCount,
    failedOmsProjectCount,
  };
};

export const refreshOfflineMasterData = async ({ deviceType = "OMS" } = {}) => {
  logMasterSync("Master data refresh started", { deviceType });

  const [checklistResult, projectResult, contractorResult] =
    await Promise.allSettled([
      refreshChecklistProcessMaster({ deviceType }),
      refreshProjectList(),
      refreshContractorList(),
    ]);

  const checklistProcesses =
    checklistResult.status === "fulfilled" ? checklistResult.value : [];
  const checklistSummary = getChecklistSummary(checklistProcesses);

  let projects = projectResult.status === "fulfilled" ? projectResult.value : [];

  if (!projects.length) {
    try {
      projects = await getCachedProjectList();
    } catch (error) {
      logMasterSync("Unable to read cached projects for OMS sync", {
        message: error?.message,
        status: error?.status,
      });
    }
  }

  const omsSummary = await syncOmsBasicForProjects(projects);
  const contractorCount =
    contractorResult.status === "fulfilled" ? contractorResult.value.length : 0;

  if (checklistResult.status === "rejected") {
    logMasterSync("Checklist master refresh failed", {
      message: checklistResult.reason?.message,
      status: checklistResult.reason?.status,
    });
  }

  if (projectResult.status === "rejected") {
    logMasterSync("Project list refresh failed", {
      message: projectResult.reason?.message,
      status: projectResult.reason?.status,
    });
  }

  if (contractorResult.status === "rejected") {
    logMasterSync("Contractor refresh failed", {
      message: contractorResult.reason?.message,
      status: contractorResult.reason?.status,
    });
  }

  const hasAnyFreshMasterData =
    checklistResult.status === "fulfilled" ||
    projectResult.status === "fulfilled" ||
    contractorResult.status === "fulfilled" ||
    omsSummary.omsProjectCount > omsSummary.failedOmsProjectCount;

  if (!hasAnyFreshMasterData) {
    throw (
      checklistResult.reason ||
      projectResult.reason ||
      contractorResult.reason ||
      new Error("Unable to sync offline master data.")
    );
  }

  const summary = {
    ...checklistSummary,
    projectCount: projectResult.status === "fulfilled" ? projectResult.value.length : 0,
    contractorCount,
    ...omsSummary,
  };

  logMasterSync("Master data refresh finished", summary);
  return summary;
};
