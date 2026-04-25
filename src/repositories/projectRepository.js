import { createProject } from "../models/project";

const projects = [
  createProject({
    id: 1,
    client: "Government of Madhya Pradesh",
    name: "IrriTrack",
    area: "1,12,124.00 Ha",
  }),
];

export const getProjects = () => projects;
