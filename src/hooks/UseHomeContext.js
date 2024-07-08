import { useContext } from "react";
import { HomeContext } from "../Contexts/HomeContext";

export default function useHomeContext() {
  const homeContext = useContext(HomeContext);
  if (!homeContext) {
    throw new Error("useAuth must be used inside a AuthContext Provider");
  }

  return homeContext;
}
