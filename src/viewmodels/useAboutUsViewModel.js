import { getAboutSections } from "../repositories/companyRepository";

const useAboutUsViewModel = () => {
  const sections = getAboutSections();

  return { sections };
};

export default useAboutUsViewModel;
