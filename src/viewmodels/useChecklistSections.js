import { useEffect, useMemo, useState } from "react";
import { MODULE_STATUS_SECTIONS } from "../constants/moduleStatusConfig";
import { buildChecklistSectionsFromMaster } from "../services/checklistMasterAdapter";
import { getCachedChecklistProcessMaster } from "../services/checklistOfflineSync";

const DEFAULT_SUB_CHAK_QUANTITY = 8;

const getUnitSubChakQuantity = (unit = {}) => {
  const match = `${unit?.subChakQuantity ?? DEFAULT_SUB_CHAK_QUANTITY}`.match(/\d+/);
  const parsedValue = Number.parseInt(match?.[0], 10);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_SUB_CHAK_QUANTITY;
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

export const getModuleAwareSections = (module, unit) => {
  const subChakQuantity = getUnitSubChakQuantity(unit);

  return MODULE_STATUS_SECTIONS.map((section) => ({
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
          resolveContextValue(item.label, { module, unit }),
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

        return {
          ...group,
          minItems: useSubChakQuantity ? subChakQuantity : group.minItems,
          maxItems: useSubChakQuantity ? subChakQuantity : group.maxItems,
          fixedItemCount: useSubChakQuantity
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
  const fallbackSections = useMemo(
    () => getModuleAwareSections(module, unit),
    [module, unit]
  );
  const [apiSections, setApiSections] = useState([]);
  const [masterSource, setMasterSource] = useState("static");

  useEffect(() => {
    let isMounted = true;

    setApiSections([]);
    setMasterSource("static");

    const applyProcesses = (processes, source) => {
      const nextSections = buildChecklistSectionsFromMaster({
        processes,
        module,
      });

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
  }, [module]);

  return {
    sections: apiSections.length ? apiSections : fallbackSections,
    masterSource,
    hasApiSections: apiSections.length > 0,
  };
};

export default useChecklistSections;
