import { useCallback, useEffect, useMemo, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { showAppAlert } from "../services/alertService";
import { createContractor } from "../services/contractorApi";
import {
  refreshContractorList,
  upsertCachedContractor,
} from "../services/contractorOfflineStore";
import { useAuth } from "../context/AuthContext";

const INITIAL_FORM = Object.freeze({
  firmName: "",
  ownerName: "",
  mobileNumber: "",
  email: "",
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeValue = (field, value) => {
  const nextValue = String(value || "");

  if (field === "mobileNumber") {
    return nextValue.replace(/\D+/g, "").slice(0, 10);
  }

  return nextValue;
};

const validateField = (field, value) => {
  const trimmedValue = String(value || "").trim();

  switch (field) {
    case "firmName":
      if (!trimmedValue) {
        return "Firm name is required";
      }
      if (trimmedValue.length < 3) {
        return "Firm name must be at least 3 characters";
      }
      return "";
    case "ownerName":
      if (!trimmedValue) {
        return "Owner name is required";
      }
      if (trimmedValue.length < 3) {
        return "Owner name must be at least 3 characters";
      }
      return "";
    case "mobileNumber":
      if (!trimmedValue) {
        return "Mobile number is required";
      }
      if (!/^\d{10}$/.test(trimmedValue)) {
        return "Enter a valid 10-digit mobile number";
      }
      return "";
    case "email":
      if (!trimmedValue) {
        return "Email is required";
      }
      if (!EMAIL_REGEX.test(trimmedValue)) {
        return "Enter a valid email address";
      }
      return "";
    default:
      return "";
  }
};

const getTrimmedPayload = (form) => ({
  firmName: String(form.firmName || "").trim(),
  ownerName: String(form.ownerName || "").trim(),
  mobileNumber: String(form.mobileNumber || "").trim(),
  email: String(form.email || "").trim().toLowerCase(),
});

const useAddContractorViewModel = (navigation) => {
  const { roleAccess } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canAccess =
    roleAccess.role === "manager" || roleAccess.role === "admin";

  useEffect(() => {
    if (canAccess) {
      return;
    }

    showAppAlert({
      type: "warning",
      title: "Access denied",
      message: "Only manager and admin can add contractors.",
    });
    navigation.goBack();
  }, [canAccess, navigation]);

  const validationErrors = useMemo(
    () =>
      Object.keys(INITIAL_FORM).reduce((acc, field) => {
        const message = validateField(field, form[field]);

        if (message) {
          acc[field] = message;
        }

        return acc;
      }, {}),
    [form]
  );

  const updateField = useCallback((field, value) => {
    const nextValue = sanitizeValue(field, value);

    setForm((currentValue) => ({
      ...currentValue,
      [field]: nextValue,
    }));

    setErrors((currentValue) => ({
      ...currentValue,
      [field]: touched[field] ? validateField(field, nextValue) : "",
    }));
  }, [touched]);

  const handleBlur = useCallback((field) => {
    setTouched((currentValue) => ({
      ...currentValue,
      [field]: true,
    }));

    setErrors((currentValue) => ({
      ...currentValue,
      [field]: validateField(field, form[field]),
    }));
  }, [form]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const nextTouched = Object.keys(INITIAL_FORM).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    const nextErrors = Object.keys(INITIAL_FORM).reduce((acc, field) => {
      const message = validateField(field, form[field]);

      if (message) {
        acc[field] = message;
      }

      return acc;
    }, {});

    setTouched(nextTouched);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsSubmitting(true);

    try {
      const networkState = await NetInfo.fetch();
      const isOnline =
        Boolean(networkState.isConnected) &&
        networkState.isInternetReachable !== false;

      if (!isOnline) {
        showAppAlert({
          type: "warning",
          title: "Offline",
          message: "Internet connection is required to add a contractor.",
        });
        return;
      }

      const payload = getTrimmedPayload(form);
      const createdContractor = await createContractor(payload);

      try {
        await upsertCachedContractor(createdContractor?.firmName ? createdContractor : payload);
        await refreshContractorList();
      } catch (cacheError) {
        console.warn("Unable to refresh contractor cache after create", cacheError);
      }

      showAppAlert({
        type: "success",
        title: "Contractor added",
        message: `${payload.firmName} has been saved successfully.`,
      });

      setForm(INITIAL_FORM);
      setTouched({});
      setErrors({});
      navigation.goBack();
    } catch (error) {
      showAppAlert({
        type: "danger",
        title: "Unable to add contractor",
        message: error?.message || "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isSubmitting, navigation]);

  return {
    form,
    errors,
    touched,
    isSubmitting,
    canAccess,
    isValid: Object.keys(validationErrors).length === 0,
    updateField,
    handleBlur,
    handleBack,
    handleSubmit,
  };
};

export default useAddContractorViewModel;
