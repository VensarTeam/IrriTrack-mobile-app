import { createUser } from "../models/user";

const currentUser = createUser({
  name: "Ritesh Mehra",
  mobile: "9876543210",
  email: "ritesh.m@vensar.com",
  designation: "Site Engineer",
});

export const getCurrentUser = () => currentUser;
