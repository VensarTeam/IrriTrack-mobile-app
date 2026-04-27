import { useEffect, useMemo, useState } from "react";
import { MODULE_STATUS_SECTIONS } from "../constants/moduleStatusConfig";
import { buildChecklistSectionsFromMaster } from "../services/checklistMasterAdapter";
import { getCachedChecklistProcessMaster } from "../services/checklistOfflineSync";

const getUnitSubChakQuantity = (unit = {}) => {
  const match = `${unit?.subChakQuantity ?? ""}`.match(/\d+/);
  const parsedValue = Number.parseInt(match?.[0], 10);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
};

const applyModuleText = (value, module) => {
  if (typeof value !== "string" || !module) return value;

  return value.replace(/OMS\/RMS/g, module).replace(/\bOMS\b/g, module);
};

const resolveContextValue = (value, context = {}) => {
  if (typeof value === "function") return value(context);

  if (typeof value !== "string") return value;

  return value.replace(
    /\{subChakQuantity\}/g,
    `${getUnitSubChakQuantity(context.unit)}`
  );
};

const formatChecklistLabelWithUnitContext = (item = {}, context = {}) => {
  const resolvedLabel = resolveContextValue(item.label, context);
  const subChakQuantity = getUnitSubChakQuantity(context.unit);
  const checklistId = Number(item?.checklistId);
  const normalizedLabel = String(resolvedLabel || "").trim();

  if (!normalizedLabel) {
    return resolvedLabel;
  }

  if (
    checklistId === 9 &&
    Number.isFinite(subChakQuantity) &&
    subChakQuantity > 0 &&
    !/\(\s*\d+\s*\)/.test(normalizedLabel)
  ) {
    return `${normalizedLabel} (${subChakQuantity})`;
  }

  return resolvedLabel;
};

const applyUnitAwareSectionContext = (sections = [], module, unit) => {
  const subChakQuantity = getUnitSubChakQuantity(unit);

  return sections.map((section) => ({
    ...section,
    title: applyModuleText(section.title, module),
    description: applyModuleText(section.description, module),
    subOptions: (section.subOptions || []).map((sub) => ({
      ...sub,
      label: applyModuleText(sub.label, module),
      statusLabel: applyModuleText(sub.statusLabel, module),
      remarkLabel: applyModuleText(sub.remarkLabel, module),
      checklistItems: (sub.checklistItems || []).map((item) => ({
        ...item,
        label: applyModuleText(
          formatChecklistLabelWithUnitContext(item, { module, unit }),
          module
        ),
      })),
      photoRequirements: (sub.photoRequirements || []).map((requirement) => ({
        ...requirement,
        label: applyModuleText(requirement.label, module),
      })),
      selectFields: (sub.selectFields || []).map((field) => ({
        ...field,
        label: applyModuleText(field.label, module),
        placeholder: applyModuleText(field.placeholder, module),
      })),
      inputFields: (sub.inputFields || []).map((field) => ({
        ...field,
        label: applyModuleText(field.label, module),
        placeholder: applyModuleText(field.placeholder, module),
      })),
      repeatableGroups: (sub.repeatableGroups || []).map((group) => {
        const useSubChakQuantity = !!group.useSubChakQuantity;
        const hasResolvedSubChakQuantity = Number.isFinite(subChakQuantity);

        return {
          ...group,
          minItems:
            useSubChakQuantity && hasResolvedSubChakQuantity
              ? subChakQuantity
              : group.minItems,
          maxItems:
            useSubChakQuantity && hasResolvedSubChakQuantity
              ? subChakQuantity
              : group.maxItems,
          fixedItemCount:
            useSubChakQuantity && hasResolvedSubChakQuantity
            ? subChakQuantity
            : group.fixedItemCount,
          title: applyModuleText(
            resolveContextValue(group.title, { module, unit }),
            module
          ),
          subtitle: applyModuleText(
            resolveContextValue(group.subtitle, { module, unit }),
            module
          ),
          addButtonLabel: applyModuleText(group.addButtonLabel, module),
          itemLabel: applyModuleText(group.itemLabel, module),
          itemFields: (group.itemFields || []).map((field) => ({
            ...field,
            label: applyModuleText(
              resolveContextValue(field.label, { module, unit }),
              module
            ),
            placeholder: applyModuleText(
              resolveContextValue(field.placeholder, { module, unit }),
              module
            ),
          })),
        };
      }),
    })),
  }));
};

export const getModuleAwareSections = (module, unit) =>
  applyUnitAwareSectionContext(MODULE_STATUS_SECTIONS, module, unit);

const getChecklistCount = (sections = []) =>
  sections.reduce(
    (count, section) =>
      count +
      (section.subOptions || []).reduce(
        (subCount, subOption) =>
          subCount + (subOption.apiChecklists?.length || 0),
        0
      ),
    0
  );

const useChecklistSections = ({ module = "OMS", unit = {} } = {}) => {
  const unitSubChakQuantity = useMemo(
    () => getUnitSubChakQuantity(unit),
    [unit?.subChakQuantity]
  );
  const unitContext = useMemo(
    () => ({ subChakQuantity: unitSubChakQuantity }),
    [unitSubChakQuantity]
  );
  const fallbackSections = useMemo(
    () => getModuleAwareSections(module, unitContext),
    [module, unitContext]
  );
  const [apiSections, setApiSections] = useState([]);
  const [masterSource, setMasterSource] = useState("static");

  useEffect(() => {
    let isMounted = true;

    setApiSections([]);
    setMasterSource("static");

    const applyProcesses = (processes, source) => {
      const nextSections = applyUnitAwareSectionContext(
        buildChecklistSectionsFromMaster({
          processes,
          module,
        }),
        module,
        unitContext
      );

      if (!nextSections.length || !isMounted) {
        console.log("[ChecklistMaster]", "Master skipped", {
          source,
          processCount: nextSections.length,
          checklistCount: getChecklistCount(nextSections),
        });
        return false;
      }

      console.log("[ChecklistMaster]", "Master loaded", {
        source,
        processCount: nextSections.length,
        subprocessCount: nextSections.reduce(
          (count, section) => count + (section.subOptions?.length || 0),
          0
        ),
        checklistCount: getChecklistCount(nextSections),
      });
      setApiSections(nextSections);
      setMasterSource(source);
      return true;
    };

    const loadMaster = async () => {
      console.log("[ChecklistMaster]", "Loading checklist master from SQLite", {
        deviceType: module,
      });

      try {
        const cachedProcesses = await getCachedChecklistProcessMaster({
          deviceType: module,
        });
        const applied = applyProcesses(cachedProcesses, "sqlite-cache");

        if (!applied && isMounted) {
          console.log("[ChecklistMaster]", "Using static fallback checklist data");
        }
      } catch (error) {
        if (isMounted) {
          console.log("[ChecklistMaster]", "Local master cache unavailable", {
            message: error?.message,
          });
        }
      }
    };

    void loadMaster();

    return () => {
      isMounted = false;
    };
  }, [module, unitContext]);

  return {
    sections: apiSections.length ? apiSections : fallbackSections,
    masterSource,
    hasApiSections: apiSections.length > 0,
  };
};

export default useChecklistSections;
