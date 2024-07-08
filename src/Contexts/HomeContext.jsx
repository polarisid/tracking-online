import { createContext, useState } from "react";

export const HomeContext = createContext(null);

export function HomeProvider({ children }) {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [visibleComponents, setVisibleComponents] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
    12: false,
    13: false,
    14: false,
  });

  //   function signIn(token) {
  //     setToken(token);
  //     localStorage.setItem(LOCAL_STORAGE_KEY, token);
  //   }

  //   function signOut() {
  //     setToken(null);
  //     localStorage.removeItem(LOCAL_STORAGE_KEY);
  //   }

  return (
    <HomeContext.Provider
      value={{
        data1,
        setData1,
        data2,
        setData2,
        setFile1,
        setFile2,
        file1,
        file2,
        combinedData,
        setCombinedData,
        visibleComponents,
        setVisibleComponents,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}
