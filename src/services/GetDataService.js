import instance from "./config";

// data related services
const DataService = {
  /**
   *
   * @param {string} token
   * @return {JSON} posts data
   */
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
