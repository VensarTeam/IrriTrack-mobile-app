import { createUser } from "../models/user";

const currentUser = createUser({
  name: "Ritesh Mehra",
  mobile: "9876543210",
  email: "ritesh.mehra@wms.in",
  designation: "Site Engineer",
});

export const getCurrentUser = () => currentUser;
