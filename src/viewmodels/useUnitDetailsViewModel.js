import { useMemo, useState } from "react";
import {
  getUnitStatusBySubOption,
  MODULE_STATUS_SECTIONS,
} from "../constants/moduleStatusConfig";
import { ROUTES } from "../navigation/routes";
import { showAppAlert } from "../services/alertService";

const applyModuleText = (value, module) => {
  if (typeof value !== "string" || !module) return value;

  return value.replace(/OMS\/RMS/g, module).replace(/\bOMS\b/g, module);
};

const useUnitDetailsViewModel = (navigation, route) => {
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const unitLabel = unit.unitNo || `${module}-001`;
  const projectName = route?.params?.projectName || "Kayampur Sitamau Pressurized Micro Lift Major Irrigation Project";

  const detailItems = [
    { label: "Unit Number", value: unitLabel },
    { label: "Village", value: unit.village || "Village-A" },
    { label: "Chak Area", value: unit.area || "30 ha" },
    {
      label: "Sub Chak Quantity",
      value: unit.subChakQuantity || "6",
    },
  ];

  const [updatePicker, setUpdatePicker] = useState({
    visible: false,
    section: null,
  });

  const [expandedSections, setExpandedSections] = useState(() => ({
    [MODULE_STATUS_SECTIONS[0]?.key]: true,
  }));

  const sections = useMemo(
    () =>
      MODULE_STATUS_SECTIONS.map((section) => ({
        ...section,
        title: applyModuleText(section.title, module),
        description: applyModuleText(section.description, module),
        subOptions: (section.subOptions || []).map((sub) => ({
          ...sub,
          label: applyModuleText(sub.label, module),
        })),
      })),
    [module]
  );

  const statusLookup = useMemo(() => getUnitStatusBySubOption(unit), [unit]);

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
    showAppAlert({
      type: "info",
      title: "Helper",
      message: "Support videos and photos will be added here.",
    });
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
      status: statusLookup[sub.id] || "Pending",
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
    unitLabel,
    projectName,
    detailItems,
    sections,
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
