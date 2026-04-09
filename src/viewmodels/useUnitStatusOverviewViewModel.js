import {
  getUnitStatusBySubOption,
  MODULE_STATUS_SECTIONS,
} from "../constants/moduleStatusConfig";
import { showAppAlert } from "../services/alertService";

const COMPLETED_STATES = ["Completed", "Updated"];

const applyModuleText = (value, module) => {
  if (typeof value !== "string" || !module) return value;

  return value.replace(/OMS\/RMS/g, module).replace(/\bOMS\b/g, module);
};

const useUnitStatusOverviewViewModel = (navigation, route) => {
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || "Kayampur Sitamau P.M.I.P";

  const statusLookup = getUnitStatusBySubOption(unit);

  const getSubOptionLabel = (subOption) => {
    if (subOption.id === "locationFinalization") {
      return `${module} Location Finalization`;
    }

    return subOption.label;
  };

  const sections = MODULE_STATUS_SECTIONS.map((section) => ({
    ...section,
    title: applyModuleText(section.title, module),
    description: applyModuleText(section.description, module),
    subStatuses: section.subOptions.map((sub) => ({
      ...sub,
      label: applyModuleText(sub.label, module),
      displayLabel: getSubOptionLabel({
        ...sub,
        label: applyModuleText(sub.label, module),
      }),
      status: statusLookup[sub.id] || "Pending",
    })),
  }));

  const allStatusesCompleted = sections.every((section) =>
    section.subStatuses.every((item) => COMPLETED_STATES.includes(item.status))
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const downloadReportPdf = () => {
    showAppAlert({
      type: "info",
      title: "Report PDF",
      message: "Report download will be connected when API integration is done.",
    });
  };

  const downloadCertificate = () => {
    showAppAlert({
      type: "info",
      title: "Completion Certificate",
      message: "Certificate download will be connected when API integration is done.",
    });
  };

  return {
    module,
    unit,
    projectName,
    sections,
    allStatusesCompleted,
    handleBack,
    downloadReportPdf,
    downloadCertificate,
  };
};

export default useUnitStatusOverviewViewModel;
