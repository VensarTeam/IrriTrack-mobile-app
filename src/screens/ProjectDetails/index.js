import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import styles from "./styles";
import colors from "../../constants/colors";
import { ROUTES } from "../../navigation/routes";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const ProjectDetailsScreen = () => {
  const navigation = useNavigation();

  const [expanded, setExpanded] = useState(null);
  const [chartType, setChartType] = useState("bar");
  const [selectedStage, setSelectedStage] = useState("All");

  const dataSet = {
    OMS: [
      {
        label: "Inlet Pipe Laying",
        completed: 3700,
        pending: 40,
        partial: 102,
      },
      {
        label: "Outlet Pipe Laying",
        completed: 2000,
        pending: 1000,
        partial: 842,
      },
      {
        label: "Mechanical Installation",
        completed: 1000,
        pending: 842,
        partial: 2000,
      },
      {
        label: "Controller Installation",
        completed: 1000,
        pending: 842,
        partial: 2000,
      },
      {
        label: "Dry Commissioning",
        completed: 842,
        pending: 1000,
        partial: 2000,
      },
      {
        label: "Wet Commissioning",
        completed: 842,
        pending: 1000,
        partial: 2000,
      },
    ],
    RMS: [
      { label: "Inlet Pipe Laying", completed: 200, pending: 100, partial: 99 },
      {
        label: "Outlet Pipe Laying",
        completed: 100,
        pending: 200,
        partial: 99,
      },
      {
        label: "Mechanical Installation",
        completed: 79,
        pending: 300,
        partial: 20,
      },
      {
        label: "Controller Installation",
        completed: 79,
        pending: 300,
        partial: 20,
      },
      { label: "Dry Commissioning", completed: 19, pending: 350, partial: 30 },
      { label: "Wet Commissioning", completed: 19, pending: 350, partial: 30 },
    ],
    GW: [],
  };

  const toggleSection = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === key ? null : key);
  };

  const getShortLabel = (label) => {
    if (label.includes("Inlet")) return "Inlet";
    if (label.includes("Outlet")) return "Outlet";
    if (label.includes("Mechanical")) return "Mechanical";
    if (label.includes("Controller")) return "Controller";
    if (label.includes("Dry")) return "Dry";
    if (label.includes("Wet")) return "Wet";

    return label.length > 8 ? label.substring(0, 6) + "..." : label;
  };

  const renderBarChart = (stages) => {
    const barData = [];

    stages.forEach((stage) => {
      // First bar (Completed)
      barData.push({
        value: stage.completed,
        frontColor: colors.completed,
        spacing: 4,
      });

      // Second bar (Pending) — THIS GETS LABEL
      barData.push({
        value: stage.pending,
        frontColor: colors.pending,
        label: stage.label.split(" ")[0], // short label
        spacing: 4,
      });

      // Third bar (Partial)
      barData.push({
        value: stage.partial,
        frontColor: colors.partial,
        spacing: 25, // gap before next stage group
      });
    });

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={barData}
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
            width: 40
          }}
          xAxisLabelWidth={80} // IMPORTANT
        />
      </ScrollView>
    );
  };

  const renderPieChart = (stages) => {
    let data;

    if (selectedStage === "All") {
      const totalCompleted = stages.reduce((s, i) => s + i.completed, 0);
      const totalPending = stages.reduce((s, i) => s + i.pending, 0);
      const totalPartial = stages.reduce((s, i) => s + i.partial, 0);

      data = [
        { value: totalCompleted, color: colors.completed },
        { value: totalPending, color: colors.pending },
        { value: totalPartial, color: colors.partial },
      ];
    } else {
      const stage = stages.find((s) => s.label === selectedStage);

      data = [
        { value: stage.completed, color: colors.completed },
        { value: stage.pending, color: colors.pending },
        { value: stage.partial, color: colors.partial },
      ];
    }

    const total = data.reduce((s, i) => s + i.value, 0);
    const percent = total ? Math.round((data[0].value / total) * 100) : 0;

    return (
      <View style={styles.pieWrapper}>
        <PieChart donut radius={100} innerRadius={60} data={data} />

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

  const getKpiStyle = (type) => {
    if (type === "OMS") {
      return {
        bg: "#E3F2FD",
        accent: colors.primaryBlue,
        value: 3842,
      };
    }

    if (type === "RMS") {
      return {
        bg: "#E8F5E9",
        accent: colors.primaryGreen,
        value: 399,
      };
    }

    return {
      bg: "#FFF8E1",
      accent: "#FB8C00",
      value: 45,
    };
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
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
          {/* KPI NAVIGATION CARDS */}
          <View style={styles.kpiContainer}>
            {["OMS", "RMS", "GW"].map((item) => {
              const config = getKpiStyle(item);

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.kpiCard,
                    {
                      backgroundColor: config.bg,
                      borderLeftWidth: 5,
                      borderLeftColor: config.accent,
                    },
                  ]}
                  onPress={() => navigation.navigate(ROUTES.ROOT.UNIT_LIST_SCREEN, { module: "OMS" })}
                  activeOpacity={0.85}
                >
                  <View style={styles.kpiContent}>
                    <Text style={styles.kpiTitle}>{item}</Text>
                    <Text style={[styles.kpiValue, { color: config.accent }]}>
                      {config.value}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* EXPANDABLE SECTIONS */}
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
                    {expanded === key ? "−" : "+"}
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
                      {chartType === "bar"
                        ? renderBarChart(stages)
                        : renderPieChart(stages)}

                      {/* LEGEND */}
                      <View style={styles.legendRow}>
                        <Legend color={colors.completed} label="Completed" />
                        <Legend color={colors.pending} label="Pending" />
                        <Legend color={colors.partial} label="Partial" />
                      </View>

                      {/* STAGE BREAKDOWN */}
                      <View style={styles.stageList}>
                        {stages.map((stage) => {
                          const total =
                            stage.completed + stage.pending + stage.partial;

                          const percent = total
                            ? Math.round((stage.completed / total) * 100)
                            : 0;

                          return (
                            <View key={stage.label} style={styles.stageCard}>
                              <Text style={styles.stageTitle}>
                                {stage.label}
                              </Text>

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

/* COMPONENTS */

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
