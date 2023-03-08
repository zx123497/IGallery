import instance from "./config";

const DataService = {
  getDataAsync: async () => {
    try {
      const response = await instance.get("/Instagram/IgData");
      return response.data;
    } catch (error) {
      throw error;
    }
  }};

export default DataService;
