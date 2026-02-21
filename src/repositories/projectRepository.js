import { createProject } from "../models/project";

const projects = [
  createProject({
    id: 1,
    client: "Government of Madhya Pradesh",
    name: "Kayampur Sitamau P.M.L.M.I.P",
    area: "1,12,124.00 Ha",
  }),
];

export const getProjects = () => projects;
