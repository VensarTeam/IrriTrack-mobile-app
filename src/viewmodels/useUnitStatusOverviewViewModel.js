import {
  getUnitStatusBySubOption,
} from "../constants/moduleStatusConfig";
import { showAppAlert } from "../services/alertService";
import useChecklistSections from "./useChecklistSections";

const COMPLETED_STATES = ["Completed", "Updated"];

const useUnitStatusOverviewViewModel = (navigation, route) => {
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || "Kayampur Sitamau P.M.I.P";
  const { sections: checklistSections } = useChecklistSections({ module, unit });

  const statusLookup = getUnitStatusBySubOption(unit);

  const sections = checklistSections.map((section) => ({
    ...section,
    subStatuses: section.subOptions.map((sub) => ({
      ...sub,
      displayLabel: sub.label,
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
