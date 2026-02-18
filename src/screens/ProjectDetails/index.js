import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import styles from "./styles";
import colors from "../../constants/colors";
import { Icons } from "../../constants/icons";
import useProjectDetailsViewModel from "../../viewmodels/useProjectDetailsViewModel";

const ProjectDetailsScreen = () => {
  const navigation = useNavigation();
  const {
    dataSet,
    expanded,
    chartType,
    selectedStage,
    chartAnimatedStyle,
    toggleSection,
    setChartType,
    setSelectedStage,
    buildBarChartData,
    buildPieChartData,
    getStagePercent,
    kpiCards,
    handleBack,
    openModuleList,
  } = useProjectDetailsViewModel(navigation);

  const renderBarChart = (stages) => {
    const barData = buildBarChartData(stages);

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={barData}
          isAnimated
          animationDuration={700}
          disablePress={true}
          barWidth={18}
          roundedTop
          hideRules={false}
          showYAxisIndices
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          rulesColor={colors.border}
          yAxisTextStyle={{ color: colors.textSecondary }}
          xAxisLabelTextStyle={{
            color: colors.textSecondary,
            fontSize: 10,
            width: 40,
          }}
          xAxisLabelWidth={80}
        />
      </ScrollView>
    );
  };

  const renderPieChart = (stages) => {
    const { data, percent } = buildPieChartData(stages);

    return (
      <View style={styles.pieWrapper}>
        <PieChart
          donut
          radius={100}
          innerRadius={60}
          data={data}
          isAnimated
          animationDuration={700}
        />

        <View style={styles.pieCenter}>
          <Text style={styles.piePercent}>{percent}%</Text>
          <Text style={styles.pieLabel}>Completed</Text>
        </View>
      </View>
    );
  };

  const StatusItem = ({ label, value, color }) => (
    <View style={styles.statusItem}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={handleBack} />
          <View>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Kayampur Sitamau P.M.I.P</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.kpiContainer}>
            {kpiCards.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: item.bg,
                    borderLeftWidth: 5,
                    borderLeftColor: item.accent,
                  },
                ]}
                onPress={() => openModuleList("OMS")}
                activeOpacity={0.85}
              >
                <View style={styles.kpiContent}>
                  <Text style={styles.kpiTitle}>{item.key}</Text>
                  <Text style={[styles.kpiValue, { color: item.accent }]}>
                    {item.value}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {Object.keys(dataSet).map((key) => {
            const stages = dataSet[key];
            if (!stages.length) return null;

            return (
              <View key={key} style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(key)}
                >
                  <Text style={styles.sectionTitle}>{key} Status</Text>
                  <Text style={styles.sectionIcon}>
                    {expanded === key ? (
                      <Icons.up width={14} height={14} />
                    ) : (
                      <Icons.down width={14} height={14} />
                    )}
                  </Text>
                </TouchableOpacity>

                {expanded === key && (
                  <>
                    <View style={styles.switchContainer}>
                      <ToggleButton
                        label="Bar"
                        active={chartType === "bar"}
                        onPress={() => setChartType("bar")}
                      />
                      <ToggleButton
                        label="Pie"
                        active={chartType === "pie"}
                        onPress={() => setChartType("pie")}
                      />
                    </View>

                    {chartType === "pie" && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.stageTabContainer}
                      >
                        {["All", ...stages.map((s) => s.label)].map((item) => (
                          <TouchableOpacity
                            key={item}
                            onPress={() => setSelectedStage(item)}
                            style={[
                              styles.stageTab,
                              selectedStage === item && styles.stageTabActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.stageTabText,
                                selectedStage === item &&
                                  styles.stageTabTextActive,
                              ]}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    <View style={styles.chartCard}>
                      <Animated.View style={chartAnimatedStyle}>
                        {chartType === "bar"
                          ? renderBarChart(stages)
                          : renderPieChart(stages)}
                      </Animated.View>

                      <View style={styles.legendRow}>
                        <Legend color={colors.completed} label="Completed" />
                        <Legend color={colors.pending} label="Pending" />
                        <Legend color={colors.partial} label="Partial" />
                      </View>

                      <View style={styles.stageList}>
                        {stages.map((stage) => {
                          const percent = getStagePercent(stage);

                          return (
                            <View key={stage.label} style={styles.stageCard}>
                              <Text style={styles.stageTitle}>{stage.label}</Text>

                              <View style={styles.stageRow}>
                                <StatusItem
                                  label="Completed"
                                  value={stage.completed}
                                  color={colors.completed}
                                />
                                <StatusItem
                                  label="Pending"
                                  value={stage.pending}
                                  color={colors.pending}
                                />
                                <StatusItem
                                  label="Partial"
                                  value={stage.partial}
                                  color={colors.partial}
                                />
                              </View>

                              <View style={styles.progressBackground}>
                                <View
                                  style={[
                                    styles.progressFill,
                                    {
                                      width: `${percent}%`,
                                      backgroundColor: colors.completed,
                                    },
                                  ]}
                                />
                              </View>

                              <Text style={styles.percentText}>
                                {percent}% Completed
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ProjectDetailsScreen;

const ToggleButton = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.toggleButton, active && styles.toggleActive]}
  >
    <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Legend = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);
