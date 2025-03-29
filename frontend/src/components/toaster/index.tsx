import { Toaster } from "sonner";
import { useTheme } from "../theme/provider";

const ToasterComponent = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={
        theme !== "system"
          ? theme
          : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
      }
      richColors
    />
  );
};

export default ToasterComponent;
