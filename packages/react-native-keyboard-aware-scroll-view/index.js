import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  findNodeHandle,
} from "react-native";

const IOS_SHOW_EVENT = "keyboardWillShow";
const IOS_HIDE_EVENT = "keyboardWillHide";
const ANDROID_SHOW_EVENT = "keyboardDidShow";
const ANDROID_HIDE_EVENT = "keyboardDidHide";

const KeyboardAwareScrollView = React.forwardRef((props, forwardedRef) => {
  const {
    children,
    innerRef,
    contentContainerStyle,
    extraScrollHeight = 16,
    enableAutomaticScroll = true,
    keyboardShouldPersistTaps = "handled",
    showsVerticalScrollIndicator = false,
    ...scrollProps
  } = props;

  const scrollRef = useRef(null);
  const [keyboardSpace, setKeyboardSpace] = useState(0);

  const showEvent = Platform.OS === "ios" ? IOS_SHOW_EVENT : ANDROID_SHOW_EVENT;
  const hideEvent = Platform.OS === "ios" ? IOS_HIDE_EVENT : ANDROID_HIDE_EVENT;

  const setCombinedRef = (node) => {
    scrollRef.current = node;

    if (typeof innerRef === "function") {
      innerRef(node);
    } else if (innerRef && typeof innerRef === "object") {
      innerRef.current = node;
    }

    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef && typeof forwardedRef === "object") {
      forwardedRef.current = node;
    }
  };

  useEffect(() => {
    const onShow = (event) => {
      const height = event?.endCoordinates?.height || 0;
      setKeyboardSpace(height + extraScrollHeight);

      if (!enableAutomaticScroll) return;

      const focusedInput = TextInput.State?.currentlyFocusedInput?.();
      const focusedHandle = focusedInput ? findNodeHandle(focusedInput) : null;

      if (focusedHandle && scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
            focusedHandle,
            extraScrollHeight,
            true
          );
        });
      }
    };

    const onHide = () => {
      setKeyboardSpace(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [extraScrollHeight, enableAutomaticScroll, hideEvent, showEvent]);

  const mergedContentContainerStyle = useMemo(() => {
    const bottomInsetStyle = keyboardSpace > 0 ? { paddingBottom: keyboardSpace } : null;
    return [contentContainerStyle, bottomInsetStyle];
  }, [contentContainerStyle, keyboardSpace]);

  return (
    <ScrollView
      ref={setCombinedRef}
      contentContainerStyle={mergedContentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  );
});

KeyboardAwareScrollView.displayName = "KeyboardAwareScrollView";

export { KeyboardAwareScrollView };
export default KeyboardAwareScrollView;
