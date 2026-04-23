import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  fetchProjectVillageOptions,
  fetchProjectZones,
} from "../services/projectLocationService";

const EMPTY_ARRAY = [];

const areListsEqual = (left = EMPTY_ARRAY, right = EMPTY_ARRAY) => {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
};

const useProjectLocationFilters = ({
  projectId,
  selectedZone = "All",
}) => {
  const [isOnline, setIsOnline] = useState(false);
  const [zones, setZones] = useState(EMPTY_ARRAY);
  const [villages, setVillages] = useState(EMPTY_ARRAY);
  const [villageOptions, setVillageOptions] = useState(EMPTY_ARRAY);

  useEffect(() => {
    const updateOnlineState = (state) => {
      const nextOnline =
        Boolean(state?.isConnected) && state?.isInternetReachable !== false;
      setIsOnline((currentValue) =>
        currentValue === nextOnline ? currentValue : nextOnline
      );
    };

    const subscription = NetInfo.addEventListener(updateOnlineState);
    void NetInfo.fetch().then(updateOnlineState);

    return () => {
      subscription();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadZones = async () => {
      if (!isOnline || !projectId) {
        if (isMounted) {
          setZones((currentZones) =>
            currentZones.length ? EMPTY_ARRAY : currentZones
          );
        }
        return;
      }

      try {
        const nextZones = await fetchProjectZones(projectId);

        if (isMounted) {
          setZones((currentZones) =>
            areListsEqual(currentZones, nextZones) ? currentZones : nextZones
          );
        }
      } catch (error) {
        console.log("[ProjectFilters]", "Unable to load zones", {
          message: error?.message,
          status: error?.status,
          projectId,
        });

        if (isMounted) {
          setZones((currentZones) =>
            currentZones.length ? EMPTY_ARRAY : currentZones
          );
        }
      }
    };

    void loadZones();

    return () => {
      isMounted = false;
    };
  }, [isOnline, projectId]);

  useEffect(() => {
    let isMounted = true;

    const loadVillages = async () => {
      if (!isOnline || !projectId || selectedZone === "All") {
        if (isMounted) {
          setVillages((currentVillages) =>
            currentVillages.length ? EMPTY_ARRAY : currentVillages
          );
          setVillageOptions((currentVillageOptions) =>
            currentVillageOptions.length ? EMPTY_ARRAY : currentVillageOptions
          );
        }
        return;
      }

      try {
        const nextVillageOptions = await fetchProjectVillageOptions(
          projectId,
          selectedZone,
        );
        const nextVillages = nextVillageOptions.map((item) => item.name);

        if (isMounted) {
          setVillages((currentVillages) =>
            areListsEqual(currentVillages, nextVillages)
              ? currentVillages
              : nextVillages
          );
          setVillageOptions((currentVillageOptions) => {
            const hasSameVillageOptions =
              currentVillageOptions.length === nextVillageOptions.length &&
              currentVillageOptions.every(
                (item, index) =>
                  item?.id === nextVillageOptions[index]?.id &&
                  item?.name === nextVillageOptions[index]?.name
              );

            return hasSameVillageOptions
              ? currentVillageOptions
              : nextVillageOptions;
          });
        }
      } catch (error) {
        console.log("[ProjectFilters]", "Unable to load villages", {
          message: error?.message,
          status: error?.status,
          projectId,
          selectedZone,
        });

        if (isMounted) {
          setVillages((currentVillages) =>
            currentVillages.length ? EMPTY_ARRAY : currentVillages
          );
          setVillageOptions((currentVillageOptions) =>
            currentVillageOptions.length ? EMPTY_ARRAY : currentVillageOptions
          );
        }
      }
    };

    void loadVillages();

    return () => {
      isMounted = false;
    };
  }, [isOnline, projectId, selectedZone]);

  return {
    isOnline,
    canUseLocationFilters: isOnline && Boolean(projectId),
    zones,
    villages,
    villageOptions,
  };
};

export default useProjectLocationFilters;
