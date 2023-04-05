import instance from "./config";

// data related services
const DataService = {
  /**
   *
   * @param {string} token
   * @return {JSON} posts data
   */
  getDataAsync: async () => {
    try {
      const response = await instance.get("/Instagram/GetAllIgDataFromTokenList");
      return response.data;
    } catch (error) {
      throw error;
    }
  }};

export default DataService;
