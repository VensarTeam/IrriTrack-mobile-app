import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { LEGAL_DOCUMENTS } from "../constants/legalDocuments";
import LegalDocumentViewer from "./LegalDocumentViewer";

const LegalLinks = () => {
  const [document, setDocument] = useState(null);
  return (
    <>
      <View style={styles.row}>
        {Object.values(LEGAL_DOCUMENTS).map((item) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Read ${item.title}`}
            onPress={() => setDocument(item)} style={styles.link}>
            <Text style={styles.text}>{item.title}</Text>
          </Pressable>
        ))}
      </View>
      <LegalDocumentViewer document={document} onClose={() => setDocument(null)} onOpenDocument={setDocument} />
    </>
  );
};

export default LegalLinks;

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 10 },
  link: { paddingHorizontal: 9, minHeight: 44, justifyContent: "center" },
  text: { color: colors.primaryBlue, fontFamily: fonts.semiBold, fontSize: 11, textDecorationLine: "underline" },
});
