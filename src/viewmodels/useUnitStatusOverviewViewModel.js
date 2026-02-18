import { Alert } from "react-native";
import { MODULE_STATUS_SECTIONS } from "../constants/moduleStatusConfig";

const COMPLETED_STATES = ["Completed", "Updated"];

const useUnitStatusOverviewViewModel = (navigation, route) => {
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || "Kayampur Sitamau P.M.I.P";

  const statusLookup = {
    inletPipeLaying: unit.inlet || "Pending",
    outletPipeLaying: unit.outlet || "Pending",
    mechanicalInstallation: unit.mechanical || "Pending",
    controllerInstallation: unit.controller || "Pending",
    dryCommissioning: unit.dry || "Pending",
    wetCommissioning: unit.wet || "Pending",
    mechanicalRectification: unit.mechanicalRectification || "Pending",
    controllerRectification: unit.controllerRectification || "Pending",
    locationFinalization: unit.locationUpdatedAt ? "Updated" : "Pending",
  };

  const getSubOptionLabel = (subOption) => {
    if (subOption.id === "locationFinalization") {
      return `${module} Location Finalization`;
    }

    return subOption.label;
  };

  const sections = MODULE_STATUS_SECTIONS.map((section) => ({
    ...section,
    subStatuses: section.subOptions.map((sub) => ({
      ...sub,
      displayLabel: getSubOptionLabel(sub),
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
    Alert.alert(
      "Report PDF",
      "Report download will be connected when API integration is done."
    );
  };

  const downloadCertificate = () => {
    Alert.alert(
      "Completion Certificate",
      "Certificate download will be connected when API integration is done."
    );
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
