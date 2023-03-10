import instance from "./config";

const DataService = {
  getDataAsync: async (token) => {
    try {
      const config = {headers: {"Authorization": token}};
      const response = await instance.get("/Instagram/IgData", config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }};

export default DataService;
