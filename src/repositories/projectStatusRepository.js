export const getProjectStatusDataSet = () => ({
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
      partial: 841,
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
    { label: "Outlet Pipe Laying", completed: 100, pending: 200, partial: 99 },
    { label: "Mechanical Installation", completed: 79, pending: 300, partial: 20 },
    { label: "Controller Installation", completed: 79, pending: 300, partial: 20 },
    { label: "Dry Commissioning", completed: 19, pending: 350, partial: 30 },
    { label: "Wet Commissioning", completed: 19, pending: 350, partial: 30 },
  ],
  GW: [],
});
