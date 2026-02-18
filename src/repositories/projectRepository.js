import { createProject } from "../models/project";

const projects = [
  createProject({
    id: 1,
    client: "Government of Madhya Pradesh",
    name: "Kayampur Sitamau P.M.I.P",
    area: "112124 Ha",
  }),
];

export const getProjects = () => projects;
