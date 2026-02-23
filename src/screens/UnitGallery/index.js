import React from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import { Icons } from "../../constants/icons";
import useUnitGalleryViewModel from "../../viewmodels/useUnitGalleryViewModel";

const UnitGalleryScreen = ({ navigation, route }) => {
  const {
    module,
    unitLabel,
    projectName,
    locationLine,
    summary,
    photos,
    openAddPhoto,
    viewerVisible,
    viewerIndex,
    setViewerIndex,
    openViewer,
    closeViewer,
    handleBack,
  } = useUnitGalleryViewModel(navigation, route);

  const { width } = useWindowDimensions();

  const handleViewerScrollEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setViewerIndex(nextIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBack} />
        <Text style={styles.headerTitle}>Unit Gallery</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <LinearGradient
          colors={["#0F3F67", "#166E7D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroBadge}>{module} FIELD GALLERY</Text>
          <Text style={styles.heroUnit}>{unitLabel}</Text>
          <Text style={styles.heroProject}>{projectName}</Text>
          <Text style={styles.heroLocation}>
            {locationLine || "Location details unavailable"}
          </Text>
        </LinearGradient>

        {/* <View style={styles.summaryRow}>
          {summary.map((item) => (
            <View key={item.key} style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View> */}

        <View style={styles.galleryHeadRow}>
          <Text style={styles.galleryHeading}>Photos</Text>
          {/* <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={openAddPhoto}
            activeOpacity={0.9}
          >
            <Text style={styles.addPhotoButtonText}>+ Add Photo</Text>
          </TouchableOpacity> */}
        </View>

        {photos.length ? (
          <View style={styles.photoGrid}>
            {photos.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.photoCard}
                activeOpacity={0.9}
                onPress={() => openViewer(index)}
              >
                <Image source={{ uri: item.uri }} style={styles.photoThumb} />
                <Text style={styles.photoTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.photoMeta} numberOfLines={1}>
                  {item.meta}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyPreviewBox}>
              <Icons.gallery width={22} height={22} />
              <Text style={styles.emptyText}>No photos yet</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={viewerVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={closeViewer}
      >
        <SafeAreaView style={styles.viewerContainer}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerCounter}>
              {photos.length ? `${viewerIndex + 1} / ${photos.length}` : "0 / 0"}
            </Text>
            <IconButton icon="close" iconColor="#FFFFFF" onPress={closeViewer} />
          </View>

          {photos.length ? (
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              initialScrollIndex={viewerIndex}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={handleViewerScrollEnd}
              renderItem={({ item }) => (
                <View style={[styles.viewerSlide, { width }]}> 
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.viewerImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.viewerCaption}>{item.meta}</Text>
                </View>
              )}
              showsHorizontalScrollIndicator={false}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default UnitGalleryScreen;
