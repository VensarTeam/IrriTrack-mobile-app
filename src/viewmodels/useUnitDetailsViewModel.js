import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { ROUTES } from "../navigation/routes";
import { MODULE_STATUS_SECTIONS } from "../constants/moduleStatusConfig";

const useUnitDetailsViewModel = (navigation, route) => {
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || "Kayampur Sitamau P.M.I.P";

  const detailItems = [
    { label: "Unit Number", value: unit.unitNo || `${module}-001` },
    { label: "Village", value: unit.village || "Village-A" },
    { label: "Area", value: unit.area || "30 ha" },
    { label: "Chak Area", value: unit.chakArea || "30 ha" },
  ];

  const [updatePicker, setUpdatePicker] = useState({
    visible: false,
    section: null,
  });

  const [expandedSections, setExpandedSections] = useState(() => ({
    [MODULE_STATUS_SECTIONS[0]?.key]: true,
  }));

  const statusLookup = useMemo(
    () => ({
      inletPipeLaying: unit.inlet || "Pending",
      outletPipeLaying: unit.outlet || "Pending",
      locationFinalization: unit.locationUpdatedAt ? "Updated" : "Pending",
      mechanicalInstallation: unit.mechanical || "Pending",
      controllerInstallation: unit.controller || "Pending",
      dryCommissioning: unit.dry || "Pending",
      wetCommissioning: unit.wet || "Pending",
      mechanicalRectification: unit.mechanicalRectification || "Pending",
      controllerRectification: unit.controllerRectification || "Pending",
    }),
    [unit]
  );

  const getSubOptionLabel = (subOption) => {
    if (subOption.id === "locationFinalization") {
      return `${module} Location Finalization`;
    }

    return subOption.label;
  };

  const openSection = (section, subOption) => {
    navigation.navigate(ROUTES.ROOT.UNIT_STATUS_UPDATE, {
      module,
      unit,
      projectName,
      sectionKey: section.key,
      subOptionId: subOption?.id,
    });
  };

  const openViewAll = () => {
    navigation.navigate(ROUTES.ROOT.UNIT_STATUS_OVERVIEW, {
      module,
      unit,
      projectName,
    });
  };

  const openHelper = () => {
    Alert.alert("Helper", "Support videos and photos will be added here.");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const isSectionExpanded = (sectionKey) => !!expandedSections[sectionKey];

  const openUpdatePicker = (section) => {
    setUpdatePicker({ visible: true, section });
  };

  const closeUpdatePicker = () => {
    setUpdatePicker({ visible: false, section: null });
  };

  const selectUpdateOption = (subOption) => {
    if (!updatePicker.section) return;
    closeUpdatePicker();
    openSection(updatePicker.section, subOption);
  };

  const openSubStatus = (section, subOption) => {
    openSection(section, subOption);
  };

  const getUpdateOptions = () =>
    (updatePicker.section?.subOptions || []).map((sub) => ({
      ...sub,
      displayLabel: getSubOptionLabel(sub),
    }));

  const getSectionSubStatuses = (section) =>
    section.subOptions.map((sub) => ({
      ...sub,
      displayLabel: getSubOptionLabel(sub),
      status: statusLookup[sub.id] || "Pending",
    }));

  return {
    module,
    unit,
    projectName,
    detailItems,
    sections: MODULE_STATUS_SECTIONS,
    openHelper,
    handleBack,
    openViewAll,
    toggleSection,
    isSectionExpanded,
    updatePicker,
    openUpdatePicker,
    closeUpdatePicker,
    selectUpdateOption,
    openSubStatus,
    getUpdateOptions,
    getSectionSubStatuses,
  };
};

export default useUnitDetailsViewModel;
