import { useEffect, useMemo, useState } from "react";
import { getUnitStatusBySubOption } from "../constants/moduleStatusConfig";
import { ROUTES } from "../navigation/routes";
import { showAppAlert } from "../services/alertService";
import useChecklistSections from "./useChecklistSections";

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
      value: unit.subChakQuantity || "8",
    },
  ];

  const [updatePicker, setUpdatePicker] = useState({
    visible: false,
    section: null,
  });
  const { sections } = useChecklistSections({ module, unit });
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const firstSectionKey = sections[0]?.key;

    if (!firstSectionKey) return;

    setExpandedSections((prev) =>
      sections.some((section) => prev[section.key])
        ? prev
        : { [firstSectionKey]: true }
    );
  }, [sections]);

  const statusLookup = useMemo(() => getUnitStatusBySubOption(unit), [unit]);

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
      displayLabel: sub.label,
      status: statusLookup[sub.id] || "Pending",
    }));

  const getSectionSubStatuses = (section) =>
    section.subOptions.map((sub) => ({
      ...sub,
      displayLabel: sub.label,
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
